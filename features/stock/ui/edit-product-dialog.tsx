"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { productSchema, type ProductSchema } from "../schemas/product-schema";
import { updateProduct } from "../actions/update-product";
import { Product } from "../types";

import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import {
  Dialog,
  DialogContent,
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
import { Edit, Loader2, Save, Package } from "lucide-react";

// Reutilizamos las constantes para consistencia
const CATEGORIES = [
  "Herbicidas",
  "Fungicidas",
  "Insecticidas",
  "Fertilizantes",
  "Semillas",
  "Combustibles",
  "Repuestos",
  "Insumos Varios", // Agregado por si viene de la creación rápida
];
const UNITS = ["Litros", "Kilos", "Unidad", "Bolsas", "Bidones"];

export function EditProductDialog({ product }: { product: Product }) {
  const [open, setOpen] = useState(false);

  const form = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: product.name,
      category: product.category,
      unit: product.unit,

      // La coerción funciona mejor así
      currentStock: Number(product.current_stock || 0),
      minStockAlert: Number(product.min_stock_alert || 0),
      averageCost: Number(product.average_cost || 0),

      location: product.location || "",
      description: product.description || "",
    },
  });

  const { isSubmitting } = form.formState;

  const onSubmit = async (values: ProductSchema) => {
    const result = await updateProduct({
      id: product.id,
      name: values.name,
      category: values.category,
      unit: values.unit,
      location: values.location,

      // Conversión Form -> Action
      min_stock_alert: values.minStockAlert,
      average_cost: values.averageCost,

      currency: product.currency || "USD",
      description: values.description,
    });

    if (result.success) {
      setOpen(false);
    } else {
      alert("Error al actualizar: " + result.error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 hover:bg-muted text-muted-foreground hover:text-primary"
        >
          <Edit className="h-4 w-4" />
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[600px] bg-card border-border">
        <DialogHeader>
          <DialogTitle>Editar {product.name}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 pt-4"
          >
            {/* NOMBRE Y CATEGORIA */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre</FormLabel>
                    <FormControl>
                      <Input {...field} className="bg-background" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoría</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-background">
                          <SelectValue placeholder="Seleccionar..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CATEGORIES.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* UNIDAD, ALERTA Y COSTO */}
            <div className="grid grid-cols-3 gap-4 p-4 bg-muted/40 rounded-lg border border-border">
              <div className="col-span-1">
                <FormField
                  control={form.control}
                  name="unit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unidad</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-background">
                            <SelectValue placeholder="Ud." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {UNITS.map((u) => (
                            <SelectItem key={u} value={u}>
                              {u}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="col-span-1">
                <FormField
                  control={form.control}
                  name="minStockAlert"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-orange-600">
                        Alerta Mín.
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          className="bg-background border-orange-500/30"
                          name={field.name}
                          ref={field.ref}
                          onBlur={field.onBlur}
                          disabled={field.disabled}
                          value={(field.value as number) ?? 0}
                          onChange={(e) =>
                            field.onChange(parseFloat(e.target.value) || 0)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="col-span-1">
                <FormField
                  control={form.control}
                  name="averageCost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Costo Prom.</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          className="bg-background"
                          name={field.name}
                          ref={field.ref}
                          onBlur={field.onBlur}
                          disabled={field.disabled}
                          value={(field.value as number) ?? 0}
                          onChange={(e) =>
                            field.onChange(parseFloat(e.target.value) || 0)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* UBICACION */}
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ubicación Física</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Package className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        className="pl-9 bg-background"
                        placeholder="Ej: Galpón Sur"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* NOTA: Stock Actual no se edita aquí, se edita por ajuste manual o facturas */}

            <div className="pt-4 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" /> Guardar Cambios
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
