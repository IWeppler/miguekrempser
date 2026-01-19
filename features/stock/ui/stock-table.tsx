"use client";

import { useState } from "react";
import { Input } from "@/shared/ui/input";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Progress } from "@/shared/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";
import { Checkbox } from "@/shared/ui/checkbox";
import { Label } from "@/shared/ui/label";
import { Separator } from "@/shared/ui/separator";
import {
  Search,
  Filter,
  AlertTriangle,
  XCircle,
  PackageX,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { CreateProductDialog } from "./create-product-dialog";
import { EditProductDialog } from "./edit-product-dialog";

interface Product {
  id: string;
  name: string;
  category: string;
  current_stock: number;
  min_stock_alert: number;
  unit: string;
  location?: string;
}

interface Props {
  initialData: Product[];
  categories: string[];
}

type SortField = "name" | "category" | "location" | "stock" | "status";
type SortDirection = "asc" | "desc";

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

export function StockTable({ initialData, categories }: Props) {
  const [search, setSearch] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showCriticalOnly, setShowCriticalOnly] = useState(false);

  // Sorting State
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  // 1. Filter Logic
  const filtered = initialData.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.category.toLowerCase().includes(search.toLowerCase());

    const matchesCategory =
      selectedCategories.length === 0 ||
      selectedCategories.includes(item.category);

    const isCritical = item.current_stock <= item.min_stock_alert / 2;
    const matchesCritical = !showCriticalOnly || isCritical;

    return matchesSearch && matchesCategory && matchesCritical;
  });

  // 2. Sort Logic
  const sorted = [...filtered].sort((a, b) => {
    const multiplier = sortDirection === "asc" ? 1 : -1;

    switch (sortField) {
      case "name":
        return a.name.localeCompare(b.name) * multiplier;
      case "category":
        return a.category.localeCompare(b.category) * multiplier;
      case "location":
        return (a.location || "").localeCompare(b.location || "") * multiplier;
      case "stock":
        return (a.current_stock - b.current_stock) * multiplier;
      case "status":
        // Sort by "criticality" (ratio of current vs min stock)
        const ratioA = a.current_stock / (a.min_stock_alert || 1);
        const ratioB = b.current_stock / (b.min_stock_alert || 1);
        return (ratioA - ratioB) * multiplier;
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

  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category],
    );
  };

  const clearFilters = () => {
    setSelectedCategories([]);
    setShowCriticalOnly(false);
    setSearch("");
  };

  const activeFiltersCount =
    selectedCategories.length + (showCriticalOnly ? 1 : 0);

  return (
    <div className="space-y-4">
      {/* TOOLBAR */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-card p-4 rounded-lg border border-border shadow-sm">
        {/* BUSCADOR */}
        <div className="relative w-full md:w-96">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar insumo..."
            className="pl-9 bg-background border-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* ACCIONES */}
        <div className="flex gap-2 w-full md:w-auto">
          {/* POPOVER DE FILTROS */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="gap-2 border-dashed relative border-border text-foreground hover:bg-accent"
              >
                <Filter className="h-4 w-4 text-muted-foreground" />
                Filtros
                {activeFiltersCount > 0 && (
                  <Badge
                    variant="secondary"
                    className="ml-1 h-5 w-5 p-0 flex items-center justify-center rounded-full bg-primary/10 text-primary"
                  >
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-64 p-4 bg-popover border-border"
              align="end"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium leading-none text-sm text-foreground">
                    Filtrar por
                  </h4>
                  {activeFiltersCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                      className="h-auto p-0 text-xs text-destructive hover:text-destructive/80"
                    >
                      Borrar todo
                    </Button>
                  )}
                </div>

                <Separator className="bg-border" />

                {/* SECCIÓN: ESTADO */}
                <div className="space-y-2">
                  <h5 className="text-xs font-bold text-muted-foreground uppercase">
                    Estado
                  </h5>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="critical"
                      checked={showCriticalOnly}
                      onCheckedChange={(checked) =>
                        setShowCriticalOnly(checked as boolean)
                      }
                    />
                    <Label
                      htmlFor="critical"
                      className="text-sm font-normal cursor-pointer flex items-center gap-1 text-foreground"
                    >
                      <AlertTriangle className="h-3 w-3 text-destructive" />{" "}
                      Solo Stock Crítico
                    </Label>
                  </div>
                </div>

                <Separator className="bg-border" />

                {/* SECCIÓN: CATEGORÍAS */}
                <div className="space-y-2">
                  <h5 className="text-xs font-bold text-muted-foreground uppercase">
                    Categorías
                  </h5>
                  <div className="grid gap-2 max-h-[200px] overflow-y-auto pr-2">
                    {categories.map((category) => (
                      <div
                        key={category}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          id={`cat-${category}`}
                          checked={selectedCategories.includes(category)}
                          onCheckedChange={() => toggleCategory(category)}
                        />
                        <Label
                          htmlFor={`cat-${category}`}
                          className="text-sm font-normal cursor-pointer text-foreground"
                        >
                          {category}
                        </Label>
                      </div>
                    ))}

                    {categories.length === 0 && (
                      <p className="text-xs text-muted-foreground italic">
                        No hay categorías registradas.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <CreateProductDialog />
        </div>
      </div>

      {/* BARRA DE FILTROS ACTIVOS */}
      {activeFiltersCount > 0 && (
        <div className="flex gap-2 items-center flex-wrap">
          <span className="text-xs text-muted-foreground">Activos:</span>
          {showCriticalOnly && (
            <Badge
              variant="secondary"
              className="gap-1 bg-destructive/10 text-destructive hover:bg-destructive/20 cursor-pointer border-transparent"
              onClick={() => setShowCriticalOnly(false)}
            >
              Críticos <XCircle className="h-3 w-3" />
            </Badge>
          )}
          {selectedCategories.map((cat) => (
            <Badge
              key={cat}
              variant="secondary"
              className="gap-1 bg-muted text-muted-foreground hover:bg-muted/80 cursor-pointer border-transparent"
              onClick={() => toggleCategory(cat)}
            >
              {cat} <XCircle className="h-3 w-3" />
            </Badge>
          ))}
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-5 text-xs text-muted-foreground hover:text-foreground"
          >
            Limpiar
          </Button>
        </div>
      )}

      {/* TABLA */}
      <div className="rounded-md border border-border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow className="border-border hover:bg-transparent">
              <TableHead
                className="cursor-pointer hover:text-foreground transition-colors"
                onClick={() => handleSort("name")}
              >
                <div className="flex items-center">
                  Producto{" "}
                  <SortIcon
                    field="name"
                    currentSortField={sortField}
                    sortDirection={sortDirection}
                  />
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:text-foreground transition-colors"
                onClick={() => handleSort("category")}
              >
                <div className="flex items-center">
                  Categoría{" "}
                  <SortIcon
                    field="category"
                    currentSortField={sortField}
                    sortDirection={sortDirection}
                  />
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:text-foreground transition-colors"
                onClick={() => handleSort("location")}
              >
                <div className="flex items-center">
                  Ubicación{" "}
                  <SortIcon
                    field="location"
                    currentSortField={sortField}
                    sortDirection={sortDirection}
                  />
                </div>
              </TableHead>
              <TableHead className="w-[200px] text-muted-foreground">
                <div className="flex items-center">
                  Nivel de Stock
                  <SortIcon
                    field="stock"
                    currentSortField={sortField}
                    sortDirection={sortDirection}
                  />
                </div>
              </TableHead>
              <TableHead
                className="text-right cursor-pointer hover:text-foreground transition-colors"
                onClick={() => handleSort("stock")}
              >
                <div className="flex items-center justify-end">
                  Disponible{" "}
                  <SortIcon
                    field="stock"
                    currentSortField={sortField}
                    sortDirection={sortDirection}
                  />
                </div>
              </TableHead>
              <TableHead
                className="text-center cursor-pointer hover:text-foreground transition-colors"
                onClick={() => handleSort("status")}
              >
                <div className="flex items-center justify-center">
                  Estado{" "}
                  <SortIcon
                    field="status"
                    currentSortField={sortField}
                    sortDirection={sortDirection}
                  />
                </div>
              </TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.length > 0 ? (
              sorted.map((item) => {
                const stock = item.current_stock || 0;
                const min = item.min_stock_alert || 0;

                const max = Math.max(stock, min * 3);
                const percentage = Math.min((stock / max) * 100, 100);
                const isLow = stock <= min;
                const isCritical = stock <= min / 2;

                return (
                  <TableRow
                    key={item.id}
                    className="border-border hover:bg-muted/50"
                  >
                    <TableCell className="font-medium text-foreground">
                      {item.name}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className="font-normal text-muted-foreground bg-muted hover:bg-muted/80"
                      >
                        {item.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {item.location || "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Progress
                          value={percentage}
                          className={`h-2 bg-muted ${
                            isCritical
                              ? "[&>div]:bg-destructive"
                              : isLow
                                ? "[&>div]:bg-orange-500"
                                : "[&>div]:bg-primary"
                          }`}
                        />
                        <span className="text-[10px] text-muted-foreground">
                          Min: {min} {item.unit}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-bold text-foreground">
                      {new Intl.NumberFormat("es-AR").format(stock)}{" "}
                      <span className="text-xs font-normal text-muted-foreground">
                        {item.unit}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      {isCritical ? (
                        <Badge
                          variant="destructive"
                          className="gap-1 bg-destructive/10 text-destructive hover:bg-destructive/20 border-0"
                        >
                          <AlertTriangle className="h-3 w-3" /> Crítico
                        </Badge>
                      ) : isLow ? (
                        <Badge
                          variant="outline"
                          className="text-orange-600 border-orange-200 bg-orange-500/10 gap-1 dark:text-orange-400 dark:border-orange-500/30"
                        >
                          Bajo
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="text-primary border-primary/20 bg-primary/10"
                        >
                          Óptimo
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <EditProductDialog product={item} />
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={7}
                  className="h-32 text-center text-muted-foreground"
                >
                  <div className="flex flex-col items-center justify-center gap-2">
                    <PackageX className="h-8 w-8 text-muted-foreground/50" />
                    <p>No se encontraron productos.</p>
                    {activeFiltersCount === 0 && search === "" && (
                      <p className="text-xs text-muted-foreground/70">
                        Crea uno nuevo con el botón de arriba.
                      </p>
                    )}
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
