import { z } from "zod";

import type { CtaProps } from "@/types/page";

import { blockBase, blockText, optionalBlockText, safeUrlSchema } from "../shared";

export const ctaSchema = blockBase(
  "cta",
  z
    .object({
      title: blockText(90),
      description: optionalBlockText(200),
      buttonLabel: blockText(30),
      buttonHref: safeUrlSchema,
    })
    .strict(),
);

export const ctaDefaults: CtaProps = {
  title: "¿Empezamos?",
  description: "Crea tu página en minutos y publícala con un enlace.",
  buttonLabel: "Contactar",
  buttonHref: "#contacto",
};
