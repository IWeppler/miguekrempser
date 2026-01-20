"use client";

import { Invoice } from "@/features/finance/types";
import { Product } from "@/features/stock/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { TrendingUp, AlertTriangle, Coins } from "lucide-react";
import { useDolar } from "@/shared/hooks/use-dolar"; // <--- 1. Importamos el hook

// Helper para formatear dinero
const formatMoney = (amount: number, currency: "USD" | "ARS") => {
  if (amount === 0) return null;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Componente visual para mostrar ARS y USD juntos (Para Deudas)
const PriceDisplay = ({ totals }: { totals: { ARS: number; USD: number } }) => {
  const showARS = totals.ARS > 0;
  const showUSD = totals.USD > 0;

  if (!showARS && !showUSD) return <div className="text-2xl font-bold">$0</div>;

  return (
    <div className="flex flex-col">
      {showUSD && (
        <div className="text-2xl font-bold">
          {formatMoney(totals.USD, "USD")}
        </div>
      )}
      {showARS && (
        <div className="text-lg font-semibold opacity-80">
          {formatMoney(totals.ARS, "ARS")}
        </div>
      )}
    </div>
  );
};

interface Props {
  invoices: Invoice[];
  products: Product[];
}

export function KpiCards({ invoices, products }: Props) {
  // 2. OBTENER COTIZACIÓN DEL DÓLAR
  const { oficial } = useDolar();
  // Usamos un valor por defecto (ej. 1150) para evitar división por cero mientras carga
  const exchangeRate = oficial?.venta || 1150;

  // 1. CÁLCULO DE DEUDA (Mantiene monedas separadas)
  const totalDebt = invoices.reduce(
    (acc, inv) => {
      const amount = Number(inv.amount_total || inv.amount_total || 0);
      if (inv.currency === "ARS") {
        acc.ARS += amount;
      } else {
        acc.USD += amount;
      }
      return acc;
    },
    { ARS: 0, USD: 0 },
  );

  // 2. CÁLCULO DE ALERTAS
  const lowStockItems = products.filter(
    (p) => (p.current_stock || 0) <= (p.min_stock_alert || 0),
  );

  // 3. CÁLCULO DE STOCK VALORIZADO (NORMALIZADO A USD)
  const totalStockValue = products.reduce((acc, p) => {
    const stock = Number(p.current_stock || 0);
    const cost = Number(p.average_cost || 0);
    let totalLine = stock * cost;

    // MAGIA AQUÍ: Si es ARS, convertimos a USD usando la cotización
    if (p.currency === "ARS") {
      totalLine = totalLine / exchangeRate;
    }

    return acc + totalLine;
  }, 0);

  return (
    /* CONTENEDOR HÍBRIDO: SLIDER (MOBILE) / GRID (DESKTOP) */
    <div className="flex overflow-x-auto pb-4 gap-4 snap-x snap-mandatory -mx-4 px-4 md:mx-0 md:px-0 md:pb-0 md:grid md:grid-cols-3 md:overflow-visible">
      {/* KPI 1: Deuda */}
      <Card className="bg-primary text-primary-foreground border-none shadow-md relative overflow-hidden min-w-[85%] md:min-w-0 snap-center">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <TrendingUp className="h-20 w-20" />
        </div>
        <CardHeader className="pb-2">
          <CardTitle className="text-primary-foreground/80 text-sm font-medium">
            Deuda Pendiente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <PriceDisplay totals={totalDebt} />
          <div className="mt-2 text-xs text-primary-foreground/60">
            {invoices.length} facturas activas
          </div>
        </CardContent>
      </Card>

      {/* KPI 2: Alertas */}
      <Card className="shadow-sm border-border bg-card min-w-[85%] md:min-w-0 snap-center">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-muted-foreground text-sm font-medium">
            Alertas Stock
          </CardTitle>
          <AlertTriangle
            className={`h-4 w-4 ${
              lowStockItems.length > 0
                ? "text-destructive"
                : "text-muted-foreground"
            }`}
          />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">
            {lowStockItems.length}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Requieren atención
          </p>
        </CardContent>
      </Card>

      {/* KPI 3: STOCK VALORIZADO */}
      <Card className="shadow-sm border-border bg-card min-w-[85%] md:min-w-0 snap-center">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-muted-foreground text-sm font-medium">
            Stock Valorizado
          </CardTitle>
          <Coins className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">
            {new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: "USD",
              maximumFractionDigits: 0,
            }).format(totalStockValue)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Capital inmovilizado
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
