"use client";

import Link from "next/link";
import { Button } from "@/shared/ui/button";
import { Plus, FileText, Truck } from "lucide-react";

export function QuickActions() {
  return (
    <div className="grid grid-cols-2 gap-3 md:flex md:items-center bg-card p-4 rounded-lg border border-border shadow-sm">
      {/* 1. ACCIÓN PRINCIPAL: Nuevo Remito 
      */}
      <Link href="/movimientos/nuevo" className="col-span-2 md:flex-1">
        <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground gap-2 h-12 md:h-10 text-base md:text-sm font-bold shadow-md transition-all active:scale-[0.98]">
          <Plus className="h-5 w-5" /> Nuevo Remito
        </Button>
      </Link>

      {/* Separador vertical */}
      <div className="hidden md:block h-8 w-px bg-border mx-2"></div>

      {/* 2. ACCIÓN SECUNDARIA: Cargar Factura
       */}
      <Link href="/finanzas?new=true" className="col-span-1 md:flex-1">
        <Button
          variant="outline"
          className="w-full h-12 md:h-10 border-dashed border-2 text-muted-foreground hover:text-primary hover:border-primary/50 hover:bg-accent/50 gap-2"
        >
          <FileText className="h-4 w-4 shrink-0" />
          <span className="truncate text-xs md:text-sm">Cargar Factura</span>
        </Button>
      </Link>

      {/* 3. ACCIÓN SECUNDARIA: Ver Stock  */}

      <Link href="/stock" className="col-span-1 md:flex-1">
        <Button
          variant="outline"
          className="w-full h-12 md:h-10 border-dashed border-2 text-muted-foreground hover:text-primary hover:border-primary/50 hover:bg-accent/50 gap-2"
        >
          <Truck className="h-4 w-4 shrink-0" />
          <span className="truncate text-xs md:text-sm">Ver Stock</span>
        </Button>
      </Link>
    </div>
  );
}
