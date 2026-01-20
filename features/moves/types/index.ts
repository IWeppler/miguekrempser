export interface Movement {
  id: string;
  created_at: string;
  type: "IN" | "OUT";
  quantity: number;
  technician_name: string | null;
  product_id: string;
  description: string | null;
  products: {
    name: string;
    category?: string;
  } | null;
}
