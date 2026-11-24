import { themeSchema } from "@/lib/themeSchema";
import type { Theme, ThemeMode } from "@/types/theme";

/**
 * Temas por defecto. Se validan al cargar el módulo: si alguien edita un valor
 * fuera de rango, la aplicación falla de inmediato en desarrollo en lugar de
 * producir un tema inválido en silencio.
 */
const lightTheme: Theme = themeSchema.parse({
  id: "9f2b1c34-6d2e-4c1b-9e7a-2f4d8a1c5b60",
  name: "Claro por defecto",
  mode: "light",
  colors: {
    primary: "#2563eb",
    secondary: "#7c3aed",
    background: "#f8fafc",
    surface: "#ffffff",
    text: "#0f172a",
    muted: "#64748b",
    border: "#e2e8f0",
    success: "#15803d",
    danger: "#dc2626",
  },
  typography: { fontFamily: "system", baseSize: 16, scale: 1.25 },
  shape: { radius: 10, borderWidth: 1 },
  spacing: { unit: 4 },
  components: { buttonSize: "md", density: "comfortable" },
});

const darkTheme: Theme = themeSchema.parse({
  id: "4c7e8a21-3b5f-4d90-8c16-7a9e2d3f4b81",
  name: "Oscuro por defecto",
  mode: "dark",
  colors: {
    primary: "#60a5fa",
    secondary: "#c4b5fd",
    background: "#0b1220",
    surface: "#131c2e",
    text: "#e5edf8",
    muted: "#94a3b8",
    border: "#263449",
    success: "#4ade80",
    danger: "#f87171",
  },
  typography: { fontFamily: "system", baseSize: 16, scale: 1.25 },
  shape: { radius: 10, borderWidth: 1 },
  spacing: { unit: 4 },
  components: { buttonSize: "md", density: "comfortable" },
});

export const DEFAULT_THEMES: Record<ThemeMode, Theme> = {
  light: lightTheme,
  dark: darkTheme,
};

export const DEFAULT_THEME: Theme = lightTheme;
