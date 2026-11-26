import type { Json } from "@/types/database";
import type { PageDocument } from "@/types/page";

import { pageDocumentSchema } from "@/lib/pageSchema";
import { requireSupabase } from "@/lib/supabase";

export interface SavedPageSummary {
  id: string;
  name: string;
  slug: string;
  isPublic: boolean;
  updatedAt: string;
  isValid: boolean;
}

const ROW_SELECT = "id, name, slug, data, is_public, updated_at";

interface PageRow {
  id: string;
  name: string;
  slug: string;
  data: unknown;
  is_public: boolean;
  updated_at: string;
}

export function slugifyPageName(name: string): string {
  const slug = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return slug || "pagina";
}

function suffix(): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 6);
}

export function pageFromRow(row: PageRow): PageDocument {
  const parsed = pageDocumentSchema.safeParse(row.data);
  if (!parsed.success) {
    throw new Error(`La página «${row.name}» está dañada o es de una versión anterior.`);
  }
  return { ...parsed.data, name: row.name };
}

export function summaryFromRow(row: PageRow): SavedPageSummary {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    isPublic: row.is_public,
    updatedAt: row.updated_at,
    isValid: pageDocumentSchema.safeParse(row.data).success,
  };
}

export async function listPages(): Promise<SavedPageSummary[]> {
  const client = requireSupabase();
  const { data, error } = await client
    .from("pages")
    .select(ROW_SELECT)
    .order("updated_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => summaryFromRow(row));
}

export async function getPage(id: string): Promise<PageDocument> {
  const record = await getPageRecord(id);
  return record.page;
}

export interface PageRecord {
  id: string;
  slug: string;
  isPublic: boolean;
  page: PageDocument;
}

export async function getPageRecord(id: string): Promise<PageRecord> {
  const client = requireSupabase();
  const { data, error } = await client
    .from("pages")
    .select(`${ROW_SELECT}, is_public`)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("No se encontró la página o no tienes permiso para verla.");
  return {
    id: data.id,
    slug: data.slug,
    isPublic: data.is_public,
    page: pageFromRow(data),
  };
}

export async function getPublicPage(slug: string): Promise<{ page: PageDocument; id: string }> {
  const client = requireSupabase();
  const { data, error } = await client
    .from("pages")
    .select(ROW_SELECT)
    .eq("slug", slug)
    .eq("is_public", true)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("La página no existe o no es pública.");
  return { page: pageFromRow(data), id: data.id };
}

/**
 * Crea o actualiza una página del usuario. Un fallo de unicidad de slug
 * reintenta con un sufijo aleatorio; nunca sobrescribe una página ajena.
 */
export async function savePage(
  page: PageDocument,
  existingId?: string | null,
): Promise<{ id: string; slug: string }> {
  const parsed = pageDocumentSchema.safeParse(page);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "La página no es válida.");
  }

  const client = requireSupabase();
  const { data: auth, error: authError } = await client.auth.getUser();
  if (authError) throw new Error(authError.message);
  const user = auth.user;
  if (!user) throw new Error("Inicia sesión para guardar la página.");

  const data = parsed.data as unknown as Json;
  const theme = parsed.data.theme as unknown as Json;

  if (existingId) {
    const { data: updated, error } = await client
      .from("pages")
      .update({ name: parsed.data.name, data, theme })
      .eq("id", existingId)
      .select("id, slug")
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!updated) throw new Error("La página no existe o no es tuya.");
    return updated;
  }

  const base = slugifyPageName(parsed.data.name);
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const slug = attempt === 0 ? base : `${base}-${suffix()}`;
    const { data: inserted, error } = await client
      .from("pages")
      .insert({
        user_id: user.id,
        name: parsed.data.name,
        slug,
        data,
        theme,
      })
      .select("id, slug")
      .single();

    if (!error && inserted) return inserted;
    if (error?.code !== "23505") throw new Error(error?.message ?? "No se pudo guardar la página.");
  }

  throw new Error("No se pudo reservar un slug único para la página.");
}

export async function setPageVisibility(id: string, isPublic: boolean): Promise<void> {
  const client = requireSupabase();
  const { error } = await client.from("pages").update({ is_public: isPublic }).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deletePage(id: string): Promise<void> {
  const client = requireSupabase();
  const { error } = await client.from("pages").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export function publicPageUrl(slug: string): string {
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  return `${origin}/p/${slug}`;
}
