import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";

/** Se mantiene en sync con `src/lib/themeSchema.ts` (el alias `@/` no existe en la función). */
const colorsSchema = z
  .object({
    primary: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    secondary: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    background: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    surface: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    text: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    muted: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    border: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    success: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    danger: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  })
  .strict();

const requestSchema = z
  .object({
    prompt: z
      .string()
      .trim()
      .min(3, "Describe la paleta con al menos 3 caracteres.")
      .max(200, "El prompt admite como máximo 200 caracteres."),
  })
  .strict();

const geminiResponseSchema = z.object({
  candidates: z
    .array(
      z.object({
        content: z.object({
          parts: z.array(z.object({ text: z.string().optional() })),
        }),
      }),
    )
    .min(1),
});

const SYSTEM_PROMPT = `Eres un experto en sistemas de diseño y accesibilidad.
Devuelve SOLO un objeto JSON, sin markdown ni explicaciones, con exactamente estas nueve claves y valores hexadecimales de 6 dígitos:
{"primary":"#rrggbb","secondary":"#rrggbb","background":"#rrggbb","surface":"#rrggbb","text":"#rrggbb","muted":"#rrggbb","border":"#rrggbb","success":"#rrggbb","danger":"#rrggbb"}

Requisitos:
- El texto sobre fondo y sobre superficie debe tener contraste AA (>= 4.5:1).
- El primario debe distinguirse del fondo (>= 4.5:1 si se usa como texto).
- Elige claro u oscuro según lo que pida la persona, manteniendo coherencia entre superficie y fondo.
- Nada de comentarios, nombres ni claves adicionales.`;

const DEFAULT_MODEL = "gemini-3.5-flash-lite";
const GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";
const RATE_LIMIT = { max: 8, windowMs: 10 * 60 * 1000 } as const;

/** Fuerza la forma exacta de la respuesta; evita markdown y claves de más. */
const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    primary: { type: "STRING" },
    secondary: { type: "STRING" },
    background: { type: "STRING" },
    surface: { type: "STRING" },
    text: { type: "STRING" },
    muted: { type: "STRING" },
    border: { type: "STRING" },
    success: { type: "STRING" },
    danger: { type: "STRING" },
  },
  required: [
    "primary",
    "secondary",
    "background",
    "surface",
    "text",
    "muted",
    "border",
    "success",
    "danger",
  ],
  propertyOrdering: [
    "primary",
    "secondary",
    "background",
    "surface",
    "text",
    "muted",
    "border",
    "success",
    "danger",
  ],
} as const;
const buckets = new Map<string, { count: number; resetAt: number }>();

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

function extractJson(text: string): unknown {
  const cleaned = text.replace(/```(?:json)?/gi, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end <= start) {
    throw new Error("La respuesta no contiene un objeto JSON.");
  }
  return JSON.parse(cleaned.slice(start, end + 1)) as unknown;
}

function clientIp(req: VercelRequest): string {
  const forwarded = req.headers["x-forwarded-for"];
  const header = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  return header?.split(",")[0]?.trim() || "desconocida";
}

export const config = { maxDuration: 60 };

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

  const rate = isRateLimited(clientIp(req));
  if (rate.limited) {
    res.setHeader("Retry-After", String(rate.retryAfterSeconds));
    res.status(429).json({
      error: `Demasiadas peticiones. Inténtalo de nuevo en ${Math.ceil(rate.retryAfterSeconds / 60)} minuto(s).`,
    });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;
  if (!apiKey) {
    res.status(500).json({
      error: "La IA no está configurada en el servidor (falta GEMINI_API_KEY).",
    });
    return;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45_000);

  try {
    const response = await fetch(
      `${GEMINI_ENDPOINT}/${encodeURIComponent(model)}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [{ role: "user", parts: [{ text: parsed.data.prompt }] }],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 2000,
            responseMimeType: "application/json",
            responseSchema: RESPONSE_SCHEMA,
          },
        }),
        signal: controller.signal,
      },
    );

    if (!response.ok) {
      console.error("generate-palette: proveedor respondió", response.status);
      res.status(502).json({
        error: "El proveedor de IA rechazó la petición. Inténtalo de nuevo en unos segundos.",
      });
      return;
    }

    const payload: unknown = await response.json();
    const gemini = geminiResponseSchema.parse(payload);
    const text = gemini.candidates[0]?.content.parts.map((part) => part.text ?? "").join("\n");

    if (!text) {
      throw new Error("La respuesta del modelo está vacía.");
    }

    const colors = colorsSchema.parse(extractJson(text));
    res.status(200).json({ colors });
  } catch (error) {
    console.error(
      "generate-palette:",
      error instanceof Error ? error.message : "error desconocido",
    );
    res.status(502).json({
      error: "No se pudo generar la paleta. Inténtalo de nuevo en unos segundos.",
    });
  } finally {
    clearTimeout(timeout);
  }
}
