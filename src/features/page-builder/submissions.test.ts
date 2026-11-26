import { afterEach, describe, expect, it, vi } from "vitest";

import { submitPageForm } from "@/features/page-builder/submissions";

function jsonResponse(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  } as unknown as Response;
}

const PAGE_ID = "123e4567-e89b-42d3-a456-426614174000";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("submitPageForm", () => {
  it("envía los valores con el honeypot vacío y acepta {ok:true}", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, { ok: true }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      submitPageForm(PAGE_ID, { Nombre: "Ana", Mensaje: "Hola" }),
    ).resolves.toBeUndefined();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/submit-page-form");
    expect(init.method).toBe("POST");
    expect(init.headers).toEqual({ "Content-Type": "application/json" });
    const rawBody: unknown = init.body;
    if (typeof rawBody !== "string") throw new Error("El cuerpo enviado debe ser JSON de texto.");
    const payload: unknown = JSON.parse(rawBody);
    expect(payload).toEqual({
      pageId: PAGE_ID,
      values: { Nombre: "Ana", Mensaje: "Hola" },
      website: "",
    });
  });

  it("explica el límite cuando el endpoint responde 429", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(429, { error: "límite" })));

    await expect(submitPageForm(PAGE_ID, { Nombre: "Ana" })).rejects.toThrow(/demasiados envíos/i);
  });

  it("rechaza una respuesta con una forma inesperada", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(200, { ok: "sí" })));

    await expect(submitPageForm(PAGE_ID, { Nombre: "Ana" })).rejects.toThrow(/inesperada/i);
  });

  it("traduce un fallo de red a un mensaje claro", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("fetch failed")));

    await expect(submitPageForm(PAGE_ID, { Nombre: "Ana" })).rejects.toThrow(/conectar/i);
  });

  it("avisa cuando el endpoint no existe en el entorno local", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(404, {})));

    await expect(submitPageForm(PAGE_ID, { Nombre: "Ana" })).rejects.toThrow(/no está disponible/i);
  });
});
