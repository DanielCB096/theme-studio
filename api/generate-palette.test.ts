import type { VercelRequest, VercelResponse } from "@vercel/node";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import handler from "./generate-palette";

const colors = {
  primary: "#2563eb",
  secondary: "#7c3aed",
  background: "#f8fafc",
  surface: "#ffffff",
  text: "#0f172a",
  muted: "#64748b",
  border: "#e2e8f0",
  success: "#15803d",
  danger: "#dc2626",
};

interface TestResponse extends VercelResponse {
  statusCode: number;
  body: unknown;
  headers: Record<string, string>;
}

function createResponse(): TestResponse {
  const res = {
    statusCode: 0,
    body: undefined as unknown,
    headers: {} as Record<string, string>,
    status(code: number) {
      res.statusCode = code;
      return res;
    },
    json(payload: unknown) {
      res.body = payload;
      return res;
    },
    setHeader(name: string, value: string) {
      res.headers[name.toLowerCase()] = value;
      return res;
    },
  };
  return res as unknown as TestResponse;
}

function createRequest(body: unknown, ip = "10.0.0.1", method = "POST"): VercelRequest {
  return {
    method,
    body,
    headers: { "x-forwarded-for": ip },
  } as unknown as VercelRequest;
}

function geminiResponse(text: string): Response {
  return {
    ok: true,
    status: 200,
    json: () =>
      Promise.resolve({
        candidates: [{ content: { parts: [{ text }] } }],
      }),
  } as unknown as Response;
}

function errorResponse(status: number): Response {
  return {
    ok: false,
    status,
    json: () => Promise.resolve({ error: { message: "upstream" } }),
  } as unknown as Response;
}

const originalKey = process.env.GEMINI_API_KEY;
const originalModel = process.env.GEMINI_MODEL;

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  process.env.GEMINI_API_KEY = "gemini-test-key";
  delete process.env.GEMINI_MODEL;
  vi.stubGlobal("fetch", vi.fn());
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  process.env.GEMINI_API_KEY = originalKey;
  process.env.GEMINI_MODEL = originalModel;
});

describe("POST /api/generate-palette", () => {
  it("rechaza métodos distintos de POST", async () => {
    const res = createResponse();
    await handler(createRequest(undefined, "10.0.0.10", "GET"), res);
    expect(res.statusCode).toBe(405);
  });

  it("valida el prompt con Zod", async () => {
    const res = createResponse();
    await handler(createRequest({ prompt: "x".repeat(201) }, "10.0.0.11"), res);
    expect(res.statusCode).toBe(400);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("rechaza cuerpos con claves desconocidas", async () => {
    const res = createResponse();
    await handler(createRequest({ prompt: "algo", extra: true }, "10.0.0.12"), res);
    expect(res.statusCode).toBe(400);
  });

  it("avisa si falta la clave del servidor", async () => {
    delete process.env.GEMINI_API_KEY;
    const res = createResponse();
    await handler(createRequest({ prompt: "bosque sereno" }, "10.0.0.13"), res);
    expect(res.statusCode).toBe(500);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("llama a Gemini con la clave en cabecera y devuelve los colores", async () => {
    const fetchMock = vi
      .mocked(fetch)
      .mockResolvedValue(geminiResponse(`\`\`\`json\n${JSON.stringify(colors)}\n\`\`\``));

    const res = createResponse();
    await handler(createRequest({ prompt: "bosque sereno" }, "10.0.0.14"), res);

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ colors });

    const [input, init] = fetchMock.mock.calls[0] ?? [];
    const calledUrl =
      typeof input === "string" ? input : input instanceof URL ? input.href : (input?.url ?? "");
    expect(calledUrl).toContain("gemini-flash-latest:generateContent");
    expect(init?.headers).toMatchObject({ "x-goog-api-key": "gemini-test-key" });
    const rawBody = init?.body;
    const payload = JSON.parse(typeof rawBody === "string" ? rawBody : "{}") as {
      contents: Array<{ parts: Array<{ text: string }> }>;
    };
    expect(payload.contents[0]?.parts[0]?.text).toBe("bosque sereno");
  });

  it("usa GEMINI_MODEL si está definido", async () => {
    process.env.GEMINI_MODEL = "gemini-2.5-flash";
    const fetchMock = vi.mocked(fetch).mockResolvedValue(geminiResponse(JSON.stringify(colors)));

    await handler(createRequest({ prompt: "bosque" }, "10.0.0.15"), createResponse());

    const input = fetchMock.mock.calls[0]?.[0];
    const calledUrl =
      typeof input === "string" ? input : input instanceof URL ? input.href : (input?.url ?? "");
    expect(calledUrl).toContain("gemini-2.5-flash:generateContent");
  });

  it("devuelve 502 si el modelo no produce un JSON válido", async () => {
    vi.mocked(fetch).mockResolvedValue(geminiResponse("no hay json"));
    const res = createResponse();
    await handler(createRequest({ prompt: "bosque sereno" }, "10.0.0.16"), res);
    expect(res.statusCode).toBe(502);
  });

  it("devuelve 502 si los colores no pasan la validación", async () => {
    vi.mocked(fetch).mockResolvedValue(
      geminiResponse(JSON.stringify({ ...colors, primary: "azul" })),
    );
    const res = createResponse();
    await handler(createRequest({ prompt: "bosque sereno" }, "10.0.0.17"), res);
    expect(res.statusCode).toBe(502);
  });

  it("devuelve 502 si el proveedor responde con error", async () => {
    vi.mocked(fetch).mockResolvedValue(errorResponse(429));
    const res = createResponse();
    await handler(createRequest({ prompt: "bosque sereno" }, "10.0.0.18"), res);
    expect(res.statusCode).toBe(502);
  });

  it("devuelve 502 si falla la red", async () => {
    vi.mocked(fetch).mockRejectedValue(new TypeError("fetch failed"));
    const res = createResponse();
    await handler(createRequest({ prompt: "bosque sereno" }, "10.0.0.19"), res);
    expect(res.statusCode).toBe(502);
  });

  it("limita las peticiones por IP", async () => {
    vi.mocked(fetch).mockResolvedValue(geminiResponse(JSON.stringify(colors)));

    const statuses: number[] = [];
    for (let index = 0; index < 9; index += 1) {
      const res = createResponse();
      await handler(createRequest({ prompt: `paleta ${index}` }, "10.0.0.99"), res);
      statuses.push(res.statusCode);
    }

    expect(statuses.slice(0, 8)).toEqual(Array(8).fill(200));
    expect(statuses[8]).toBe(429);
  });
});
