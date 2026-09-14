import { createClient } from "@/lib/supabase/server";
import { type Product } from "@/features/stock/types";
import { StockView } from "@/features/stock/ui/stock-view";
import { getCampaignContext } from "@/features/campaigns/lib/get-campaign";
import { ClosedCampaignBanner } from "@/features/campaigns/ui/closed-campaign-banner";

async function getDolarExchangeRate() {
  try {
    const res = await fetch("https://dolarapi.com/v1/dolares/oficial", {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return 1150;
    const data = await res.json();
    return data.venta || 1150;
  } catch (error) {
    console.error("Error fetching dolar:", error);
    return 1150;
  }
}

export default async function StockPage() {
  const supabase = await createClient();
  const campaign = await getCampaignContext();

  // 1. CARGA PARALELA
  const [productsRes, dollarRate] = await Promise.all([
    supabase.from("products").select("*").order("name"),
    getDolarExchangeRate(),
  ]);

  const rawProducts = productsRes.data || [];

  // Casting seguro
  let productList = rawProducts.map((p) => ({
    ...p,
    currency: p.currency || "USD",
  })) as Product[];

  // Campaña cerrada: mostramos el stock final guardado al cierre
  if (campaign.isClosed) {
    const { data: closings } = await supabase
      .from("campaign_stock_closings")
      .select("*")
      .eq("campaign", campaign.selected)
      .order("product_name");

    productList = (closings || []).map((c) => ({
      id: c.product_id ?? c.id,
      name: c.product_name,
      category: c.category ?? "",
      unit: c.unit ?? "Unidad",
      location: c.location,
      current_stock: Number(c.final_stock ?? 0),
      min_stock_alert: 0,
      average_cost: Number(c.average_cost ?? 0),
      currency: (c.currency || "USD") as Product["currency"],
    }));
  }

  // 2. RENDERIZAR VISTA CLIENTE
  return (
    <div className="space-y-4">
      {campaign.isClosed && (
        <ClosedCampaignBanner campaign={campaign.selected} />
      )}
      <StockView
        initialData={productList}
        dollarRate={dollarRate}
        readOnly={campaign.isClosed}
      />
    </div>
  );
}
