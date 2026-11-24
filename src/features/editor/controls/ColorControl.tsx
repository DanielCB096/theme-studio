import { useEffect, useState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { normalizeHex } from "@/lib/color";
import { useThemeStore } from "@/store/themeStore";
import { COLOR_LABELS, type ColorKey } from "@/types/theme";

interface ColorControlProps {
  colorKey: ColorKey;
}

/**
 * Selector de color con dos entradas sincronizadas: la paleta nativa del
 * sistema y un campo hexadecimal. El campo solo escribe en el store cuando el
 * valor es un hex completo, así el tema nunca queda en un estado inválido.
 */
export function ColorControl({ colorKey }: ColorControlProps) {
  const value = useThemeStore((state) => state.theme.colors[colorKey]);
  const setColor = useThemeStore((state) => state.setColor);

  const [draft, setDraft] = useState(value);
  const [invalid, setInvalid] = useState(false);

  useEffect(() => {
    setDraft(value);
    setInvalid(false);
  }, [value]);

  const label = COLOR_LABELS[colorKey];
  const inputId = `color-${colorKey}`;
  const errorId = `${inputId}-error`;

  const handleTextChange = (raw: string) => {
    setDraft(raw);
    const normalized = normalizeHex(raw);
    if (normalized) {
      setInvalid(false);
      setColor(colorKey, normalized);
    } else {
      setInvalid(raw.trim().length > 0);
    }
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <Label htmlFor={inputId}>{label}</Label>
        <span aria-hidden="true" className="font-mono text-xs text-muted">
          {value}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="color"
          aria-label={`Elegir ${label.toLowerCase()}`}
          value={value}
          onChange={(event) => setColor(colorKey, event.target.value)}
          className="h-9 w-11 shrink-0 cursor-pointer rounded-md border bg-surface p-1"
        />
        <Input
          id={inputId}
          value={draft}
          onChange={(event) => handleTextChange(event.target.value)}
          onBlur={() => {
            if (!normalizeHex(draft)) {
              setDraft(value);
              setInvalid(false);
            }
          }}
          spellCheck={false}
          autoComplete="off"
          inputMode="text"
          aria-invalid={invalid || undefined}
          aria-describedby={invalid ? errorId : undefined}
          className="font-mono text-xs"
        />
      </div>
      {invalid ? (
        <p id={errorId} className="text-xs text-danger">
          Usa un hex de 6 dígitos, por ejemplo #2563eb.
        </p>
      ) : null}
    </div>
  );
}
