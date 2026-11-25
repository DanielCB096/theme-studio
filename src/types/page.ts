import type { Theme } from "@/types/theme";

export const PAGE_BLOCK_TYPES = [
  "navbar",
  "hero",
  "features",
  "pricing",
  "form",
  "table",
  "cta",
  "footer",
  "textImage",
] as const;

export type PageBlockType = (typeof PAGE_BLOCK_TYPES)[number];

export interface BlockLink {
  label: string;
  href: string;
}

export const NAVBAR_PLACEMENTS = ["top", "bottom", "left", "right"] as const;
export type NavbarPlacement = (typeof NAVBAR_PLACEMENTS)[number];

export interface NavbarProps {
  brand: string;
  links: BlockLink[];
  ctaLabel: string;
  ctaHref: string;
  /** Arriba/abajo = barra; izquierda/derecha = columna lateral en escritorio. */
  placement: NavbarPlacement;
}

export interface HeroProps {
  eyebrow: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaHref: string;
  align: "left" | "center";
}

export interface FeatureItem {
  title: string;
  description: string;
}

export interface FeaturesProps {
  title: string;
  subtitle: string;
  items: FeatureItem[];
}

export interface PricingPlan {
  name: string;
  price: string;
  period: string;
  features: string[];
  ctaLabel: string;
  ctaHref: string;
}

export interface PricingProps {
  title: string;
  subtitle: string;
  plans: PricingPlan[];
}

export interface FormField {
  label: string;
  type: "text" | "email" | "textarea";
  required: boolean;
}

export interface FormProps {
  title: string;
  description: string;
  fields: FormField[];
  submitLabel: string;
  successMessage: string;
}

export interface TableProps {
  title: string;
  columns: string[];
  rows: string[][];
}

export interface CtaProps {
  title: string;
  description: string;
  buttonLabel: string;
  buttonHref: string;
}

export interface FooterProps {
  text: string;
  links: BlockLink[];
}

export interface TextImageProps {
  title: string;
  body: string;
  imageUrl: string;
  imageAlt: string;
  imagePosition: "left" | "right";
}

export interface PageBlockPropsMap {
  navbar: NavbarProps;
  hero: HeroProps;
  features: FeaturesProps;
  pricing: PricingProps;
  form: FormProps;
  table: TableProps;
  cta: CtaProps;
  footer: FooterProps;
  textImage: TextImageProps;
}

export type PageBlock = {
  [K in PageBlockType]: {
    id: string;
    type: K;
    childIds: string[];
    props: PageBlockPropsMap[K];
  };
}[PageBlockType];

/**
 * Documento de página. Los bloques viven en un mapa por id y el orden en
 * `rootIds`; en el Hito 1 no hay anidación (childIds siempre vacío).
 */
export interface PageDocument {
  version: 1;
  name: string;
  theme: Theme;
  rootIds: string[];
  blocks: Record<string, PageBlock>;
}

export const MAX_BLOCKS_PER_PAGE = 30;
