"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Calendar } from "@/shared/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { ScrollArea } from "@/shared/ui/scroll-area";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import {
  ChevronLeft,
  Plus,
  Clock,
  Calendar as CalendarIcon,
  Trash2,
  X,
  Check,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { es } from "date-fns/locale";
import {
  format,
  isSameDay,
  startOfMonth,
  endOfMonth,
  startOfDay,
} from "date-fns";

type CalendarItem = {
  id: string;
  date: Date;
  title: string;
  time: string;
  type: "event" | "invoice";
  amount?: number;
  currency?: string;
};

const TIME_OPTIONS = Array.from({ length: 96 }).map((_, i) => {
  const hour = Math.floor(i / 4);
  const minute = (i % 4) * 15;
  return `${hour.toString().padStart(2, "0")}:${minute
    .toString()
    .padStart(2, "0")}`;
});

export function DashboardCalendar() {
  const supabase = createClient();

  const [date, setDate] = useState<Date | undefined>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [view, setView] = useState<"calendar" | "day">("calendar");
  const [items, setItems] = useState<CalendarItem[]>([]); // Lista unificada
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [isAdding, setIsAdding] = useState(false);
  const [newNote, setNewNote] = useState<{ title: string; time: string }>({
    title: "",
    time: "09:00",
  });

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      setIsLoading(true);
      const start = startOfMonth(currentMonth).toISOString();
      const end = endOfMonth(currentMonth).toISOString();

      // 1. Traer Eventos Manuales
      const eventsPromise = supabase
        .from("events")
        .select("*")
        .gte("date", start)
        .lte("date", end);

      // 2. Traer Vencimientos de Facturas (Pendientes)
      const invoicesPromise = supabase
        .from("invoices")
        .select(
          "id, due_date, invoice_number, amount_total, currency, suppliers(name)",
        )
        .eq("status", "pending")
        .gte("due_date", start)
        .lte("due_date", end);

      const [eventsRes, invoicesRes] = await Promise.all([
        eventsPromise,
        invoicesPromise,
      ]);

      if (isMounted) {
        const combinedItems: CalendarItem[] = [];

        // Mapear Eventos
        if (eventsRes.data) {
          eventsRes.data.forEach((e) => {
            combinedItems.push({
              id: e.id,
              date: new Date(e.date),
              title: e.title,

              time: e.time,
              type: "event",
            });
          });
        }

        // Mapear Facturas
        if (invoicesRes.data) {
          invoicesRes.data.forEach((inv) => {
            const dueDate = new Date(inv.due_date);

            type SupplierData = { name: string } | { name: string }[] | null;

            const sup = inv.suppliers as unknown as SupplierData;

            let supplierName = "Proveedor";

            if (Array.isArray(sup)) {
              if (sup.length > 0) supplierName = sup[0].name;
            } else if (sup) {
              supplierName = sup.name;
            }

            combinedItems.push({
              id: inv.id,
              date: dueDate,
              title: `Vence: ${supplierName}`,
              time: "Vencimiento",
              type: "invoice",
              amount: inv.amount_total,
              currency: inv.currency,
            });
          });
        }

        setItems(combinedItems);
        setIsLoading(false);
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [currentMonth, supabase]);

  const selectedDayItems = items.filter(
    (item) => date && isSameDay(item.date, date),
  );

  const handleSelectDate = (selected: Date | undefined) => {
    setDate(selected);
    if (selected) {
      setView("day");
      setIsAdding(false);
    }
  };

  // GUARDAR EVENTO MANUAL
  const handleSaveEvent = async () => {
    if (!date || !newNote.title.trim()) return;
    setIsSaving(true);

    const eventDate = startOfDay(date).toISOString();

    const { data, error } = await supabase
      .from("events")
      .insert({
        date: eventDate,
        title: newNote.title,
        time: newNote.time,
      })
      .select()
      .single();

    if (!error && data) {
      const newEvent: CalendarItem = {
        id: data.id,
        date: new Date(data.date),
        title: data.title,
        time: data.time,
        type: "event",
      };
      setItems((prev) => [...prev, newEvent]);
      setIsAdding(false);
      setNewNote({ title: "", time: "09:00" });
    }
    setIsSaving(false);
  };

  // BORRAR EVENTO (Solo manuales)
  const handleDeleteEvent = async (id: string) => {
    const previousItems = items;
    setItems(items.filter((e) => e.id !== id));

    const { error } = await supabase.from("events").delete().eq("id", id);

    if (error) {
      setItems(previousItems);
    }
  };

  return (
    <Card className="shadow-sm border-border w-full h-fit flex flex-col overflow-hidden bg-card relative">
      {/* HEADER DINÁMICO */}
      <CardHeader className="py-3 px-4 border-b border-border min-h-[50px] flex justify-center bg-card z-20 relative">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            {view === "day" && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 -ml-2 hover:bg-accent rounded-full text-muted-foreground"
                onClick={() => {
                  setView("calendar");
                  setIsAdding(false);
                }}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            )}
            <CardTitle className="text-sm font-bold text-foreground">
              {view === "calendar" ? (
                <span className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-primary" /> Agenda
                </span>
              ) : (
                <span className="capitalize">
                  {date ? format(date, "EEEE d", { locale: es }) : "Detalle"}
                </span>
              )}
            </CardTitle>
          </div>
          {view === "calendar" ? (
            <div className="flex items-center gap-2">
              {isLoading && (
                <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
              )}
              <span className="text-xs font-medium text-muted-foreground capitalize">
                {format(currentMonth, "MMMM", { locale: es })}
              </span>
            </div>
          ) : (
            <Badge
              variant="secondary"
              className="text-[10px] h-5 px-1.5 font-normal bg-muted text-muted-foreground"
            >
              {selectedDayItems.length}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0 flex-1 relative bg-card z-10 flex flex-col">
        {/* VISTA 1: CALENDARIO */}
        {view === "calendar" && (
          <div className="flex-1 w-full flex items-center justify-center p-2 animate-in zoom-in-95 duration-200">
            <Calendar
              mode="single"
              selected={date}
              onSelect={handleSelectDate}
              month={currentMonth}
              onMonthChange={setCurrentMonth}
              locale={es}
              className="p-0 border-none shadow-none"
              classNames={{
                month: "space-y-4",
                table: "w-full border-collapse space-y-1 mx-auto",
                head_row: "flex justify-center mb-2",
                head_cell:
                  "text-muted-foreground rounded-md w-8 font-normal text-[0.75rem] capitalize",
                row: "flex w-full mt-1 justify-center",
                cell: "text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
                day: "h-8 w-8 p-0 font-normal text-sm aria-selected:opacity-100 hover:bg-accent rounded-md transition-colors text-foreground",
                day_selected:
                  "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground shadow-md shadow-primary/20",
                day_today:
                  "bg-muted text-foreground font-bold border border-border",
                day_outside: "text-muted-foreground/50 opacity-50",
                day_disabled: "text-muted-foreground/50 opacity-50",
                day_hidden: "invisible",
              }}
              modifiers={{
                hasEvent: (day) =>
                  items.some(
                    (e) => e.type === "event" && isSameDay(e.date, day),
                  ),
                hasInvoice: (day) =>
                  items.some(
                    (e) => e.type === "invoice" && isSameDay(e.date, day),
                  ),
              }}
              modifiersClassNames={{
                // Puntito azul para eventos
                hasEvent:
                  "relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:bg-primary after:rounded-full",
                // Puntito rojo para facturas (sobrescribe o convive)
                hasInvoice:
                  "relative before:absolute before:top-1 before:right-1 before:w-1.5 before:h-1.5 before:bg-destructive before:rounded-full",
              }}
            />
          </div>
        )}

        {/* VISTA 2: DETALLE DÍA */}
        {view === "day" && (
          <div className="flex-1 flex flex-col w-full bg-card animate-in slide-in-from-right-4 duration-300 relative">
            <ScrollArea className="flex-1 p-4 pb-0">
              {selectedDayItems.length > 0 ? (
                <div className="space-y-2 pb-4">
                  {selectedDayItems.map((item) => (
                    <div
                      key={item.id}
                      className={`group flex items-center gap-3 p-2 rounded-md border transition-all bg-card shadow-sm ${
                        item.type === "invoice"
                          ? "border-destructive/30 bg-destructive/5 hover:border-destructive/50"
                          : "border-border hover:border-primary/50 hover:bg-primary/5"
                      }`}
                    >
                      <span
                        className={`text-[10px] font-bold w-12 text-right shrink-0 ${
                          item.type === "invoice"
                            ? "text-destructive"
                            : "text-muted-foreground"
                        }`}
                      >
                        {item.type === "invoice" ? "VENCE" : item.time}
                      </span>

                      <div
                        className={`h-8 w-1 rounded-full shrink-0 ${
                          item.type === "invoice"
                            ? "bg-destructive"
                            : "bg-primary"
                        }`}
                      />

                      <div className="flex-1 flex flex-col justify-center min-w-0">
                        <p className="text-xs font-semibold text-foreground leading-tight mb-0.5 truncate">
                          {item.title}
                        </p>
                        {item.type === "invoice" && (
                          <p className="text-[10px] text-muted-foreground font-mono">
                            {item.currency} {item.amount?.toLocaleString()}
                          </p>
                        )}
                      </div>

                      {/* Solo permitimos borrar eventos manuales, no facturas desde acá */}
                      {item.type === "event" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteEvent(item.id)}
                          className="h-6 w-6 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive transition-all shrink-0"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}

                      {item.type === "invoice" && (
                        <div className="h-6 w-6 flex items-center justify-center text-destructive">
                          <AlertCircle className="h-3 w-3" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                !isAdding && (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-2 min-h-[150px]">
                    <div className="h-10 w-10 bg-muted rounded-full flex items-center justify-center">
                      <Clock className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <p className="text-xs font-medium">Nada para hoy.</p>
                  </div>
                )
              )}
            </ScrollArea>

            {/* FORMULARIO FLOTANTE (Solo para eventos manuales) */}
            {isAdding ? (
              <div className="p-4 bg-muted/30 border-t border-border animate-in slide-in-from-bottom-2">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground">
                      Nueva Nota
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 w-5 p-0 text-muted-foreground"
                      onClick={() => setIsAdding(false)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>

                  <div className="flex gap-2">
                    <div className="w-24 shrink-0">
                      <Label className="text-[10px] text-muted-foreground uppercase mb-1 block">
                        Hora
                      </Label>
                      <Select
                        value={newNote.time}
                        onValueChange={(v) =>
                          setNewNote({ ...newNote, time: v })
                        }
                      >
                        <SelectTrigger className="h-8 text-xs bg-background w-full">
                          <SelectValue placeholder="Hora" />
                        </SelectTrigger>
                        <SelectContent className="h-48">
                          {TIME_OPTIONS.map((time) => (
                            <SelectItem
                              key={time}
                              value={time}
                              className="text-xs"
                            >
                              {time}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex-1">
                      <Label className="text-[10px] text-muted-foreground uppercase mb-1 block">
                        Detalle
                      </Label>
                      <Input
                        placeholder="Ej: Llamada..."
                        className="h-8 text-xs bg-background w-full"
                        value={newNote.title}
                        onChange={(e) =>
                          setNewNote({ ...newNote, title: e.target.value })
                        }
                        autoFocus
                        onKeyDown={(e) =>
                          e.key === "Enter" && handleSaveEvent()
                        }
                      />
                    </div>
                  </div>

                  <Button
                    onClick={handleSaveEvent}
                    className="w-full h-8 text-xs bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
                  >
                    <Check className="h-3 w-3" /> Guardar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-3 border-t border-border bg-card z-10">
                <Button
                  onClick={() => setIsAdding(true)}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-8 text-xs font-medium shadow-sm"
                >
                  <Plus className="mr-2 h-3 w-3" /> Agregar Nota
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
