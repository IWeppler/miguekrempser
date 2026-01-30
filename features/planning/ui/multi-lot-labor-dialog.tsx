"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  CalendarIcon,
  Loader2,
  Sprout,
  CheckSquare,
  Square,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { laborSchema, type LaborSchema } from "../schemas/labor-schema";
import { createMassLabor } from "../actions/mass-labor-actions";
import { LaborItemsField } from "@/features/planning/ui/forms/labor-items-field";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
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
import { Badge } from "@/shared/ui/badge";
import { ScrollArea } from "@/shared/ui/scroll-area";

// --- DEFINICIÓN DE INTERFACES (Tipado estricto) ---
interface ActiveCampaign {
  id: string;
  crop: string;
  campaign: string;
  status: string;
}

interface LotWithCampaign {
  id: string;
  name: string;
  hectares: number;
  active_campaign?: ActiveCampaign | null;
}

interface Product {
  id: string;
  name: string;
  average_cost: number;
}

interface Props {
  lots: LotWithCampaign[];
  products: Product[];
}

export function MultiLotLaborDialog({ lots, products }: Props) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCycleIds, setSelectedCycleIds] = useState<string[]>([]);

  const activeLots = lots.filter(
    (l): l is LotWithCampaign & { active_campaign: ActiveCampaign } =>
      !!l.active_campaign,
  );

  const form = useForm({
    resolver: zodResolver(laborSchema),
    defaultValues: {
      date: new Date(),
      category: "pulverización" as const,
      description: "",
      contractor_name: "",
      service_cost_ha: 0,
      items: [],
    },
  });

  const toggleSelection = (cycleId: string) => {
    setSelectedCycleIds((prev) =>
      prev.includes(cycleId)
        ? prev.filter((id) => id !== cycleId)
        : [...prev, cycleId],
    );
  };

  const selectAll = () => {
    if (selectedCycleIds.length === activeLots.length) {
      setSelectedCycleIds([]);
    } else {
      setSelectedCycleIds(activeLots.map((l) => l.active_campaign.id));
    }
  };

  const onSubmit = async (values: LaborSchema) => {
    if (selectedCycleIds.length === 0) {
      alert("Debes seleccionar al menos un lote.");
      return;
    }

    setIsSubmitting(true);
    const result = await createMassLabor(values, selectedCycleIds);
    setIsSubmitting(false);

    if (result.success) {
      setOpen(false);
      form.reset();
      setSelectedCycleIds([]);
    } else {
      alert(result.error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Sprout className="mr-2 h-4 w-4" /> Registo Masivo
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Carga Masiva de Labores</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Aplica la misma labor a múltiples lotes simultáneamente.
          </p>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-2">
          {/* COLUMNA IZQUIERDA: SELECCIÓN DE LOTES */}
          <div className="lg:col-span-1 border-r border-border pr-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold">Seleccionar Lotes</h4>
              <Button
                variant="ghost"
                onClick={selectAll}
                className="h-6 text-xs"
              >
                {selectedCycleIds.length === activeLots.length &&
                activeLots.length > 0
                  ? "Deseleccionar"
                  : "Todos"}
              </Button>
            </div>
            <ScrollArea className="h-[400px] pr-2">
              <div className="space-y-2">
                {activeLots.map((lot) => {
                  // Acceso seguro gracias al tipado
                  const cycleId = lot.active_campaign.id;
                  const isSelected = selectedCycleIds.includes(cycleId);

                  return (
                    <div
                      key={lot.id}
                      onClick={() => toggleSelection(cycleId)}
                      className={cn(
                        "flex items-center justify-between p-2 rounded-md border cursor-pointer transition-colors text-sm",
                        isSelected
                          ? "bg-primary/10 border-primary"
                          : "bg-card hover:bg-accent border-border",
                      )}
                    >
                      <div>
                        <p className="font-semibold">{lot.name}</p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Badge
                            variant="outline"
                            className="text-[10px] h-4 px-1 py-0"
                          >
                            {lot.active_campaign.crop}
                          </Badge>
                          <span>{Number(lot.hectares)} Ha</span>
                        </div>
                      </div>
                      {isSelected ? (
                        <CheckSquare className="h-4 w-4 text-primary" />
                      ) : (
                        <Square className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  );
                })}
                {activeLots.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    No hay lotes con cultivos activos.
                  </p>
                )}
              </div>
            </ScrollArea>
            <div className="mt-2 text-xs text-center text-muted-foreground">
              {selectedCycleIds.length} lotes seleccionados
            </div>
          </div>

          {/* COLUMNA DERECHA: FORMULARIO */}
          <div className="lg:col-span-2">
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
                                  format(field.value, "PPP", { locale: es })
                                ) : (
                                  <span>Seleccionar</span>
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
                              disabled={(date) => date > new Date()}
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
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Labor</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Tipo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="pulverización">
                              Pulverización
                            </SelectItem>
                            <SelectItem value="siembra">Siembra</SelectItem>
                            <SelectItem value="fertilización">
                              Fertilización
                            </SelectItem>
                            <SelectItem value="cosecha">Cosecha</SelectItem>
                            <SelectItem value="monitoreo">Monitoreo</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descripción</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ej: Aplicación Fungicida"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="contractor_name"
                    render={({ field: { value, ...props } }) => (
                      <FormItem>
                        <FormLabel>Contratista</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Opcional"
                            value={value || ""}
                            {...props}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="service_cost_ha"
                    render={({ field: { value, onChange, ...props } }) => (
                      <FormItem>
                        <FormLabel>Costo Labor (USD/Ha)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            value={(value as number) ?? ""}
                            onChange={(e) =>
                              onChange(parseFloat(e.target.value) || 0)
                            }
                            {...props}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                {/* HELPER DE INSUMOS */}
                <LaborItemsField products={products} />

                <div className="flex justify-end pt-4 border-t border-border mt-4">
                  <Button
                    type="submit"
                    disabled={isSubmitting || selectedCycleIds.length === 0}
                  >
                    {isSubmitting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Sprout className="mr-2 h-4 w-4" />
                    )}
                    Aplicar a {selectedCycleIds.length} Lotes
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
