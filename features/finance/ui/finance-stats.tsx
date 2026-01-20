"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Switch } from "@/shared/ui/switch";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import {
  TrendingDown,
  Calendar,
  CheckCircle2,
  History,
  RefreshCcw,
} from "lucide-react";
import { useDolar } from "@/shared/hooks/use-dolar";

interface CurrencyTotals {
  ARS: number;
  USD: number;
}

interface Props {
  totalDebt: CurrencyTotals;
  dueThisMonth: CurrencyTotals;
  overdueDebt: CurrencyTotals;
  paidTotal: CurrencyTotals;
}

// 1. Helper formateador
const formatMoney = (amount: number, currency: "USD" | "ARS") => {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: currency,
    maximumFractionDigits: 0,
  }).format(amount);
};

// 2. Componente DisplayValue
const DisplayValue = ({
  values,
  isConsolidated,
  exchangeRate,
}: {
  values: CurrencyTotals;
  isConsolidated: boolean;
  exchangeRate: number;
}) => {
  if (isConsolidated) {
    const rate = exchangeRate || 1;
    const totalInUsd = values.USD + values.ARS / rate;

    if (totalInUsd === 0) return <div className="text-2xl font-bold">$0</div>;

    return (
      <div className="text-2xl font-bold text-primary">
        ≈ {formatMoney(totalInUsd, "USD")}
      </div>
    );
  }

  const showARS = values.ARS !== 0;
  const showUSD = values.USD !== 0;

  if (!showARS && !showUSD) return <div className="text-2xl font-bold">$0</div>;

  return (
    <div className="flex flex-col">
      {showUSD && (
        <div className="text-2xl font-bold text-foreground">
          {formatMoney(values.USD, "USD")}
        </div>
      )}
      {showARS && (
        <div className="text-lg font-semibold text-muted-foreground">
          {formatMoney(values.ARS, "ARS")}
        </div>
      )}
    </div>
  );
};

// 3. Componente Principal
export function FinanceStats({
  totalDebt,
  dueThisMonth,
  overdueDebt,
  paidTotal,
}: Props) {
  const [isConsolidated, setIsConsolidated] = useState(false);

  const [manualExchangeRate, setManualExchangeRate] = useState<number | null>(
    null,
  );

  const { oficial, loading: loadingRate } = useDolar();

  const exchangeRate = manualExchangeRate ?? oficial?.venta ?? 1150;

  return (
    <div className="space-y-4">
      {/* BARRA DE CONTROL */}
      <div className="flex flex-col sm:flex-row items-center justify-end gap-4 bg-muted/30 p-2 rounded-lg border border-border">
        <div className="flex items-center space-x-2">
          <Switch
            id="mode-switch"
            checked={isConsolidated}
            onCheckedChange={setIsConsolidated}
          />
          <Label htmlFor="mode-switch" className="cursor-pointer font-medium">
            {isConsolidated
              ? "Vista Consolidada (USD)"
              : "Vista Desglosada (Original)"}
          </Label>
        </div>

        {isConsolidated && (
          <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-5">
            <Label
              htmlFor="rate"
              className="text-xs text-muted-foreground whitespace-nowrap flex items-center gap-1"
            >
              Dólar Ref
              {loadingRate && <RefreshCcw className="h-3 w-3 animate-spin" />} :
            </Label>
            <div className="relative w-24">
              <span className="absolute left-2 top-1.5 text-xs text-muted-foreground">
                $
              </span>
              <Input
                id="rate"
                type="number"
                value={exchangeRate}
                onChange={(e) => setManualExchangeRate(Number(e.target.value))}
                className="h-8 pl-5 text-xs bg-background"
              />
            </div>
          </div>
        )}
      </div>

      {/* GRID DE CARDS */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Deuda Total */}
        <Card className="shadow-sm border-l-4 border-l-destructive bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Deuda Total
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <DisplayValue
              values={totalDebt}
              isConsolidated={isConsolidated}
              exchangeRate={exchangeRate}
            />
            <p className="text-xs text-destructive mt-1 font-medium bg-destructive/10 inline-block px-1 rounded">
              Pendiente de pago
            </p>
          </CardContent>
        </Card>

        {/* Card 2: Vencimientos */}
        <Card className="shadow-sm border-l-4 border-l-orange-500 bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Vencimientos Mes
            </CardTitle>
            <Calendar className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <DisplayValue
              values={dueThisMonth}
              isConsolidated={isConsolidated}
              exchangeRate={exchangeRate}
            />
            <p className="text-xs text-orange-600 dark:text-orange-400 mt-1 font-medium bg-orange-500/10 inline-block px-1 rounded">
              Alertas de vencimiento
            </p>
          </CardContent>
        </Card>

        {/* Card 3: Vencido */}
        <Card className="shadow-sm border-l-4 border-l-primary bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Vencido (Exigible)
            </CardTitle>
            {overdueDebt.ARS > 0 || overdueDebt.USD > 0 ? (
              <TrendingDown className="h-4 w-4 text-destructive" />
            ) : (
              <CheckCircle2 className="h-4 w-4 text-primary" />
            )}
          </CardHeader>
          <CardContent>
            <DisplayValue
              values={overdueDebt}
              isConsolidated={isConsolidated}
              exchangeRate={exchangeRate}
            />
            <p
              className={`text-xs mt-1 font-medium inline-block px-1 rounded ${
                overdueDebt.ARS > 0 || overdueDebt.USD > 0
                  ? "text-destructive bg-destructive/10"
                  : "text-primary bg-primary/10"
              }`}
            >
              {overdueDebt.ARS > 0 || overdueDebt.USD > 0
                ? "Requiere atención"
                : "Al día"}
            </p>
          </CardContent>
        </Card>

        {/* Card 4: Histórico Pagado */}
        <Card className="shadow-sm border-l-4 border-l-muted-foreground bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Pagado Campaña
            </CardTitle>
            <History className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <DisplayValue
              values={paidTotal}
              isConsolidated={isConsolidated}
              exchangeRate={exchangeRate}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Acumulado histórico
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
