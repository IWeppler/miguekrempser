"use client";

import { useState } from "react";
import { useForm, useFieldArray, type Resolver } from "react-hook-form";
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
} from "lucide-react";

interface Props {
  products: { id: string; name: string }[];
  profiles: { id: string; full_name: string | null }[];
  currentUserEmail?: string;
  currentUserName?: string;
}

export function NewRemitoForm({ products, profiles, currentUserName }: Props) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successData, setSuccessData] = useState<RemitoSchema | null>(null);

  const form = useForm<RemitoSchema>({
    resolver: zodResolver(remitoSchema) as unknown as Resolver<RemitoSchema>,
    defaultValues: {
      orderNumber: "",
      technician: "",
      destination: "",
      driver: currentUserName || "",
      plate: "",
      // ACTUALIZADO: Agregamos unit por defecto
      items: [{ productId: "", quantity: 0, batch: "", unit: "Litros" }],
      observations: "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const onSubmit = async (values: RemitoSchema) => {
    setIsSubmitting(true);
    const result = await createRemito(values);
    setIsSubmitting(false);

    if (result.success) {
      setSuccessData(values);
    } else {
      alert("Error al guardar: " + result.error);
    }
  };

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
          <p className="text-green-700">
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
              fileName={`REMITO-${successData.orderNumber}.pdf`}
              className="w-full"
            >
              {({ loading }) => (
                <Button className="w-full bg-green-600 hover:bg-green-700 text-white gap-2 shadow-md transition-all">
                  <Printer className="h-4 w-4" />
                  {loading
                    ? "Generando PDF..."
                    : "Imprimir Comprobante (Policía)"}
                </Button>
              )}
            </PDFDownloadLink>

            <Button variant="outline" onClick={() => window.location.reload()}>
              Nuevo Movimiento
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6 max-w-4xl mx-auto pb-10"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* BLOQUE 1: DATOS DE LA ORDEN */}
          <Card className="shadow-sm border-border bg-card">
            <CardHeader className="pb-3 border-b border-border/50">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" /> Autorización /
                Orden
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <FormField
                control={form.control}
                name="orderNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>N° Receta Agronómica / Orden</FormLabel>
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

          {/* BLOQUE 2: LOGÍSTICA (POLICÍA) */}
          <Card className="shadow-sm border-border bg-card">
            <CardHeader className="pb-3 border-b border-border/50">
              <CardTitle className="text-base flex items-center gap-2">
                <Truck className="h-4 w-4 text-orange-600" /> Datos de Traslado
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <FormField
                control={form.control}
                name="destination"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> Destino (Lote/Campo)
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Lote 4 - El Tolar" {...field} />
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
                      <FormLabel>Chofer / Retira</FormLabel>
                      <FormControl>
                        <Input placeholder="Nombre apellido" {...field} />
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
                      <FormLabel>Patente Vehículo</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="AA 123 BB"
                          {...field}
                          className="uppercase"
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
          <CardHeader className="pb-3 flex flex-row items-center justify-between border-b border-border/50">
            <CardTitle className="text-base">Detalle de Carga</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              // ACTUALIZADO: unit por defecto al agregar fila
              onClick={() =>
                append({
                  productId: "",
                  quantity: 1,
                  batch: "",
                  unit: "Litros",
                })
              }
            >
              <Plus className="h-4 w-4 mr-2" /> Agregar Producto
            </Button>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-4">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="flex flex-col md:flex-row gap-4 items-start p-4 bg-muted/30 rounded-lg border border-border"
                >
                  <div className="flex-1 w-full">
                    <FormField
                      control={form.control}
                      name={`items.${index}.productId`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Producto</FormLabel>
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

                  <div className="flex gap-4 w-full md:w-auto">
                    <div className="w-24">
                      <FormField
                        control={form.control}
                        name={`items.${index}.quantity`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Cant.</FormLabel>
                            <FormControl>
                              {/* ACTUALIZADO: step="0.01" para decimales */}
                              <Input
                                type="number"
                                step="0.01"
                                {...field}
                                className="bg-background"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="w-28">
                      <FormField
                        control={form.control}
                        name={`items.${index}.unit`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Unidad</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger className="bg-background">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Litros">Litros</SelectItem>
                                <SelectItem value="Kilos">Kilos</SelectItem>
                                <SelectItem value="Unidad">Unidad</SelectItem>
                                <SelectItem value="Bolsas">Bolsas</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="w-28">
                      <FormField
                        control={form.control}
                        name={`items.${index}.batch`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">
                              Lote (Opc)
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="L-123"
                                className="bg-background"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div className="pt-0 md:pt-8 self-end md:self-start">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6">
              <FormField
                control={form.control}
                name="observations"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observaciones Generales</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Notas sobre el estado de la carga, clima, etc."
                        className="resize-none bg-background"
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="ghost" onClick={() => router.back()}>
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="min-w-[150px] bg-primary hover:bg-primary/90 shadow-md"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            Confirmar Salida
          </Button>
        </div>
      </form>
    </Form>
  );
}
