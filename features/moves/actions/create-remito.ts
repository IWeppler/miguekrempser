"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { remitoSchema, type RemitoSchema } from "../schemas/remito-schema";

export async function createRemito(data: RemitoSchema) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const technicianName =
    user?.user_metadata?.full_name || user?.email || "Usuario Desconocido";

  const result = remitoSchema.safeParse(data);
  if (!result.success) {
    console.error("❌ Error de validación Zod", result.error);
    return { error: "Datos inválidos" };
  }

  const { orderNumber, destination, driver, plate, observations, items } =
    result.data;

  try {
    // 3. VERIFICACIÓN DE STOCK
    for (const item of items) {
      const { data: product } = await supabase
        .from("products")
        .select("name, current_stock")
        .eq("id", item.productId)
        .single();

      const current = Number(product?.current_stock || 0);

      if (!product)
        throw new Error(`Producto no encontrado ID: ${item.productId}`);

      if (current < item.quantity) {
        console.error("❌ Stock Insuficiente");
        throw new Error(
          `Stock insuficiente para ${product.name}. Tienes: ${current}, Solicitados: ${item.quantity}`,
        );
      }
    }

    // 4. CREAR REMITO
    const { data: remito, error: remitoError } = await supabase
      .from("remitos")
      .insert({
        order_number: orderNumber,
        technician: technicianName,
        destination: destination,
        driver: driver,
        plate: plate,
        status: "completed",
        observations: observations,
        date: new Date().toISOString(),
      })
      .select()
      .single();

    if (remitoError) throw new Error("Error DB Remito: " + remitoError.message);

    // 5. PROCESAR ITEMS
    const itemsPromises = items.map(async (item) => {
      // A. Item Detalle
      await supabase.from("remito_items").insert({
        remito_id: remito.id,
        product_id: item.productId,
        quantity: item.quantity,
        product_name: item.notes || "Producto",
      });

      // B. Movimiento
      await supabase.from("movements").insert({
        type: "OUT",
        created_at: new Date().toISOString(),
        product_id: item.productId,
        quantity: item.quantity,
        notes: `Remito #${orderNumber}`,
        technician_name: technicianName,
        remito_id: remito.id,
      });

      // C. RESTA DE STOCK (MANUAL - SIN RPC PARA DEBUGGEAR EL ERROR)
      const { data: prodToUpdate } = await supabase
        .from("products")
        .select("current_stock")
        .eq("id", item.productId)
        .single();

      const stockBeforeUpdate = Number(prodToUpdate?.current_stock || 0);
      const newStock = stockBeforeUpdate - item.quantity;

      const { error: updateError } = await supabase
        .from("products")
        .update({ current_stock: newStock })
        .eq("id", item.productId);

      if (updateError) console.error("❌ Error updating stock", updateError);
    });

    await Promise.all(itemsPromises);

    revalidatePath("/");
    revalidatePath("/movimientos");
    revalidatePath("/stock");

    return { success: true };
  } catch (error: unknown) {
    console.error("🔥 EXCEPCIÓN EN CREATE REMITO:", error);
    return {
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}
