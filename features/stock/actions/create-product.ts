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

  // 2. Insertar y DEVOLVER datos (.select().single())
  const { data: newProduct, error } = await supabase
    .from("products")
    .insert({
      name: result.data.name,
      category: result.data.category,
      unit: result.data.unit,
      current_stock: result.data.currentStock,
      min_stock_alert: result.data.minStockAlert,
      average_cost: result.data.averageCost,
      location: result.data.location,
      description: result.data.description,
    })
    .select()
    .single();

  if (error) {
    console.error("Error Supabase:", error);
    return { error: "Error al guardar el producto." };
  }

  // 3. Revalidar
  revalidatePath("/stock");
  revalidatePath("/");

  // 4. Retorno exitoso con DATA
  return { success: true, data: newProduct };
}
