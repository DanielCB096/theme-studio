import { describe, expect, it } from "vitest";

import { friendlyAuthError } from "@/features/auth/authErrors";

describe("friendlyAuthError", () => {
  it("traduce los errores frecuentes de Supabase", () => {
    expect(friendlyAuthError("Invalid login credentials")).toMatch(/incorrectos/i);
    expect(friendlyAuthError("Email not confirmed")).toMatch(/no está confirmado/i);
    expect(friendlyAuthError("User already registered")).toMatch(/ya existe/i);
    expect(friendlyAuthError("Signups not allowed for this instance")).toMatch(/deshabilitado/i);
  });

  it("deja pasar un mensaje desconocido tal cual", () => {
    expect(friendlyAuthError("Rate limit exceeded")).toBe("Rate limit exceeded");
  });
});
