import { createClient } from "@/lib/supabase/server";
import { NewRemitoForm } from "@/features/moves/ui/new-remito-form";

export default async function NuevoRemitoPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const currentUserName = user?.user_metadata?.full_name;

  // 1. Obtener perfiles para el selector de ingenieros
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .order("full_name");

  // 2. Obtener productos para el detalle de carga
  const { data: products } = await supabase
    .from("products")
    .select("id, name, unit")
    .order("name");

  // 3. OBTENER LAS EMPRESAS EMISORAS (Desde la nueva tabla my_companies)
  const { data: issuerCompanies } = await supabase
    .from("my_companies")
    .select("*")
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
            Nuevo Remito
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
        issuerCompanies={issuerCompanies || []} // <-- PASAMOS LAS EMPRESAS AQUÍ
        currentUserName={currentUserName}
      />
    </div>
  );
}
