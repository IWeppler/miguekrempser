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
  X,
  FileIcon,
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

  // Resetear cotización si cambia a USD
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

      // 1. SUBIR IMAGEN (Si existe)
      if (file) {
        setIsUploading(true);
        const fileExt = file.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("invoices")
          .upload(filePath, file);

        if (uploadError)
          throw new Error("Error al subir imagen: " + uploadError.message);

        // Obtener URL pública
        const {
          data: { publicUrl },
        } = supabase.storage.from("invoices").getPublicUrl(filePath);

        fileUrl = publicUrl;
        setIsUploading(false);
      }

      // 2. CREAR FACTURA (Pasando la URL de la imagen)
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
    } catch (err: unknown) {
      setSubmitError((err as Error)?.message || "Error desconocido");
    } finally {
      setIsSubmitting(false);
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 shadow-sm">
          <Plus className="h-4 w-4" /> Cargar Factura
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle>Nueva Factura de Compra</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* 1. ENCABEZADO (Proveedor, Nro, Fecha, Moneda) */}
            <div className="grid grid-cols-12 gap-4 p-4 bg-muted/30 rounded-lg border border-border">
              

              {/* Proveedor (Col 1-4) */}
              <div className="col-span-12 md:col-span-4 space-y-2">
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

              {/* Nro Factura (Col 5-7) */}
              <div className="col-span-6 md:col-span-3">
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

              {/* Fecha (Col 8-10) */}
              <div className="col-span-6 md:col-span-3">
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

              {/* Moneda (Col 11-12) */}
              <div className="col-span-6 md:col-span-2">
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

            <div className="p-4 bg-muted/30 rounded-lg border border-border border-dashed">
                <div className="flex flex-col gap-3">
                  <FormLabel>Comprobante Digital (Foto/PDF)</FormLabel>
                  {!file ? (
                    <div
                      className="flex flex-col items-center justify-center h-24 border-2 border-dashed border-muted-foreground/25 rounded-lg bg-background hover:bg-muted/50 transition-colors cursor-pointer"
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

            {/* COTIZACIÓN (Solo si es ARS) */}
            {currency === "ARS" && (
              <div className="flex items-center gap-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-md animate-in fade-in slide-in-from-top-1">
                <Coins className="h-5 w-5 text-yellow-600" />
                <div className="flex-1 text-sm text-yellow-700 dark:text-yellow-400">
                  La factura está en Pesos.
                  {loadingRate ? (
                    <span className="ml-1 inline-flex items-center">
                      <Loader2 className="h-3 w-3 animate-spin mr-1" /> Buscando
                      cotización...
                    </span>
                  ) : (
                    <span>
                      {" "}
                      Se aplicó la cotización oficial del día automáticamente.
                    </span>
                  )}
                </div>
                <FormField
                  control={form.control}
                  name="exchangeRate"
                  render={({ field }) => (
                    <FormItem className="w-32 mb-0">
                      <FormLabel className="text-xs">
                        Cotización (1 USD =)
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          {...field}
                          // Añadimos feedback visual si está cargando
                          disabled={loadingRate}
                          className="bg-background font-mono font-bold text-right"
                          onChange={(e) =>
                            field.onChange(parseFloat(e.target.value))
                          }
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* 2. DETALLE DE ÍTEMS (Tabla Dinámica) */}
            <div className="space-y-2">
              <div className="text-sm font-semibold flex justify-between items-center text-foreground">
                <span>Detalle de Productos / Servicios</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    append({ description: "", quantity: 1, unitPrice: 0 })
                  }
                  className="h-7 text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" /> Agregar Ítem
                </Button>
              </div>

              <div className="rounded-md border border-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted text-muted-foreground font-medium">
                    <tr>
                      <th className="px-3 py-2 text-left w-[30%]">
                        Producto (Stock)
                      </th>
                      <th className="px-3 py-2 text-left w-[30%]">
                        Descripción Factura
                      </th>
                      <th className="px-3 py-2 text-right w-[12%]">Cant.</th>
                      <th className="px-3 py-2 text-right w-[18%]">
                        Precio Unit.
                      </th>
                      <th className="px-3 py-2 text-right w-[10%]"></th>
                    </tr>
                  </thead>
                  <tbody className="bg-card divide-y divide-border">
                    {fields.map((field, index) => (
                      <tr
                        key={field.id}
                        className="group hover:bg-muted/50 transition-colors"
                      >
                        {/* SELECTOR PRODUCTO */}
                        <td className="p-2 align-top">
                          <FormField
                            control={form.control}
                            name={`items.${index}.productId`}
                            render={({ field }) => (
                              <Select
                                onValueChange={(val) => {
                                  field.onChange(val);
                                  // Auto-fill description if empty
                                  const prod = products.find(
                                    (p) => p.id === val,
                                  );
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
                                  <SelectTrigger className="h-9 text-xs border-input bg-background">
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
                            )}
                          />
                        </td>

                        {/* DESCRIPCION */}
                        <td className="p-2 align-top">
                          <Input
                            {...form.register(`items.${index}.description`)}
                            placeholder="Detalle del ítem..."
                            className="h-9 text-xs border-input bg-background"
                          />
                        </td>

                        {/* CANTIDAD */}
                        <td className="p-2 align-top">
                          <Input
                            type="number"
                            step="0.01"
                            {...form.register(`items.${index}.quantity`)}
                            className="h-9 text-xs text-right border-input bg-background"
                          />
                        </td>

                        {/* PRECIO UNITARIO */}
                        <td className="p-2 align-top">
                          <Input
                            type="number"
                            step="0.01"
                            {...form.register(`items.${index}.unitPrice`)}
                            className="h-9 text-xs text-right border-input bg-background"
                          />
                        </td>

                        {/* ELIMINAR */}
                        <td className="p-2 text-right align-top">
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
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 3. TOTALES */}
            <div className="flex justify-end pt-4 border-t border-border">
              <div className="w-72 space-y-3 bg-muted/20 p-4 rounded-lg border border-border">
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
            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-primary hover:bg-primary/90 text-primary-foreground min-w-[140px]"
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
