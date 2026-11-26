import { z } from "zod";

const SUBMIT_ENDPOINT = "/api/submit-page-form";
const SUBMIT_TIMEOUT_MS = 15_000;

const successSchema = z.object({ ok: z.literal(true) }).strict();
const errorSchema = z.object({ error: z.string().min(1) });

async function responseError(response: Response): Promise<string | null> {
  try {
    const payload: unknown = await response.json();
    const parsed = errorSchema.safeParse(payload);
    return parsed.success ? parsed.data.error : null;
  } catch {
    return null;
  }
}

/**
 * Envía los valores de un formulario público al endpoint, que inserta la
 * respuesta con RLS (solo páginas públicas). `website` es el honeypot.
 */
export async function submitPageForm(
  pageId: string,
  values: Record<string, string>,
): Promise<void> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SUBMIT_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(SUBMIT_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pageId, values, website: "" }),
      signal: controller.signal,
    });
  } catch (cause) {
    if (cause instanceof Error && cause.name === "AbortError") {
      throw new Error("El envío tardó demasiado. Inténtalo de nuevo.");
    }
    throw new Error(
      "No se pudo conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.",
    );
  } finally {
    clearTimeout(timeout);
  }

  if (response.status === 429) {
    throw new Error("Has hecho demasiados envíos. Espera unos minutos e inténtalo de nuevo.");
  }

  if (response.status === 404) {
    throw new Error(
      "El envío de formularios no está disponible en este entorno. Usa `npm run dev` o `vercel dev`.",
    );
  }

  if (!response.ok) {
    const message = await responseError(response);
    throw new Error(
      message ?? `No se pudo enviar el formulario (error ${response.status}). Inténtalo de nuevo.`,
    );
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new Error("El servidor devolvió una respuesta inesperada. No se guardó el formulario.");
  }

  if (!successSchema.safeParse(payload).success) {
    throw new Error("El servidor devolvió una respuesta inesperada. No se guardó el formulario.");
  }
}
