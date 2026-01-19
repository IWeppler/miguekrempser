"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  adjustmentSchema,
  type AdjustmentSchema,
} from "../schemas/adjustment-schema";
import { createAdjustment } from "../actions/create-adjustment";

import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Textarea } from "@/shared/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { RadioGroup, RadioGroupItem } from "@/shared/ui/radio-group";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import {
  Loader2,
  Wrench,
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

interface Props {
  products: { id: string; name: string; current_stock: number }[];
}

export function CreateAdjustmentDialog({ products }: Props) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const form = useForm<AdjustmentSchema>({
    resolver: zodResolver(adjustmentSchema),
    defaultValues: {
      type: "OUT",
      quantity: 0,
      reason: "",
    },
  });

  const onSubmit = async (values: AdjustmentSchema) => {
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    const result = await createAdjustment(values);
    setIsSubmitting(false);

    if (result.error) {
      setSubmitError(result.error);
    } else {
      setSubmitSuccess(true);
      setTimeout(() => {
        setOpen(false);
        setTimeout(() => {
          form.reset();
          setSubmitSuccess(false);
        }, 300);
      }, 1500);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setSubmitError(null);
      setSubmitSuccess(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="text-muted-foreground border-dashed border-border hover:bg-accent hover:text-foreground"
        >
          <Wrench className="mr-2 h-4 w-4" /> Ajuste Manual
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[500px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            Ajuste de Stock Manual
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Usar solo para correcciones de inventario (roturas, conteo,
            sobrantes).
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-5 pt-2"
          >
            {/* ALERTAS */}
            {submitError && (
              <Alert
                variant="destructive"
                className="bg-destructive/10 text-destructive border-destructive/20"
              >
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{submitError}</AlertDescription>
              </Alert>
            )}
            {submitSuccess && (
              <Alert className="border-primary/20 bg-primary/10 text-primary">
                <CheckCircle2 className="h-4 w-4" />
                <AlertTitle>Ajuste Realizado</AlertTitle>
                <AlertDescription>
                  El stock ha sido actualizado.
                </AlertDescription>
              </Alert>
            )}

            {/* 1. SELECCIÓN DE PRODUCTO */}
            <FormField
              control={form.control}
              name="productId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">
                    Producto a Ajustar
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="bg-background border-input">
                        <SelectValue placeholder="Buscar producto..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {products.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name} (Stock: {p.current_stock})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 2. TIPO DE AJUSTE (RADIO BUTTONS) */}
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel className="text-foreground">
                    Tipo de Movimiento
                  </FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="grid grid-cols-2 gap-4"
                    >
                      {/* OPCIÓN SALIDA */}
                      <FormItem>
                        <FormControl>
                          <div
                            className={`
                                flex items-center justify-between rounded-md border-2 p-4 cursor-pointer transition-all hover:bg-accent
                                ${
                                  field.value === "OUT"
                                    ? "border-orange-500 bg-orange-500/10"
                                    : "border-border bg-card"
                                }
                            `}
                            onClick={() => field.onChange("OUT")}
                          >
                            <div className="flex items-center gap-2">
                              <RadioGroupItem
                                value="OUT"
                                id="r-out"
                                className="sr-only"
                              />
                              <ArrowDown
                                className={`h-5 w-5 ${
                                  field.value === "OUT"
                                    ? "text-orange-600"
                                    : "text-muted-foreground"
                                }`}
                              />
                              <div className="flex flex-col">
                                <span className="font-semibold text-sm text-foreground">
                                  Salida / Resta
                                </span>
                                <span className="text-[10px] text-muted-foreground">
                                  Rotura, pérdida, error
                                </span>
                              </div>
                            </div>
                          </div>
                        </FormControl>
                      </FormItem>

                      {/* OPCIÓN INGRESO */}
                      <FormItem>
                        <FormControl>
                          <div
                            className={`
                                flex items-center justify-between rounded-md border-2 p-4 cursor-pointer transition-all hover:bg-accent
                                ${
                                  field.value === "IN"
                                    ? "border-primary bg-primary/10"
                                    : "border-border bg-card"
                                }
                            `}
                            onClick={() => field.onChange("IN")}
                          >
                            <div className="flex items-center gap-2">
                              <RadioGroupItem
                                value="IN"
                                id="r-in"
                                className="sr-only"
                              />
                              <ArrowUp
                                className={`h-5 w-5 ${
                                  field.value === "IN"
                                    ? "text-primary"
                                    : "text-muted-foreground"
                                }`}
                              />
                              <div className="flex flex-col">
                                <span className="font-semibold text-sm text-foreground">
                                  Entrada / Suma
                                </span>
                                <span className="text-[10px] text-muted-foreground">
                                  Sobrante, hallazgo
                                </span>
                              </div>
                            </div>
                          </div>
                        </FormControl>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 3. CANTIDAD */}
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">
                    Cantidad a ajustar
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={field.value}
                      onChange={(e) =>
                        field.onChange(parseFloat(e.target.value) || 0)
                      }
                      className="font-bold text-lg bg-background border-input"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 4. MOTIVO (TEXTAREA) */}
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">
                    Motivo (Obligatorio)
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Ej: Se encontró bolsa rota en el fondo del galpón..."
                      className="resize-none bg-background border-input"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className={`text-white ${
                  form.getValues("type") === "OUT"
                    ? "bg-orange-600 hover:bg-orange-700"
                    : "bg-primary hover:bg-primary/90 text-primary-foreground"
                }`}
              >
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Confirmar Ajuste
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
