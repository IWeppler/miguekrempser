"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import {
  adjustmentSchema,
  type AdjustmentSchema,
} from "@/features/moves/schemas/adjustment-schema";

export async function createAdjustment(data: AdjustmentSchema) {
  const supabase = await createClient();

  // 1. Validar
  const result = adjustmentSchema.safeParse(data);
  if (!result.success) return { error: "Datos inválidos" };

  const { productId, type, quantity, reason } = result.data;

  // 2. Insertar el Movimiento (Historial)
  const { error: moveError } = await supabase.from("movements").insert({
    type: type, // 'IN' o 'OUT'
    product_id: productId,
    quantity: quantity,
    description: `Ajuste Manual: ${reason}`, // Guardamos el motivo
    technician_name: "Admin / Sistema", // O el usuario logueado
    date: new Date().toISOString(),
  });

  if (moveError) {
    console.error(moveError);
    return { error: "Error al registrar el movimiento" };
  }

  // 3. Actualizar el Stock del Producto
  // Primero leemos el stock actual
  const { data: product } = await supabase
    .from("products")
    .select("current_stock")
    .eq("id", productId)
    .single();

  if (product) {
    const current = Number(product.current_stock || 0);
    // Si es IN suma, si es OUT resta
    const newStock = type === "IN" ? current + quantity : current - quantity;

    // Evitar stock negativo si es salida
    if (newStock < 0) {
      return { error: "Error: El ajuste dejaría el stock en negativo." };
    }

    await supabase
      .from("products")
      .update({ current_stock: newStock })
      .eq("id", productId);
  }

  // 4. Actualizar Vistas
  revalidatePath("/movimientos");
  revalidatePath("/stock");
  revalidatePath("/");

  return { success: true };
}
