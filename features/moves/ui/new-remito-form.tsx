"use client";

import { useState, useEffect } from "react";
import {
  useForm,
  useFieldArray,
  useWatch,
  type Resolver,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  remitoSchema,
  type RemitoSchema,
} from "@/features/moves/schemas/remito-schema";
import { createRemito } from "@/features/moves/actions/create-remito";
import { useRouter } from "next/navigation";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { RemitoDocument } from "@/features/moves/components/remito-pdf";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/ui/form";
import { Input } from "@/shared/ui/input";
import { Button } from "@/shared/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { Textarea } from "@/shared/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import {
  Plus,
  Trash2,
  Printer,
  CheckCircle2,
  Loader2,
  Truck,
  FileText,
  MapPin,
  ArrowLeft,
  Download,
  AlertCircle,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";

interface Props {
  products: { id: string; name: string; unit: string }[];
  profiles: { id: string; full_name: string | null }[];
  currentUserEmail?: string;
  currentUserName?: string;
}

export function NewRemitoForm({ products, profiles, currentUserName }: Props) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successData, setSuccessData] = useState<RemitoSchema | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<RemitoSchema>({
    resolver: zodResolver(remitoSchema) as unknown as Resolver<RemitoSchema>,
    defaultValues: {
      orderNumber: "",
      technician: "",
      destination: "",
      driver: currentUserName || "",
      plate: "",
      items: [{ productId: "", quantity: 0, batch: "", unit: "Litros" }],
      observations: "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const watchedItems = useWatch({
    control: form.control,
    name: "items",
  });

  useEffect(() => {
    (watchedItems || []).forEach((item, index) => {
      if (item.productId) {
        const originalProduct = products.find((p) => p.id === item.productId);

        if (originalProduct && originalProduct.unit !== item.unit) {
          form.setValue(
            `items.${index}.unit`, 
            originalProduct.unit as "Litros" | "Kilos" | "Unidad" | "Bolsas"
          );
          
        }
      }
    });
  }, [watchedItems, products, form]);

  const onSubmit = async (values: RemitoSchema) => {
    if (isSubmitting) return;
    // 1. VALIDACIÓN DE DUPLICADOS EN FRONTEND
    const productIds = values.items.map((i) => i.productId);
    const uniqueIds = new Set(productIds);
    if (productIds.length !== uniqueIds.size) {
      setServerError(
        "Error: Hay productos duplicados en la lista. Por favor unifícalos.",
      );
      return;
    }

    setIsSubmitting(true);
    setServerError(null);

    const result = await createRemito(values);
    setIsSubmitting(false);

    if (result.success) {
      setSuccessData(values);
    } else {
      setServerError(
        typeof result.error === "string" ? result.error : "Error desconocido",
      );
    }
  };

  // --- PANTALLA DE ÉXITO ---
  if (successData) {
    return (
      <Card className="max-w-md mx-auto mt-10 text-center border-green-200 bg-green-50 animate-in fade-in zoom-in duration-300">
        <CardContent className="pt-6 space-y-4">
          <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle2 className="h-6 w-6 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-green-800">
            ¡Remito Generado!
          </h2>
          <p className="text-green-700 text-sm">
            El stock ha sido descontado correctamente.
          </p>

          <div className="pt-4 flex flex-col gap-3">
            <PDFDownloadLink
              document={
                <RemitoDocument
                  data={successData}
                  products={products}
                  createdAt={new Date().toISOString()}
                />
              }
              fileName={`REMITO-${successData.orderNumber || "borrador"}.pdf`}
              className="w-full"
            >
              {({ loading }) => (
                <Button
                  disabled={loading}
                  className="w-full bg-green-600 hover:bg-green-700 text-white gap-2 shadow-md transition-all h-12"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  {loading ? "Generando..." : "Descargar PDF"}
                </Button>
              )}
            </PDFDownloadLink>

            <Button
              variant="outline"
              onClick={() => router.push("/movimientos")}
              className="h-11"
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Volver al Historial
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // --- FORMULARIO ---
  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6 max-w-5xl mx-auto pb-10"
      >
        {serverError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{serverError}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* BLOQUE 1: DATOS DE LA ORDEN */}
          <Card className="shadow-sm border-border bg-card h-full">
            <CardHeader className="border-b border-border/50">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" /> Autorización
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <FormField
                control={form.control}
                name="orderNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>N° Receta / Orden</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: 0001-4500" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="technician"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ingeniero Responsable</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {profiles.map((p) => (
                          <SelectItem
                            key={p.id}
                            value={p.full_name || "Sin nombre"}
                          >
                            {p.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* BLOQUE 2: LOGÍSTICA */}
          <Card className="shadow-sm border-border bg-card h-full">
            <CardHeader className="border-b border-border/50">
              <CardTitle className="text-base flex items-center gap-2">
                <Truck className="h-4 w-4 text-orange-600" /> Logística
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <FormField
                control={form.control}
                name="destination"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Destino (Campo/Lote)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <MapPin className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          className="pl-9"
                          placeholder="Lote 4 - El Tolar"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="driver"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Responsable</FormLabel>
                      <FormControl>
                        <Input placeholder="Nombre" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="plate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Patente</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="AA 123 BB"
                          {...field}
                          className="uppercase font-mono"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* BLOQUE 3: CARGA DE PRODUCTOS */}
        <Card className="shadow-sm border-border bg-card">
          <CardHeader className="border-b border-border/50">
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" /> Detalle de
              Carga
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            {/* Lista de Items */}
            <div className="space-y-3">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start p-4 bg-muted/30 rounded-lg border border-border hover:border-primary/40 transition-colors"
                >
                  {/* Producto */}
                  <div className="col-span-1 md:col-span-5">
                    <FormField
                      control={form.control}
                      name={`items.${index}.productId`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs text-muted-foreground">
                            Producto
                          </FormLabel>
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
                              {products.map((p) => (
                                <SelectItem key={p.id} value={p.id}>
                                  {p.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Cantidad */}
                  <div className="col-span-1 md:col-span-2">
                    <FormField
                      control={form.control}
                      name={`items.${index}.quantity`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs text-muted-foreground">
                            Cantidad
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              className="bg-background"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Unidad */}
                  <div className="col-span-1 md:col-span-2">
                    <FormField
                      control={form.control}
                      name={`items.${index}.unit`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs text-muted-foreground">
                            Unidad
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              readOnly
                              className="bg-muted text-muted-foreground cursor-not-allowed focus-visible:ring-0"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Lote */}
                  <div className="col-span-1 md:col-span-2">
                    <FormField
                      control={form.control}
                      name={`items.${index}.batch`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs text-muted-foreground">
                            Lote
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Opcional"
                              className="bg-background text-sm"
                              {...field}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Botón Borrar */}
                  <div className="col-span-1 flex justify-end md:pt-8">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* BOTÓN AGREGAR  */}
            <div className="mt-2">
              <Button
                type="button"
                variant="outline"
                className="w-full border-dashed border-2 py-2 text-muted-foreground hover:text-primary hover:border-primary/50 hover:bg-primary/5"
                onClick={() =>
                  append({
                    productId: "",
                    quantity: 1,
                    batch: "",
                    unit: "Litros",
                  })
                }
              >
                <Plus className="h-4 w-4 mr-2" /> Agregar otro producto
              </Button>
            </div>

            {/* Observaciones */}
            <div className="mt-6">
              <FormField
                control={form.control}
                name="observations"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observaciones (Opcional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Notas sobre el clima, estado del camión, etc."
                        className="resize-none bg-background min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* FOOTER DE ACCIONES */}
        <div className="flex justify-end gap-4 pt-4 border-t border-border">
          <Button type="button" variant="ghost" onClick={() => router.back()}>
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="min-w-[180px] bg-primary hover:bg-primary/90 shadow-lg"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Printer className="h-4 w-4 mr-2" />
            )}
            Generar Remito
          </Button>
        </div>
      </form>
    </Form>
  );
}
