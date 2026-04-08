import { createClient } from "@/lib/supabase/server";
import { RemitosTable } from "@/features/moves/ui/remitos-table";
import { FileText } from "lucide-react";

export default async function HistorialRemitosPage() {
  const supabase = await createClient();

  const { data: remitosData } = await supabase
    .from("remitos")
    .select(
      `
      *,
      movements (
        product_id,
        quantity,
        products ( name )
      )
    `,
    )
    .order("created_at", { ascending: false })
    .limit(5000);

  const { data: myCompanies } = await supabase
    .from("my_companies")
    .select("*")
    .limit(1)
    .single();

  const safeIssuer = {
    id: myCompanies?.id || "default",
    name: myCompanies?.name || "Empresa Sin Configurar",
    address: myCompanies?.address || "-",
    phone: myCompanies?.phone || "-",
    cuit: myCompanies?.cuit || "-",
    iib: myCompanies?.iib || "-",
    inicio_act: myCompanies?.inicio_act || "-",
    initials: myCompanies?.initials || "XX",
    iva_condition: myCompanies?.iva_condition || "Responsable Inscripto",
    cai_number: myCompanies?.cai_number || "-",
    cai_expiration: myCompanies?.cai_expiration || null,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            Historial de Remitos
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gestión y reimpresión de documentos de salida agrupados.
          </p>
        </div>
      </div>

      <div className="">
        <RemitosTable remitos={remitosData || []} issuer={safeIssuer} />
      </div>
    </div>
  );
}
