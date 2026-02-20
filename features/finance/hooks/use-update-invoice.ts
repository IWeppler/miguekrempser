// features/finance/hooks/use-update-invoice.ts
"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { updateInvoice } from "@/features/finance/actions/update-invoice";
import { createProduct } from "@/features/stock/actions/create-product";
import { InvoiceSchema } from "../schemas/invoice-schema";
import { Invoice } from "../types";

type UpdateInvoicePayload = InvoiceSchema & { fileUrl?: string | null };

interface Props {
  invoice: Invoice | null;
  products: { id: string; name: string }[];
  file: File | null;
  onSuccess: () => void;
}

export function useUpdateInvoice({
  invoice,
  products,
  file,
  onSuccess,
}: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const supabase = createClient();

  const onSubmit = async (values: InvoiceSchema) => {
    if (!invoice) return;
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // 1. Procesar productos nuevos
      const processedItems = await Promise.all(
        values.items.map(async (item) => {
          const existingProduct = products.find((p) => p.id === item.productId);
          if (!existingProduct && item.productId) {
            const res = await createProduct({
              name: item.productId,
              category: "Insumos Varios",
              unit: "Unidad",
              currentStock: 0,
              minStockAlert: 0,
              description: "Alta automática desde Edición",
              averageCost: Number(item.unitPrice) || 0,
            });
            if (res.error) throw new Error(res.error);
            return { ...item, productId: res.data?.id };
          }
          return item;
        }),
      );

      // 2. Gestionar Archivo
      let fileUrl = invoice.file_url;
      if (file) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${Date.now()}_EDIT_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from("invoices")
          .upload(fileName, file);

        if (uploadError)
          throw new Error("Error upload: " + uploadError.message);

        const { data: urlData } = supabase.storage
          .from("invoices")
          .getPublicUrl(fileName);
        fileUrl = urlData.publicUrl;
      }

      // 3. Server Action
      const payload: UpdateInvoicePayload = {
        ...values,
        items: processedItems,
        fileUrl,
      };

      const result = await updateInvoice(invoice.id, payload);

      if (result.error) {
        setSubmitError(result.error);
      } else {
        onSuccess();
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Error desconocido";
      setSubmitError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return { onSubmit, isSubmitting, submitError };
}
