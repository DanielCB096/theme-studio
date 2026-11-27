import {
  DEFAULT_DATASET_NAME,
  MAX_DATASET_NAME_LENGTH,
  MAX_DATASETS_PER_PAGE,
  validateDatasetName,
  validatePageDataset,
} from "@/lib/datasetSchema";
import { requireSupabase } from "@/lib/supabase";
import type { Json } from "@/types/database";
import type { PageDataset, PageDatasetRecord } from "@/types/dataset";

import { emptyDataset } from "./datasetOps";

const ROW_SELECT = "id, page_id, name, data, updated_at";

const CONFIRM_ERROR = "No se pudo confirmar el guardado de los datos. Inténtalo de nuevo.";
const NAME_CONFLICT_ERROR = "Ya existe un dataset con ese nombre en esta página.";

interface DatasetRow {
  id: string;
  page_id: string;
  name: string;
  data: unknown;
  updated_at: string;
}

interface SupabaseError {
  code?: string;
  message: string;
}

/** Valida el JSON guardado; un dataset dañado se explica sin romper la pantalla. */
export function parseDatasetData(data: unknown): PageDataset {
  try {
    return validatePageDataset(data);
  } catch {
    throw new Error("Los datos de esta página están dañados o tienen un formato no válido.");
  }
}

function recordFromRow(row: DatasetRow): PageDatasetRecord {
  try {
    return {
      id: row.id,
      pageId: row.page_id,
      name: row.name,
      dataset: parseDatasetData(row.data),
      updatedAt: row.updated_at,
    };
  } catch {
    throw new Error(`El dataset «${row.name}» está dañado o tiene un formato no válido.`);
  }
}

function nameConflict(error: SupabaseError | null): boolean {
  return error?.code === "23505";
}

/** Añade « 2», « 3»… sin superar el máximo de longitud del nombre. */
function numberedName(name: string, attempt: number): string {
  const suffix = ` ${attempt}`;
  return `${name.slice(0, MAX_DATASET_NAME_LENGTH - suffix.length).trimEnd()}${suffix}`;
}

/** Describe el error de escritura, priorizando la colisión de nombre. */
function writeError(error: SupabaseError): Error {
  if (nameConflict(error)) return new Error(NAME_CONFLICT_ERROR);
  return new Error(error.code === "PGRST116" ? CONFIRM_ERROR : error.message);
}

/**
 * Lista los datasets de una página ordenados por nombre. Un `data` dañado no
 * se devuelve parcialmente: se explica qué dataset hay que corregir.
 */
export async function listPageDatasets(pageId: string): Promise<PageDatasetRecord[]> {
  const client = requireSupabase();
  const { data, error } = await client
    .from("page_datasets")
    .select(ROW_SELECT)
    .eq("page_id", pageId)
    .order("name", { ascending: true })
    .order("id", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []).map(recordFromRow);
}

/** Carga un dataset concreto por su id. */
export async function getPageDatasetRecord(id: string): Promise<PageDatasetRecord> {
  const client = requireSupabase();
  const { data, error } = await client
    .from("page_datasets")
    .select(ROW_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("No se encontró el dataset o no tienes permiso para verlo.");
  return recordFromRow(data);
}

/**
 * Crea un dataset en la página. Si el nombre ya existe, reintenta con
 * «nombre 2», «nombre 3»… El máximo de 10 se comprueba antes de insertar; dos
 * pestañas podrían superarlo a la vez porque Postgres no impone ese límite.
 */
export async function createPageDataset(
  pageId: string,
  name: string = DEFAULT_DATASET_NAME,
  dataset: PageDataset = emptyDataset(),
): Promise<PageDatasetRecord> {
  const parsedName = validateDatasetName(name);
  const parsedDataset = validatePageDataset(dataset);
  const client = requireSupabase();

  const { count, error: countError } = await client
    .from("page_datasets")
    .select("id", { count: "exact", head: true })
    .eq("page_id", pageId);

  if (countError) throw new Error(countError.message);
  if ((count ?? 0) >= MAX_DATASETS_PER_PAGE) {
    throw new Error(`Una página admite como máximo ${MAX_DATASETS_PER_PAGE} datasets.`);
  }

  for (let attempt = 1; attempt <= MAX_DATASETS_PER_PAGE; attempt += 1) {
    const candidate = attempt === 1 ? parsedName : numberedName(parsedName, attempt);
    const { data, error } = await client
      .from("page_datasets")
      .insert({
        page_id: pageId,
        name: candidate,
        data: parsedDataset as unknown as Json,
      })
      .select(ROW_SELECT)
      .single();

    if (!error && data) return recordFromRow(data);
    if (!nameConflict(error)) {
      throw new Error(error?.message ?? "No se pudo crear el dataset.");
    }
  }

  throw new Error("No se pudo encontrar un nombre libre para el dataset.");
}

/**
 * Guarda datos y nombre de un dataset existente. Pide la fila devuelta y
 * confirma la lectura antes de dar éxito: PostgREST puede responder antes de
 * que la transacción sea visible y el usuario recargaría sin sus datos.
 */
export async function savePageDataset(
  id: string,
  dataset: PageDataset,
  name: string,
): Promise<void> {
  const parsedDataset = validatePageDataset(dataset);
  const parsedName = validateDatasetName(name);
  const client = requireSupabase();

  const { data, error } = await client
    .from("page_datasets")
    .update({ data: parsedDataset as unknown as Json, name: parsedName })
    .eq("id", id)
    .select("id")
    .single();

  if (error) throw writeError(error);
  if (!data) throw new Error(CONFIRM_ERROR);

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const { data: confirmed, error: confirmError } = await client
      .from("page_datasets")
      .select("id")
      .eq("id", id)
      .maybeSingle();

    if (confirmError) throw new Error(confirmError.message);
    if (confirmed) return;
    await new Promise((resolve) => setTimeout(resolve, 150));
  }

  throw new Error(CONFIRM_ERROR);
}

/** Renombra un dataset sin tocar sus datos. */
export async function renamePageDataset(id: string, name: string): Promise<void> {
  const parsedName = validateDatasetName(name);
  const client = requireSupabase();
  const { data, error } = await client
    .from("page_datasets")
    .update({ name: parsedName })
    .eq("id", id)
    .select("id")
    .single();

  if (error) throw writeError(error);
  if (!data) throw new Error(CONFIRM_ERROR);
}

/** Elimina un dataset; las tablas que lo referencien dejan de mostrar datos. */
export async function deletePageDataset(id: string): Promise<void> {
  const client = requireSupabase();
  const { error } = await client.from("page_datasets").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
