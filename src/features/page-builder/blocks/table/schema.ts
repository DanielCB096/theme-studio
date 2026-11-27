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
      // Default retrocompatible: sin id, una tabla 2B usa el primer dataset.
      datasetId: z.string().uuid().nullable().default(null),
      columns: z.array(blockText(40)).min(2).max(6),
      rows: z
        .array(z.array(z.string().trim().max(80)).max(6))
        .min(1)
        .max(20),
      // Defaults retrocompatibles: una tabla guardada sin buscador ni paginación
      // se sigue viendo exactamente igual.
      searchable: z.boolean().default(false),
      pageSize: z.union([z.literal(0), z.literal(5), z.literal(10), z.literal(20)]).default(0),
    })
    .strict(),
);

export const tableDefaults: TableProps = {
  title: "Comparativa",
  source: "static",
  datasetId: null,
  columns: ["Plan", "Precio", "Soporte"],
  rows: [
    ["Starter", "0 €", "Correo"],
    ["Pro", "19 €", "Prioritario"],
  ],
  searchable: true,
  pageSize: 10,
};
