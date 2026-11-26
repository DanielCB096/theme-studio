import { z } from "zod";

import { safeImageUrlSchema, safeUrlSchema } from "@/lib/url";
import { DEFAULT_BLOCK_LAYOUT, type BlockLayout, type PageBlockType } from "@/types/page";

export const blockIdSchema = z.string().min(1).max(64);
export const blockText = (max = 200) => z.string().trim().min(1).max(max);
export const optionalBlockText = (max = 300) => z.string().trim().max(max);
export const linkSchema = z.object({ label: blockText(60), href: safeUrlSchema }).strict();

/**
 * Layout v1 de un bloque. Todos los campos tienen default: un bloque guardado
 * antes de esta versión (sin `layout`) se interpreta con los valores por defecto.
 */
export const blockLayoutSchema = z
  .object({
    width: z.enum(["compact", "normal", "wide", "full"]).default("full"),
    align: z.enum(["left", "center", "right"]).default("left"),
    direction: z.enum(["row", "column"]).default("column"),
    reverse: z.boolean().default(false),
    columns: z.union([z.literal(1), z.literal(2), z.literal(3)]).default(1),
    gap: z.enum(["compact", "normal", "spacious"]).default("normal"),
  })
  .strict();

/**
 * Base común de cada bloque. `layoutDefaults` permite conservar el aspecto de
 * los bloques anteriores al Layout v1 (rejillas de 3 columnas, fila de texto e
 * imagen, etc.) sin romper páginas guardadas. `childIds` solo admite vacío en
 * el Hito 1: no hay anidación todavía.
 */
export function blockBase<T extends PageBlockType, P extends z.ZodTypeAny>(
  type: T,
  props: P,
  layoutDefaults: Partial<BlockLayout> = {},
) {
  const defaults = { ...DEFAULT_BLOCK_LAYOUT, ...layoutDefaults };
  return z
    .object({
      id: blockIdSchema,
      type: z.literal(type),
      childIds: z.array(blockIdSchema).max(0),
      layout: blockLayoutSchema.default(() => ({ ...defaults })),
      props,
    })
    .strict();
}

export { safeImageUrlSchema, safeUrlSchema };
