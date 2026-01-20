"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { DollarSign } from "lucide-react";
import { Skeleton } from "@/shared/ui/skeleton";
import { useDolar } from "@/shared/hooks/use-dolar";

export function DollarCard() {
  const { oficial, blue, loading, error } = useDolar();

  if (loading) {
    return (
      <Card className="shadow-sm border-border bg-card h-full min-h-[120px]">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-4 rounded-full" />
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="shadow-sm border-border bg-card flex items-center justify-center h-full min-h-[120px]">
        <div className="text-center text-xs text-muted-foreground">
          <p>Sin cotización</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm border-border bg-card relative overflow-hidden h-full group flex flex-col justify-between  min-h-[120px]">
      {/* HEADER COMPACTO */}
      <CardHeader className="flex flex-row items-center justify-between relative z-10">
        <CardTitle className="text-muted-foreground text-sm font-medium">
          Dólar Hoy
        </CardTitle>
        <div className="bg-green-100 dark:bg-green-900/30 p-1 rounded-full">
          <DollarSign className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
        </div>
      </CardHeader>

      {/* CONTENIDO COMPACTO (Grid en lugar de flex col con mucho espacio) */}
      <CardContent className="relative z-10 grid gap-1">
        {/* FILA 1: OFICIAL */}
        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground font-medium">
            Oficial
          </span>
          <span className="text-lg font-bold text-foreground tracking-tight">
            $
            {oficial?.venta.toLocaleString("es-AR", {
              minimumFractionDigits: 2,
            })}
          </span>
        </div>

        {/* Separador sutil */}
        <div className="h-px bg-border/50 w-full" />

        {/* FILA 2: BLUE */}
        <div className="flex justify-between items-center">
          <span className="text-xs text-blue-600/80 dark:text-blue-400/80 font-medium">
            Blue
          </span>
          <span className="text-lg font-bold text-blue-600 dark:text-blue-400 tracking-tight">
            ${blue?.venta.toLocaleString("es-AR", { minimumFractionDigits: 0 })}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
