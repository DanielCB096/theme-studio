/**
 * Datos editables de una página (Hito 2B). Un único dataset por página:
 * columnas estables por id y filas con valores de texto indexados por ese id.
 */
export interface DatasetColumn {
  id: string;
  label: string;
}

export interface PageDataset {
  columns: DatasetColumn[];
  rows: Record<string, string>[];
}
