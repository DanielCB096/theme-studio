/** Utilidades de color sin dependencias, compartidas por tokens y contraste. */

export interface RgbColor {
  r: number;
  g: number;
  b: number;
}

const HEX_PATTERN = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i;

/** Convierte `#rrggbb` en canales 0–255. Lanza si el formato es inválido. */
export function hexToRgb(hex: string): RgbColor {
  const match = HEX_PATTERN.exec(hex.trim());
  if (!match) {
    throw new Error(`Color hexadecimal inválido: ${hex}`);
  }
  const [, r, g, b] = match;
  if (r === undefined || g === undefined || b === undefined) {
    throw new Error(`Color hexadecimal inválido: ${hex}`);
  }
  return { r: parseInt(r, 16), g: parseInt(g, 16), b: parseInt(b, 16) };
}

export function rgbToHex({ r, g, b }: RgbColor): string {
  const clamp = (value: number) => Math.min(255, Math.max(0, Math.round(value)));
  return `#${[r, g, b].map((channel) => clamp(channel).toString(16).padStart(2, "0")).join("")}`;
}

export interface HslColor {
  /** Tono en grados, 0–360. */
  h: number;
  /** Saturación en porcentaje, 0–100. */
  s: number;
  /** Luminosidad en porcentaje, 0–100. */
  l: number;
}

export function rgbToHsl({ r, g, b }: RgbColor): HslColor {
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const delta = max - min;
  const l = (max + min) / 2;

  let h = 0;
  let s = 0;

  if (delta !== 0) {
    s = delta / (1 - Math.abs(2 * l - 1));
    switch (max) {
      case red:
        h = ((green - blue) / delta) % 6;
        break;
      case green:
        h = (blue - red) / delta + 2;
        break;
      default:
        h = (red - green) / delta + 4;
    }
    h *= 60;
    if (h < 0) h += 360;
  }

  return { h, s: s * 100, l: l * 100 };
}

export function hslToHex({ h, s, l }: HslColor): string {
  const saturation = Math.min(100, Math.max(0, s)) / 100;
  const lightness = Math.min(100, Math.max(0, l)) / 100;
  const normalizedHue = (((h % 360) + 360) % 360) / 360;

  if (saturation === 0) {
    const channel = Math.round(lightness * 255);
    return rgbToHex({ r: channel, g: channel, b: channel });
  }

  const q =
    lightness < 0.5
      ? lightness * (1 + saturation)
      : lightness + saturation - lightness * saturation;
  const p = 2 * lightness - q;

  const hueToChannel = (t: number) => {
    let temp = t;
    if (temp < 0) temp += 1;
    if (temp > 1) temp -= 1;
    if (temp < 1 / 6) return p + (q - p) * 6 * temp;
    if (temp < 1 / 2) return q;
    if (temp < 2 / 3) return p + (q - p) * (2 / 3 - temp) * 6;
    return p;
  };

  return rgbToHex({
    r: hueToChannel(normalizedHue + 1 / 3) * 255,
    g: hueToChannel(normalizedHue) * 255,
    b: hueToChannel(normalizedHue - 1 / 3) * 255,
  });
}

/** Normaliza a minúsculas; devuelve `null` si no es un hex válido. */
export function normalizeHex(value: string): string | null {
  const trimmed = value.trim();
  return HEX_PATTERN.test(trimmed) ? trimmed.toLowerCase() : null;
}

/** Canal sRGB (0–1) linealizado según WCAG 2.1. */
export function linearizeChannel(channel: number): number {
  const c = channel / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/** Luminancia relativa WCAG (0 = negro, 1 = blanco). */
export function relativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  return 0.2126 * linearizeChannel(r) + 0.7152 * linearizeChannel(g) + 0.0722 * linearizeChannel(b);
}

/** Blanco y un casi-negro: los dos colores con los que se busca contraste. */
export const LIGHT_TEXT = "#ffffff";
export const DARK_TEXT = "#0b1220";

/**
 * Devuelve el color de texto (blanco o casi negro) con mayor contraste sobre
 * `background`. No intenta cumplir AA: la corrección de contraste llega en la
 * Fase 5 con `contrast.ts`.
 */
export function pickReadableText(background: string): string {
  const luminance = relativeLuminance(background);
  // Fórmula de razón de contraste comparada para ambos candidatos.
  const whiteRatio = 1.05 / (luminance + 0.05);
  const darkLuminance = relativeLuminance(DARK_TEXT);
  const darkRatio =
    (Math.max(luminance, darkLuminance) + 0.05) / (Math.min(luminance, darkLuminance) + 0.05);
  return whiteRatio >= darkRatio ? LIGHT_TEXT : DARK_TEXT;
}
