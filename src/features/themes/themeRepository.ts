import type { Json } from "@/types/database";

import { requireSupabase } from "@/lib/supabase";
import { themeSchema } from "@/lib/themeSchema";
import type { Theme, ThemeMode } from "@/types/theme";

export interface SavedThemeSummary {
  id: string;
  name: string;
  mode: ThemeMode;
  isPublic: boolean;
  updatedAt: string;
  isValid: boolean;
}

/** Lo mínimo que necesita el resumen; `data` puede venir sin validar. */
interface ThemeSummaryRow {
  id: string;
  name: string;
  data: unknown;
  is_public: boolean;
  updated_at: string;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}

/** Convierte una fila en tema validado. El nombre y el id de la fila mandan. */
export function themeFromRow(row: { id: string; name: string; data: unknown }): Theme {
  const parsed = themeSchema.safeParse(row.data);
  if (!parsed.success) {
    throw new Error(`El tema guardado "${row.name}" no es válido o está dañado.`);
  }
  return { ...parsed.data, id: row.id, name: row.name };
}

export function summaryFromRow(row: ThemeSummaryRow): SavedThemeSummary {
  const parsed = themeSchema.safeParse(row.data);
  return {
    id: row.id,
    name: row.name,
    mode: parsed.success ? parsed.data.mode : "light",
    isPublic: row.is_public,
    updatedAt: row.updated_at,
    isValid: parsed.success,
  };
}

const ROW_SELECT = "id, name, data, is_public, updated_at";

export async function listThemes(): Promise<SavedThemeSummary[]> {
  const client = requireSupabase();
  const { data, error } = await client
    .from("themes")
    .select(ROW_SELECT)
    .order("updated_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => summaryFromRow(row));
}

export async function getTheme(id: string): Promise<Theme> {
  const client = requireSupabase();
  const { data, error } = await client.from("themes").select(ROW_SELECT).eq("id", id).maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("No se encontró el tema o no tienes permiso para verlo.");
  return themeFromRow(data);
}

/**
 * Guarda el tema del usuario actual.
 *
 * - Si el id ya existe y es suyo, actualiza (RLS lo garantiza).
 * - Si no existe, está dañado o es de otro usuario, inserta una copia con un id
 *   nuevo. Así "guardar" nunca puede pisar un tema ajeno.
 */
export async function saveTheme(theme: Theme): Promise<Theme> {
  const client = requireSupabase();
  const { data: auth, error: authError } = await client.auth.getUser();
  if (authError) throw new Error(authError.message);
  const user = auth.user;
  if (!user) throw new Error("Inicia sesión para guardar el tema.");

  if (isUuid(theme.id)) {
    const { data: updated, error } = await client
      .from("themes")
      .update({ name: theme.name, data: theme as unknown as Json })
      .eq("id", theme.id)
      .select(ROW_SELECT)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (updated) return themeFromRow(updated);
  }

  const id = crypto.randomUUID();
  const normalized: Theme = { ...theme, id };

  const { data: inserted, error } = await client
    .from("themes")
    .insert({ id, user_id: user.id, name: theme.name, data: normalized as unknown as Json })
    .select(ROW_SELECT)
    .single();

  if (error) throw new Error(error.message);
  return themeFromRow(inserted);
}

export async function renameTheme(id: string, name: string): Promise<void> {
  const client = requireSupabase();
  const { error } = await client.from("themes").update({ name }).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteTheme(id: string): Promise<void> {
  const client = requireSupabase();
  const { error } = await client.from("themes").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function setThemeVisibility(id: string, isPublic: boolean): Promise<void> {
  const client = requireSupabase();
  const { error } = await client.from("themes").update({ is_public: isPublic }).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function duplicateTheme(id: string): Promise<Theme> {
  const original = await getTheme(id);
  const copy: Theme = {
    ...original,
    id: crypto.randomUUID(),
    name: `${original.name} (copia)`.slice(0, 80),
  };
  return saveTheme(copy);
}

export function shareUrl(id: string): string {
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  return `${origin}/t/${id}`;
}
