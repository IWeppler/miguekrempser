"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import {
  adjustmentSchema,
  type AdjustmentSchema,
} from "@/features/moves/schemas/adjustment-schema";

export async function createAdjustment(data: AdjustmentSchema) {
  const supabase = await createClient();

  // 1. OBTENER USUARIO ACTUAL (Para auditoría)
  const {
    data: { user },
  } = await supabase.auth.getUser();
  // Intentamos obtener el nombre, si no tiene, usamos el email, si no, un fallback.
  const technicianName =
    user?.user_metadata?.full_name || user?.email || "Usuario Desconocido";

  // 2. Validar
  const result = adjustmentSchema.safeParse(data);
  if (!result.success) return { error: "Datos inválidos" };

  const { productId, type, quantity, reason } = result.data;

  // 3. Insertar el Movimiento (Historial)
  const { error: moveError } = await supabase.from("movements").insert({
    type: type,
    product_id: productId,
    quantity: quantity,
    description: `Ajuste Manual: ${reason}`,
    technician_name: technicianName,
    created_at: new Date().toISOString(),
  });

  if (moveError) {
    console.error(moveError);
    return { error: "Error al registrar el movimiento" };
  }

  // 4. Actualizar el Stock del Producto
  const { data: product } = await supabase
    .from("products")
    .select("current_stock")
    .eq("id", productId)
    .single();

  if (product) {
    const current = Number(product.current_stock || 0);
    const newStock = type === "IN" ? current + quantity : current - quantity;

    if (newStock < 0) {
      return { error: "Error: El ajuste dejaría el stock en negativo." };
    }

    await supabase
      .from("products")
      .update({ current_stock: newStock })
      .eq("id", productId);
  }

  // 5. Actualizar Vistas
  revalidatePath("/movimientos");
  revalidatePath("/stock");
  revalidatePath("/");

  return { success: true };
}
