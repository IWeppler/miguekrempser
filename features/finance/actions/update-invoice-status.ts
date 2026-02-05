"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateInvoiceStatus(invoiceId: string, status: string) {
  const supabase = await createClient();

  try {
    const { error } = await supabase
      .from("invoices")
      .update({ status })
      .eq("id", invoiceId);

    if (error) throw new Error(error.message);

    revalidatePath("/finanzas");
    return { success: true };
  } catch (error) {
    console.error("Error updating status:", error);
    return { success: false, error: "Error updating status" };
  }
}
