import { z } from "zod";

export const rainfallSchema = z.object({
  date: z.date({ message: "La fecha es obligatoria" }),
  millimeters: z.coerce.number().positive("Los milímetros deben ser mayor a 0"),
  observations: z.string().optional(),
});

export type RainfallSchema = z.infer<typeof rainfallSchema>;
