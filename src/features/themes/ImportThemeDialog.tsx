import { Upload } from "lucide-react";
import { useState, type ChangeEvent, type FormEvent } from "react";

import { Alert, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { parseThemeJson } from "@/lib/themeImport";
import { useThemeStore } from "@/store/themeStore";

const MAX_FILE_BYTES = 512_000;

export function ImportThemeDialog() {
  const loadTheme = useThemeStore((state) => state.loadTheme);
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [errors, setErrors] = useState<string[]>([]);

  const reset = () => {
    setText("");
    setErrors([]);
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) reset();
  };

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_BYTES) {
      setErrors(["El archivo supera 500 kB. Un tema válido ocupa unos pocos KB."]);
      return;
    }
    setErrors([]);
    setText(await file.text());
    event.target.value = "";
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = parseThemeJson(text);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    loadTheme(result.theme);
    handleOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Upload aria-hidden="true" className="h-4 w-4" />
          Importar
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Importar tema</DialogTitle>
          <DialogDescription>
            Pega el JSON de un tema exportado o elige un archivo. Se valida antes de aplicarlo; si
            algo no cuadra, no se toca el tema actual.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-density" onSubmit={handleSubmit} aria-label="Importar tema">
          <div className="space-y-1.5">
            <Label htmlFor="import-file">Archivo JSON</Label>
            <Input
              id="import-file"
              type="file"
              accept=".json,application/json"
              onChange={(event) => void handleFile(event)}
              className="h-auto cursor-pointer py-2 text-xs file:mr-2 file:rounded-sm file:border-0 file:bg-background file:px-2 file:py-1 file:text-xs file:text-fg"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="import-json">Contenido JSON</Label>
            <Textarea
              id="import-json"
              value={text}
              onChange={(event) => setText(event.target.value)}
              rows={8}
              spellCheck={false}
              placeholder={'{\n  "name": "Mi tema",\n  ...\n}'}
              className="font-mono text-xs"
            />
          </div>

          {errors.length > 0 ? (
            <Alert variant="danger">
              <div className="space-y-1">
                <AlertTitle>No se pudo importar</AlertTitle>
                <ul className="list-inside list-disc space-y-0.5 text-sm text-muted">
                  {errors.map((error) => (
                    <li key={error}>{error}</li>
                  ))}
                </ul>
              </div>
            </Alert>
          ) : null}

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button type="submit" disabled={text.trim().length === 0}>
              Importar tema
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
