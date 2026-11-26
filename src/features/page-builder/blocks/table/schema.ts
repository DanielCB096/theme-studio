import { z } from "zod";

import type { TableProps } from "@/types/page";

import { blockBase, blockText } from "../shared";

export const tableSchema = blockBase(
  "table",
  z
    .object({
      title: blockText(80),
      // Default retrocompatible: las páginas antiguas siguen siendo estáticas.
      source: z.enum(["static", "page"]).default("static"),
      columns: z.array(blockText(40)).min(2).max(6),
      rows: z
        .array(z.array(z.string().trim().max(80)).max(6))
        .min(1)
        .max(20),
    })
    .strict(),
);

export const tableDefaults: TableProps = {
  title: "Comparativa",
  source: "static",
  columns: ["Plan", "Precio", "Soporte"],
  rows: [
    ["Starter", "0 €", "Correo"],
    ["Pro", "19 €", "Prioritario"],
  ],
};
