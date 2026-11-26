import { ctaDefaults } from "@/features/page-builder/blocks/cta/schema";
import { featuresDefaults } from "@/features/page-builder/blocks/features/schema";
import { footerDefaults } from "@/features/page-builder/blocks/footer/schema";
import { formDefaults } from "@/features/page-builder/blocks/form/schema";
import { heroDefaults } from "@/features/page-builder/blocks/hero/schema";
import { navbarDefaults } from "@/features/page-builder/blocks/navbar/schema";
import { pricingDefaults } from "@/features/page-builder/blocks/pricing/schema";
import { textImageDefaults } from "@/features/page-builder/blocks/textImage/schema";
import {
  DEFAULT_BLOCK_LAYOUT,
  type BlockLayout,
  type PageBlock,
  type PageBlockPropsMap,
  type PageBlockType,
  type PageDocument,
} from "@/types/page";
import type { Theme } from "@/types/theme";

function makeBlock<T extends PageBlockType>(
  type: T,
  props: PageBlockPropsMap[T],
  layout: Partial<BlockLayout> = {},
): PageBlock {
  // Clonar: si no, todas las páginas compartirían los mismos objetos de props
  // y editar una modificaría los defaults globales.
  return {
    id: crypto.randomUUID(),
    type,
    childIds: [],
    layout: { ...DEFAULT_BLOCK_LAYOUT, ...layout },
    props: structuredClone(props),
  } as PageBlock;
}

/** Landing inicial: una página real editable y publicable. */
export function createLandingDocument(theme: Theme, name = "Mi landing"): PageDocument {
  const blocks: PageBlock[] = [
    makeBlock("navbar", navbarDefaults, { width: "full" }),
    makeBlock("hero", heroDefaults, { width: "full" }),
    makeBlock("features", featuresDefaults, { width: "normal", columns: 3 }),
    makeBlock("textImage", textImageDefaults, { width: "normal", direction: "row" }),
    makeBlock("pricing", pricingDefaults, { width: "normal", columns: 3, align: "center" }),
    makeBlock("cta", ctaDefaults, { width: "full", align: "center" }),
    makeBlock("form", formDefaults, { width: "full" }),
    makeBlock("footer", footerDefaults, { width: "full", direction: "row" }),
  ];

  return {
    version: 1,
    name,
    theme,
    rootIds: blocks.map((block) => block.id),
    blocks: Object.fromEntries(blocks.map((block) => [block.id, block])),
  };
}
