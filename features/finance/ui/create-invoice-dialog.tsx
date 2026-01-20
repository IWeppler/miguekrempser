"use client";

import { useState, useEffect, useRef } from "react";
import {
  useForm,
  useFieldArray,
  useWatch,
  type Resolver,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { invoiceSchema, type InvoiceSchema } from "../schemas/invoice-schema";
import { createInvoice } from "@/features/finance/actions/create-invoice";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

// UI Imports
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
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";
import { Calendar } from "@/shared/ui/calendar";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import {
  CalendarIcon,
  Loader2,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Coins,
  UploadCloud,
  FileIcon,
  X,
} from "lucide-react";
import { useDolar } from "@/shared/hooks/use-dolar";
import { createClient } from "@/lib/supabase/client";

interface Props {
  products: { id: string; name: string }[];
  suppliers: { id: string; name: string }[];
}

export function CreateInvoiceDialog({ products, suppliers }: Props) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isNewSupplier, setIsNewSupplier] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const supabase = createClient();
  const { oficial, loading: loadingRate } = useDolar();

  const form = useForm<InvoiceSchema>({
    resolver: zodResolver(invoiceSchema) as unknown as Resolver<InvoiceSchema>,
    defaultValues: {
      currency: "USD",
      exchangeRate: 1,
      items: [{ description: "", quantity: 1, unitPrice: 0 }],
      invoiceNumber: "",
      newSupplierName: "",
      description: "",
      supplierId: undefined,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const currency = useWatch({ control: form.control, name: "currency" });
  const items = useWatch({ control: form.control, name: "items" });
  const exchangeRate = useWatch({
    control: form.control,
    name: "exchangeRate",
  });

  const totalAmount =
    items?.reduce((acc, item) => {
      return acc + Number(item.quantity || 0) * Number(item.unitPrice || 0);
    }, 0) || 0;

  useEffect(() => {
    if (currency === "USD") {
      form.setValue("exchangeRate", 1);
    } else if (currency === "ARS") {
      if (oficial?.venta) {
        form.setValue("exchangeRate", oficial.venta);
      }
    }
  }, [currency, oficial, form]);

  const onSubmit = async (values: InvoiceSchema) => {
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    try {
      let fileUrl = null;

      if (file) {
        setIsUploading(true);
        const fileExt = file.name.split(".").pop();
        const fileName = `${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("invoices")
          .upload(filePath, file);

        if (uploadError)
          throw new Error("Error al subir archivo: " + uploadError.message);

        const { data: urlData } = supabase.storage
          .from("invoices")
          .getPublicUrl(filePath);

        fileUrl = urlData.publicUrl;
        setIsUploading(false);
      }

      const payload = { ...values, fileUrl };
      const result = await createInvoice(payload);

      if (result.error) {
        setSubmitError(result.error);
      } else {
        setSubmitSuccess(true);
        setTimeout(() => {
          setOpen(false);
          form.reset();
          setFile(null);
          setSubmitSuccess(false);
        }, 1500);
      }
    } catch (error: unknown) {
      console.error(error);
      let msg = "Error desconocido";
      if (error instanceof Error) msg = error.message;
      setSubmitError(msg);
    } finally {
      setIsSubmitting(false);
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground h-10 shadow-sm px-3 md:px-4">
          <Plus className="h-5 w-5 md:mr-2 md:h-4 md:w-4" />
          <span className="hidden md:inline">Cargar Factura</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="w-full max-w-[95vw] sm:max-w-[900px] max-h-[90vh] overflow-y-auto bg-card border-border p-4 md:p-6">
        <DialogHeader>
          <DialogTitle>Nueva Factura de Compra</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* 1. ENCABEZADO (Proveedor, Nro, Fecha, Moneda) */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 bg-muted/30 rounded-lg border border-border">
              {/* Proveedor (Col 1-12 en móvil, 1-4 en desktop) */}
              <div className="col-span-1 md:col-span-4 space-y-2">
                <div className="flex items-center justify-between">
                  <FormLabel>Proveedor</FormLabel>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-5 text-[10px] px-1 text-primary hover:text-primary/80"
                    onClick={() => {
                      setIsNewSupplier(!isNewSupplier);
                      form.setValue("supplierId", undefined);
                      form.setValue("newSupplierName", "");
                    }}
                  >
                    {isNewSupplier ? "Elegir existente" : "+ Crear nuevo"}
                  </Button>
                </div>
                {isNewSupplier ? (
                  <FormField
                    control={form.control}
                    name="newSupplierName"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            placeholder="Nombre empresa..."
                            {...field}
                            className="bg-background"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : (
                  <FormField
                    control={form.control}
                    name="supplierId"
                    render={({ field }) => (
                      <FormItem>
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
                            {suppliers.map((s) => (
                              <SelectItem key={s.id} value={s.id}>
                                {s.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              {/* Nro Factura (Col 1-12 en móvil, 5-7 en desktop) */}
              <div className="col-span-1 md:col-span-3">
                <FormField
                  control={form.control}
                  name="invoiceNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nro. Comprobante</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="A-0001-XXXX"
                          {...field}
                          className="bg-background"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Fecha (Col 1-12 en móvil, 8-10 en desktop) */}
              <div className="col-span-1 md:col-span-3">
                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vencimiento</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal bg-background",
                                !field.value && "text-muted-foreground",
                              )}
                            >
                              {field.value ? (
                                format(field.value, "dd/MM/yyyy")
                              ) : (
                                <span>Fecha</span>
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
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Moneda (Col 1-12 en móvil, 11-12 en desktop) */}
              <div className="col-span-1 md:col-span-2">
                <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Moneda</FormLabel>
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
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="ARS">ARS ($)</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* COTIZACIÓN (Solo si es ARS) */}
            {currency === "ARS" && (
              <div className="flex flex-col md:flex-row items-start md:items-center gap-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-md animate-in fade-in slide-in-from-top-1">
                <div className="flex items-center gap-2">
                  <Coins className="h-5 w-5 text-yellow-600 shrink-0" />
                  <div className="text-sm text-yellow-700 dark:text-yellow-400">
                    La factura está en Pesos.
                    {loadingRate ? (
                      <span className="ml-1 inline-flex items-center">
                        <Loader2 className="h-3 w-3 animate-spin mr-1" />{" "}
                        Buscando cotización...
                      </span>
                    ) : (
                      <span>
                        {" "}
                        Se aplicó la cotización oficial del día automáticamente.
                      </span>
                    )}
                  </div>
                </div>
                <FormField
                  control={form.control}
                  name="exchangeRate"
                  render={({ field }) => (
                    <FormItem className="w-full md:w-32 mb-0 ml-auto">
                      <FormLabel className="text-xs md:hidden">
                        Cotización (1 USD =)
                      </FormLabel>
                      <div className="flex items-center gap-2">
                        <span className="text-xs hidden md:block whitespace-nowrap">
                          Cotización (1 USD =):
                        </span>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            {...field}
                            disabled={loadingRate}
                            className="bg-background font-mono font-bold text-right"
                            onChange={(e) =>
                              field.onChange(parseFloat(e.target.value))
                            }
                          />
                        </FormControl>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* COMPROBANTE DIGITAL */}
            <div className="p-4 bg-muted/30 rounded-lg border border-border border-dashed">
              <div className="flex flex-col gap-3">
                <FormLabel>Comprobante Digital (Foto/PDF)</FormLabel>
                {!file ? (
                  <div
                    className="flex flex-col items-center justify-center h-24 border-2 border-dashed border-muted-foreground/25 rounded-lg bg-background hover:bg-muted/50 transition-colors cursor-pointer text-center p-4"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <UploadCloud className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-xs text-muted-foreground font-medium">
                      Click para subir imagen o PDF
                    </p>
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/*,application/pdf"
                      onChange={(e) => {
                        if (e.target.files?.[0]) setFile(e.target.files[0]);
                      }}
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-3 bg-background border border-border rounded-md">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="h-10 w-10 bg-primary/10 rounded flex items-center justify-center shrink-0">
                        <FileIcon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {file.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setFile(null);
                        if (fileInputRef.current)
                          fileInputRef.current.value = "";
                      }}
                    >
                      <X className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* 2. DETALLE DE ÍTEMS (Tabla Dinámica - Adaptada para móvil) */}
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm font-semibold text-foreground">
                <span>Detalle de Productos</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    append({ description: "", quantity: 1, unitPrice: 0 })
                  }
                  className="h-8 text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" /> Agregar Ítem
                </Button>
              </div>

              <div className="space-y-4 md:space-y-0 md:rounded-md md:border md:border-border md:overflow-hidden">
                {/* Encabezado de tabla solo en desktop */}
                <div className="hidden md:grid md:grid-cols-12 bg-muted text-muted-foreground font-medium text-sm border-b border-border">
                  <div className="col-span-4 px-3 py-2">Producto (Stock)</div>
                  <div className="col-span-4 px-3 py-2">
                    Descripción Factura
                  </div>
                  <div className="col-span-1 px-3 py-2 text-right">Cant.</div>
                  <div className="col-span-2 px-3 py-2 text-right">Precio</div>
                  <div className="col-span-1 px-3 py-2"></div>
                </div>

                {fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-0 p-4 md:p-0 bg-card border border-border rounded-lg md:rounded-none md:border-0 md:border-b md:border-border last:border-0 relative hover:bg-muted/50 transition-colors items-start md:items-center"
                  >
                    {/* Botón eliminar en móvil (arriba a la derecha) */}
                    <div className="absolute top-2 right-2 md:hidden">
                      {fields.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => remove(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    {/* SELECTOR PRODUCTO */}
                    <div className="md:col-span-4 md:p-2 md:align-top">
                      <FormField
                        control={form.control}
                        name={`items.${index}.productId`}
                        render={({ field }) => (
                          <FormItem className="mb-0">
                            <FormLabel className="md:hidden text-xs">
                              Producto
                            </FormLabel>
                            <Select
                              onValueChange={(val) => {
                                field.onChange(val);
                                const prod = products.find((p) => p.id === val);
                                const currentDesc = form.getValues(
                                  `items.${index}.description`,
                                );
                                if (prod && !currentDesc) {
                                  form.setValue(
                                    `items.${index}.description`,
                                    prod.name,
                                  );
                                }
                              }}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger className="h-9 text-xs border-input bg-background w-full">
                                  <SelectValue placeholder="Seleccionar (opcional)" />
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

                    {/* DESCRIPCION */}
                    <div className="md:col-span-4 md:p-2 md:align-top">
                      <FormLabel className="md:hidden text-xs">
                        Descripción
                      </FormLabel>
                      <Input
                        {...form.register(`items.${index}.description`)}
                        placeholder="Detalle del ítem..."
                        className="h-9 text-xs border-input bg-background w-full"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3 md:contents">
                      {/* CANTIDAD */}
                      <div className="md:col-span-1 md:p-2 md:align-top">
                        <FormLabel className="md:hidden text-xs">
                          Cantidad
                        </FormLabel>
                        <Input
                          type="number"
                          step="0.01"
                          {...form.register(`items.${index}.quantity`)}
                          className="h-9 text-xs md:text-right border-input bg-background w-full"
                        />
                      </div>

                      {/* PRECIO UNITARIO */}
                      <div className="md:col-span-2 md:p-2 md:align-top">
                        <FormLabel className="md:hidden text-xs">
                          Precio Unit.
                        </FormLabel>
                        <Input
                          type="number"
                          step="0.01"
                          {...form.register(`items.${index}.unitPrice`)}
                          className="h-9 text-xs md:text-right border-input bg-background w-full"
                        />
                      </div>
                    </div>

                    {/* ELIMINAR (Desktop) */}
                    <div className="hidden md:block md:col-span-1 md:p-2 md:text-right md:align-top">
                      {fields.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          onClick={() => remove(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. TOTALES */}
            <div className="flex justify-end pt-4 border-t border-border">
              <div className="w-full md:w-72 space-y-3 bg-muted/20 p-4 rounded-lg border border-border">
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
                    <div className="h-px bg-border my-2"></div>
                    <div className="flex justify-between items-center text-sm font-medium text-muted-foreground">
                      <span>Cotización:</span>
                      <span>$ {exchangeRate}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm font-bold text-primary">
                      <span>Est. USD:</span>
                      <span>
                        {(totalAmount / (exchangeRate || 1)).toLocaleString(
                          "en-US",
                          { style: "currency", currency: "USD" },
                        )}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* BOTONES ACCIÓN */}
            <div className="flex flex-col-reverse md:flex-row justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                className="w-full md:w-auto"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-primary hover:bg-primary/90 text-primary-foreground w-full md:w-auto min-w-[140px]"
              >
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                )}
                Guardar Factura
              </Button>
            </div>

            {/* ALERTA ERROR */}
            {submitError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{submitError}</AlertDescription>
              </Alert>
            )}
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
