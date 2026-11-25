import { z } from "zod";

import type { FeaturesProps } from "@/types/page";

import { blockBase, blockText, optionalBlockText } from "../shared";

export const featuresSchema = blockBase(
  "features",
  z
    .object({
      title: blockText(80),
      subtitle: optionalBlockText(160),
      items: z
        .array(z.object({ title: blockText(50), description: blockText(140) }).strict())
        .min(1)
        .max(6),
    })
    .strict(),
);

export const featuresDefaults: FeaturesProps = {
  title: "Todo lo que necesitas",
  subtitle: "Menos fricción, más resultados.",
  items: [
    { title: "Rápido", description: "Carga ligera y decisiones claras." },
    { title: "Accesible", description: "Contraste y teclado cuidados." },
    { title: "Flexible", description: "Adaptado a cada dispositivo." },
  ],
};
