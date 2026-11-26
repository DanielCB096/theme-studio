import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { PageRenderer } from "@/features/page-builder/PageRenderer";
import { tableSchema } from "@/features/page-builder/blocks/table/schema";
import { DEFAULT_THEME } from "@/lib/defaultThemes";
import {
  DEFAULT_BLOCK_LAYOUT,
  type PageBlock,
  type PageDocument,
  type TableProps,
} from "@/types/page";
import type { PageDataset } from "@/types/dataset";

const pageId = "123e4567-e89b-42d3-a456-426614174000";

const dataset: PageDataset = {
  columns: [
    { id: "col-1", label: "Producto" },
    { id: "col-2", label: "Precio" },
  ],
  rows: [
    { "col-1": "Café", "col-2": "3 €" },
    { "col-1": "Té", "col-2": "2 €" },
  ],
};

function makeTablePage(overrides: Partial<TableProps> = {}): PageDocument {
  const block: PageBlock = {
    id: "table-1",
    type: "table",
    childIds: [],
    layout: { ...DEFAULT_BLOCK_LAYOUT },
    props: {
      title: "Inventario",
      source: "static",
      columns: ["Plan", "Precio", "Soporte"],
      rows: [["Starter", "0 €", "Correo"]],
      ...overrides,
    },
  };

  return {
    version: 1,
    name: "Página con tabla",
    theme: DEFAULT_THEME,
    rootIds: [block.id],
    blocks: { [block.id]: block },
  };
}

function renderPage(
  page: PageDocument,
  mode: "builder" | "public",
  data: PageDataset | null,
  id: string | null = pageId,
) {
  return render(
    <MemoryRouter>
      <PageRenderer page={page} runtime={{ mode, pageId: id, dataset: data }} />
    </MemoryRouter>,
  );
}

describe("bloque table", () => {
  it("interpreta una tabla guardada sin source como estática", () => {
    const parsed = tableSchema.parse({
      id: "table-legacy",
      type: "table",
      childIds: [],
      props: {
        title: "Tabla antigua",
        columns: ["A", "B"],
        rows: [["1", "2"]],
      },
    });

    expect(parsed.props.source).toBe("static");
  });

  it("mantiene el render estático por defecto", () => {
    renderPage(makeTablePage(), "builder", null);

    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Plan" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "Starter" })).toBeInTheDocument();
  });

  it("renderiza las columnas y celdas del dataset en el builder", () => {
    renderPage(makeTablePage({ source: "page" }), "builder", dataset);

    const table = screen.getByRole("table");
    expect(within(table).getByRole("columnheader", { name: "Producto" })).toBeInTheDocument();
    expect(within(table).getByRole("columnheader", { name: "Precio" })).toBeInTheDocument();
    expect(within(table).getByRole("cell", { name: "Café" })).toBeInTheDocument();
    expect(within(table).getByRole("cell", { name: "Té" })).toBeInTheDocument();
    expect(table.querySelector("caption")).toHaveTextContent("Inventario");
  });

  it("pide guardar la página si el borrador aún no tiene id", () => {
    renderPage(makeTablePage({ source: "page" }), "builder", null, null);

    expect(screen.queryByRole("table")).toBeNull();
    expect(screen.getByText(/Guarda la página para conectar datos/i)).toBeInTheDocument();
  });

  it("enlaza al editor de datos desde el builder si no hay dataset", () => {
    renderPage(makeTablePage({ source: "page" }), "builder", null);

    expect(screen.queryByRole("table")).toBeNull();
    expect(screen.getByRole("link", { name: "Editar datos de la página" })).toHaveAttribute(
      "href",
      `/pages/${pageId}/datos`,
    );
  });

  it("no deja una sección vacía en público sin dataset", () => {
    renderPage(makeTablePage({ source: "page" }), "public", null);

    expect(screen.queryByRole("table")).toBeNull();
    expect(screen.queryByText("Inventario")).toBeNull();
  });

  it("muestra las cabeceras y un aviso en el builder si el dataset no tiene filas", () => {
    renderPage(makeTablePage({ source: "page" }), "builder", { ...dataset, rows: [] });

    expect(screen.getByRole("columnheader", { name: "Producto" })).toBeInTheDocument();
    expect(screen.getByText(/Sin filas todavía/i)).toBeInTheDocument();
  });

  it("no renderiza la tabla pública si el dataset no tiene filas", () => {
    renderPage(makeTablePage({ source: "page" }), "public", { ...dataset, rows: [] });

    expect(screen.queryByRole("table")).toBeNull();
    expect(screen.queryByText("Inventario")).toBeNull();
  });

  it("muestra los datos del dataset en la página publicada", () => {
    renderPage(makeTablePage({ source: "page" }), "public", dataset);

    expect(screen.getByRole("cell", { name: "Café" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Editar datos de la página" })).toBeNull();
  });
});
