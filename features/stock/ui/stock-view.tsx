"use client";

import { useState } from "react";
import { StockTable } from "@/features/stock/ui/stock-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Switch } from "@/shared/ui/switch";
import { Label } from "@/shared/ui/label";
import { Package, AlertTriangle, Layers } from "lucide-react";
import { type Product } from "@/features/stock/types";

interface Props {
  initialData: Product[];
  dollarRate: number;
}

export function StockView({ initialData, dollarRate }: Props) {
  const [showInArs, setShowInArs] = useState(false);

  // 1. CÁLCULOS KPI
  const totalItems = initialData.length;
  const criticalStockCount = initialData.filter(
    (p) => (p.current_stock || 0) <= (p.min_stock_alert || 0),
  ).length;

  const uniqueCategories = Array.from(
    new Set(initialData.map((p) => p.category)),
  ).filter(Boolean);
  const categoriesCount = uniqueCategories.length;

  // 2. VALORIZACIÓN DINÁMICA
  const totalValuation = initialData.reduce((acc, curr) => {
    const stock = Number(curr.current_stock || 0);
    const cost = Number(curr.average_cost || 0);
    let itemValue = 0;

    if (showInArs) {
      // Ver en PESOS
      if (curr.currency === "USD") {
        itemValue = cost * dollarRate * stock;
      } else {
        itemValue = cost * stock;
      }
    } else {
      // Ver en DÓLARES
      if (curr.currency === "ARS") {
        itemValue = (cost / dollarRate) * stock;
      } else {
        itemValue = cost * stock;
      }
    }

    return acc + itemValue;
  }, 0);

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: showInArs ? "ARS" : "USD",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* HEADER SIMPLIFICADO */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Inventario
          </h1>
          <p className="text-muted-foreground">Control de stock e insumos.</p>
        </div>

        {/* Solo dejamos el Badge informativo, el switch se mudó a la card */}
        <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20 h-fit self-start md:self-auto">
          Dólar Ref: ${dollarRate}
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="flex overflow-x-auto pb-2 gap-4 snap-x snap-mandatory -mx-4 px-4 md:mx-0 md:px-0 md:pb-0 md:grid md:grid-cols-4 md:overflow-visible">
        {/* 1. Total Items */}
        <Card className="shadow-sm border-l-4 border-l-primary bg-card min-w-[85%] md:min-w-0 snap-center">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Total Items
            </CardTitle>
            <Package className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {totalItems}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Productos registrados
            </p>
          </CardContent>
        </Card>

        {/* 2. Stock Crítico */}
        <Card className="shadow-sm border-l-4 border-l-destructive bg-card min-w-[85%] md:min-w-0 snap-center">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Stock Crítico
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {criticalStockCount}
            </div>
            <p className="text-xs text-destructive font-medium bg-destructive/10 inline-block px-1 rounded mt-1">
              Requieren reposición
            </p>
          </CardContent>
        </Card>

        {/* 3. Categorías */}
        <Card className="shadow-sm border-l-4 border-l-orange-500 bg-card min-w-[85%] md:min-w-0 snap-center">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Categorías
            </CardTitle>
            <Layers className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {categoriesCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Rubros activos</p>
          </CardContent>
        </Card>

        {/* 4. Valorizado Total (CON SWITCH INTEGRADO) */}
        <Card className="shadow-sm border-l-4 border-l-green-600 bg-card min-w-[85%] md:min-w-0 snap-center transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Valorizado Total
            </CardTitle>

            {/* SWITCH CHIQUITO AQUÍ */}
            <div className="flex items-center gap-2">
              <Label
                htmlFor="mini-switch"
                className="text-[10px] font-bold text-muted-foreground cursor-pointer uppercase"
              >
                {showInArs ? "ARS" : "USD"}
              </Label>
              <Switch
                id="mini-switch"
                checked={showInArs}
                onCheckedChange={setShowInArs}
                className="scale-75 data-[state=checked]:bg-green-600 h-5 w-9"
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground transition-all duration-300">
              {formatMoney(totalValuation)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {showInArs ? "Estimado en Pesos" : "Estimado en Dólares"}
            </p>
          </CardContent>
        </Card>
      </div>

      <StockTable initialData={initialData} categories={uniqueCategories} />
    </div>
  );
}
