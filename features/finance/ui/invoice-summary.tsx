"use client";

import { useEffect } from "react";
import { Control, UseFormSetValue, useWatch } from "react-hook-form";
import { Coins, Loader2 } from "lucide-react";
import { InvoiceSchema } from "../schemas/invoice-schema";
import { useDolar } from "@/shared/hooks/use-dolar";
import { Input } from "@/shared/ui/input";
import { FormControl, FormField, FormItem } from "@/shared/ui/form";

interface Props {
  control: Control<InvoiceSchema>;
  setValue: UseFormSetValue<InvoiceSchema>;
}

export function InvoiceSummary({ control, setValue }: Props) {
  const { oficial, loading: loadingRate } = useDolar();

  // Observamos los cambios en los campos necesarios para el cálculo
  const currency = useWatch({ control, name: "currency" });
  const items = useWatch({ control, name: "items" });
  const exchangeRate = useWatch({ control, name: "exchangeRate" });

  // Cálculo del total dinámico
  const totalAmount =
    items?.reduce((acc, item) => {
      return acc + Number(item.quantity || 0) * Number(item.unitPrice || 0);
    }, 0) || 0;

  // Efecto para actualizar la cotización automáticamente
  useEffect(() => {
    if (currency === "USD") {
      setValue("exchangeRate", 1);
    } else if (currency === "ARS" && oficial?.venta) {
      setValue("exchangeRate", oficial.venta);
    }
  }, [currency, oficial, setValue]);

  return (
    <div className="w-full space-y-4">
      {/* Mensaje de Cotización ARS */}
      {currency === "ARS" && (
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-md animate-in fade-in slide-in-from-top-1">
          <div className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-yellow-600 shrink-0" />
            <div className="text-sm text-yellow-700 dark:text-yellow-400">
              {loadingRate ? (
                <span className="flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" /> Buscando
                  cotización oficial...
                </span>
              ) : (
                "Se aplicó la cotización oficial automáticamente."
              )}
            </div>
          </div>

          <FormField
            control={control}
            name="exchangeRate"
            render={({ field }) => (
              <FormItem className="w-full md:w-40 ml-auto">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold whitespace-nowrap opacity-70">
                    1 USD =
                  </span>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      {...field}
                      disabled={loadingRate}
                      className="h-8 bg-background font-mono text-right"
                      onChange={(e) =>
                        field.onChange(parseFloat(e.target.value) || 0)
                      }
                    />
                  </FormControl>
                </div>
              </FormItem>
            )}
          />
        </div>
      )}

      {/* Cuadro de Totales Finales */}
      <div className="flex justify-end">
        <div className="w-full md:w-72 space-y-3 bg-muted/30 p-4 rounded-lg border border-border">
          <div className="flex justify-between items-center text-lg font-bold text-foreground">
            <span>Total {currency}:</span>
            <span>
              {totalAmount.toLocaleString("es-AR", {
                minimumFractionDigits: 2,
              })}
            </span>
          </div>

          {currency === "ARS" && (
            <>
              <div className="h-px bg-border my-2" />
              <div className="flex justify-between items-center text-sm font-medium text-muted-foreground">
                <span>Cotización aplicada:</span>
                <span>$ {exchangeRate}</span>
              </div>
              <div className="flex justify-between items-center text-sm font-bold text-primary">
                <span>Equivalente USD:</span>
                <span>
                  {(totalAmount / (exchangeRate || 1)).toLocaleString("en-US", {
                    style: "currency",
                    currency: "USD",
                  })}
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
