"use client";

import React, { useState } from "react";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { format } from "date-fns";
import { Package, Download, Loader2, Search, Plus } from "lucide-react";
import { TablePagination } from "@/shared/components/table-pagination";
import { RemitoDocument } from "@/features/moves/components/remito-pdf";
import { type RemitoSchema } from "@/features/moves/schemas/remito-schema";
import { type IssuerCompany } from "@/features/moves/types";

export interface MovementItem {
  product_id: string;
  quantity: number;
  products: { name: string } | null;
}

export interface RemitoRow {
  id: string;
  created_at: string;
  order_number: string;
  technician: string;
  destination: string;
  driver: string;
  plate: string;
  observations: string | null;
  movements: MovementItem[];
}

interface Props {
  readonly remitos: RemitoRow[];
  readonly issuer: IssuerCompany;
}

const ITEMS_PER_PAGE = 10;

const mapToRemitoSchema = (
  remito: RemitoRow,
  issuerCompanyId: string,
): RemitoSchema => ({
  orderNumber: remito.order_number,
  technician: remito.technician,
  issuerCompanyId,
  destination: remito.destination || "No especificado",
  driver: remito.driver || "-",
  plate: remito.plate || "-",
  observations: remito.observations || "",
  items:
    remito.movements?.map((item) => ({
      productId: item.product_id,
      quantity: item.quantity,
      unit: "Unidad",
      notes: item.products?.name || "Producto Desconocido",
    })) || [],
});

export function RemitosTable({ remitos, issuer }: Props) {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");

  if (!remitos || remitos.length === 0) {
    return (
      <div className="p-8 text-center bg-white border border-border rounded-xl">
        <p className="text-muted-foreground text-sm">
          No hay remitos emitidos todavía.
        </p>
      </div>
    );
  }

  // 1. Lógica de Filtrado (Búsqueda)
  const filteredRemitos = remitos.filter((remito) => {
    const term = searchTerm.toLowerCase();
    const orderNumber = remito.order_number?.toLowerCase() || "";
    const destination = remito.destination?.toLowerCase() || "";
    const technician = remito.technician?.toLowerCase() || "";
    const driver = remito.driver?.toLowerCase() || "";
    const plate = remito.plate?.toLowerCase() || "";

    return (
      orderNumber.includes(term) ||
      destination.includes(term) ||
      technician.includes(term) ||
      driver.includes(term) ||
      plate.includes(term)
    );
  });

  // 2. Lógica de Paginación (basada en los resultados filtrados)
  const totalPages = Math.ceil(filteredRemitos.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentItems = filteredRemitos.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE,
  );

  const goToNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const goToPrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Resetear a la página 1 cuando el usuario busca
  };

  return (
    <div className="space-y-4">
      {/* Buscador / Toolbar Separado */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center bg-card p-3 rounded-lg border border-border">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por N° orden, destino o responsable..."
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-blue pl-9"
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>

        <div className="flex-none w-full sm:w-auto">
          {/* Botón Crear Remito (Estilizado de color verde como el de la imagen) */}
          <button
            type="button"
            className="flex w-full items-center justify-center gap-2 bg-[#008060] hover:bg-[#006e52] text-white px-4 h-10 rounded-md text-sm font-medium transition-colors"
            onClick={() => console.log("Abrir modal/página para crear remito")}
          >
            <Plus className="h-4 w-4" />
            Crear remito
          </button>
        </div>
      </div>

      {/* Contenedor de la Tabla */}
      <div className="bg-card border border-border rounded-xl overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground font-medium border-b border-border">
              <tr>
                <th className="px-4 py-3 font-bold uppercase text-[10px] tracking-wider">
                  Fecha / N° Orden
                </th>
                <th className="px-4 py-3 font-bold uppercase text-[10px] tracking-wider">
                  Destino
                </th>
                <th className="px-4 py-3 font-bold uppercase text-[10px] tracking-wider">
                  Responsable
                </th>
                <th className="px-4 py-3 font-bold uppercase text-[10px] tracking-wider">
                  Items
                </th>
                <th className="px-4 py-3 font-bold uppercase text-[10px] tracking-wider text-right">
                  Acción
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredRemitos.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="p-8 text-center text-muted-foreground text-sm"
                  >
                    No se encontraron remitos que coincidan con tu búsqueda.
                  </td>
                </tr>
              ) : (
                currentItems.map((remito: RemitoRow) => (
                  <tr
                    key={remito.id}
                    className="transition-colors hover:bg-muted/30"
                  >
                    <td className="px-4 py-3">
                      <div className="font-semibold text-foreground">
                        #{remito.order_number}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {format(
                          new Date(remito.created_at),
                          "dd/MM/yyyy HH:mm",
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="text-sm font-medium">
                        {remito.destination}
                      </div>
                      <div className="text-[10px] text-muted-foreground uppercase">
                        Transp: {remito.driver || "-"} | {remito.plate || "-"}
                      </div>
                    </td>

                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {remito.technician}
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700 bg-slate-100 w-max px-2 py-1 rounded-md">
                        <Package className="h-3 w-3" />
                        {remito.movements?.length || 0} prod.
                      </div>
                    </td>

                    <td className="px-4 py-3 text-right">
                      <PDFDownloadLink
                        document={
                          <RemitoDocument
                            data={mapToRemitoSchema(remito, issuer.id)}
                            products={
                              remito.movements?.map((i) => ({
                                id: i.product_id,
                                name: i.products?.name || "Desconocido",
                              })) || []
                            }
                            createdAt={remito.created_at}
                            issuer={issuer}
                          />
                        }
                        fileName={`Remito-${remito.order_number}.pdf`}
                        className="inline-flex items-center justify-center gap-2 h-8 px-3 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors"
                      >
                        {({ loading }) => (
                          <>
                            {loading ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Download className="h-3.5 w-3.5" />
                            )}
                            {loading ? "Preparando..." : "Descargar"}
                          </>
                        )}
                      </PDFDownloadLink>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          startIndex={startIndex}
          endIndex={Math.min(
            startIndex + ITEMS_PER_PAGE,
            filteredRemitos.length,
          )}
          totalItems={filteredRemitos.length}
          onPrevPage={goToPrevPage}
          onNextPage={goToNextPage}
          itemName="remitos"
        />
      </div>
    </div>
  );
}
