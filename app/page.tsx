import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import {
  AlertTriangle,
  Fuel,
  TrendingUp,
  Plus,
  FileText,
  Truck,
  MoreVertical,
} from "lucide-react";

// WIDGETS
import { DashboardCalendar } from "@/features/dashboard/ui/dashboard-calendar";
import { ExpenseDonut } from "@/features/dashboard/ui/expense-donut";

// --- TYPES & HELPERS ---

interface Invoice {
  id: string;
  amount: number | null;
  amount_total?: number | null;
  currency: string;
  status: string;
}

// Helper to safely get invoice amount
const getAmount = (inv: Invoice) => Number(inv.amount_total || inv.amount || 0);

// Currency formatter
const formatMoney = (amount: number, currency: "USD" | "ARS") => {
  if (amount === 0) return null;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Component to display price in both currencies
const PriceDisplay = ({
  totals,
  compact = false,
}: {
  totals: { ARS: number; USD: number };
  compact?: boolean;
}) => {
  const showARS = totals.ARS > 0;
  const showUSD = totals.USD > 0;

  if (!showARS && !showUSD) return <div className="text-2xl font-bold">$0</div>;

  return (
    <div className="flex flex-col">
      {showUSD && (
        <div className={`${compact ? "text-xl" : "text-2xl"} font-bold`}>
          {formatMoney(totals.USD, "USD")}
        </div>
      )}
      {showARS && (
        <div
          className={`${
            compact ? "text-sm" : "text-lg"
          } font-semibold opacity-80`}
        >
          {formatMoney(totals.ARS, "ARS")}
        </div>
      )}
    </div>
  );
};

export default async function DashboardPage() {
  const supabase = await createClient();

  // DATOS
  const [productsRes, movementsRes, invoicesRes] = await Promise.all([
    supabase.from("products").select("*"),
    supabase
      .from("movements")
      .select("*, products(name)")
      .order("created_at", { ascending: false })
      .limit(8),
    supabase.from("invoices").select("*").eq("status", "pending"),
  ]);

  const products = productsRes.data || [];
  const recentMovements = movementsRes.data || [];
  // Explicitly cast to our Invoice interface to ensure type safety
  const invoices = (invoicesRes.data as Invoice[]) || [];

  // --- CALCULATIONS ---

  // 1. Calculate Debt by Currency
  const totalDebt = invoices.reduce(
    (acc, inv) => {
      const amount = getAmount(inv);
      if (inv.currency === "ARS") {
        acc.ARS += amount;
      } else {
        acc.USD += amount;
      }
      return acc;
    },
    { ARS: 0, USD: 0 },
  );

  // 2. Stock Alerts
  const lowStockItems = products.filter(
    (p) => (p.current_stock || 0) <= (p.min_stock_alert || 0),
  );

  // 3. Fuel Stock
  const fuelProducts = products.filter((p) => p.category === "Combustibles");
  const totalFuel = fuelProducts.reduce(
    (acc, curr) => acc + (curr.current_stock || 0),
    0,
  );

  return (
    <div className="space-y-6">
      {/* LAYOUT PRINCIPAL: 2 COLUMNAS (Main vs Sidebar) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* === COLUMNA IZQUIERDA (2/3) - OPERATIVA === */}
        <div className="lg:col-span-3 space-y-6">
          {/* A. KPI CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* KPI 1: Deuda (Primary Color Card) */}
            <Card className="bg-primary text-primary-foreground border-none shadow-md relative overflow-hidden">
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

            {/* KPI 2: Stock */}
            <Card className="shadow-sm border-border bg-card">
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

            {/* KPI 3: Combustible */}
            <Card className="shadow-sm border-border bg-card">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-muted-foreground text-sm font-medium">
                  Combustible
                </CardTitle>
                <Fuel className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {new Intl.NumberFormat("es-AR").format(totalFuel)} Lts
                </div>
                <p className="text-xs text-muted-foreground mt-1">Disponible</p>
              </CardContent>
            </Card>
          </div>

          {/* B. BARRA DE ACCIONES RÁPIDAS */}
          <div className="bg-card rounded-lg border border-border shadow-sm p-2 flex flex-col sm:flex-row gap-2">
            <Link href="/movimientos/nuevo" className="flex-1">
              <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground gap-2 shadow-sm h-10">
                <Plus className="h-4 w-4" /> Nuevo Remito
              </Button>
            </Link>
            <div className="w-px bg-border mx-2 hidden sm:block"></div>
            <Link href="/finanzas?new=true" className="flex-1">
              <Button
                variant="ghost"
                className="w-full text-muted-foreground hover:bg-muted gap-2 h-10 border border-transparent hover:border-border"
              >
                <FileText className="h-4 w-4 text-muted-foreground" /> Cargar
                Factura
              </Button>
            </Link>
            <Link href="/stock" className="flex-1">
              <Button
                variant="ghost"
                className="w-full text-muted-foreground hover:bg-muted gap-2 h-10 border border-transparent hover:border-border"
              >
                <Truck className="h-4 w-4 text-muted-foreground" /> Ver Stock
              </Button>
            </Link>
          </div>

          {/* C. TABLA DE MOVIMIENTOS */}
          <div className="md:col-span-5 space-y-6">
            <Card className="shadow-sm h-full border-border bg-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="text-lg font-bold text-foreground">
                    Últimos Movimientos
                  </CardTitle>
                </div>
                <Link href="/movimientos">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs border-border text-muted-foreground hover:text-foreground"
                  >
                    Ver Historial Completo
                  </Button>
                </Link>
              </CardHeader>
              <CardContent className="p-0">
                <div className="relative w-full overflow-auto">
                  <table className="w-full caption-bottom text-sm text-left">
                    <thead className="[&_tr]:border-b border-border bg-muted/30">
                      <tr className="border-b border-border transition-colors">
                        <th className="h-10 px-4 align-middle font-medium text-muted-foreground">
                          Fecha/Hora
                        </th>
                        <th className="h-10 px-4 align-middle font-medium text-muted-foreground">
                          Tipo
                        </th>
                        <th className="h-10 px-4 align-middle font-medium text-muted-foreground">
                          Detalle
                        </th>
                        <th className="h-10 px-4 align-middle font-medium text-muted-foreground text-right">
                          Cant.
                        </th>
                        <th className="h-10 px-4 align-middle font-medium text-muted-foreground text-right"></th>
                      </tr>
                    </thead>
                    <tbody className="[&_tr:last-child]:border-0">
                      {recentMovements.map((move) => (
                        <tr
                          key={move.id}
                          className="border-b border-border transition-colors hover:bg-muted/50"
                        >
                          <td className="p-4 align-middle text-xs text-muted-foreground">
                            <span className="font-medium text-foreground">
                              {new Date(move.created_at).toLocaleDateString()}
                            </span>
                            <span className="block text-muted-foreground/80">
                              {new Date(move.created_at).toLocaleTimeString(
                                [],
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                },
                              )}
                            </span>
                          </td>
                          <td className="p-4 align-middle">
                            <Badge
                              variant="outline"
                              className={`font-normal ${
                                move.type === "IN"
                                  ? "bg-primary/10 text-primary border-primary/20"
                                  : "bg-orange-500/10 text-orange-600 border-orange-500/20"
                              }`}
                            >
                              {move.type === "IN" ? "Ingreso" : "Salida"}
                            </Badge>
                          </td>
                          <td className="p-4 align-middle">
                            <div className="font-medium text-foreground">
                              {move.products?.name || "Producto eliminado"}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {move.technician_name || "Sin responsable"}
                            </div>
                          </td>
                          <td className="p-4 align-middle text-right font-mono font-medium text-foreground">
                            {move.quantity}{" "}
                            <span className="text-xs text-muted-foreground">
                              ud
                            </span>
                          </td>
                          <td className="p-4 align-middle text-right">
                            <MoreVertical className="h-4 w-4 text-muted-foreground" />
                          </td>
                        </tr>
                      ))}
                      {recentMovements.length === 0 && (
                        <tr>
                          <td
                            colSpan={5}
                            className="p-8 text-center text-muted-foreground"
                          >
                            No hay movimientos registrados aún.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* === COLUMNA DERECHA (1/3) - LATERAL DE GESTIÓN === */}
        <div className="space-y-6">
          {/* 1. CALENDARIO */}
          <div className="h-[calc(50%-4px)]">
            <DashboardCalendar />
          </div>
          {/* 2. GRÁFICO DE TORTA (GASTOS) */}
          <ExpenseDonut />
        </div>
      </div>
    </div>
  );
}
