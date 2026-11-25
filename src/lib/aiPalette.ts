import { z } from "zod";

import { themeColorsSchema } from "@/lib/themeSchema";
import type { ThemeColors } from "@/types/theme";

const responseSchema = z.object({ colors: themeColorsSchema }).strict();

export const GENERATION_TIMEOUT_MS = 50_000;

/**
 * Llama a la función serverless y valida la respuesta con Zod antes de
 * devolverla. La clave del proveedor nunca pasa por el navegador.
 */
export async function generatePalette(prompt: string): Promise<ThemeColors> {
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

  return parsed.data.colors;
}
