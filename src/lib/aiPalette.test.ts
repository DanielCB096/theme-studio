import { afterEach, describe, expect, it, vi } from "vitest";

import { generatePalette } from "@/lib/aiPalette";

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

function mockResponse(body: unknown, status = 200, jsonImpl?: () => Promise<unknown>): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: jsonImpl ?? (() => Promise.resolve(body)),
  } as unknown as Response;
}

afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
});

describe("generatePalette", () => {
  it("envía el prompt y devuelve los colores validados", async () => {
    const fetchMock = vi.fn().mockResolvedValue(mockResponse({ colors }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(generatePalette("atardecer minimalista")).resolves.toEqual({
      colors,
      source: "gemini",
      cached: false,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/generate-palette",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ prompt: "atardecer minimalista" }),
      }),
    );
  });

  it("propaga que la paleta vino del modo local", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(mockResponse({ colors, source: "local" })));

    await expect(generatePalette("prueba")).resolves.toEqual({
      colors,
      source: "local",
      cached: false,
    });
  });

  it("reutiliza la caché local para el mismo prompt", async () => {
    const fetchMock = vi.fn().mockResolvedValue(mockResponse({ colors }));
    vi.stubGlobal("fetch", fetchMock);

    const first = await generatePalette("atardecer minimalista");
    const second = await generatePalette("  Atardecer   minimalista ");

    expect(first.cached).toBe(false);
    expect(second.cached).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("propaga el mensaje del servidor (rate limit)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(mockResponse({ error: "Demasiadas peticiones." }, 429)),
    );

    await expect(generatePalette("prueba")).rejects.toThrow("Demasiadas peticiones.");
  });

  it("rechaza una respuesta con colores mal formados", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(mockResponse({ colors: { ...colors, primary: "azul" } })),
    );

    await expect(generatePalette("prueba")).rejects.toThrow(/forma esperada/i);
  });

  it("rechaza un JSON de respuesta ilegible", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          mockResponse(null, 200, () => Promise.reject(new SyntaxError("Unexpected token"))),
        ),
    );

    await expect(generatePalette("prueba")).rejects.toThrow(/forma esperada/i);
  });

  it("explica que el endpoint no existe en el servidor de desarrollo", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(mockResponse(null, 404)));

    await expect(generatePalette("prueba")).rejects.toThrow(/vercel dev/i);
  });

  it("traduce un fallo de red", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));

    await expect(generatePalette("prueba")).rejects.toThrow(/no se pudo conectar/i);
  });

  it("traduce un timeout", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new DOMException("Aborted", "AbortError")));

    await expect(generatePalette("prueba")).rejects.toThrow(/tardó demasiado/i);
  });
});
