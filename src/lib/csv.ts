import {
  MAX_DATASET_CELL_LENGTH,
  MAX_DATASET_COLUMNS,
  MAX_DATASET_ROWS,
  validatePageDataset,
} from "@/lib/datasetSchema";
import type { PageDataset } from "@/types/dataset";

/** Tamaño máximo del archivo que acepta el editor de datos. */
export const MAX_CSV_FILE_BYTES = 100 * 1024;

/**
 * Parser CSV según RFC 4180: comas, comillas y saltos de línea dentro de
 * comillas, `""` escapado, CRLF/LF y BOM inicial. No recorta el contenido de
 * las celdas: eso lo decide quien consume el resultado.
 */
export function parseCsv(text: string): string[][] {
  const input = text.startsWith("\uFEFF") ? text.slice(1) : text;
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let rowStarted = false;
  let quoteStartLine = 1;
  let line = 1;

  for (let index = 0; index < input.length;) {
    const char = input[index]!;

    if (inQuotes) {
      if (char === '"') {
        if (input[index + 1] === '"') {
          field += '"';
          index += 2;
          continue;
        }
        inQuotes = false;
        index += 1;
        continue;
      }
      if (char === "\n") line += 1;
      else if (char === "\r" && input[index + 1] !== "\n") line += 1;
      field += char;
      index += 1;
      continue;
    }

    if (char === '"' && field.length === 0) {
      inQuotes = true;
      rowStarted = true;
      quoteStartLine = line;
      index += 1;
      continue;
    }

    if (char === ",") {
      row.push(field);
      field = "";
      rowStarted = true;
      index += 1;
      continue;
    }

    if (char === "\r" || char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      rowStarted = false;
      if (char === "\r" && input[index + 1] === "\n") index += 2;
      else index += 1;
      line += 1;
      continue;
    }

    field += char;
    rowStarted = true;
    index += 1;
  }

  if (inQuotes) {
    throw new Error(`El CSV tiene una comilla sin cerrar (línea ${quoteStartLine}).`);
  }

  // No se añade un registro extra por el salto de línea final.
  if (rowStarted || field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

function isBlankRow(row: string[]): boolean {
  return row.every((cell) => cell.trim() === "");
}

/**
 * Convierte un CSV en el dataset de una página. La primera fila son las
 * cabeceras; los ids son estables (`col-1`…`col-N`). Los límites del dataset
 * se aplican antes de validar con Zod para dar mensajes con fila y columna.
 */
export function datasetFromCsv(text: string): PageDataset {
  const parsed = parseCsv(text);
  const headerRow = parsed[0];

  if (!headerRow) {
    throw new Error("El CSV está vacío.");
  }

  if (headerRow.length > MAX_DATASET_COLUMNS) {
    throw new Error(
      `El CSV admite como máximo ${MAX_DATASET_COLUMNS} columnas; se encontraron ${headerRow.length}.`,
    );
  }

  const dataRows = parsed.slice(1);
  while (dataRows.length > 0) {
    const last = dataRows[dataRows.length - 1]!;
    if (!isBlankRow(last)) break;
    dataRows.pop();
  }

  if (dataRows.length > MAX_DATASET_ROWS) {
    throw new Error(
      `El CSV admite como máximo ${MAX_DATASET_ROWS} filas; se encontraron ${dataRows.length}.`,
    );
  }

  const columns = headerRow.map((label, index) => {
    const trimmed = label.trim().slice(0, 40);
    return {
      id: `col-${index + 1}`,
      label: trimmed.length > 0 ? trimmed : `Columna ${index + 1}`,
    };
  });

  const rows = dataRows.map((cells, rowIndex) => {
    if (cells.length > columns.length) {
      throw new Error(
        `La fila ${rowIndex + 1} tiene ${cells.length} celdas y solo hay ${columns.length} columnas.`,
      );
    }

    const row: Record<string, string> = {};
    columns.forEach((column, columnIndex) => {
      const value = (cells[columnIndex] ?? "").trim();
      if (value.length > MAX_DATASET_CELL_LENGTH) {
        throw new Error(
          `La fila ${rowIndex + 1}, columna ${columnIndex + 1} supera los ${MAX_DATASET_CELL_LENGTH} caracteres.`,
        );
      }
      row[column.id] = value;
    });
    return row;
  });

  return validatePageDataset({ columns, rows });
}
