"use client";

import { useState } from "react";
import { useForm, useFieldArray, Resolver, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { invoiceSchema, type InvoiceSchema } from "../schemas/invoice-schema";

// Componentes Modulares
import { InvoiceGeneralData } from "./invoice-general-data";
import { InvoiceItemsTable } from "./invoice-items-table";
import { InvoiceFileUpload } from "./invoice-file-upload";
import { InvoiceSummary } from "./invoice-summary";

// UI Components
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/dialog";
import { Form } from "@/shared/ui/form";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { Switch } from "@/shared/ui/switch";
import { Plus, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Label } from "@/shared/ui/label";

// Hooks
import { useCreateInvoice } from "../hooks/use-create-invoice";

interface Props {
  products: { id: string; name: string }[];
  suppliers: { id: string; name: string }[];
}

export function CreateInvoiceDialog({ products, suppliers }: Props) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [openProductCombo, setOpenProductCombo] = useState<number | null>(null);
  const [comboSearchValue, setComboSearchValue] = useState("");

  const [affectStock, setAffectStock] = useState(false);

  const form = useForm<InvoiceSchema>({
    resolver: zodResolver(invoiceSchema) as unknown as Resolver<InvoiceSchema>,
    defaultValues: {
      voucherType: "FC",
      currency: "USD",
      exchangeRate: 1,
      items: [{ description: "", quantity: 1, unitPrice: 0, productId: "" }],
      invoiceNumber: "",
      purchaserCompany: "EL TOLAR SA",
      issueDate: new Date(),
      dueDate: new Date(),
      description: "",
      newSupplierName: "",
      supplierId: undefined,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const currentVoucherType = useWatch({
    control: form.control,
    name: "voucherType",
  });

  if (currentVoucherType !== "NC" && affectStock) {
    setAffectStock(false);
  }

  const { onSubmit, isSubmitting, submitError } = useCreateInvoice({
    products,
    file,
    affectStock,
    onSuccess: () => {
      setOpen(false);
      form.reset();
      setFile(null);
      setAffectStock(false);
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground h-10 shadow-sm px-4">
          <Plus className="h-4 w-4 mr-2" />
          <span>Comprobante</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="w-full max-w-[95vw] sm:max-w-[900px] max-h-[90vh] overflow-y-auto bg-card p-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Nuevo Comprobante
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* 1. Datos de Cabecera  */}
            <InvoiceGeneralData form={form} suppliers={suppliers} />

            {/* TOGGLE DE STOCK PARA NOTAS DE CRÉDITO */}
            {currentVoucherType === "NC" && (
              <div className="flex flex-row items-center justify-between rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-4">
                <div className="space-y-0.5">
                  <Label className="text-base font-semibold text-yellow-800 dark:text-yellow-500">
                    ¿Restar del Stock?
                  </Label>
                  <p className="text-sm text-yellow-700/80 dark:text-yellow-600/80">
                    Activa esto si la Nota de Crédito es por una devolución
                    física de mercadería.
                  </p>
                </div>
                <Switch
                  checked={affectStock}
                  onCheckedChange={setAffectStock}
                />
              </div>
            )}

            {/* 2. Subida de Comprobante */}
            <InvoiceFileUpload file={file} setFile={setFile} />

            {/* 3. Tabla de Productos (Modularizada y Tipada) */}
            <InvoiceItemsTable
              fields={fields}
              append={append}
              remove={remove}
              control={form.control}
              register={form.register}
              setValue={form.setValue}
              getValues={form.getValues}
              products={products}
              openProductCombo={openProductCombo}
              setOpenProductCombo={setOpenProductCombo}
              comboSearchValue={comboSearchValue}
              setComboSearchValue={setComboSearchValue}
            />

            {/* 4. Totales y Cotización */}
            <div className="pt-4 border-t border-border">
              <InvoiceSummary control={form.control} setValue={form.setValue} />
            </div>

            {/* 5. Acciones y Errores */}
            <div className="space-y-4">
              {submitError && (
                <Alert
                  variant="destructive"
                  className="animate-in fade-in slide-in-from-top-2"
                >
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error al guardar</AlertTitle>
                  <AlertDescription>{submitError}</AlertDescription>
                </Alert>
              )}

              <div className="flex flex-col-reverse md:flex-row justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  disabled={isSubmitting}
                  className="w-full md:w-auto"
                >
                  Cancelar
                </Button>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground w-full md:w-auto min-w-[160px]"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Guardar
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
