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
  Pencil,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  MoreVertical,
  Trash2,
  CheckCircle,
  XCircle,
  Loader2,
  Eye,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/ui/alert-dialog";

import { CreateInvoiceDialog } from "./create-invoice-dialog";
import { InvoiceDetailDialog } from "./invoice-detail-dialog";
import { format } from "date-fns";
import { Invoice } from "../types";
import { updateInvoiceStatus } from "../actions/update-invoice-status";
import { deleteInvoice } from "../actions/delete-invoice";
import { updateInvoice } from "../actions/update-invoice";
import { EditInvoiceDialog } from "./edit-invoice-dialog";

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

interface SortIconProps {
  field: SortField;
  currentSortField: SortField;
  sortDirection: SortDirection;
}

const SortIcon = ({
  field,
  currentSortField,
  sortDirection,
}: SortIconProps) => {
  if (currentSortField !== field)
    return <ArrowUpDown className="ml-2 h-3 w-3 text-muted-foreground/50" />;
  return sortDirection === "asc" ? (
    <ArrowUp className="ml-2 h-3 w-3" />
  ) : (
    <ArrowDown className="ml-2 h-3 w-3" />
  );
};

export function InvoicesTable({ products, suppliers, initialInvoices }: Props) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<SortField>("due_date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [invoiceToEdit, setInvoiceToEdit] = useState<Invoice | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  // Estado para Detalles
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Estado para Eliminar
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Estado para Actualizar Status
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<string | null>(null);

  // Filtros y Ordenamiento
  const filteredInvoices = initialInvoices.filter((inv) => {
    const term = searchTerm.toLowerCase();
    const supplierName = inv.suppliers?.name?.toLowerCase() || "";
    const number = inv.invoice_number?.toLowerCase() || "";
    return supplierName.includes(term) || number.includes(term);
  });

  const sortedInvoices = [...filteredInvoices].sort((a, b) => {
    const multiplier = sortDirection === "asc" ? 1 : -1;
    switch (sortField) {
      case "invoice_number":
        return (
          (a.invoice_number || "").localeCompare(b.invoice_number || "") *
          multiplier
        );
      case "supplier":
        return (
          (a.suppliers?.name || "").localeCompare(b.suppliers?.name || "") *
          multiplier
        );
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

  // Función para abrir el modal de detalles
  const handleViewDetails = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setDetailOpen(true);
  };

  const handleDelete = async () => {
    if (!invoiceToDelete) return;
    setIsDeleting(true);
    const result = await deleteInvoice(invoiceToDelete.id);
    setIsDeleting(false);
    setInvoiceToDelete(null);
    if (!result.success) {
      alert("Error al eliminar: " + result.error);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    setIsUpdatingStatus(id);
    await updateInvoiceStatus(id, newStatus);
    setIsUpdatingStatus(null);
  };

  const handleEdit = (invoice: Invoice) => {
    setInvoiceToEdit(invoice);
    setIsEditOpen(true);
  };

  return (
    <div className="space-y-4">
      <InvoiceDetailDialog
        invoice={selectedInvoice}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />

      <EditInvoiceDialog
        invoice={invoiceToEdit}
        open={isEditOpen}
        onOpenChange={(open) => {
          setIsEditOpen(open);
          if (!open) setInvoiceToEdit(null);
        }}
        products={products}
        suppliers={suppliers}
      />

      {/* MODAL CONFIRMACIÓN DE BORRADO */}
      <AlertDialog
        open={!!invoiceToDelete}
        onOpenChange={(open) => !open && setInvoiceToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará la factura{" "}
              <b>{invoiceToDelete?.invoice_number}</b> y revertirá el stock
              asociado. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            {/* Agregamos variant="outline" y size="default" (o "sm") explícitamente */}
            <AlertDialogCancel
              disabled={isDeleting}
              variant="outline"
              size="default"
            >
              Cancelar
            </AlertDialogCancel>

            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
              variant="destructive"
              size="default"
            >
              {isDeleting ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* HEADER TOOLS */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center bg-card p-3 rounded-lg border border-border shadow-sm">
        <div className="relative flex-1 basis-0">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por proveedor o número..."
            className="pl-9 h-10 bg-background border-input w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* El contenedor del botón se mantiene igual */}
        <div className="flex-none w-full sm:w-auto">
          <CreateInvoiceDialog products={products} suppliers={suppliers} />
        </div>
      </div>

      {/* TABLE */}
      <div className="rounded-md border border-border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead
                onClick={() => handleSort("invoice_number")}
                className="cursor-pointer"
              >
                <div className="flex items-center">
                  Nro{" "}
                  <SortIcon
                    field="invoice_number"
                    currentSortField={sortField}
                    sortDirection={sortDirection}
                  />
                </div>
              </TableHead>
              <TableHead
                onClick={() => handleSort("supplier")}
                className="cursor-pointer"
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
                onClick={() => handleSort("due_date")}
                className="cursor-pointer"
              >
                <div className="flex items-center">
                  Fecha{" "}
                  <SortIcon
                    field="due_date"
                    currentSortField={sortField}
                    sortDirection={sortDirection}
                  />
                </div>
              </TableHead>
              <TableHead
                onClick={() => handleSort("status")}
                className="cursor-pointer"
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
                onClick={() => handleSort("amount")}
                className="cursor-pointer text-right"
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
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedInvoices.length > 0 ? (
              sortedInvoices.map((inv) => (
                <TableRow key={inv.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">
                    {/* Hacemos clickable el número también */}
                    <button
                      onClick={() => handleViewDetails(inv)}
                      className="hover:underline"
                    >
                      {inv.invoice_number}
                    </button>
                  </TableCell>
                  <TableCell>{inv.suppliers?.name || "-"}</TableCell>
                  <TableCell>
                    {inv.due_date
                      ? format(new Date(inv.due_date), "dd/MM/yy")
                      : "-"}
                  </TableCell>
                  <TableCell>
                    {isUpdatingStatus === inv.id ? (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    ) : (
                      <Badge
                        className={`
                                cursor-pointer select-none
                                ${inv.status === "paid" ? "bg-green-100 text-green-700 hover:bg-green-200" : ""}
                                ${inv.status === "pending" ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200" : ""}
                                ${inv.status === "overdue" ? "bg-red-100 text-red-700 hover:bg-red-200" : ""}
                            `}
                        onClick={() =>
                          handleStatusChange(
                            inv.id,
                            inv.status === "paid" ? "pending" : "paid",
                          )
                        }
                      >
                        {inv.status === "paid"
                          ? "Pagado"
                          : inv.status === "pending"
                            ? "Pendiente"
                            : inv.status}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {inv.currency === "USD" ? "u$s" : "$"}{" "}
                    {inv.amount_total?.toLocaleString("es-AR", {
                      minimumFractionDigits: 2,
                    })}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      {/* Menú de Acciones */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() =>
                              navigator.clipboard.writeText(inv.invoice_number)
                            }
                          >
                            Copiar Nro
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={() => handleViewDetails(inv)}
                          >
                            <Eye className="mr-2 h-4 w-4" /> Ver Detalles
                          </DropdownMenuItem>

                          <DropdownMenuItem onClick={() => handleEdit(inv)}>
                            <Pencil className="mr-2 h-4 w-4" /> Editar
                          </DropdownMenuItem>

                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleStatusChange(inv.id, "paid")}
                          >
                            <CheckCircle className="mr-2 h-4 w-4 text-green-600" />{" "}
                            Marcar Pagado
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              handleStatusChange(inv.id, "pending")
                            }
                          >
                            <XCircle className="mr-2 h-4 w-4 text-yellow-600" />{" "}
                            Marcar Pendiente
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setInvoiceToDelete(inv)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  Sin resultados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
