import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getPageRecordMock, listPageDatasetsMock, createPageDatasetMock, deletePageDatasetMock } =
  vi.hoisted(() => ({
    getPageRecordMock: vi.fn(),
    listPageDatasetsMock: vi.fn(),
    createPageDatasetMock: vi.fn(),
    deletePageDatasetMock: vi.fn(),
  }));

vi.mock("@/features/page-builder/pageRepository", () => ({
  getPageRecord: getPageRecordMock,
  publicPageUrl: (slug: string) => `http://localhost/p/${slug}`,
}));

vi.mock("@/features/page-builder/datasetRepository", () => ({
  listPageDatasets: listPageDatasetsMock,
  createPageDataset: createPageDatasetMock,
  deletePageDataset: deletePageDatasetMock,
}));

import DatasetsPage from "@/pages/DatasetsPage";
import type { PageDatasetRecord } from "@/types/dataset";

const pageId = "123e4567-e89b-42d3-a456-426614174000";

const products: PageDatasetRecord = {
  id: "11111111-1111-4111-8111-111111111111",
  pageId,
  name: "Productos",
  dataset: {
    columns: [
      { id: "col-1", label: "Nombre" },
      { id: "col-2", label: "Precio" },
    ],
    rows: [{ "col-1": "Café", "col-2": "3 €" }],
  },
  updatedAt: "2026-11-27T10:00:00.000Z",
};

const services: PageDatasetRecord = {
  id: "22222222-2222-4222-8222-222222222222",
  pageId,
  name: "Servicios",
  dataset: {
    columns: [{ id: "col-1", label: "Servicio" }],
    rows: [],
  },
  updatedAt: "2026-11-27T11:00:00.000Z",
};

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
    <MemoryRouter initialEntries={[`/pages/${pageId}/datos`]}>
      <Routes>
        <Route path="/pages/:id/datos" element={<DatasetsPage />} />
        <Route path="/pages/:id/datos/:datasetId" element={<div>Editor de datos</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  getPageRecordMock.mockResolvedValue(pageRecord());
  listPageDatasetsMock.mockResolvedValue([products, services]);
  createPageDatasetMock.mockResolvedValue({ ...products, id: "nuevo-id", name: "Datos 3" });
  deletePageDatasetMock.mockResolvedValue(undefined);
});

describe("DatasetsPage", () => {
  it("lista los datasets con sus columnas, filas y nombres", async () => {
    renderPage();

    expect(
      await screen.findByRole("heading", { name: /Datasets de «Mi página»/ }, { timeout: 5000 }),
    ).toBeInTheDocument();
    expect(screen.getByText("Productos")).toBeInTheDocument();
    expect(screen.getByText("Servicios")).toBeInTheDocument();
    expect(screen.getByText(/2 columnas · 1 fila/)).toBeInTheDocument();
    expect(screen.getByText(/1 columna · 0 filas/)).toBeInTheDocument();
    expect(screen.getByText(/2 de 10 datasets/)).toBeInTheDocument();
  });

  it("muestra el estado vacío y crea el primer dataset", async () => {
    listPageDatasetsMock.mockResolvedValue([]);
    const user = userEvent.setup();
    renderPage();

    expect(
      await screen.findByText("Todavía no hay datasets", {}, { timeout: 5000 }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Crear el primero" }));

    await waitFor(() => expect(createPageDatasetMock).toHaveBeenCalledWith(pageId, "Datos 1"));
    expect(await screen.findByText("Editor de datos")).toBeInTheDocument();
  });

  it("crea un dataset nuevo y navega a su editor", async () => {
    const user = userEvent.setup();
    renderPage();

    await screen.findByText("Productos", {}, { timeout: 5000 });
    await user.click(screen.getByRole("button", { name: "Nuevo dataset" }));

    await waitFor(() => expect(createPageDatasetMock).toHaveBeenCalledWith(pageId, "Datos 3"));
    expect(await screen.findByText("Editor de datos")).toBeInTheDocument();
  });

  it("elimina un dataset solo tras confirmar en el diálogo", async () => {
    const user = userEvent.setup();
    renderPage();

    await screen.findByText("Productos", {}, { timeout: 5000 });
    await user.click(screen.getByRole("button", { name: "Eliminar Productos" }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(
      screen.getByText(/Las tablas que usen este dataset dejarán de mostrar datos/),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Eliminar dataset" }));

    await waitFor(() => expect(deletePageDatasetMock).toHaveBeenCalledWith(products.id));
    await waitFor(() => expect(listPageDatasetsMock).toHaveBeenCalledTimes(2));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("muestra el error de carga sin romper la página", async () => {
    listPageDatasetsMock.mockRejectedValue(new Error("El dataset «Rotos» está dañado."));
    renderPage();

    expect(await screen.findByText("El dataset «Rotos» está dañado.")).toBeInTheDocument();
  });

  it("muestra el error legible si crear falla", async () => {
    createPageDatasetMock.mockRejectedValue(
      new Error("Una página admite como máximo 10 datasets."),
    );
    const user = userEvent.setup();
    renderPage();

    await screen.findByText("Productos", {}, { timeout: 5000 });
    await user.click(screen.getByRole("button", { name: "Nuevo dataset" }));

    expect(
      await screen.findByText("Una página admite como máximo 10 datasets."),
    ).toBeInTheDocument();
    expect(screen.queryByText("Editor de datos")).toBeNull();
  });
});
