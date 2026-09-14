import { Archive } from "lucide-react";

export function ClosedCampaignBanner({ campaign }: { readonly campaign: string }) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-orange-500/30 bg-orange-500/10 px-3 py-2 text-sm text-orange-700 dark:text-orange-400">
      <Archive className="h-4 w-4 shrink-0" />
      <span>
        Estás viendo la campaña <strong>{campaign}</strong> (cerrada). Los datos
        son de solo lectura; las nuevas operaciones se registran en la campaña
        activa.
      </span>
    </div>
  );
}
