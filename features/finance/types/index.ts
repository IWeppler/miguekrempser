export interface Invoice {
  id: string;
  invoice_number: string;
  amount_total: number;
  currency: "USD" | "ARS" | string;
  status: "pending" | "paid" | "overdue" | string;
  due_date: string;
  file_url?: string | null;
  suppliers: {
    id: string;
    name: string;
  } | null;
}
