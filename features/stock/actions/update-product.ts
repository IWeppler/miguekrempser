"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { Product } from "../types";

type UpdateProductData = Pick<
  Product,
  | "id"
  | "name"
  | "category"
  | "unit"
  | "location"
  | "min_stock_alert"
  | "average_cost"
  | "currency"
  | "description"
>;

export async function updateProduct(data: UpdateProductData) {
  const supabase = await createClient();

  try {
    const { error } = await supabase
      .from("products")
      .update({
        name: data.name,
        category: data.category,
        unit: data.unit,
        location: data.location,
        min_stock_alert: data.min_stock_alert,
        average_cost: data.average_cost,
        currency: data.currency,
        description: data.description,
      })
      .eq("id", data.id);

    if (error) throw new Error(error.message);

    revalidatePath("/stock");
    return { success: true };
  } catch (error) {
    console.error("Error updating product:", error);
    return { success: false, error: "No se pudo actualizar el producto." };
  }
}
