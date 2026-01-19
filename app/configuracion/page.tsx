import { SettingsForm } from "@/features/settings/ui/settings-form";

export const metadata = {
  title: "Configuración | AgroGestión",
  description: "Administra tu cuenta y preferencias",
};

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-4xl pb-32">
      {/* HEADER ESTÁTICO (Server Side Rendered) */}
      <div className="mb-8 space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Configuración
        </h1>
        <p className="text-sm text-muted-foreground">
          Administra tu cuenta, apariencia y preferencias del sistema en un solo
          lugar.
        </p>
      </div>

      {/* FORMULARIO INTERACTIVO (Client Component) */}
      <SettingsForm />
    </div>
  );
}
