/**
 * Solo acepta rutas internas. Evita que `?redirect=//evil.example` saque al
 * usuario de la aplicación tras iniciar sesión (open redirect).
 */
export function safeRedirect(raw: string | null | undefined): string {
  if (!raw) return "/temas";
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.includes("\\")) return "/temas";
  return raw;
}
