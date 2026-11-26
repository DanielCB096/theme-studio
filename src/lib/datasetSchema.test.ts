import { describe, expect, it } from "vitest";

import {
  MAX_DATASET_BYTES,
  MAX_DATASET_COLUMNS,
  MAX_DATASET_ROWS,
  validatePageDataset,
} from "@/lib/datasetSchema";
import type { PageDataset } from "@/types/dataset";

const validDataset: PageDataset = {
  columns: [
    { id: "col-1", label: "Nombre" },
    { id: "col-2", label: "Precio" },
  ],
  rows: [{ "col-1": "Café", "col-2": "3 €" }],
};

function columns(count: number) {
  return Array.from({ length: count }, (_, index) => ({
    id: `col-${index + 1}`,
    label: `Columna ${index + 1}`,
  }));
}

describe("pageDatasetSchema", () => {
  it("acepta un dataset válido y recorta las etiquetas", () => {
    const dataset = validatePageDataset({
      ...validDataset,
      columns: [
        { id: "col-1", label: "  Nombre  " },
        { id: "col-2", label: "Precio" },
      ],
    });

    expect(dataset.columns[0]?.label).toBe("Nombre");
    expect(dataset.rows).toEqual(validDataset.rows);
  });

  it("rechaza un dataset sin columnas", () => {
    expect(() => validatePageDataset({ columns: [], rows: [] })).toThrow(/al menos una columna/i);
  });

  it("rechaza más de 8 columnas", () => {
    expect(() =>
      validatePageDataset({ columns: columns(MAX_DATASET_COLUMNS + 1), rows: [] }),
    ).toThrow(/como máximo 8 columnas/i);
  });

  it("rechaza ids de columna duplicados", () => {
    expect(() =>
      validatePageDataset({
        columns: [
          { id: "col-1", label: "Uno" },
          { id: "col-1", label: "Dos" },
        ],
        rows: [],
      }),
    ).toThrow(/más de una columna/i);
  });

  it("rechaza una etiqueta vacía después de recortar", () => {
    expect(() =>
      validatePageDataset({
        columns: [
          { id: "col-1", label: "   " },
          { id: "col-2", label: "Dos" },
        ],
        rows: [],
      }),
    ).toThrow(/etiqueta/i);
  });

  it("rechaza una fila con una clave que no existe en las columnas", () => {
    expect(() =>
      validatePageDataset({
        columns: validDataset.columns,
        rows: [{ "col-1": "Café", "col-3": "Sobrante" }],
      }),
    ).toThrow(/columna desconocida/i);
  });

  it("rechaza un valor de celda de más de 200 caracteres", () => {
    expect(() =>
      validatePageDataset({
        columns: validDataset.columns,
        rows: [{ "col-1": "x".repeat(201) }],
      }),
    ).toThrow(/200 caracteres/i);
  });

  it("rechaza más de 200 filas", () => {
    expect(() =>
      validatePageDataset({
        columns: [{ id: "col-1", label: "Nombre" }],
        rows: Array.from({ length: MAX_DATASET_ROWS + 1 }, () => ({ "col-1": "Ana" })),
      }),
    ).toThrow(/como máximo 200 filas/i);
  });

  it("rechaza un dataset que supera el tamaño serializado", () => {
    const dataset = {
      columns: [
        { id: "col-1", label: "Uno" },
        { id: "col-2", label: "Dos" },
        { id: "col-3", label: "Tres" },
      ],
      rows: Array.from({ length: 200 }, () => ({
        "col-1": "x".repeat(200),
        "col-2": "y".repeat(200),
        "col-3": "z".repeat(200),
      })),
    };

    expect(new TextEncoder().encode(JSON.stringify(dataset)).length).toBeGreaterThan(
      MAX_DATASET_BYTES,
    );
    expect(() => validatePageDataset(dataset)).toThrow(/bytes/i);
  });
});
