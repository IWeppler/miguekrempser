"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { invoiceSchema, type InvoiceSchema } from "../schemas/invoice-schema";

export async function createInvoice(data: InvoiceSchema) {
  const supabase = await createClient();

  // 1. Validar
  const result = invoiceSchema.safeParse(data);
  if (!result.success) {
    return { error: "Datos inválidos: " + result.error.message };
  }

  // Obtener usuario actual
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const technicianName =
    user?.user_metadata?.full_name || user?.email || "Sistema";

  const { items, newSupplierName, ...invoiceHeader } = result.data;

  try {
    // 2. Manejo de Proveedor
    let supplierId = invoiceHeader.supplierId;

    if (!supplierId && newSupplierName) {
      const { data: newSup, error: supError } = await supabase
        .from("suppliers")
        .insert({ name: newSupplierName })
        .select("id")
        .single();

      if (supError)
        throw new Error("Error creando proveedor: " + supError.message);
      supplierId = newSup.id;
    }

    if (!supplierId) throw new Error("Debe seleccionar un proveedor válido.");

    // Calcular el monto total sumando los ítems (para validación)
    const calculatedTotal = items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0,
    );

    // 3. LLAMADA A LA NUEVA RPC V2
    const itemsJson = items.map((item) => ({
      product_id: item.productId || null,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unitPrice,
    }));

    const { error: rpcError } = await supabase.rpc(
      "create_invoice_transaction_v2",
      {
        p_supplier_id: supplierId,
        p_invoice_number: invoiceHeader.invoiceNumber,
        p_description: invoiceHeader.description || "",
        p_amount_total: calculatedTotal,
        p_exchange_rate: invoiceHeader.exchangeRate,
        p_currency: invoiceHeader.currency,
        p_due_date: invoiceHeader.dueDate.toISOString(),
        p_items: itemsJson,
        p_technician_name: technicianName,
      },
    );

    if (rpcError) throw new Error(rpcError.message);

    // 4. Revalidar
    revalidatePath("/finanzas");
    revalidatePath("/stock");
    revalidatePath("/movimientos");
    revalidatePath("/");

    return { success: true };
  } catch (error: unknown) {
    console.error("Error creating invoice v2:", error);
    let msg = "Error desconocido";
    if (error instanceof Error) msg = error.message;
    return { error: msg };
  }
}
