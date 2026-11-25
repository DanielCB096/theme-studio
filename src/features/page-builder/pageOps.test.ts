import { describe, expect, it } from "vitest";

import { DEFAULT_THEME } from "@/lib/defaultThemes";
import { createLandingDocument } from "@/features/page-builder/templates/landing";
import {
  addBlock,
  blocksInOrder,
  moveBlock,
  removeBlock,
  renameDocument,
  updateBlockLayout,
  updateBlockProps,
} from "@/features/page-builder/pageOps";
import { DEFAULT_BLOCK_LAYOUT, MAX_BLOCKS_PER_PAGE, type PageBlock } from "@/types/page";

function newHero(id = "hero-2"): PageBlock {
  return {
    id,
    type: "hero",
    childIds: [],
    layout: { ...DEFAULT_BLOCK_LAYOUT },
    props: {
      eyebrow: "",
      title: "Nueva sección",
      subtitle: "Texto",
      ctaLabel: "Ir",
      ctaHref: "#",
      align: "left",
    },
  };
}

describe("pageOps", () => {
  it("añade y quita bloques manteniendo el orden", () => {
    const page = createLandingDocument(DEFAULT_THEME);
    const withHero = addBlock(page, newHero());
    expect(withHero.rootIds).toHaveLength(page.rootIds.length + 1);
    expect(blocksInOrder(withHero).at(-1)?.id).toBe("hero-2");

    const without = removeBlock(withHero, "hero-2");
    expect(without.rootIds).not.toContain("hero-2");
    expect(without.blocks["hero-2"]).toBeUndefined();
    expect(removeBlock(without, "no-existe")).toBe(without);
  });

  it("mueve bloques arriba y abajo sin salir de los límites", () => {
    const page = createLandingDocument(DEFAULT_THEME);
    const first = page.rootIds[0] ?? "";
    const second = page.rootIds[1] ?? "";

    const moved = moveBlock(page, second, -1);
    expect(moved.rootIds[0]).toBe(second);
    expect(moved.rootIds[1]).toBe(first);

    expect(moveBlock(moved, second, -1).rootIds).toEqual(moved.rootIds);
    expect(moveBlock(page, first, -1).rootIds).toEqual(page.rootIds);
  });

  it("actualiza las props del bloque indicado", () => {
    const page = createLandingDocument(DEFAULT_THEME);
    const heroId = page.rootIds[1] ?? "";
    const updated = updateBlockProps(page, heroId, {
      eyebrow: "Hola",
      title: "Nuevo título",
      subtitle: "Subtítulo",
      ctaLabel: "Probar",
      ctaHref: "#",
      align: "center",
    });
    const hero = updated.blocks[heroId];
    expect(hero?.props).toMatchObject({ title: "Nuevo título", align: "center" });
  });

  it("actualiza el layout sin tocar el resto de bloques", () => {
    const page = createLandingDocument(DEFAULT_THEME);
    const heroId = page.rootIds[1] ?? "";
    const hero = page.blocks[heroId];
    if (hero?.type !== "hero") throw new Error("La plantilla debe tener un hero en la posición 2");

    const updated = updateBlockLayout(page, heroId, {
      ...hero.layout,
      width: "compact",
      columns: 2,
    });

    expect(updated.blocks[heroId]?.layout).toMatchObject({ width: "compact", columns: 2 });
    expect(updated.blocks[page.rootIds[0] ?? ""]?.layout).toEqual(
      page.blocks[page.rootIds[0] ?? ""]?.layout,
    );
    expect(updateBlockLayout(page, "no-existe", hero.layout)).toBe(page);
  });

  it("renombra con límite y sin aceptar vacío", () => {
    const page = createLandingDocument(DEFAULT_THEME);
    expect(renameDocument(page, "  Nueva  ").name).toBe("Nueva");
    expect(renameDocument(page, "   ").name).toBe(page.name);
    expect(renameDocument(page, "x".repeat(120)).name).toHaveLength(80);
  });

  it("no supera el máximo de bloques", () => {
    let page = createLandingDocument(DEFAULT_THEME);
    for (let index = page.rootIds.length; index < MAX_BLOCKS_PER_PAGE + 2; index += 1) {
      page = addBlock(page, newHero(`extra-${index}`));
    }
    expect(page.rootIds).toHaveLength(MAX_BLOCKS_PER_PAGE);
  });
});
