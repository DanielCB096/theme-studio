import { z } from "zod";

import {
  BUTTON_SIZES,
  DENSITIES,
  FONT_FAMILY_KEYS,
  THEME_LIMITS as L,
  THEME_MODES,
  type Theme,
} from "@/types/theme";

/** Color hexadecimal de 6 dígitos. Se acepta mayúscula, se normaliza al aplicar. */
export const hexColorSchema = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, "Debe ser un color hexadecimal de 6 dígitos, p. ej. #2563eb");

const colorSetSchema = z
  .object({
    primary: hexColorSchema,
    secondary: hexColorSchema,
    background: hexColorSchema,
    surface: hexColorSchema,
    text: hexColorSchema,
    muted: hexColorSchema,
    border: hexColorSchema,
    success: hexColorSchema,
    danger: hexColorSchema,
  })
  .strict();

const typographySchema = z
  .object({
    fontFamily: z.enum(FONT_FAMILY_KEYS),
    baseSize: z
      .number()
      .min(L.baseSize.min, `El tamaño base mínimo es ${L.baseSize.min} px`)
      .max(L.baseSize.max, `El tamaño base máximo es ${L.baseSize.max} px`),
    scale: z
      .number()
      .min(L.scale.min, `La escala mínima es ${L.scale.min}`)
      .max(L.scale.max, `La escala máxima es ${L.scale.max}`),
  })
  .strict();

const shapeSchema = z
  .object({
    radius: z
      .number()
      .min(L.radius.min, "El radio no puede ser negativo")
      .max(L.radius.max, `El radio máximo es ${L.radius.max} px`),
    borderWidth: z
      .number()
      .min(L.borderWidth.min, "El borde no puede ser negativo")
      .max(L.borderWidth.max, `El borde máximo es ${L.borderWidth.max} px`),
  })
  .strict();

const spacingSchema = z
  .object({
    unit: z
      .number()
      .min(L.spaceUnit.min, `La unidad mínima es ${L.spaceUnit.min} px`)
      .max(L.spaceUnit.max, `La unidad máxima es ${L.spaceUnit.max} px`),
  })
  .strict();

const componentsSchema = z
  .object({
    buttonSize: z.enum(BUTTON_SIZES),
    density: z.enum(DENSITIES),
  })
  .strict();

export const themeSchema = z
  .object({
    id: z.string().min(1, "El tema necesita un identificador").max(100),
    name: z
      .string()
      .trim()
      .min(1, "El nombre no puede estar vacío")
      .max(L.nameMaxLength, `El nombre admite hasta ${L.nameMaxLength} caracteres`),
    mode: z.enum(THEME_MODES),
    colors: colorSetSchema,
    typography: typographySchema,
    shape: shapeSchema,
    spacing: spacingSchema,
    components: componentsSchema,
  })
  .strict();

/**
 * Solo los colores: lo que devuelve la IA y lo que se puede importar parcialmente.
 * Se usa para validar la respuesta del modelo antes de tocar el tema.
 */
export const themeColorsSchema = colorSetSchema;

export type ThemeInput = z.input<typeof themeSchema>;

/**
 * Garantía en tiempo de compilación: lo que valida el esquema es exactamente
 * el tipo `Theme`. Si divergen, TypeScript falla aquí.
 */
export const themeSchemaMatchesType = (value: z.infer<typeof themeSchema>): Theme => value;

/** Valida sin lanzar y devuelve el primer mensaje legible por humanos. */
export function validateTheme(
  input: unknown,
): { ok: true; theme: Theme } | { ok: false; message: string } {
  const result = themeSchema.safeParse(input);
  if (!result.success) {
    return { ok: false, message: formatZodError(result.error) };
  }
  return { ok: true, theme: result.data };
}

export function formatZodError(error: z.ZodError): string {
  return error.issues
    .map((issue) => {
      const path = issue.path.join(".");
      return path ? `${path}: ${issue.message}` : issue.message;
    })
    .join(". ");
}
