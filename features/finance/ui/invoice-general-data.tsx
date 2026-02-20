"use client";

import { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { InvoiceSchema } from "../schemas/invoice-schema";
import { cn } from "@/lib/utils";

// UI Components
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import {
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

interface Props {
  form: UseFormReturn<InvoiceSchema>;
  suppliers: { id: string; name: string }[];
}

const COMPANIES = [
  "EL TOLAR SA",
  "APAT SRL",
  "HAIFA CEREALES SRL ",
  "3 AGRO SRL",
  "LA ANGELINA SRL",
];

export function InvoiceGeneralData({ form, suppliers }: Props) {
  const [isNewSupplier, setIsNewSupplier] = useState(false);

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
      {/* --- PROVEEDOR --- */}
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
                    className="bg-background h-9 text-xs"
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
                    <SelectTrigger className="bg-background h-9 text-xs">
                      <SelectValue placeholder="Seleccionar..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {suppliers.map((s) => (
                      <SelectItem key={s.id} value={s.id} className="text-xs">
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

      {/* --- EMPRESA COMPRADORA --- */}
      <div className="col-span-1 md:col-span-4">
        <FormField
          control={form.control}
          name="purchaserCompany"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Facturado a nombre de</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="bg-background h-9 text-xs">
                    <SelectValue placeholder="Seleccionar empresa" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {COMPANIES.map((company) => (
                    <SelectItem
                      key={company}
                      value={company}
                      className="text-xs"
                    >
                      {company}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* --- NRO COMPROBANTE --- */}
      <div className="col-span-1 md:col-span-4">
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
                  className="bg-background h-9 text-xs"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* --- FECHA DE EMISIÓN --- */}
      <div className="col-span-1 md:col-span-5">
        <FormField
          control={form.control}
          name="issueDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Fecha de Emisión</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal bg-background h-9 text-xs",
                        !field.value && "text-muted-foreground",
                      )}
                    >
                      {field.value ? (
                        format(field.value, "dd/MM/yyyy")
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
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* --- FECHA DE VENCIMIENTO --- */}
      <div className="col-span-1 md:col-span-5">
        <FormField
          control={form.control}
          name="dueDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Vencimiento</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal bg-background h-9 text-xs",
                        !field.value && "text-muted-foreground",
                      )}
                    >
                      {field.value ? (
                        format(field.value, "dd/MM/yyyy")
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
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* --- MONEDA --- */}
      <div className="col-span-1 md:col-span-2">
        <FormField
          control={form.control}
          name="currency"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Moneda</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="bg-background h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="USD" className="text-xs">
                    USD
                  </SelectItem>
                  <SelectItem value="ARS" className="text-xs">
                    ARS ($)
                  </SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
