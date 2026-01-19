"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";
import { Badge } from "@/shared/ui/badge";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  FileText,
} from "lucide-react";
import { MovementActions } from "@/features/moves/ui/movement-actions";

// Tipos
export interface Movement {
  id: string;
  created_at: string;
  type: "IN" | "OUT";
  quantity: number;
  technician_name: string | null;
  product_id: string;
  description: string | null;
  products: { name: string } | null;
}

type SortField = "created_at" | "type" | "product" | "quantity" | "technician";
type SortDirection = "asc" | "desc";

interface Props {
  initialMovements: Movement[];
}

// Helper para el ícono de ordenamiento
const SortIcon = ({
  field,
  currentSortField,
  sortDirection,
}: {
  field: SortField;
  currentSortField: SortField;
  sortDirection: SortDirection;
}) => {
  if (currentSortField !== field) {
    return <ArrowUpDown className="ml-2 h-3 w-3 text-muted-foreground/50" />;
  }
  return sortDirection === "asc" ? (
    <ArrowUp className="ml-2 h-3 w-3 text-foreground" />
  ) : (
    <ArrowDown className="ml-2 h-3 w-3 text-foreground" />
  );
};

export function MovementsTable({ initialMovements }: Props) {
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  // Lógica de Ordenamiento
  const sortedMovements = [...initialMovements].sort((a, b) => {
    const multiplier = sortDirection === "asc" ? 1 : -1;

    switch (sortField) {
      case "created_at":
        return (
          (new Date(a.created_at).getTime() -
            new Date(b.created_at).getTime()) *
          multiplier
        );
      case "type":
        return a.type.localeCompare(b.type) * multiplier;
      case "product":
        const prodA = a.products?.name || "";
        const prodB = b.products?.name || "";
        return prodA.localeCompare(prodB) * multiplier;
      case "quantity":
        return (a.quantity - b.quantity) * multiplier;
      case "technician":
        const techA = a.technician_name || "";
        const techB = b.technician_name || "";
        return techA.localeCompare(techB) * multiplier;
      default:
        return 0;
    }
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc"); // Default a ascendente al cambiar columna
    }
  };

  return (
    <div className="rounded-md border border-border bg-card shadow-sm overflow-hidden">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow className="hover:bg-transparent border-b border-border">
            <TableHead
              className="w-[180px] cursor-pointer hover:text-foreground transition-colors pl-6"
              onClick={() => handleSort("created_at")}
            >
              <div className="flex items-center">
                Fecha{" "}
                <SortIcon
                  field="created_at"
                  currentSortField={sortField}
                  sortDirection={sortDirection}
                />
              </div>
            </TableHead>

            <TableHead
              className="cursor-pointer hover:text-foreground transition-colors"
              onClick={() => handleSort("type")}
            >
              <div className="flex items-center">
                Tipo{" "}
                <SortIcon
                  field="type"
                  currentSortField={sortField}
                  sortDirection={sortDirection}
                />
              </div>
            </TableHead>

            <TableHead
              className="cursor-pointer hover:text-foreground transition-colors"
              onClick={() => handleSort("product")}
            >
              <div className="flex items-center">
                Producto{" "}
                <SortIcon
                  field="product"
                  currentSortField={sortField}
                  sortDirection={sortDirection}
                />
              </div>
            </TableHead>

            <TableHead
              className="text-right cursor-pointer hover:text-foreground transition-colors pr-8"
              onClick={() => handleSort("quantity")}
            >
              <div className="flex items-center justify-end">
                Cantidad{" "}
                <SortIcon
                  field="quantity"
                  currentSortField={sortField}
                  sortDirection={sortDirection}
                />
              </div>
            </TableHead>

            <TableHead
              className="cursor-pointer hover:text-foreground transition-colors"
              onClick={() => handleSort("technician")}
            >
              <div className="flex items-center">
                Responsable{" "}
                <SortIcon
                  field="technician"
                  currentSortField={sortField}
                  sortDirection={sortDirection}
                />
              </div>
            </TableHead>

            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {sortedMovements.length > 0 ? (
            sortedMovements.map((move) => (
              <TableRow
                key={move.id}
                className="hover:bg-muted/50 transition-colors border-b border-border last:border-0"
              >
                {/* 1. FECHA */}
                <TableCell className="pl-6 py-3">
                  <div className="flex flex-col">
                    <span className="font-medium text-foreground text-sm">
                      {new Date(move.created_at).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                      <Clock className="h-3 w-3" />
                      {new Date(move.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </TableCell>

                {/* 2. TIPO */}
                <TableCell className="py-3">
                  <Badge
                    variant="secondary"
                    className={`font-medium px-2 py-0.5 rounded-md border ${
                      move.type === "IN"
                        ? "bg-primary/10 text-primary border-primary/20"
                        : "bg-orange-500/10 text-orange-600 border-orange-500/20"
                    }`}
                  >
                    {move.type === "IN" ? (
                      <ArrowDownLeft className="mr-1.5 h-3 w-3" />
                    ) : (
                      <ArrowUpRight className="mr-1.5 h-3 w-3" />
                    )}
                    {move.type === "IN" ? "Entrada" : "Salida"}
                  </Badge>
                </TableCell>

                {/* 3. PRODUCTO */}
                <TableCell className="py-3">
                  <div className="font-medium text-foreground text-sm">
                    {move.products?.name || "Producto eliminado"}
                  </div>
                </TableCell>

                {/* 4. CANTIDAD */}
                <TableCell className="text-right py-3 pr-8">
                  <span className="font-bold font-mono text-foreground text-sm">
                    {move.quantity}
                  </span>
                  <span className="text-xs text-muted-foreground ml-1">ud</span>
                </TableCell>

                {/* 5. RESPONSABLE */}
                <TableCell className="py-3">
                  {move.technician_name ? (
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground border border-border">
                        {move.technician_name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm text-muted-foreground truncate max-w-[120px]">
                        {move.technician_name}
                      </span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground/50 text-sm italic">
                      --
                    </span>
                  )}
                </TableCell>

                {/* 6. ACCIONES */}
                <TableCell className="text-right py-3 pr-4">
                  <MovementActions move={move} />
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={6}
                className="h-48 text-center text-muted-foreground"
              >
                <div className="flex flex-col items-center justify-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                    <FileText className="h-6 w-6 text-muted-foreground/50" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium text-foreground">
                      Sin movimientos
                    </p>
                    <p className="text-sm text-muted-foreground">
                      No hay registros que coincidan con tu búsqueda.
                    </p>
                  </div>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
