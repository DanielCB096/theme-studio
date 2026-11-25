import { describe, expect, it } from "vitest";

import { isUuid, shareUrl, summaryFromRow, themeFromRow } from "@/features/themes/themeRepository";
import { DEFAULT_THEME } from "@/lib/defaultThemes";

const row = {
  id: "2f1c1e5a-9d3b-4a7c-8e2f-1b6a4c9d0e21",
  name: "Tema guardado",
  data: { ...DEFAULT_THEME, name: "Nombre viejo" },
};

describe("themeFromRow", () => {
  it("valida los datos y hace mandar el id y el nombre de la fila", () => {
    const theme = themeFromRow(row);
    expect(theme.id).toBe(row.id);
    expect(theme.name).toBe("Tema guardado");
    expect(theme.colors.primary).toBe(DEFAULT_THEME.colors.primary);
  });

  it("lanza si los datos guardados están dañados", () => {
    expect(() =>
      themeFromRow({
        ...row,
        data: { ...DEFAULT_THEME, colors: { ...DEFAULT_THEME.colors, primary: "roto" } },
      }),
    ).toThrow(/no es válido o está dañado/);
  });
});

describe("summaryFromRow", () => {
  it("extrae el modo y la visibilidad", () => {
    expect(
      summaryFromRow({
        ...row,
        is_public: true,
        updated_at: "2026-11-24T10:00:00.000Z",
      }),
    ).toMatchObject({ mode: "light", isPublic: true, isValid: true });
  });

  it("marca como inválido un JSON dañado sin lanzar", () => {
    const summary = summaryFromRow({
      ...row,
      data: { nope: true },
      is_public: false,
      updated_at: "2026-11-24T10:00:00.000Z",
    });
    expect(summary.isValid).toBe(false);
    expect(summary.mode).toBe("light");
  });
});

describe("isUuid", () => {
  it("distingue uuid de identificadores locales", () => {
    expect(isUuid(row.id)).toBe(true);
    expect(isUuid("tema-importado")).toBe(false);
    expect(isUuid("123")).toBe(false);
  });
});

describe("shareUrl", () => {
  it("construye la ruta pública", () => {
    expect(shareUrl(row.id)).toBe(`${window.location.origin}/t/${row.id}`);
  });
});
