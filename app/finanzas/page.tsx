import { createClient } from "@/lib/supabase/server";
import { InvoicesTable } from "@/features/finance/ui/invoices-table";
import { startOfMonth, endOfMonth } from "date-fns";
import { FinanceStats } from "@/features/finance/ui/finance-stats"; // Importamos el nuevo componente

// Interface InvoiceData... (la misma que tenías antes)
interface InvoiceData {
  id: string;
  amount: number | null;
  amount_total?: number | null;
  currency: string;
  status: string;
  due_date: string;
  invoice_number: string;
  suppliers: { name: string } | null;
}

const getAmount = (inv: InvoiceData) =>
  Number(inv.amount_total ?? inv.amount ?? 0);

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
  const rawInvoices = (invoicesRes.data as InvoiceData[]) || [];
  const suppliers = suppliersRes.data || [];

  // 2. Preparar datos limpios para la Tabla
  const tableInvoices = rawInvoices.map((inv) => ({
    ...inv,
    amount: getAmount(inv),
  }));

  // Helper para sumar
  const sumByCurrency = (invoiceList: InvoiceData[]) => {
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
    <div className="space-y-8">
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
        <div>
          <h2 className="text-lg font-bold text-foreground">
            Estado de Cuenta Corriente
          </h2>
          <p className="text-sm text-muted-foreground">
            Gestión detallada de facturas y pagos a proveedores
          </p>
        </div>

        <InvoicesTable
          products={products}
          initialInvoices={tableInvoices}
          suppliers={suppliers}
        />
      </div>
    </div>
  );
}
