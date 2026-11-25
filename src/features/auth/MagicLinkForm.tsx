import { Mail } from "lucide-react";
import { useState, type FormEvent } from "react";
import { z } from "zod";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";

const emailSchema = z.string().trim().email("Escribe un correo con formato válido.");

export function MagicLinkForm() {
  const [email, setEmail] = useState("");
  const [phase, setPhase] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Correo no válido.");
      return;
    }
    if (!supabase) {
      setError("Supabase no está configurado.");
      return;
    }

    setPhase("sending");
    setError(null);

    const { error: signInError } = await supabase.auth.signInWithOtp({
      email: parsed.data,
      options: { emailRedirectTo: `${window.location.origin}/entrar` },
    });

    if (signInError) {
      setError(signInError.message);
      setPhase("idle");
      return;
    }
    setPhase("sent");
  };

  if (phase === "sent") {
    return (
      <Alert variant="success">
        <div className="space-y-1">
          <AlertTitle>Revisa tu correo</AlertTitle>
          <AlertDescription>
            Si {email} tiene cuenta, recibirás un enlace para entrar. Puedes cerrar esta pestaña: el
            enlace te traerá de vuelta.
          </AlertDescription>
        </div>
      </Alert>
    );
  }

  return (
    <form className="space-y-density" onSubmit={(event) => void handleSubmit(event)}>
      <div className="space-y-1.5">
        <Label htmlFor="magic-email">Correo electrónico</Label>
        <Input
          id="magic-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="tu@correo.com"
          required
        />
      </div>

      {error ? (
        <Alert variant="danger">
          <div className="space-y-1">
            <AlertTitle>No se pudo enviar el enlace</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </div>
        </Alert>
      ) : null}

      <Button type="submit" className="w-full" disabled={phase === "sending"}>
        <Mail aria-hidden="true" className="h-4 w-4" />
        {phase === "sending" ? "Enviando…" : "Enviar enlace de acceso"}
      </Button>
    </form>
  );
}
