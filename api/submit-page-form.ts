import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

import type { Database, Json } from "../src/types/database";

const MAX_VALUES = 12;
const MAX_KEY_LENGTH = 60;
const MAX_VALUE_LENGTH = 2000;
const MAX_SERIALIZED_BYTES = 20_000;
const RATE_LIMIT = { max: 5, windowMs: 10 * 60 * 1000 } as const;
const USER_AGENT_MAX_LENGTH = 300;

const valuesSchema = z
  .record(z.string().min(1).max(MAX_KEY_LENGTH), z.string().max(MAX_VALUE_LENGTH))
  .refine((values) => !Array.isArray(values), "Los valores deben ser un objeto.")
  .refine((values) => {
    const count = Object.keys(values).length;
    return count >= 1 && count <= MAX_VALUES;
  }, `El formulario debe tener entre 1 y ${MAX_VALUES} campos.`)
  .refine(
    (values) => new TextEncoder().encode(JSON.stringify(values)).length <= MAX_SERIALIZED_BYTES,
    "Los datos del formulario son demasiado grandes.",
  );

const requestSchema = z
  .object({
    pageId: z.string().uuid("El identificador de la página no es válido."),
    values: valuesSchema,
    website: z.string().max(200).optional(),
  })
  .strict();

interface RateBucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, RateBucket>();

/** Solo para pruebas: el límite vive en memoria de la instancia. */
export function clearSubmissionRateLimits(): void {
  buckets.clear();
}

function clientIp(req: VercelRequest): string {
  const forwarded = req.headers["x-forwarded-for"];
  const header = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  return header?.split(",")[0]?.trim() || "desconocida";
}

function isRateLimited(key: string): { limited: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + RATE_LIMIT.windowMs });
    return { limited: false, retryAfterSeconds: 0 };
  }

  if (bucket.count >= RATE_LIMIT.max) {
    return { limited: true, retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000) };
  }

  bucket.count += 1;
  return { limited: false, retryAfterSeconds: 0 };
}

function userAgent(req: VercelRequest): string | null {
  const raw = req.headers["user-agent"] as unknown;
  if (typeof raw === "string") return raw.slice(0, USER_AGENT_MAX_LENGTH);
  if (Array.isArray(raw)) {
    const first = (raw as unknown[])[0];
    if (typeof first === "string") return first.slice(0, USER_AGENT_MAX_LENGTH);
  }
  return null;
}

export const config = { maxDuration: 30 };

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.status(405).json({ error: "Método no permitido." });
    return;
  }

  let body: unknown = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body) as unknown;
    } catch {
      res.status(400).json({ error: "El cuerpo no es JSON válido." });
      return;
    }
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    res.status(400).json({
      error: parsed.error.issues[0]?.message ?? "Petición inválida.",
    });
    return;
  }

  // Honeypot: un bot rellena el campo oculto. Se responde como si todo fuera bien
  // y no se escribe nada, para no revelar la trampa.
  if (parsed.data.website?.trim()) {
    res.status(200).json({ ok: true });
    return;
  }

  const rate = isRateLimited(clientIp(req));
  if (rate.limited) {
    res.setHeader("Retry-After", String(rate.retryAfterSeconds));
    res.status(429).json({
      error: `Demasiados envíos. Inténtalo de nuevo en ${Math.ceil(rate.retryAfterSeconds / 60)} minuto(s).`,
    });
    return;
  }

  const url = process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    res.status(500).json({
      error: "El envío de formularios no está configurado en el servidor.",
    });
    return;
  }

  let client;
  try {
    client = createClient<Database>(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  } catch {
    res.status(500).json({
      error: "La configuración de Supabase no es válida en el servidor.",
    });
    return;
  }

  try {
    const { error } = await client.from("page_submissions").insert({
      page_id: parsed.data.pageId,
      data: parsed.data.values as Json,
      user_agent: userAgent(req),
    });

    if (error) {
      // Nunca se registran los datos del formulario.
      console.error("submit-page-form: no se pudo insertar la respuesta", error.code);
      res.status(502).json({ error: "No se pudo guardar la respuesta. Inténtalo de nuevo." });
      return;
    }
  } catch {
    console.error("submit-page-form: fallo de red al insertar la respuesta");
    res.status(502).json({ error: "No se pudo guardar la respuesta. Inténtalo de nuevo." });
    return;
  }

  res.status(200).json({ ok: true });
}
