import { describe, expect, it } from "vitest";

import { datasetFromCsv, parseCsv } from "@/lib/csv";

describe("parseCsv", () => {
  it("parsea comas, comillas y saltos de línea dentro de comillas", () => {
    const rows = parseCsv('nombre,nota\n"Café, con leche","Dijo ""hola""\ny adiós"\n');

    expect(rows).toEqual([
      ["nombre", "nota"],
      ["Café, con leche", 'Dijo "hola"\ny adiós'],
    ]);
  });

  it("admite CRLF y conserva los espacios de los campos entre comillas", () => {
    const rows = parseCsv('a,b\r\n" x "," y "\r\n');

    expect(rows).toEqual([
      ["a", "b"],
      [" x ", " y "],
    ]);
  });

  it("ignora el BOM inicial y el salto de línea final", () => {
    expect(parseCsv("\uFEFFa,b\n1,2\n")).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
  });

  it("lanza un error legible si una comilla queda sin cerrar", () => {
    expect(() => parseCsv('a,b\n"sin cerrar,2')).toThrow(/comilla sin cerrar \(línea 2\)/);
  });

  it("devuelve una lista vacía para un texto vacío", () => {
    expect(parseCsv("")).toEqual([]);
  });
});

describe("datasetFromCsv", () => {
  it("convierte cabeceras y filas en un dataset con ids estables", () => {
    const dataset = datasetFromCsv('Nombre,Precio,Notas\nCafé,3,"Con leche, sin azúcar"\nTé,2,\n');

    expect(dataset).toEqual({
      columns: [
        { id: "col-1", label: "Nombre" },
        { id: "col-2", label: "Precio" },
        { id: "col-3", label: "Notas" },
      ],
      rows: [
        { "col-1": "Café", "col-2": "3", "col-3": "Con leche, sin azúcar" },
        { "col-1": "Té", "col-2": "2", "col-3": "" },
      ],
    });
  });

  it("rellena cabeceras vacías, conserva duplicadas y recorta etiquetas largas", () => {
    const dataset = datasetFromCsv(`,Nombre,Nombre,${"x".repeat(50)}\n1,2,3,4\n`);

    expect(dataset.columns.map((column) => column.label)).toEqual([
      "Columna 1",
      "Nombre",
      "Nombre",
      "x".repeat(40),
    ]);
  });

  it("descarta las filas totalmente vacías al final", () => {
    const dataset = datasetFromCsv("A,B\n1,2\n,\n");

    expect(dataset.rows).toEqual([{ "col-1": "1", "col-2": "2" }]);
  });

  it("rechaza más de 8 columnas", () => {
    const header = Array.from({ length: 9 }, (_, index) => `C${index + 1}`).join(",");

    expect(() => datasetFromCsv(`${header}\n`)).toThrow(/máximo 8 columnas/);
  });

  it("rechaza más de 200 filas", () => {
    const rows = Array.from({ length: 201 }, (_, index) => `fila ${index + 1}`).join("\n");

    expect(() => datasetFromCsv(`Nombre\n${rows}\n`)).toThrow(/máximo 200 filas/);
  });

  it("rechaza una celda de más de 200 caracteres e indica fila y columna", () => {
    expect(() => datasetFromCsv(`A,B\n1,${"x".repeat(201)}\n`)).toThrow(
      /fila 1, columna 2 supera los 200 caracteres/i,
    );
  });

  it("rechaza una fila con más celdas que cabeceras", () => {
    expect(() => datasetFromCsv("A,B\n1,2,3\n")).toThrow(/fila 1 tiene 3 celdas/);
  });

  it("lanza un error legible si el CSV está vacío", () => {
    expect(() => datasetFromCsv("")).toThrow(/CSV está vacío/);
  });
});
