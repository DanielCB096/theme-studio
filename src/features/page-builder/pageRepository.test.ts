import { describe, expect, it } from "vitest";

import {
  pageFromRow,
  slugifyPageName,
  summaryFromRow,
} from "@/features/page-builder/pageRepository";
import { DEFAULT_THEME } from "@/lib/defaultThemes";
import { createLandingDocument } from "@/features/page-builder/templates/landing";

const page = createLandingDocument(DEFAULT_THEME, "Landing guardada");
const row = {
  id: "p-1",
  name: "Landing guardada",
  slug: "landing-guardada",
  data: page,
  is_public: true,
  updated_at: "2026-11-25T10:00:00.000Z",
};

describe("pageRepository helpers", () => {
  it("genera slugs seguros", () => {
    expect(slugifyPageName("Mi Landing Ñandú 2026")).toBe("mi-landing-nandu-2026");
    expect(slugifyPageName("  ***  ")).toBe("pagina");
  });

  it("valida la fila y hace mandar el nombre de la base de datos", () => {
    const parsed = pageFromRow({ ...row, name: "Nombre real" });
    expect(parsed.name).toBe("Nombre real");
    expect(parsed.rootIds.length).toBeGreaterThan(0);
  });

  it("lanza si los datos están dañados", () => {
    expect(() => pageFromRow({ ...row, data: { version: 1 } })).toThrow(/dañada/);
  });

  it("resume visibilidad y validez", () => {
    expect(summaryFromRow(row)).toMatchObject({
      id: "p-1",
      slug: "landing-guardada",
      isPublic: true,
      isValid: true,
    });
    expect(summaryFromRow({ ...row, data: {} }).isValid).toBe(false);
  });
});
