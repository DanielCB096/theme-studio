import { z } from "zod";

import type { HeroProps } from "@/types/page";

import { blockBase, blockText, optionalBlockText, safeUrlSchema } from "../shared";

export const heroSchema = blockBase(
  "hero",
  z
    .object({
      eyebrow: optionalBlockText(60),
      title: blockText(90),
      subtitle: blockText(240),
      ctaLabel: blockText(30),
      ctaHref: safeUrlSchema,
      align: z.enum(["left", "center"]),
    })
    .strict(),
);

export const heroDefaults: HeroProps = {
  eyebrow: "Nuevo",
  title: "Tu producto, listo para brillar",
  subtitle: "Una página clara, rápida y accesible para contar lo que haces.",
  ctaLabel: "Solicitar demo",
  ctaHref: "#contacto",
  align: "left",
};
