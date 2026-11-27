import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getPageRecordMock, getPageDatasetRecordMock, savePageDatasetMock } = vi.hoisted(() => ({
  getPageRecordMock: vi.fn(),
  getPageDatasetRecordMock: vi.fn(),
  savePageDatasetMock: vi.fn(),
}));

vi.mock("@/features/page-builder/pageRepository", () => ({
  getPageRecord: getPageRecordMock,
  publicPageUrl: (slug: string) => `http://localhost/p/${slug}`,
}));

vi.mock("@/features/page-builder/datasetRepository", () => ({
  getPageDatasetRecord: getPageDatasetRecordMock,
  savePageDataset: savePageDatasetMock,
}));

import DatasetPage from "@/pages/DatasetPage";
import type { PageDataset } from "@/types/dataset";

const pageId = "123e4567-e89b-42d3-a456-426614174000";
const datasetId = "11111111-1111-4111-8111-111111111111";

const storedDataset: PageDataset = {
  columns: [
    { id: "col-1", label: "Nombre" },
    { id: "col-2", label: "Precio" },
  ],
  rows: [{ "col-1": "Ana", "col-2": "30" }],
};

function record(overrides: Partial<{ pageId: string; name: string }> = {}) {
  return {
    id: datasetId,
    pageId,
    name: "Productos",
    dataset: storedDataset,
    updatedAt: "2026-11-27T10:00:00.000Z",
    ...overrides,
  };
}

function pageRecord() {
  return {
    id: pageId,
    slug: "mi-pagina",
    isPublic: false,
    page: { name: "Mi página" },
  };
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={[`/pages/${pageId}/datos/${datasetId}`]}>
      <Routes>
        <Route path="/pages/:id/datos/:datasetId" element={<DatasetPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  getPageRecordMock.mockResolvedValue(pageRecord());
  getPageDatasetRecordMock.mockResolvedValue(record());
  savePageDatasetMock.mockResolvedValue(undefined);
});

describe("DatasetPage", () => {
  it("carga la página y el dataset por id", async () => {
    renderPage();

    expect(
      await screen.findByRole("heading", { name: /Datos de «Mi página»/ }, { timeout: 5000 }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Nombre del dataset")).toHaveValue("Productos");
    expect(screen.getByLabelText("Fila 1, columna 1 (Nombre)")).toHaveValue("Ana");
    expect(screen.getByLabelText("Fila 1, columna 2 (Precio)")).toHaveValue("30");
    expect(screen.getByText(/1 de 200 filas/)).toBeInTheDocument();
    expect(getPageDatasetRecordMock).toHaveBeenCalledWith(datasetId);
  });

  it("edita una celda, añade una fila y guarda id, datos y nombre", async () => {
    const user = userEvent.setup();
    renderPage();

    const cell = await screen.findByLabelText("Fila 1, columna 1 (Nombre)", {}, { timeout: 5000 });
    await user.clear(cell);
    await user.type(cell, "Bea");

    await user.click(screen.getByRole("button", { name: "Añadir fila" }));
    expect(screen.getByLabelText("Fila 2, columna 1 (Nombre)")).toHaveValue("");

    await user.click(screen.getByRole("button", { name: "Guardar datos" }));

    await waitFor(() => expect(savePageDatasetMock).toHaveBeenCalledTimes(1));
    expect(savePageDatasetMock).toHaveBeenCalledWith(
      datasetId,
      {
        columns: storedDataset.columns,
        rows: [
          { "col-1": "Bea", "col-2": "30" },
          { "col-1": "", "col-2": "" },
        ],
      },
      "Productos",
    );
    expect(await screen.findByText("Datos guardados.")).toBeInTheDocument();
    expect(screen.queryByText("Sin guardar")).toBeNull();
  });

  it("renombra el dataset y lo guarda con el nuevo nombre", async () => {
    const user = userEvent.setup();
    renderPage();

    const name = await screen.findByLabelText("Nombre del dataset", {}, { timeout: 5000 });
    await user.clear(name);
    await user.type(name, "Catálogo");

    expect(screen.getByText("Sin guardar")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Guardar datos" }));

    await waitFor(() =>
      expect(savePageDatasetMock).toHaveBeenCalledWith(datasetId, storedDataset, "Catálogo"),
    );
    expect(screen.getByLabelText("Nombre del dataset")).toHaveValue("Catálogo");
  });

  it("no permite editar un dataset de otra página", async () => {
    getPageDatasetRecordMock.mockResolvedValue(record({ pageId: "otra-pagina" }));
    renderPage();

    expect(await screen.findByText("Este dataset pertenece a otra página.")).toBeInTheDocument();
    expect(screen.queryByLabelText("Nombre del dataset")).toBeNull();
  });

  it("elimina una columna solo tras confirmar en el diálogo", async () => {
    const user = userEvent.setup();
    renderPage();

    await screen.findByLabelText("Etiqueta de la columna 2", {}, { timeout: 5000 });
    await user.click(screen.getByRole("button", { name: "Eliminar columna 2" }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(/Eliminar columna «Precio»/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Eliminar columna" }));

    expect(screen.queryByLabelText("Etiqueta de la columna 2")).toBeNull();
    expect(screen.getByText("Sin guardar")).toBeInTheDocument();
  });

  it("muestra el error legible si el guardado falla", async () => {
    savePageDatasetMock.mockRejectedValue(new Error("Ya existe un dataset con ese nombre."));
    const user = userEvent.setup();
    renderPage();

    await screen.findByLabelText("Fila 1, columna 1 (Nombre)", {}, { timeout: 5000 });
    await user.click(screen.getByRole("button", { name: "Guardar datos" }));

    expect(await screen.findByText("Ya existe un dataset con ese nombre.")).toBeInTheDocument();
    expect(screen.queryByText("Datos guardados.")).toBeNull();
  });

  it("importa un CSV y no guarda hasta pulsar Guardar datos", async () => {
    const user = userEvent.setup();
    renderPage();

    await screen.findByLabelText("Fila 1, columna 1 (Nombre)", {}, { timeout: 5000 });
    const csv =
      'Producto,Precio,Notas\nCafé,3,"Con leche, sin azúcar"\nTé,2,\nZumo,2.5,"Recién exprimido"\n';
    const file = new File([csv], "datos.csv", { type: "text/csv" });

    await user.upload(screen.getByLabelText("Importar CSV"), file);

    expect(
      await screen.findByText("CSV importado: 3 filas. Pulsa “Guardar datos”."),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Fila 1, columna 1 (Producto)")).toHaveValue("Café");
    expect(screen.getByLabelText("Fila 1, columna 3 (Notas)")).toHaveValue("Con leche, sin azúcar");
    expect(screen.getByText(/3 de 8 columnas/)).toBeInTheDocument();
    expect(savePageDatasetMock).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Guardar datos" }));

    await waitFor(() => expect(savePageDatasetMock).toHaveBeenCalledTimes(1));
    expect(savePageDatasetMock).toHaveBeenCalledWith(
      datasetId,
      {
        columns: [
          { id: "col-1", label: "Producto" },
          { id: "col-2", label: "Precio" },
          { id: "col-3", label: "Notas" },
        ],
        rows: [
          { "col-1": "Café", "col-2": "3", "col-3": "Con leche, sin azúcar" },
          { "col-1": "Té", "col-2": "2", "col-3": "" },
          { "col-1": "Zumo", "col-2": "2.5", "col-3": "Recién exprimido" },
        ],
      },
      "Productos",
    );
  });

  it("rechaza un CSV de más de 100 KB con un mensaje claro", async () => {
    const user = userEvent.setup();
    renderPage();

    await screen.findByLabelText("Fila 1, columna 1 (Nombre)", {}, { timeout: 5000 });
    const file = new File([new Uint8Array(100 * 1024 + 1)], "grande.csv", { type: "text/csv" });

    await user.upload(screen.getByLabelText("Importar CSV"), file);

    expect(await screen.findByText("No se pudo importar el CSV")).toBeInTheDocument();
    expect(screen.getByText(/el máximo es 100 KB/)).toBeInTheDocument();
    expect(savePageDatasetMock).not.toHaveBeenCalled();
  });

  it("muestra el error del parser si el CSV tiene una comilla sin cerrar", async () => {
    const user = userEvent.setup();
    renderPage();

    await screen.findByLabelText("Fila 1, columna 1 (Nombre)", {}, { timeout: 5000 });
    const file = new File(['A,B\n"sin cerrar,2\n'], "roto.csv", { type: "text/csv" });

    await user.upload(screen.getByLabelText("Importar CSV"), file);

    expect(await screen.findByText("No se pudo importar el CSV")).toBeInTheDocument();
    expect(screen.getByText(/comilla sin cerrar/)).toBeInTheDocument();
  });
});
