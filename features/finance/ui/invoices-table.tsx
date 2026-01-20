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
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import {
  Search,
  FileText,
  Eye,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { CreateInvoiceDialog } from "./create-invoice-dialog";
import { InvoiceDetailDialog } from "./invoice-detail-dialog";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Invoice } from "../types";

type SortField =
  | "invoice_number"
  | "supplier"
  | "due_date"
  | "status"
  | "amount";
type SortDirection = "asc" | "desc";

interface Props {
  products: { id: string; name: string }[];
  suppliers: { id: string; name: string }[];
  initialInvoices: Invoice[];
}

// --- COMPONENTE HELPER EXTRAÍDO (Solución al error) ---
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

// --- COMPONENTE PRINCIPAL ---
export function InvoicesTable({ products, suppliers, initialInvoices }: Props) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [sortField, setSortField] = useState<SortField>("due_date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  // Filtro en cliente
  const filteredInvoices = initialInvoices.filter((inv) => {
    const term = searchTerm.toLowerCase();
    const supplierName = inv.suppliers?.name?.toLowerCase() || "";
    const number = inv.invoice_number?.toLowerCase() || "";
    return supplierName.includes(term) || number.includes(term);
  });

  // Ordenamiento
  const sortedInvoices = [...filteredInvoices].sort((a, b) => {
    const multiplier = sortDirection === "asc" ? 1 : -1;

    switch (sortField) {
      case "invoice_number":
        return (
          (a.invoice_number || "").localeCompare(b.invoice_number || "") *
          multiplier
        );
      case "supplier":
        const nameA = a.suppliers?.name || "";
        const nameB = b.suppliers?.name || "";
        return nameA.localeCompare(nameB) * multiplier;
      case "due_date":
        return (
          (new Date(a.due_date).getTime() - new Date(b.due_date).getTime()) *
          multiplier
        );
      case "status":
        return (a.status || "").localeCompare(b.status || "") * multiplier;
      case "amount":
        return ((a.amount_total || 0) - (b.amount_total || 0)) * multiplier;
      default:
        return 0;
    }
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleViewDetails = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setDetailOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* DETAIL DIALOG */}
      <InvoiceDetailDialog
        invoice={selectedInvoice}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />

      {/* BARRA DE HERRAMIENTAS */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-card p-4 rounded-lg border border-border shadow-sm">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por proveedor o nro..."
            className="pl-9 bg-background border-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          {/* Botón de Filtros eliminado como pediste, solo queda Crear Factura */}
          <CreateInvoiceDialog products={products} suppliers={suppliers} />
        </div>
      </div>

      {/* TABLA */}
      <div className="rounded-md border border-border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow className="border-border hover:bg-transparent">
              <TableHead
                className="cursor-pointer hover:text-foreground transition-colors"
                onClick={() => handleSort("invoice_number")}
              >
                <div className="flex items-center">
                  Nro. Factura{" "}
                  <SortIcon
                    field="invoice_number"
                    currentSortField={sortField}
                    sortDirection={sortDirection}
                  />
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:text-foreground transition-colors"
                onClick={() => handleSort("supplier")}
              >
                <div className="flex items-center">
                  Proveedor{" "}
                  <SortIcon
                    field="supplier"
                    currentSortField={sortField}
                    sortDirection={sortDirection}
                  />
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:text-foreground transition-colors"
                onClick={() => handleSort("due_date")}
              >
                <div className="flex items-center">
                  Vencimiento{" "}
                  <SortIcon
                    field="due_date"
                    currentSortField={sortField}
                    sortDirection={sortDirection}
                  />
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:text-foreground transition-colors"
                onClick={() => handleSort("status")}
              >
                <div className="flex items-center">
                  Estado{" "}
                  <SortIcon
                    field="status"
                    currentSortField={sortField}
                    sortDirection={sortDirection}
                  />
                </div>
              </TableHead>
              <TableHead
                className="text-right cursor-pointer hover:text-foreground transition-colors"
                onClick={() => handleSort("amount")}
              >
                <div className="flex items-center justify-end">
                  Monto{" "}
                  <SortIcon
                    field="amount"
                    currentSortField={sortField}
                    sortDirection={sortDirection}
                  />
                </div>
              </TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedInvoices.length > 0 ? (
              sortedInvoices.map((inv) => (
                <TableRow
                  key={inv.id}
                  className="border-border hover:bg-muted/50"
                >
                  <TableCell className="font-medium text-foreground">
                    <button
                      onClick={() => handleViewDetails(inv)}
                      className="hover:underline hover:text-primary focus:outline-none text-left"
                    >
                      {inv.invoice_number}
                    </button>
                  </TableCell>
                  <TableCell className="text-foreground">
                    {inv.suppliers?.name || "Desconocido"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {inv.due_date
                      ? format(new Date(inv.due_date), "dd MMM yyyy", {
                          locale: es,
                        })
                      : "-"}
                  </TableCell>
                  <TableCell>
                    {inv.status === "paid" && (
                      <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-transparent">
                        Pagado
                      </Badge>
                    )}
                    {inv.status === "pending" && (
                      <Badge className="bg-orange-500/10 text-orange-600 hover:bg-orange-500/20 border-transparent">
                        Pendiente
                      </Badge>
                    )}
                    {inv.status === "overdue" && (
                      <Badge className="bg-destructive/10 text-destructive hover:bg-destructive/20 border-transparent">
                        Vencido
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-bold text-foreground">
                    {inv.currency === "USD" ? "USD" : "$"}{" "}
                    {inv.amount_total?.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewDetails(inv)}
                      className="text-primary hover:text-primary/80 hover:bg-primary/10"
                    >
                      <Eye className="mr-2 h-4 w-4" /> Ver Detalles
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-32 text-center text-muted-foreground"
                >
                  <div className="flex flex-col items-center justify-center gap-2">
                    <FileText className="h-8 w-8 text-muted-foreground/50" />
                    <p>No se encontraron facturas.</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
