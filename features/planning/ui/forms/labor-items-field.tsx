"use client";

import { useFieldArray, useFormContext } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { FormControl, FormField, FormItem, FormLabel } from "@/shared/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";

interface Product {
  id: string;
  name: string;
  average_cost: number;
}

interface Props {
  products: Product[];
  name?: string; // Por si queremos reusarlo con otro nombre de campo
}

export function LaborItemsField({ products, name = "items" }: Props) {
  const { control, setValue } = useFormContext(); // Usamos el contexto del formulario padre

  const { fields, append, remove } = useFieldArray({
    control,
    name,
  });

  return (
    <div className="p-3 bg-green-50/50 dark:bg-green-900/10 rounded-lg border border-green-200/50 dark:border-green-800/30">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold flex items-center gap-2">
          🧪 Insumos / Receta
        </h4>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => append({ productId: "", dose: 0, price: 0 })}
          className="h-7 text-xs"
        >
          <Plus className="h-3 w-3 mr-1" /> Agregar Producto
        </Button>
      </div>

      {fields.map((field, index) => (
        <div key={field.id} className="grid grid-cols-12 gap-2 items-end mb-3">
          {/* PRODUCTO */}
          <div className="col-span-5">
            <FormField
              control={control}
              name={`${name}.${index}.productId`}
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel className="text-[10px] uppercase text-muted-foreground">
                    Producto
                  </FormLabel>
                  <Select
                    onValueChange={(val) => {
                      field.onChange(val);
                      const prod = products.find((p) => p.id === val);
                      if (prod) {
                        setValue(
                          `${name}.${index}.price`,
                          prod.average_cost || 0,
                        );
                      }
                    }}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Seleccionar..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {products.map((p) => (
                        <SelectItem key={p.id} value={p.id} className="text-xs">
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
          </div>

          {/* DOSIS */}
          <div className="col-span-3">
            <FormField
              control={control}
              name={`${name}.${index}.dose`}
              render={({ field: { value, onChange, ...fieldProps } }) => (
                <FormItem className="space-y-1">
                  <FormLabel className="text-[10px] uppercase text-muted-foreground">
                    Dosis (Lt/Kg)
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...fieldProps}
                      type="number"
                      step="0.001"
                      className="h-8 text-xs"
                      value={(value as number) ?? ""}
                      onChange={(e) =>
                        onChange(parseFloat(e.target.value) || 0)
                      }
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          {/* PRECIO */}
          <div className="col-span-3">
            <FormField
              control={control}
              name={`${name}.${index}.price`}
              render={({ field: { value, onChange, ...fieldProps } }) => (
                <FormItem className="space-y-1">
                  <FormLabel className="text-[10px] uppercase text-muted-foreground">
                    Costo (USD)
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...fieldProps}
                      type="number"
                      step="0.01"
                      className="h-8 text-xs"
                      value={(value as number) ?? ""}
                      onChange={(e) =>
                        onChange(parseFloat(e.target.value) || 0)
                      }
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          {/* BORRAR */}
          <div className="col-span-1 flex justify-center">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-100"
              onClick={() => remove(index)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}

      {fields.length === 0 && (
        <p className="text-xs text-muted-foreground italic text-center py-2">
          Sin insumos (Solo labor mecánica)
        </p>
      )}
    </div>
  );
}
