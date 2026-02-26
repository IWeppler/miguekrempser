"use server";

import { createClient } from "@/lib/supabase/server";
import { invoiceSchema, InvoiceSchema } from "../schemas/invoice-schema";
import { revalidatePath } from "next/cache";

// Extendemos el tipo para incluir los campos extras del front
type UpdateInvoiceData = InvoiceSchema & {
  fileUrl?: string | null;
  affectStock?: boolean;
};

export async function updateInvoice(id: string, data: UpdateInvoiceData) {
  const supabase = await createClient();
  const validation = invoiceSchema.safeParse(data);

  if (!validation.success) {
    return { success: false, error: validation.error.message };
  }

  // 1. OBTENER USUARIO ACTUAL (para los movimientos)
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const technicianName =
    user?.user_metadata?.full_name || user?.email || "Usuario Desconocido";

  const {
    supplierId,
    newSupplierName,
    purchaserCompany,
    voucherType,
    invoiceNumber,
    issueDate,
    dueDate,
    currency,
    exchangeRate,
    items,
    description,
  } = validation.data;

  try {
    // 2. GESTIÓN DE PROVEEDOR
    let finalSupplierId = supplierId;
    if (!finalSupplierId && newSupplierName) {
      const { data: newSupplier, error: supplierError } = await supabase
        .from("suppliers")
        .insert([{ name: newSupplierName }])
        .select()
        .single();
      if (supplierError) throw new Error("Error al crear proveedor");
      finalSupplierId = newSupplier.id;
    }

    if (!finalSupplierId) throw new Error("Proveedor no válido");

    // 3. CALCULAR MONTO TOTAL (Con signo según comprobante)
    const rawTotalAmount = items.reduce(
      (acc, item) => acc + item.quantity * item.unitPrice,
      0,
    );
    const finalAmount =
      voucherType === "NC"
        ? -Math.abs(rawTotalAmount)
        : Math.abs(rawTotalAmount);

    // 4. ACTUALIZAR CABECERA DEL COMPROBANTE
    const { error: invoiceError } = await supabase
      .from("invoices")
      .update({
        supplier_id: finalSupplierId,
        purchaser_company: purchaserCompany,
        voucher_type: voucherType,
        invoice_number: invoiceNumber,
        date: issueDate ? issueDate.toISOString() : new Date().toISOString(),
        due_date: dueDate.toISOString(),
        currency,
        exchange_rate: exchangeRate,
        description,
        amount_total: finalAmount,
        ...(data.fileUrl !== undefined && { file_url: data.fileUrl }),
      })
      .eq("id", id);

    if (invoiceError)
      throw new Error(
        "Error actualizando comprobante: " + invoiceError.message,
      );

    // 5. REVERSIÓN DEL STOCK; Buscamos qué movimientos generó esta factura originalmente
    const { data: oldMovements } = await supabase
      .from("movements")
      .select("*")
      .eq("invoice_id", id);

    if (oldMovements && oldMovements.length > 0) {
      for (const mov of oldMovements) {
        if (mov.product_id) {
          const { data: prod } = await supabase
            .from("products")
            .select("current_stock")
            .eq("id", mov.product_id)
            .single();

          if (prod) {
            // Operación inversa para limpiar el stock antes de meter lo nuevo
            // (Como el trigger es solo para INSERT, debemos revertir a mano aquí)
            let stockCorrection = 0;
            if (mov.type === "IN") stockCorrection = -Number(mov.quantity); // Si había entrado, lo sacamos
            if (mov.type === "OUT") stockCorrection = Number(mov.quantity); // Si había salido, lo devolvemos

            await supabase
              .from("products")
              .update({
                current_stock: Number(prod.current_stock) + stockCorrection,
              })
              .eq("id", mov.product_id);
          }
        }
      }
    }

    // 6. LIMPIEZA DE TABLAS VIEJAS
    await supabase.from("movements").delete().eq("invoice_id", id);
    await supabase.from("invoice_items").delete().eq("invoice_id", id);

    // 7. INSERCIÓN DE NUEVOS ÍTEMS Y MOVIMIENTOS
    for (const item of items) {
      // A. Guardar ítem de factura
      const { error: itemError } = await supabase.from("invoice_items").insert({
        invoice_id: id,
        product_id: item.productId || null,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unitPrice,
      });

      if (itemError)
        throw new Error("Error creando ítems: " + itemError.message);

      // Solo si tiene un producto válido operamos stock
      if (item.productId) {
        // CASO 1: Factura (IN + Recálculo de Costo)
        if (voucherType === "FC") {
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

            if (currency === "ARS" && product.currency === "USD") {
              newUnitPrice = newUnitPrice / (exchangeRate || 1);
            } else if (currency === "USD" && product.currency === "ARS") {
              newUnitPrice = newUnitPrice * (exchangeRate || 1);
            }

            const totalStock = currentStock + newQty;
            let newAverageCost = oldCost;
            if (totalStock > 0) {
              newAverageCost =
                (currentStock * oldCost + newQty * newUnitPrice) / totalStock;
            }

            // Actualiza costo promedio (NO el current_stock, de eso se encarga el trigger)
            await supabase
              .from("products")
              .update({ average_cost: newAverageCost })
              .eq("id", item.productId);
          }

          // Generar movimiento (El trigger sumará el stock)
          const { error: moveError } = await supabase.from("movements").insert({
            type: "IN",
            created_at: new Date().toISOString(),
            product_id: item.productId,
            quantity: item.quantity,
            description: `Factura (Editada) ${invoiceNumber} - ${item.description}`,
            technician_name: technicianName,
            invoice_id: id,
          });

          if (moveError)
            throw new Error("Error crítico en stock: " + moveError.message);
        }

        // CASO 2: Nota de Crédito con afectación de stock (OUT)
        else if (voucherType === "NC" && data.affectStock) {
          const { error: moveError } = await supabase.from("movements").insert({
            type: "OUT",
            created_at: new Date().toISOString(),
            product_id: item.productId,
            quantity: item.quantity,
            description: `Devolución s/NC (Editada) ${invoiceNumber} - ${item.description}`,
            technician_name: technicianName,
            invoice_id: id,
          });

          if (moveError)
            throw new Error(
              "Error crítico en stock (Devolución): " + moveError.message,
            );
        }
      }
    }

    revalidatePath("/finanzas");
    revalidatePath("/stock");
    revalidatePath("/movimientos");
    return { success: true };
  } catch (error: unknown) {
    console.error(error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}
