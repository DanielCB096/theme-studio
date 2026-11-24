import { describe, expect, it } from "vitest";

import { DEFAULT_THEMES } from "@/lib/defaultThemes";
import { DENSITY_GAP_FACTOR, themeToCssVars } from "@/lib/tokens";

const light = DEFAULT_THEMES.light;

describe("themeToCssVars", () => {
  it("traduce colores, forma y espaciado a variables CSS", () => {
    const vars = themeToCssVars(light);
    expect(vars["--color-primary"]).toBe("#2563eb");
    expect(vars["--color-background"]).toBe("#f8fafc");
    expect(vars["--radius"]).toBe("10px");
    expect(vars["--border-width"]).toBe("1px");
    expect(vars["--space-unit"]).toBe("4px");
    expect(vars["--font-size-base"]).toBe("16px");
  });

  it("deriva el espaciado de densidad del múltiplo de la unidad", () => {
    const compact = {
      ...light,
      components: { ...light.components, density: "compact" as const },
    };
    const vars = themeToCssVars(compact);
    expect(vars["--density-gap"]).toBe(`${4 * DENSITY_GAP_FACTOR.compact}px`);
  });

  it("genera una escala tipográfica creciente", () => {
    const vars = themeToCssVars({ ...light, typography: { ...light.typography, scale: 1.5 } });
    expect(vars["--font-size-lg"]).toBe("24px");
    expect(vars["--font-size-xl"]).toBe("36px");
    expect(vars["--font-size-2xl"]).toBe("54px");
  });

  it("elige texto legible para los botones sólidos", () => {
    const vars = themeToCssVars(light);
    expect(vars["--color-primary-contrast"]).toBe("#ffffff");
    expect(vars["--color-danger-contrast"]).toBe("#ffffff");
  });
});
