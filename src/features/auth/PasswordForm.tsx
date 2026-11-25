import { LogIn, UserPlus } from "lucide-react";
import { useState, type FormEvent } from "react";
import { z } from "zod";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { friendlyAuthError } from "@/features/auth/authErrors";
import { supabase } from "@/lib/supabase";

const credentialsSchema = z.object({
  email: z.string().trim().email("Escribe un correo con formato válido."),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres."),
});

export function PasswordForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState<"signin" | "signup" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const validate = (): { email: string; password: string } | null => {
    const parsed = credentialsSchema.safeParse({ email, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Revisa los datos.");
      return null;
    }
    return parsed.data;
  };

  const handleSignIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNotice(null);
    const data = validate();
    if (!data || !supabase) return;

    setBusy("signin");
    setError(null);
    const { error: signInError } = await supabase.auth.signInWithPassword(data);
    if (signInError) {
      setError(friendlyAuthError(signInError.message));
    }
    setBusy(null);
    // Si funciona, AuthSync actualiza la sesión y la página redirige.
  };

  const handleSignUp = async () => {
    setNotice(null);
    const data = validate();
    if (!data || !supabase) return;

    setBusy("signup");
    setError(null);
    const { data: result, error: signUpError } = await supabase.auth.signUp({
      ...data,
      options: { emailRedirectTo: `${window.location.origin}/entrar` },
    });

    if (signUpError) {
      setError(friendlyAuthError(signUpError.message));
      setBusy(null);
      return;
    }

    if (!result.session) {
      setNotice(
        "Cuenta creada, pero falta confirmar el correo. Revisa tu bandeja o desactiva «Confirm email» en Supabase para probar sin ese paso.",
      );
    }
    setBusy(null);
  };

  return (
    <form className="space-y-density" onSubmit={(event) => void handleSignIn(event)}>
      <div className="space-y-1.5">
        <Label htmlFor="password-email">Correo electrónico</Label>
        <Input
          id="password-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="tu@correo.com"
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password">Contraseña</Label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Mínimo 8 caracteres"
          required
        />
      </div>

      {error ? (
        <Alert variant="danger">
          <div className="space-y-1">
            <AlertTitle>No se pudo completar</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </div>
        </Alert>
      ) : null}

      {notice ? (
        <Alert variant="success">
          <div className="space-y-1">
            <AlertTitle>Cuenta creada</AlertTitle>
            <AlertDescription>{notice}</AlertDescription>
          </div>
        </Alert>
      ) : null}

      <div className="space-y-2">
        <Button type="submit" className="w-full" disabled={busy !== null}>
          <LogIn aria-hidden="true" className="h-4 w-4" />
          {busy === "signin" ? "Entrando…" : "Entrar"}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="w-full"
          disabled={busy !== null}
          onClick={() => void handleSignUp()}
        >
          <UserPlus aria-hidden="true" className="h-4 w-4" />
          {busy === "signup" ? "Creando cuenta…" : "Crear cuenta con estos datos"}
        </Button>
      </div>
    </form>
  );
}
