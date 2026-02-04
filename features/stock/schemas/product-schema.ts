import { z } from "zod";

// Definimos las reglas de validación (El objeto real)
export const productSchema = z.object({
  name: z.string().min(2, "El nombre es requerido"),
  category: z.string().min(1, "Selecciona una categoría"),
  unit: z.string().min(1, "Selecciona una unidad"),

  // FORMULARIO USA CAMELCASE
  currentStock: z.coerce.number().min(0).default(0),
  minStockAlert: z.coerce.number().min(0).default(0),
  averageCost: z.coerce.number().min(0).default(0),

  location: z.string().optional(),
  description: z.string().optional(),
});

export type ProductSchema = z.infer<typeof productSchema>;
