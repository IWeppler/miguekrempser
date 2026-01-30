export interface Lot {
  id: string;
  name: string;
  field_name: string;
  hectares: number;
  description?: string | null;
  active_campaign?: {
    id: string;
    crop: string;
    campaign: string;
    status: string;
  } | null;
}

import { z } from "zod";

export const lotSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  field_name: z.string().min(1, "El campo es obligatorio"),
  hectares: z.coerce.number().positive("Las hectáreas deben ser mayor a 0"),
  description: z.string().optional(),
});

export type LotSchema = z.infer<typeof lotSchema>;

export interface CropCycle {
  id: string;
  lot_id: string;
  campaign: string;
  crop: string;
  status: "planned" | "active" | "harvested" | "closed";
  lots?: Lot;
}

export interface Labor {
  id: string;
  cycle_id: string;
  date: string;
  category: "pulverización" | "siembra" | "cosecha" | "fertilización";
  description: string;
  service_cost_ha: number;
  items?: LaborItem[];
}

export interface LaborItem {
  id: string;
  labor_id: string;
  product_id: string;
  product_name: string;
  dose_per_ha: number;
  price_unit: number;
  cost_per_ha: number;
}
