import { themeSchema } from "@/lib/themeSchema";
import { COLOR_LABELS, type ColorKey, type Theme } from "@/types/theme";

export type ThemeImportResult = { ok: true; theme: Theme } | { ok: false; errors: string[] };

const FIELD_LABELS: Record<string, string> = {
  id: "Identificador",
  name: "Nombre",
  mode: "Modo",
  colors: "Colores",
  typography: "Tipografía",
  shape: "Forma",
  spacing: "Espaciado",
  components: "Componentes",
  "typography.fontFamily": "Fuente",
  "typography.baseSize": "Tamaño base",
  "typography.scale": "Escala tipográfica",
  "shape.radius": "Radio de borde",
  "shape.borderWidth": "Grosor del borde",
  "spacing.unit": "Unidad de espaciado",
  "components.buttonSize": "Tamaño de botón",
  "components.density": "Densidad",
};

function describePath(path: readonly (string | number)[]): string {
  const joined = path.join(".");
  if (joined.startsWith("colors.")) {
    const key = path[1];
    if (typeof key === "string" && key in COLOR_LABELS) {
      return `Color ${COLOR_LABELS[key as ColorKey].toLowerCase()}`;
    }
  }
  return FIELD_LABELS[joined] ?? joined;
}

const MAX_ERRORS = 8;

/**
 * Convierte texto en un tema válido. No lanza: devuelve errores legibles para
 * mostrarlos tal cual en la interfaz.
 */
export function parseThemeJson(text: string): ThemeImportResult {
  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return { ok: false, errors: ["El contenido está vacío. Pega un tema o elige un archivo."] };
  }

  let data: unknown;
  try {
    data = JSON.parse(trimmed);
  } catch {
    return { ok: false, errors: ["El texto no es JSON válido."] };
  }

  const result = themeSchema.safeParse(data);
  if (!result.success) {
    const errors = result.error.issues.slice(0, MAX_ERRORS).map((issue) => {
      const field = describePath(issue.path);
      return field ? `${field}: ${issue.message}` : issue.message;
    });
    return { ok: false, errors };
  }

  return { ok: true, theme: result.data };
}
