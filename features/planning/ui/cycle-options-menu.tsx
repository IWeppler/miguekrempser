"use client";

import { useState } from "react";
import { MoreVertical, Trash2, PlayCircle, Loader2 } from "lucide-react";
import { deleteCycle, activateCycle } from "../actions/cycle-actions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/shared/ui/dropdown-menu";
import { Button } from "@/shared/ui/button";

interface Props {
  cycleId: string;
  lotId: string;
  status: string;
}

export function CycleOptionsMenu({ cycleId, lotId, status }: Props) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (
      !confirm(
        "¿Seguro que quieres borrar este historial? Se perderán las labores asociadas.",
      )
    )
      return;
    setLoading(true);
    await deleteCycle(cycleId, lotId);
    setLoading(false);
  };

  const handleActivate = async () => {
    setLoading(true);
    await activateCycle(cycleId, lotId);
    setLoading(false);
  };

  if (loading) {
    return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-6 w-6 -mr-2">
          <MoreVertical className="h-3 w-3 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {/* Solo permitimos activar si es Planificado (Futuro) */}
        {status === "planned" && (
          <>
            <DropdownMenuItem
              onClick={handleActivate}
              className="cursor-pointer text-green-700 focus:text-green-800"
            >
              <PlayCircle className="mr-2 h-4 w-4" /> Iniciar Campaña
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}

        <DropdownMenuItem
          onClick={handleDelete}
          className="cursor-pointer text-red-600 focus:text-red-700"
        >
          <Trash2 className="mr-2 h-4 w-4" /> Eliminar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
