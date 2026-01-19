"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { productSchema, type ProductSchema } from "../schemas/product-schema";
import { createProduct } from "../actions/create-product";

import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
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
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import {
  Loader2,
  Plus,
  Package,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

const CATEGORIES = [
  "Herbicidas",
  "Fungicidas",
  "Insecticidas",
  "Fertilizantes",
  "Semillas",
  "Combustibles",
  "Repuestos",
];
const UNITS = ["Litros", "Kilos", "Unidad", "Bolsas", "Bidones"];

export function CreateProductDialog() {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const form = useForm({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(productSchema) as any,
    defaultValues: {
      name: "",
      category: "",
      unit: "",
      currentStock: 0,
      minStockAlert: 10,
      location: "",
      description: "",
      averageCost: 0,
    },
  });

  const onSubmit = async (values: ProductSchema) => {
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    // Llamamos a la Server Action Real
    const result = await createProduct(values);
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

  // Limpiamos estados al abrir/cerrar
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
        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 shadow-sm transition-colors duration-200 cursor-pointer">
          <Plus className="h-4 w-4" /> Nuevo Producto
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[600px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            Alta de Nuevo Insumo
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Agregá un producto al catálogo maestro para controlar su stock.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 pt-4"
          >
            {/* MENSAJES DE ESTADO */}
            {submitError && (
              <Alert
                variant="destructive"
                className="bg-destructive/10 border-destructive/20 text-destructive"
              >
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{submitError}</AlertDescription>
              </Alert>
            )}

            {submitSuccess && (
              <Alert className="border-primary/20 bg-primary/10 text-primary">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <AlertTitle>¡Guardado!</AlertTitle>
                <AlertDescription>
                  El producto ya está en el sistema.
                </AlertDescription>
              </Alert>
            )}

            {/* NOMBRE Y CATEGORIA */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">
                      Nombre del Producto
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ej: Glifosato Premium 5L"
                        className="bg-background border-input"
                        {...field}
                      />
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
                    <FormLabel className="text-foreground">Categoría</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-background border-input">
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

            {/* STOCK INICIAL Y ALERTA */}
            <div className="grid grid-cols-3 gap-4 p-4 bg-muted/40 rounded-lg border border-border">
              <div className="col-span-1">
                <FormField
                  control={form.control}
                  name="unit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground">Unidad</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-background border-input">
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
                  name="currentStock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground">
                        Stock Inicial
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          className="bg-background border-input"
                          {...field}
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
                  name="minStockAlert"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-orange-600 dark:text-orange-400">
                        Alerta Mínimo
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          // Use manual orange styles for this specific warning input
                          className="bg-background border-orange-500/30 focus-visible:ring-orange-500"
                          {...field}
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
                  <FormLabel className="text-foreground">
                    Ubicación Física (Opcional)
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Package className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        className="pl-9 bg-background border-input"
                        placeholder="Ej: Galpón Sur - Estante 4B"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="pt-4 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                className="border-input text-foreground hover:bg-accent"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Guardar Producto
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
