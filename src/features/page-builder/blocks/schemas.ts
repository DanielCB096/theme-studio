import { z } from "zod";

import { ctaSchema } from "./cta/schema";
import { featuresSchema } from "./features/schema";
import { footerSchema } from "./footer/schema";
import { formSchema } from "./form/schema";
import { heroSchema } from "./hero/schema";
import { navbarSchema } from "./navbar/schema";
import { pricingSchema } from "./pricing/schema";
import { tableSchema } from "./table/schema";
import { textImageSchema } from "./textImage/schema";

/** Un esquema por bloque; el registro de UI se apoya en este mapa. */
export const blockSchemaByType = {
  navbar: navbarSchema,
  hero: heroSchema,
  features: featuresSchema,
  pricing: pricingSchema,
  form: formSchema,
  table: tableSchema,
  cta: ctaSchema,
  footer: footerSchema,
  textImage: textImageSchema,
} as const;

export const pageBlockSchema = z.discriminatedUnion("type", [
  navbarSchema,
  heroSchema,
  featuresSchema,
  pricingSchema,
  formSchema,
  tableSchema,
  ctaSchema,
  footerSchema,
  textImageSchema,
]);
