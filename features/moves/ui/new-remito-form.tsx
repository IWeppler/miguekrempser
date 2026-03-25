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
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/shared/ui/command";
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
  ChevronsUpDown,
  Check,
  User,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { cn } from "@/lib/utils";
import { IssuerCompany } from "../types";

type UnitType = "Litros" | "Kilos" | "Unidad" | "Bolsas";

interface Props {
  products: { id: string; name: string; unit: string }[];
  profiles: { id: string; full_name: string | null }[];
  issuerCompanies: IssuerCompany[];
  currentUserName?: string;
}

export function NewRemitoForm({
  products = [],
  profiles = [],
  issuerCompanies = [],
  currentUserName,
}: Props) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successData, setSuccessData] = useState<RemitoSchema | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [openTechCombo, setOpenTechCombo] = useState(false);
  const [techSearch, setTechSearch] = useState("");

  const form = useForm<RemitoSchema>({
    resolver: zodResolver(remitoSchema) as unknown as Resolver<RemitoSchema>,
    defaultValues: {
      orderNumber: "",
      technician: currentUserName || "",
      issuerCompanyId: "",
      destination: "",
      driver: "",
      plate: "",
      items: [{ productId: "", quantity: 1, batch: "", unit: "Litros" }],
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
            originalProduct.unit as UnitType,
          );
        }
      }
    });
  }, [watchedItems, products, form]);

  const onSubmit = async (values: RemitoSchema) => {
    if (isSubmitting) return;

    const productIds = values.items.map((i) => i.productId);
    if (productIds.length !== new Set(productIds).size) {
      setServerError("Error: Hay productos duplicados en la lista.");
      return;
    }

    setIsSubmitting(true);
    setServerError(null);

    const result = await createRemito(values);
    setIsSubmitting(false);

    if (result.success) {
      setSuccessData(values);
    } else {
      setServerError(result.error || "Error al procesar el remito.");
    }
  };

  if (successData) {
    const selectedIssuer = issuerCompanies.find(
      (c) => c.id === successData.issuerCompanyId,
    );

    return (
      <Card className="max-w-md mx-auto mt-10 text-center border-border bg-card animate-in fade-in zoom-in duration-300">
        <CardContent className="pt-6 space-y-4">
          <div className="mx-auto w-12 h-12 flex items-center justify-center rounded-full bg-primary/10">
            <CheckCircle2 className="h-6 w-6 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-primary">¡Remito Generado!</h2>
          <p className="text-muted-foreground text-sm">
            El stock ha sido actualizado correctamente.
          </p>

          <div className="pt-4 flex flex-col gap-3">
            <PDFDownloadLink
              document={
                <RemitoDocument
                  data={successData}
                  products={products}
                  issuer={selectedIssuer!}
                  createdAt={new Date().toISOString()}
                />
              }
              fileName={`REMITO-${successData.orderNumber || "DOC"}.pdf`}
              className="w-full"
            >
              {({ loading }) => (
                <Button
                  disabled={loading}
                  className="w-full bg-green-600 hover:bg-green-700 h-12 transition-all"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  {loading ? "Generando PDF..." : "Descargar PDF"}
                </Button>
              )}
            </PDFDownloadLink>

            <Button
              variant="ghost"
              onClick={() => router.push("/movimientos")}
              className="h-11"
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Volver al historial
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
          <Card className="shadow-sm border-border bg-card h-full">
            <CardHeader className="border-b border-border/50 p-4">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-primary">
                <FileText className="h-4 w-4" /> Información de Emisión
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="orderNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">
                        N° Receta / Orden
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ej: 0001-4500"
                          {...field}
                          className="h-9 text-sm"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="issuerCompanyId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Empresa Emisora</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="h-9 text-sm">
                            <SelectValue placeholder="Emisor..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {issuerCompanies.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* INGENIERO RESPONSABLE (COMBOBOX FLEXIBLE) */}
              <FormField
                control={form.control}
                name="technician"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="text-xs">
                      Ingeniero Responsable
                    </FormLabel>
                    <Popover
                      open={openTechCombo}
                      onOpenChange={setOpenTechCombo}
                    >
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            className={cn(
                              "w-full justify-between h-9 text-sm font-normal",
                              !field.value && "text-muted-foreground",
                            )}
                          >
                            {field.value || "Seleccionar o escribir nombre..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[400px] p-0" align="start">
                        <Command shouldFilter={false}>
                          <CommandInput
                            placeholder="Buscar o escribir ingeniero..."
                            value={techSearch}
                            onValueChange={setTechSearch}
                            className="h-9"
                          />
                          <CommandList>
                            <CommandEmpty className="p-0">
                              <div className="p-2 border-t border-border bg-muted/30">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="w-full justify-start text-xs text-primary gap-2"
                                  onClick={() => {
                                    form.setValue("technician", techSearch);
                                    setOpenTechCombo(false);
                                    setTechSearch("");
                                  }}
                                >
                                  <Plus className="h-3 w-3" /> Usar &quot;
                                  {techSearch}&quot;
                                </Button>
                              </div>
                            </CommandEmpty>
                            <CommandGroup heading="Usuarios Registrados">
                              {profiles
                                .filter((p) =>
                                  (p.full_name || "")
                                    .toLowerCase()
                                    .includes(techSearch.toLowerCase()),
                                )
                                .map((profile) => (
                                  <CommandItem
                                    key={profile.id}
                                    value={profile.full_name || ""}
                                    onSelect={() => {
                                      form.setValue(
                                        "technician",
                                        profile.full_name || "",
                                      );
                                      setOpenTechCombo(false);
                                      setTechSearch("");
                                    }}
                                    className="text-sm cursor-pointer"
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        profile.full_name === field.value
                                          ? "opacity-100"
                                          : "opacity-0",
                                      )}
                                    />
                                    <User className="mr-2 h-3 w-3 opacity-50" />
                                    {profile.full_name}
                                  </CommandItem>
                                ))}
                            </CommandGroup>

                            {techSearch &&
                              !profiles.some(
                                (p) =>
                                  p.full_name?.toLowerCase() ===
                                  techSearch.toLowerCase(),
                              ) && (
                                <CommandGroup heading="Nuevo Profesional">
                                  <CommandItem
                                    onSelect={() => {
                                      form.setValue("technician", techSearch);
                                      setOpenTechCombo(false);
                                      setTechSearch("");
                                    }}
                                    className="text-sm cursor-pointer text-primary font-medium"
                                  >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Usar &quot;{techSearch}&quot;
                                  </CommandItem>
                                </CommandGroup>
                              )}
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card className="shadow-sm border-border bg-card h-full">
            <CardHeader className="border-b border-border/50 p-4">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-orange-600">
                <Truck className="h-4 w-4" /> Logística de Entrega
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <FormField
                control={form.control}
                name="destination"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">
                      Destino Final (Campo/Lote)
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <MapPin className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          className="pl-9 h-9 text-sm"
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
                      <FormLabel className="text-xs">
                        Responsable Retiro
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Nombre"
                          {...field}
                          className="h-9 text-sm"
                        />
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
                      <FormLabel className="text-xs">Patente</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="AA 123 BB"
                          {...field}
                          className="h-9 text-sm uppercase font-mono"
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

        <Card className="shadow-sm border-border bg-card">
          <CardHeader className="border-b border-border/50 p-4">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-4 w-4" /> Detalle de Insumos
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="grid grid-cols-1 md:grid-cols-12 gap-3 p-4 bg-muted/10 rounded-lg border border-border relative group transition-colors hover:border-primary/20"
              >
                <div className="col-span-1 md:col-span-5">
                  <FormField
                    control={form.control}
                    name={`items.${index}.productId`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] uppercase font-bold text-muted-foreground">
                          Producto
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="h-9 text-sm bg-background">
                              <SelectValue placeholder="Elegir..." />
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
                      </FormItem>
                    )}
                  />
                </div>
                <div className="col-span-1 md:col-span-2">
                  <FormField
                    control={form.control}
                    name={`items.${index}.quantity`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] uppercase font-bold text-muted-foreground">
                          Cantidad
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            className="h-9 text-sm bg-background"
                            {...field}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                <div className="col-span-1 md:col-span-2">
                  <FormField
                    control={form.control}
                    name={`items.${index}.unit`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] uppercase font-bold text-muted-foreground">
                          U.M.
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            readOnly
                            className="h-9 text-sm bg-muted text-muted-foreground cursor-default"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                <div className="col-span-1 md:col-span-2">
                  <FormField
                    control={form.control}
                    name={`items.${index}.batch`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] uppercase font-bold text-muted-foreground">
                          Lote
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Opcional"
                            className="h-9 text-sm bg-background"
                            {...field}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                <div className="col-span-1 flex justify-end md:pt-6">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-muted-foreground hover:text-destructive"
                    onClick={() => remove(index)}
                    disabled={fields.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              className="w-full border-dashed border-2 py-6 text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all"
              onClick={() =>
                append({
                  productId: "",
                  quantity: 1,
                  batch: "",
                  unit: "Litros",
                })
              }
            >
              <Plus className="h-4 w-4 mr-2" /> Agregar otro ítem
            </Button>
            <FormField
              control={form.control}
              name="observations"
              render={({ field }) => (
                <FormItem className="mt-4">
                  <FormLabel className="text-xs">
                    Observaciones del Remito
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Ej: Precintos, estado del clima..."
                      className="bg-background min-h-[80px] text-sm resize-none"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4 pt-6 border-t border-border">
          <Button type="button" variant="ghost" onClick={() => router.back()}>
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="min-w-[220px] bg-primary shadow-lg transition-transform active:scale-95"
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
