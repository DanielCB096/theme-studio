import { DevicePreview } from "@/features/preview/DevicePreview";

/**
 * Contenedor de la zona de vista previa. El estado del tema lo consume
 * `DevicePreview`, que a su vez lo publica en cada marco con `ThemeScope`.
 */
export function PreviewPanel() {
  return (
    <main
      aria-label="Vista previa"
      className="min-h-0 flex-1 overflow-auto bg-background p-3 md:p-5"
    >
      <DevicePreview />
    </main>
  );
}
