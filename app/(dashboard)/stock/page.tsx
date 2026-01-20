import { StockTable } from "@/features/stock/ui/stock-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Package, AlertTriangle, Archive, Tags, Layers } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { type Product } from "@/features/stock/types";

async function getDolarExchangeRate() {
  try {
    const res = await fetch("https://dolarapi.com/v1/dolares/oficial", {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return 1150;
    const data = await res.json();
    return data.venta || 1150;
  } catch (error) {
    return 1150;
  }
}

export default async function StockPage() {
  const supabase = await createClient();

  // 1. CARGA PARALELA
  const [productsRes, dollarRate] = await Promise.all([
    supabase.from("products").select("*").order("name"),
    getDolarExchangeRate(),
  ]);

  const rawProducts = productsRes.data || [];

  // Casting seguro y default currency
  const productList = rawProducts.map((p) => ({
    ...p,
    currency: p.currency || "USD",
  })) as Product[];

  // 2. CÁLCULOS KPI
  const totalItems = productList.length;

  const criticalStockCount = productList.filter(
    (p) => (p.current_stock || 0) <= (p.min_stock_alert || 0),
  ).length;

  const uniqueCategories = Array.from(
    new Set(productList.map((p) => p.category)),
  ).filter(Boolean);
  const categoriesCount = uniqueCategories.length;

  // D. VALORIZACIÓN INTELIGENTE (Opción B)
  const totalValuationUSD = productList.reduce((acc, curr) => {
    const stock = Number(curr.current_stock || 0);
    const cost = Number(curr.average_cost || 0);
    let costInUSD = cost;

    if (curr.currency === "ARS") {
      costInUSD = cost / dollarRate;
    }

    return acc + stock * costInUSD;
  }, 0);

  const formatMoney = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(amount);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Inventario
          </h1>
          <p className="text-muted-foreground">Control de stock e insumos.</p>
        </div>
        {/* Badge informativa del dólar usado para el cálculo */}
        <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium border border-blue-100">
          Dólar Ref. Cálculo: ${dollarRate}
        </div>
      </div>

      {/* KPI CARDS (Estilo consistente con Dashboard) */}
      <div className="grid gap-4 md:grid-cols-4">
        {/* 1. Total Items */}
        <Card className="shadow-sm border-l-4 border-l-primary bg-card">
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
        <Card className="shadow-sm border-l-4 border-l-destructive bg-card">
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
        <Card className="shadow-sm border-l-4 border-l-orange-500 bg-card">
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

        {/* 4. Valorizado (El más importante) */}
        <Card className="shadow-sm border-l-4 border-l-green-600 bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Valorizado Total
            </CardTitle>
            <Archive className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {formatMoney(totalValuationUSD)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Estimado en depósito (USD)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* TABLA PRINCIPAL */}
      <StockTable initialData={productList} categories={uniqueCategories} />
    </div>
  );
}
