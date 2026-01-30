import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar, Droplets, Sprout, Tractor } from "lucide-react";
import { Badge } from "@/shared/ui/badge";

// Definimos los tipos que vienen de la DB
interface LaborItem {
  id: string;
  product_name: string;
  dose_per_ha: number;
  price_unit: number;
  cost_per_ha: number | null; // Este vendrá calculado si lo pusimos en la DB, sino lo calculamos en JS
}

interface Labor {
  id: string;
  date: string;
  category: string;
  description: string;
  contractor_name: string | null;
  service_cost_ha: number;
  labor_items: LaborItem[];
}

interface Props {
  labors: Labor[];
}

export function LaborList({ labors }: Props) {
  if (labors.length === 0) {
    return (
      <div className="bg-background rounded-md p-6 border border-border mt-2 text-center text-muted-foreground text-sm border-dashed">
        <p>No hay labores registradas en esta campaña aún.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 mt-4">
      {labors.map((labor) => {
        // Calcular totales visuales
        const inputsCost = labor.labor_items.reduce((acc, item) => {
          // Si la DB devuelve null en cost_per_ha, calculamos manual
          const cost = item.cost_per_ha ?? item.dose_per_ha * item.price_unit;
          return acc + cost;
        }, 0);

        const totalCostHa = (labor.service_cost_ha || 0) + inputsCost;

        return (
          <div
            key={labor.id}
            className="bg-card border border-border rounded-lg p-4 shadow-sm hover:border-primary/40 transition-colors"
          >
            {/* CABECERA LABOR */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-3 border-b border-border/50 pb-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                  {labor.category === "pulverización" ? (
                    <Droplets className="h-5 w-5" />
                  ) : labor.category === "siembra" ? (
                    <Sprout className="h-5 w-5" />
                  ) : (
                    <Tractor className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-base capitalize">
                    {labor.description}
                  </h4>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(labor.date), "PPP", { locale: es })}
                    {labor.contractor_name && ` • ${labor.contractor_name}`}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <Badge
                  variant="outline"
                  className="mb-1 text-green-700 bg-green-50 border-green-200"
                >
                  USD {totalCostHa.toFixed(2)} / Ha
                </Badge>
                <p className="text-[10px] text-muted-foreground">Costo Total</p>
              </div>
            </div>

            {/* DETALLE COSTOS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {/* Servicio */}
              {labor.service_cost_ha > 0 && (
                <div className="flex justify-between items-center p-2 bg-muted/30 rounded">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Tractor className="h-3 w-3" /> Servicio
                  </span>
                  <span className="font-medium">
                    USD {labor.service_cost_ha.toFixed(2)}
                  </span>
                </div>
              )}

              {/* Insumos */}
              {labor.labor_items.length > 0 && (
                <div className="md:col-span-2">
                  <p className="text-xs font-semibold text-muted-foreground mb-2 ml-1">
                    Insumos Aplicados
                  </p>
                  <div className="space-y-1">
                    {labor.labor_items.map((item) => (
                      <div
                        key={item.id}
                        className="flex justify-between items-center text-xs p-1.5 hover:bg-muted/50 rounded border-b border-border/40 last:border-0"
                      >
                        <span>
                          {item.product_name}{" "}
                          <span className="text-muted-foreground">
                            ({item.dose_per_ha} Lt/Ha)
                          </span>
                        </span>
                        <span>
                          USD{" "}
                          {(
                            item.cost_per_ha ??
                            item.dose_per_ha * item.price_unit
                          ).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
