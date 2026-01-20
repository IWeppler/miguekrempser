"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { MoreHorizontal, Copy, FileText } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { Movement } from "@/features/moves/types";

interface Props {
  movements: Movement[];
}

export function RecentMovementsTable({ movements }: Props) {
  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
  };

  return (
    <Card className="shadow-sm max-h-full border-border bg-card">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-lg font-bold text-foreground">
            Últimos Movimientos
          </CardTitle>
        </div>
        <Link href="/movimientos">
          <Button
            variant="outline"
            size="sm"
            className="text-xs border-border text-muted-foreground hover:text-foreground"
          >
            Ver Historial Completo
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="p-0">
        <div className="relative w-full overflow-auto">
          <table className="w-full caption-bottom text-sm text-left">
            <thead className="[&_tr]:border-b border-border bg-muted/30">
              <tr className="border-b border-border transition-colors">
                <th className="h-10 px-4 align-middle font-medium text-muted-foreground">
                  Fecha/Hora
                </th>
                <th className="h-10 px-4 align-middle font-medium text-muted-foreground">
                  Tipo
                </th>
                <th className="h-10 px-4 align-middle font-medium text-muted-foreground">
                  Detalle
                </th>
                <th className="h-10 px-4 align-middle font-medium text-muted-foreground text-right">
                  Cant.
                </th>
                <th className="h-10 px-4 align-middle font-medium text-muted-foreground text-right">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
              {movements.map((move) => (
                <tr
                  key={move.id}
                  className="border-b border-border transition-colors hover:bg-muted/50 group"
                >
                  <td className="p-4 align-middle text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">
                      {new Date(move.created_at).toLocaleDateString()}
                    </span>
                    <span className="block text-muted-foreground/80">
                      {new Date(move.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </td>
                  <td className="p-4 align-middle">
                    <Badge
                      variant="outline"
                      className={`font-normal ${
                        move.type === "IN"
                          ? "bg-primary/10 text-primary border-primary/20"
                          : "bg-orange-500/10 text-orange-600 border-orange-500/20"
                      }`}
                    >
                      {move.type === "IN" ? "Ingreso" : "Salida"}
                    </Badge>
                  </td>
                  <td className="p-4 align-middle">
                    <div className="font-medium text-foreground">
                      {move.products?.name || "Producto eliminado"}
                    </div>
                    <div
                      className="text-xs text-muted-foreground truncate max-w-[150px]"
                      title={move.technician_name || ""}
                    >
                      {move.technician_name || "Sin responsable"}
                    </div>
                  </td>
                  <td className="p-4 align-middle text-right font-mono font-medium text-foreground">
                    {move.quantity}{" "}
                    <span className="text-xs text-muted-foreground">ud</span>
                  </td>

                  {/* --- ACCIONES FUNCIONALES --- */}
                  <td className="p-4 align-middle text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                        >
                          <span className="sr-only">Abrir menú</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Opciones</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleCopyId(move.id)}>
                          <Copy className="mr-2 h-4 w-4" /> Copiar ID
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href="/movimientos" className="cursor-pointer">
                            <FileText className="mr-2 h-4 w-4" /> Ver Detalles
                          </Link>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}

              {movements.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="p-8 text-center text-muted-foreground"
                  >
                    No hay movimientos registrados aún.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
