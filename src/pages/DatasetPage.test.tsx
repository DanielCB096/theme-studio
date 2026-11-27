import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getPageRecordMock, getPageDatasetMock, savePageDatasetMock } = vi.hoisted(() => ({
  getPageRecordMock: vi.fn(),
  getPageDatasetMock: vi.fn(),
  savePageDatasetMock: vi.fn(),
}));

vi.mock("@/features/page-builder/pageRepository", () => ({
  getPageRecord: getPageRecordMock,
  publicPageUrl: (slug: string) => `http://localhost/p/${slug}`,
}));

vi.mock("@/features/page-builder/datasetRepository", () => ({
  getPageDataset: getPageDatasetMock,
  savePageDataset: savePageDatasetMock,
}));

import DatasetPage from "@/pages/DatasetPage";
import type { PageDataset } from "@/types/dataset";

const pageId = "123e4567-e89b-42d3-a456-426614174000";

const storedDataset: PageDataset = {
  columns: [
    { id: "col-1", label: "Nombre" },
    { id: "col-2", label: "Precio" },
  ],
  rows: [{ "col-1": "Ana", "col-2": "30" }],
};

function record() {
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
        <Route path="/pages/:id/datos" element={<DatasetPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  getPageRecordMock.mockResolvedValue(record());
  getPageDatasetMock.mockResolvedValue(storedDataset);
  savePageDatasetMock.mockResolvedValue(undefined);
});

describe("DatasetPage", () => {
  it("carga el nombre de la página y el dataset guardado", async () => {
    renderPage();

    expect(
      await screen.findByRole("heading", { name: /Datos de «Mi página»/ }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Fila 1, columna 1 (Nombre)")).toHaveValue("Ana");
    expect(screen.getByLabelText("Fila 1, columna 2 (Precio)")).toHaveValue("30");
    expect(screen.getByText(/1 de 200 filas/)).toBeInTheDocument();
  });

  it("edita una celda, añade una fila y guarda el dataset esperado", async () => {
    const user = userEvent.setup();
    renderPage();

    const cell = await screen.findByLabelText("Fila 1, columna 1 (Nombre)");
    await user.clear(cell);
    await user.type(cell, "Bea");

    await user.click(screen.getByRole("button", { name: "Añadir fila" }));
    expect(screen.getByLabelText("Fila 2, columna 1 (Nombre)")).toHaveValue("");

    await user.click(screen.getByRole("button", { name: "Guardar datos" }));

    await waitFor(() => expect(savePageDatasetMock).toHaveBeenCalledTimes(1));
    expect(savePageDatasetMock).toHaveBeenCalledWith(pageId, {
      columns: storedDataset.columns,
      rows: [
        { "col-1": "Bea", "col-2": "30" },
        { "col-1": "", "col-2": "" },
      ],
    });
    expect(await screen.findByText("Datos guardados.")).toBeInTheDocument();
    expect(screen.queryByText("Sin guardar")).toBeNull();
  });

  it("empieza con un dataset vacío y muestra la ayuda cuando no hay datos", async () => {
    getPageDatasetMock.mockResolvedValue(null);
    renderPage();

    expect(await screen.findByText(/Todavía no hay datos guardados/)).toBeInTheDocument();
    expect(screen.getByLabelText("Etiqueta de la columna 1")).toHaveValue("Columna 1");
    expect(screen.getByLabelText("Etiqueta de la columna 2")).toHaveValue("Columna 2");
    expect(screen.getByText(/0 de 200 filas/)).toBeInTheDocument();
  });

  it("elimina una columna solo tras confirmar en el diálogo", async () => {
    const user = userEvent.setup();
    renderPage();

    await screen.findByLabelText("Etiqueta de la columna 2");
    await user.click(screen.getByRole("button", { name: "Eliminar columna 2" }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(/Eliminar columna «Precio»/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Eliminar columna" }));

    expect(screen.queryByLabelText("Etiqueta de la columna 2")).toBeNull();
    expect(screen.getByText("Sin guardar")).toBeInTheDocument();
  });

  it("muestra el error legible si el guardado falla", async () => {
    savePageDatasetMock.mockRejectedValue(new Error("No se pudo guardar en Supabase."));
    const user = userEvent.setup();
    renderPage();

    await screen.findByLabelText("Fila 1, columna 1 (Nombre)");
    await user.click(screen.getByRole("button", { name: "Guardar datos" }));

    expect(await screen.findByText("No se pudo guardar en Supabase.")).toBeInTheDocument();
    expect(screen.queryByText("Datos guardados.")).toBeNull();
  });

  it("importa un CSV y no guarda hasta pulsar Guardar datos", async () => {
    const user = userEvent.setup();
    renderPage();

    await screen.findByLabelText("Fila 1, columna 1 (Nombre)");
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
    expect(savePageDatasetMock).toHaveBeenCalledWith(pageId, {
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
    });
  });

  it("rechaza un CSV de más de 100 KB con un mensaje claro", async () => {
    const user = userEvent.setup();
    renderPage();

    await screen.findByLabelText("Fila 1, columna 1 (Nombre)");
    const file = new File([new Uint8Array(100 * 1024 + 1)], "grande.csv", { type: "text/csv" });

    await user.upload(screen.getByLabelText("Importar CSV"), file);

    expect(await screen.findByText("No se pudo importar el CSV")).toBeInTheDocument();
    expect(screen.getByText(/el máximo es 100 KB/)).toBeInTheDocument();
    expect(savePageDatasetMock).not.toHaveBeenCalled();
  });

  it("muestra el error del parser si el CSV tiene una comilla sin cerrar", async () => {
    const user = userEvent.setup();
    renderPage();

    await screen.findByLabelText("Fila 1, columna 1 (Nombre)");
    const file = new File(['A,B\n"sin cerrar,2\n'], "roto.csv", { type: "text/csv" });

    await user.upload(screen.getByLabelText("Importar CSV"), file);

    expect(await screen.findByText("No se pudo importar el CSV")).toBeInTheDocument();
    expect(screen.getByText(/comilla sin cerrar/)).toBeInTheDocument();
  });
});
