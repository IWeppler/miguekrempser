export interface Product {
  id: string;
  name: string;
  category: string;
  current_stock: number;
  min_stock_alert: number;
  unit: string;
  location?: string | null;
  average_cost?: number | null;
  currency: "USD" | "ARS";
}
