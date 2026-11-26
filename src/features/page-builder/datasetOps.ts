import { MAX_DATASET_COLUMNS, MAX_DATASET_ROWS } from "@/lib/datasetSchema";
import type { DatasetColumn, PageDataset } from "@/types/dataset";

/** Dataset inicial de una página: dos columnas y ninguna fila. */
export function emptyDataset(): PageDataset {
  return {
    columns: [
      { id: "col-1", label: "Columna 1" },
      { id: "col-2", label: "Columna 2" },
    ],
    rows: [],
  };
}

/** Genera el primer id `col-N` libre; los ids son estables aunque se renombre. */
export function createColumnId(columns: DatasetColumn[]): string {
  const used = new Set(columns.map((column) => column.id));
  for (let index = 1; index <= 999; index += 1) {
    const id = `col-${index}`;
    if (!used.has(id)) return id;
  }
  throw new Error("No se pudo generar un id de columna libre.");
}

/** Añade una columna vacía sin mutar el dataset. En el máximo no hace nada. */
export function addColumn(dataset: PageDataset): PageDataset {
  if (dataset.columns.length >= MAX_DATASET_COLUMNS) return dataset;

  const column: DatasetColumn = {
    id: createColumnId(dataset.columns),
    label: `Columna ${dataset.columns.length + 1}`,
  };

  return {
    columns: [...dataset.columns, column],
    rows: dataset.rows.map((row) => ({ ...row })),
  };
}

/**
 * Quita una columna y su clave en todas las filas. El dataset siempre conserva
 * al menos una columna; en ese caso devuelve el original.
 */
export function removeColumn(dataset: PageDataset, columnId: string): PageDataset {
  if (dataset.columns.length <= 1) return dataset;

  const columns = dataset.columns.filter((column) => column.id !== columnId);
  if (columns.length === dataset.columns.length) return dataset;

  return {
    columns,
    rows: dataset.rows.map((row) => {
      const next = { ...row };
      delete next[columnId];
      return next;
    }),
  };
}

/** Renombra una columna conservando su id y los valores de las filas. */
export function renameColumn(dataset: PageDataset, columnId: string, label: string): PageDataset {
  return {
    ...dataset,
    columns: dataset.columns.map((column) =>
      column.id === columnId ? { ...column, label } : column,
    ),
  };
}

/** Añade una fila con una celda vacía por columna. En el máximo no hace nada. */
export function addRow(dataset: PageDataset): PageDataset {
  if (dataset.rows.length >= MAX_DATASET_ROWS) return dataset;

  const row = Object.fromEntries(dataset.columns.map((column) => [column.id, ""]));
  return { ...dataset, rows: [...dataset.rows, row] };
}

/** Quita la fila indicada; un índice fuera de rango devuelve el original. */
export function removeRow(dataset: PageDataset, rowIndex: number): PageDataset {
  if (!dataset.rows[rowIndex]) return dataset;
  return { ...dataset, rows: dataset.rows.filter((_, index) => index !== rowIndex) };
}

/** Actualiza una celda; ignora índices o columnas que no existen. */
export function updateCell(
  dataset: PageDataset,
  rowIndex: number,
  columnId: string,
  value: string,
): PageDataset {
  if (!dataset.rows[rowIndex]) return dataset;
  if (!dataset.columns.some((column) => column.id === columnId)) return dataset;

  return {
    ...dataset,
    rows: dataset.rows.map((row, index) =>
      index === rowIndex ? { ...row, [columnId]: value } : row,
    ),
  };
}
