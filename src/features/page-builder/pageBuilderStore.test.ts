import { beforeEach, describe, expect, it } from "vitest";

import { createPageBlock } from "@/features/page-builder/blocks/registry";
import { usePageBuilderStore } from "@/features/page-builder/pageBuilderStore";
import { createLandingDocument } from "@/features/page-builder/templates/landing";
import { DEFAULT_THEME } from "@/lib/defaultThemes";

function resetStore() {
  usePageBuilderStore.setState({
    page: null,
    selectedId: null,
    savedId: null,
    savedSlug: null,
    dirty: false,
  });
}

describe("pageBuilderStore", () => {
  beforeEach(resetStore);

  it("carga una página y selecciona el primer bloque", () => {
    const page = createLandingDocument(DEFAULT_THEME);
    usePageBuilderStore.getState().load(page);
    expect(usePageBuilderStore.getState().page).toEqual(page);
    expect(usePageBuilderStore.getState().selectedId).toBe(page.rootIds[0]);
    expect(usePageBuilderStore.getState().dirty).toBe(false);
  });

  it("añade bloques y los marca sucios", () => {
    const page = createLandingDocument(DEFAULT_THEME);
    usePageBuilderStore.getState().load(page);
    const block = createPageBlock("cta");
    usePageBuilderStore.getState().add(block);

    const state = usePageBuilderStore.getState();
    expect(state.page?.rootIds).toContain(block.id);
    expect(state.selectedId).toBe(block.id);
    expect(state.dirty).toBe(true);
  });

  it("edita props, mueve, elimina y renombra", () => {
    const page = createLandingDocument(DEFAULT_THEME);
    usePageBuilderStore.getState().load(page);
    const heroId = page.rootIds[1] ?? "";
    const hero = page.blocks[heroId];
    if (hero?.type !== "hero") throw new Error("La plantilla debe tener un hero en la posición 2");

    usePageBuilderStore.getState().updateProps(heroId, { ...hero.props, title: "Editado" });
    expect(usePageBuilderStore.getState().page?.blocks[heroId]?.props).toMatchObject({
      title: "Editado",
    });

    usePageBuilderStore.getState().move(heroId, -1);
    expect(usePageBuilderStore.getState().page?.rootIds[0]).toBe(heroId);

    usePageBuilderStore.getState().remove(heroId);
    expect(usePageBuilderStore.getState().page?.rootIds).not.toContain(heroId);

    usePageBuilderStore.getState().rename("Nueva landing");
    expect(usePageBuilderStore.getState().page?.name).toBe("Nueva landing");
  });

  it("actualiza el layout y marca el documento sucio", () => {
    const page = createLandingDocument(DEFAULT_THEME);
    usePageBuilderStore.getState().load(page);
    const heroId = page.rootIds[1] ?? "";
    const hero = page.blocks[heroId];
    if (hero?.type !== "hero") throw new Error("La plantilla debe tener un hero en la posición 2");

    usePageBuilderStore.getState().updateLayout(heroId, {
      ...hero.layout,
      width: "compact",
      columns: 2,
    });

    const state = usePageBuilderStore.getState();
    expect(state.page?.blocks[heroId]?.layout).toMatchObject({
      width: "compact",
      columns: 2,
    });
    expect(state.dirty).toBe(true);
  });

  it("clona los defaults de layout entre páginas y bloques nuevos", () => {
    const first = createPageBlock("cta");
    const second = createPageBlock("cta");
    first.layout.width = "compact";

    expect(second.layout.width).toBe("full");

    const pageA = createLandingDocument(DEFAULT_THEME);
    const pageB = createLandingDocument(DEFAULT_THEME);
    usePageBuilderStore.getState().load(pageA);
    const heroA = pageA.rootIds[1] ?? "";
    const heroB = pageB.rootIds[1] ?? "";
    const heroBlock = pageA.blocks[heroA];
    if (!heroBlock) throw new Error("Falta el hero");

    usePageBuilderStore.getState().updateLayout(heroA, { ...heroBlock.layout, width: "compact" });

    expect(pageB.blocks[heroB]?.layout.width).toBe("full");
    expect(usePageBuilderStore.getState().page?.blocks[heroA]?.layout.width).toBe("compact");
  });

  it("guarda metadatos sin marcar sucio", () => {
    usePageBuilderStore.getState().load(createLandingDocument(DEFAULT_THEME));
    usePageBuilderStore.getState().markSaved({ id: "p-1", slug: "mi-pagina" });
    const state = usePageBuilderStore.getState();
    expect(state.savedId).toBe("p-1");
    expect(state.savedSlug).toBe("mi-pagina");
    expect(state.dirty).toBe(false);
  });
});
