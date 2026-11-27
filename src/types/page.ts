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
  /** Logo opcional por URL pública; cadena vacía = sin imagen. */
  logoUrl: string;
  logoAlt: string;
  showBrandText: boolean;
}

/** Layout v1: presentación común a todos los bloques. */
export const BLOCK_LAYOUT_WIDTHS = ["compact", "normal", "wide", "full"] as const;
export type BlockLayoutWidth = (typeof BLOCK_LAYOUT_WIDTHS)[number];

export const BLOCK_LAYOUT_ALIGNS = ["left", "center", "right"] as const;
export type BlockLayoutAlign = (typeof BLOCK_LAYOUT_ALIGNS)[number];

export const BLOCK_LAYOUT_DIRECTIONS = ["row", "column"] as const;
export type BlockLayoutDirection = (typeof BLOCK_LAYOUT_DIRECTIONS)[number];

export const BLOCK_LAYOUT_COLUMNS = [1, 2, 3] as const;
export type BlockLayoutColumns = (typeof BLOCK_LAYOUT_COLUMNS)[number];

export const BLOCK_LAYOUT_GAPS = ["compact", "normal", "spacious"] as const;
export type BlockLayoutGap = (typeof BLOCK_LAYOUT_GAPS)[number];

export interface BlockLayout {
  width: BlockLayoutWidth;
  align: BlockLayoutAlign;
  direction: BlockLayoutDirection;
  reverse: boolean;
  columns: BlockLayoutColumns;
  gap: BlockLayoutGap;
}

/** Defaults de retrocompatibilidad: páginas guardadas sin `layout` los reciben. */
export const DEFAULT_BLOCK_LAYOUT: BlockLayout = {
  width: "full",
  align: "left",
  direction: "column",
  reverse: false,
  columns: 1,
  gap: "normal",
};

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

export const TABLE_PAGE_SIZES = [0, 5, 10, 20] as const;
export type TablePageSize = (typeof TABLE_PAGE_SIZES)[number];

export interface TableProps {
  title: string;
  /** `static` usa columnas y filas propias; `page` lee el dataset de la página. */
  source: "static" | "page";
  columns: string[];
  rows: string[][];
  /** Muestra el buscador en la tabla (solo lectura en la página publicada). */
  searchable: boolean;
  /** Filas por página; `0` muestra todas. */
  pageSize: TablePageSize;
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
    layout: BlockLayout;
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
