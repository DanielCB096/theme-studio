import type {
  BlockLayoutAlign,
  BlockLayoutColumns,
  BlockLayoutGap,
  BlockLayoutWidth,
} from "@/types/page";

/**
 * Clases estáticas por token de layout. Nada de plantillas dinámicas: Tailwind
 * solo genera las clases que aparecen literalmente en el código.
 */
export const layoutWidthClass: Record<BlockLayoutWidth, string> = {
  compact: "max-w-2xl mx-auto",
  normal: "max-w-4xl mx-auto",
  wide: "max-w-6xl mx-auto",
  full: "w-full",
};

export const layoutGapClass: Record<BlockLayoutGap, string> = {
  compact: "gap-[calc(var(--space-unit)*2)]",
  normal: "gap-density",
  spacious: "gap-[calc(var(--space-unit)*6)]",
};

export const layoutTextAlignClass: Record<BlockLayoutAlign, string> = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
};

export const layoutItemsAlignClass: Record<BlockLayoutAlign, string> = {
  left: "items-start",
  center: "items-center",
  right: "items-end",
};

export const layoutColumnsClass: Record<BlockLayoutColumns, string> = {
  1: "grid-cols-1",
  2: "grid-cols-1 @md:grid-cols-2",
  3: "grid-cols-1 @md:grid-cols-3",
};
