"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import { useMounted } from "@/shared/hooks/use-mounted";
import { Card, CardContent } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Button } from "@/shared/ui/button";
import { Switch } from "@/shared/ui/switch";
import { Separator } from "@/shared/ui/separator";
import {
  User,
  Lock,
  Save,
  Mail,
  Shield,
  Bell,
  Moon,
  Sun,
  Palette,
  Loader2,
} from "lucide-react";
// Import from your separate components file
import {
  SectionHeader,
  SectionBox,
  Field,
  ToggleRow,
} from "./settings-components";

export function SettingsForm() {
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();
  const [isLoading, setIsLoading] = useState(false);
  const [stockAlerts, setStockAlerts] = useState(true);
  const [invoiceAlerts, setInvoiceAlerts] = useState(true);

  const handleSave = () => {
    setIsLoading(true);
    console.log("Guardando:", { theme, stockAlerts, invoiceAlerts });
    setTimeout(() => setIsLoading(false), 1500);
  };

  const isDark = mounted && theme === "dark";

  return (
    <>
      <Card className="overflow-hidden border-border shadow-sm bg-card">
        {/* --- 1. INFO PERSONAL --- */}
        <SectionHeader
          icon={<User className="h-5 w-5" />}
          title="Información Personal"
          description="Datos básicos de tu cuenta."
        />

        <CardContent className="p-6 pt-0">
          <SectionBox>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <Field label="Nombre Completo">
                <Input
                  defaultValue="Ignacio"
                  className="bg-background border-input"
                />
              </Field>

              <Field label="Correo Electrónico">
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    defaultValue="ignacio@agrogestion.com"
                    readOnly
                    // 'bg-muted' gives it a readonly look in both modes
                    className="bg-muted pl-9 text-muted-foreground border-input"
                  />
                </div>
              </Field>

              <Field label="Rol / Cargo" className="md:col-span-2">
                <Input
                  defaultValue="Productor / Administrador"
                  readOnly
                  className="bg-muted text-muted-foreground border-input"
                />
              </Field>
            </div>
          </SectionBox>
        </CardContent>

        <Separator className="bg-border" />

        {/* --- 2. APARIENCIA --- */}
        <SectionHeader
          icon={<Palette className="h-5 w-5" />}
          title="Apariencia"
          description="Personaliza la interfaz visual."
          className="pt-8"
        />

        <CardContent className="p-6 pt-0">
          <SectionBox>
            <div className="flex items-center justify-between">
              <div className="flex flex-col space-y-1">
                <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                  {mounted ? (
                    isDark ? (
                      <Moon className="h-4 w-4" />
                    ) : (
                      <Sun className="h-4 w-4" />
                    )
                  ) : (
                    <Sun className="h-4 w-4" />
                  )}
                  Modo {mounted && isDark ? "Oscuro" : "Claro"}
                </span>
                <span className="text-xs text-muted-foreground">
                  Ajusta el tema para reducir la fatiga visual.
                </span>
              </div>
              <Switch
                checked={isDark}
                onCheckedChange={(checked) =>
                  setTheme(checked ? "dark" : "light")
                }
                disabled={!mounted}
              />
            </div>
          </SectionBox>
        </CardContent>

        <Separator className="bg-border" />

        {/* --- 3. SEGURIDAD --- */}
        <SectionHeader
          icon={<Shield className="h-5 w-5" />}
          title="Seguridad"
          description="Gestión de contraseña."
          className="pt-8"
        />

        <CardContent className="p-6 pt-0">
          <SectionBox>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <Field label="Contraseña Actual" className="md:col-span-2">
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="password"
                    placeholder="••••••••"
                    className="bg-background pl-9 border-input"
                  />
                </div>
              </Field>

              <Field label="Nueva Contraseña">
                <Input type="password" className="bg-background border-input" />
              </Field>

              <Field label="Confirmar Contraseña">
                <Input type="password" className="bg-background border-input" />
              </Field>
            </div>

            <div className="mt-4 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-8 border-border text-foreground hover:bg-muted"
              >
                Actualizar solo contraseña
              </Button>
            </div>
          </SectionBox>
        </CardContent>

        <Separator className="bg-border" />

        {/* --- 4. NOTIFICACIONES --- */}
        <SectionHeader
          icon={<Bell className="h-5 w-5" />}
          title="Notificaciones"
          description="Alertas por correo electrónico."
          className="pt-8"
        />

        <CardContent className="p-6 pt-0">
          <SectionBox>
            <div className="space-y-6">
              <ToggleRow
                title="Stock Crítico"
                description="Recibir un mail cuando un insumo baje del mínimo."
                checked={stockAlerts}
                onCheckedChange={setStockAlerts}
              />
              <Separator className="bg-border" />
              <ToggleRow
                title="Vencimiento de Facturas"
                description="Recordatorios 48hs antes del vencimiento."
                checked={invoiceAlerts}
                onCheckedChange={setInvoiceAlerts}
              />
            </div>
          </SectionBox>
        </CardContent>
      </Card>

      {/* --- STICKY FOOTER --- */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card px-6 py-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Última modificación: hace 2 días
          </p>
          <div className="flex gap-4">
            <Button
              variant="ghost"
              className="text-muted-foreground hover:text-foreground"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={isLoading}
              // Primary color logic is handled by globals.css
              className="min-w-[140px]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" /> Guardar Cambios
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
