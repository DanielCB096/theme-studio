import { createElement, type ComponentType, type ReactNode } from "react";

import { ctaBlock } from "@/features/page-builder/blocks/cta";
import { featuresBlock } from "@/features/page-builder/blocks/features";
import { footerBlock } from "@/features/page-builder/blocks/footer";
import { formBlock } from "@/features/page-builder/blocks/form";
import { heroBlock } from "@/features/page-builder/blocks/hero";
import { navbarBlock } from "@/features/page-builder/blocks/navbar";
import { pricingBlock } from "@/features/page-builder/blocks/pricing";
import { tableBlock } from "@/features/page-builder/blocks/table";
import { textImageBlock } from "@/features/page-builder/blocks/textImage";
import { DEFAULT_BLOCK_LAYOUT, type PageBlock, type PageBlockType } from "@/types/page";

/** Única fuente de metadatos, defaults y componentes por tipo de bloque. */
export const BLOCK_REGISTRY = {
  navbar: navbarBlock,
  hero: heroBlock,
  features: featuresBlock,
  pricing: pricingBlock,
  form: formBlock,
  table: tableBlock,
  cta: ctaBlock,
  footer: footerBlock,
  textImage: textImageBlock,
} as const;

export const BLOCK_LIST = Object.values(BLOCK_REGISTRY);

export function createPageBlock(type: PageBlockType): PageBlock {
  const definition = BLOCK_REGISTRY[type];
  return {
    id: crypto.randomUUID(),
    type,
    childIds: [],
    layout: structuredClone(DEFAULT_BLOCK_LAYOUT),
    props: structuredClone(definition.defaultProps),
  } as PageBlock;
}

type RendererComponent = ComponentType<{ props: PageBlock["props"]; layout: PageBlock["layout"] }>;
type InspectorComponent = ComponentType<{
  props: PageBlock["props"];
  layout: PageBlock["layout"];
  onChange: (props: PageBlock["props"]) => void;
}>;

export function renderBlockContent(block: PageBlock): ReactNode {
  const definition = BLOCK_REGISTRY[block.type] as unknown as { Renderer: RendererComponent };
  return createElement(definition.Renderer, { props: block.props, layout: block.layout });
}

export function renderBlockInspector(
  block: PageBlock,
  onChange: (props: PageBlock["props"]) => void,
): ReactNode {
  const definition = BLOCK_REGISTRY[block.type] as unknown as { Inspector: InspectorComponent };
  return createElement(definition.Inspector, {
    props: block.props,
    layout: block.layout,
    onChange,
  });
}

export type { PageBlockPropsMap } from "@/types/page";
