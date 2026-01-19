import { z } from "zod";

const itemSchema = z.object({
  productId: z.string().min(1, "Producto requerido"),
  batch: z.string().optional(),
  quantity: z.coerce.number().min(0.01, "La cantidad debe ser mayor a 0"),
  unit: z.enum(["Litros", "Kilos", "Unidad", "Bolsas"]).default("Unidad"),
  notes: z.string().optional(),
});

export const remitoSchema = z.object({
  // Datos Generales
  orderNumber: z.string().min(1, "Falta Nro de Orden"),
  technician: z.string().min(1, "Seleccioná un ingeniero"),

  // Datos Logísticos
  destination: z.string().min(1, "Indicá el destino"),
  driver: z.string().min(1, "Falta nombre de quien retira"),
  plate: z.string().optional().or(z.literal("")),
  // Items
  items: z.array(itemSchema).min(1, "Agregá al menos un producto"),
  observations: z.string().optional(),
});

export type RemitoSchema = z.infer<typeof remitoSchema>;
