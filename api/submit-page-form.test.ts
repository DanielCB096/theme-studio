import type { VercelRequest, VercelResponse } from "@vercel/node";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { insertMock, fromMock, createClientMock } = vi.hoisted(() => {
  const insert = vi.fn();
  const from = vi.fn(() => ({ insert }));
  const create = vi.fn((_url: string, _key: string, _options?: unknown) => ({ from }));
  return { insertMock: insert, fromMock: from, createClientMock: create };
});

vi.mock("@supabase/supabase-js", () => ({ createClient: createClientMock }));

import handler, { clearSubmissionRateLimits } from "./submit-page-form";

const PAGE_ID = "123e4567-e89b-42d3-a456-426614174000";

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

function createRequest(
  body: unknown,
  ip = "10.0.0.1",
  method = "POST",
  userAgentValue = "vitest-agent",
): VercelRequest {
  return {
    method,
    body,
    headers: {
      "x-forwarded-for": ip,
      "user-agent": userAgentValue,
    },
  } as unknown as VercelRequest;
}

const originalUrl = process.env.VITE_SUPABASE_URL;
const originalKey = process.env.VITE_SUPABASE_ANON_KEY;

beforeEach(() => {
  clearSubmissionRateLimits();
  insertMock.mockReset();
  insertMock.mockResolvedValue({ error: null });
  createClientMock.mockClear();
  fromMock.mockClear();
  vi.spyOn(console, "error").mockImplementation(() => {});
  process.env.VITE_SUPABASE_URL = "https://example.supabase.co";
  process.env.VITE_SUPABASE_ANON_KEY = "anon-test-key";
});

afterEach(() => {
  vi.restoreAllMocks();
  clearSubmissionRateLimits();
  if (originalUrl === undefined) delete process.env.VITE_SUPABASE_URL;
  else process.env.VITE_SUPABASE_URL = originalUrl;
  if (originalKey === undefined) delete process.env.VITE_SUPABASE_ANON_KEY;
  else process.env.VITE_SUPABASE_ANON_KEY = originalKey;
});

describe("POST /api/submit-page-form", () => {
  it("inserta una respuesta válida con la clave anónima", async () => {
    const res = createResponse();
    await handler(
      createRequest({
        pageId: PAGE_ID,
        values: { Nombre: "Ana", Mensaje: "Hola, mundo" },
      }),
      res,
    );

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ ok: true });
    expect(createClientMock).toHaveBeenCalledWith(
      "https://example.supabase.co",
      "anon-test-key",
      expect.any(Object),
    );
    expect(fromMock).toHaveBeenCalledWith("page_submissions");
    expect(insertMock).toHaveBeenCalledWith({
      page_id: PAGE_ID,
      data: { Nombre: "Ana", Mensaje: "Hola, mundo" },
      user_agent: "vitest-agent",
    });
  });

  it("trunca el user-agent a 300 caracteres", async () => {
    const res = createResponse();
    await handler(
      createRequest(
        { pageId: PAGE_ID, values: { Nombre: "Ana" } },
        "10.0.0.2",
        "POST",
        "x".repeat(500),
      ),
      res,
    );

    expect(res.statusCode).toBe(200);
    const inserted = insertMock.mock.calls[0]?.[0] as { user_agent: string };
    expect(inserted.user_agent).toHaveLength(300);
  });

  it("descarta el envío cuando el honeypot viene relleno", async () => {
    const res = createResponse();
    await handler(
      createRequest({
        pageId: PAGE_ID,
        values: { Nombre: "Bot" },
        website: "https://spam.example",
      }),
      res,
    );

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ ok: true });
    expect(insertMock).not.toHaveBeenCalled();
  });

  it("rechaza un pageId que no es uuid", async () => {
    const res = createResponse();
    await handler(createRequest({ pageId: "../otra-pagina", values: { Nombre: "Ana" } }), res);

    expect(res.statusCode).toBe(400);
    expect(insertMock).not.toHaveBeenCalled();
  });

  it("rechaza demasiados campos y valores fuera de límite", async () => {
    const res = createResponse();
    const manyValues = Object.fromEntries(
      Array.from({ length: 13 }, (_, index) => [`campo-${index}`, "valor"]),
    );
    await handler(createRequest({ pageId: PAGE_ID, values: manyValues }), res);
    expect(res.statusCode).toBe(400);

    const longValue = createResponse();
    await handler(
      createRequest({ pageId: PAGE_ID, values: { Mensaje: "x".repeat(2001) } }),
      longValue,
    );
    expect(longValue.statusCode).toBe(400);
    expect(insertMock).not.toHaveBeenCalled();
  });

  it("rechaza claves desconocidas en la petición", async () => {
    const res = createResponse();
    await handler(
      createRequest({
        pageId: PAGE_ID,
        values: { Nombre: "Ana" },
        extra: true,
      }),
      res,
    );

    expect(res.statusCode).toBe(400);
  });

  it("limita a 5 envíos por IP cada 10 minutos", async () => {
    const statuses: number[] = [];
    for (let index = 0; index < 6; index += 1) {
      const res = createResponse();
      await handler(
        createRequest({ pageId: PAGE_ID, values: { Nombre: `Persona ${index}` } }, "10.0.0.99"),
        res,
      );
      statuses.push(res.statusCode);
      if (res.statusCode === 429) {
        expect(res.headers["retry-after"]).toBeDefined();
      }
    }

    expect(statuses).toEqual([200, 200, 200, 200, 200, 429]);
  });

  it("responde 405 a métodos distintos de POST", async () => {
    const res = createResponse();
    await handler(createRequest(undefined, "10.0.0.3", "GET"), res);
    expect(res.statusCode).toBe(405);
  });

  it("avisa si falta la configuración de Supabase", async () => {
    delete process.env.VITE_SUPABASE_URL;
    delete process.env.VITE_SUPABASE_ANON_KEY;

    const res = createResponse();
    await handler(createRequest({ pageId: PAGE_ID, values: { Nombre: "Ana" } }, "10.0.0.4"), res);

    expect(res.statusCode).toBe(500);
    expect((res.body as { error: string }).error).toMatch(/no está configurado/i);
    expect(createClientMock).not.toHaveBeenCalled();
  });

  it("responde 502 si Supabase rechaza la inserción", async () => {
    insertMock.mockResolvedValue({ error: { code: "42501" } });

    const res = createResponse();
    await handler(createRequest({ pageId: PAGE_ID, values: { Nombre: "Ana" } }, "10.0.0.5"), res);

    expect(res.statusCode).toBe(502);
    expect(res.body).toEqual({ error: "No se pudo guardar la respuesta. Inténtalo de nuevo." });
    expect(console.error).toHaveBeenCalledWith(
      "submit-page-form: no se pudo insertar la respuesta",
      "42501",
    );
  });

  it("responde 502 si la inserción lanza un error de red", async () => {
    insertMock.mockRejectedValue(new TypeError("fetch failed"));

    const res = createResponse();
    await handler(createRequest({ pageId: PAGE_ID, values: { Nombre: "Ana" } }, "10.0.0.7"), res);

    expect(res.statusCode).toBe(502);
    expect(res.body).toEqual({ error: "No se pudo guardar la respuesta. Inténtalo de nuevo." });
    expect(console.error).toHaveBeenCalledWith(
      "submit-page-form: fallo de red al insertar la respuesta",
    );
  });

  it("responde 400 si el cuerpo no es JSON válido", async () => {
    const res = createResponse();
    await handler(createRequest("{no-json", "10.0.0.6"), res);
    expect(res.statusCode).toBe(400);
  });
});
