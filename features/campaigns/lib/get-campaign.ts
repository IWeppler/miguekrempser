import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export const CAMPAIGN_COOKIE = "campaign";

export interface Campaign {
  id: string;
  name: string;
  is_active: boolean;
  closed_at: string | null;
}

export interface CampaignContext {
  /** Campaña que el usuario está viendo (cookie o activa por defecto) */
  selected: string;
  /** Campaña activa donde se registran los nuevos movimientos/facturas */
  active: string;
  /** true si la campaña seleccionada está cerrada (solo lectura) */
  isClosed: boolean;
  campaigns: Campaign[];
}

export async function getCampaignContext(): Promise<CampaignContext> {
  const supabase = await createClient();
  const cookieStore = await cookies();

  const { data } = await supabase
    .from("campaigns")
    .select("id, name, is_active, closed_at")
    .order("created_at", { ascending: false });

  const campaigns = (data || []) as Campaign[];
  const active = campaigns.find((c) => c.is_active)?.name ?? "";

  const fromCookie = cookieStore.get(CAMPAIGN_COOKIE)?.value;
  const selected =
    fromCookie && campaigns.some((c) => c.name === fromCookie)
      ? fromCookie
      : active;

  return { selected, active, isClosed: selected !== active, campaigns };
}
