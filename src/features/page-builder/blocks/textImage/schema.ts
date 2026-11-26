import { z } from "zod";

import type { TextImageProps } from "@/types/page";

import { blockBase, blockText, safeImageUrlSchema } from "../shared";

export const textImageSchema = blockBase(
  "textImage",
  z
    .object({
      title: blockText(90),
      body: blockText(500),
      imageUrl: z.union([z.literal(""), safeImageUrlSchema]),
      imageAlt: z.string().trim().max(120),
      imagePosition: z.enum(["left", "right"]),
    })
    .strict(),
  { direction: "row" },
);

export const textImageDefaults: TextImageProps = {
  title: "Diseño que se adapta",
  body: "Los mismos tokens se aplican en móvil, tableta y escritorio. La disposición cambia, la identidad se mantiene.",
  imageUrl: "",
  imageAlt: "Captura de la interfaz",
  imagePosition: "right",
};
