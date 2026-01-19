import { z } from "zod";

export const adjustmentSchema = z.object({
  productId: z.string(),

  // IN = Encontré stock (Suma) | OUT = Se rompió/Perdió (Resta)
  type: z.enum(["IN", "OUT"]),

  quantity: z.number().min(0.01, "La cantidad debe ser mayor a 0"),

  reason: z
    .string()
    .min(5, "Debés detallar el motivo del ajuste (mínimo 5 letras)"),
});

export type AdjustmentSchema = z.infer<typeof adjustmentSchema>;
