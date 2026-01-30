"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { type Lot } from "@/features/planning/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import {
  Map,
  Ruler,
  Tractor,
  MapPin,
  Layers,
  Filter,
  Sprout,
  Search,
  ArrowUpDown,
  X,
} from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { Input } from "@/shared/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";

interface Props {
  initialLots: Lot[];
}

type FilterStatus = "all" | "active" | "empty";
type SortOption = "name" | "size_desc" | "size_asc";

export function LotListManager({ initialLots }: Props) {
  // --- ESTADOS ---
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCrop, setSelectedCrop] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [sortBy, setSortBy] = useState<SortOption>("name");

  // --- LÓGICA DE FILTRADO ---
  const filteredAndSortedLots = useMemo(() => {
    let result = [...initialLots];

    // 1. Filtro de Texto (Busca en Nombre de Lote o Nombre de Campo)
    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      result = result.filter(
        (l) =>
          l.name.toLowerCase().includes(lowerTerm) ||
          l.field_name.toLowerCase().includes(lowerTerm),
      );
    }

    // 2. Filtro de Estado (Ocupado / Vacío)
    if (filterStatus === "active") {
      result = result.filter((l) => l.active_campaign);
    } else if (filterStatus === "empty") {
      result = result.filter((l) => !l.active_campaign);
    }

    // 3. Filtro de Cultivo (Botones)
    if (selectedCrop) {
      result = result.filter((l) => l.active_campaign?.crop === selectedCrop);
    }

    // 4. Ordenamiento
    result.sort((a, b) => {
      switch (sortBy) {
        case "size_desc": // Mayor a menor Has
          return b.hectares - a.hectares;
        case "size_asc": // Menor a mayor Has
          return a.hectares - b.hectares;
        case "name": // Alfabético Lote
          return a.name.localeCompare(b.name);
        default:
          return (
            a.field_name.localeCompare(b.field_name) ||
            a.name.localeCompare(b.name)
          );
      }
    });

    return result;
  }, [initialLots, searchTerm, filterStatus, selectedCrop, sortBy]);

  const availableCrops = Array.from(
    new Set(
      initialLots
        .map((l) => l.active_campaign?.crop)
        .filter((c): c is string => !!c),
    ),
  ).sort();

  const groupedLots = filteredAndSortedLots.reduce<Record<string, Lot[]>>(
    (acc, lot) => {
      const field = lot.field_name || "Sin Campo Asignado";
      if (!acc[field]) acc[field] = [];
      acc[field].push(lot);
      return acc;
    },
    {},
  );

  const fieldNames = Object.keys(groupedLots).sort();

  // Calcular Has Totales Filtradas
  const totalFilteredHas = filteredAndSortedLots.reduce(
    (acc, l) => acc + Number(l.hectares),
    0,
  );

  return (
    <div className="space-y-6">
      {/* --- BARRA DE HERRAMIENTAS --- */}
      <div className="bg-card border border-border rounded-lg p-4 space-y-4 shadow-sm">
        {/* Fila Superior: Buscador y Selectores Principales */}
        <div className="flex flex-col md:flex-row gap-4">
          {/* 1. BUSCADOR */}
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por lote o campo..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* 2. ESTADO (Todos/Vacíos/Ocupados) */}
          <Select
            value={filterStatus}
            onValueChange={(val) => {
              setFilterStatus(val as FilterStatus);
              if (val === "empty") setSelectedCrop(null); // Limpiar cultivo si busca vacíos
            }}
          >
            <SelectTrigger className="w-full md:w-[180px]">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="Estado" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los Lotes</SelectItem>
              <SelectItem value="active">Con Cultivo</SelectItem>
              <SelectItem value="empty">Vacíos</SelectItem>
            </SelectContent>
          </Select>

          {/* 3. ORDENAMIENTO */}
          <Select
            value={sortBy}
            onValueChange={(val) => setSortBy(val as SortOption)}
          >
            <SelectTrigger className="w-full md:w-[180px]">
              <div className="flex items-center gap-2">
                <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="Ordenar" />
              </div>
            </SelectTrigger>
            <SelectContent>
              {/* <SelectItem value="field">Agrupar por Campo</SelectItem> */}
              <SelectItem value="size_desc">Mayor Superficie</SelectItem>
              <SelectItem value="size_asc">Menor Superficie</SelectItem>
              <SelectItem value="name">Alfabético (A-Z)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Fila Inferior: Filtros de Cultivo (Solo visible si no filtramos por "Vacíos") */}
        {filterStatus !== "empty" && availableCrops.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/50">
            <span className="text-xs font-medium text-muted-foreground mr-2">
              Cultivos:
            </span>
            <Badge
              variant={selectedCrop === null ? "default" : "outline"}
              className="cursor-pointer hover:bg-primary/90"
              onClick={() => setSelectedCrop(null)}
            >
              Todos
            </Badge>
            {availableCrops.map((crop) => (
              <Badge
                key={crop}
                variant={selectedCrop === crop ? "default" : "outline"}
                className={`cursor-pointer ${selectedCrop === crop ? "bg-green-600 hover:bg-green-700" : "hover:bg-accent"}`}
                onClick={() =>
                  setSelectedCrop(selectedCrop === crop ? null : crop)
                }
              >
                {crop}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* --- RESULTADOS --- */}
      <div className="flex items-center justify-between text-sm text-muted-foreground px-1">
        <p>Mostrando {filteredAndSortedLots.length} lotes</p>
        <p>
          Superficie visible:{" "}
          <span className="font-medium text-foreground">
            {Math.round(totalFilteredHas).toLocaleString()} Ha
          </span>
        </p>
      </div>

      {fieldNames.length > 0 ? (
        fieldNames.map((fieldName) => {
          const fieldLots = groupedLots[fieldName] || [];
          if (fieldLots.length === 0) return null; // No mostrar campos vacíos tras filtrar

          const fieldHectares = fieldLots.reduce(
            (acc, l) => acc + (Number(l.hectares) || 0),
            0,
          );

          return (
            <div
              key={fieldName}
              className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500"
            >
              {/* ENCABEZADO DEL CAMPO */}
              <div className="flex items-center gap-3 bg-muted/40 p-3 rounded-lg border-l-4 border-primary">
                <div className="bg-white dark:bg-card p-2 rounded-md shadow-sm">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-bold text-foreground">
                    {fieldName}
                  </h2>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Layers className="h-3 w-3" /> {fieldLots.length} Lotes
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 font-medium text-green-600 dark:text-green-400">
                      <Ruler className="h-3 w-3" />{" "}
                      {Math.round(fieldHectares).toLocaleString()} Ha
                    </span>
                  </div>
                </div>
              </div>

              {/* GRILLA DE LOTES */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pl-2 md:pl-4 border-l border-border/50 ml-4">
                {fieldLots.map((lot: Lot) => (
                  <Link
                    key={lot.id}
                    href={`/lotes/${lot.id}`}
                    className="block group"
                  >
                    <Card
                      className={`hover:shadow-md transition-all hover:border-primary/50 cursor-pointer h-full ${lot.active_campaign ? "border-border bg-card" : ""}`}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-base font-bold group-hover:text-primary transition-colors">
                            {lot.name}
                          </CardTitle>
                          <div className="p-1.5 bg-muted rounded text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                            <Map className="h-4 w-4" />
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-2 text-sm text-foreground/80 font-medium mb-3">
                          <Ruler className="h-4 w-4 text-primary" />
                          {Number(lot.hectares).toLocaleString()} Ha
                        </div>

                        <div className="pt-3 border-t border-border flex flex-col gap-1">
                          {lot.active_campaign ? (
                            <div className="flex flex-col gap-1">
                              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                                Campaña Actual
                              </span>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-sm font-bold text-orange-500">
                                  <Sprout className="h-4 w-4" />
                                  <span>{lot.active_campaign.crop}</span>
                                </div>
                                <Badge
                                  variant="outline"
                                  className="text-[10px] h-5 border-border text-foreground"
                                >
                                  {lot.active_campaign.campaign}
                                </Badge>
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col gap-1">
                              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                                Estado
                              </span>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Tractor className="h-3 w-3 opacity-50" />
                                <span className="italic">
                                  Disponible / Barbecho
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          );
        })
      ) : (
        <div className="py-12 text-center text-muted-foreground">
          <Filter className="h-10 w-10 mx-auto mb-3 opacity-20" />
          <p>No se encontraron lotes con los filtros seleccionados.</p>
          <Button
            variant="link"
            onClick={() => {
              setSearchTerm("");
              setFilterStatus("all");
              setSelectedCrop(null);
            }}
          >
            Limpiar todos los filtros
          </Button>
        </div>
      )}
    </div>
  );
}
