import { validatePageDataset } from "@/lib/datasetSchema";
import { requireSupabase } from "@/lib/supabase";
import type { Json } from "@/types/database";
import type { PageDataset } from "@/types/dataset";

/** Valida el JSON guardado; un dataset dañado se explica sin romper la pantalla. */
export function parseDatasetData(data: unknown): PageDataset {
  try {
    return validatePageDataset(data);
  } catch {
    throw new Error("Los datos de esta página están dañados o tienen un formato no válido.");
  }
}

/** Devuelve el dataset de la página o `null` si todavía no se han guardado datos. */
export async function getPageDataset(pageId: string): Promise<PageDataset | null> {
  const client = requireSupabase();
  const { data, error } = await client
    .from("page_datasets")
    .select("data")
    .eq("page_id", pageId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;
  return parseDatasetData(data.data);
}

/** Crea o reemplaza el dataset de la página; Zod valida antes de escribir. */
export async function savePageDataset(pageId: string, dataset: PageDataset): Promise<void> {
  const parsed = validatePageDataset(dataset);
  const client = requireSupabase();
  const { data, error } = await client
    .from("page_datasets")
    .upsert({ page_id: pageId, data: parsed as unknown as Json }, { onConflict: "page_id" })
    .select("page_id")
    .single();

  if (error) {
    throw new Error(
      error.code === "PGRST116"
        ? "No se pudo confirmar el guardado de los datos. Inténtalo de nuevo."
        : error.message,
    );
  }
  if (!data) {
    throw new Error("No se pudo confirmar el guardado de los datos. Inténtalo de nuevo.");
  }

  // PostgREST puede devolver la fila antes de que la transacción sea visible
  // para otra conexión. Se confirma la lectura para no mostrar «guardado» y
  // perder los datos si el usuario recarga de inmediato.
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const { data: confirmed, error: confirmError } = await client
      .from("page_datasets")
      .select("page_id")
      .eq("page_id", pageId)
      .maybeSingle();

    if (confirmError) throw new Error(confirmError.message);
    if (confirmed) return;
    await new Promise((resolve) => setTimeout(resolve, 150));
  }

  throw new Error("No se pudo confirmar el guardado de los datos. Inténtalo de nuevo.");
}
