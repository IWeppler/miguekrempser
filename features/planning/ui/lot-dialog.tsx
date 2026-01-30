"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, MapPin } from "lucide-react";
import { lotSchema, type LotSchema } from "../types";
import { createLot } from "../actions/lot-actions";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/ui/form";
import { Input } from "@/shared/ui/input";
import { Textarea } from "@/shared/ui/textarea";

export function LotDialog() {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm({
    resolver: zodResolver(lotSchema),
    defaultValues: {
      name: "",
      field_name: "",
      hectares: 0,
      description: "",
    },
  });

  const onSubmit = async (values: LotSchema) => {
    setIsSubmitting(true);
    const result = await createLot(values);
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
        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
          <Plus className="mr-2 h-4 w-4" /> Nuevo Lote
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Registrar Lote</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* NOMBRE DEL LOTE */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre / Número</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Lote 22" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              {/* CAMPO / ESTABLECIMIENTO */}
              <FormField
                control={form.control}
                name="field_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Campo</FormLabel>
                    <FormControl>
                      <Input placeholder="El Quebrachal" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* HECTÁREAS */}
              <FormField
                control={form.control}
                name="hectares"
                render={({ field: { value, onChange, ...fieldProps } }) => (
                  <FormItem>
                    <FormLabel>Hectáreas</FormLabel>
                    <FormControl>
                      <Input
                        {...fieldProps}
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={(value as number) ?? ""}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          onChange(isNaN(val) ? 0 : val);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* DESCRIPCIÓN */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Características del suelo, ubicación..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Guardar Lote
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
