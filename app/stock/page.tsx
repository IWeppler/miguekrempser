import { StockTable } from "@/features/stock/ui/stock-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Package, AlertTriangle, Archive, Tags } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export default async function StockPage() {
  const supabase = await createClient();

  // 1. OBTENER DATOS REALES DE SUPABASE
  const { data: products } = await supabase
    .from("products")
    .select("*")
    .order("name");

  const productList = products || [];

  // 2. CÁLCULOS DE KPIS (Server Side)

  // A. Total de Items
  const totalItems = productList.length;

  // B. Stock Crítico (Menor o igual al mínimo definido)
  const criticalStockCount = productList.filter(
    (p) => (p.current_stock || 0) <= (p.min_stock_alert || 0)
  ).length;

  // C. Categorías Únicas
  const uniqueCategories = Array.from(
    new Set(productList.map((p) => p.category))
  )
    .filter(Boolean)
    .sort();
  const categoriesCount = uniqueCategories.length;

  // D. Valorizado
  const totalValuation = productList.reduce((acc, curr) => {
    const stock = curr.current_stock || 0;
    const cost = curr.average_cost || 0;
    return acc + stock * cost;
  }, 0);

  // Helper para formatear moneda
  const formatMoney = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(amount);

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Inventario de Insumos
        </h1>
        <p className="text-muted-foreground">
          Gestión de stock, control de lotes y alertas de reposición.
        </p>
      </div>

      {/* KPI CARDS CON DATOS REALES */}
      <div className="grid gap-4 md:grid-cols-4">
        {/* Total Items */}
        <Card className="shadow-sm border-l-4 border-l-primary bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase">
              Total Items
            </CardTitle>
            <Package className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {totalItems}
            </div>
            <p className="text-xs text-muted-foreground">
              Productos registrados
            </p>
          </CardContent>
        </Card>

        {/* Stock Crítico */}
        <Card className="shadow-sm border-l-4 border-l-destructive bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase">
              Stock Crítico
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {criticalStockCount}
            </div>
            <p className="text-xs text-destructive font-medium">
              Requieren reposición
            </p>
          </CardContent>
        </Card>

        {/* Categorías */}
        <Card className="shadow-sm border-l-4 border-l-chart-2 bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase">
              Categorías
            </CardTitle>
            <Tags className="h-4 w-4 text-chart-2" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {categoriesCount}
            </div>
            <p className="text-xs text-muted-foreground">Rubros activos</p>
          </CardContent>
        </Card>

        {/* Valorizado */}
        <Card className="shadow-sm border-l-4 border-l-muted-foreground bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase">
              Valorizado
            </CardTitle>
            <Archive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {formatMoney(totalValuation)}
            </div>
            <p className="text-xs text-muted-foreground">Estimado en almacén</p>
          </CardContent>
        </Card>
      </div>

      {/* TABLA PRINCIPAL (Pasamos categorias calculadas dinámicamente) */}
      <StockTable initialData={productList} categories={uniqueCategories} />
    </div>
  );
}
