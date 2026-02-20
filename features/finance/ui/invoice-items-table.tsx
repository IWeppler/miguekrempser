"use client";

import {
  Control,
  UseFormRegister,
  UseFormSetValue,
  UseFormGetValues,
  FieldArrayWithId,
} from "react-hook-form";
import { Plus, Trash2, ChevronsUpDown, Check } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { FormField, FormItem, FormControl, FormLabel } from "@/shared/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";
import {
  Command,
  CommandInput,
  CommandItem,
  CommandList,
  CommandGroup,
} from "@/shared/ui/command";
import { cn } from "@/lib/utils";
import { InvoiceSchema } from "../schemas/invoice-schema";

interface Props {
  fields: FieldArrayWithId<InvoiceSchema, "items">[];
  append: (item: InvoiceSchema["items"][number]) => void;
  remove: (index: number) => void;
  control: Control<InvoiceSchema>;
  register: UseFormRegister<InvoiceSchema>;
  setValue: UseFormSetValue<InvoiceSchema>;
  getValues: UseFormGetValues<InvoiceSchema>;
  products: { id: string; name: string }[];
  openProductCombo: number | null;
  setOpenProductCombo: (index: number | null) => void;
  comboSearchValue: string;
  setComboSearchValue: (value: string) => void;
}

export function InvoiceItemsTable({
  fields,
  append,
  remove,
  control,
  register,
  setValue,
  getValues,
  products,
  openProductCombo,
  setOpenProductCombo,
  comboSearchValue,
  setComboSearchValue,
}: Props) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center text-sm font-semibold text-foreground">
        <span>Detalle de Productos</span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            append({
              description: "",
              quantity: 1,
              unitPrice: 0,
              productId: "",
            })
          }
          className="h-8 text-xs"
        >
          <Plus className="h-3 w-3 mr-1" /> Agregar Ítem
        </Button>
      </div>

      <div className="space-y-4 md:space-y-0 md:rounded-md md:border md:border-border md:overflow-hidden">
        {/* Encabezados Desktop */}
        <div className="hidden md:grid md:grid-cols-12 bg-muted text-muted-foreground font-medium text-sm border-b border-border">
          <div className="col-span-4 px-3 py-2">Producto (Stock)</div>
          <div className="col-span-4 px-3 py-2">Descripción Factura</div>
          <div className="col-span-1 px-3 py-2 text-right">Cant.</div>
          <div className="col-span-2 px-3 py-2 text-right">Precio</div>
          <div className="col-span-1 px-3 py-2"></div>
        </div>

        {fields.map((field, index) => (
          <div
            key={field.id}
            className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-0 p-4 md:p-0 bg-card border border-border rounded-lg md:rounded-none md:border-0 md:border-b md:border-border last:border-0 relative hover:bg-muted/50 transition-colors items-start md:items-center"
          >
            {/* Combobox de Producto */}
            <div className="md:col-span-4 md:p-2">
              <FormField
                control={control}
                name={`items.${index}.productId`}
                render={({ field: comboField }) => (
                  <FormItem className="mb-0">
                    <FormLabel className="md:hidden text-xs">
                      Producto
                    </FormLabel>
                    <Popover
                      open={openProductCombo === index}
                      onOpenChange={(isOpen) => {
                        setOpenProductCombo(isOpen ? index : null);
                        if (!isOpen) setComboSearchValue("");
                      }}
                    >
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            className={cn(
                              "w-full justify-between h-9 text-xs",
                              !comboField.value && "text-muted-foreground",
                            )}
                          >
                            {comboField.value
                              ? products.find((p) => p.id === comboField.value)
                                  ?.name || comboField.value
                              : "Seleccionar o crear..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[300px] p-0" align="start">
                        <Command shouldFilter={false}>
                          <CommandInput
                            placeholder="Buscar insumo..."
                            value={comboSearchValue}
                            onValueChange={setComboSearchValue}
                          />
                          <CommandList>
                            <CommandGroup>
                              {products
                                .filter((p) =>
                                  p.name
                                    .toLowerCase()
                                    .includes(comboSearchValue.toLowerCase()),
                                )
                                .map((product) => (
                                  <CommandItem
                                    key={product.id}
                                    onSelect={() => {
                                      setValue(
                                        `items.${index}.productId`,
                                        product.id,
                                      );
                                      if (
                                        !getValues(`items.${index}.description`)
                                      ) {
                                        setValue(
                                          `items.${index}.description`,
                                          product.name,
                                        );
                                      }
                                      setOpenProductCombo(null);
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        product.id === comboField.value
                                          ? "opacity-100"
                                          : "opacity-0",
                                      )}
                                    />
                                    {product.name}
                                  </CommandItem>
                                ))}
                            </CommandGroup>

                            {/* LÓGICA PARA CREAR NUEVO */}
                            {comboSearchValue &&
                              !products.some(
                                (p) =>
                                  p.name.toLowerCase() ===
                                  comboSearchValue.toLowerCase(),
                              ) && (
                                <div className="p-2 border-t border-border bg-muted/50">
                                  <p className="text-[10px] text-muted-foreground mb-2 italic">
                                    El producto &quot;{comboSearchValue}&quot;
                                    no existe.
                                  </p>
                                  <Button
                                    type="button"
                                    size="sm"
                                    className="w-full h-8 text-xs bg-green-600 hover:bg-green-700 text-white"
                                    onClick={() => {
                                      setValue(
                                        `items.${index}.productId`,
                                        comboSearchValue,
                                      );
                                      if (
                                        !getValues(`items.${index}.description`)
                                      ) {
                                        setValue(
                                          `items.${index}.description`,
                                          comboSearchValue,
                                        );
                                      }
                                      setOpenProductCombo(null);
                                      setComboSearchValue("");
                                    }}
                                  >
                                    <Plus className="mr-1 h-3 w-3" />
                                    Crear e incluir &quot;{comboSearchValue}
                                    &quot;
                                  </Button>
                                </div>
                              )}
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </FormItem>
                )}
              />
            </div>

            {/* Descripción */}
            <div className="md:col-span-4 md:p-2">
              <FormLabel className="md:hidden text-xs">Descripción</FormLabel>
              <Input
                {...register(`items.${index}.description`)}
                placeholder="Detalle..."
                className="h-9 text-xs bg-background"
              />
            </div>

            {/* Cantidad y Precio */}
            <div className="grid grid-cols-2 gap-3 md:contents">
              <div className="md:col-span-1 md:p-2">
                <FormLabel className="md:hidden text-xs">Cant.</FormLabel>
                <Input
                  type="number"
                  step="0.01"
                  {...register(`items.${index}.quantity`)}
                  className="h-9 text-xs md:text-right bg-background"
                />
              </div>
              <div className="md:col-span-2 md:p-2">
                <FormLabel className="md:hidden text-xs">Precio</FormLabel>
                <Input
                  type="number"
                  step="0.01"
                  {...register(`items.${index}.unitPrice`)}
                  className="h-9 text-xs md:text-right bg-background"
                />
              </div>
            </div>

            {/* Botón Eliminar */}
            <div className="absolute top-2 right-2 md:static md:col-span-1 md:p-2 md:text-right">
              {fields.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => remove(index)}
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
