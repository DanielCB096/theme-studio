/** Traduce los errores más frecuentes de Supabase Auth a mensajes accionables. */
export function friendlyAuthError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("invalid login credentials")) {
    return "Correo o contraseña incorrectos.";
  }
  if (lower.includes("email not confirmed")) {
    return "Tu correo aún no está confirmado. Revisa el mensaje de confirmación o pide que se desactive la confirmación en Supabase.";
  }
  if (lower.includes("user already registered")) {
    return "Ya existe una cuenta con ese correo. Pulsa «Entrar».";
  }
  if (lower.includes("password should be at least")) {
    return "La contraseña debe tener al menos 8 caracteres.";
  }
  if (lower.includes("signups not allowed")) {
    return "El registro está deshabilitado en este proyecto de Supabase.";
  }
  return message;
}
