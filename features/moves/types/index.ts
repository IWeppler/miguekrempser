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

export interface IssuerCompany {
  id: string;
  name: string;
  address: string;
  phone: string;
  cuit: string;
  iib: string;
  inicio_act: string;
  initials: string;
  iva_condition?: string;
  cai_number?: string;
  cai_expiration?: string;
}
