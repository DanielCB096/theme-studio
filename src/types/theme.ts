/**
 * Modelo de datos del tema.
 *
 * La fuente de verdad de la validación es `src/lib/themeSchema.ts`; aquí viven
 * los tipos y las constantes que comparten esquema, store y UI.
 */

/** Familias tipográficas permitidas. No se cargan fuentes externas: solo pilas seguras. */
export const FONT_STACKS = {
  system:
    'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  humanist: '"Optima", "Candara", "Segoe UI", system-ui, sans-serif',
  geometric: '"Futura", "Century Gothic", "Avenir Next", "Segoe UI", system-ui, sans-serif',
  rounded: 'ui-rounded, "SF Pro Rounded", "Segoe UI", system-ui, sans-serif',
  serif: 'ui-serif, Georgia, Cambria, "Times New Roman", "Liberation Serif", serif',
  mono: 'ui-monospace, "SFMono-Regular", Menlo, Consolas, "Liberation Mono", monospace',
} as const;

export type FontFamily = keyof typeof FONT_STACKS;

export const FONT_FAMILY_KEYS = Object.keys(FONT_STACKS) as [FontFamily, ...FontFamily[]];

export const FONT_FAMILY_LABELS: Record<FontFamily, string> = {
  system: "Sistema (sans)",
  humanist: "Humanista",
  geometric: "Geométrica",
  rounded: "Redondeada",
  serif: "Serif",
  mono: "Monoespaciada",
};

export const THEME_MODES = ["light", "dark"] as const;
export type ThemeMode = (typeof THEME_MODES)[number];

export const BUTTON_SIZES = ["sm", "md", "lg"] as const;
export type ButtonSize = (typeof BUTTON_SIZES)[number];

export const DENSITIES = ["compact", "comfortable", "spacious"] as const;
export type Density = (typeof DENSITIES)[number];

export const DENSITY_LABELS: Record<Density, string> = {
  compact: "Compacta",
  comfortable: "Cómoda",
  spacious: "Amplia",
};

export const BUTTON_SIZE_LABELS: Record<ButtonSize, string> = {
  sm: "Pequeño",
  md: "Mediano",
  lg: "Grande",
};

/** Rangos numéricos. La UI y el esquema Zod deben usar exactamente estos valores. */
export const THEME_LIMITS = {
  nameMaxLength: 80,
  baseSize: { min: 12, max: 20 },
  scale: { min: 1.1, max: 1.5 },
  radius: { min: 0, max: 24 },
  borderWidth: { min: 0, max: 4 },
  spaceUnit: { min: 2, max: 8 },
} as const;

export interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
  muted: string;
  border: string;
  success: string;
  danger: string;
}

export interface ThemeTypography {
  fontFamily: FontFamily;
  /** px, 12–20 */
  baseSize: number;
  /** Razón tipográfica, 1.1–1.5 */
  scale: number;
}

export interface ThemeShape {
  /** px, 0–24 */
  radius: number;
  /** px, 0–4 */
  borderWidth: number;
}

export interface ThemeSpacing {
  /** px, 2–8 */
  unit: number;
}

export interface ThemeComponents {
  buttonSize: ButtonSize;
  density: Density;
}

export interface Theme {
  id: string;
  name: string;
  mode: ThemeMode;
  colors: ThemeColors;
  typography: ThemeTypography;
  shape: ThemeShape;
  spacing: ThemeSpacing;
  components: ThemeComponents;
}

/** Propiedades de color editables, en el orden en que se muestran en el panel. */
export const COLOR_KEYS = [
  "primary",
  "secondary",
  "background",
  "surface",
  "text",
  "muted",
  "border",
  "success",
  "danger",
] as const;

export type ColorKey = (typeof COLOR_KEYS)[number];

export const COLOR_LABELS: Record<ColorKey, string> = {
  primary: "Primario",
  secondary: "Secundario",
  background: "Fondo",
  surface: "Superficie",
  text: "Texto",
  muted: "Atenuado",
  border: "Borde",
  success: "Éxito",
  danger: "Peligro",
};
