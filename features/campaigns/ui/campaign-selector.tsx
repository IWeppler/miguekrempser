"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarRange, Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { setCampaign } from "@/features/campaigns/actions/set-campaign";
import type { Campaign } from "@/features/campaigns/lib/get-campaign";

interface Props {
  readonly campaigns: Campaign[];
  readonly selected: string;
}

export function CampaignSelector({ campaigns, selected }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleChange = (value: string) => {
    startTransition(async () => {
      await setCampaign(value);
      router.refresh();
    });
  };

  return (
    <Select value={selected} onValueChange={handleChange} disabled={isPending}>
      <SelectTrigger className="h-9 w-[150px] bg-background text-sm font-medium">
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : (
          <CalendarRange className="h-4 w-4 text-primary" />
        )}
        <SelectValue placeholder="Campaña" />
      </SelectTrigger>
      <SelectContent>
        {campaigns.map((c) => (
          <SelectItem key={c.id} value={c.name}>
            {c.name}
            {c.is_active ? "" : " (cerrada)"}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
