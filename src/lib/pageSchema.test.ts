import { describe, expect, it } from "vitest";

import { DEFAULT_THEME } from "@/lib/defaultThemes";
import { parsePageDocument } from "@/lib/pageSchema";
import { createLandingDocument } from "@/features/page-builder/templates/landing";
import type { PageDocument } from "@/types/page";

function landing(): PageDocument {
  return createLandingDocument(DEFAULT_THEME, "Landing de prueba");
}

describe("pageDocumentSchema", () => {
  it("acepta la plantilla de landing", () => {
    const result = parsePageDocument(landing());
    expect(result.ok).toBe(true);
  });

  it("rechaza un tipo de bloque desconocido", () => {
    const result = parsePageDocument({
      version: 1,
      name: "x",
      theme: DEFAULT_THEME,
      rootIds: ["a"],
      blocks: { a: { id: "a", type: "video", childIds: [], props: {} } },
    });
    expect(result.ok).toBe(false);
  });

  it("rechaza URLs peligrosas", () => {
    const page = landing();
    const first = page.blocks[page.rootIds[0] ?? ""];
    if (first?.type !== "navbar") throw new Error("La plantilla debe empezar por navbar");
    first.props.ctaHref = "javascript:alert(1)";

    const result = parsePageDocument(page);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.join(" ")).toMatch(/URL no permitida/i);
  });

  it("rechaza ids repetidos en rootIds", () => {
    const page = landing();
    page.rootIds.push(page.rootIds[0] ?? "");
    expect(parsePageDocument(page).ok).toBe(false);
  });

  it("rechaza bloques huérfanos", () => {
    const page = landing();
    const first = page.blocks[page.rootIds[1] ?? ""];
    if (!first) throw new Error("Falta el segundo bloque");
    page.blocks.orphan = { ...first, id: "orphan" };
    const result = parsePageDocument(page);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.join(" ")).toMatch(/huérfano/);
  });

  it("rechaza que la clave no coincida con el id", () => {
    const page = landing();
    const id = page.rootIds[1] ?? "";
    const block = page.blocks[id];
    if (!block) throw new Error("Falta el bloque");
    block.id = "otro-id";
    expect(parsePageDocument(page).ok).toBe(false);
  });

  it("rechaza anidación en el Hito 1", () => {
    const page = landing();
    const block = page.blocks[page.rootIds[1] ?? ""];
    if (!block) throw new Error("Falta el bloque");
    block.childIds = ["hijo"];
    const result = parsePageDocument(page);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.join(" ")).toMatch(/anidación/i);
  });

  it("rechaza un tema inválido dentro de la página", () => {
    const page = landing();
    const raw = structuredClone(page) as unknown as Record<string, unknown>;
    raw.theme = { mode: "light" };
    expect(parsePageDocument(raw).ok).toBe(false);
  });
});
