"use server";

import { createClient } from "@/lib/supabase/server";
import { InvoiceSchema } from "../schemas/invoice-schema";
import { revalidatePath } from "next/cache";

// 1. Recibimos affectStock desde el formulario (solo para NC)
type CreateInvoiceData = InvoiceSchema & {
  fileUrl?: string | null;
  affectStock?: boolean;
};

export async function createInvoice(data: CreateInvoiceData) {
  const supabase = await createClient();

  // 1. OBTENER USUARIO ACTUAL
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const technicianName =
    user?.user_metadata?.full_name || user?.email || "Usuario Desconocido";

  try {
    // 2. GESTIÓN DE PROVEEDOR
    let supplierId = data.supplierId;

    if (!supplierId && data.newSupplierName) {
      const { data: newSupplier, error: supplierError } = await supabase
        .from("suppliers")
        .insert({ name: data.newSupplierName })
        .select()
        .single();

      if (supplierError)
        throw new Error("Error al crear proveedor: " + supplierError.message);
      supplierId = newSupplier.id;
    }

    if (!supplierId) throw new Error("Debe seleccionar o crear un proveedor");

    // 3. CALCULAR TOTALES (Lógica FC/ND vs NC)
    const rawTotalAmount = data.items.reduce(
      (acc, item) => acc + item.quantity * item.unitPrice,
      0,
    );

    // Si es Nota de Crédito, el monto  es NEGATIVO.
    // Si es Factura o Nota de Débito, es POSITIVO.
    const finalAmount =
      data.voucherType === "NC"
        ? -Math.abs(rawTotalAmount)
        : Math.abs(rawTotalAmount);

    // 4. CREAR LA FACTURA (COMPROBANTE)
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .insert({
        invoice_number: data.invoiceNumber,
        supplier_id: supplierId,
        purchaser_company: data.purchaserCompany,
        voucher_type: data.voucherType,
        date: data.issueDate
          ? data.issueDate.toISOString()
          : new Date().toISOString(),
        due_date: data.dueDate.toISOString(),
        currency: data.currency,
        exchange_rate: data.exchangeRate,
        amount_total: finalAmount,
        status: "pending",
        description: data.description,
        file_url: data.fileUrl,
      })
      .select()
      .single();

    if (invoiceError)
      throw new Error("Error al crear comprobante: " + invoiceError.message);

    // 5. PROCESAR ÍTEMS
    for (const item of data.items) {
      const { error: itemError } = await supabase.from("invoice_items").insert({
        invoice_id: invoice.id,
        product_id: item.productId,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unitPrice,
      });

      if (itemError)
        throw new Error("Error guardando ítem: " + itemError.message);

      if (data.voucherType === "FC") {
        // --- Recálculo de Costo Promedio (PPP) ---
        const { data: product } = await supabase
          .from("products")
          .select("current_stock, average_cost, currency")
          .eq("id", item.productId)
          .single();

        if (product) {
          const currentStock = Number(product.current_stock || 0);
          const oldCost = Number(product.average_cost || 0);
          const newQty = Number(item.quantity);
          let newUnitPrice = Number(item.unitPrice);

          // Conversión moneda
          if (data.currency === "ARS" && product.currency === "USD") {
            newUnitPrice = newUnitPrice / (data.exchangeRate || 1);
          } else if (data.currency === "USD" && product.currency === "ARS") {
            newUnitPrice = newUnitPrice * (data.exchangeRate || 1);
          }

          const totalStock = currentStock + newQty;
          let newAverageCost = oldCost;

          if (totalStock > 0) {
            newAverageCost =
              (currentStock * oldCost + newQty * newUnitPrice) / totalStock;
          }

          // Actualizamos precio
          await supabase
            .from("products")
            .update({ average_cost: newAverageCost })
            .eq("id", item.productId);
        }

        // --- Crear Movimiento (IN) ---
        const { error: moveError } = await supabase.from("movements").insert({
          type: "IN",
          created_at: new Date().toISOString(),
          product_id: item.productId,
          quantity: item.quantity,
          description: `Factura ${invoice.invoice_number} - ${item.description}`,
          technician_name: technicianName,
          invoice_id: invoice.id,
        });

        if (moveError)
          throw new Error(
            `Error al registrar ingreso de stock: ${moveError.message}`,
          );
      }

      // CASO 2: Es una Nota de Crédito y EL USUARIO MARCÓ QUE AFECTA STOCK (Devolución)
      else if (data.voucherType === "NC" && data.affectStock) {
        const { error: moveError } = await supabase.from("movements").insert({
          type: "OUT",
          created_at: new Date().toISOString(),
          product_id: item.productId,
          quantity: item.quantity,
          description: `Devolución s/NC ${invoice.invoice_number} - ${item.description}`,
          technician_name: technicianName,
          invoice_id: invoice.id,
        });

        if (moveError)
          throw new Error(
            `Error al registrar devolución de stock: ${moveError.message}`,
          );
      }
    }

    revalidatePath("/finanzas");
    revalidatePath("/stock");
    revalidatePath("/movimientos");

    return { success: true, invoice };
  } catch (error: unknown) {
    console.error("Error creating invoice:", error);
    let msg = "Error desconocido";
    if (error instanceof Error) msg = error.message;
    return { error: msg };
  }
}
