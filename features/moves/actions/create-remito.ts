"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { remitoSchema, type RemitoSchema } from "../schemas/remito-schema";

export async function createRemito(data: RemitoSchema) {
  const supabase = await createClient();

  // 1. Validar datos
  const result = remitoSchema.safeParse(data);
  if (!result.success) {
    return { error: "Datos inválidos" };
  }

  const cleanData = result.data;

  try {
    // 2. LLAMAR A LA TRANSACCIÓN SQL (RPC)
    const { error } = await supabase.rpc("create_remito_transaction", {
      p_order_number: cleanData.orderNumber,
      p_technician: cleanData.technician,
      p_destination: cleanData.destination,
      p_driver: cleanData.driver,
      p_plate: cleanData.plate,
      p_observations: cleanData.observations || "",
      p_items: cleanData.items,
    });

    if (error) throw new Error(error.message);

    // 3. Revalidar
    revalidatePath("/movimientos");
    revalidatePath("/stock");
    revalidatePath("/");

    return { success: true };
  } catch (error: unknown) {
    console.error("Error creating remito:", error);
    let msg = "Error desconocido";
    if (error instanceof Error) msg = error.message;
    return { error: msg };
  }
}
