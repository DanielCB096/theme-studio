import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const response: {
    data: unknown;
    error: { message: string; code?: string } | null;
    count: number | null;
  } = { data: null, error: null, count: 0 };

  const chain = {
    select: vi.fn(),
    eq: vi.fn(),
    order: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    maybeSingle: vi.fn(),
    single: vi.fn(),
    then: vi.fn(),
  };

  chain.select.mockImplementation(() => chain);
  chain.eq.mockImplementation(() => chain);
  chain.order.mockImplementation(() => chain);
  chain.insert.mockImplementation(() => chain);
  chain.update.mockImplementation(() => chain);
  chain.delete.mockImplementation(() => chain);
  chain.then.mockImplementation((onFulfilled: (value: typeof response) => unknown) =>
    Promise.resolve(response).then(onFulfilled),
  );

  return { chain, response, from: vi.fn(() => chain) };
});

vi.mock("@/lib/supabase", () => ({
  requireSupabase: () => ({ from: mocks.from }),
}));

import {
  createPageDataset,
  deletePageDataset,
  getPageDatasetRecord,
  listPageDatasets,
  parseDatasetData,
  renamePageDataset,
  savePageDataset,
} from "@/features/page-builder/datasetRepository";
import type { PageDataset } from "@/types/dataset";

const dataset: PageDataset = {
  columns: [
    { id: "col-1", label: "Nombre" },
    { id: "col-2", label: "Precio" },
  ],
  rows: [{ "col-1": "Café", "col-2": "3 €" }],
};

const pageId = "123e4567-e89b-42d3-a456-426614174000";
const datasetId = "11111111-1111-4111-8111-111111111111";
const secondDatasetId = "22222222-2222-4222-8222-222222222222";

function row(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: datasetId,
    page_id: pageId,
    name: "Productos",
    data: dataset,
    updated_at: "2026-11-27T10:00:00.000Z",
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.chain.select.mockImplementation(() => mocks.chain);
  mocks.chain.eq.mockImplementation(() => mocks.chain);
  mocks.chain.order.mockImplementation(() => mocks.chain);
  mocks.chain.insert.mockImplementation(() => mocks.chain);
  mocks.chain.update.mockImplementation(() => mocks.chain);
  mocks.chain.delete.mockImplementation(() => mocks.chain);
  mocks.chain.single.mockReset();
  mocks.chain.maybeSingle.mockReset();
  mocks.chain.single.mockResolvedValue({ data: { id: datasetId }, error: null });
  mocks.chain.maybeSingle.mockResolvedValue({ data: { id: datasetId }, error: null });
  mocks.response.data = null;
  mocks.response.error = null;
  mocks.response.count = 0;
});

describe("datasetRepository", () => {
  it("parsea un dataset válido", () => {
    expect(parseDatasetData(dataset)).toEqual(dataset);
  });

  it("explica un dataset dañado", () => {
    expect(() => parseDatasetData({ columns: [], rows: [] })).toThrow(/dañados/i);
    expect(() => parseDatasetData(42)).toThrow(/dañados/i);
  });

  it("lista los datasets de una página ordenados por nombre", async () => {
    mocks.response.data = [
      row({ id: secondDatasetId, name: "Servicios" }),
      row({ id: datasetId, name: "Productos" }),
    ];

    const records = await listPageDatasets(pageId);

    expect(records).toEqual([
      {
        id: secondDatasetId,
        pageId,
        name: "Servicios",
        dataset,
        updatedAt: "2026-11-27T10:00:00.000Z",
      },
      {
        id: datasetId,
        pageId,
        name: "Productos",
        dataset,
        updatedAt: "2026-11-27T10:00:00.000Z",
      },
    ]);
    expect(mocks.from).toHaveBeenCalledWith("page_datasets");
    expect(mocks.chain.select).toHaveBeenCalledWith("id, page_id, name, data, updated_at");
    expect(mocks.chain.eq).toHaveBeenCalledWith("page_id", pageId);
    expect(mocks.chain.order).toHaveBeenCalledWith("name", { ascending: true });
  });

  it("atribuye un dataset dañado a su nombre", async () => {
    mocks.response.data = [
      row({ name: "Rotos", data: { columns: [], rows: [] } }),
      row({ id: secondDatasetId, name: "Productos" }),
    ];

    await expect(listPageDatasets(pageId)).rejects.toThrow(/«Rotos» está dañado/i);
  });

  it("propaga el error de Supabase al listar", async () => {
    mocks.response.error = { message: "permiso denegado" };

    await expect(listPageDatasets(pageId)).rejects.toThrow("permiso denegado");
  });

  it("carga un dataset por id", async () => {
    mocks.chain.maybeSingle.mockResolvedValue({ data: row(), error: null });

    await expect(getPageDatasetRecord(datasetId)).resolves.toMatchObject({
      id: datasetId,
      pageId,
      name: "Productos",
      dataset,
    });
    expect(mocks.chain.eq).toHaveBeenCalledWith("id", datasetId);
  });

  it("explica un dataset inexistente o ajeno", async () => {
    mocks.chain.maybeSingle.mockResolvedValue({ data: null, error: null });

    await expect(getPageDatasetRecord(datasetId)).rejects.toThrow(/No se encontró el dataset/i);
  });

  it("crea un dataset validado bajo el límite de 10", async () => {
    mocks.chain.single.mockResolvedValue({ data: row(), error: null });

    const created = await createPageDataset(pageId, "Productos", dataset);

    expect(created).toMatchObject({ id: datasetId, name: "Productos", dataset });
    expect(mocks.chain.select).toHaveBeenCalledWith("id", { count: "exact", head: true });
    expect(mocks.chain.insert).toHaveBeenCalledWith({
      page_id: pageId,
      name: "Productos",
      data: dataset,
    });
    expect(mocks.chain.single).toHaveBeenCalled();
  });

  it("reintenta con «nombre 2» si el nombre ya existe", async () => {
    mocks.chain.single
      .mockReset()
      .mockResolvedValueOnce({
        data: null,
        error: { code: "23505", message: "duplicate key" },
      })
      .mockResolvedValueOnce({
        data: row({ id: secondDatasetId, name: "Datos 2" }),
        error: null,
      });

    const created = await createPageDataset(pageId, "Datos", dataset);

    expect(created).toMatchObject({ id: secondDatasetId, name: "Datos 2" });
    expect(mocks.chain.insert).toHaveBeenNthCalledWith(1, {
      page_id: pageId,
      name: "Datos",
      data: dataset,
    });
    expect(mocks.chain.insert).toHaveBeenNthCalledWith(2, {
      page_id: pageId,
      name: "Datos 2",
      data: dataset,
    });
  });

  it("no crea más de 10 datasets por página", async () => {
    mocks.response.count = 10;

    await expect(createPageDataset(pageId, "Datos")).rejects.toThrow(/máximo 10 datasets/i);
    expect(mocks.chain.insert).not.toHaveBeenCalled();
  });

  it("valida el nombre y el dataset antes de crear", async () => {
    await expect(createPageDataset(pageId, "   ")).rejects.toThrow(/nombre del dataset/i);
    await expect(createPageDataset(pageId, "Productos", { columns: [], rows: [] })).rejects.toThrow(
      /al menos una columna/i,
    );
    expect(mocks.chain.insert).not.toHaveBeenCalled();
  });

  it("guarda datos y nombre por id y confirma la lectura", async () => {
    mocks.response.data = { id: datasetId };

    await savePageDataset(datasetId, dataset, "Catálogo");

    expect(mocks.chain.update).toHaveBeenCalledWith({ data: dataset, name: "Catálogo" });
    expect(mocks.chain.eq).toHaveBeenCalledWith("id", datasetId);
    expect(mocks.chain.select).toHaveBeenCalledWith("id");
    expect(mocks.chain.single).toHaveBeenCalled();
    expect(mocks.chain.maybeSingle).toHaveBeenCalled();
    expect(mocks.from).toHaveBeenCalledTimes(2);
  });

  it("no escribe un dataset inválido", async () => {
    await expect(
      savePageDataset(datasetId, { columns: [], rows: [] }, "Productos"),
    ).rejects.toThrow(/al menos una columna/i);
    expect(mocks.chain.update).not.toHaveBeenCalled();
  });

  it("explica una colisión de nombre al guardar", async () => {
    mocks.chain.single.mockResolvedValue({
      data: null,
      error: { code: "23505", message: "duplicate key" },
    });

    await expect(savePageDataset(datasetId, dataset, "Productos")).rejects.toThrow(
      /Ya existe un dataset con ese nombre/i,
    );
  });

  it("falla si la lectura de confirmación nunca ve la fila", async () => {
    vi.useFakeTimers();
    try {
      mocks.chain.maybeSingle.mockResolvedValue({ data: null, error: null });

      const promise = savePageDataset(datasetId, dataset, "Productos");
      const assertion = expect(promise).rejects.toThrow(/confirmar/i);
      await vi.advanceTimersByTimeAsync(1000);
      await assertion;
    } finally {
      vi.useRealTimers();
    }
  });

  it("renombra un dataset y explica la colisión", async () => {
    await renamePageDataset(datasetId, "  Catálogo  ");

    expect(mocks.chain.update).toHaveBeenCalledWith({ name: "Catálogo" });
    expect(mocks.chain.eq).toHaveBeenCalledWith("id", datasetId);

    mocks.chain.single.mockResolvedValue({
      data: null,
      error: { code: "23505", message: "duplicate key" },
    });
    await expect(renamePageDataset(datasetId, "Productos")).rejects.toThrow(/Ya existe/i);
  });

  it("elimina un dataset por id", async () => {
    await deletePageDataset(datasetId);

    expect(mocks.chain.delete).toHaveBeenCalled();
    expect(mocks.chain.eq).toHaveBeenCalledWith("id", datasetId);
  });

  it("propaga el error de Supabase al eliminar", async () => {
    mocks.response.error = { message: "fallo de borrado" };

    await expect(deletePageDataset(datasetId)).rejects.toThrow("fallo de borrado");
  });
});
