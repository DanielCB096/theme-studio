import {
  DARK_TEXT,
  LIGHT_TEXT,
  hexToRgb,
  hslToHex,
  relativeLuminance,
  rgbToHsl,
} from "@/lib/color";

export type ContrastLevel = "AAA" | "AA" | "AA-large" | "fail";

/** Umbrales WCAG 2.1: texto normal y texto grande (≥ 24 px o 18.66 px en negrita). */
export const CONTRAST_THRESHOLDS = {
  aa: 4.5,
  aaa: 7,
  aaLarge: 3,
  aaaLarge: 4.5,
} as const;

export interface ContrastResult {
  foreground: string;
  background: string;
  /** Razón redondeada a dos decimales. */
  ratio: number;
  level: ContrastLevel;
  aa: boolean;
  aaa: boolean;
  aaLarge: boolean;
  aaaLarge: boolean;
}

/** Razón de contraste según WCAG: (L1 + 0.05) / (L2 + 0.05). */
export function contrastRatio(foreground: string, background: string): number {
  const first = relativeLuminance(foreground);
  const second = relativeLuminance(background);
  const lighter = Math.max(first, second);
  const darker = Math.min(first, second);
  return (lighter + 0.05) / (darker + 0.05);
}

export function evaluateContrast(foreground: string, background: string): ContrastResult {
  const ratio = contrastRatio(foreground, background);
  const aa = ratio >= CONTRAST_THRESHOLDS.aa;
  const aaa = ratio >= CONTRAST_THRESHOLDS.aaa;
  const aaLarge = ratio >= CONTRAST_THRESHOLDS.aaLarge;
  const aaaLarge = ratio >= CONTRAST_THRESHOLDS.aaaLarge;

  const level: ContrastLevel = aaa
    ? "AAA"
    : aa
      ? "AA"
      : ratio >= CONTRAST_THRESHOLDS.aaLarge
        ? "AA-large"
        : "fail";

  return {
    foreground,
    background,
    ratio: Math.round(ratio * 100) / 100,
    level,
    aa,
    aaa,
    aaLarge,
    aaaLarge,
  };
}

/**
 * Ajusta la luminosidad del primer color hasta alcanzar `target` contra el
 * fondo, conservando tono y saturación. Si el objetivo es imposible (fondos
 * grises medios), devuelve el extremo con mayor contraste.
 */
export function adjustForContrast(foreground: string, background: string, target = 4.5): string {
  if (contrastRatio(foreground, background) >= target) return foreground;

  const whiteRatio = contrastRatio(LIGHT_TEXT, background);
  const darkRatio = contrastRatio(DARK_TEXT, background);
  const extreme = whiteRatio >= darkRatio ? LIGHT_TEXT : DARK_TEXT;
  if (Math.max(whiteRatio, darkRatio) < target) return extreme;

  const start = rgbToHsl(hexToRgb(foreground));
  const end = rgbToHsl(hexToRgb(extreme));

  let low = 0;
  let high = 1;
  let best = extreme;

  for (let step = 0; step < 28; step += 1) {
    const t = (low + high) / 2;
    const candidate = hslToHex({
      h: start.h,
      s: start.s + (end.s - start.s) * t,
      l: start.l + (end.l - start.l) * t,
    });
    if (contrastRatio(candidate, background) >= target) {
      best = candidate;
      high = t;
    } else {
      low = t;
    }
  }

  return contrastRatio(best, background) >= target ? best : extreme;
}
