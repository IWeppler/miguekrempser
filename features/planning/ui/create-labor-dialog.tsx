"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, Loader2, Plus, Trash2, Sprout } from "lucide-react";
import { cn } from "@/lib/utils";
import { laborSchema, type LaborSchema } from "../schemas/labor-schema";
import { createLabor } from "../actions/labor-actions";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";
import { Calendar } from "@/shared/ui/calendar";

interface Product {
  id: string;
  name: string;
  average_cost: number;
}

interface Props {
  cycleId: string;
  lotId: string;
  products: Product[];
}

export function CreateLaborDialog({ cycleId, lotId, products }: Props) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm({
    resolver: zodResolver(laborSchema),
    defaultValues: {
      category: "pulverización",
      description: "",
      contractor_name: "",
      service_cost_ha: 0,
      items: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const onSubmit = async (values: LaborSchema) => {
    setIsSubmitting(true);
    const result = await createLabor(values, cycleId, lotId);
    setIsSubmitting(false);

    if (result.success) {
      setOpen(false);
      form.reset();
    } else {
      alert(result.error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="link" className="text-primary h-auto p-0 mt-1">
          + Registrar Labor / Aplicación
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registrar Labor</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* 1. DATOS GENERALES */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Fecha</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground",
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP", { locale: es })
                            ) : (
                              <span>Seleccionar fecha</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Labor</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pulverización">
                          Pulverización
                        </SelectItem>
                        <SelectItem value="siembra">Siembra</SelectItem>
                        <SelectItem value="fertilización">
                          Fertilización
                        </SelectItem>
                        <SelectItem value="cosecha">Cosecha</SelectItem>
                        <SelectItem value="monitoreo">
                          Monitoreo / Otros
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ej: Barbecho Largo, Aplicación Fungicida..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 2. COSTOS DE SERVICIO */}
            <div className="p-3 bg-muted/30 rounded-lg border border-border">
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                Costo de Servicio
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="contractor_name"
                  render={({ field: { value, ...fieldProps } }) => (
                    <FormItem>
                      <FormLabel className="text-xs">
                        Contratista (Opcional)
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Nombre o Propia"
                          {...fieldProps}
                          value={value || ""}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="service_cost_ha"
                  render={({ field: { value, onChange, ...fieldProps } }) => (
                    <FormItem>
                      <FormLabel className="text-xs">
                        Precio Labor (USD/Ha)
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...fieldProps}
                          type="number"
                          step="0.01"
                          value={(value as number) ?? ""}
                          onChange={(e) =>
                            onChange(parseFloat(e.target.value) || 0)
                          }
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* 3. INSUMOS (RECETA) */}
            <div className="p-3 bg-green-50/50 dark:bg-green-900/10 rounded-lg border border-green-200/50 dark:border-green-800/30">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  Insumos
                </h4>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ productId: "", dose: 0, price: 0 })}
                  className="h-7 text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" /> Agregar Producto
                </Button>
              </div>

              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="grid grid-cols-12 gap-2 items-end mb-3"
                >
                  {/* COLUMNA 1: PRODUCTO (5/12) */}
                  <div className="col-span-5">
                    <FormField
                      control={form.control}
                      name={`items.${index}.productId`}
                      render={({ field }) => (
                        <FormItem className="space-y-1">
                          <FormLabel className="text-[10px] uppercase text-muted-foreground">
                            Producto
                          </FormLabel>
                          <Select
                            onValueChange={(val) => {
                              field.onChange(val);
                              const prod = products.find((p) => p.id === val);
                              if (prod) {
                                form.setValue(
                                  `items.${index}.price`,
                                  prod.average_cost || 0,
                                );
                              }
                            }}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue placeholder="Seleccionar..." />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {products.map((p) => (
                                <SelectItem
                                  key={p.id}
                                  value={p.id}
                                  className="text-xs"
                                >
                                  {p.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* COLUMNA 2: DOSIS (3/12) */}
                  <div className="col-span-3">
                    <FormField
                      control={form.control}
                      name={`items.${index}.dose`}
                      render={({
                        field: { value, onChange, ...fieldProps },
                      }) => (
                        <FormItem className="space-y-1">
                          <FormLabel className="text-[10px] uppercase text-muted-foreground">
                            Dosis (Lt/Kg)
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...fieldProps}
                              type="number"
                              step="0.001"
                              className="h-8 text-xs"
                              value={(value as number) ?? ""}
                              onChange={(e) =>
                                onChange(parseFloat(e.target.value) || 0)
                              }
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* COLUMNA 3: PRECIO (3/12) */}
                  <div className="col-span-3">
                    <FormField
                      control={form.control}
                      name={`items.${index}.price`}
                      render={({
                        field: { value, onChange, ...fieldProps },
                      }) => (
                        <FormItem className="space-y-1">
                          <FormLabel className="text-[10px] uppercase text-muted-foreground">
                            Costo (USD)
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...fieldProps}
                              type="number"
                              step="0.01"
                              className="h-8 text-xs"
                              value={(value as number) ?? ""}
                              onChange={(e) =>
                                onChange(parseFloat(e.target.value) || 0)
                              }
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* COLUMNA 4: BORRAR (1/12) - ALINEADO */}
                  <div className="col-span-1 flex justify-center">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      // Ajuste: h-8 w-8 para igualar la altura exacta del input
                      className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-100"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}

              {fields.length === 0 && (
                <p className="text-xs text-muted-foreground italic text-center py-2">
                  Sin insumos (Solo labor mecánica)
                </p>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Sprout className="mr-2 h-4 w-4" />
                )}
                Guardar Labor
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
