import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { MovementsFilters } from "@/features/moves/ui/movements-filters";
import { Button } from "@/shared/ui/button";
import { Plus } from "lucide-react";
import { CreateAdjustmentDialog } from "@/features/moves/ui/create-adjustment-dialog";
import { MovementsTable } from "@/features/moves/ui/movements-table";
import { Movement } from "@/features/moves/types";

type SearchParams = Promise<{
  query?: string;
  type?: string;
}>;

export default async function HistorialPage({
  searchParams,
}: {
  readonly searchParams: SearchParams;
}) {
  const supabase = await createClient();
  const params = await searchParams;

  const query = params.query || "";
  const type = params.type || "all";

  let dbQuery = supabase
    .from("movements")
    .select(
      `
      *, 
      products(name),
      remitos (
        id, order_number, destination, driver, plate, technician
      )
    `,
    )
    .order("created_at", { ascending: false })
    .limit(1000);

  if (type !== "all") {
    dbQuery = dbQuery.eq("type", type);
  }

  if (query) {
    dbQuery = dbQuery.ilike("technician_name", `%${query}%`);
  }

  const { data: movementsData } = await dbQuery;
  const movements = (movementsData as unknown as Movement[]) || [];

  const { data: products } = await supabase
    .from("products")
    .select("id, name, current_stock");

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Historial de Movimientos
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Bitácora completa de ingresos y egresos de stock.
          </p>
        </div>
        <div className="flex gap-3">
          <CreateAdjustmentDialog products={products || []} />
          <Link href="/movimientos/nuevo">
            <Button className="bg-primary hover:bg-primary/90 shadow-sm h-9 px-4 text-sm text-primary-foreground">
              <Plus className="mr-2 h-4 w-4" /> Nuevo Remito
            </Button>
          </Link>
        </div>
      </div>

      {/* FILTROS Y TABLA */}
      <div className="space-y-4">
        <MovementsFilters />

        <MovementsTable initialMovements={movements} />
      </div>
    </div>
  );
}
