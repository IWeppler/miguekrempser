import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { MovementsFilters } from "@/features/moves/ui/movements-filters";
import { Card, CardContent } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { CreateAdjustmentDialog } from "@/features/moves/ui/create-adjustment-dialog";
import { MovementsTable } from "@/features/moves/ui/movements-table";
import { Movement } from "@/features/moves/types";

type SearchParams = Promise<{
  query?: string;
  type?: string;
  page?: string;
}>;

export default async function HistorialPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const supabase = await createClient();
  const params = await searchParams;

  const query = params.query || "";
  const type = params.type || "all";
  const currentPage = Number(params.page) || 1;
  const ITEMS_PER_PAGE = 20;

  const from = (currentPage - 1) * ITEMS_PER_PAGE;
  const to = from + ITEMS_PER_PAGE - 1;

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
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range(from, to);

  if (type !== "all") {
    dbQuery = dbQuery.eq("type", type);
  }

  if (query) {
    dbQuery = dbQuery.ilike("technician_name", `%${query}%`);
  }

  const { data: movementsData, count } = await dbQuery;

  const movements = (movementsData as unknown as Movement[]) || [];

  const totalPages = Math.ceil((count || 0) / ITEMS_PER_PAGE);
  const hasNextPage = currentPage < totalPages;
  const hasPrevPage = currentPage > 1;

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

        {/* FOOTER PAGINACIÓN DEL SERVIDOR */}
        <Card className="shadow-sm border border-border bg-card rounded-t-none border-t-0">
          <CardContent className="p-0">
            <div className="px-6 flex items-center justify-between">
              <div className="text-xs text-muted-foreground font-medium">
                Página {currentPage} de {totalPages || 1}{" "}
                <span className="text-muted-foreground/30 mx-2">|</span> {count}{" "}
                registros
              </div>
              <div className="flex gap-2">
                <Link
                  href={
                    hasPrevPage
                      ? `/movimientos?page=${
                          currentPage - 1
                        }&type=${type}&query=${query}`
                      : "#"
                  }
                  className={!hasPrevPage ? "pointer-events-none" : ""}
                >
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs font-normal border-border text-foreground hover:bg-accent"
                    disabled={!hasPrevPage}
                  >
                    <ChevronLeft className="h-3 w-3 mr-1" /> Anterior
                  </Button>
                </Link>

                <Link
                  href={
                    hasNextPage
                      ? `/movimientos?page=${
                          currentPage + 1
                        }&type=${type}&query=${query}`
                      : "#"
                  }
                  className={!hasNextPage ? "pointer-events-none" : ""}
                >
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs font-normal border-border text-foreground hover:bg-accent"
                    disabled={!hasNextPage}
                  >
                    Siguiente <ChevronRight className="h-3 w-3 ml-1" />
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
