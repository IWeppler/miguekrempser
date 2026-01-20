import { createClient } from "@/lib/supabase/server";
import { InvoicesTable } from "@/features/finance/ui/invoices-table";
import { startOfMonth, endOfMonth } from "date-fns";
import { FinanceStats } from "@/features/finance/ui/finance-stats";
import { Invoice } from "@/features/finance/types";

const getAmount = (inv: Invoice) =>
  Number(inv.amount_total ?? inv.amount_total ?? 0);

export default async function FinanzasPage() {
  const supabase = await createClient();

  // 1. Obtener Datos
  const [productsRes, invoicesRes, suppliersRes] = await Promise.all([
    supabase.from("products").select("id, name"),
    supabase
      .from("invoices")
      .select("*, suppliers(name)")
      .order("due_date", { ascending: true }),
    supabase.from("suppliers").select("id, name").order("name"),
  ]);

  const products = productsRes.data || [];
  const rawInvoices = (invoicesRes.data as Invoice[]) || [];
  const suppliers = suppliersRes.data || [];

  // 2. Preparar datos limpios para la Tabla
  const tableInvoices = rawInvoices.map((inv) => ({
    ...inv,
    amount: getAmount(inv),
  }));

  // Helper para sumar
  const sumByCurrency = (invoiceList: Invoice[]) => {
    return invoiceList.reduce(
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
  };

  // 3. Cálculos de KPIs
  const now = new Date();
  const currentMonthStart = startOfMonth(now);
  const currentMonthEnd = endOfMonth(now);

  const pendingInvoices = rawInvoices.filter(
    (inv) => inv.status === "pending" || inv.status === "overdue",
  );

  const dueThisMonthInvoices = rawInvoices.filter((inv) => {
    if (inv.status === "paid") return false;
    const dueDate = new Date(inv.due_date);
    return dueDate >= currentMonthStart && dueDate <= currentMonthEnd;
  });

  const overdueInvoices = rawInvoices.filter((inv) => inv.status === "overdue");
  const paidInvoices = rawInvoices.filter((inv) => inv.status === "paid");

  // Pasamos los objetos {ARS, USD} puros al componente cliente
  const totalDebt = sumByCurrency(pendingInvoices);
  const dueThisMonth = sumByCurrency(dueThisMonthInvoices);
  const overdueDebt = sumByCurrency(overdueInvoices);
  const paidTotal = sumByCurrency(paidInvoices);

  return (
    <div className="space-y-4">
      {/* ENCABEZADO */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Cuentas Corrientes
        </h1>
        <p className="text-muted-foreground">
          Gestión financiera y seguimiento de pagos a proveedores.
        </p>
      </div>

      {/* COMPONENTE INTERACTIVO DE ESTADÍSTICAS */}
      <FinanceStats
        totalDebt={totalDebt}
        dueThisMonth={dueThisMonth}
        overdueDebt={overdueDebt}
        paidTotal={paidTotal}
      />

      {/* TABLA */}
      <div className="space-y-4">
        <InvoicesTable
          products={products}
          initialInvoices={tableInvoices}
          suppliers={suppliers}
        />
      </div>
    </div>
  );
}
