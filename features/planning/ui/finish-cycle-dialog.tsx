"use client";

import { useState } from "react";
import {
  Loader2,
  Archive,
  CheckCircle2,
  DollarSign,
  Scale,
} from "lucide-react";
import { finishCycle } from "../actions/cycle-actions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";

interface Props {
  cycleId: string;
  lotId: string;
  cropName: string;
}

export function FinishCycleDialog({ cycleId, lotId, cropName }: Props) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Estados para Rinde y Precio
  const [yieldVal, setYieldVal] = useState("");
  const [priceVal, setPriceVal] = useState("");

  const handleFinish = async () => {
    setIsLoading(true);
    const finalYield = parseFloat(yieldVal) || 0;
    const finalPrice = parseFloat(priceVal) || 0;

    const res = await finishCycle(cycleId, lotId, finalYield, finalPrice);
    setIsLoading(false);

    if (res.success) {
      setOpen(false);
    } else {
      alert("Error al finalizar");
    }
  };

  // Cálculo en tiempo real del Ingreso Bruto Estimado
  const grossIncome = (parseFloat(yieldVal) || 0) * (parseFloat(priceVal) || 0);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="ml-auto text-xs border-dashed border-red-300 hover:border-red-500 hover:bg-red-50 text-red-600"
        >
          <Archive className="mr-2 h-3 w-3" /> Cerrar
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Finalizar Campaña de {cropName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <p className="text-sm text-muted-foreground">
            Al cerrar, el ciclo pasa al <strong>Historial</strong>. Ingresa los
            datos de cosecha para calcular el Margen Bruto.
          </p>

          <div className="grid grid-cols-2 gap-4">
            {/* INPUT RINDE */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Scale className="h-3 w-3" /> Rinde (Tn/Ha)
              </Label>
              <Input
                type="number"
                placeholder="Ej: 2.5"
                value={yieldVal}
                onChange={(e) => setYieldVal(e.target.value)}
              />
            </div>

            {/* INPUT PRECIO */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <DollarSign className="h-3 w-3" /> Precio (USD/Tn)
              </Label>
              <Input
                type="number"
                placeholder="Ej: 340"
                value={priceVal}
                onChange={(e) => setPriceVal(e.target.value)}
              />
            </div>
          </div>

          {/* PREVISUALIZACIÓN DE INGRESO */}
          {grossIncome > 0 && (
            <div className="flex justify-between items-center p-3 bg-green-50 text-green-800 rounded-md border border-green-200">
              <span className="text-sm font-medium">
                Ingreso Bruto Estimado:
              </span>
              <span className="text-lg font-bold">
                USD {grossIncome.toFixed(2)} / Ha
              </span>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleFinish} disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="mr-2 h-4 w-4" />
            )}
            Confirmar Cierre
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
