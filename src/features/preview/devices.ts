/** Presets de dispositivo. Los anchos son los que pide la especificación. */
export const DEVICE_PRESETS = {
  mobile: { label: "Móvil", width: 375, height: 812, canRotate: true },
  tablet: { label: "Tableta", width: 768, height: 1024, canRotate: true },
  desktop: { label: "Escritorio", width: 1280, height: 800, canRotate: false },
} as const;

export type DeviceId = keyof typeof DEVICE_PRESETS;
export type PreviewMode = DeviceId | "free" | "all";

export const DEVICE_IDS: DeviceId[] = ["mobile", "tablet", "desktop"];

export const FREE_WIDTH_LIMITS = { min: 320, max: 1440 } as const;
export const FREE_HEIGHT = 900;

export interface FrameSize {
  width: number;
  height: number;
}

export function getFrameSize(device: DeviceId, rotated: boolean): FrameSize {
  const preset = DEVICE_PRESETS[device];
  return rotated
    ? { width: preset.height, height: preset.width }
    : { width: preset.width, height: preset.height };
}
