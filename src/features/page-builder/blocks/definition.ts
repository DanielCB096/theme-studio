import type { ComponentType } from "react";
import type { z } from "zod";

import type { PageBlockPropsMap, PageBlockType } from "@/types/page";

export interface BlockDefinition<T extends PageBlockType> {
  type: T;
  label: string;
  description: string;
  schema: z.ZodTypeAny;
  defaultProps: PageBlockPropsMap[T];
  Renderer: ComponentType<{ props: PageBlockPropsMap[T] }>;
  Inspector: ComponentType<{
    props: PageBlockPropsMap[T];
    onChange: (props: PageBlockPropsMap[T]) => void;
  }>;
}
