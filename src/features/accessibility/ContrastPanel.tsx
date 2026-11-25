import { Check, Wand2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { pickReadableText } from "@/lib/color";
import { adjustForContrast, evaluateContrast, type ContrastLevel } from "@/lib/contrast";
import { useThemeStore } from "@/store/themeStore";
import type { ColorKey } from "@/types/theme";

interface PairDefinition {
  id: string;
  label: string;
  foreground: string;
  background: string;
  /** Campo del tema que se puede corregir; `null` si es un color derivado. */
  fix: ColorKey | null;
  /** Fondo contra el que se recalcula la corrección. */
  fixAgainst?: string;
}

const LEVEL_LABEL: Record<ContrastLevel, string> = {
  AAA: "AAA",
  AA: "AA",
  "AA-large": "Solo texto grande",
  fail: "Falla",
};

const LEVEL_VARIANT: Record<ContrastLevel, "success" | "primary" | "neutral" | "danger"> = {
  AAA: "success",
  AA: "primary",
  "AA-large": "neutral",
  fail: "danger",
};

export function ContrastPanel() {
  const colors = useThemeStore((state) => state.theme.colors);
  const setColor = useThemeStore((state) => state.setColor);

  const pairs: PairDefinition[] = [
    {
      id: "text-background",
      label: "Texto sobre fondo",
      foreground: colors.text,
      background: colors.background,
      fix: "text",
      fixAgainst: colors.background,
    },
    {
      id: "text-surface",
      label: "Texto sobre superficie",
      foreground: colors.text,
      background: colors.surface,
      fix: "text",
      fixAgainst: colors.surface,
    },
    {
      id: "muted-surface",
      label: "Atenuado sobre superficie",
      foreground: colors.muted,
      background: colors.surface,
      fix: "muted",
      fixAgainst: colors.surface,
    },
    {
      id: "primary-background",
      label: "Primario sobre fondo",
      foreground: colors.primary,
      background: colors.background,
      fix: "primary",
      fixAgainst: colors.background,
    },
    {
      id: "button-label",
      label: "Texto del botón primario",
      foreground: pickReadableText(colors.primary),
      background: colors.primary,
      fix: null,
    },
  ];

  const results = pairs.map((pair) => ({
    pair,
    result: evaluateContrast(pair.foreground, pair.background),
  }));
  const passing = results.filter(({ result }) => result.aa).length;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="text-muted">Umbral AA (4,5:1) para texto normal.</span>
        <Badge
          variant={
            passing === pairs.length
              ? "success"
              : passing >= pairs.length - 1
                ? "neutral"
                : "danger"
          }
        >
          {passing}/{pairs.length} AA
        </Badge>
      </div>

      <ul className="space-y-2">
        {results.map(({ pair, result }) => (
          <li key={pair.id} className="rounded-md border p-2">
            <div className="flex items-center gap-2">
              <span
                aria-hidden="true"
                style={{ backgroundColor: pair.background, color: pair.foreground }}
                className="grid h-8 w-10 shrink-0 place-items-center rounded-sm border text-xs font-semibold"
              >
                Aa
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium">{pair.label}</p>
                <p className="font-mono text-xs text-muted">{result.ratio.toFixed(2)}:1</p>
              </div>
              <Badge variant={LEVEL_VARIANT[result.level]}>{LEVEL_LABEL[result.level]}</Badge>
            </div>

            {pair.fix && !result.aa ? (
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 w-full justify-start"
                aria-label={`Corregir ${pair.label}`}
                onClick={() =>
                  setColor(
                    pair.fix as ColorKey,
                    adjustForContrast(pair.foreground, pair.fixAgainst ?? pair.background, 4.5),
                  )
                }
              >
                <Wand2 aria-hidden="true" className="h-4 w-4" />
                Corregir a AA
              </Button>
            ) : null}

            {pair.fix === null ? (
              <p className="mt-1 flex items-center gap-1 text-xs text-muted">
                <Check aria-hidden="true" className="h-3 w-3" />
                Derivado del primario; se recalcula solo.
              </p>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
