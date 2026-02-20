"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { markInvoicePaid } from "@/features/finance/actions/mark-invoice-paid";
import { useRouter } from "next/navigation";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { format } from "date-fns";
import {
  Calendar,
  DollarSign,
  Package,
  Loader2,
  ExternalLink,
  Building2,
  CheckCircle2,
} from "lucide-react";
import { Invoice } from "../types";

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
  const [isPaying, setIsPaying] = useState(false);

  useEffect(() => {
    async function fetchLinkedMovements() {
      if (!invoice?.id || !open) return;
      setLoadingMovements(true);
      const { data } = await supabase
        .from("movements")
        .select("id, quantity, products(name)")
        .eq("invoice_id", invoice.id);

      setMovements((data as unknown as LinkedMovement[]) || []);
      setLoadingMovements(false);
    }
    fetchLinkedMovements();
  }, [invoice, open, supabase]);

  const handleMarkAsPaid = async () => {
    if (!invoice) return;
    setIsPaying(true);
    const result = await markInvoicePaid(invoice.id);
    setIsPaying(false);

    if (result.success) {
      onOpenChange(false);
      router.refresh();
    } else {
      alert("Error: " + result.error);
    }
  };

  if (!invoice) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] border-none shadow-lg">
        <DialogHeader className="flex flex-row items-center justify-between border-b pb-4">
          <div className="space-y-1">
            <DialogTitle className="text-xl font-bold">
              Factura {invoice.invoice_number}
            </DialogTitle>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
              Detalles del comprobante
            </p>
          </div>
          <Badge
            variant="outline"
            className={
              invoice.status === "paid"
                ? "text-green-600 border-green-200 bg-green-50"
                : "text-orange-600 border-orange-200 bg-orange-50"
            }
          >
            {invoice.status === "paid" ? "Pagado" : "Pendiente"}
          </Badge>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Datos Principales */}
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Building2 className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground uppercase">
                  Proveedor y Comprador
                </p>
                <p className="text-sm font-semibold">
                  {invoice.suppliers?.name || "S/D"}
                </p>
                <p className="text-xs text-muted-foreground italic">
                  Para: {invoice.purchaser_company}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-10">
              <div className="flex items-start gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground uppercase">
                    Emisión
                  </p>
                  <p className="text-sm font-medium">
                    {invoice.date
                      ? format(new Date(invoice.date), "dd/MM/yyyy")
                      : "-"}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground uppercase">
                    Vencimiento
                  </p>
                  <p className="text-sm font-medium">
                    {invoice.due_date
                      ? format(new Date(invoice.due_date), "dd/MM/yyyy")
                      : "-"}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <DollarSign className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground uppercase">
                  Monto Total
                </p>
                <p className="text-xl font-bold text-primary">
                  {invoice.currency}{" "}
                  {invoice.amount_total?.toLocaleString("es-AR", {
                    minimumFractionDigits: 2,
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Archivo Adjunto */}
          {invoice.file_url && (
            <div className="border-t pt-4">
              <Button
                variant="link"
                asChild
                className="h-auto p-0 text-primary text-xs gap-1"
              >
                <a
                  href={invoice.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-3 w-3" /> Ver comprobante digital
                </a>
              </Button>
            </div>
          )}

          {/* Stock vinculados */}
          <div className="border-t pt-4 space-y-3">
            <p className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-2">
              <Package className="h-3 w-3" /> Artículos vinculados
            </p>
            {loadingMovements ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground mx-auto" />
            ) : (
              <div className="space-y-2">
                {movements.map((move) => (
                  <div
                    key={move.id}
                    className="flex justify-between items-center text-sm border-b border-dotted pb-1 last:border-0"
                  >
                    <span className="text-muted-foreground">
                      {move.products?.name}
                    </span>
                    <span className="font-mono font-medium">
                      +{move.quantity}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Botón de Pago */}
          {invoice.status !== "paid" && (
            <div className="pt-4">
              <Button
                onClick={handleMarkAsPaid}
                disabled={isPaying}
                className="w-full bg-green-600 hover:bg-green-700 text-white h-11"
              >
                {isPaying ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                )}
                Registrar Pago
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
