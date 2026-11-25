import { z } from "zod";

import { safeImageUrlSchema, safeUrlSchema } from "@/lib/url";
import type { PageBlockType } from "@/types/page";

export const blockIdSchema = z.string().min(1).max(64);
export const blockText = (max = 200) => z.string().trim().min(1).max(max);
export const optionalBlockText = (max = 300) => z.string().trim().max(max);
export const linkSchema = z.object({ label: blockText(60), href: safeUrlSchema }).strict();

/**
 * Base común de cada bloque. `childIds` solo admite vacío en el Hito 1: no hay
 * anidación todavía.
 */
export function blockBase<T extends PageBlockType, P extends z.ZodTypeAny>(type: T, props: P) {
  return z
    .object({
      id: blockIdSchema,
      type: z.literal(type),
      childIds: z.array(blockIdSchema).max(0),
      props,
    })
    .strict();
}

export { safeImageUrlSchema, safeUrlSchema };
