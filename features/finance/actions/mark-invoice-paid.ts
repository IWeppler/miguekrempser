"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function markInvoicePaid(invoiceId: string) {
  const supabase = await createClient();

  try {
    const { error } = await supabase
      .from("invoices")
      .update({ status: "paid" })
      .eq("id", invoiceId);

    if (error) throw new Error(error.message);

    revalidatePath("/finanzas");
    return { success: true };
  } catch (error: unknown) {
    console.error("Error marking invoice paid:", error);
    let message = "Error al actualizar la factura";
    if (error instanceof Error) message = error.message;
    return { error: message };
  }
}
