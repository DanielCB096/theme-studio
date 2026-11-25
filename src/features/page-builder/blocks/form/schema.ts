import { z } from "zod";

import type { FormProps } from "@/types/page";

import { blockBase, blockText, optionalBlockText } from "../shared";

export const formSchema = blockBase(
  "form",
  z
    .object({
      title: blockText(80),
      description: optionalBlockText(180),
      fields: z
        .array(
          z
            .object({
              label: blockText(50),
              type: z.enum(["text", "email", "textarea"]),
              required: z.boolean(),
            })
            .strict(),
        )
        .min(1)
        .max(6),
      submitLabel: blockText(30),
      successMessage: blockText(140),
    })
    .strict(),
);

export const formDefaults: FormProps = {
  title: "Hablemos",
  description: "Cuéntanos qué necesitas y te respondemos en un día laborable.",
  fields: [
    { label: "Nombre", type: "text", required: true },
    { label: "Correo", type: "email", required: true },
    { label: "Mensaje", type: "textarea", required: false },
  ],
  submitLabel: "Enviar mensaje",
  successMessage: "Gracias. Hemos recibido tu mensaje (demostración).",
};
