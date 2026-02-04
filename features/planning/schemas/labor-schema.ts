import { z } from "zod";

export const laborSchema = z.object({
  date: z.date(),

  category: z.string().min(1, "Debes seleccionar o escribir un tipo de labor"),

  description: z.string().optional(),
  contractor_name: z.string().optional(),

  // Usamos coerce para convertir el input texto a número automáticamente
  service_cost_ha: z.coerce.number().min(0).default(0),

  items: z
    .array(
      z.object({
        productId: z.string().min(1, "Selecciona un producto"),
        dose: z.coerce.number().min(0, "La dosis debe ser mayor a 0"),
        price: z.coerce.number().min(0),
      }),
    )
    .optional()
    .default([]),
});

export type LaborSchema = z.infer<typeof laborSchema>;
