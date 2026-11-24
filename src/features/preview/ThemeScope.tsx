import type { ReactNode } from "react";

import { themeToCssVars } from "@/lib/tokens";
import { cn } from "@/lib/utils";
import type { Theme } from "@/types/theme";

interface ThemeScopeProps {
  theme: Theme;
  children: ReactNode;
  className?: string;
  /** Etiqueta semántica del contenedor; `div` por defecto. */
  as?: "div" | "section" | "main";
}

/**
 * Publica las variables CSS de un tema en un subárbol. Las variables viajan en
 * un objeto `style`, no en `<style>`: cero CSS generado y actualización instantánea.
 */
export function ThemeScope({ theme, children, className, as: Tag = "div" }: ThemeScopeProps) {
  return (
    <Tag
      data-theme-mode={theme.mode}
      style={themeToCssVars(theme)}
      className={cn("bg-background font-sans text-fg", className)}
    >
      {children}
    </Tag>
  );
}
