import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const saveBuilder = {
    select: vi.fn(),
    single: vi.fn(),
  };
  saveBuilder.select.mockReturnValue(saveBuilder);

  const query = {
    select: vi.fn(),
    eq: vi.fn(),
    maybeSingle: vi.fn(),
    upsert: vi.fn(() => saveBuilder),
  };
  query.select.mockReturnValue(query);
  query.eq.mockReturnValue(query);

  return { query, saveBuilder, from: vi.fn(() => query) };
});

vi.mock("@/lib/supabase", () => ({
  requireSupabase: () => ({ from: mocks.from }),
}));

import {
  getPageDataset,
  parseDatasetData,
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

beforeEach(() => {
  vi.clearAllMocks();
  mocks.query.select.mockReturnValue(mocks.query);
  mocks.query.eq.mockReturnValue(mocks.query);
  mocks.query.upsert.mockReturnValue(mocks.saveBuilder);
  mocks.saveBuilder.select.mockReturnValue(mocks.saveBuilder);
  mocks.saveBuilder.single.mockReset();
  mocks.saveBuilder.single.mockResolvedValue({ data: { page_id: "page-1" }, error: null });
  mocks.query.maybeSingle.mockReset();
  mocks.query.maybeSingle.mockResolvedValue({ data: { page_id: "page-1" }, error: null });
});

describe("datasetRepository", () => {
  it("parsea un dataset válido", () => {
    expect(parseDatasetData(dataset)).toEqual(dataset);
  });

  it("explica un dataset dañado", () => {
    expect(() => parseDatasetData({ columns: [], rows: [] })).toThrow(/dañados/i);
    expect(() => parseDatasetData(42)).toThrow(/dañados/i);
  });

  it("carga el dataset de una página", async () => {
    mocks.query.maybeSingle.mockResolvedValue({ data: { data: dataset }, error: null });

    await expect(getPageDataset("page-1")).resolves.toEqual(dataset);

    expect(mocks.from).toHaveBeenCalledWith("page_datasets");
    expect(mocks.query.select).toHaveBeenCalledWith("data");
    expect(mocks.query.eq).toHaveBeenCalledWith("page_id", "page-1");
    expect(mocks.query.maybeSingle).toHaveBeenCalled();
  });

  it("devuelve null si la página todavía no tiene datos", async () => {
    mocks.query.maybeSingle.mockResolvedValue({ data: null, error: null });

    await expect(getPageDataset("page-1")).resolves.toBeNull();
  });

  it("propaga el error de Supabase al cargar", async () => {
    mocks.query.maybeSingle.mockResolvedValue({
      data: null,
      error: { message: "permiso denegado" },
    });

    await expect(getPageDataset("page-1")).rejects.toThrow("permiso denegado");
  });

  it("hace upsert validado, pide la fila y confirma la lectura", async () => {
    await savePageDataset("page-1", dataset);

    expect(mocks.query.upsert).toHaveBeenCalledWith(
      { page_id: "page-1", data: dataset },
      { onConflict: "page_id" },
    );
    expect(mocks.saveBuilder.select).toHaveBeenCalledWith("page_id");
    expect(mocks.saveBuilder.single).toHaveBeenCalled();
    expect(mocks.query.select).toHaveBeenCalledWith("page_id");
    expect(mocks.query.eq).toHaveBeenCalledWith("page_id", "page-1");
    expect(mocks.from).toHaveBeenCalledTimes(2);
  });

  it("no escribe un dataset inválido", async () => {
    await expect(savePageDataset("page-1", { columns: [], rows: [] })).rejects.toThrow(
      /al menos una columna/i,
    );
    expect(mocks.query.upsert).not.toHaveBeenCalled();
  });

  it("propaga el error de Supabase al guardar", async () => {
    mocks.saveBuilder.single.mockResolvedValue({
      data: null,
      error: { message: "fallo de escritura" },
    });

    await expect(savePageDataset("page-1", dataset)).rejects.toThrow("fallo de escritura");
  });

  it("explica un upsert sin fila devuelta", async () => {
    mocks.saveBuilder.single.mockResolvedValue({
      data: null,
      error: { code: "PGRST116", message: "sin filas" },
    });

    await expect(savePageDataset("page-1", dataset)).rejects.toThrow(/confirmar/i);
  });

  it("falla si la lectura de confirmación nunca ve la fila", async () => {
    vi.useFakeTimers();
    try {
      mocks.query.maybeSingle.mockResolvedValue({ data: null, error: null });

      const promise = savePageDataset("page-1", dataset);
      const assertion = expect(promise).rejects.toThrow(/confirmar/i);
      await vi.advanceTimersByTimeAsync(1000);
      await assertion;
    } finally {
      vi.useRealTimers();
    }
  });
});
