"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { DollarSign, RefreshCw, TrendingUp } from "lucide-react";
import { Skeleton } from "@/shared/ui/skeleton";
import { useDolar } from "@/shared/hooks/use-dolar"; // <--- Importamos el hook

export function DollarCard() {
  const { oficial, blue, loading, error } = useDolar();

  if (loading) {
    return (
      <Card className="shadow-sm border-border bg-card h-full">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-4 rounded-full" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="shadow-sm border-border bg-card flex items-center justify-center h-full min-h-[140px]">
        <div className="text-center text-xs text-muted-foreground">
          <p>Cotización no disponible</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm border-border bg-card relative overflow-hidden h-full group">
      {/* Decoración de fondo sutil */}
      <div className="absolute -right-4 -top-4 text-green-500/5 group-hover:text-green-500/10 transition-colors">
        <DollarSign className="h-32 w-32" />
      </div>

      <CardHeader className="pb-2 flex flex-row items-center justify-between relative z-10">
        <CardTitle className="text-muted-foreground text-sm font-medium">
          Cotización Hoy
        </CardTitle>
        <div className="bg-green-100 dark:bg-green-900/30 p-1.5 rounded-full">
          <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
        </div>
      </CardHeader>

      <CardContent className="space-y-4 relative z-10 pt-2">
        {/* DOLAR OFICIAL */}
        <div className="flex justify-between items-baseline border-b border-border/50 pb-2">
          <div className="flex flex-col">
            <span className="text-xs font-medium text-muted-foreground">
              Oficial BNA
            </span>
            <span className="text-[10px] text-muted-foreground/70">Venta</span>
          </div>
          <span className="text-xl font-bold text-foreground tracking-tight">
            $
            {oficial?.venta.toLocaleString("es-AR", {
              minimumFractionDigits: 2,
            })}
          </span>
        </div>

        {/* DOLAR BLUE */}
        <div className="flex justify-between items-baseline">
          <div className="flex flex-col">
            <span className="text-xs font-medium text-blue-600/80 dark:text-blue-400/80">
              Blue
            </span>
            <span className="text-[10px] text-muted-foreground/70">
              Informal
            </span>
          </div>
          <span className="text-xl font-bold text-blue-600 dark:text-blue-400 tracking-tight">
            ${blue?.venta.toLocaleString("es-AR", { minimumFractionDigits: 0 })}
          </span>
        </div>

        {/* Footer pequeño */}
        <div className="text-[9px] text-right text-muted-foreground flex justify-end items-center gap-1 mt-1">
          <RefreshCw className="h-2 w-2" /> Actualizado en tiempo real
        </div>
      </CardContent>
    </Card>
  );
}
