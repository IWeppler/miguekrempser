"use client";

import { useState } from "react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";
import { Calendar } from "@/shared/ui/calendar";
import {
  AlertCircle,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  CalendarIcon,
} from "lucide-react";
import { toast } from "sonner";

// Importamos las acciones
import { upsertCompany, deleteCompany } from "../actions/company-actions";
import { IssuerCompany } from "@/features/moves/types/index";

interface TableCompaniesProps {
  companies: IssuerCompany[];
}

export function TableCompanies({ companies }: TableCompaniesProps) {
  // --- ESTADOS ---
  const [isCompanyLoading, setIsCompanyLoading] = useState(false);

  // Estado para el modal de Crear/Editar
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] =
    useState<Partial<IssuerCompany> | null>(null);

  // Estados para las fechas (necesario para el DatePicker de Shadcn)
  const [inicioDate, setInicioDate] = useState<Date | undefined>(undefined);
  const [caiDate, setCaiDate] = useState<Date | undefined>(undefined);

  // Estado para el modal de Confirmación de Eliminación
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<string | null>(null);

  // --- MANEJADORES ---
  const handleSaveCompany = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsCompanyLoading(true);

    const formData = new FormData(e.currentTarget);

    // HELPER: Convierte strings vacíos "" a null.
    const parseValue = (val: FormDataEntryValue | null) => {
      const str = val?.toString().trim();
      return str ? str : null;
    };

    const data = {
      id: editingCompany?.id,
      name: formData.get("name") as string,
      initials: parseValue(formData.get("initials")),
      cuit: parseValue(formData.get("cuit")),
      iib: parseValue(formData.get("iib")),
      address: parseValue(formData.get("address")),
      phone: parseValue(formData.get("phone")),
      inicio_act: parseValue(formData.get("inicio_act")),
      // --- CAPTURAMOS LOS NUEVOS CAMPOS ---
      iva_condition: parseValue(formData.get("iva_condition")),
      cai_number: parseValue(formData.get("cai_number")),
      cai_expiration: parseValue(formData.get("cai_expiration")),
    };

    const result = await upsertCompany(data);
    setIsCompanyLoading(false);

    if (result.success) {
      toast.success(
        editingCompany?.id
          ? "Empresa actualizada correctamente."
          : "Empresa creada con éxito.",
      );
      setIsModalOpen(false);
      setEditingCompany(null);
    } else {
      toast.error("Error al guardar: " + result.error);
    }
  };

  const handleDeleteClick = (id: string) => {
    setCompanyToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!companyToDelete) return;

    setIsCompanyLoading(true);
    const result = await deleteCompany(companyToDelete);
    setIsCompanyLoading(false);

    if (result.success) {
      toast.success("La empresa fue eliminada de forma permanente.");
      setIsDeleteDialogOpen(false);
      setCompanyToDelete(null);
    } else {
      toast.error("No se pudo eliminar: " + result.error);
    }
  };

  const openNewCompanyModal = () => {
    setEditingCompany({});
    setInicioDate(undefined);
    setCaiDate(undefined);
    setIsModalOpen(true);
  };

  const openEditCompanyModal = (company: IssuerCompany) => {
    setEditingCompany(company);
    // Inicializamos las fechas para Shadcn Calendar (T12 para evitar desfases de huso horario)
    setInicioDate(
      company.inicio_act
        ? new Date(company.inicio_act + "T12:00:00")
        : undefined,
    );
    setCaiDate(
      company.cai_expiration
        ? new Date(company.cai_expiration + "T12:00:00")
        : undefined,
    );
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Header de la tabla con botón de agregar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-muted/30 p-4 rounded-xl border border-border/50">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <AlertCircle className="h-4 w-4 text-primary shrink-0" />
          <span>
            Los datos legales y de AFIP se inyectan automáticamente en los PDF
            de Remitos e Invoices.
          </span>
        </div>
        <Button
          size="sm"
          className="gap-2 w-full sm:w-auto"
          onClick={openNewCompanyModal}
        >
          <Plus className="h-4 w-4" /> Nueva Empresa
        </Button>
      </div>

      {/* Tabla Modularizada */}
      <div className="rounded-xl border border-border overflow-hidden bg-background">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground font-medium border-b border-border">
              <tr>
                <th className="px-4 py-3 font-bold uppercase text-[10px] tracking-wider">
                  Empresa
                </th>
                <th className="px-4 py-3 font-bold uppercase text-[10px] tracking-wider hidden md:table-cell">
                  Siglas
                </th>
                <th className="px-4 py-3 font-bold uppercase text-[10px] tracking-wider">
                  CUIT / IIB
                </th>
                <th className="px-4 py-3 font-bold uppercase text-[10px] tracking-wider hidden lg:table-cell">
                  Dirección
                </th>
                <th className="px-4 py-3 font-bold uppercase text-[10px] tracking-wider text-right">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {companies.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-muted-foreground italic"
                  >
                    No hay empresas configuradas. Agrega la primera para
                    comenzar.
                  </td>
                </tr>
              ) : (
                companies.map((company) => (
                  <tr
                    key={company.id}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-4 py-3 font-semibold text-foreground">
                      {company.name}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {company.initials && (
                        <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-[10px] font-mono font-bold">
                          {company.initials}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <div className="flex flex-col">
                        <span className="font-mono">
                          {company.cuit || "S/N"}
                        </span>
                        <span className="text-[10px] opacity-60">
                          IIB: {company.iib || "S/N"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs hidden lg:table-cell text-muted-foreground">
                      {company.address || "Sin dirección"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-primary"
                          onClick={() => openEditCompanyModal(company)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDeleteClick(company.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* MODAL 1: Crear / Editar Empresa */}
      {/* ------------------------------------------------------------------ */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <form
            onSubmit={handleSaveCompany}
            key={editingCompany?.id || "new-company"}
          >
            <DialogHeader className="mb-4">
              <DialogTitle>
                {editingCompany?.id ? "Editar Empresa" : "Nueva Empresa"}
              </DialogTitle>
              <DialogDescription>
                Completa los datos legales para que aparezcan correctamente en
                tus documentos de AFIP.
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 py-2">
              {/* Columna Izquierda: Datos Básicos */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Razón Social</Label>
                  <Input
                    id="name"
                    name="name"
                    defaultValue={editingCompany?.name || ""}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="initials">Siglas</Label>
                  <Input
                    id="initials"
                    name="initials"
                    defaultValue={editingCompany?.initials || ""}
                    placeholder="Ej. ACME"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cuit">CUIT</Label>
                  <Input
                    id="cuit"
                    name="cuit"
                    defaultValue={editingCompany?.cuit || ""}
                    placeholder="XX-XXXXXXXX-X"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="iib">Ingresos Brutos</Label>
                  <Input
                    id="iib"
                    name="iib"
                    defaultValue={editingCompany?.iib || ""}
                  />
                </div>

                {/* Shadcn DatePicker para Inicio Actividades */}
                <div className="space-y-2 flex flex-col">
                  <Label>Inicio de Actividades</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !inicioDate && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {inicioDate ? (
                          format(inicioDate, "dd/MM/yyyy")
                        ) : (
                          <span>Seleccionar fecha</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={inicioDate}
                        onSelect={setInicioDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  {/* Input oculto para que FormData lo capture */}
                  <input
                    type="hidden"
                    name="inicio_act"
                    value={inicioDate ? format(inicioDate, "yyyy-MM-dd") : ""}
                  />
                </div>
              </div>

              {/* Columna Derecha: Contacto y AFIP */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="address">Dirección Fiscal</Label>
                  <Input
                    id="address"
                    name="address"
                    defaultValue={editingCompany?.address || ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input
                    id="phone"
                    name="phone"
                    defaultValue={editingCompany?.phone || ""}
                  />
                </div>

                {/* Nuevos Campos AFIP */}
                <div className="pt-4 border-t border-border mt-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                    Datos de Facturación
                  </p>
                  <div className="space-y-4">
                    {/* Shadcn Select para IVA */}
                    <div className="space-y-2">
                      <Label htmlFor="iva_condition">
                        Condición frente al IVA
                      </Label>
                      <Select
                        name="iva_condition"
                        defaultValue={
                          editingCompany?.iva_condition ||
                          "Responsable Inscripto"
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecciona la condición" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Responsable Inscripto">
                            Responsable Inscripto
                          </SelectItem>
                          <SelectItem value="Monotributo">
                            Monotributo
                          </SelectItem>
                          <SelectItem value="Exento">Exento</SelectItem>
                          <SelectItem value="Consumidor Final">
                            Consumidor Final
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="cai_number">Nº de C.A.I.</Label>
                      <Input
                        id="cai_number"
                        name="cai_number"
                        defaultValue={editingCompany?.cai_number || ""}
                        placeholder="Ej. 51465215829726"
                      />
                    </div>

                    {/* Shadcn DatePicker para Vencimiento CAI */}
                    <div className="space-y-2 flex flex-col">
                      <Label>Vencimiento de C.A.I.</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !caiDate && "text-muted-foreground",
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {caiDate ? (
                              format(caiDate, "dd/MM/yyyy")
                            ) : (
                              <span>Seleccionar fecha</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={caiDate}
                            onSelect={setCaiDate}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      {/* Input oculto para que FormData lo capture */}
                      <input
                        type="hidden"
                        name="cai_expiration"
                        value={caiDate ? format(caiDate, "yyyy-MM-dd") : ""}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                disabled={isCompanyLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isCompanyLoading}>
                {isCompanyLoading && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Guardar Empresa
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ------------------------------------------------------------------ */}
      {/* MODAL 2: Confirmación de Eliminación */}
      {/* ------------------------------------------------------------------ */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              ¿Eliminar empresa?
            </DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente
              la razón social.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isCompanyLoading}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmDelete}
              disabled={isCompanyLoading}
            >
              {isCompanyLoading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
