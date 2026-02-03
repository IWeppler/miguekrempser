"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Button } from "@/shared/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/shared/ui/sheet";
import {
  Menu,
  Bell,
  Sun,
  Cloud,
  CloudRain,
  LayoutDashboard,
  Package,
  History,
  FileText,
  LogOut,
  Sprout,
  ChevronDown,
  Loader2,
  CheckCheck, // Nuevo icono para marcar todo como leido si quisieras
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";
import { ScrollArea } from "@/shared/ui/scroll-area";
import { Badge } from "@/shared/ui/badge";
import { User } from "@supabase/supabase-js";

type NotificationItem = {
  id: string;
  type: "stock" | "event" | "invoice";
  title: string;
  description: string;
  link: string;
  date: Date;
};

type WeatherData = {
  temp: number;
  code: number;
};

interface ProductStock {
  id: string;
  name: string;
  current_stock: number;
  min_stock_alert: number;
}

interface CalendarEvent {
  id: string;
  title: string;
  time: string;
  date: string;
}

interface InvoiceWithSupplier {
  id: string;
  invoice_number: string;
  amount: number;
  suppliers: {
    name: string;
  } | null;
}

const LAT = -28.88;
const LON = -62.26;

const menuItems = [
  { name: "Panel", href: "/", icon: LayoutDashboard },
  { name: "Stock", href: "/stock", icon: Package },
  { name: "Movimientos", href: "/movimientos", icon: History },
  { name: "Finanzas", href: "/finanzas", icon: FileText },
];

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const supabase = createClient();

  const [user, setUser] = useState<User | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoadingNotifs, setIsLoadingNotifs] = useState(true);

  // --- NUEVO ESTADO: IDs de notificaciones leídas ---
  const [readIds, setReadIds] = useState<string[]>([]);

  // 1. USUARIO
  useEffect(() => {
    async function getUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    }
    getUser();
  }, [supabase]);

  const userName =
    user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Usuario";
  const userEmail = user?.email || "cargando...";

  // --- NUEVO: Cargar leídas del LocalStorage al iniciar ---
  useEffect(() => {
    const storedReads = localStorage.getItem("agro_read_notifications");
    if (storedReads) {
      try {
        setReadIds(JSON.parse(storedReads));
      } catch (e) {
        console.error("Error parsing read notifications", e);
      }
    }
  }, []);

  // --- NUEVO: Función para marcar como leída ---
  const markAsRead = (id: string) => {
    if (!readIds.includes(id)) {
      const updatedReads = [...readIds, id];
      setReadIds(updatedReads);
      localStorage.setItem(
        "agro_read_notifications",
        JSON.stringify(updatedReads),
      );
    }
  };

  // --- NUEVO: Función para marcar TODAS como leídas ---
  const markAllAsRead = () => {
    const allIds = notifications.map((n) => n.id);
    // Fusionamos las que ya estaban leídas con las nuevas
    const uniqueIds = Array.from(new Set([...readIds, ...allIds]));
    setReadIds(uniqueIds);
    localStorage.setItem("agro_read_notifications", JSON.stringify(uniqueIds));
  };

  // 2. CLIMA
  useEffect(() => {
    async function fetchWeather() {
      try {
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&current=temperature_2m,weather_code&timezone=America%2FArgentina%2FBuenos_Aires`,
        );
        const data = await res.json();
        setWeather({
          temp: Math.round(data.current.temperature_2m),
          code: data.current.weather_code,
        });
      } catch (error) {
        console.error("Error clima:", error);
      }
    }
    fetchWeather();
  }, []);

  // 3. NOTIFICACIONES
  useEffect(() => {
    async function fetchNotifications() {
      if (!user) return;
      setIsLoadingNotifs(true);
      const notifs: NotificationItem[] = [];

      const now = new Date();
      // Ajuste básico de zona horaria si es necesario, aunque date-fns o similar sería mejor
      const offsetArgentina = -3 * 60;
      const nowArg = new Date(now.getTime() + offsetArgentina * 60 * 1000);
      const todayISO = nowArg.toISOString().split("T")[0];

      try {
        // --- A. Stock Bajo ---
        const { data: criticalData, error: stockError } = await supabase
          .rpc("get_critical_stock")
          .limit(5);

        if (!stockError && criticalData) {
          const products = criticalData as unknown as ProductStock[];
          products.forEach((p) => {
            notifs.push({
              id: `stock-${p.id}`,
              type: "stock",
              title: "Stock Crítico",
              description: `${p.name}: Quedan ${p.current_stock} (Mín: ${p.min_stock_alert})`,
              link: "/stock",
              date: new Date(),
            });
          });
        }

        // --- B. Eventos de Hoy ---
        const { data: eventsData, error: eventError } = await supabase
          .from("events")
          .select("id, title, time, date")
          .gte("date", `${todayISO}T00:00:00`)
          .lte("date", `${todayISO}T23:59:59`)
          .order("time", { ascending: true });

        if (!eventError && eventsData) {
          const events = eventsData as unknown as CalendarEvent[];
          events.forEach((e) => {
            notifs.push({
              id: `event-${e.id}`,
              type: "event",
              title: "Agenda: Hoy",
              description: `${e.time} hs - ${e.title}`,
              link: "/", // Quizás linkear a una vista de agenda
              date: new Date(e.date),
            });
          });
        }

        // --- C. Finanzas (Facturas Vencidas) ---
        const { data: invoicesData, error: invoiceError } = await supabase
          .from("invoices")
          .select("id, invoice_number, amount_total, suppliers(name)")
          .eq("status", "overdue")
          .limit(5);

        if (!invoiceError && invoicesData) {
          const invoices = invoicesData as unknown as InvoiceWithSupplier[];
          invoices.forEach((inv) => {
            const supplierData = Array.isArray(inv.suppliers)
              ? inv.suppliers[0]
              : inv.suppliers;
            const supplierName = supplierData?.name || "Proveedor";

            notifs.push({
              id: `inv-${inv.id}`,
              type: "invoice",
              title: "Factura Vencida",
              description: `${supplierName}: $${inv.amount}`,
              link: "/finanzas",
              date: new Date(),
            });
          });
        }

        setNotifications(notifs);
      } catch (e) {
        console.error("Error general notificaciones:", e);
      } finally {
        setIsLoadingNotifs(false);
      }
    }

    fetchNotifications();
  }, [supabase, user]);

  // --- CALCULAR NO LEÍDAS ---
  const unreadCount = notifications.filter(
    (n) => !readIds.includes(n.id),
  ).length;

  const getWeatherIcon = (code: number) => {
    if (code <= 1) return <Sun className="h-5 w-5 text-orange-500" />;
    if (code <= 3) return <Cloud className="h-5 w-5 text-slate-400" />;
    return <CloudRain className="h-5 w-5 text-blue-400" />;
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-background px-4 shadow-sm md:px-6">
      {/* ... (MOBILE MENU IGUAL QUE ANTES) ... */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden shrink-0 text-muted-foreground"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Menú</span>
          </Button>
        </SheetTrigger>
        <SheetContent
          side="left"
          className="w-[80%] sm:w-[300px] p-0 bg-sidebar border-r border-sidebar-border"
        >
          <SheetHeader className="h-16 flex items-center justify-center border-b border-sidebar-border px-6">
            <SheetTitle className="flex items-center gap-2 text-sidebar-primary">
              <Sprout className="h-6 w-6" />El Tolar SA
            </SheetTitle>
          </SheetHeader>
          <nav className="flex-1 py-4 px-3">
            <ul className="space-y-1">
              {menuItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-3 rounded-md text-sm font-medium transition-colors",
                        isActive
                          ? "bg-sidebar-accent text-sidebar-primary border border-sidebar-border"
                          : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground",
                      )}
                    >
                      <item.icon
                        className={cn(
                          "h-5 w-5",
                          isActive
                            ? "text-sidebar-primary"
                            : "text-muted-foreground",
                        )}
                      />
                      {item.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
            <div className="absolute bottom-4 left-4 right-4">
              <Button
                variant="outline"
                className="w-full justify-start text-destructive border-destructive/20 hover:bg-destructive/10 hover:text-destructive"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" /> Cerrar Sesión
              </Button>
            </div>
          </nav>
        </SheetContent>
      </Sheet>

      {/* MOBILE LOGO */}
      <div className="flex items-center gap-2 font-bold text-primary md:hidden">
        <Sprout className="h-5 w-5" />
        <span className="hidden sm:inline"> El Tolar SA</span>
      </div>

      {/* --- DESKTOP LEFT --- */}
      <div className="hidden md:flex items-center gap-4 mr-auto">
        <div className="flex items-center gap-3 animate-in fade-in duration-700">
          {weather ? (
            getWeatherIcon(weather.code)
          ) : (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
          <div>
            <span className="block text-xs font-bold text-foreground uppercase tracking-wider leading-none">
              Bandera, SDE
            </span>
            <span className="block text-sm font-medium text-muted-foreground leading-none mt-0.5">
              {weather ? `${weather.temp}°C` : "Cargando..."}
            </span>
          </div>
        </div>
      </div>

      {/* --- DESKTOP RIGHT --- */}
      <div className="flex items-center gap-4 ml-auto">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative text-muted-foreground hover:text-foreground hover:bg-accent"
            >
              <Bell className="h-5 w-5" />
              {/* CAMBIO: Usamos unreadCount en lugar de notifications.length */}
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 h-2 w-2 bg-destructive rounded-full border-2 border-background animate-pulse"></span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent
            align="end"
            className="w-80 p-0 border-border bg-card"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <span className="font-semibold text-sm text-foreground">
                Notificaciones
              </span>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    title="Marcar todas como leídas"
                    onClick={markAllAsRead}
                  >
                    <CheckCheck className="h-3 w-3 text-muted-foreground hover:text-primary" />
                  </Button>
                )}
                <Badge
                  variant="secondary"
                  className="bg-primary/10 text-primary"
                >
                  {unreadCount} Nuevas
                </Badge>
              </div>
            </div>
            <ScrollArea className="h-[300px]">
              {isLoadingNotifs ? (
                <div className="flex justify-center items-center h-20">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : notifications.length > 0 ? (
                <div className="flex flex-col">
                  {notifications.map((notif) => {
                    const isRead = readIds.includes(notif.id);
                    return (
                      <Link
                        key={notif.id}
                        href={notif.link}
                        onClick={() => markAsRead(notif.id)}
                        className={cn(
                          "flex items-start gap-3 px-4 py-3 transition-colors border-b border-border last:border-0",
                          isRead
                            ? "bg-background opacity-60 hover:bg-muted/30" // Estilo para leídas
                            : "bg-muted/30 hover:bg-muted", // Estilo para NO leídas
                        )}
                      >
                        <div
                          className={cn(
                            "mt-1 h-2 w-2 rounded-full shrink-0",
                            // Si está leída, ponemos el punto gris o transparente
                            isRead
                              ? "bg-border"
                              : notif.type === "stock"
                                ? "bg-destructive"
                                : notif.type === "invoice"
                                  ? "bg-orange-500"
                                  : "bg-primary",
                          )}
                        />
                        <div className="space-y-1">
                          <p
                            className={cn(
                              "text-sm leading-none",
                              isRead
                                ? "font-normal text-muted-foreground"
                                : "font-medium text-foreground",
                            )}
                          >
                            {notif.title}
                          </p>
                          <p className="text-xs text-muted-foreground leading-snug">
                            {notif.description}
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground text-sm">
                  <Bell className="h-8 w-8 mx-auto mb-2 opacity-20" />
                  No tienes notificaciones pendientes.
                </div>
              )}
            </ScrollArea>
          </PopoverContent>
        </Popover>

        {/* ... (USER MENU IGUAL QUE ANTES) ... */}
        <div className="h-6 w-px bg-border hidden sm:block"></div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-3 pl-2 pr-1 h-auto py-1 hover:bg-accent rounded-full sm:rounded-lg"
            >
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold border border-primary/20 text-sm">
                {user ? (
                  userName.charAt(0).toUpperCase()
                ) : (
                  <Loader2 className="h-3 w-3 animate-spin" />
                )}
              </div>
              <div className="hidden sm:flex flex-col items-start text-left">
                <span className="text-sm font-semibold text-foreground leading-none">
                  {userName}
                </span>
                <span className="text-[10px] text-muted-foreground leading-none mt-1">
                  Productor
                </span>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground hidden sm:block" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-56 bg-popover border-border"
          >
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none text-foreground">
                  {userName}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {userEmail}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-border" />

            <Link href="/configuracion">
              <DropdownMenuItem className="cursor-pointer focus:bg-accent focus:text-accent-foreground">
                <span>Configuración</span>
              </DropdownMenuItem>
            </Link>

            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer"
              onClick={handleLogout}
            >
              Cerrar Sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
