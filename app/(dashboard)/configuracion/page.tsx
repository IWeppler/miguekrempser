import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SettingsForm } from "@/features/settings/ui/settings-form";

export default async function ConfiguracionPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const safeProfile = profile || {
    full_name: user.user_metadata?.full_name || "",
  };

  return (
    <div className="container max-w-4xl py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Configuración
        </h1>
        <p className="text-muted-foreground">
          Administra tu perfil y preferencias del sistema.
        </p>
      </div>

      {/* 3. Renderizar Formulario con Datos Reales */}
      <SettingsForm
        user={{ id: user.id, email: user.email }}
        profile={safeProfile}
      />
    </div>
  );
}
