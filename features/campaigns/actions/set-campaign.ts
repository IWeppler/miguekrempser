"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { CAMPAIGN_COOKIE } from "@/features/campaigns/lib/get-campaign";

export async function setCampaign(name: string) {
  const cookieStore = await cookies();
  cookieStore.set(CAMPAIGN_COOKIE, name, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  revalidatePath("/", "layout");
}
