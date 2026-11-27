/**
 * Datos editables de una página (Hito 2B/2C). Cada dataset tiene columnas
 * estables por id y filas con valores de texto indexados por ese id.
 */
export interface DatasetColumn {
  id: string;
  label: string;
}

export interface PageDataset {
  columns: DatasetColumn[];
  rows: Record<string, string>[];
}

/** Fila de `page_datasets` ya validada: varios datasets por página (Hito 2C). */
export interface PageDatasetRecord {
  id: string;
  pageId: string;
  name: string;
  dataset: PageDataset;
  updatedAt: string;
}
