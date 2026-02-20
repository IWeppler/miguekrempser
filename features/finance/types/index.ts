export interface Invoice {
  id: string;
  invoice_number: string;
  purchaser_company?: string | null;
  amount_total: number;
  currency: "USD" | "ARS" | string;
  status: "pending" | "paid" | "overdue" | string;
  date: string;
  due_date: string;
  file_url?: string | null;
  supplier_id: string;
  exchange_rate: number;
  suppliers: {
    id: string;
    name: string;
  } | null;
}
