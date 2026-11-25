import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import type { Database } from "@/types/database";

const envSchema = z.object({
  VITE_SUPABASE_URL: z.string().url("VITE_SUPABASE_URL debe ser una URL"),
  VITE_SUPABASE_ANON_KEY: z.string().min(20, "VITE_SUPABASE_ANON_KEY parece incompleta"),
});

export type SupabaseConfig = { url: string; anonKey: string };

/** Valida el entorno sin lanzar: la app debe funcionar también sin Supabase. */
export function parseSupabaseEnv(env: Record<string, unknown>): SupabaseConfig | null {
  const parsed = envSchema.safeParse(env);
  if (!parsed.success) return null;
  return { url: parsed.data.VITE_SUPABASE_URL, anonKey: parsed.data.VITE_SUPABASE_ANON_KEY };
}

export const supabaseConfig = parseSupabaseEnv(import.meta.env);

export const isSupabaseConfigured = supabaseConfig !== null;

/**
 * Cliente único. Solo usa la clave `anon`/publishable: RLS decide qué filas
 * ve cada usuario. Ninguna clave privilegiada entra en el bundle.
 */
export const supabase: SupabaseClient<Database> | null = supabaseConfig
  ? createClient<Database>(supabaseConfig.url, supabaseConfig.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

export function requireSupabase(): SupabaseClient<Database> {
  if (!supabase) {
    throw new Error(
      "Supabase no está configurado. Rellena VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en .env.",
    );
  }
  return supabase;
}
