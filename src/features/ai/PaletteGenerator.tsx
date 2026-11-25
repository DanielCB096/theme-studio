import { Sparkles } from "lucide-react";
import { useState, type FormEvent } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { generatePalette } from "@/lib/aiPalette";
import { ensureAccessibleColors, type PaletteCorrection } from "@/lib/palette";
import { COLOR_LABELS, COLOR_KEYS } from "@/types/theme";
import { useThemeStore } from "@/store/themeStore";

export function PaletteGenerator() {
  const applyColors = useThemeStore((state) => state.applyColors);

  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<
    (PaletteCorrection & { source: "gemini" | "local" }) | null
  >(null);
  const [applied, setApplied] = useState(false);

  const handleGenerate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = prompt.trim();
    if (trimmed.length < 3) {
      setError("Describe la paleta con al menos 3 caracteres.");
      return;
    }

    setLoading(true);
    setError(null);
    setPreview(null);
    setApplied(false);

    try {
      const result = await generatePalette(trimmed);
      const correction = ensureAccessibleColors(result.colors);
      setPreview({ ...correction, source: result.source });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo generar la paleta.");
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (!preview) return;
    applyColors(preview.colors);
    setApplied(true);
  };

  return (
    <div className="space-y-density">
      <p className="text-xs text-muted">
        La IA propone los colores; el código valida la forma con Zod y corrige el contraste AA antes
        de aplicarlos. Puedes deshacer con Ctrl/Cmd+Z.
      </p>

      <form className="space-y-2" onSubmit={(event) => void handleGenerate(event)}>
        <div className="space-y-1.5">
          <Label htmlFor="ai-prompt">Describe la paleta</Label>
          <Input
            id="ai-prompt"
            value={prompt}
            maxLength={200}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder="Ej.: atardecer mediterráneo, sereno y cálido"
          />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          <Sparkles aria-hidden="true" className="h-4 w-4" />
          {loading ? "Generando…" : "Generar paleta"}
        </Button>
      </form>

      {error ? (
        <Alert variant="danger">
          <div className="space-y-1">
            <AlertTitle>No se generó la paleta</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </div>
        </Alert>
      ) : null}

      {preview?.source === "local" ? (
        <Alert>
          <div className="space-y-1">
            <AlertTitle>Modo local (sin IA)</AlertTitle>
            <AlertDescription>
              El proveedor de IA no respondió ahora mismo, así que la paleta se generó con reglas
              locales deterministas a partir de tu descripción. No se ha usado ningún modelo.
            </AlertDescription>
          </div>
        </Alert>
      ) : null}

      {preview ? (
        <div className="space-y-2">
          <div className="grid grid-cols-3 gap-1">
            {COLOR_KEYS.map((key) => (
              <div key={key} className="space-y-1">
                <span
                  aria-hidden="true"
                  style={{ backgroundColor: preview.colors[key] }}
                  className="block h-10 w-full rounded-sm border"
                />
                <span className="block truncate text-[10px] text-muted">{COLOR_LABELS[key]}</span>
                <span className="block font-mono text-[10px] text-muted">
                  {preview.colors[key]}
                </span>
              </div>
            ))}
          </div>

          {preview.adjusted.length > 0 ? (
            <p className="text-xs text-muted">
              Corregido para AA:{" "}
              {preview.adjusted.map((key) => COLOR_LABELS[key].toLowerCase()).join(", ")}.
            </p>
          ) : null}

          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" onClick={handleApply} disabled={applied}>
              {applied ? "Aplicada" : "Aplicar paleta"}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setPreview(null);
                setApplied(false);
              }}
            >
              Descartar
            </Button>
          </div>
          {applied ? (
            <p role="status" className="text-xs text-success">
              Paleta aplicada. Puedes deshacer el cambio.
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
