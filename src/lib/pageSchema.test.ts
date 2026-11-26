import { describe, expect, it } from "vitest";

import { DEFAULT_THEME } from "@/lib/defaultThemes";
import { parsePageDocument } from "@/lib/pageSchema";
import { createLandingDocument } from "@/features/page-builder/templates/landing";
import { DEFAULT_BLOCK_LAYOUT, type PageDocument } from "@/types/page";

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

  it("aplica placement top por defecto en páginas antiguas", () => {
    const page = landing();
    const navbar = page.blocks[page.rootIds[0] ?? ""];
    if (navbar?.type !== "navbar") throw new Error("Falta la navbar");
    delete (navbar.props as { placement?: string }).placement;

    const result = parsePageDocument(page);
    expect(result.ok).toBe(true);
    if (result.ok) {
      const parsedNavbar = result.page.blocks[result.page.rootIds[0] ?? ""];
      expect(parsedNavbar?.type === "navbar" ? parsedNavbar.props.placement : null).toBe("top");
    }
  });

  it("aplica el layout por defecto en páginas antiguas sin layout", () => {
    const page = landing();
    for (const block of Object.values(page.blocks)) {
      delete (block as unknown as { layout?: unknown }).layout;
    }

    const result = parsePageDocument(page);
    expect(result.ok).toBe(true);
    if (result.ok) {
      const parsedHero = result.page.blocks[result.page.rootIds[1] ?? ""];
      expect(parsedHero?.layout).toEqual(DEFAULT_BLOCK_LAYOUT);
    }
  });

  it("rechaza un layout con valores inválidos", () => {
    const page = landing();
    const hero = page.blocks[page.rootIds[1] ?? ""];
    if (!hero) throw new Error("Falta el hero");
    (hero as unknown as { layout: { width: string } }).layout.width = "gigante";

    expect(parsePageDocument(page).ok).toBe(false);
  });

  it("aplica defaults de logo en naves antiguas", () => {
    const page = landing();
    const navbar = page.blocks[page.rootIds[0] ?? ""];
    if (navbar?.type !== "navbar") throw new Error("Falta la navbar");
    const legacyProps = navbar.props as {
      logoUrl?: string;
      logoAlt?: string;
      showBrandText?: boolean;
    };
    delete legacyProps.logoUrl;
    delete legacyProps.logoAlt;
    delete legacyProps.showBrandText;

    const result = parsePageDocument(page);
    expect(result.ok).toBe(true);
    if (result.ok) {
      const parsedNavbar = result.page.blocks[result.page.rootIds[0] ?? ""];
      expect(parsedNavbar?.type === "navbar" ? parsedNavbar.props : null).toMatchObject({
        logoUrl: "",
        logoAlt: "",
        showBrandText: true,
      });
    }
  });

  it("rechaza un logo con protocolo peligroso", () => {
    const page = landing();
    const navbar = page.blocks[page.rootIds[0] ?? ""];
    if (navbar?.type !== "navbar") throw new Error("Falta la navbar");
    navbar.props.logoUrl = "javascript:alert(1)";

    const result = parsePageDocument(page);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.join(" ")).toMatch(/URL no permitida/i);
  });

  it("rechaza más de una navbar", () => {
    const page = landing();
    const navbar = page.blocks[page.rootIds[0] ?? ""];
    if (!navbar) throw new Error("Falta la navbar");
    page.blocks["navbar-2"] = { ...navbar, id: "navbar-2" };
    page.rootIds.push("navbar-2");
    const result = parsePageDocument(page);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.join(" ")).toMatch(/una navbar/i);
  });

  it("aplica defaults por bloque a páginas antiguas", () => {
    const page = landing();
    for (const block of Object.values(page.blocks)) {
      delete (block as { layout?: unknown }).layout;
    }

    const result = parsePageDocument(page);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const parsed = Object.values(result.page.blocks);
    const features = parsed.find((block) => block.type === "features");
    const textImage = parsed.find((block) => block.type === "textImage");
    expect(features?.layout).toMatchObject({ width: "full", columns: 3 });
    expect(textImage?.layout).toMatchObject({ direction: "row" });
  });

  it("rechaza un tema inválido dentro de la página", () => {
    const page = landing();
    const raw = structuredClone(page) as unknown as Record<string, unknown>;
    raw.theme = { mode: "light" };
    expect(parsePageDocument(raw).ok).toBe(false);
  });
});
