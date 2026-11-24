import { describe, expect, it } from "vitest";

import { DEFAULT_THEMES } from "@/lib/defaultThemes";
import { themeSchema, validateTheme } from "@/lib/themeSchema";

const validLight = DEFAULT_THEMES.light;

describe("themeSchema", () => {
  it("acepta los temas por defecto", () => {
    expect(themeSchema.safeParse(validLight).success).toBe(true);
    expect(themeSchema.safeParse(DEFAULT_THEMES.dark).success).toBe(true);
  });

  it("rechaza un color que no es hex de 6 dígitos", () => {
    const invalid = {
      ...validLight,
      colors: { ...validLight.colors, primary: "blue" },
    };
    const result = themeSchema.safeParse(invalid);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(["colors", "primary"]);
    }
  });

  it("rechaza valores fuera de rango", () => {
    expect(
      themeSchema.safeParse({
        ...validLight,
        typography: { ...validLight.typography, baseSize: 11 },
      }).success,
    ).toBe(false);

    expect(
      themeSchema.safeParse({
        ...validLight,
        shape: { ...validLight.shape, radius: 25 },
      }).success,
    ).toBe(false);

    expect(
      themeSchema.safeParse({
        ...validLight,
        spacing: { unit: 9 },
      }).success,
    ).toBe(false);
  });

  it("rechaza una fuente fuera de la lista blanca", () => {
    const result = themeSchema.safeParse({
      ...validLight,
      typography: { ...validLight.typography, fontFamily: "comic-sans" },
    });
    expect(result.success).toBe(false);
  });

  it("rechaza propiedades desconocidas y nombres vacíos", () => {
    expect(themeSchema.safeParse({ ...validLight, extra: true }).success).toBe(false);
    expect(themeSchema.safeParse({ ...validLight, name: "   " }).success).toBe(false);
  });

  it("normaliza el nombre quitando espacios sobrantes", () => {
    const parsed = themeSchema.parse({ ...validLight, name: "  Mi tema  " });
    expect(parsed.name).toBe("Mi tema");
  });

  it("devuelve un mensaje legible al fallar", () => {
    const result = validateTheme({ ...validLight, shape: { radius: -1, borderWidth: 1 } });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toContain("shape.radius");
    }
  });
});
