import { z } from "zod";

import { themeColorsSchema } from "@/lib/themeSchema";
import type { ThemeColors } from "@/types/theme";

const responseSchema = z
  .object({
    colors: themeColorsSchema,
    source: z.enum(["gemini", "local"]).default("gemini"),
    cached: z.boolean().default(false),
  })
  .strict();

export interface PaletteResult {
  colors: ThemeColors;
  /** `local` indica que el proveedor no respondió y se usó la reserva determinista. */
  source: "gemini" | "local";
  /** `true` si se recuperó de la caché (servidor o navegador). */
  cached?: boolean;
}

export const GENERATION_TIMEOUT_MS = 50_000;

const CACHE_KEY = "theme-studio:palette-cache:v1";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const CACHE_MAX = 20;

interface CachedEntry {
  colors: ThemeColors;
  savedAt: number;
}

export function normalizePalettePrompt(prompt: string): string {
  return prompt.trim().toLowerCase().replace(/\s+/g, " ");
}

function readCache(): Record<string, CachedEntry> {
  if (typeof localStorage === "undefined") return {};
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as Record<string, CachedEntry>) : {};
  } catch {
    return {};
  }
}

function writeCache(entries: Record<string, CachedEntry>): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(entries));
  } catch {
    // Cuota llena o almacenamiento bloqueado: la caché es opcional.
  }
}

function getCachedPalette(prompt: string): PaletteResult | null {
  const key = normalizePalettePrompt(prompt);
  const entry = readCache()[key];
  if (!entry || Date.now() - entry.savedAt > CACHE_TTL_MS) return null;
  const parsed = themeColorsSchema.safeParse(entry.colors);
  if (!parsed.success) return null;
  return { colors: parsed.data, source: "gemini", cached: true };
}

function saveCachedPalette(prompt: string, colors: ThemeColors): void {
  const key = normalizePalettePrompt(prompt);
  const now = Date.now();
  const fresh = Object.entries(readCache())
    .filter(([, entry]) => now - entry.savedAt <= CACHE_TTL_MS)
    .sort(([, a], [, b]) => b.savedAt - a.savedAt)
    .slice(0, CACHE_MAX - 1);

  writeCache({ ...Object.fromEntries(fresh), [key]: { colors, savedAt: now } });
}

/**
 * Llama a la función serverless y valida la respuesta con Zod antes de
 * devolverla. La clave del proveedor nunca pasa por el navegador.
 */
export async function generatePalette(prompt: string): Promise<PaletteResult> {
  const cached = getCachedPalette(prompt);
  if (cached) return cached;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), GENERATION_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch("/api/generate-palette", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
      signal: controller.signal,
    });
  } catch (cause) {
    if (cause instanceof DOMException && cause.name === "AbortError") {
      throw new Error("La generación tardó demasiado. Inténtalo de nuevo.");
    }
    throw new Error("No se pudo conectar con el servidor de IA.");
  } finally {
    clearTimeout(timeout);
  }

  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      payload &&
      typeof payload === "object" &&
      "error" in payload &&
      typeof payload.error === "string"
        ? payload.error
        : response.status === 404
          ? "La función de IA no está disponible en este entorno. Usa `vercel dev` en local."
          : `El servidor respondió con un error (${response.status}).`;
    throw new Error(message);
  }

  const parsed = responseSchema.safeParse(payload);
  if (!parsed.success) {
    throw new Error("La respuesta del modelo no tiene la forma esperada. No se ha aplicado nada.");
  }

  if (parsed.data.source === "gemini") {
    saveCachedPalette(prompt, parsed.data.colors);
  }

  return parsed.data;
}
