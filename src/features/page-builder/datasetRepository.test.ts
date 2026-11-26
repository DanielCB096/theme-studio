import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const query = {
    select: vi.fn(),
    eq: vi.fn(),
    maybeSingle: vi.fn(),
    upsert: vi.fn(),
  };
  query.select.mockReturnValue(query);
  query.eq.mockReturnValue(query);

  return { query, from: vi.fn(() => query) };
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

  it("hace upsert validado con onConflict por page_id", async () => {
    mocks.query.upsert.mockResolvedValue({ error: null });

    await savePageDataset("page-1", dataset);

    expect(mocks.query.upsert).toHaveBeenCalledWith(
      { page_id: "page-1", data: dataset },
      { onConflict: "page_id" },
    );
  });

  it("no escribe un dataset inválido", async () => {
    mocks.query.upsert.mockResolvedValue({ error: null });

    await expect(savePageDataset("page-1", { columns: [], rows: [] })).rejects.toThrow(
      /al menos una columna/i,
    );
    expect(mocks.query.upsert).not.toHaveBeenCalled();
  });

  it("propaga el error de Supabase al guardar", async () => {
    mocks.query.upsert.mockResolvedValue({ error: { message: "fallo de escritura" } });

    await expect(savePageDataset("page-1", dataset)).rejects.toThrow("fallo de escritura");
  });
});
