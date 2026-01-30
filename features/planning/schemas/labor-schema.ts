import { z } from "zod";

export const laborSchema = z.object({
  date: z.date(),
  category: z.enum([
    "pulverización",
    "siembra",
    "cosecha",
    "fertilización",
    "monitoreo",
  ] as const),
  description: z.string().min(1, "Describe la labor (ej: Barbecho Corto)"),
  contractor_name: z.string().optional(),

  // z.coerce permite entrada string (del input HTML) y salida number
  service_cost_ha: z.coerce
    .number()
    .min(0, "El costo no puede ser negativo")
    .default(0),

  items: z
    .array(
      z.object({
        productId: z.string().min(1, "Selecciona un producto"),
        dose: z.coerce.number().positive("La dosis debe ser mayor a 0"),
        price: z.coerce.number().min(0, "El precio no puede ser negativo"),
      }),
    )
    .optional()
    .default([]),
});

export type LaborSchema = z.infer<typeof laborSchema>;
