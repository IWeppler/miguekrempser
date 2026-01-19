import { z } from "zod";

// Esquema para cada renglón de la factura
const invoiceItemSchema = z.object({
  productId: z.string().optional(), // Puede ser nulo si es un servicio genérico
  description: z.string().min(1, "Descripción requerida"),
  quantity: z.coerce.number().min(0, "Mínimo 0"),
  unitPrice: z.coerce.number().min(0, "Mínimo 0"),
});

export const invoiceSchema = z.object({
  // Encabezado
  supplierId: z.string().optional(),
  newSupplierName: z.string().optional(),
  invoiceNumber: z.string().min(1, "El número es requerido"),
  dueDate: z.date({ message: "Fecha requerida" }),

  // Moneda
  currency: z.enum(["USD", "ARS"]),
  exchangeRate: z.coerce.number().min(1).default(1),

  // Detalles
  description: z.string().optional(),
  items: z.array(invoiceItemSchema).min(1, "Agrega al menos un ítem"),
});

export type InvoiceSchema = z.infer<typeof invoiceSchema>;
