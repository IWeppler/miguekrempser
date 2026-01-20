"use client";

import Link from "next/link";
import { Button } from "@/shared/ui/button";
import { Plus, FileText, Truck } from "lucide-react";

export function QuickActions() {
  return (
    <div className="bg-card rounded-lg border border-border shadow-sm p-2 flex flex-col sm:flex-row gap-2">
      <Link href="/movimientos/nuevo" className="flex-1">
        <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground gap-2 shadow-sm h-10">
          <Plus className="h-4 w-4" /> Nuevo Remito
        </Button>
      </Link>
      <div className="w-px bg-border mx-2 hidden sm:block"></div>
      <Link href="/finanzas?new=true" className="flex-1">
        <Button
          variant="ghost"
          className="w-full text-muted-foreground hover:bg-muted gap-2 h-10 border border-transparent hover:border-border"
        >
          <FileText className="h-4 w-4 text-muted-foreground" /> Cargar Factura
        </Button>
      </Link>
      <Link href="/stock" className="flex-1">
        <Button
          variant="ghost"
          className="w-full text-muted-foreground hover:bg-muted gap-2 h-10 border border-transparent hover:border-border"
        >
          <Truck className="h-4 w-4 text-muted-foreground" /> Ver Stock
        </Button>
      </Link>
    </div>
  );
}
