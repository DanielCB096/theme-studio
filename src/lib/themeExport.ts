import { DENSITY_GAP_FACTOR, themeToCssVars, typeScale } from "@/lib/tokens";
import { FONT_STACKS, type Theme } from "@/types/theme";

export type ExportFormat = "json" | "css" | "tailwind";

export const EXPORT_FORMATS: ExportFormat[] = ["json", "css", "tailwind"];

const round = (value: number) => Math.round(value * 10) / 10;

/** Tema completo, tal cual lo consume la aplicación. */
export function exportThemeJson(theme: Theme): string {
  return `${JSON.stringify(theme, null, 2)}\n`;
}

/** Variables CSS listas para pegar en `:root` (o en un selector de tema). */
export function exportThemeCss(theme: Theme): string {
  const vars = themeToCssVars(theme);
  const body = Object.entries(vars)
    .map(([name, value]) => `  ${name}: ${value};`)
    .join("\n");
  return `/* Theme Studio · ${theme.name} (${theme.mode}) */\n:root {\n${body}\n}\n`;
}

/** Objeto para `theme.extend` de Tailwind con valores literales (sin depender de variables). */
export function buildTailwindExtend(theme: Theme) {
  const { colors, shape, spacing, typography, components } = theme;
  const radius = shape.radius;
  const type = typeScale(typography.baseSize, typography.scale);

  return {
    colors: { ...colors },
    borderRadius: {
      DEFAULT: `${radius}px`,
      sm: `${round(radius * 0.6)}px`,
      md: `${round(radius * 0.85)}px`,
      lg: `${radius}px`,
      xl: `${round(radius * 1.4)}px`,
    },
    borderWidth: { DEFAULT: `${shape.borderWidth}px` },
    fontFamily: { sans: FONT_STACKS[typography.fontFamily] },
    fontSize: {
      xs: [`${type.xs}px`, { lineHeight: "1.5" }],
      sm: [`${type.sm}px`, { lineHeight: "1.5" }],
      base: [`${type.base}px`, { lineHeight: "1.6" }],
      lg: [`${type.lg}px`, { lineHeight: "1.4" }],
      xl: [`${type.xl}px`, { lineHeight: "1.3" }],
      "2xl": [`${type["2xl"]}px`, { lineHeight: "1.2" }],
    },
    spacing: {
      unit: `${spacing.unit}px`,
      density: `${spacing.unit * DENSITY_GAP_FACTOR[components.density]}px`,
    },
  };
}

/** Configuración de Tailwind: el fragmento que se pega en `tailwind.config`. */
export function exportTailwindTheme(theme: Theme): string {
  return `${JSON.stringify({ theme: { extend: buildTailwindExtend(theme) } }, null, 2)}\n`;
}

export function exportTheme(theme: Theme, format: ExportFormat): string {
  switch (format) {
    case "json":
      return exportThemeJson(theme);
    case "css":
      return exportThemeCss(theme);
    case "tailwind":
      return exportTailwindTheme(theme);
  }
}

export const EXPORT_MIME: Record<ExportFormat, string> = {
  json: "application/json",
  css: "text/css",
  tailwind: "application/json",
};

export const EXPORT_LABELS: Record<ExportFormat, string> = {
  json: "JSON",
  css: "CSS",
  tailwind: "Tailwind",
};

/** Convierte el nombre en un slug seguro para nombres de archivo. */
export function slugifyThemeName(name: string): string {
  const slug = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return slug || "tema";
}

export function exportFileName(theme: Theme, format: ExportFormat): string {
  const extension = format === "tailwind" ? "tailwind.json" : format;
  return `${slugifyThemeName(theme.name)}.${extension}`;
}
