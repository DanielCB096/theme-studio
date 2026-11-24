import { Columns3, Monitor, MoveHorizontal, RotateCw, Smartphone, Tablet } from "lucide-react";
import { useState, type ChangeEvent } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { DeviceFrame } from "@/features/preview/DeviceFrame";
import {
  DEVICE_IDS,
  DEVICE_PRESETS,
  FREE_HEIGHT,
  FREE_WIDTH_LIMITS,
  getFrameSize,
  type DeviceId,
  type PreviewMode,
} from "@/features/preview/devices";
import { useThemeStore } from "@/store/themeStore";
import { cn } from "@/lib/utils";

const MODES = [
  { id: "mobile", label: "Móvil", icon: Smartphone },
  { id: "tablet", label: "Tableta", icon: Tablet },
  { id: "desktop", label: "Escritorio", icon: Monitor },
  { id: "free", label: "Libre", icon: MoveHorizontal },
  { id: "all", label: "Todas", icon: Columns3 },
] as const satisfies ReadonlyArray<{ id: PreviewMode; label: string; icon: typeof Smartphone }>;

/**
 * Selector de dispositivo y marcos de vista previa. El estado de orientación y
 * el ancho libre son locales: no forman parte del tema y no deberían ensuciar
 * el historial ni el autoguardado.
 */
export function DevicePreview() {
  const theme = useThemeStore((state) => state.theme);
  const [mode, setMode] = useState<PreviewMode>("desktop");
  const [rotated, setRotated] = useState<Record<DeviceId, boolean>>({
    mobile: false,
    tablet: false,
    desktop: false,
  });
  const [freeWidth, setFreeWidth] = useState(720);

  const activeDevice = DEVICE_IDS.find((id) => id === mode);
  const canRotate = activeDevice ? DEVICE_PRESETS[activeDevice].canRotate : false;

  const activeSize = activeDevice
    ? getFrameSize(activeDevice, rotated[activeDevice])
    : mode === "free"
      ? { width: freeWidth, height: FREE_HEIGHT }
      : null;

  const handleFreeWidth = (event: ChangeEvent<HTMLInputElement>) => {
    setFreeWidth(Number(event.target.value));
  };

  return (
    <div data-preview-mode={mode} className="mx-auto flex w-full max-w-[1500px] flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-surface p-2 shadow-panel">
        <div role="group" aria-label="Dispositivo" className="flex flex-wrap items-center gap-1">
          {MODES.map(({ id, label, icon: Icon }) => {
            const pressed = mode === id;
            return (
              <button
                key={id}
                type="button"
                aria-pressed={pressed}
                onClick={() => setMode(id)}
                className={cn(
                  "inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-sm font-medium transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                  pressed
                    ? "bg-primary text-primary-contrast"
                    : "text-muted hover:bg-background hover:text-fg",
                )}
              >
                <Icon aria-hidden="true" className="h-4 w-4" />
                {label}
              </button>
            );
          })}
        </div>

        <Button
          variant="outline"
          size="sm"
          className="ml-auto"
          onClick={() => {
            if (!activeDevice) return;
            setRotated((previous) => ({ ...previous, [activeDevice]: !previous[activeDevice] }));
          }}
          disabled={!canRotate}
          aria-label="Rotar dispositivo"
          title="Rotar vertical/horizontal"
        >
          <RotateCw aria-hidden="true" className="h-4 w-4" />
          Rotar
        </Button>
      </div>

      {mode === "free" ? (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-surface p-3 shadow-panel">
          <Label htmlFor="free-width">Ancho libre</Label>
          <input
            id="free-width"
            type="range"
            min={FREE_WIDTH_LIMITS.min}
            max={FREE_WIDTH_LIMITS.max}
            step={1}
            value={freeWidth}
            onChange={handleFreeWidth}
            className="h-2 min-w-[180px] flex-1 cursor-pointer accent-primary"
          />
          <output htmlFor="free-width" className="w-20 text-right font-mono text-xs text-muted">
            {freeWidth} px
          </output>
        </div>
      ) : null}

      {mode === "all" ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 2xl:grid-cols-3">
          {DEVICE_IDS.map((id) => {
            const size = getFrameSize(id, false);
            return (
              <DeviceFrame
                key={id}
                theme={theme}
                device={id}
                label={DEVICE_PRESETS[id].label}
                width={size.width}
                height={size.height}
              />
            );
          })}
        </div>
      ) : null}

      {activeSize ? (
        <div className="flex justify-center">
          <DeviceFrame
            theme={theme}
            device={mode}
            label={activeDevice ? DEVICE_PRESETS[activeDevice].label : "Ancho libre"}
            width={activeSize.width}
            height={activeSize.height}
          />
        </div>
      ) : null}

      <p className="text-center text-xs text-muted">
        La disposición depende del ancho del marco (container queries), no del ancho del navegador.
      </p>
    </div>
  );
}
