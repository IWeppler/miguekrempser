"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Label,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Loader2 } from "lucide-react";

// Helper to map categories to chart colors
const getColorForCategory = (index: number) => {
  const colors = [
    "var(--chart-1)",
    "var(--chart-2)",
    "var(--chart-3)",
    "var(--chart-4)",
    "var(--chart-5)",
  ];
  return colors[index % colors.length];
};

interface ChartData {
  name: string;
  value: number;
  color: string;
  percent: number;
  [key: string]: string | number;
}

export function ExpenseDonut() {
  const [data, setData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch expenses (assuming a 'movements' table with type='OUT' or an 'expenses' table)
        // Adjust the table name and query logic to match your DB structure.
        // Example: grouping movements by category.
        const { data: movements, error } = await supabase
          .from("movements")
          .select("quantity, products(category)") // Assuming relation to products to get category
          .eq("type", "OUT");

        if (error) throw error;

        if (!movements) {
          setData([]);
          return;
        }

        // Aggregate data by category
        const aggregated: Record<string, number> = {};
        let totalSum = 0;

        movements.forEach((m) => {
          // Handle potentially missing product or category
          // @ts-expect-error: Supabase join typing can be complex
          const category = m.products?.category || "Sin Categoría";
          const value = Number(m.quantity) || 0; // Assuming quantity is the value, or use a 'cost' field if available

          if (!aggregated[category]) aggregated[category] = 0;
          aggregated[category] += value;
          totalSum += value;
        });

        // Format for Recharts
        const formattedData = Object.keys(aggregated).map((key, index) => ({
          name: key,
          value: aggregated[key],
          color: getColorForCategory(index),
          percent:
            totalSum > 0 ? Math.round((aggregated[key] / totalSum) * 100) : 0,
        }));

        // Sort by value desc
        formattedData.sort((a, b) => b.value - a.value);

        setData(formattedData);
      } catch (err) {
        console.error("Error fetching expense data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [supabase]);

  const totalValue = useMemo(
    () => data.reduce((acc, curr) => acc + curr.value, 0),
    [data]
  );

  if (loading) {
    return (
      <Card className="bg-card border-border flex flex-col h-[350px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border flex flex-col">
      <CardHeader className="pb-0">
        <CardTitle className="text-sm font-bold text-foreground">
          Distribución de Salidas (Stock)
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-between">
        {data.length > 0 ? (
          <>
            {/* GRÁFICO */}
            <div className="h-[200px] w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={85}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                  >
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}

                    {/* TEXTO CENTRAL */}
                    <Label
                      content={({ viewBox }) => {
                        if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                          return (
                            <text
                              x={viewBox.cx}
                              y={viewBox.cy}
                              textAnchor="middle"
                              dominantBaseline="middle"
                            >
                              <tspan
                                x={viewBox.cx}
                                y={viewBox.cy}
                                dy="-10"
                                className="fill-muted-foreground text-xs font-medium uppercase"
                              >
                                Total
                              </tspan>
                              <tspan
                                x={viewBox.cx}
                                y={viewBox.cy}
                                dy="15"
                                className="fill-foreground text-2xl font-bold"
                              >
                                {totalValue.toLocaleString()}
                              </tspan>
                            </text>
                          );
                        }
                      }}
                    />
                  </Pie>
                  <Tooltip
                    formatter={(value: number | undefined) =>
                      value != null ? value.toLocaleString() : ""
                    }
                    contentStyle={{
                      backgroundColor: "var(--popover)",
                      borderColor: "var(--border)",
                      color: "var(--popover-foreground)",
                      borderRadius: "8px",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                    itemStyle={{
                      color: "var(--foreground)",
                      fontSize: "12px",
                      fontWeight: 600,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* LISTA DE CATEGORÍAS */}
            <div className="space-y-3 mt-2">
              {data.map((item) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="text-[10px] font-bold px-2 py-1 rounded-md min-w-12 text-center text-primary-foreground"
                      style={{
                        backgroundColor: item.color,
                        opacity: 0.9,
                      }}
                    >
                      {item.percent}%
                    </span>
                    <span className="text-sm text-foreground font-medium">
                      {item.name}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {item.value.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">
            No hay datos registrados.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
