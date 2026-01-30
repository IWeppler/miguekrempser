"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getLaborsByCycle } from "./labor-actions";

const cycleSchema = z.object({
  lotId: z.string(),
  campaign: z.string().min(1, "La campaña es requerida (ej: 23-24)"),
  crop: z.string().min(1, "El cultivo es requerido"),
  status: z.enum(["planned", "active", "harvested", "closed"]),
  observations: z.string().optional(),
});

interface LaborItemCost {
  cost_per_ha: number | null;
  dose_per_ha: number;
  price_unit: number;
}

interface LaborWithCost {
  service_cost_ha: number;
  labor_items: LaborItemCost[];
}

export type CycleSchema = z.infer<typeof cycleSchema>;

export async function getCropCycles(lotId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("crop_cycles")
    .select("*")
    .eq("lot_id", lotId)
    .order("created_at", { ascending: false }); // Las más nuevas primero

  if (error) {
    console.error(error);
    return [];
  }
  return data;
}

export async function createCropCycle(data: CycleSchema) {
  const supabase = await createClient();

  // Mapeamos los datos del formulario a la tabla DB
  const { error } = await supabase.from("crop_cycles").insert({
    lot_id: data.lotId,
    campaign: data.campaign,
    crop: data.crop,
    status: data.status,
    observations: data.observations,
  });

  if (error) {
    console.error("Error creating cycle:", error);
    return { error: "Error al crear la campaña" };
  }

  revalidatePath(`/lotes/${data.lotId}`);
  return { success: true };
}

export async function finishCycle(
  id: string,
  lotId: string,
  yieldTonHa: number,
  priceTon: number,
) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("crop_cycles")
    .update({
      status: "harvested", // Lo pasamos a cosechado
      yield_ton_ha: yieldTonHa, // Guardamos cuanto rindió
      closed_at: new Date().toISOString(), // Guardamos fecha de cierre
      sale_price_ton: priceTon, // Guardamos precio de venta
    })
    .eq("id", id);

  if (error) return { error: "Error al cerrar el ciclo" };

  revalidatePath(`/lotes/${lotId}`);
  return { success: true };
}

export async function deleteCycle(id: string, lotId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("crop_cycles").delete().eq("id", id);

  if (error) return { error: "Error al eliminar" };
  revalidatePath(`/lotes/${lotId}`);
  return { success: true };
}

export async function activateCycle(id: string, lotId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("crop_cycles")
    .update({ status: "active" })
    .eq("id", id);

  if (error) return { error: "Error al activar" };
  revalidatePath(`/lotes/${lotId}`);
  return { success: true };
}

export async function getCycleHistoryDetails(cycleId: string) {
  const labors = await getLaborsByCycle(cycleId);

  if (!labors) return { labors: [], totalCost: 0 };

  const totalCost = labors.reduce((acc, labor) => {
    const currentLabor = labor as unknown as LaborWithCost;

    const service = Number(currentLabor.service_cost_ha || 0);

    const supplies = currentLabor.labor_items.reduce(
      (sAcc: number, item: LaborItemCost) => {
        const itemCost =
          item.cost_per_ha ??
          Number(item.dose_per_ha) * Number(item.price_unit);
        return sAcc + itemCost;
      },
      0,
    );

    return acc + service + supplies;
  }, 0);

  return {
    labors,
    totalCost,
  };
}
