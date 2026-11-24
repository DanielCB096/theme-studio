import type { Config } from "tailwindcss";
import containerQueries from "@tailwindcss/container-queries";
import animate from "tailwindcss-animate";

/**
 * Tailwind no guarda colores propios: cada utilidad apunta a una variable CSS.
 * Así, cambiar un token en runtime repinta toda la galería sin recompilar.
 */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "var(--color-primary)",
          contrast: "var(--color-primary-contrast)",
        },
        secondary: {
          DEFAULT: "var(--color-secondary)",
          contrast: "var(--color-secondary-contrast)",
        },
        background: "var(--color-background)",
        surface: "var(--color-surface)",
        fg: "var(--color-text)",
        muted: "var(--color-muted)",
        border: "var(--color-border)",
        success: {
          DEFAULT: "var(--color-success)",
          contrast: "var(--color-success-contrast)",
        },
        danger: {
          DEFAULT: "var(--color-danger)",
          contrast: "var(--color-danger-contrast)",
        },
      },
      fontFamily: {
        DEFAULT: "var(--font-family)",
        sans: "var(--font-family)",
      },
      fontSize: {
        xs: ["var(--font-size-xs)", { lineHeight: "1.5" }],
        sm: ["var(--font-size-sm)", { lineHeight: "1.5" }],
        base: ["var(--font-size-base)", { lineHeight: "1.6" }],
        lg: ["var(--font-size-lg)", { lineHeight: "1.4" }],
        xl: ["var(--font-size-xl)", { lineHeight: "1.3" }],
        "2xl": ["var(--font-size-2xl)", { lineHeight: "1.2" }],
      },
      borderRadius: {
        DEFAULT: "var(--radius)",
        sm: "calc(var(--radius) * 0.6)",
        md: "calc(var(--radius) * 0.85)",
        lg: "var(--radius)",
        xl: "calc(var(--radius) * 1.4)",
      },
      borderWidth: {
        DEFAULT: "var(--border-width)",
      },
      spacing: {
        unit: "var(--space-unit)",
        density: "var(--density-gap)",
        "btn-sm": "var(--btn-height-sm)",
        "btn-md": "var(--btn-height-md)",
        "btn-lg": "var(--btn-height-lg)",
      },
      maxWidth: {
        readable: "72ch",
      },
      boxShadow: {
        // Sombra neutra derivada del color de texto del tema, no un negro fijo.
        panel: "0 1px 2px color-mix(in srgb, var(--color-text) 8%, transparent)",
        floating: "0 12px 32px color-mix(in srgb, var(--color-text) 24%, transparent)",
      },
    },
  },
  plugins: [animate, containerQueries],
} satisfies Config;
