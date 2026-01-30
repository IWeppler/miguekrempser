import { notFound } from "next/navigation";
import { getLotById } from "@/features/planning/actions/lot-actions";
import { getCropCycles } from "@/features/planning/actions/cycle-actions";
import { getLaborsByCycle } from "@/features/planning/actions/labor-actions";
import { CreateCycleDialog } from "@/features/planning/ui/create-cycle-dialog";
import { CreateLaborDialog } from "@/features/planning/ui/create-labor-dialog";
import { LaborList } from "@/features/planning/ui/labor-list";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { ArrowLeft, MapPin, Sprout, History, Calendar } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { FinishCycleDialog } from "@/features/planning/ui/finish-cycle-dialog";
import { CycleOptionsMenu } from "@/features/planning/ui/cycle-options-menu";
import { HistoryDetailsDialog } from "@/features/planning/ui/history-details-dialog";

interface Props {
  params: Promise<{ id: string }>;
}

// TIPOS LOCALES
interface LaborItem {
  id: string;
  product_name: string;
  dose_per_ha: number;
  price_unit: number;
  cost_per_ha: number | null;
}

interface LaborWithItems {
  id: string;
  date: string;
  category: string;
  description: string;
  contractor_name: string | null;
  service_cost_ha: number;
  labor_items: LaborItem[];
}

interface ProductStock {
  id: string;
  name: string;
  average_cost: number | null;
}

export default async function LotDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  // 1. Buscamos datos Lote y Ciclos
  const [lot, cycles] = await Promise.all([getLotById(id), getCropCycles(id)]);

  if (!lot) return notFound();

  const activeCycle = cycles.find((c) => c.status === "active");
  const historyCycles = cycles.filter((c) => c.status !== "active");

  // 2. Variables tipadas
  let activeLabors: LaborWithItems[] = [];
  let rawProducts: ProductStock[] = [];

  if (activeCycle) {
    const [laborsData, productsData] = await Promise.all([
      getLaborsByCycle(activeCycle.id),
      supabase.from("products").select("id, name, average_cost").order("name"),
    ]);

    if (laborsData) {
      activeLabors = laborsData as unknown as LaborWithItems[];
    }
    if (productsData.data) {
      rawProducts = productsData.data as ProductStock[];
    }
  }

  // 3. Transformación de Productos
  const productsForDialog = rawProducts.map((p) => ({
    id: p.id,
    name: p.name,
    average_cost: p.average_cost ?? 0,
  }));

  // 4. Cálculo de KPI
  const totalInvestedHa = activeLabors.reduce(
    (acc: number, labor: LaborWithItems) => {
      const service = Number(labor.service_cost_ha || 0);
      const supplies = labor.labor_items.reduce(
        (sAcc: number, i: LaborItem) => {
          const itemCost =
            i.cost_per_ha ??
            Number(i.dose_per_ha || 0) * Number(i.price_unit || 0);
          return sAcc + Number(itemCost);
        },
        0,
      );
      return acc + service + supplies;
    },
    0,
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      {/* NAVEGACIÓN Y CABECERA DEL LOTE */}
      <div className="flex items-center gap-4">
        <Link href="/lotes">
          <Button variant="outline" size="icon" className="h-9 w-9">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            {lot.name}
            <Badge
              variant="outline"
              className="text-base font-normal px-2 py-0.5"
            >
              {Number(lot.hectares).toLocaleString()} Ha
            </Badge>
          </h1>
          <p className="text-muted-foreground flex items-center gap-1 text-sm">
            <MapPin className="h-3 w-3" /> {lot.field_name}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna Izquierda: CAMPAÑA ACTIVA */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Sprout className="h-5 w-5 text-green-600" />
              Campaña Actual
            </h2>

            {/* CORRECCIÓN 1: El botón de cierre SOLO si hay activeCycle */}
            {activeCycle && (
              <FinishCycleDialog
                cycleId={activeCycle.id}
                lotId={lot.id}
                cropName={activeCycle.crop}
              />
            )}

            {/* Si NO hay ciclo activo, mostramos el botón de crear */}
            {!activeCycle && <CreateCycleDialog lotId={lot.id} />}
          </div>

          {activeCycle ? (
            <Card className="border-border bg-card shadow-md">
              <CardHeader className="pb-2 border-b border-border/50">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                  {/* IZQUIERDA: Info del Cultivo */}
                  <div>
                    <Badge className="bg-green-600 hover:bg-green-700 mb-2">
                      EN CURSO
                    </Badge>
                    <CardTitle className="text-2xl font-bold text-foreground">
                      {activeCycle.crop}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground font-medium">
                      Campaña {activeCycle.campaign}
                    </p>
                  </div>

                  {/* DERECHA: KPIs Financieros + Calculadora */}
                  <div className="flex flex-col items-end gap-2 w-full sm:w-auto">
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground uppercase font-bold">
                        Inversión Acumulada
                      </p>
                      <p className="text-xl font-bold text-foreground">
                        USD {totalInvestedHa.toFixed(2)}{" "}
                        <span className="text-sm font-normal text-muted-foreground">
                          / Ha
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 mb-2">
                        Total Lote: USD{" "}
                        {(totalInvestedHa * lot.hectares).toLocaleString()}
                      </p>
                    </div>

                    {/* Calculadora de Indiferencia */}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-4">
                <h3 className="text-sm font-semibold text-muted-foreground">
                  Registro de Labores
                </h3>

                <LaborList labors={activeLabors as LaborWithItems[]} />

                <div className="mt-4 flex justify-center border-t border-border pt-2">
                  <CreateLaborDialog
                    cycleId={activeCycle.id}
                    lotId={lot.id}
                    products={productsForDialog}
                  />
                </div>
              </CardContent>
            </Card>
          ) : (
            // ESTADO VACÍO (BARBECHO)
            <div className="border-2 border-dashed border-border rounded-xl p-8 text-center text-muted-foreground bg-muted/20 animate-in fade-in">
              <Sprout className="h-10 w-10 mx-auto mb-3 opacity-20" />
              <p className="font-medium">
                El lote está en descanso / barbecho.
              </p>
              <p className="text-sm mb-4">No hay un cultivo activo asignado.</p>
              <CreateCycleDialog lotId={lot.id} />
            </div>
          )}
        </div>

        {/* Columna Derecha: HISTORIAL */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <History className="h-5 w-5 text-orange-400" /> Historial
            </h2>
          </div>

          <div className="space-y-3">
            {historyCycles.length > 0 ? (
              historyCycles.map((cycle) => (
                <Card
                  key={cycle.id}
                  className={`shadow-sm relative group transition-all hover:border-primary/20 ${
                    cycle.status === "planned"
                      ? "border-dashed border-blue-300 bg-blue-50/20"
                      : ""
                  }`}
                >
                  {/* MENÚ DE OPCIONES (Absoluto en la esquina) */}
                  <div className="absolute top-2 right-2 z-10 opacity-70 group-hover:opacity-100 transition-opacity">
                    <CycleOptionsMenu
                      cycleId={cycle.id}
                      lotId={lot.id}
                      status={cycle.status}
                    />
                  </div>

                  <CardContent className="px-4">
                    {/* ENCABEZADO: Título y Badge */}
                    <div className="pr-8 mb-2">
                      {" "}
                      {/* pr-8 deja espacio para el menú */}
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-foreground text-lg leading-tight">
                          {cycle.crop}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge
                          variant={
                            cycle.status === "planned" ? "outline" : "secondary"
                          }
                          className="text-[10px] h-5 px-1.5 font-normal"
                        >
                          {cycle.status === "planned"
                            ? "FUTURO"
                            : cycle.status === "harvested"
                              ? "COSECHADO"
                              : "CERRADO"}
                        </Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> {cycle.campaign}
                        </span>
                      </div>
                    </div>

                    {/* DATOS DE COSECHA (Si existen) */}
                    {cycle.yield_ton_ha && (
                      <div className="mt-3 bg-green-50/50 p-2 rounded-md border border-green-100/50">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-muted-foreground">Rinde:</span>
                          <span className="font-bold text-green-700">
                            {cycle.yield_ton_ha} Tn/Ha
                          </span>
                        </div>
                      </div>
                    )}

                    {/* BOTÓN DE DETALLE COMPLETO (Separado abajo) */}
                    <div className="pt-3  border-t border-border/50">
                      <HistoryDetailsDialog
                        cycle={cycle}
                        lotHectares={Number(lot.hectares)}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-8 bg-muted/20 rounded-lg border-2 border-dashed border-border/50">
                <p className="text-sm text-muted-foreground italic">
                  No hay historial registrado.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
