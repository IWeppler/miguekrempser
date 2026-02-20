"use client";

import { useRef } from "react";
import { UploadCloud, FileIcon, X } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { FormLabel } from "@/shared/ui/form";

interface Props {
  file: File | null;
  setFile: (file: File | null) => void;
}

export function InvoiceFileUpload({ file, setFile }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
    }
  };

  const removeFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="p-4 bg-muted/30 rounded-lg border border-border border-dashed">
      <div className="flex flex-col gap-3">
        <FormLabel className="text-sm font-medium">
          Comprobante Digital (Foto o PDF)
        </FormLabel>

        {!file ? (
          <div
            className="flex flex-col items-center justify-center h-28 border-2 border-dashed border-muted-foreground/25 rounded-lg bg-background hover:bg-muted/50 transition-all cursor-pointer text-center p-4 group"
            onClick={() => fileInputRef.current?.click()}
          >
            <UploadCloud className="h-8 w-8 text-muted-foreground mb-2 group-hover:text-primary transition-colors" />
            <p className="text-xs text-muted-foreground font-medium">
              Haz clic o arrastra para subir el documento
            </p>
            <p className="text-[10px] text-muted-foreground/60 mt-1">
              Formatos aceptados: JPG, PNG, PDF (Máx. 5MB)
            </p>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*,application/pdf"
              onChange={handleFileChange}
            />
          </div>
        ) : (
          <div className="flex items-center justify-between p-3 bg-background border border-border rounded-md animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="h-10 w-10 bg-primary/10 rounded flex items-center justify-center shrink-0">
                <FileIcon className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate max-w-[200px] sm:max-w-[400px]">
                  {file.name}
                </p>
                <p className="text-[10px] text-muted-foreground uppercase">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="hover:bg-destructive/10 group"
              onClick={removeFile}
            >
              <X className="h-4 w-4 text-muted-foreground group-hover:text-destructive" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
