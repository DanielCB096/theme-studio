import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import { PageRenderer } from "@/features/page-builder/PageRenderer";
import { tableBlock } from "@/features/page-builder/blocks/table";
import { tableSchema } from "@/features/page-builder/blocks/table/schema";
import { PageRuntimeProvider } from "@/features/page-builder/pageRuntime";
import { DEFAULT_THEME } from "@/lib/defaultThemes";
import {
  DEFAULT_BLOCK_LAYOUT,
  type PageBlock,
  type PageDocument,
  type TableProps,
} from "@/types/page";
import type { PageDataset, PageDatasetRecord } from "@/types/dataset";

const pageId = "123e4567-e89b-42d3-a456-426614174000";
const productDatasetId = "11111111-1111-4111-8111-111111111111";
const serviceDatasetId = "22222222-2222-4222-8222-222222222222";
const missingDatasetId = "33333333-3333-4333-8333-333333333333";

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

function record(id: string, name: string, data: PageDataset = dataset): PageDatasetRecord {
  return {
    id,
    pageId,
    name,
    dataset: data,
    updatedAt: "2026-11-27T10:00:00.000Z",
  };
}

const products = record(productDatasetId, "Productos");
const services = record(serviceDatasetId, "Servicios", {
  columns: [{ id: "col-1", label: "Servicio" }],
  rows: [{ "col-1": "Diseño" }],
});

function makeBlock(id: string, overrides: Partial<TableProps> = {}): PageBlock {
  return {
    id,
    type: "table",
    childIds: [],
    layout: { ...DEFAULT_BLOCK_LAYOUT },
    props: {
      title: "Inventario",
      source: "static",
      datasetId: null,
      columns: ["Plan", "Precio", "Soporte"],
      rows: [["Starter", "0 €", "Correo"]],
      searchable: false,
      pageSize: 0,
      ...overrides,
    },
  };
}

function makeTablePage(overrides: Partial<TableProps> = {}): PageDocument {
  const block = makeBlock("table-1", overrides);
  return {
    version: 1,
    name: "Página con tabla",
    theme: DEFAULT_THEME,
    rootIds: [block.id],
    blocks: { [block.id]: block },
  };
}

function makeTwoTablePage(): PageDocument {
  const first = makeBlock("table-1", {
    title: "Productos",
    source: "page",
    datasetId: productDatasetId,
  });
  const second = makeBlock("table-2", {
    title: "Servicios",
    source: "page",
    datasetId: serviceDatasetId,
  });
  return {
    version: 1,
    name: "Dos tablas",
    theme: DEFAULT_THEME,
    rootIds: [first.id, second.id],
    blocks: { [first.id]: first, [second.id]: second },
  };
}

function renderPage(
  page: PageDocument,
  mode: "builder" | "public",
  datasets: PageDatasetRecord[],
  id: string | null = pageId,
) {
  return render(
    <MemoryRouter>
      <PageRenderer page={page} runtime={{ mode, pageId: id, datasets }} />
    </MemoryRouter>,
  );
}

function renderInspector(props: Partial<TableProps>, datasets: PageDatasetRecord[]) {
  const onChange = vi.fn();
  const value: TableProps = {
    title: "Comparativa",
    source: "static",
    datasetId: null,
    columns: ["Plan", "Precio", "Soporte"],
    rows: [["Starter", "0 €", "Correo"]],
    searchable: true,
    pageSize: 10,
    ...props,
  };

  render(
    <MemoryRouter>
      <PageRuntimeProvider runtime={{ mode: "builder", pageId, datasets }}>
        <tableBlock.Inspector
          props={value}
          layout={{ ...DEFAULT_BLOCK_LAYOUT }}
          onChange={onChange}
        />
      </PageRuntimeProvider>
    </MemoryRouter>,
  );

  return onChange;
}

describe("bloque table", () => {
  it("interpreta una tabla guardada sin source ni dataset como estática", () => {
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
    expect(parsed.props.datasetId).toBeNull();
    expect(parsed.props.searchable).toBe(false);
    expect(parsed.props.pageSize).toBe(0);
  });

  it("admite hasta 50 filas estáticas y rechaza 51", () => {
    const rows = Array.from({ length: 50 }, (_, index) => [`A${index}`, "B", "C"]);
    const block = {
      id: "table-50",
      type: "table",
      childIds: [],
      props: {
        title: "Tabla grande",
        columns: ["A", "B", "C"],
        rows,
      },
    };

    expect(tableSchema.safeParse(block).success).toBe(true);
    expect(
      tableSchema.safeParse({
        ...block,
        props: { ...block.props, rows: [...rows, ["X", "Y", "Z"]] },
      }).success,
    ).toBe(false);
  });

  it("mantiene el render estático por defecto", () => {
    renderPage(makeTablePage(), "builder", []);

    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Plan" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "Starter" })).toBeInTheDocument();
  });

  it("usa un landmark main en público y no lo anida en el builder", () => {
    const publicView = renderPage(makeTablePage(), "public", []);
    expect(screen.getByRole("main")).toBeInTheDocument();
    publicView.unmount();

    renderPage(makeTablePage(), "builder", []);
    expect(screen.queryByRole("main")).toBeNull();
  });

  it("renderiza las columnas y celdas del dataset en el builder", () => {
    renderPage(makeTablePage({ source: "page", datasetId: productDatasetId }), "builder", [
      products,
    ]);

    const table = screen.getByRole("table");
    expect(within(table).getByRole("columnheader", { name: "Producto" })).toBeInTheDocument();
    expect(within(table).getByRole("columnheader", { name: "Precio" })).toBeInTheDocument();
    expect(within(table).getByRole("cell", { name: "Café" })).toBeInTheDocument();
    expect(within(table).getByRole("cell", { name: "Té" })).toBeInTheDocument();
    expect(table.querySelector("caption")).toHaveTextContent("Inventario");
  });

  it("selecciona el dataset indicado por id", () => {
    renderPage(makeTablePage({ source: "page", datasetId: serviceDatasetId }), "public", [
      products,
      services,
    ]);

    expect(screen.getByRole("columnheader", { name: "Servicio" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "Diseño" })).toBeInTheDocument();
    expect(screen.queryByRole("cell", { name: "Café" })).toBeNull();
  });

  it("usa el primer dataset cuando datasetId es null (compatibilidad 2B)", () => {
    renderPage(makeTablePage({ source: "page" }), "public", [products, services]);

    expect(screen.getByRole("columnheader", { name: "Producto" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "Café" })).toBeInTheDocument();
    expect(screen.queryByRole("cell", { name: "Diseño" })).toBeNull();
  });

  it("muestra dos datasets distintos en dos bloques", () => {
    renderPage(makeTwoTablePage(), "public", [products, services]);

    const productTable = screen.getByRole("table", { name: "Productos" });
    const serviceTable = screen.getByRole("table", { name: "Servicios" });
    expect(within(productTable).getByRole("cell", { name: "Café" })).toBeInTheDocument();
    expect(within(productTable).queryByRole("cell", { name: "Diseño" })).toBeNull();
    expect(within(serviceTable).getByRole("cell", { name: "Diseño" })).toBeInTheDocument();
    expect(within(serviceTable).queryByRole("cell", { name: "Café" })).toBeNull();
  });

  it("avisa si el dataset seleccionado no existe, sin caer al primero", () => {
    renderPage(makeTablePage({ source: "page", datasetId: missingDatasetId }), "builder", [
      products,
    ]);

    expect(screen.queryByRole("table")).toBeNull();
    expect(screen.getByText("Dataset no encontrado")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Editar datos de la página" })).toHaveAttribute(
      "href",
      `/pages/${pageId}/datos`,
    );
    expect(screen.queryByRole("cell", { name: "Café" })).toBeNull();
  });

  it("no deja una sección vacía en público si el dataset no existe", () => {
    renderPage(makeTablePage({ source: "page", datasetId: missingDatasetId }), "public", [
      products,
    ]);

    expect(screen.queryByRole("table")).toBeNull();
    expect(screen.queryByText("Inventario")).toBeNull();
  });

  it("pide guardar la página si el borrador aún no tiene id", () => {
    renderPage(makeTablePage({ source: "page" }), "builder", [], null);

    expect(screen.queryByRole("table")).toBeNull();
    expect(screen.getByText(/Guarda la página para conectar datos/i)).toBeInTheDocument();
  });

  it("enlaza a la lista de datasets desde el builder si no hay ninguno", () => {
    renderPage(makeTablePage({ source: "page" }), "builder", []);

    expect(screen.queryByRole("table")).toBeNull();
    expect(screen.getByRole("link", { name: "Editar datos de la página" })).toHaveAttribute(
      "href",
      `/pages/${pageId}/datos`,
    );
  });

  it("no deja una sección vacía en público sin dataset", () => {
    renderPage(makeTablePage({ source: "page" }), "public", []);

    expect(screen.queryByRole("table")).toBeNull();
    expect(screen.queryByText("Inventario")).toBeNull();
  });

  it("muestra las cabeceras y un aviso en el builder si el dataset no tiene filas", () => {
    const emptyRows = record(productDatasetId, "Productos", { ...dataset, rows: [] });
    renderPage(makeTablePage({ source: "page" }), "builder", [emptyRows]);

    expect(screen.getByRole("columnheader", { name: "Producto" })).toBeInTheDocument();
    expect(screen.getByText(/Sin filas todavía/i)).toBeInTheDocument();
  });

  it("no renderiza la tabla pública si el dataset no tiene filas", () => {
    const emptyRows = record(productDatasetId, "Productos", { ...dataset, rows: [] });
    renderPage(makeTablePage({ source: "page" }), "public", [emptyRows]);

    expect(screen.queryByRole("table")).toBeNull();
    expect(screen.queryByText("Inventario")).toBeNull();
  });

  it("muestra los datos del dataset en la página publicada", () => {
    renderPage(makeTablePage({ source: "page" }), "public", [products]);

    expect(screen.getByRole("cell", { name: "Café" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Editar datos de la página" })).toBeNull();
  });

  it("no muestra buscador ni paginación si la tabla no los tiene activados", () => {
    renderPage(makeTablePage(), "public", []);

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
      [],
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
    renderPage(makeTablePage({ searchable: true }), "public", []);

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
    renderPage(makeTablePage({ columns: ["Producto", "Precio"], rows, pageSize: 5 }), "public", []);

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
      [],
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
      [],
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
          runtime={{ mode: "public", pageId, datasets: [] }}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText("Página 1 de 1")).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "Café" })).toBeInTheDocument();
  });
});

describe("inspector de tabla y datasets", () => {
  it("al pasar a datos de la página selecciona el primer dataset", async () => {
    const user = userEvent.setup();
    const onChange = renderInspector({}, [products, services]);

    await user.selectOptions(screen.getByLabelText("Origen de datos"), "page");

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ source: "page", datasetId: productDatasetId }),
    );
  });

  it("permite elegir un dataset concreto y volver a «Primero disponible»", async () => {
    const user = userEvent.setup();
    const onChange = renderInspector({ source: "page", datasetId: productDatasetId }, [
      products,
      services,
    ]);

    expect(screen.getByLabelText("Dataset")).toHaveValue(productDatasetId);

    await user.selectOptions(screen.getByLabelText("Dataset"), serviceDatasetId);
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ source: "page", datasetId: serviceDatasetId }),
    );

    await user.selectOptions(screen.getByLabelText("Dataset"), "");
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ source: "page", datasetId: null }),
    );
  });

  it("enlaza al editor del dataset seleccionado y a la lista", () => {
    renderInspector({ source: "page", datasetId: productDatasetId }, [products, services]);

    expect(screen.getByRole("link", { name: "Editar «Productos»" })).toHaveAttribute(
      "href",
      `/pages/${pageId}/datos/${productDatasetId}`,
    );
    expect(screen.getByRole("link", { name: "Gestionar datasets" })).toHaveAttribute(
      "href",
      `/pages/${pageId}/datos`,
    );
  });

  it("avisa y enlaza a crear datasets si la página no tiene ninguno", () => {
    renderInspector({ source: "page" }, []);

    expect(screen.getByText(/no tiene datasets todavía/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Crear un dataset" })).toHaveAttribute(
      "href",
      `/pages/${pageId}/datos`,
    );
  });
});
