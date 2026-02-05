import { createClient } from "@/lib/supabase/server";
import { InvoicesTable } from "@/features/finance/ui/invoices-table";
import { startOfMonth, endOfMonth } from "date-fns";
import { FinanceStats } from "@/features/finance/ui/finance-stats";
import { Invoice } from "@/features/finance/types";

// TIPOS PARA LA RESPUESTA DE SUPABASE (RAW DATA)
type RawSupplier = { id: string; name: string };

interface RawInvoice {
  id: string;
  invoice_number: string;
  amount_total: number | null;
  currency: string;
  status: string;
  due_date: string;
  purchaser_company: string | null;
  file_url: string | null;
  // Supabase puede devolver un objeto o un array dependiendo de la relación
  suppliers: RawSupplier | RawSupplier[] | null;
}

const getAmount = (inv: Invoice) => Number(inv.amount_total ?? 0);

export default async function FinanzasPage() {
  const supabase = await createClient();

  // 1. Obtener Datos
  const [productsRes, invoicesRes, suppliersRes] = await Promise.all([
    supabase.from("products").select("id, name"),
    supabase
      .from("invoices")
      .select("*, suppliers(id, name)") // Traemos ID y Nombre
      .order("due_date", { ascending: true }),
    supabase.from("suppliers").select("id, name").order("name"),
  ]);

  const products = productsRes.data || [];
  const suppliers = suppliersRes.data || [];

  // 2. Preparar datos limpios para la Tabla
  // Casteamos la data cruda a nuestra interfaz RawInvoice[]
  const rawData = (invoicesRes.data || []) as unknown as RawInvoice[];

  const tableInvoices: Invoice[] = rawData.map((inv) => {
    // Normalizamos supplier por si Supabase lo devuelve como array o null
    let supplierData: { id: string; name: string } | null = null;

    if (inv.suppliers) {
      if (Array.isArray(inv.suppliers)) {
        // Si es array, tomamos el primero
        supplierData = inv.suppliers[0] || null;
      } else {
        // Si es objeto, lo usamos directo
        supplierData = inv.suppliers;
      }
    }

    return {
      id: inv.id,
      invoice_number: inv.invoice_number,
      amount_total: inv.amount_total ?? 0,
      currency: inv.currency,
      status: inv.status,
      due_date: inv.due_date,
      file_url: inv.file_url,
      suppliers: supplierData,
      purchaser_company: inv.purchaser_company,
    };
  });

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

  const pendingInvoices = tableInvoices.filter(
    (inv) => inv.status === "pending" || inv.status === "overdue",
  );

  const dueThisMonthInvoices = tableInvoices.filter((inv) => {
    if (inv.status === "paid") return false;
    const dueDate = new Date(inv.due_date);
    return dueDate >= currentMonthStart && dueDate <= currentMonthEnd;
  });

  const overdueInvoices = tableInvoices.filter(
    (inv) => inv.status === "overdue",
  );
  const paidInvoices = tableInvoices.filter((inv) => inv.status === "paid");

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
