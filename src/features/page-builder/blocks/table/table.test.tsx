import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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
      searchable: false,
      pageSize: 0,
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
    expect(parsed.props.searchable).toBe(false);
    expect(parsed.props.pageSize).toBe(0);
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

  it("no muestra buscador ni paginación si la tabla no los tiene activados", () => {
    renderPage(makeTablePage(), "public", null);

    expect(screen.queryByRole("searchbox")).toBeNull();
    expect(screen.queryByText(/Página 1 de/)).toBeNull();
    expect(screen.queryByText(/resultados/)).toBeNull();
  });

  it("filtra por cualquier celda sin distinguir mayúsculas ni acentos", async () => {
    const user = userEvent.setup();
    renderPage(
      makeTablePage({
        searchable: true,
        columns: ["Producto", "Precio"],
        rows: [
          ["Café", "3 €"],
          ["Té", "2 €"],
          ["Agua", "1 €"],
        ],
      }),
      "public",
      null,
    );

    const search = screen.getByRole("searchbox", { name: "Buscar en la tabla" });
    expect(screen.getByText("3 resultados")).toHaveAttribute("aria-live", "polite");

    await user.type(search, "CAFE");

    expect(screen.getByRole("cell", { name: "Café" })).toBeInTheDocument();
    expect(screen.queryByRole("cell", { name: "Té" })).toBeNull();
    expect(screen.getByText("1 resultado")).toBeInTheDocument();
  });

  it("muestra «No hay resultados.» sin ocultar la tabla", async () => {
    const user = userEvent.setup();
    renderPage(makeTablePage({ searchable: true }), "public", null);

    await user.type(screen.getByRole("searchbox", { name: "Buscar en la tabla" }), "zzz");

    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getByText("No hay resultados.")).toBeInTheDocument();
    expect(screen.queryByRole("cell", { name: "Starter" })).toBeNull();
  });

  it("pagina de 5 en 5 y deshabilita los botones en los extremos", async () => {
    const user = userEvent.setup();
    const rows = [
      ["Café", "3 €"],
      ["Té", "2 €"],
      ["Agua", "1 €"],
      ["Zumo", "2 €"],
      ["Leche", "1 €"],
      ["Pan", "1 €"],
      ["Arroz", "2 €"],
    ];
    renderPage(
      makeTablePage({ columns: ["Producto", "Precio"], rows, pageSize: 5 }),
      "public",
      null,
    );

    expect(screen.getByText("Página 1 de 2")).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "Leche" })).toBeInTheDocument();
    expect(screen.queryByRole("cell", { name: "Pan" })).toBeNull();
    expect(screen.getByRole("button", { name: "Anterior" })).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Siguiente" }));

    expect(screen.getByText("Página 2 de 2")).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "Pan" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "Arroz" })).toBeInTheDocument();
    expect(screen.queryByRole("cell", { name: "Café" })).toBeNull();
    expect(screen.getByRole("button", { name: "Siguiente" })).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Anterior" }));

    expect(screen.getByText("Página 1 de 2")).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "Café" })).toBeInTheDocument();
  });

  it("vuelve a la página 1 al cambiar la búsqueda", async () => {
    const user = userEvent.setup();
    const rows = [
      ["Café", "3 €"],
      ["Té", "2 €"],
      ["Agua", "1 €"],
      ["Zumo", "2 €"],
      ["Leche", "1 €"],
      ["Pan", "1 €"],
      ["Arroz", "2 €"],
    ];
    renderPage(
      makeTablePage({ columns: ["Producto", "Precio"], rows, pageSize: 5, searchable: true }),
      "public",
      null,
    );

    await user.click(screen.getByRole("button", { name: "Siguiente" }));
    expect(screen.getByText("Página 2 de 2")).toBeInTheDocument();

    await user.type(screen.getByRole("searchbox", { name: "Buscar en la tabla" }), "cafe");

    expect(screen.getByText("Página 1 de 1")).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "Café" })).toBeInTheDocument();
  });

  it("recorta la página al rango válido si cambian las filas", async () => {
    const user = userEvent.setup();
    const rows = [
      ["Café", "3 €"],
      ["Té", "2 €"],
      ["Agua", "1 €"],
      ["Zumo", "2 €"],
      ["Leche", "1 €"],
      ["Pan", "1 €"],
    ];
    const { rerender } = renderPage(
      makeTablePage({ columns: ["Producto", "Precio"], rows, pageSize: 5 }),
      "public",
      null,
    );

    await user.click(screen.getByRole("button", { name: "Siguiente" }));
    expect(screen.getByText("Página 2 de 2")).toBeInTheDocument();

    rerender(
      <MemoryRouter>
        <PageRenderer
          page={makeTablePage({
            columns: ["Producto", "Precio"],
            rows: rows.slice(0, 2),
            pageSize: 5,
          })}
          runtime={{ mode: "public", pageId, dataset: null }}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText("Página 1 de 1")).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "Café" })).toBeInTheDocument();
  });
});
