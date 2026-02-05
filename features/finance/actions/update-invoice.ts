"use server";

import { createClient } from "@/lib/supabase/server";
import { invoiceSchema, InvoiceSchema } from "../schemas/invoice-schema";
import { revalidatePath } from "next/cache";

export async function updateInvoice(id: string, data: InvoiceSchema) {
  const supabase = await createClient();
  const validation = invoiceSchema.safeParse(data);

  if (!validation.success) {
    return { success: false, error: validation.error.message };
  }

  const {
    supplierId,
    newSupplierName,
    invoiceNumber,
    dueDate,
    currency,
    exchangeRate,
    items,
    description,
    // fileUrl handled separately or passed if changed
  } = validation.data;

  try {
    // 1. Handle Supplier (Same logic as create)
    let finalSupplierId = supplierId;
    if (!finalSupplierId && newSupplierName) {
      const { data: newSupplier, error: supplierError } = await supabase
        .from("suppliers")
        .insert([{ name: newSupplierName }])
        .select()
        .single();
      if (supplierError) throw new Error("Error creating supplier");
      finalSupplierId = newSupplier.id;
    }

    // 2. Update Invoice Header
    const { error: invoiceError } = await supabase
      .from("invoices")
      .update({
        supplier_id: finalSupplierId,
        invoice_number: invoiceNumber,
        due_date: dueDate.toISOString(),
        currency,
        exchange_rate: exchangeRate,
        description,
        amount_total: items.reduce(
          (acc, item) => acc + item.quantity * item.unitPrice,
          0,
        ),
      })
      .eq("id", id);

    if (invoiceError)
      throw new Error("Error updating invoice: " + invoiceError.message);

    // 3. Handle Items & Stock (The Tricky Part)
    // Strategy: Delete all existing items and movements for this invoice, then recreate them.
    // This ensures stock is recalculated correctly based on the new state.

    // A. Revert old stock (Fetch old items first)
    const { data: oldItems } = await supabase
      .from("invoice_items")
      .select("*")
      .eq("invoice_id", id);
    if (oldItems) {
      // Revert logic here if not handled by DB triggers on delete
      // Assuming we rely on the delete-movement logic or manual revert as in delete-invoice
      for (const item of oldItems) {
        if (item.product_id) {
          const { data: prod } = await supabase
            .from("products")
            .select("current_stock")
            .eq("id", item.product_id)
            .single();
          if (prod) {
            await supabase
              .from("products")
              .update({ current_stock: prod.current_stock - item.quantity })
              .eq("id", item.product_id);
          }
        }
      }
    }

    // B. Delete old items (Cascade should handle movements if configured, else delete movements too)
    await supabase.from("movements").delete().eq("invoice_id", id); // Delete linked movements
    await supabase.from("invoice_items").delete().eq("invoice_id", id); // Delete items

    // C. Insert New Items & Update Stock
    const invoiceItems = items.map((item) => ({
      invoice_id: id,
      product_id: item.productId || null,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      total_price: item.quantity * item.unitPrice,
    }));

    const { error: itemsError } = await supabase
      .from("invoice_items")
      .insert(invoiceItems);
    if (itemsError)
      throw new Error("Error creating items: " + itemsError.message);

    // D. Create New Movements (Stock In)
    for (const item of items) {
      if (item.productId) {
        // 1. Create Movement
        await supabase.from("movements").insert([
          {
            type: "IN",
            concept: "Compra / Factura (Editada)",
            quantity: item.quantity,
            product_id: item.productId,
            invoice_id: id,
            date: new Date().toISOString(), // Or keep original date?
          },
        ]);

        // 2. Update Product Stock (Add new quantity)
        const { data: product } = await supabase
          .from("products")
          .select("current_stock")
          .eq("id", item.productId)
          .single();

        if (product) {
          const newStock =
            Number(product.current_stock) + Number(item.quantity);
          await supabase
            .from("products")
            .update({ current_stock: newStock })
            .eq("id", item.productId);
        }
      }
    }

    revalidatePath("/finanzas");
    revalidatePath("/stock");
    return { success: true };
  } catch (error: unknown) {
    console.error(error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error unknown",
    };
  }
}
