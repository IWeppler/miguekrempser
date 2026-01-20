"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/shared/ui/dialog";
import { Badge } from "@/shared/ui/badge";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  FileText,
  Calendar,
  Package,
  User,
  ArrowUpRight,
  ArrowDownLeft,
} from "lucide-react";
import { Movement } from "../types";

interface Props {
  movement: Movement | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MovementDetailDialog({ movement, open, onOpenChange }: Props) {
  if (!movement) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <FileText className="h-5 w-5 text-primary" />
            Detalle de Movimiento
          </DialogTitle>
          <DialogDescription>
            Información completa de la operación registrada.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Header Info */}
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Producto
              </p>
              <p className="text-lg font-bold text-foreground">
                {movement.products?.name || "Producto eliminado"}
              </p>
            </div>
            <div className="text-right">
              <Badge
                variant="outline"
                className={`font-normal ${
                  movement.type === "IN"
                    ? "bg-primary/10 text-primary border-primary/20"
                    : "bg-orange-500/10 text-orange-600 border-orange-500/20"
                }`}
              >
                {movement.type === "IN" ? (
                  <>
                    <ArrowDownLeft className="mr-1.5 h-3 w-3" /> Entrada
                  </>
                ) : (
                  <>
                    <ArrowUpRight className="mr-1.5 h-3 w-3" /> Salida
                  </>
                )}
              </Badge>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" /> Fecha
              </div>
              <p className="font-medium">
                {format(new Date(movement.created_at), "PPP p", { locale: es })}
              </p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Package className="h-4 w-4" /> Cantidad
              </div>
              <p className="font-medium text-lg">
                {movement.quantity}{" "}
                <span className="text-sm font-normal text-muted-foreground">
                  unidades
                </span>
              </p>
            </div>
            <div className="space-y-1 col-span-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" /> Responsable
              </div>
              <p className="font-medium">
                {movement.technician_name || "Sin asignar"}
              </p>
            </div>
          </div>

          {/* Description / Reason */}
          {movement.description && (
            <div className="border-t border-border pt-4">
              <h4 className="text-sm font-semibold mb-2 text-muted-foreground">
                Observaciones / Motivo
              </h4>
              <p className="text-sm text-foreground bg-muted/20 p-3 rounded-md border border-border">
                {movement.description}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
