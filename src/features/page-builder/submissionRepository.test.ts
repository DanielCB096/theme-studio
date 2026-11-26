import { describe, expect, it } from "vitest";

import {
  submissionFromRow,
  submissionFieldColumns,
  submissionsToCsv,
  type PageSubmission,
} from "@/features/page-builder/submissionRepository";

const rows: PageSubmission[] = [
  {
    id: "s-1",
    createdAt: "2026-11-26T10:00:00.000Z",
    readAt: null,
    userAgent: "vitest",
    data: {
      Nombre: 'José "Pepe", Jr.',
      Correo: "jose@example.com",
      Mensaje: "Línea 1\nLínea 2",
    },
  },
  {
    id: "s-2",
    createdAt: "2026-11-26T11:30:00.000Z",
    readAt: "2026-11-26T12:00:00.000Z",
    userAgent: null,
    data: {
      Nombre: "Ana",
      Teléfono: "600 000 000",
    },
  },
];

describe("submissionRepository", () => {
  it("convierte una fila válida y conserva el orden de los campos", () => {
    const submission = submissionFromRow({
      id: "s-1",
      data: { Nombre: "Ana", Mensaje: "Hola" },
      created_at: "2026-11-26T10:00:00.000Z",
      read_at: null,
      user_agent: "vitest",
    });

    expect(submission).toEqual({
      id: "s-1",
      data: { Nombre: "Ana", Mensaje: "Hola" },
      createdAt: "2026-11-26T10:00:00.000Z",
      readAt: null,
      userAgent: "vitest",
    });
    expect(submissionFieldColumns([submission])).toEqual(["Mensaje", "Nombre"]);
  });

  it("rechaza una fila con datos dañados", () => {
    expect(() =>
      submissionFromRow({
        id: "s-1",
        data: 42,
        created_at: "2026-11-26T10:00:00.000Z",
        read_at: null,
        user_agent: null,
      }),
    ).toThrow(/dañados/i);
  });

  it("genera el CSV exacto con acentos, comillas, comas y saltos de línea", () => {
    expect(submissionsToCsv(rows)).toBe(
      [
        "Fecha,Correo,Mensaje,Nombre,Teléfono",
        '2026-11-26T10:00:00.000Z,jose@example.com,"Línea 1\nLínea 2","José ""Pepe"", Jr.",',
        "2026-11-26T11:30:00.000Z,,,Ana,600 000 000",
      ].join("\r\n"),
    );
  });

  it("neutraliza fórmulas al abrir el CSV en una hoja de cálculo", () => {
    const csv = submissionsToCsv([
      {
        id: "s-3",
        createdAt: "2026-11-26T12:00:00.000Z",
        readAt: null,
        userAgent: null,
        data: {
          Nombre: '=HYPERLINK("https://evil.example")',
          Mensaje: "@SUM(A1:A9)",
          Teléfono: "-42",
        },
      },
    ]);

    expect(csv).toBe(
      [
        "Fecha,Mensaje,Nombre,Teléfono",
        `2026-11-26T12:00:00.000Z,'@SUM(A1:A9),"'=HYPERLINK(""https://evil.example"")",'-42`,
      ].join("\r\n"),
    );
  });

  it("devuelve solo la cabecera de fecha sin respuestas", () => {
    expect(submissionsToCsv([])).toBe("Fecha");
  });
});
