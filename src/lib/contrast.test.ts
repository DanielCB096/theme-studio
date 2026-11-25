import { describe, expect, it } from "vitest";

import { hexToRgb, rgbToHsl } from "@/lib/color";
import { adjustForContrast, contrastRatio, evaluateContrast } from "@/lib/contrast";

describe("contrastRatio", () => {
  it("da 21:1 entre negro y blanco", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 5);
    expect(contrastRatio("#ffffff", "#000000")).toBeCloseTo(21, 5);
  });

  it("coincide con el valor de referencia #767676 sobre blanco", () => {
    expect(contrastRatio("#767676", "#ffffff")).toBeCloseTo(4.54, 1);
  });

  it("es simétrica", () => {
    expect(contrastRatio("#2563eb", "#f8fafc")).toBeCloseTo(
      contrastRatio("#f8fafc", "#2563eb"),
      10,
    );
  });
});

describe("evaluateContrast", () => {
  it("clasifica AAA, AA, solo texto grande y fallo", () => {
    expect(evaluateContrast("#000000", "#ffffff").level).toBe("AAA");
    expect(evaluateContrast("#767676", "#ffffff").level).toBe("AA");
    expect(evaluateContrast("#8c8c8c", "#ffffff").level).toBe("AA-large");
    expect(evaluateContrast("#bbbbbb", "#ffffff").level).toBe("fail");
  });

  it("expone los cuatro umbrales", () => {
    const result = evaluateContrast("#000000", "#ffffff");
    expect(result.aa).toBe(true);
    expect(result.aaa).toBe(true);
    expect(result.aaLarge).toBe(true);
    expect(result.aaaLarge).toBe(true);
  });
});

describe("adjustForContrast", () => {
  it("oscurece un color claro hasta cumplir AA conservando el tono", () => {
    const adjusted = adjustForContrast("#60a5fa", "#ffffff", 4.5);
    expect(contrastRatio(adjusted, "#ffffff")).toBeGreaterThanOrEqual(4.5);

    const before = rgbToHsl(hexToRgb("#60a5fa")).h;
    const after = rgbToHsl(hexToRgb(adjusted)).h;
    expect(Math.abs(before - after)).toBeLessThan(3);
  });

  it("no toca un color que ya cumple", () => {
    expect(adjustForContrast("#0f172a", "#ffffff", 4.5)).toBe("#0f172a");
  });

  it("devuelve el extremo con más contraste cuando el objetivo es imposible", () => {
    const adjusted = adjustForContrast("#777777", "#808080", 7);
    const ratio = contrastRatio(adjusted, "#808080");
    expect(ratio).toBeLessThan(7);
    expect(adjusted === "#ffffff" || adjusted === "#0b1220").toBe(true);
  });
});
