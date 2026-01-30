"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { laborSchema, LaborSchema } from "../schemas/labor-schema";

// Necesitamos recibir el ID del ciclo (Girasol 23-24) para vincular la labor
export async function createLabor(
  data: LaborSchema,
  cycleId: string,
  lotId: string,
) {
  const supabase = await createClient();

  // 1. Validar datos
  const result = laborSchema.safeParse(data);
  if (!result.success) return { error: "Datos inválidos" };

  const {
    date,
    category,
    description,
    contractor_name,
    service_cost_ha,
    items,
  } = result.data;

  try {
    // 2. Insertar CABECERA (La Labor)
    const { data: labor, error: laborError } = await supabase
      .from("labors")
      .insert({
        cycle_id: cycleId,
        date: date.toISOString(),
        category,
        description,
        contractor_name,
        service_cost_ha,
        status: "done",
      })
      .select()
      .single();

    if (laborError)
      throw new Error("Error al crear la labor: " + laborError.message);

    // 3. Insertar ITEMS (Los Insumos)
    if (items && items.length > 0) {
      const itemsToInsert = [];

      for (const item of items) {
        const { data: prod } = await supabase
          .from("products")
          .select("name")
          .eq("id", item.productId)
          .single();

        itemsToInsert.push({
          labor_id: labor.id,
          product_id: item.productId,
          product_name: prod?.name || "Producto desconocido",
          dose_per_ha: item.dose,
          price_unit: item.price,
        });
      }

      const { error: itemsError } = await supabase
        .from("labor_items")
        .insert(itemsToInsert);

      if (itemsError)
        throw new Error("Error al guardar los insumos: " + itemsError.message);
    }

    revalidatePath(`/lotes/${lotId}`);
    return { success: true };
  } catch (error: unknown) {
    console.error(error);
    return {
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

export async function getLaborsByCycle(cycleId: string) {
  const supabase = await createClient();
  // Traemos la labor Y sus items anidados
  const { data, error } = await supabase
    .from("labors")
    .select(
      `
      *,
      labor_items (
        id, product_name, dose_per_ha, price_unit, cost_per_ha
      )
    `,
    )
    .eq("cycle_id", cycleId)
    .order("date", { ascending: false });

  if (error) return [];
  return data;
}
