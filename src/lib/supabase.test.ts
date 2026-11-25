import { describe, expect, it } from "vitest";

import { parseSupabaseEnv } from "@/lib/supabase";

describe("parseSupabaseEnv", () => {
  it("acepta URL y clave válidas", () => {
    expect(
      parseSupabaseEnv({
        VITE_SUPABASE_URL: "https://demo.supabase.co",
        VITE_SUPABASE_ANON_KEY: "sb_publishable_12345678901234567890",
      }),
    ).toEqual({
      url: "https://demo.supabase.co",
      anonKey: "sb_publishable_12345678901234567890",
    });
  });

  it("devuelve null si falta alguna variable", () => {
    expect(parseSupabaseEnv({})).toBeNull();
    expect(parseSupabaseEnv({ VITE_SUPABASE_URL: "https://demo.supabase.co" })).toBeNull();
  });

  it("rechaza una URL inválida o una clave corta", () => {
    expect(
      parseSupabaseEnv({
        VITE_SUPABASE_URL: "no-es-una-url",
        VITE_SUPABASE_ANON_KEY: "sb_publishable_12345678901234567890",
      }),
    ).toBeNull();

    expect(
      parseSupabaseEnv({
        VITE_SUPABASE_URL: "https://demo.supabase.co",
        VITE_SUPABASE_ANON_KEY: "corta",
      }),
    ).toBeNull();
  });
});
