import { describe, expect, it } from "vitest";

import { normalizeHex, pickReadableText, relativeLuminance } from "@/lib/color";

describe("color", () => {
  it("calcula la luminancia de blanco y negro", () => {
    expect(relativeLuminance("#ffffff")).toBeCloseTo(1, 5);
    expect(relativeLuminance("#000000")).toBeCloseTo(0, 5);
  });

  it("rechaza hex inválidos", () => {
    expect(normalizeHex("#12")).toBeNull();
    expect(normalizeHex("azul")).toBeNull();
    expect(normalizeHex("#2563EB")).toBe("#2563eb");
  });

  it("elige texto blanco sobre fondo oscuro y oscuro sobre fondo claro", () => {
    expect(pickReadableText("#1d4ed8")).toBe("#ffffff");
    expect(pickReadableText("#facc15")).toBe("#0b1220");
  });
});
