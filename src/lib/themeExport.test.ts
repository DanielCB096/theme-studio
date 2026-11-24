import { describe, expect, it } from "vitest";

import { FONT_STACKS, type Theme } from "@/types/theme";
import {
  buildTailwindExtend,
  exportFileName,
  exportTheme,
  exportThemeCss,
  exportThemeJson,
  exportTailwindTheme,
  slugifyThemeName,
} from "@/lib/themeExport";

const fixture: Theme = {
  id: "tema-de-prueba",
  name: "Tema de prueba",
  mode: "light",
  colors: {
    primary: "#112233",
    secondary: "#223344",
    background: "#f0f0f0",
    surface: "#ffffff",
    text: "#111111",
    muted: "#777777",
    border: "#dddddd",
    success: "#00aa00",
    danger: "#cc0000",
  },
  typography: { fontFamily: "mono", baseSize: 16, scale: 1.5 },
  shape: { radius: 8, borderWidth: 2 },
  spacing: { unit: 4 },
  components: { buttonSize: "md", density: "compact" },
};

describe("exportThemeCss", () => {
  it("genera exactamente las variables esperadas en :root", () => {
    expect(exportThemeCss(fixture)).toBe(`/* Theme Studio · Tema de prueba (light) */
:root {
  --color-primary: #112233;
  --color-primary-contrast: #ffffff;
  --color-secondary: #223344;
  --color-secondary-contrast: #ffffff;
  --color-background: #f0f0f0;
  --color-surface: #ffffff;
  --color-text: #111111;
  --color-muted: #777777;
  --color-border: #dddddd;
  --color-success: #00aa00;
  --color-success-contrast: #0b1220;
  --color-danger: #cc0000;
  --color-danger-contrast: #ffffff;
  --font-family: ${FONT_STACKS.mono};
  --font-size-base: 16px;
  --font-size-xs: 12px;
  --font-size-sm: 14px;
  --font-size-lg: 24px;
  --font-size-xl: 36px;
  --font-size-2xl: 54px;
  --type-scale: 1.5;
  --radius: 8px;
  --border-width: 2px;
  --space-unit: 4px;
  --density-gap: 8px;
  --btn-height-default: 40px;
  --btn-padding-default: 16px;
  --btn-font-size-default: var(--font-size-base);
  --btn-height-sm: 32px;
  --btn-padding-sm: 12px;
  --btn-height-md: 40px;
  --btn-padding-md: 16px;
  --btn-height-lg: 48px;
  --btn-padding-lg: 24px;
}
`);
  });
});

describe("exportThemeJson", () => {
  it("serializa el tema completo con indentación y salto final", () => {
    const json = exportThemeJson(fixture);
    expect(json.endsWith("}\n")).toBe(true);
    expect(JSON.parse(json)).toEqual(fixture);
  });
});

describe("exportTailwindTheme", () => {
  it("genera el fragmento theme.extend con valores literales", () => {
    expect(JSON.parse(exportTailwindTheme(fixture))).toEqual({
      theme: {
        extend: {
          colors: fixture.colors,
          borderRadius: {
            DEFAULT: "8px",
            sm: "4.8px",
            md: "6.8px",
            lg: "8px",
            xl: "11.2px",
          },
          borderWidth: { DEFAULT: "2px" },
          fontFamily: { sans: FONT_STACKS.mono },
          fontSize: {
            xs: ["12px", { lineHeight: "1.5" }],
            sm: ["14px", { lineHeight: "1.5" }],
            base: ["16px", { lineHeight: "1.6" }],
            lg: ["24px", { lineHeight: "1.4" }],
            xl: ["36px", { lineHeight: "1.3" }],
            "2xl": ["54px", { lineHeight: "1.2" }],
          },
          spacing: { unit: "4px", density: "8px" },
        },
      },
    });
  });

  it("deriva el espaciado de densidad de la unidad", () => {
    const extend = buildTailwindExtend({
      ...fixture,
      components: { ...fixture.components, density: "spacious" },
      spacing: { unit: 6 },
    });
    expect(extend.spacing).toEqual({ unit: "6px", density: "24px" });
  });
});

describe("exportTheme", () => {
  it("elige el formato pedido", () => {
    expect(exportTheme(fixture, "css")).toBe(exportThemeCss(fixture));
    expect(exportTheme(fixture, "json")).toBe(exportThemeJson(fixture));
    expect(exportTheme(fixture, "tailwind")).toBe(exportTailwindTheme(fixture));
  });
});

describe("nombres de archivo", () => {
  it("genera slugs sin acentos ni símbolos", () => {
    expect(slugifyThemeName("Tema Ñandú / Oscuro")).toBe("tema-nandu-oscuro");
    expect(slugifyThemeName("  ***  ")).toBe("tema");
  });

  it("usa la extensión correcta", () => {
    expect(exportFileName(fixture, "css")).toBe("tema-de-prueba.css");
    expect(exportFileName(fixture, "json")).toBe("tema-de-prueba.json");
    expect(exportFileName(fixture, "tailwind")).toBe("tema-de-prueba.tailwind.json");
  });
});
