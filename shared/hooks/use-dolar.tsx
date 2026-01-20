"use client";

import { useState, useEffect } from "react";

export interface DolarData {
  compra: number;
  venta: number;
  fecha: string;
}

interface DolarApiResponse {
  moneda: string;
  casa: string;
  nombre: string;
  compra: number;
  venta: number;
  fechaActualizacion: string;
}

export function useDolar() {
  const [oficial, setOficial] = useState<DolarData | null>(null);
  const [blue, setBlue] = useState<DolarData | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetch("https://dolarapi.com/v1/dolares");
        if (!res.ok) throw new Error("Error API");

        const data: DolarApiResponse[] = await res.json();

        const ofi = data.find((d) => d.casa === "oficial");
        const blu = data.find((d) => d.casa === "blue");

        if (ofi) {
          setOficial({
            compra: ofi.compra,
            venta: ofi.venta,
            fecha: ofi.fechaActualizacion,
          });
        }
        if (blu) {
          setBlue({
            compra: blu.compra,
            venta: blu.venta,
            fecha: blu.fechaActualizacion,
          });
        }
      } catch (err) {
        console.error("Error fetching dolar:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return { oficial, blue, loading, error };
}
