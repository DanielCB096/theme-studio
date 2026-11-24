import { useEffect, useRef, useState } from "react";

import { GalleryApp } from "@/features/preview/GalleryApp";
import { ThemeScope } from "@/features/preview/ThemeScope";
import { cn } from "@/lib/utils";
import type { Theme } from "@/types/theme";

interface DeviceFrameProps {
  theme: Theme;
  label: string;
  width: number;
  height: number;
  /** Identificador estable para pruebas y estilos (mobile, tablet, desktop, free). */
  device: string;
  className?: string;
}

/** Ancho disponible del contenedor, medido con ResizeObserver. */
function useAvailableWidth() {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) setWidth(entry.contentRect.width);
    });
    observer.observe(element);
    setWidth(element.clientWidth);

    return () => observer.disconnect();
  }, []);

  return { ref, width };
}

/**
 * Marco de un dispositivo. Renderiza la galería a su ancho real y la escala
 * visualmente cuando no cabe, para que el layout interno se calcule con el
 * ancho del dispositivo y no con el del viewport.
 */
export function DeviceFrame({ theme, label, width, height, device, className }: DeviceFrameProps) {
  const { ref, width: available } = useAvailableWidth();
  const scale = available > 0 ? Math.min(1, Math.max(0.15, (available - 20) / width)) : 1;
  const outerWidth = width * scale + 16;
  const outerHeight = height * scale + 16;

  return (
    <figure
      className={cn("m-0 flex min-w-0 flex-col items-center gap-2", className)}
      data-device={device}
      data-device-width={width}
      data-device-height={height}
    >
      <figcaption className="flex items-baseline gap-2 text-xs text-muted">
        <span className="font-medium text-fg">{label}</span>
        <span aria-hidden="true">
          {width} × {height}
        </span>
        {scale < 0.995 ? <span aria-hidden="true">· {Math.round(scale * 100)} %</span> : null}
      </figcaption>

      <div ref={ref} className="flex w-full justify-center overflow-hidden">
        <div
          style={{ width: outerWidth, height: outerHeight }}
          className="rounded-xl border bg-border p-2 shadow-panel"
        >
          <div
            style={{
              width,
              height,
              transform: `scale(${scale})`,
              transformOrigin: "top left",
            }}
            className="overflow-hidden rounded-lg border bg-surface"
          >
            <div className="h-full overflow-y-auto overscroll-contain">
              <ThemeScope theme={theme} className="min-h-full">
                <GalleryApp />
              </ThemeScope>
            </div>
          </div>
        </div>
      </div>
    </figure>
  );
}
