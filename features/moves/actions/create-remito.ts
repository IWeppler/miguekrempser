"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { remitoSchema, type RemitoSchema } from "../schemas/remito-schema";

export async function createRemito(data: RemitoSchema) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Usuario no autenticado" };

  const technicianName =
    user.user_metadata?.full_name || user.email || "Usuario Desconocido";

  const result = remitoSchema.safeParse(data);
  if (!result.success) {
    return { error: "Datos inválidos" };
  }

  const {
    orderNumber,
    destination,
    driver,
    plate,
    items,
    observations,
    issuerCompanyId,
  } = result.data;

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
        issuer_company_id: issuerCompanyId,
        date: new Date().toISOString(),
      })
      .select()
      .single();

    if (remitoError) throw new Error("Error DB Remito: " + remitoError.message);

    // 5. PROCESAR ITEMS Y MOVIMIENTOS
    const itemsPromises = items.map(async (item) => {
      await supabase.from("remito_items").insert({
        remito_id: remito.id,
        product_id: item.productId,
        quantity: item.quantity,
        product_name: item.notes || "Producto",
      });

      const { error: moveError } = await supabase.from("movements").insert({
        type: "OUT",
        created_at: new Date().toISOString(),
        product_id: item.productId,
        quantity: item.quantity,
        description: `Remito #${orderNumber} - Emite: ${issuerCompanyId} - Destino: ${destination}`,
        technician_name: technicianName,
        remito_id: remito.id,
        user_email: user.email,
      });

      if (moveError)
        throw new Error("Error creando movimiento: " + moveError.message);
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
