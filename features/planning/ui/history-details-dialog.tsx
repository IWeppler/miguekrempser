"use client";

import { useState, useEffect } from "react";
import {
  Eye,
  Loader2,
  TrendingUp,
  TrendingDown,
  Scale,
  CalendarDays,
} from "lucide-react";
import { getCycleHistoryDetails } from "../actions/cycle-actions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { Separator } from "@/shared/ui/separator";
import { ScrollArea } from "@/shared/ui/scroll-area";
import { format } from "date-fns";

// --- DEFINICIÓN DE TIPOS (Adiós 'any') ---
interface HistoryLaborItem {
  id: string;
  product_name: string;
  dose_per_ha: number;
  price_unit: number;
  cost_per_ha: number | null;
  unit?: string;
}

interface HistoryLabor {
  id: string;
  date: string;
  category: string;
  description: string;
  contractor_name: string | null;
  service_cost_ha: number;
  labor_items: HistoryLaborItem[];
}

interface HistoryData {
  labors: HistoryLabor[];
  totalCost: number;
}

interface Props {
  cycle: {
    id: string;
    crop: string;
    campaign: string;
    yield_ton_ha: number | null;
    sale_price_ton: number | null;
    status: string;
  };
  lotHectares: number;
}

export function HistoryDetailsDialog({ cycle, lotHectares }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [data, setData] = useState<HistoryData | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      if (open && !data) {
        setLoading(true);
        try {
          const res = await getCycleHistoryDetails(cycle.id);

          if (isMounted) {
            setData(res as unknown as HistoryData);
          }
        } catch (error) {
          console.error("Error al cargar historial:", error);
        } finally {
          if (isMounted) {
            setLoading(false);
          }
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [open, cycle.id, data]);

  // --- CÁLCULOS FINANCIEROS ---
  const rinde = Number(cycle.yield_ton_ha || 0);
  const precio = Number(cycle.sale_price_ton || 0);
  const costoHa = data?.totalCost || 0;

  const ingresoBrutoHa = rinde * precio;
  const margenBrutoHa = ingresoBrutoHa - costoHa;

  const ingresoTotalLote = ingresoBrutoHa * lotHectares;
  const costoTotalLote = costoHa * lotHectares;
  const margenTotalLote = margenBrutoHa * lotHectares;

  const roi = costoHa > 0 ? (margenBrutoHa / costoHa) * 100 : 0;
  const isPositive = margenBrutoHa >= 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-full justify-start text-xs text-muted-foreground hover:text-primary p-0"
        >
          <Eye className="mr-2 h-3 w-3" /> Ver Balance y Detalle
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-4xl max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between mr-6">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <span className="font-bold">{cycle.crop}</span>
              <span className="text-muted-foreground font-normal">
                | Campaña {cycle.campaign}
              </span>
            </DialogTitle>
            <Badge
              variant={cycle.status === "harvested" ? "default" : "secondary"}
            >
              {cycle.status === "harvested" ? "COSECHADO" : "CERRADO"}
            </Badge>
          </div>
        </DialogHeader>

        {loading ? (
          <div className="py-12 flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* 1. TABLERO DE RESULTADOS (BALANCE) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Ingresos */}
              <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-lg">
                <p className="text-xs font-semibold text-blue-700 uppercase flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" /> Ingreso Bruto
                </p>
                <div className="mt-2">
                  <p className="text-2xl font-bold text-blue-900">
                    USD {ingresoBrutoHa.toFixed(2)}
                  </p>
                  <p className="text-xs text-blue-600">por Hectárea</p>
                </div>
                <div className="mt-2 pt-2 border-t border-blue-200/60 flex justify-between text-xs text-blue-800">
                  <span>
                    {rinde} Tn/Ha x ${precio}
                  </span>
                  {/* CORRECCIÓN: Usamos la variable ingresoTotalLote */}
                  <span className="font-semibold">
                    Tot: $
                    {ingresoTotalLote.toLocaleString(undefined, {
                      maximumFractionDigits: 0,
                    })}
                  </span>
                </div>
              </div>

              {/* Costos */}
              <div className="bg-orange-50/50 border border-orange-100 p-4 rounded-lg">
                <p className="text-xs font-semibold text-orange-700 uppercase flex items-center gap-1">
                  <TrendingDown className="h-3 w-3" /> Costo Total
                </p>
                <div className="mt-2">
                  <p className="text-2xl font-bold text-orange-900">
                    USD {costoHa.toFixed(2)}
                  </p>
                  <p className="text-xs text-orange-600">por Hectárea</p>
                </div>
                <div className="mt-2 pt-2 border-t border-orange-200/60 text-xs text-orange-800 font-semibold flex justify-end">
                  Tot: $
                  {costoTotalLote.toLocaleString(undefined, {
                    maximumFractionDigits: 0,
                  })}
                </div>
              </div>

              {/* MARGEN (El dato más importante) */}
              <div
                className={`border p-4 rounded-lg ${isPositive ? "bg-green-50/50 border-green-200" : "bg-red-50/50 border-red-200"}`}
              >
                <p
                  className={`text-xs font-semibold uppercase flex items-center gap-1 ${isPositive ? "text-green-700" : "text-red-700"}`}
                >
                  <Scale className="h-3 w-3" /> Margen Bruto
                </p>
                <div className="mt-2">
                  <p
                    className={`text-2xl font-bold ${isPositive ? "text-green-900" : "text-red-900"}`}
                  >
                    {isPositive ? "+" : ""} USD {margenBrutoHa.toFixed(2)}
                  </p>
                  <p
                    className={`text-xs ${isPositive ? "text-green-600" : "text-red-600"}`}
                  >
                    por Hectárea
                  </p>
                </div>
                <div
                  className={`mt-2 pt-2 border-t flex justify-between text-xs font-bold ${isPositive ? "border-green-200 text-green-800" : "border-red-200 text-red-800"}`}
                >
                  <span>ROI: {roi.toFixed(1)}%</span>
                  <span>
                    Tot: $
                    {margenTotalLote.toLocaleString(undefined, {
                      maximumFractionDigits: 0,
                    })}
                  </span>
                </div>
              </div>
            </div>

            <Separator />

            {/* 2. LISTA DETALLADA DE LABORES (Compacta) */}
            <div>
              <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <CalendarDays className="h-4 w-4" /> Historial de Eventos
              </h4>
              <div className="rounded-md border text-sm">
                {/* Cabecera */}
                <div className="grid grid-cols-12 bg-muted/50 p-2 font-medium text-muted-foreground text-xs">
                  <div className="col-span-2">Fecha</div>
                  <div className="col-span-3">Labor</div>
                  <div className="col-span-5">Detalle / Insumos</div>
                  <div className="col-span-2 text-right">Costo Total</div>
                </div>

                {/* Lista */}
                <ScrollArea className="h-[300px]">
                  {data?.labors.map((labor) => {
                    const laborTotalCost =
                      (labor.service_cost_ha || 0) +
                      labor.labor_items.reduce(
                        (acc: number, item: HistoryLaborItem) =>
                          acc +
                          (item.cost_per_ha ||
                            item.dose_per_ha * item.price_unit),
                        0,
                      );
                    return (
                      <div
                        key={labor.id}
                        className="grid grid-cols-12 p-3 border-t items-start hover:bg-muted/20"
                      >
                        <div className="col-span-2 text-xs text-muted-foreground">
                          {labor.date
                            ? format(new Date(labor.date), "dd/MM/yy")
                            : "-"}
                        </div>
                        <div className="col-span-3 font-medium capitalize">
                          {labor.category}
                        </div>
                        <div className="col-span-5 space-y-1">
                          <div className="text-xs text-muted-foreground italic">
                            {labor.description}
                          </div>
                          {labor.contractor_name && (
                            <div className="text-[10px] bg-muted inline-block px-1 rounded">
                              Srv: {labor.contractor_name}
                            </div>
                          )}
                          {labor.labor_items.length > 0 && (
                            <ul className="text-xs space-y-0.5 mt-1">
                              {labor.labor_items.map((i) => (
                                <li
                                  key={i.id}
                                  className="flex justify-between pr-4"
                                >
                                  <span>• {i.product_name}</span>
                                  <span className="text-muted-foreground">
                                    {i.dose_per_ha} {i.unit || "Ud"}/Ha
                                  </span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                        <div className="col-span-2 text-right font-medium">
                          USD {laborTotalCost.toFixed(2)}
                        </div>
                      </div>
                    );
                  })}
                  {data?.labors.length === 0 && (
                    <div className="p-4 text-center text-muted-foreground italic">
                      Sin labores registradas
                    </div>
                  )}
                </ScrollArea>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
