"use client";

import { useState } from "react";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Edit, Trash2 } from "lucide-react";

interface Product {
  id: string;
  name: string;
  category: string;
  current_stock: number;
  min_stock_alert: number;
  unit: string;
  location?: string;
}

export function EditProductDialog({ product }: { product: Product }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted">
          <Edit className="h-4 w-4 text-muted-foreground" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar {product.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid gap-2">
            <Label>Nombre</Label>
            <Input defaultValue={product.name} />
          </div>
          <div className="grid gap-2">
            <Label>Ubicación</Label>
            <Input defaultValue={product.location} />
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button>Guardar Cambios</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
