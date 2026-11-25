import type { ComponentType } from "react";
import type { z } from "zod";

import type { BlockLayout, PageBlockPropsMap, PageBlockType } from "@/types/page";

/** Máximo de columnas que ofrece el inspector de layout para un bloque. */
export type LayoutColumnsMax = 2 | 3;

/** Campos de Layout v1 con sentido para un tipo de bloque. */
export interface BlockLayoutCapabilities {
  width: boolean;
  align: boolean;
  direction: boolean;
  reverse: boolean;
  columns: boolean;
  columnsMax?: LayoutColumnsMax;
  gap: boolean;
}

export interface BlockDefinition<T extends PageBlockType> {
  type: T;
  label: string;
  description: string;
  schema: z.ZodTypeAny;
  defaultProps: PageBlockPropsMap[T];
  layoutCapabilities: BlockLayoutCapabilities;
  Renderer: ComponentType<{ props: PageBlockPropsMap[T]; layout: BlockLayout }>;
  Inspector: ComponentType<{
    props: PageBlockPropsMap[T];
    layout: BlockLayout;
    onChange: (props: PageBlockPropsMap[T]) => void;
  }>;
}
