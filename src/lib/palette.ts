import { hexToRgb, hslToHex, rgbToHsl } from "@/lib/color";
import { adjustForContrast, contrastRatio } from "@/lib/contrast";
import type { Theme, ThemeColors } from "@/types/theme";

export interface PaletteCorrection {
  colors: ThemeColors;
  adjusted: Array<keyof ThemeColors>;
}

/**
 * Corrige una paleta generada para que los pares que pide la especificación
 * cumplan AA: texto sobre fondo/superficie, atenuado sobre superficie y
 * primario sobre fondo. Nunca toca los colores que ya cumplen.
 */
export function ensureAccessibleColors(colors: ThemeColors): PaletteCorrection {
  const adjusted = new Set<keyof ThemeColors>();
  const next: ThemeColors = { ...colors };

  next.text = adjustForContrast(colors.text, colors.background, 4.5);
  if (next.text !== colors.text) adjusted.add("text");

  const textOnSurface = adjustForContrast(next.text, colors.surface, 4.5);
  if (textOnSurface !== next.text) {
    next.text = textOnSurface;
    adjusted.add("text");
  }

  next.muted = adjustForContrast(colors.muted, colors.surface, 4.5);
  if (next.muted !== colors.muted) adjusted.add("muted");

  next.primary = adjustForContrast(colors.primary, colors.background, 4.5);
  if (next.primary !== colors.primary) adjusted.add("primary");

  return { colors: next, adjusted: [...adjusted] };
}

/**
 * Deriva la variante de modo opuesta conservando el tono de las marcas.
 * Los neutros se reconstruyen con el tono del fondo actual y la luminosidad
 * del modo destino; después se corrigen los contrastes.
 */
export function deriveVariant(theme: Theme): Theme {
  const mode = theme.mode === "light" ? "dark" : "light";
  const dark = mode === "dark";
  const baseHue = rgbToHsl(hexToRgb(theme.colors.background)).h;

  const background = hslToHex({ h: baseHue, s: dark ? 16 : 24, l: dark ? 8 : 97 });
  const surface = hslToHex({ h: baseHue, s: dark ? 18 : 10, l: dark ? 13 : 100 });
  const border = hslToHex({ h: baseHue, s: 16, l: dark ? 24 : 90 });

  const textBase = hslToHex({ h: baseHue, s: 12, l: dark ? 94 : 10 });
  const mutedBase = hslToHex({ h: baseHue, s: 10, l: dark ? 66 : 45 });

  const text = adjustForContrast(textBase, surface, 7);
  const muted = adjustForContrast(mutedBase, surface, 4.5);

  const primary = adjustForContrast(theme.colors.primary, background, 4.5);
  const secondary = adjustForContrast(theme.colors.secondary, background, 4.5);
  const success = adjustForContrast(theme.colors.success, background, 3);
  const danger = adjustForContrast(theme.colors.danger, background, 3);

  return {
    ...theme,
    mode,
    colors: {
      primary,
      secondary,
      background,
      surface,
      text,
      muted,
      border,
      success,
      danger,
    },
  };
}

/** Indica si un tema ya cumple los cuatro pares evaluados por el panel. */
export function isPaletteAccessible(colors: ThemeColors): boolean {
  return (
    contrastRatio(colors.text, colors.background) >= 4.5 &&
    contrastRatio(colors.text, colors.surface) >= 4.5 &&
    contrastRatio(colors.primary, colors.background) >= 4.5
  );
}
