import { createClient } from "@/lib/supabase/server";

// WIDGETS
import { DashboardCalendar } from "@/features/dashboard/ui/dashboard-calendar";
import { ExpenseDonut } from "@/features/dashboard/ui/expense-donut";
import { KpiCards } from "@/features/dashboard/ui/kpi-cards";
import { QuickActions } from "@/features/dashboard/ui/quick-actions";
import { RecentMovementsTable } from "@/features/dashboard/ui/recent-movements-table";
import { DollarCard } from "@/features/dashboard/ui/dollar-card";

// TYPES
import { type Product } from "@/features/stock/types";
import { type Movement } from "@/features/moves/types";
import { type Invoice } from "@/features/finance/types";

// TIPOS DE ENTRADA (RAW DB RESPONSE)
type RawProductJoin = { name: string; category: string };
type RawSupplierJoin = { name: string };

type RawMovementData = {
  id: string;
  created_at: string;
  type: "IN" | "OUT";
  quantity: number;
  technician_name: string | null;
  product_id: string;
  description: string | null;
  products: RawProductJoin | RawProductJoin[] | null;
};

type RawInvoiceData = {
  id: string;
  invoice_number: string;
  amount_total: number | null;
  amount: number | null;
  currency: string;
  status: string;
  due_date: string;
  suppliers: RawSupplierJoin | RawSupplierJoin[] | null;
};

export default async function DashboardPage() {
  const supabase = await createClient();

  // 1. CARGA DE DATOS
  const [productsRes, movementsRes, invoicesRes] = await Promise.all([
    supabase
      .from("products")
      .select(
        "id, name, category, current_stock, min_stock_alert, unit, average_cost, location, currency",
      ),
    supabase
      .from("movements")
      .select(
        "id, created_at, type, quantity, technician_name, product_id, description, products(name, category)",
      )
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("invoices")
      .select(
        "id, invoice_number, amount_total, currency, status, due_date, suppliers(name)",
      )
      .eq("status", "pending"),
  ]);

  // 2. NORMALIZACIÓN
  const products = (productsRes.data || []) as unknown as Product[];

  const rawMovements = (movementsRes.data ||
    []) as unknown as RawMovementData[];
  const recentMovements: Movement[] = rawMovements.map((m) => {
    let prodData: { name: string; category?: string } | null = null;
    if (Array.isArray(m.products)) {
      if (m.products.length > 0) prodData = m.products[0];
    } else if (m.products) {
      prodData = m.products;
    }
    return {
      id: m.id,
      created_at: m.created_at,
      type: m.type,
      quantity: m.quantity,
      technician_name: m.technician_name,
      product_id: m.product_id,
      description: m.description,
      products: prodData,
    };
  });

  const rawInvoices = (invoicesRes.data || []) as unknown as RawInvoiceData[];
  const invoices: Invoice[] = rawInvoices.map((inv) => {
    let supplierData: { name: string } | null = null;
    if (Array.isArray(inv.suppliers)) {
      if (inv.suppliers.length > 0) supplierData = inv.suppliers[0];
    } else if (inv.suppliers) {
      supplierData = inv.suppliers;
    }
    return {
      id: inv.id,
      invoice_number: inv.invoice_number,
      amount_total: inv.amount_total ?? inv.amount ?? 0,
      currency: inv.currency,
      status: inv.status,
      due_date: inv.due_date,
      suppliers: supplierData,
    };
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* COLUMNA IZQUIERDA (Operativa) */}
        <div className="lg:col-span-3 space-y-6">
          {/* A. KPI CARDS + DOLAR (Layout Híbrido) */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-3">
              <KpiCards invoices={invoices} products={products} />
            </div>
            {/* Dólar ocupa 1 columna */}
            <div className="md:col-span-1">
              <DollarCard />
            </div>
          </div>

          {/* B. ACCIONES */}
          <QuickActions />

          {/* C. TABLA */}
          <RecentMovementsTable movements={recentMovements} />
        </div>

        {/* COLUMNA DERECHA (Gestión) */}
        <div className="space-y-6">
          <div className="h-[calc(70%)]">
            <DashboardCalendar />
          </div>
          <ExpenseDonut />
        </div>
      </div>
    </div>
  );
}
