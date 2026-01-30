"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { lotSchema, LotSchema } from "../types";

export async function getLots() {
  const supabase = await createClient();
  
  // 1. Traemos los lotes
  const { data: lots, error: lotsError } = await supabase
    .from("lots")
    .select("*")
    .order("name", { ascending: true });

  if (lotsError) return [];

  // 2. Traemos SOLO los ciclos activos
  const { data: activeCycles } = await supabase
    .from("crop_cycles")
    .select("id, lot_id, crop, campaign, status")
    .eq("status", "active");

  // 3. Fusionamos los datos (Merge)
  const lotsWithCrops = lots.map((lot) => {
    const active = activeCycles?.find((c) => c.lot_id === lot.id);
    return {
      ...lot,
      active_campaign: active ? {
        id: active.id,
        crop: active.crop,
        campaign: active.campaign,
        status: active.status
      } : null
    };
  });

  return lotsWithCrops;
}

export async function createLot(data: LotSchema) {
  const supabase = await createClient();

  // Validar datos
  const result = lotSchema.safeParse(data);
  if (!result.success) {
    return { error: "Datos inválidos" };
  }

  const { error } = await supabase.from("lots").insert(result.data);

  if (error) {
    console.error("Error creating lot:", error);
    return { error: "Error al crear el lote" };
  }

  revalidatePath("/lotes");
  return { success: true };
}

export async function deleteLot(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("lots").delete().eq("id", id);

  if (error) return { error: "No se pudo eliminar" };
  revalidatePath("/lotes");
  return { success: true };
}

export async function getLotById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("lots")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return null;
  return data;
}
