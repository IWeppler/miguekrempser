"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import {
  rainfallSchema,
  type RainfallSchema,
} from "../schemas/rainfall-schema";

export async function createRainfall(lotId: string, data: RainfallSchema) {
  const supabase = await createClient();

  const result = rainfallSchema.safeParse(data);
  if (!result.success) {
    return { error: "Datos de lluvia inválidos" };
  }

  const dateStr = result.data.date.toISOString().split("T")[0];

  const { error } = await supabase.from("rainfalls").insert({
    lot_id: lotId,
    date: dateStr,
    millimeters: result.data.millimeters,
    observations: result.data.observations,
  });

  if (error) {
    console.error("Error creating rainfall:", error);
    return { error: "Error al registrar la lluvia: " + error.message };
  }

  revalidatePath(`/lotes/${lotId}`);
  revalidatePath("/lotes");
  return { success: true };
}

export async function getRainfallsByLot(lotId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("rainfalls")
    .select("*")
    .eq("lot_id", lotId)
    .order("date", { ascending: false });

  if (error) return [];
  return data;
}

export async function deleteRainfall(id: string, lotId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("rainfalls").delete().eq("id", id);

  if (error) return { error: "No se pudo eliminar el registro" };

  revalidatePath(`/lotes/${lotId}`);
  return { success: true };
}
