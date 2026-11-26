import { describe, expect, it } from "vitest";

import {
  addColumn,
  addRow,
  createColumnId,
  emptyDataset,
  removeColumn,
  removeRow,
  renameColumn,
  updateCell,
} from "@/features/page-builder/datasetOps";
import { MAX_DATASET_COLUMNS } from "@/lib/datasetSchema";
import type { PageDataset } from "@/types/dataset";

const dataset: PageDataset = {
  columns: [
    { id: "col-1", label: "Nombre" },
    { id: "col-2", label: "Precio" },
  ],
  rows: [
    { "col-1": "Café", "col-2": "3 €" },
    { "col-1": "Té", "col-2": "2 €" },
  ],
};

describe("datasetOps", () => {
  it("crea un dataset vacío con dos columnas", () => {
    expect(emptyDataset()).toEqual({
      columns: [
        { id: "col-1", label: "Columna 1" },
        { id: "col-2", label: "Columna 2" },
      ],
      rows: [],
    });
  });

  it("genera el primer id de columna libre", () => {
    expect(createColumnId([])).toBe("col-1");
    expect(createColumnId(dataset.columns)).toBe("col-3");
    expect(createColumnId([{ id: "col-2", label: "Dos" }])).toBe("col-1");
  });

  it("añade una columna y respeta el máximo", () => {
    const next = addColumn(dataset);

    expect(next.columns).toHaveLength(3);
    expect(next.columns[2]).toEqual({ id: "col-3", label: "Columna 3" });
    expect(next.rows).toEqual(dataset.rows);
    expect(next).not.toBe(dataset);

    const full: PageDataset = {
      columns: Array.from({ length: MAX_DATASET_COLUMNS }, (_, index) => ({
        id: `col-${index + 1}`,
        label: `Columna ${index + 1}`,
      })),
      rows: [],
    };
    expect(addColumn(full)).toBe(full);
  });

  it("quita una columna y borra su clave en todas las filas", () => {
    const next = removeColumn(dataset, "col-2");

    expect(next.columns).toEqual([{ id: "col-1", label: "Nombre" }]);
    expect(next.rows).toEqual([{ "col-1": "Café" }, { "col-1": "Té" }]);
    expect(dataset.rows[0]).toHaveProperty("col-2");
  });

  it("no quita la última columna", () => {
    const single: PageDataset = {
      columns: [{ id: "col-1", label: "Nombre" }],
      rows: [{ "col-1": "Café" }],
    };
    expect(removeColumn(single, "col-1")).toBe(single);
  });

  it("renombra una columna sin tocar los datos", () => {
    const next = renameColumn(dataset, "col-1", "Producto");

    expect(next.columns[0]).toEqual({ id: "col-1", label: "Producto" });
    expect(next.rows).toEqual(dataset.rows);
  });

  it("añade una fila con celdas vacías y respeta el máximo", () => {
    const next = addRow(dataset);

    expect(next.rows[2]).toEqual({ "col-1": "", "col-2": "" });
    expect(next.rows).toHaveLength(3);
    expect(dataset.rows).toHaveLength(2);

    const full: PageDataset = {
      columns: dataset.columns,
      rows: Array.from({ length: 200 }, () => ({ "col-1": "", "col-2": "" })),
    };
    expect(addRow(full)).toBe(full);
  });

  it("quita una fila y actualiza una celda", () => {
    const withoutFirst = removeRow(dataset, 0);
    expect(withoutFirst.rows).toEqual([{ "col-1": "Té", "col-2": "2 €" }]);

    const updated = updateCell(dataset, 1, "col-2", "2,50 €");
    expect(updated.rows[1]).toEqual({ "col-1": "Té", "col-2": "2,50 €" });
    expect(dataset.rows[1]).toEqual({ "col-1": "Té", "col-2": "2 €" });

    expect(updateCell(dataset, 9, "col-1", "x")).toBe(dataset);
    expect(updateCell(dataset, 0, "col-9", "x")).toBe(dataset);
  });

  it("no muta el dataset original en ninguna operación", () => {
    const snapshot = structuredClone(dataset);

    addColumn(dataset);
    removeColumn(dataset, "col-1");
    renameColumn(dataset, "col-1", "Otro");
    addRow(dataset);
    removeRow(dataset, 0);
    updateCell(dataset, 0, "col-1", "Cambiado");

    expect(dataset).toEqual(snapshot);
  });
});
