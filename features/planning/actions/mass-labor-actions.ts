"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { laborSchema, LaborSchema } from "../schemas/labor-schema";

export async function createMassLabor(data: LaborSchema, cycleIds: string[]) {
  const supabase = await createClient();

  // 1. Validar datos una sola vez
  const result = laborSchema.safeParse(data);
  if (!result.success) return { error: "Datos inválidos" };
  const validData = result.data;

  try {
    // 2. Iterar sobre cada ciclo seleccionado
    const promises = cycleIds.map(async (cycleId) => {
      // A. Crear Cabecera
      const { data: labor, error: laborError } = await supabase
        .from("labors")
        .insert({
          cycle_id: cycleId,
          date: validData.date.toISOString(),
          category: validData.category,
          description: validData.description,
          contractor_name: validData.contractor_name,
          service_cost_ha: validData.service_cost_ha,
          status: "done",
        })
        .select()
        .single();

      if (laborError)
        throw new Error(`Error en ciclo ${cycleId}: ${laborError.message}`);

      // B. Crear Items
      if (validData.items && validData.items.length > 0) {
        const itemsToInsert = [];
        for (const item of validData.items) {
          const { data: prod } = await supabase
            .from("products")
            .select("name")
            .eq("id", item.productId)
            .single();
          itemsToInsert.push({
            labor_id: labor.id,
            product_id: item.productId,
            product_name: prod?.name || "Producto",
            dose_per_ha: item.dose,
            price_unit: item.price,
          });
        }

        const { error: itemsError } = await supabase
          .from("labor_items")
          .insert(itemsToInsert);
        if (itemsError) throw new Error("Error guardando insumos");
      }
    });

    await Promise.all(promises);

    revalidatePath("/lotes");
    return { success: true };
  } catch (error: unknown) {
    console.error(error);
    return {
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}
