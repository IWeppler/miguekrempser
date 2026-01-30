import { getLots } from "@/features/planning/actions/lot-actions";
import { LotDialog } from "@/features/planning/ui/lot-dialog";
import { LotListManager } from "@/features/planning/ui/lot-list-manager";
import { Map } from "lucide-react";
import { type Lot } from "@/features/planning/types";
import { createClient } from "@/lib/supabase/server";
import { MultiLotLaborDialog } from "@/features/planning/ui/multi-lot-labor-dialog";

export default async function LotesPage() {
  const lots = (await getLots()) as Lot[];

  const supabase = await createClient();
  const { data: rawProducts } = await supabase
    .from("products")
    .select("id, name, average_cost")
    .order("name");

  const products = (rawProducts || []).map((p) => ({
    id: p.id,
    name: p.name,
    average_cost: p.average_cost ?? 0,
  }));

  // Calculamos KPI Globales aquí para el header estático
  const totalHectaresGlobal = lots.reduce(
    (acc: number, lot: Lot) => acc + (Number(lot.hectares) || 0),
    0,
  );

  // Obtenemos campos únicos
  const totalFields = new Set(lots.map((l) => l.field_name)).size;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      {/* HEADER ESTÁTICO (Server Side) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Lotes y Campos
          </h1>
          <p className="text-muted-foreground">
            {lots.length} lotes distribuidos en {totalFields} establecimientos.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden md:block">
            <p className="text-xs text-muted-foreground uppercase font-bold">
              Superficie Total
            </p>
            <p className="text-2xl font-bold text-green-700 dark:text-green-400">
              {Math.round(totalHectaresGlobal).toLocaleString()}{" "}
              <span className="text-sm text-foreground">Ha</span>
            </p>
          </div>
          {/* BOTONES DE ACCIÓN */}
          <div className="flex gap-2">
            <MultiLotLaborDialog lots={lots} products={products} />
            <LotDialog />
          </div>
        </div>
      </div>

      {lots.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground border-2 border-dashed border-border rounded-lg bg-muted/10">
          <Map className="h-12 w-12 mx-auto mb-4 opacity-20" />
          <h3 className="text-lg font-medium">No hay lotes registrados</h3>
          <p className="text-sm mb-4">
            Comienza definiendo tu estructura productiva.
          </p>
        </div>
      ) : (
        /* COMPONENTE CLIENTE CON FILTROS */
        <LotListManager initialLots={lots} />
      )}
    </div>
  );
}
