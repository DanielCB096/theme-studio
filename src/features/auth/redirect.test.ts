import { describe, expect, it } from "vitest";

import { safeRedirect } from "@/features/auth/redirect";

describe("safeRedirect", () => {
  it("acepta rutas internas", () => {
    expect(safeRedirect("/")).toBe("/");
    expect(safeRedirect("/temas")).toBe("/temas");
    expect(safeRedirect("/t/abc?x=1")).toBe("/t/abc?x=1");
  });

  it("cae al destino por defecto con valores ausentes o externos", () => {
    expect(safeRedirect(null)).toBe("/temas");
    expect(safeRedirect("")).toBe("/temas");
    expect(safeRedirect("https://evil.example")).toBe("/temas");
    expect(safeRedirect("//evil.example")).toBe("/temas");
    expect(safeRedirect("/\\evil.example")).toBe("/temas");
  });
});
