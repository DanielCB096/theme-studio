import { describe, expect, it } from "vitest";

import { hexToRgb, relativeLuminance, rgbToHsl } from "@/lib/color";
import { contrastRatio } from "@/lib/contrast";
import { DEFAULT_THEME } from "@/lib/defaultThemes";
import { deriveVariant, ensureAccessibleColors, isPaletteAccessible } from "@/lib/palette";
import type { ThemeColors } from "@/types/theme";

const badPalette: ThemeColors = {
  primary: "#eeeeee",
  secondary: "#dddddd",
  background: "#ffffff",
  surface: "#ffffff",
  text: "#eeeeee",
  muted: "#dddddd",
  border: "#eeeeee",
  success: "#eeeeee",
  danger: "#eeeeee",
};

describe("ensureAccessibleColors", () => {
  it("corrige texto, atenuado y primario sin tocar los que ya cumplen", () => {
    const { colors, adjusted } = ensureAccessibleColors(badPalette);

    expect(adjusted).toContain("text");
    expect(adjusted).toContain("muted");
    expect(adjusted).toContain("primary");
    expect(adjusted).not.toContain("background");

    expect(contrastRatio(colors.text, colors.background)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(colors.text, colors.surface)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(colors.muted, colors.surface)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(colors.primary, colors.background)).toBeGreaterThanOrEqual(4.5);
    expect(isPaletteAccessible(colors)).toBe(true);
  });

  it("deja intacta una paleta accesible", () => {
    const accessible: ThemeColors = {
      ...badPalette,
      primary: "#1d4ed8",
      text: "#0f172a",
      muted: "#475569",
    };
    const result = ensureAccessibleColors(accessible);
    expect(result.adjusted).toEqual([]);
    expect(result.colors).toEqual(accessible);
  });
});

describe("deriveVariant", () => {
  it("convierte un tema claro en uno oscuro", () => {
    const dark = deriveVariant(DEFAULT_THEME);
    expect(dark.mode).toBe("dark");
    expect(relativeLuminance(dark.colors.background)).toBeLessThan(0.1);
    expect(relativeLuminance(dark.colors.text)).toBeGreaterThan(0.5);
  });

  it("convierte un tema oscuro en uno claro", () => {
    const light = deriveVariant({ ...DEFAULT_THEME, mode: "dark" });
    expect(light.mode).toBe("light");
    expect(relativeLuminance(light.colors.background)).toBeGreaterThan(0.8);
    expect(relativeLuminance(light.colors.text)).toBeLessThan(0.2);
  });

  it("conserva el tono de los colores de marca", () => {
    const dark = deriveVariant(DEFAULT_THEME);
    const before = rgbToHsl(hexToRgb(DEFAULT_THEME.colors.primary)).h;
    const after = rgbToHsl(hexToRgb(dark.colors.primary)).h;
    expect(Math.abs(before - after)).toBeLessThan(3);
  });

  it("garantiza contraste en texto y primario", () => {
    const dark = deriveVariant(DEFAULT_THEME);
    expect(contrastRatio(dark.colors.text, dark.colors.surface)).toBeGreaterThanOrEqual(7);
    expect(contrastRatio(dark.colors.primary, dark.colors.background)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(dark.colors.muted, dark.colors.surface)).toBeGreaterThanOrEqual(4.5);
  });

  it("mantiene tipografía, forma, espaciado y componentes", () => {
    const dark = deriveVariant(DEFAULT_THEME);
    expect(dark.typography).toEqual(DEFAULT_THEME.typography);
    expect(dark.shape).toEqual(DEFAULT_THEME.shape);
    expect(dark.spacing).toEqual(DEFAULT_THEME.spacing);
    expect(dark.components).toEqual(DEFAULT_THEME.components);
    expect(dark.id).toBe(DEFAULT_THEME.id);
    expect(dark.name).toBe(DEFAULT_THEME.name);
  });

  it("puede aplicarse dos veces sin perder accesibilidad", () => {
    const dark = deriveVariant(DEFAULT_THEME);
    const back = deriveVariant(dark);
    expect(back.mode).toBe("light");
    expect(contrastRatio(back.colors.text, back.colors.surface)).toBeGreaterThanOrEqual(7);
    expect(contrastRatio(back.colors.primary, back.colors.background)).toBeGreaterThanOrEqual(4.5);
  });
});
