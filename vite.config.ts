/// <reference types="vitest/config" />
import { existsSync } from "node:fs";
import type { IncomingMessage, ServerResponse } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

import type { VercelRequest, VercelResponse } from "@vercel/node";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv, type Plugin } from "vite";

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const API_BODY_LIMIT_BYTES = 100_000;

type ApiHandler = (req: VercelRequest, res: VercelResponse) => Promise<void> | void;

class BodyTooLargeError extends Error {
  constructor() {
    super("El cuerpo de la petición es demasiado grande.");
    this.name = "BodyTooLargeError";
  }
}

function sendJson(res: ServerResponse, status: number, payload: unknown): void {
  if (res.writableEnded) return;
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

function readBody(req: IncomingMessage, limit: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    let failed = false;

    req.on("data", (chunk: Buffer | string) => {
      if (failed) return;
      const buffer = typeof chunk === "string" ? Buffer.from(chunk) : chunk;
      size += buffer.length;
      if (size > limit) {
        failed = true;
        reject(new BodyTooLargeError());
        return;
      }
      chunks.push(buffer);
    });

    req.on("end", () => {
      if (!failed) resolve(Buffer.concat(chunks).toString("utf8"));
    });

    req.on("error", (error) => {
      if (failed) return;
      failed = true;
      reject(error);
    });
  });
}

async function readRequestBody(req: IncomingMessage): Promise<unknown> {
  if (req.method === "GET" || req.method === "HEAD") return undefined;
  const raw = await readBody(req, API_BODY_LIMIT_BYTES);
  if (!raw.trim()) return undefined;
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    // El handler devuelve 400 con un mensaje claro al recibir texto no JSON.
    return raw;
  }
}

interface ResponseAdapter {
  statusCode: number;
  status(code: number): ResponseAdapter;
  json(payload: unknown): ResponseAdapter;
  send(payload: unknown): ResponseAdapter;
  setHeader(name: string, value: string | number | readonly string[]): ResponseAdapter;
  getHeader(name: string): number | string | string[] | undefined;
  end(chunk?: unknown): ResponseAdapter;
}

function createResponseAdapter(res: ServerResponse): VercelResponse {
  const adapter: ResponseAdapter = {
    get statusCode() {
      return res.statusCode;
    },
    set statusCode(value: number) {
      res.statusCode = value;
    },
    status(code) {
      res.statusCode = code;
      return adapter;
    },
    json(payload) {
      if (!res.writableEnded) {
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        res.end(JSON.stringify(payload));
      }
      return adapter;
    },
    send(payload) {
      if (!res.writableEnded) {
        if (typeof payload === "string" || Buffer.isBuffer(payload)) res.end(payload);
        else res.end(JSON.stringify(payload));
      }
      return adapter;
    },
    setHeader(name, value) {
      res.setHeader(name, value);
      return adapter;
    },
    getHeader(name) {
      return res.getHeader(name);
    },
    end(chunk) {
      if (!res.writableEnded) {
        if (typeof chunk === "string" || Buffer.isBuffer(chunk)) res.end(chunk);
        else res.end();
      }
      return adapter;
    },
  };

  return adapter as unknown as VercelResponse;
}

function createRequestAdapter(req: IncomingMessage, body: unknown, url: URL): VercelRequest {
  const query: Record<string, string | string[]> = {};
  for (const [key, value] of url.searchParams) {
    const current = query[key];
    if (current === undefined) query[key] = value;
    else if (Array.isArray(current)) current.push(value);
    else query[key] = [current, value];
  }

  const headers: Record<string, string | string[] | undefined> = { ...req.headers };
  if (headers["x-forwarded-for"] === undefined) {
    headers["x-forwarded-for"] = req.socket.remoteAddress ?? "127.0.0.1";
  }

  return {
    method: req.method ?? "GET",
    url: req.url,
    headers,
    body,
    query,
    cookies: {},
  } as unknown as VercelRequest;
}

/**
 * Sirve `api/*.ts` en `npm run dev` con la misma firma que Vercel. Solo existe
 * en el servidor de desarrollo: producción sigue usando Vercel Functions.
 */
function apiDevServerPlugin(env: Record<string, string>): Plugin {
  return {
    name: "theme-studio-api-dev-server",
    apply: "serve",
    configureServer(server) {
      // Vite no vuelca `.env` en `process.env`; las funciones leen de ahí.
      for (const [key, value] of Object.entries(env)) {
        if (process.env[key] === undefined) process.env[key] = value;
      }

      server.middlewares.use((req, res, next) => {
        const url = new URL(req.url ?? "/", "http://localhost");
        if (!url.pathname.startsWith("/api/")) {
          next();
          return;
        }

        const name = url.pathname.slice("/api/".length);
        if (!/^[a-z0-9-]+$/i.test(name)) {
          next();
          return;
        }

        const file = path.resolve(rootDir, "api", `${name}.ts`);
        if (!existsSync(file)) {
          sendJson(res, 404, { error: "Endpoint no encontrado." });
          return;
        }

        void (async () => {
          try {
            const body = await readRequestBody(req);
            const loaded = (await server.ssrLoadModule(`/api/${name}.ts`)) as Record<
              string,
              unknown
            >;
            const handler = loaded.default;
            if (typeof handler !== "function") {
              sendJson(res, 500, { error: "El endpoint no exporta un handler." });
              return;
            }
            await (handler as ApiHandler)(
              createRequestAdapter(req, body, url),
              createResponseAdapter(res),
            );
          } catch (error) {
            if (error instanceof BodyTooLargeError) {
              sendJson(res, 413, { error: "La petición es demasiado grande." });
              return;
            }
            console.error(
              "api-dev-server: fallo en",
              url.pathname,
              error instanceof Error ? error.message : "error desconocido",
            );
            if (!res.headersSent) sendJson(res, 500, { error: "Error interno del servidor." });
            else if (!res.writableEnded) res.end();
          }
        })();
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, rootDir, "");

  return {
    plugins: [react(), apiDevServerPlugin(env)],
    resolve: {
      alias: {
        "@": path.resolve(rootDir, "src"),
      },
    },
    build: {
      rollupOptions: {
        output: {
          // Separa los vendors grandes para que el editor cargue antes y mejor caché.
          manualChunks: {
            "vendor-react": ["react", "react-dom", "react-router-dom"],
            "vendor-supabase": ["@supabase/supabase-js"],
          },
        },
      },
    },
    test: {
      globals: true,
      environment: "jsdom",
      setupFiles: ["./src/test/setup.ts"],
      css: false,
      // La suite renderiza la app completa muchas veces; con cobertura el entorno
      // es más lento y 5 s provoca fallos intermitentes.
      testTimeout: 20_000,
      hookTimeout: 20_000,
      // Las pruebas no deben depender del `.env` real ni tocar Supabase.
      env: {
        VITE_SUPABASE_URL: "",
        VITE_SUPABASE_ANON_KEY: "",
      },
      include: ["src/**/*.{test,spec}.{ts,tsx}", "api/**/*.test.ts"],
      coverage: {
        provider: "v8",
        reporter: ["text", "lcov"],
        include: ["src/lib/**", "src/store/**"],
        thresholds: {
          lines: 70,
          functions: 70,
          branches: 70,
          statements: 70,
        },
      },
    },
  };
});
