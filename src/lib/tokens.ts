import { pickReadableText } from "@/lib/color";
import { FONT_STACKS, type ButtonSize, type Density, type Theme } from "@/types/theme";

/** Variables CSS que produce un tema. El prefijo evita colisiones con el chrome del editor. */
export type ThemeCssVars = Record<`--${string}`, string>;

/** Multiplicadores de la unidad de espaciado para cada densidad. */
export const DENSITY_GAP_FACTOR: Record<Density, number> = {
  compact: 2,
  comfortable: 3,
  spacious: 4,
};

/** Altura (en unidades de espaciado) y padding horizontal de cada tamaño de botón. */
export const BUTTON_SIZE_SPEC: Record<
  ButtonSize,
  { heightFactor: number; paddingFactor: number; fontSizeVar: string }
> = {
  sm: { heightFactor: 8, paddingFactor: 3, fontSizeVar: "--font-size-sm" },
  md: { heightFactor: 10, paddingFactor: 4, fontSizeVar: "--font-size-base" },
  lg: { heightFactor: 12, paddingFactor: 6, fontSizeVar: "--font-size-lg" },
};

/** Escala tipográfica derivada. `scale` controla los encabezados; los tamaños pequeños usan ratios fijos para seguir legibles. */
export function typeScale(
  baseSize: number,
  scale: number,
): Record<"xs" | "sm" | "base" | "lg" | "xl" | "2xl", number> {
  const round = (value: number) => Math.round(value * 10) / 10;
  return {
    xs: round(baseSize * 0.75),
    sm: round(baseSize * 0.875),
    base: baseSize,
    lg: round(baseSize * scale),
    xl: round(baseSize * scale ** 2),
    "2xl": round(baseSize * scale ** 3),
  };
}

/** Convierte el tema en variables CSS listas para aplicar en un contenedor. */
export function themeToCssVars(theme: Theme): ThemeCssVars {
  const { colors, typography, shape, spacing, components } = theme;
  const base = typography.baseSize;
  const scale = typography.scale;
  const unit = spacing.unit;
  const button = BUTTON_SIZE_SPEC[components.buttonSize];
  const type = typeScale(base, scale);

  return {
    "--color-primary": colors.primary,
    "--color-primary-contrast": pickReadableText(colors.primary),
    "--color-secondary": colors.secondary,
    "--color-secondary-contrast": pickReadableText(colors.secondary),
    "--color-background": colors.background,
    "--color-surface": colors.surface,
    "--color-text": colors.text,
    "--color-muted": colors.muted,
    "--color-border": colors.border,
    "--color-success": colors.success,
    "--color-success-contrast": pickReadableText(colors.success),
    "--color-danger": colors.danger,
    "--color-danger-contrast": pickReadableText(colors.danger),

    "--font-family": FONT_STACKS[typography.fontFamily],
    "--font-size-base": `${base}px`,
    "--font-size-xs": `${type.xs}px`,
    "--font-size-sm": `${type.sm}px`,
    "--font-size-lg": `${type.lg}px`,
    "--font-size-xl": `${type.xl}px`,
    "--font-size-2xl": `${type["2xl"]}px`,
    "--type-scale": String(scale),

    "--radius": `${shape.radius}px`,
    "--border-width": `${shape.borderWidth}px`,

    "--space-unit": `${unit}px`,
    "--density-gap": `${unit * DENSITY_GAP_FACTOR[components.density]}px`,

    "--btn-height-default": `${unit * button.heightFactor}px`,
    "--btn-padding-default": `${unit * button.paddingFactor}px`,
    "--btn-font-size-default": `var(${button.fontSizeVar})`,
    "--btn-height-sm": `${unit * BUTTON_SIZE_SPEC.sm.heightFactor}px`,
    "--btn-padding-sm": `${unit * BUTTON_SIZE_SPEC.sm.paddingFactor}px`,
    "--btn-height-md": `${unit * BUTTON_SIZE_SPEC.md.heightFactor}px`,
    "--btn-padding-md": `${unit * BUTTON_SIZE_SPEC.md.paddingFactor}px`,
    "--btn-height-lg": `${unit * BUTTON_SIZE_SPEC.lg.heightFactor}px`,
    "--btn-padding-lg": `${unit * BUTTON_SIZE_SPEC.lg.paddingFactor}px`,
  };
}
