import { createClient } from "@/lib/supabase/server";
import { NewRemitoForm } from "@/features/moves/ui/new-remito-form";

export default async function NuevoRemitoPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const currentUserEmail = user?.email;
  const currentUserName = user?.user_metadata?.full_name;

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .order("full_name");

  const { data: products } = await supabase
    .from("products")
    .select("id, name")
    .order("name");

  return (
    <div className="space-y-6">
      {/* HEADER DE TÍTULO */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-muted-foreground mb-1">
            Operaciones &gt; Remito Salida
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Nuevo Remito de Salida
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground mr-2">
            {new Date().toLocaleDateString("es-AR", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </span>
        </div>
      </div>

      {/* RENDERIZAR FORMULARIO CLIENTE CON DATOS INICIALES */}
      <NewRemitoForm
        products={products || []}
        profiles={profiles || []}
        currentUserEmail={currentUserEmail}
        currentUserName={currentUserName}
      />
    </div>
  );
}
