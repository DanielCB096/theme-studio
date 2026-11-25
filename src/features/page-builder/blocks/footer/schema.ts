import { z } from "zod";

import type { FooterProps } from "@/types/page";

import { blockBase, blockText, linkSchema } from "../shared";

export const footerSchema = blockBase(
  "footer",
  z
    .object({
      text: blockText(200),
      links: z.array(linkSchema).max(4),
    })
    .strict(),
  { direction: "row" },
);

export const footerDefaults: FooterProps = {
  text: "© 2026 Nébula. Hecho con Theme Studio.",
  links: [
    { label: "Privacidad", href: "/privacidad" },
    { label: "Contacto", href: "mailto:hola@example.com" },
  ],
};
