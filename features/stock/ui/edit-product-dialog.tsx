"use client";

import { useState, useTransition } from "react";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/shared/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Edit, Loader2, Save } from "lucide-react";
import { Product } from "../types"; // Tu interfaz tipada
import { updateProduct } from "../actions/update-product"; // La acción que creamos arriba

export function EditProductDialog({ product }: { product: Product }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Estado local del formulario
  const [formData, setFormData] = useState({
    name: product.name,
    location: product.location || "",
    min_stock_alert: product.min_stock_alert || 0,
    average_cost: product.average_cost || 0,
    currency: product.currency || "USD", // Default seguro
  });

  const handleSave = () => {
    startTransition(async () => {
      const result = await updateProduct({
        id: product.id,
        ...formData,
      });

      if (result.success) {
        setOpen(false);
      } else {
        alert("Error al guardar");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 hover:bg-muted text-muted-foreground hover:text-primary"
        >
          <Edit className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar {product.name}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* NOMBRE */}
          <div className="grid gap-2">
            <Label htmlFor="name">Nombre del Producto</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* COSTO */}
            <div className="grid gap-2">
              <Label htmlFor="cost">Costo Promedio</Label>
              <Input
                id="cost"
                type="number"
                step="0.01"
                value={formData.average_cost}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    average_cost: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </div>

            {/* MONEDA */}
            <div className="grid gap-2">
              <Label>Moneda Ref.</Label>
              <Select
                value={formData.currency}
                onValueChange={(val: "USD" | "ARS") =>
                  setFormData({ ...formData, currency: val })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD (Dólares)</SelectItem>
                  <SelectItem value="ARS">ARS (Pesos)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* UBICACIÓN */}
            <div className="grid gap-2">
              <Label htmlFor="location">Ubicación / Estante</Label>
              <Input
                id="location"
                value={formData.location}
                placeholder="Ej: Galpón A"
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
              />
            </div>

            {/* ALERTA STOCK */}
            <div className="grid gap-2">
              <Label htmlFor="alert">Alerta Mínimo</Label>
              <Input
                id="alert"
                type="number"
                value={formData.min_stock_alert}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    min_stock_alert: parseInt(e.target.value) || 0,
                  })
                }
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" /> Guardar Cambios
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
