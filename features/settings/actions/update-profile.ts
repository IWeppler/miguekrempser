"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateProfile(userId: string, fullName: string) {
  const supabase = await createClient();

  try {
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName })
      .eq("id", userId);

    if (error) throw new Error(error.message);

    await supabase.auth.updateUser({
      data: { full_name: fullName },
    });

    revalidatePath("/configuracion");
    revalidatePath("/");

    return { success: true };
  } catch (error: unknown) {
    return {
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}
