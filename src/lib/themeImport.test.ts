import { describe, expect, it } from "vitest";

import { DEFAULT_THEME } from "@/lib/defaultThemes";
import { exportThemeJson } from "@/lib/themeExport";
import { parseThemeJson } from "@/lib/themeImport";

describe("parseThemeJson", () => {
  it("acepta un tema exportado por la propia aplicación", () => {
    const result = parseThemeJson(exportThemeJson(DEFAULT_THEME));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.theme).toEqual(DEFAULT_THEME);
    }
  });

  it("rechaza contenido vacío", () => {
    const result = parseThemeJson("   ");
    expect(result).toEqual({ ok: false, errors: [expect.stringContaining("vacío")] });
  });

  it("rechaza JSON mal formado sin lanzar", () => {
    const result = parseThemeJson('{ "name": "x" ');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors[0]).toMatch(/no es JSON válido/i);
    }
  });

  it("señala el color concreto cuando el hex es inválido", () => {
    const broken = { ...DEFAULT_THEME, colors: { ...DEFAULT_THEME.colors, primary: "#12345" } };
    const result = parseThemeJson(JSON.stringify(broken));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors[0]).toMatch(/Color primario/);
      expect(result.errors[0]).toMatch(/hexadecimal/i);
    }
  });

  it("señala valores fuera de rango con nombre legible", () => {
    const broken = {
      ...DEFAULT_THEME,
      typography: { ...DEFAULT_THEME.typography, baseSize: 42 },
    };
    const result = parseThemeJson(JSON.stringify(broken));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors[0]).toMatch(/Tamaño base/);
      expect(result.errors[0]).toMatch(/máximo/i);
    }
  });

  it("rechaza propiedades desconocidas", () => {
    const result = parseThemeJson(JSON.stringify({ ...DEFAULT_THEME, extra: true }));
    expect(result.ok).toBe(false);
  });

  it("rechaza una fuente fuera de la lista blanca", () => {
    const broken = {
      ...DEFAULT_THEME,
      typography: { ...DEFAULT_THEME.typography, fontFamily: "comic-sans" },
    };
    const result = parseThemeJson(JSON.stringify(broken));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors[0]).toMatch(/Fuente/);
    }
  });
});
