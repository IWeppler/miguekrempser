"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { createProduct } from "@/features/stock/actions/create-product";
import { createInvoice } from "@/features/finance/actions/create-invoice";
import { InvoiceSchema } from "../schemas/invoice-schema";

interface UseCreateInvoiceProps {
  products: { id: string; name: string }[];
  file: File | null;
  onSuccess: () => void;
}

export function useCreateInvoice({ products, file, onSuccess }: UseCreateInvoiceProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const supabase = createClient();

  const onSubmit = async (values: InvoiceSchema) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // 1. PROCESAR PRODUCTOS NUEVOS (Alta automática)
      const processedItems = await Promise.all(
        values.items.map(async (item) => {
          const existingProduct = products.find((p) => p.id === item.productId);

          // Si el productId no coincide con uno existente, asumimos que es el nombre de uno nuevo
          if (!existingProduct && item.productId) {
            const newProductResult = await createProduct({
              name: item.productId,
              category: "Insumos Varios",
              unit: "Unidad",
              currentStock: 0,
              minStockAlert: 0,
              description: "Alta automática desde Factura",
              averageCost: Number(item.unitPrice) || 0,
            });

            if (newProductResult.error || !newProductResult.data) {
              throw new Error(`Error al crear producto "${item.productId}": ${newProductResult.error}`);
            }

            return { ...item, productId: newProductResult.data.id };
          }
          return item;
        })
      );

      // 2. GESTIÓN DE ARCHIVO EN STORAGE
      let fileUrl = null;
      if (file) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 11)}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("invoices")
          .upload(filePath, file);

        if (uploadError) throw new Error("Error al subir archivo: " + uploadError.message);

        const { data: urlData } = supabase.storage
          .from("invoices")
          .getPublicUrl(filePath);

        fileUrl = urlData.publicUrl;
      }

      // 3. EJECUTAR SERVER ACTION
      const payload = { ...values, items: processedItems, fileUrl };
      const result = await createInvoice(payload);

      if (result.error) {
        setSubmitError(result.error);
      } else {
        onSuccess();
      }
    } catch (error: unknown) {
      console.error(error);
      setSubmitError(error instanceof Error ? error.message : "Error desconocido");
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    onSubmit,
    isSubmitting,
    submitError,
  };
}