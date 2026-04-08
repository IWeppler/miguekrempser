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
import { TablePagination } from "@/shared/components/table-pagination";

import { Invoice } from "../types";
import { format } from "date-fns";
import { CreateInvoiceDialog } from "./create-invoice-dialog";
import { InvoiceDetailDialog } from "./invoice-detail-dialog";
import { updateInvoiceStatus } from "../actions/update-invoice-status";
import { deleteInvoice } from "../actions/delete-invoice";
import { EditInvoiceDialog } from "./edit-invoice-dialog";

// Tipado estricto para los campos de ordenamiento
type SortField =
  | "invoice_number"
  | "supplier"
  | "purchaser_company"
  | "date"
  | "due_date"
  | "status"
  | "amount";

type SortDirection = "asc" | "desc";

interface Props {
  readonly products: { id: string; name: string }[];
  readonly suppliers: { id: string; name: string }[];
  readonly myCompanies: { id: string; name: string }[];
  readonly initialInvoices: Invoice[];
}

interface SortIconProps {
  field: SortField;
  currentSortField: SortField;
  sortDirection: SortDirection;
}

const ITEMS_PER_PAGE = 10;

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

export function InvoicesTable({
  products,
  suppliers,
  initialInvoices,
  myCompanies,
}: Props) {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>("date");
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
    const company = inv.purchaser_company?.toLowerCase() || "";

    return (
      supplierName.includes(term) ||
      number.includes(term) ||
      company.includes(term)
    );
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
      case "purchaser_company":
        return (
          (a.purchaser_company || "").localeCompare(b.purchaser_company || "") *
          multiplier
        );
      case "date":
        return (
          (new Date(a.date).getTime() - new Date(b.date).getTime()) * multiplier
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

  // Lógica de Paginación
  const totalPages = Math.ceil(sortedInvoices.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentItems = sortedInvoices.slice(
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
    setCurrentPage(1);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
    setCurrentPage(1);
  };

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
      alert("Error al eliminar: " + result.error); // Idealmente usaríamos un Toast en lugar de un alert nativo.
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
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por proveedor, empresa o número..."
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-blue pl-9"
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>

        <div className="flex-none w-full sm:w-auto">
          <CreateInvoiceDialog
            products={products}
            suppliers={suppliers}
            myCompanies={myCompanies}
          />
        </div>
      </div>

      {/* TABLE */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
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
                  onClick={() => handleSort("purchaser_company")}
                  className="cursor-pointer hidden md:table-cell"
                >
                  <div className="flex items-center">
                    Empresa{" "}
                    <SortIcon
                      field="purchaser_company"
                      currentSortField={sortField}
                      sortDirection={sortDirection}
                    />
                  </div>
                </TableHead>

                <TableHead
                  onClick={() => handleSort("date")}
                  className="cursor-pointer"
                >
                  <div className="flex items-center">
                    Emisión{" "}
                    <SortIcon
                      field="date"
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
                    Vto.{" "}
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
              {currentItems.length > 0 ? (
                currentItems.map((inv) => {
                  // Extracción de lógica de estado (Soluciona S3358 - Nested Ternary)
                  let statusLabel = inv.status;
                  let statusClasses = "cursor-pointer select-none ";

                  if (inv.status === "paid") {
                    statusLabel = "Pagado";
                    statusClasses +=
                      "bg-green-100 text-green-700 hover:bg-green-200";
                  } else if (inv.status === "pending") {
                    statusLabel = "Pendiente";
                    statusClasses +=
                      "bg-yellow-100 text-yellow-700 hover:bg-yellow-200";
                  } else if (inv.status === "overdue") {
                    statusLabel = "Vencido";
                    statusClasses += "bg-red-100 text-red-700 hover:bg-red-200";
                  }

                  return (
                    <TableRow
                      key={inv.id}
                      className="hover:bg-muted/50 transition-colors"
                    >
                      <TableCell className="font-medium">
                        <button
                          onClick={() => handleViewDetails(inv)}
                          className="hover:underline"
                        >
                          {inv.invoice_number}
                        </button>
                      </TableCell>

                      <TableCell>{inv.suppliers?.name || "-"}</TableCell>

                      <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                        {inv.purchaser_company || "-"}
                      </TableCell>

                      <TableCell className="text-sm">
                        {inv.date
                          ? format(new Date(inv.date), "dd/MM/yy")
                          : "-"}
                      </TableCell>

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
                            className={statusClasses}
                            onClick={() =>
                              handleStatusChange(
                                inv.id,
                                inv.status === "paid" ? "pending" : "paid",
                              )
                            }
                          >
                            {statusLabel}
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
                                  navigator.clipboard.writeText(
                                    inv.invoice_number,
                                  )
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
                                onClick={() =>
                                  handleStatusChange(inv.id, "paid")
                                }
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
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    Sin resultados.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          startIndex={startIndex}
          endIndex={Math.min(
            startIndex + ITEMS_PER_PAGE,
            sortedInvoices.length,
          )}
          totalItems={sortedInvoices.length}
          onPrevPage={goToPrevPage}
          onNextPage={goToNextPage}
          itemName="facturas"
        />
      </div>
    </div>
  );
}
