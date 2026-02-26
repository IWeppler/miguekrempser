"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { rainfallSchema, RainfallSchema } from "../schemas/rainfall-schema";
import { createRainfall, deleteRainfall } from "../actions/rainfall-actions";
import { Rainfall } from "../types";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";
import { Calendar } from "@/shared/ui/calendar";
import { CalendarIcon, CloudRain, Plus, Trash2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  lotId: string;
  rainfalls: Rainfall[];
}

export function RainfallTracker({ lotId, rainfalls }: Props) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculamos el total de milímetros
  const totalMm = rainfalls.reduce(
    (acc, curr) => acc + Number(curr.millimeters),
    0,
  );

  const form = useForm({
    resolver: zodResolver(rainfallSchema),
    defaultValues: {
      date: new Date(),
      millimeters: 0,
      observations: "",
    },
  });

  const onSubmit = async (data: RainfallSchema) => {
    setIsSubmitting(true);
    const result = await createRainfall(lotId, data);
    if (result.success) {
      setOpen(false);
      form.reset();
    } else {
      alert(result.error);
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm("¿Eliminar este registro de lluvia?")) {
      await deleteRainfall(id, lotId);
    }
  };

  return (
    <Card className="shadow-sm border-blue-200 dark:border-blue-900 bg-blue-50/10 dark:bg-blue-950/10">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold flex items-center gap-2 text-blue-700 dark:text-blue-400">
          <CloudRain className="h-5 w-5" />
          Pluviómetro
        </CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-blue-600 border-blue-200 hover:bg-blue-100"
            >
              <Plus className="h-4 w-4 mr-1" /> Cargar
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CloudRain className="h-5 w-5 text-blue-500" /> Registrar Lluvia
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Fecha</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground",
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "dd/MM/yyyy")
                                ) : (
                                  <span>Elegir fecha</span>
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

                  <FormField
                    control={form.control}
                    name="millimeters"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Milímetros (mm)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.5"
                            placeholder="Ej: 15"
                            {...field}
                            value={field.value as number | string}
                            onChange={(e) => field.onChange(e.target.value)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="observations"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observaciones (Opcional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ej: Lluvia mansa, sin granizo..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end pt-2">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {isSubmitting && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Guardar Registro
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </CardHeader>

      <CardContent>
        <div className="mb-4 flex items-end gap-2">
          <span className="text-3xl font-black text-blue-700 dark:text-blue-400">
            {totalMm}
          </span>
          <span className="text-sm font-medium text-blue-600/70 mb-1">
            mm Acumulados
          </span>
        </div>

        <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1 custom-scrollbar">
          {rainfalls.length > 0 ? (
            rainfalls.map((rain) => (
              <div
                key={rain.id}
                className="flex items-center justify-between p-2 rounded-md bg-background border border-border/50 text-sm group"
              >
                <div className="flex flex-col">
                  <span className="font-semibold">
                    {format(new Date(rain.date), "dd MMM", { locale: es })}
                  </span>
                  {rain.observations && (
                    <span
                      className="text-xs text-muted-foreground truncate max-w-[120px]"
                      title={rain.observations}
                    >
                      {rain.observations}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-blue-600">
                    {rain.millimeters} mm
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:bg-destructive/10"
                    onClick={() => handleDelete(rain.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-center text-muted-foreground py-4 italic border border-dashed rounded-md">
              Sin registros.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
