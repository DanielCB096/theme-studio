import { z } from "zod";

import type { NavbarProps } from "@/types/page";

import { blockBase, blockText, linkSchema, safeUrlSchema } from "../shared";

export const navbarSchema = blockBase(
  "navbar",
  z
    .object({
      brand: blockText(40),
      links: z.array(linkSchema).max(5),
      ctaLabel: blockText(30),
      ctaHref: safeUrlSchema,
      // Compatibilidad: páginas antiguas sin placement se interpretan como "top".
      placement: z.enum(["top", "bottom", "left", "right"]).default("top"),
    })
    .strict(),
);

export const navbarDefaults: NavbarProps = {
  brand: "Nébula",
  links: [
    { label: "Producto", href: "#producto" },
    { label: "Precios", href: "#precios" },
    { label: "Contacto", href: "#contacto" },
  ],
  ctaLabel: "Empezar",
  ctaHref: "#contacto",
  placement: "top",
};
