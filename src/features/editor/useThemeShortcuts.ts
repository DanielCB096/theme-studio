import { useEffect } from "react";

import { useThemeStore } from "@/store/themeStore";

function isTextEntry(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  return target.closest("input, textarea, select") !== null;
}

/**
 * Atajos globales del editor.
 * - Ctrl/Cmd+Z: deshacer
 * - Ctrl/Cmd+Shift+Z: rehacer
 *
 * Se ignoran cuando el foco está en un campo de texto para no romper el
 * deshacer nativo mientras se escribe un nombre o un hex.
 */
export function useThemeShortcuts(): void {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const modifier = event.metaKey || event.ctrlKey;
      if (!modifier || event.altKey) return;
      if (event.key.toLowerCase() !== "z") return;
      if (isTextEntry(event.target)) return;

      event.preventDefault();
      const store = useThemeStore.getState();
      if (event.shiftKey) {
        store.redo();
      } else {
        store.undo();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
}
