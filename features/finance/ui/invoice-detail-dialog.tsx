"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { markInvoicePaid } from "@/features/finance/actions/mark-invoice-paid"; // Import the new action
import { useRouter } from "next/navigation"; // To refresh page data

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/shared/ui/dialog";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  FileText,
  Calendar,
  DollarSign,
  Package,
  Loader2,
  ArrowDownLeft,
  CheckCircle,
} from "lucide-react";
import { Invoice } from "./invoices-table";

interface Props {
  invoice: Invoice | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface LinkedMovement {
  id: string;
  quantity: number;
  products: { name: string } | null;
}

export function InvoiceDetailDialog({ invoice, open, onOpenChange }: Props) {
  const supabase = createClient();
  const router = useRouter();
  const [movements, setMovements] = useState<LinkedMovement[]>([]);
  const [loadingMovements, setLoadingMovements] = useState(false);

  // Payment loading state
  const [isPaying, setIsPaying] = useState(false);

  // Load movements logic...
  useEffect(() => {
    async function fetchLinkedMovements() {
      if (!invoice?.id || !open) return;

      setLoadingMovements(true);
      const { data } = await supabase
        .from("movements")
        .select("id, quantity, products(name)")
        .eq("invoice_id", invoice.id);

      if (data) {
        setMovements(data as unknown as LinkedMovement[]);
      } else {
        setMovements([]);
      }
      setLoadingMovements(false);
    }

    fetchLinkedMovements();
  }, [invoice, open, supabase]);

  // Handle Payment
  const handleMarkAsPaid = async () => {
    if (!invoice) return;

    setIsPaying(true);
    const result = await markInvoicePaid(invoice.id);
    setIsPaying(false);

    if (result.success) {
      // Close dialog and refresh data to show updated status
      onOpenChange(false);
      router.refresh();
    } else {
      alert("Error al registrar el pago: " + result.error);
    }
  };

  if (!invoice) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <FileText className="h-5 w-5 text-primary" />
            Factura {invoice.invoice_number}
          </DialogTitle>
          <DialogDescription>
            Detalles del comprobante y movimientos asociados.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Header Info */}
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Proveedor
              </p>
              <p className="text-lg font-bold text-foreground">
                {invoice.suppliers?.name || "Desconocido"}
              </p>
            </div>
            <div className="text-right">
              <Badge
                variant={invoice.status === "paid" ? "default" : "secondary"}
                className={
                  invoice.status === "paid"
                    ? "bg-primary text-primary-foreground"
                    : "bg-orange-500/10 text-orange-600 border-orange-500/20"
                }
              >
                {invoice.status === "paid"
                  ? "Pagado"
                  : invoice.status === "overdue"
                    ? "Vencido"
                    : "Pendiente"}
              </Badge>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" /> Vencimiento
              </div>
              <p className="font-medium">
                {invoice.due_date
                  ? format(new Date(invoice.due_date), "PPP", { locale: es })
                  : "-"}
              </p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <DollarSign className="h-4 w-4" /> Monto Total
              </div>
              <p className="font-medium text-lg">
                {invoice.currency} {invoice.amount?.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Stock Movement Indicator */}
          <div className="border-t border-border pt-4">
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Package className="h-4 w-4" /> Ingresos de Stock
            </h4>

            {loadingMovements ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            ) : movements.length > 0 ? (
              <div className="space-y-2">
                {movements.map((move) => (
                  <div
                    key={move.id}
                    className="flex items-center justify-between p-3 bg-muted/20 rounded-md border border-border"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center text-green-700">
                        <ArrowDownLeft className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {move.products?.name || "Producto"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Ingreso vinculado
                        </p>
                      </div>
                    </div>
                    <div className="text-right font-bold text-sm">
                      +{move.quantity} ud.
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-muted/20 p-3 rounded-md text-sm text-muted-foreground italic text-center">
                No hay movimientos de stock registrados con esta factura.
              </div>
            )}
          </div>

          {/* ACTIONS FOOTER */}
          {invoice.status !== "paid" && (
            <div className="border-t border-border pt-4 flex justify-end">
              <Button
                onClick={handleMarkAsPaid}
                disabled={isPaying}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {isPaying ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="mr-2 h-4 w-4" />
                )}
                Pago Realizado
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
