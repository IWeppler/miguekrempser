import { createClient } from "@/lib/supabase/server";
import { InvoicesTable } from "@/features/finance/ui/invoices-table";
import { startOfMonth, endOfMonth } from "date-fns";
import { FinanceStats } from "@/features/finance/ui/finance-stats";
import { Invoice } from "@/features/finance/types";

type RawSupplier = { id: string; name: string };

interface RawInvoice {
  id: string;
  invoice_number: string;
  amount_total: number | null;
  currency: string;
  status: string;
  date: string;
  due_date: string;
  purchaser_company: string | null;
  voucher_type: "FC" | "NC" | "ND";
  file_url: string | null;
  supplier_id: string;
  exchange_rate: number | null;
  suppliers: RawSupplier | RawSupplier[] | null;
}

const getAmount = (inv: Invoice) => Number(inv.amount_total ?? 0);

export default async function FinanzasPage() {
  const supabase = await createClient();

  const [productsRes, invoicesRes, suppliersRes, myCompaniesRes] =
    await Promise.all([
      supabase.from("products").select("id, name"),
      supabase
        .from("invoices")
        .select("*, suppliers(id, name)")
        .order("date", { ascending: true }),
      supabase.from("suppliers").select("id, name").order("name"),
      supabase.from("my_companies").select("id, name").order("name"),
    ]);

  const products = productsRes.data || [];
  const suppliers = suppliersRes.data || [];
  const myCompanies = myCompaniesRes.data || [];

  // 2. Preparar datos limpios para la Tabla
  const rawData = (invoicesRes.data || []) as unknown as RawInvoice[];

  const tableInvoices: Invoice[] = rawData.map((inv) => {
    let supplierData: { id: string; name: string } | null = null;

    if (inv.suppliers) {
      supplierData = Array.isArray(inv.suppliers)
        ? inv.suppliers[0]
        : inv.suppliers;
    }

    return {
      id: inv.id,
      invoice_number: inv.invoice_number,
      amount_total: inv.amount_total ?? 0,
      currency: inv.currency as "USD" | "ARS",
      status: inv.status as "pending" | "paid" | "overdue",
      date: inv.date,
      due_date: inv.due_date,
      file_url: inv.file_url,
      suppliers: supplierData,
      purchaser_company: inv.purchaser_company || "EL TOLAR SA",
      supplier_id: inv.supplier_id,
      exchange_rate: inv.exchange_rate ?? 1,
      voucher_type: inv.voucher_type || "FC",
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
          myCompanies={myCompanies}
        />
      </div>
    </div>
  );
}
