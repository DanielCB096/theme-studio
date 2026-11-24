import { GalleryApp } from "@/features/preview/GalleryApp";
import { ThemeScope } from "@/features/preview/ThemeScope";
import { useThemeStore } from "@/store/themeStore";

/**
 * Vista previa del tema en curso. Se suscribe solo al tema, así que el resto
 * del editor (cabecera, panel) no se vuelve a renderizar con cada ajuste.
 */
export function PreviewPanel() {
  const theme = useThemeStore((state) => state.theme);

  return (
    <main
      aria-label="Vista previa"
      className="min-h-0 flex-1 overflow-auto bg-background p-3 md:p-5"
    >
      <div className="mx-auto max-w-[1100px] overflow-hidden rounded-xl border bg-surface shadow-panel">
        <ThemeScope theme={theme}>
          <GalleryApp />
        </ThemeScope>
      </div>
    </main>
  );
}
