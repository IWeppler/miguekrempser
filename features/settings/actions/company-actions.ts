"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function upsertCompany(data: {
  id?: string;
  name: string;
  initials: string | null;
  address: string | null;
  phone: string | null;
  cuit: string | null;
  iib: string | null;
  inicio_act: string | null;
  iva_condition: string | null;
  cai_number: string | null;
  cai_expiration: string | null;
}) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: "Usuario no autenticado." };
  }

  const companyData = {
    name: data.name,
    initials: data.initials,
    address: data.address,
    phone: data.phone,
    cuit: data.cuit,
    iib: data.iib,
    inicio_act: data.inicio_act || null,
    iva_condition: data.iva_condition || "Responsable Inscripto",
    cai_number: data.cai_number,
    cai_expiration: data.cai_expiration || null,
  };

  try {
    if (data.id) {
      const { data: updatedData, error: updateError } = await supabase
        .from("my_companies")
        .update(companyData)
        .eq("id", data.id)
        .select();

      if (updateError) throw new Error(updateError.message);

      if (!updatedData || updatedData.length === 0) {
        throw new Error(
          "No se pudo actualizar. RLS bloqueó la acción o la empresa no existe.",
        );
      }
    } else {
      const { data: insertedData, error: insertError } = await supabase
        .from("my_companies")
        .insert([companyData])
        .select();

      if (insertError) throw new Error(insertError.message);

      if (!insertedData || insertedData.length === 0) {
        throw new Error(
          "No se pudo crear. Verifica las reglas de RLS para INSERT.",
        );
      }
    }

    revalidatePath("/configuracion");
    return { success: true };
  } catch (error: unknown) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Error al guardar la empresa",
    };
  }
}

export async function deleteCompany(id: string) {
  const supabase = await createClient();

  try {
    const { data: deletedData, error } = await supabase
      .from("my_companies")
      .delete()
      .eq("id", id)
      .select();

    if (error) throw new Error(error.message);

    if (!deletedData || deletedData.length === 0) {
      throw new Error(
        "No se pudo eliminar. Es posible que no tengas permisos o ya fue eliminada.",
      );
    }

    revalidatePath("/configuracion");
    return { success: true };
  } catch (error: unknown) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Error al eliminar la empresa",
    };
  }
}
