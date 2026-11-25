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
      .string({
        required_error: "El prompt es obligatorio.",
        invalid_type_error: "El prompt debe ser texto.",
      })
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
/** Si el primero está saturado, se prueban estos en orden. */
const FALLBACK_MODELS = ["gemini-3.1-flash-lite-preview", "gemini-flash-lite-latest"];
const GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";
const ATTEMPT_TIMEOUT_MS = 10_000;
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

const PALETTE_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const PALETTE_CACHE_MAX = 50;
type PaletteColors = z.infer<typeof colorsSchema>;
const paletteCache = new Map<string, { colors: PaletteColors; expiresAt: number }>();

function normalizePrompt(prompt: string): string {
  return prompt.trim().toLowerCase().replace(/\s+/g, " ");
}

function readCachedPalette(prompt: string): PaletteColors | null {
  const key = normalizePrompt(prompt);
  const entry = paletteCache.get(key);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    paletteCache.delete(key);
    return null;
  }
  return entry.colors;
}

function writeCachedPalette(prompt: string, colors: PaletteColors): void {
  const key = normalizePrompt(prompt);
  if (paletteCache.size >= PALETTE_CACHE_MAX) {
    const oldest = paletteCache.keys().next().value;
    if (oldest !== undefined) paletteCache.delete(oldest);
  }
  paletteCache.set(key, { colors, expiresAt: Date.now() + PALETTE_CACHE_TTL_MS });
}

/** Solo para pruebas: la caché vive en memoria de la instancia. */
export function clearPaletteCache(): void {
  paletteCache.clear();
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

function extractJson(text: string): unknown {
  const cleaned = text.replace(/```(?:json)?/gi, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end <= start) {
    throw new Error("La respuesta no contiene un objeto JSON.");
  }
  return JSON.parse(cleaned.slice(start, end + 1)) as unknown;
}

function hslToHex(hue: number, saturation: number, lightness: number): string {
  const s = saturation / 100;
  const l = lightness / 100;
  const normalized = (((hue % 360) + 360) % 360) / 360;

  const channel = (n: number) => {
    const k = (n + normalized * 12) % 12;
    const a = s * Math.min(l, 1 - l);
    const value = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(value * 255)
      .toString(16)
      .padStart(2, "0");
  };

  return `#${channel(0)}${channel(8)}${channel(4)}`;
}

/**
 * Última red: paleta determinista a partir del prompt, sin IA. Se etiqueta como
 * `source: "local"` para que la interfaz no la presente como generación real.
 */
function localPalette(prompt: string) {
  let hash = 0;
  for (const character of prompt.toLowerCase()) {
    hash = (hash * 31 + character.charCodeAt(0)) % 360;
  }

  const hue = hash;
  const dark = /(oscuro|noche|dark|midnight|negro)/i.test(prompt);

  return {
    primary: hslToHex(hue, 65, dark ? 62 : 42),
    secondary: hslToHex(hue + 42, 55, dark ? 66 : 40),
    background: hslToHex(hue, dark ? 18 : 25, dark ? 8 : 97),
    surface: hslToHex(hue, dark ? 20 : 10, dark ? 13 : 100),
    text: hslToHex(hue, 12, dark ? 94 : 12),
    muted: hslToHex(hue, 10, dark ? 66 : 42),
    border: hslToHex(hue, 16, dark ? 24 : 90),
    success: hslToHex(145, 55, dark ? 55 : 32),
    danger: hslToHex(5, 65, dark ? 62 : 45),
  };
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

  const cached = readCachedPalette(parsed.data.prompt);
  if (cached) {
    res.status(200).json({ colors: cached, source: "gemini", cached: true });
    return;
  }

  if (!apiKey) {
    res.status(500).json({
      error: "La IA no está configurada en el servidor (falta GEMINI_API_KEY).",
    });
    return;
  }

  const models = [model, ...FALLBACK_MODELS.filter((candidate) => candidate !== model)];
  const requestBody = JSON.stringify({
    systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents: [{ role: "user", parts: [{ text: parsed.data.prompt }] }],
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: 2000,
      responseMimeType: "application/json",
      responseSchema: RESPONSE_SCHEMA,
    },
  });

  for (const candidate of models) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), ATTEMPT_TIMEOUT_MS);

    try {
      const response = await fetch(
        `${GEMINI_ENDPOINT}/${encodeURIComponent(candidate)}:generateContent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": apiKey,
          },
          body: requestBody,
          signal: controller.signal,
        },
      );

      if (!response.ok) {
        console.error("generate-palette: modelo", candidate, "respondió", response.status);
        if (response.status === 401 || response.status === 403) {
          res.status(500).json({
            error: "La clave de IA no es válida o no tiene permisos para este modelo.",
          });
          return;
        }
        continue;
      }

      const payload: unknown = await response.json();
      const gemini = geminiResponseSchema.parse(payload);
      const text = gemini.candidates[0]?.content.parts.map((part) => part.text ?? "").join("\n");

      if (!text) {
        throw new Error("La respuesta del modelo está vacía.");
      }

      const colors = colorsSchema.parse(extractJson(text));
      writeCachedPalette(parsed.data.prompt, colors);
      res.status(200).json({ colors, source: "gemini", cached: false });
      return;
    } catch (error) {
      console.error(
        "generate-palette: fallo con",
        candidate,
        error instanceof Error ? error.message : "error desconocido",
      );
    } finally {
      clearTimeout(timeout);
    }
  }

  // Ningún modelo respondió: paleta local determinista, claramente etiquetada.
  res
    .status(200)
    .json({ colors: localPalette(parsed.data.prompt), source: "local", cached: false });
}
