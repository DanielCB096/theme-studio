import { z } from "zod";

const ALLOWED_PROTOCOLS = new Set(["http:", "https:", "mailto:", "tel:"]);

/** Solo enlaces internos, anclas o protocolos seguros. Bloquea `javascript:` y `data:`. */
export function isSafeUrl(value: string): boolean {
  const trimmed = value.trim();
  if (trimmed.length === 0) return false;
  if (trimmed.startsWith("#")) return true;
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) return true;
  try {
    return ALLOWED_PROTOCOLS.has(new URL(trimmed).protocol);
  } catch {
    return false;
  }
}

export const safeUrlSchema = z
  .string()
  .trim()
  .max(300)
  .refine(isSafeUrl, "URL no permitida: usa https, http, mailto, tel, # o una ruta interna");

export const safeImageUrlSchema = safeUrlSchema.refine(
  (value) => !/^(mailto|tel):/i.test(value),
  "La imagen debe usar https, http o una ruta interna",
);
