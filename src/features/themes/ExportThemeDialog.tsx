import { Check, Copy, Download } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { copyText, downloadTextFile } from "@/lib/file";
import {
  EXPORT_FORMATS,
  EXPORT_LABELS,
  EXPORT_MIME,
  exportFileName,
  exportTheme,
  type ExportFormat,
} from "@/lib/themeExport";
import { useThemeStore } from "@/store/themeStore";

type CopyState = "idle" | "copied" | "error";

export function ExportThemeDialog() {
  const theme = useThemeStore((state) => state.theme);
  const [format, setFormat] = useState<ExportFormat>("json");
  const [copyState, setCopyState] = useState<CopyState>("idle");

  const content = exportTheme(theme, format);

  useEffect(() => {
    setCopyState("idle");
  }, [content]);

  const handleCopy = async () => {
    const ok = await copyText(content);
    setCopyState(ok ? "copied" : "error");
  };

  const handleDownload = () => {
    downloadTextFile(exportFileName(theme, format), content, EXPORT_MIME[format]);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Download aria-hidden="true" className="h-4 w-4" />
          Exportar
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Exportar tema</DialogTitle>
          <DialogDescription>
            Copia el código o descárgalo. Los tokens son los mismos que ves en la vista previa.
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={format}
          onValueChange={(value) => {
            const next = EXPORT_FORMATS.find((candidate) => candidate === value);
            if (next) setFormat(next);
          }}
        >
          <TabsList aria-label="Formato de exportación">
            {EXPORT_FORMATS.map((candidate) => (
              <TabsTrigger key={candidate} value={candidate}>
                {EXPORT_LABELS[candidate]}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={format}>
            <pre
              aria-label={`Código ${EXPORT_LABELS[format]}`}
              className="max-h-72 overflow-auto rounded-md border bg-background p-3 text-xs leading-relaxed text-fg"
            >
              <code className="whitespace-pre">{content}</code>
            </pre>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <span aria-live="polite" className="self-center text-xs text-muted">
            {copyState === "copied" ? "Copiado al portapapeles." : null}
            {copyState === "error" ? "No se pudo copiar; selecciona el texto manualmente." : null}
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => void handleCopy()}>
              {copyState === "copied" ? (
                <Check aria-hidden="true" className="h-4 w-4" />
              ) : (
                <Copy aria-hidden="true" className="h-4 w-4" />
              )}
              {copyState === "copied" ? "Copiado" : "Copiar"}
            </Button>
            <Button size="sm" onClick={handleDownload}>
              <Download aria-hidden="true" className="h-4 w-4" />
              Descargar
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
