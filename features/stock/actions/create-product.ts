"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { productSchema, type ProductSchema } from "../schemas/product-schema";

export async function createProduct(data: ProductSchema) {
  const supabase = await createClient();

  // 1. Validar datos en el servidor
  const result = productSchema.safeParse(data);
  if (!result.success) {
    return { error: "Datos inválidos: " + result.error.message };
  }

  // 2. Insertar en Supabase
  const { error } = await supabase.from("products").insert({
    name: result.data.name,
    category: result.data.category,
    unit: result.data.unit,
    current_stock: result.data.currentStock,
    min_stock_alert: result.data.minStockAlert,
    average_cost: result.data.averageCost,
    location: result.data.location,
    description: result.data.description,
  });

  if (error) {
    console.error("Error Supabase:", error);
    return { error: "Error al guardar el producto." };
  }

  // 3. Recargar la página de stock para ver el nuevo item
  revalidatePath("/stock");
  revalidatePath("/");

  return { success: true };
}
