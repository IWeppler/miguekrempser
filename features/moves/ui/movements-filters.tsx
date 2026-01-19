"use client";

import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { Input } from "@/shared/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { Button } from "@/shared/ui/button";
import { Search, X } from "lucide-react";
import { useState, useEffect } from "react";
import { useDebounce } from "use-debounce";

export function MovementsFilters() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const [term, setTerm] = useState(searchParams.get("query")?.toString() || "");
  const [type, setType] = useState(
    searchParams.get("type")?.toString() || "all"
  );

  const [debouncedTerm] = useDebounce(term, 300);

  useEffect(() => {
    const params = new URLSearchParams(searchParams);

    params.set("page", "1");

    if (debouncedTerm) {
      params.set("query", debouncedTerm);
    } else {
      params.delete("query");
    }

    if (type && type !== "all") {
      params.set("type", type);
    } else {
      params.delete("type");
    }

    replace(`${pathname}?${params.toString()}`);
  }, [debouncedTerm, type, pathname, replace, searchParams]); // searchParams en dep puede causar loop si no se tiene cuidado, pero aquí params se crea nuevo.

  const clearFilters = () => {
    setTerm("");
    setType("all");
    replace(pathname);
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6 bg-card p-4 rounded-lg border shadow-sm">
      <div className="relative flex-1">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground/50" />
        <Input
          placeholder="Buscar por responsable..."
          className="pl-9"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
        />
      </div>

      <Select value={type} onValueChange={setType}>
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder="Tipo de operación" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          <SelectItem value="IN">Ingresos (Compras)</SelectItem>
          <SelectItem value="OUT">Egresos (Remitos)</SelectItem>
        </SelectContent>
      </Select>

      {(term || type !== "all") && (
        <Button
          variant="ghost"
          onClick={clearFilters}
          className="text-destructive hover:text-destructive/80 hover:bg-destructive/10"
        >
          <X className="mr-2 h-4 w-4" /> Limpiar
        </Button>
      )}
    </div>
  );
}
