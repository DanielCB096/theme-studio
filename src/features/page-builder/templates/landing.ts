import { ctaDefaults } from "@/features/page-builder/blocks/cta/schema";
import { featuresDefaults } from "@/features/page-builder/blocks/features/schema";
import { footerDefaults } from "@/features/page-builder/blocks/footer/schema";
import { formDefaults } from "@/features/page-builder/blocks/form/schema";
import { heroDefaults } from "@/features/page-builder/blocks/hero/schema";
import { navbarDefaults } from "@/features/page-builder/blocks/navbar/schema";
import { pricingDefaults } from "@/features/page-builder/blocks/pricing/schema";
import { textImageDefaults } from "@/features/page-builder/blocks/textImage/schema";
import type { PageBlock, PageBlockPropsMap, PageBlockType, PageDocument } from "@/types/page";
import type { Theme } from "@/types/theme";

function makeBlock<T extends PageBlockType>(type: T, props: PageBlockPropsMap[T]): PageBlock {
  // Clonar: si no, todas las páginas compartirían los mismos objetos de props
  // y editar una modificaría los defaults globales.
  return {
    id: crypto.randomUUID(),
    type,
    childIds: [],
    props: structuredClone(props),
  } as PageBlock;
}

/** Landing inicial: una página real editable y publicable. */
export function createLandingDocument(theme: Theme, name = "Mi landing"): PageDocument {
  const blocks: PageBlock[] = [
    makeBlock("navbar", navbarDefaults),
    makeBlock("hero", heroDefaults),
    makeBlock("features", featuresDefaults),
    makeBlock("textImage", textImageDefaults),
    makeBlock("pricing", pricingDefaults),
    makeBlock("cta", ctaDefaults),
    makeBlock("form", formDefaults),
    makeBlock("footer", footerDefaults),
  ];

  return {
    version: 1,
    name,
    theme,
    rootIds: blocks.map((block) => block.id),
    blocks: Object.fromEntries(blocks.map((block) => [block.id, block])),
  };
}
