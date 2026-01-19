"use client";

import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { Button } from "@/shared/ui/button";
import { MoreVertical, Printer, FileText, Eye } from "lucide-react";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { RemitoDocument } from "@/features/moves/components/remito-pdf";
import { type RemitoSchema } from "@/features/moves/schemas/remito-schema";
import { MovementDetailDialog } from "./movement-detail-dialog";

interface MovementRow {
  id: string;
  created_at: string;
  technician_name: string | null;
  quantity: number;
  product_id: string;
  description: string | null;
  type: "IN" | "OUT";
  products: { name: string } | null;
  remitos?: {
    order_number: string;
    destination: string;
    driver: string;
    plate: string;
    technician: string;
  } | null;
}

interface Props {
  move: MovementRow;
}

export function MovementActions({ move }: Props) {
  const [detailOpen, setDetailOpen] = useState(false);

  // 2. Usar datos reales del remito si existen (Si es un movimiento viejo, usa defaults)
  const remitoInfo = move.remitos;

  const remitoData: RemitoSchema = {
    // Si existe nro de orden real, usarlo. Sino generar uno con el ID.
    orderNumber:
      remitoInfo?.order_number || `MOV-${move.id.slice(0, 8).toUpperCase()}`,

    technician:
      remitoInfo?.technician || move.technician_name || "Sin responsable",

    // DATOS REALES (Ya no mockeados)
    destination: remitoInfo?.destination || "No especificado (Histórico)",
    driver: remitoInfo?.driver || "-",
    plate: remitoInfo?.plate || "-",

    items: [
      {
        productId: move.product_id,
        quantity: move.quantity,
        unit: "Unidad",
        batch: "",
      },
    ],
    observations: move.description || "",
  };

  const productsMock = [
    { id: move.product_id, name: move.products?.name || "Desconocido" },
  ];

  return (
    <>
      <MovementDetailDialog
        movement={move}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full"
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Acciones</DropdownMenuLabel>

          <DropdownMenuItem onClick={() => setDetailOpen(true)}>
            <Eye className="mr-2 h-4 w-4" /> Ver Detalle
          </DropdownMenuItem>

          <DropdownMenuItem
            onSelect={(e) => e.preventDefault()}
            className="cursor-pointer"
          >
            <div className="flex items-center w-full">
              <PDFDownloadLink
                document={
                  <RemitoDocument
                    data={remitoData}
                    products={productsMock}
                    createdAt={move.created_at}
                  />
                }
                fileName={`remito-${remitoData.orderNumber}.pdf`}
                className="flex items-center w-full text-foreground hover:text-primary transition-colors"
              >
                {({ loading }) => (
                  <>
                    {loading ? (
                      <FileText className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Printer className="mr-2 h-4 w-4" />
                    )}
                    {loading ? "Generando..." : "Imprimir Remito"}
                  </>
                )}
              </PDFDownloadLink>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
