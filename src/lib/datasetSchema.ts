import { z } from "zod";

import type { PageDataset } from "@/types/dataset";

/** Límites del dataset por página (Hito 2B/2C). */
export const MAX_DATASET_COLUMNS = 8;
export const MAX_DATASET_ROWS = 200;
export const MAX_DATASET_CELL_LENGTH = 200;
export const MAX_DATASET_BYTES = 100_000;

/** Varios datasets por página (Hito 2C). */
export const MAX_DATASETS_PER_PAGE = 10;
export const MAX_DATASET_NAME_LENGTH = 60;
export const DEFAULT_DATASET_NAME = "Datos";

/** Nombre editable y único por página; la base de datos compara sin mayúsculas. */
export const datasetNameSchema = z
  .string()
  .trim()
  .min(1, "El nombre del dataset no puede estar vacío.")
  .max(
    MAX_DATASET_NAME_LENGTH,
    `El nombre del dataset no puede superar ${MAX_DATASET_NAME_LENGTH} caracteres.`,
  );

export const DATASET_COLUMN_ID_PATTERN = /^[a-z0-9][a-z0-9-]{0,23}$/;

const columnSchema = z
  .object({
    id: z
      .string()
      .regex(
        DATASET_COLUMN_ID_PATTERN,
        "El id de la columna debe empezar por letra o número y usar solo minúsculas, números o guiones (máx. 24).",
      ),
    label: z
      .string()
      .trim()
      .min(1, "La etiqueta de la columna no puede estar vacía.")
      .max(40, "La etiqueta de la columna no puede superar 40 caracteres."),
  })
  .strict();

const rowSchema = z.record(
  z
    .string()
    .max(
      MAX_DATASET_CELL_LENGTH,
      `Cada celda puede tener como máximo ${MAX_DATASET_CELL_LENGTH} caracteres.`,
    ),
);

function serializedBytes(value: unknown): number {
  return new TextEncoder().encode(JSON.stringify(value)).length;
}

/**
 * Esquema del dataset de una página. Las claves de cada fila deben existir en
 * `columns`; las claves extra se rechazan para no guardar datos invisibles.
 */
export const pageDatasetSchema = z
  .object({
    columns: z
      .array(columnSchema)
      .min(1, "El dataset necesita al menos una columna.")
      .max(MAX_DATASET_COLUMNS, `El dataset admite como máximo ${MAX_DATASET_COLUMNS} columnas.`),
    rows: z
      .array(rowSchema)
      .max(MAX_DATASET_ROWS, `El dataset admite como máximo ${MAX_DATASET_ROWS} filas.`),
  })
  .strict()
  .superRefine((dataset, ctx) => {
    const ids = new Set<string>();

    dataset.columns.forEach((column, index) => {
      if (ids.has(column.id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Hay más de una columna con el id «${column.id}».`,
          path: ["columns", index, "id"],
        });
      }
      ids.add(column.id);
    });

    dataset.rows.forEach((row, rowIndex) => {
      for (const key of Object.keys(row)) {
        if (!ids.has(key)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `La fila ${rowIndex + 1} contiene la columna desconocida «${key}».`,
            path: ["rows", rowIndex, key],
          });
        }
      }
    });

    const bytes = serializedBytes(dataset);
    if (bytes > MAX_DATASET_BYTES) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Los datos ocupan ${bytes} bytes; el máximo es ${MAX_DATASET_BYTES}.`,
        path: ["rows"],
      });
    }
  });

/** Garantía de compilación: lo validado es exactamente un `PageDataset`. */
export const datasetSchemaMatchesType = (dataset: z.infer<typeof pageDatasetSchema>): PageDataset =>
  dataset;

/** Valida el nombre de un dataset y devuelve la versión recortada. */
export function validateDatasetName(input: unknown): string {
  const parsed = datasetNameSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "El nombre del dataset no es válido.");
  }
  return parsed.data;
}

/** Valida datos externos y lanza un error legible con la primera incidencia. */
export function validatePageDataset(input: unknown): PageDataset {
  const parsed = pageDatasetSchema.safeParse(input);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const path = issue?.path.join(".");
    const message = issue?.message ?? "Los datos de la página no son válidos.";
    throw new Error(path ? `${path}: ${message}` : message);
  }
  return parsed.data;
}
