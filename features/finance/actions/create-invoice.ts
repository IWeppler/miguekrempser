"use server";

import { createClient } from "@/lib/supabase/server";
import { InvoiceSchema } from "../schemas/invoice-schema";
import { revalidatePath } from "next/cache";

type CreateInvoiceData = InvoiceSchema & { fileUrl?: string | null };

export async function createInvoice(data: CreateInvoiceData) {
  const supabase = await createClient();

  try {
    // 1. Validar o Crear Proveedor
    let supplierId = data.supplierId;

    if (!supplierId && data.newSupplierName) {
      const { data: newSupplier, error: supplierError } = await supabase
        .from("suppliers")
        .insert({ name: data.newSupplierName })
        .select()
        .single();

      if (supplierError) throw new Error("Error al crear proveedor");
      supplierId = newSupplier.id;
    }

    if (!supplierId) throw new Error("Falta el proveedor");

    // 2. Calcular monto total (para guardar en la factura)
    const totalAmount = data.items.reduce(
      (acc, item) => acc + item.quantity * item.unitPrice,
      0,
    );

    // 3. Crear la Factura
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .insert({
        invoice_number: data.invoiceNumber,
        supplier_id: supplierId,
        created_at: new Date().toISOString(),
        due_date: data.dueDate.toISOString(),
        currency: data.currency,
        exchange_rate: data.exchangeRate,
        amount_total: totalAmount,
        status: "pending",
        description: data.description,
        file_url: data.fileUrl,
      })
      .select()
      .single();

    if (invoiceError)
      throw new Error("Error al crear la factura: " + invoiceError.message);

    // 4. Procesar Ítems: Insertar detalle Y Actualizar Stock/Costo (PPP)
    for (const item of data.items) {
      // A. Guardar ítem de factura
      const { error: itemError } = await supabase.from("invoice_items").insert({
        invoice_id: invoice.id,
        product_id: item.productId,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unitPrice,
      });

      if (itemError) throw new Error("Error al guardar ítem de factura");

      // B. ACTUALIZAR STOCK Y COSTO (Solo si está vinculado a un producto)
      if (item.productId) {
        const { data: product } = await supabase
          .from("products")
          .select("current_stock, average_cost")
          .eq("id", item.productId)
          .single();

        if (product) {
          const currentStock = Number(product.current_stock || 0);
          const currentCostUSD = Number(product.average_cost || 0);

          // CÁLCULO DE COSTO DE ESTA COMPRA EN USD
          const incomingCostUSD =
            data.currency === "ARS"
              ? item.unitPrice / data.exchangeRate
              : item.unitPrice;

          const incomingQty = item.quantity;

          // CÁLCULO PPP (Precio Promedio Ponderado)
          const totalValueOld = currentStock * currentCostUSD;
          const totalValueNew = incomingQty * incomingCostUSD;
          const newTotalStock = currentStock + incomingQty;

          // Evitar división por cero
          const newAverageCost =
            newTotalStock > 0
              ? (totalValueOld + totalValueNew) / newTotalStock
              : incomingCostUSD;

          // Actualizar producto en DB
          await supabase
            .from("products")
            .update({
              current_stock: newTotalStock,
              average_cost: newAverageCost,
              currency: "USD",
            })
            .eq("id", item.productId);

          await supabase.from("movements").insert({
            type: "IN",
            product_id: item.productId,
            quantity: incomingQty,
            description: `Compra Factura ${data.invoiceNumber}`,
            date: new Date().toISOString(),
          });
        }
      }
    }

    revalidatePath("/finanzas");
    revalidatePath("/stock");
    return { success: true, invoice };
  } catch (error: unknown) {
    console.error("Error creating invoice:", error);
    let msg = "Error desconocido";
    if (error instanceof Error) msg = error.message;
    return { error: msg };
  }
}
