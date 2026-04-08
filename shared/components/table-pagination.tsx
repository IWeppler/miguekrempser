import { ChevronLeft, ChevronRight } from "lucide-react";

interface TablePaginationProps {
  readonly currentPage: number;
  readonly totalPages: number;
  readonly startIndex: number;
  readonly endIndex: number;
  readonly totalItems: number;
  readonly onPrevPage: () => void;
  readonly onNextPage: () => void;
  readonly itemName?: string;
}

export function TablePagination({
  currentPage,
  totalPages,
  startIndex,
  endIndex,
  totalItems,
  onPrevPage,
  onNextPage,
  itemName = "elementos",
}: TablePaginationProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/10 mt-auto">
      <span className="text-xs text-muted-foreground font-medium">
        Mostrando {totalItems === 0 ? 0 : startIndex + 1} - {endIndex} de{" "}
        {totalItems} {itemName}
      </span>
      <div className="flex items-center gap-2">
        <button
          onClick={onPrevPage}
          disabled={currentPage <= 1 || totalPages === 0}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-border rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:pointer-events-none transition-colors"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Anterior
        </button>
        <span className="text-xs font-medium text-slate-600 px-2">
          Página {totalPages === 0 ? 0 : currentPage} de {totalPages}
        </span>
        <button
          onClick={onNextPage}
          disabled={currentPage >= totalPages || totalPages === 0}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-border rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:pointer-events-none transition-colors"
        >
          Siguiente
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
