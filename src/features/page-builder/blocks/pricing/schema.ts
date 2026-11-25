import { z } from "zod";

import type { PricingProps } from "@/types/page";

import { blockBase, blockText, optionalBlockText, safeUrlSchema } from "../shared";

export const pricingSchema = blockBase(
  "pricing",
  z
    .object({
      title: blockText(80),
      subtitle: optionalBlockText(160),
      plans: z
        .array(
          z
            .object({
              name: blockText(40),
              price: blockText(20),
              period: optionalBlockText(30),
              features: z.array(blockText(70)).min(1).max(8),
              ctaLabel: blockText(30),
              ctaHref: safeUrlSchema,
            })
            .strict(),
        )
        .min(1)
        .max(3),
    })
    .strict(),
);

export const pricingDefaults: PricingProps = {
  title: "Precios simples",
  subtitle: "Sin sorpresas. Cambia o cancela cuando quieras.",
  plans: [
    {
      name: "Starter",
      price: "0 €",
      period: "/mes",
      features: ["1 proyecto", "Soporte por correo"],
      ctaLabel: "Empezar gratis",
      ctaHref: "#contacto",
    },
    {
      name: "Pro",
      price: "19 €",
      period: "/mes",
      features: ["Proyectos ilimitados", "Dominio propio", "Soporte prioritario"],
      ctaLabel: "Elegir Pro",
      ctaHref: "#contacto",
    },
  ],
};
