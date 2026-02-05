"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function deleteInvoice(invoiceId: string) {
  const supabase = await createClient();

  try {
    // 1. Get invoice items to reverse stock
    const { data: items, error: itemsError } = await supabase
      .from("invoice_items")
      .select("product_id, quantity")
      .eq("invoice_id", invoiceId);

    if (itemsError)
      throw new Error("Error fetching invoice items: " + itemsError.message);

    // 2. Revert Stock (Manual Safety Check)
    const { error: moveError } = await supabase
      .from("movements")
      .delete()
      .eq("invoice_id", invoiceId);

    if (moveError) console.error("Error deleting movements:", moveError);

    for (const item of items) {
      if (item.product_id) {
        // Fetch current stock
        const { data: product } = await supabase
          .from("products")
          .select("current_stock")
          .eq("id", item.product_id)
          .single();

        if (product) {
          const newStock =
            Number(product.current_stock) - Number(item.quantity);
          await supabase
            .from("products")
            .update({ current_stock: newStock })
            .eq("id", item.product_id);
        }
      }
    }

    // 4. Delete the Invoice (Cascade should handle items)
    const { error: deleteError } = await supabase
      .from("invoices")
      .delete()
      .eq("id", invoiceId);

    if (deleteError)
      throw new Error("Error deleting invoice: " + deleteError.message);

    revalidatePath("/finanzas");
    revalidatePath("/stock");
    return { success: true };
  } catch (error: unknown) {
    console.error("Delete invoice error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
