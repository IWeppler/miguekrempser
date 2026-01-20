import { createClient } from "@/lib/supabase/server";
import { type Product } from "@/features/stock/types";
import { StockView } from "@/features/stock/ui/stock-view"; // Importamos el nuevo componente

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

  // 1. CARGA PARALELA
  const [productsRes, dollarRate] = await Promise.all([
    supabase.from("products").select("*").order("name"),
    getDolarExchangeRate(),
  ]);

  const rawProducts = productsRes.data || [];

  // Casting seguro
  const productList = rawProducts.map((p) => ({
    ...p,
    currency: p.currency || "USD",
  })) as Product[];

  // 2. RENDERIZAR VISTA CLIENTE
  return <StockView initialData={productList} dollarRate={dollarRate} />;
}
