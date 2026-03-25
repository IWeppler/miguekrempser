"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import { useMounted } from "@/shared/hooks/use-mounted";
import { Card, CardContent } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Button } from "@/shared/ui/button";
import { Separator } from "@/shared/ui/separator";
import {
  User,
  Mail,
  Building2,
  Save,
  Loader2,
  Palette,
  Moon,
  Sun,
} from "lucide-react";
import { toast } from "sonner";
import { SectionHeader, SectionBox, Field } from "./settings-components";
import { updateProfile } from "../actions/update-profile";
import { TableCompanies } from "./table-companies";
import { IssuerCompany } from "@/features/moves/types";
import { Switch } from "@/shared/ui/switch";

interface Props {
  user: { id: string; email?: string };
  profile: { full_name: string | null; role?: string };
  initialCompanies?: IssuerCompany[];
}

export function SettingsForm({ user, profile, initialCompanies = [] }: Props) {
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();

  // --- ESTADO PERFIL ---
  const [fullName, setFullName] = useState(profile.full_name || "");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // --- MANEJADORES ---
  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    const result = await updateProfile(user.id, fullName);
    setIsSavingProfile(false);

    if (result.success) {
      toast.success("Perfil actualizado correctamente");
    } else {
      toast.error("Error al actualizar perfil: " + result.error);
    }
  };

  const isDark = mounted && theme === "dark";

  return (
    <div className="space-y-8 pb-32 animate-in fade-in duration-500">
      <Card className="overflow-hidden border-border bg-card">
        {/* --- SECCIÓN 1: PERFIL --- */}
        <SectionHeader
          icon={<User className="h-5 w-5" />}
          title="Información Personal"
          description="Tus datos de acceso y perfil público."
        />
        <CardContent className="p-6 pt-0 space-y-6">
          <SectionBox>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <Field label="Nombre Completo">
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="bg-background h-10"
                />
              </Field>
              <Field label="Email">
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground opacity-50" />
                  <Input
                    value={user.email || ""}
                    readOnly
                    className="bg-muted pl-9 text-muted-foreground cursor-not-allowed h-10"
                  />
                </div>
              </Field>
            </div>
          </SectionBox>

          <div className="flex justify-end">
            <Button onClick={handleSaveProfile} disabled={isSavingProfile}>
              {isSavingProfile ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Guardar Perfil
            </Button>
          </div>
        </CardContent>

        <Separator className="opacity-50" />

        {/* --- SECCIÓN 2: GESTIÓN DE EMPRESAS --- */}
        <SectionHeader
          icon={<Building2 className="h-5 w-5" />}
          title="Gestión de Empresas"
          description="Razones sociales del grupo para documentos legales."
          className="pt-8"
        />
        <CardContent className="p-6 pt-0">
          <TableCompanies companies={initialCompanies} />
        </CardContent>

        {/* --- SECCIÓN 3: APARIENCIA --- */}
        <SectionHeader
          icon={<Palette className="h-5 w-5" />}
          title="Apariencia"
          description="Personaliza el tema visual del sistema."
          className="pt-8  border-t border-border"
        />
        <CardContent className="p-6 pt-0">
          <SectionBox>
            <div className="flex items-center justify-between">
              <div className="flex flex-col space-y-1">
                <span className="flex items-center gap-2 text-sm font-medium">
                  {mounted && isDark ? (
                    <Moon className="h-4 w-4" />
                  ) : (
                    <Sun className="h-4 w-4" />
                  )}
                  Modo {mounted && isDark ? "Oscuro" : "Claro"}
                </span>
                <span className="text-xs text-muted-foreground">
                  Ajusta el contraste para mayor comodidad.
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
      </Card>
    </div>
  );
}
