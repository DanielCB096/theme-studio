import { z } from "zod";

import { pageBlockSchema } from "@/features/page-builder/blocks/schemas";
import { themeSchema } from "@/lib/themeSchema";
import { MAX_BLOCKS_PER_PAGE, type PageDocument } from "@/types/page";

const idSchema = z.string().min(1).max(64);

/**
 * Documento de página completo. El árbol está normalizado: `blocks` es un mapa
 * por id y `rootIds` fija el orden. En el Hito 1 no se permite anidación.
 */
export const pageDocumentSchema = z
  .object({
    version: z.literal(1),
    name: z.string().trim().min(1, "La página necesita un nombre").max(80),
    theme: themeSchema,
    rootIds: z.array(idSchema).max(MAX_BLOCKS_PER_PAGE),
    blocks: z.record(idSchema, pageBlockSchema),
  })
  .strict()
  .superRefine((page, ctx) => {
    const keys = Object.keys(page.blocks);

    if (new Set(page.rootIds).size !== page.rootIds.length) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Hay ids repetidos en rootIds" });
    }

    for (const rootId of page.rootIds) {
      if (!page.blocks[rootId]) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `rootIds apunta a un bloque inexistente: ${rootId}`,
          path: ["rootIds"],
        });
      }
    }

    for (const key of keys) {
      const block = page.blocks[key];
      if (!block) continue;
      if (block.id !== key) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `La clave ${key} no coincide con el id del bloque`,
          path: ["blocks", key],
        });
      }
      if (!page.rootIds.includes(key)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Hay un bloque huérfano que no está en rootIds",
          path: ["blocks", key],
        });
      }
      if (block.childIds.length > 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "La anidación de bloques no está disponible en el Hito 1",
          path: ["blocks", key, "childIds"],
        });
      }
    }
  });

/** Garantía de compilación: lo validado es exactamente un `PageDocument`. */
export const pageSchemaMatchesType = (page: z.infer<typeof pageDocumentSchema>): PageDocument =>
  page;

export function parsePageDocument(
  input: unknown,
): { ok: true; page: PageDocument } | { ok: false; errors: string[] } {
  const parsed = pageDocumentSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      errors: parsed.error.issues.slice(0, 8).map((issue) => {
        const path = issue.path.join(".");
        return path ? `${path}: ${issue.message}` : issue.message;
      }),
    };
  }
  return { ok: true, page: parsed.data };
}
