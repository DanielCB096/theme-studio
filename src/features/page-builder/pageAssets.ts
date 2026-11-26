import { requireSupabase } from "@/lib/supabase";

export const PAGE_ASSET_BUCKET = "page-assets";
export const MAX_PAGE_ASSET_BYTES = 1_048_576;

/** Sin SVG en el MVP: puede contener scripts y requeriría sanearlo. */
export const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;

const EXTENSIONS: Record<(typeof ALLOWED_IMAGE_TYPES)[number], string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

export type ImageValidation = { ok: true; extension: string } | { ok: false; message: string };

export function validatePageImage(file: Pick<File, "type" | "size">): ImageValidation {
  const extension = EXTENSIONS[file.type as (typeof ALLOWED_IMAGE_TYPES)[number]];
  if (!extension) {
    return { ok: false, message: "Formato no permitido. Usa PNG, JPEG o WebP." };
  }
  if (file.size <= 0) {
    return { ok: false, message: "El archivo está vacío." };
  }
  if (file.size > MAX_PAGE_ASSET_BYTES) {
    return { ok: false, message: "El archivo supera 1 MB." };
  }
  return { ok: true, extension };
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Ruta con la carpeta del usuario primero, como exige la política RLS. */
export function buildPageAssetPath(
  userId: string,
  pageId: string | null,
  extension: string,
): string {
  const folder = pageId && UUID_PATTERN.test(pageId) ? pageId : "draft";
  return `${userId}/pages/${folder}/${crypto.randomUUID()}.${extension}`;
}

/**
 * Sube una imagen al bucket público y devuelve su URL. Las políticas de
 * Storage solo permiten escribir dentro de la carpeta del usuario.
 */
export async function uploadPageAsset(file: File, pageId: string | null): Promise<string> {
  const validation = validatePageImage(file);
  if (!validation.ok) throw new Error(validation.message);

  const client = requireSupabase();
  const { data: auth, error: authError } = await client.auth.getUser();
  if (authError) throw new Error(authError.message);
  const user = auth.user;
  if (!user) throw new Error("Inicia sesión para subir imágenes.");

  const path = buildPageAssetPath(user.id, pageId, validation.extension);
  const { error } = await client.storage.from(PAGE_ASSET_BUCKET).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (error) throw new Error(error.message);

  const { data } = client.storage.from(PAGE_ASSET_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
