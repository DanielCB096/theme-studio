import { Mail } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { z } from "zod";

import { SiteHeader } from "@/components/layout/SiteHeader";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/features/auth/authStore";
import { safeRedirect } from "@/features/auth/redirect";
import { SupabaseSetupNotice } from "@/features/auth/SupabaseSetupNotice";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

const emailSchema = z.string().trim().email("Escribe un correo con formato válido.");

export default function SignInPage() {
  const status = useAuthStore((state) => state.status);
  const [email, setEmail] = useState("");
  const [phase, setPhase] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const redirect = safeRedirect(searchParams.get("redirect"));

  useEffect(() => {
    if (status === "authenticated") {
      navigate(redirect, { replace: true });
    }
  }, [status, redirect, navigate]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Correo no válido.");
      return;
    }
    if (!supabase) return;

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

  return (
    <div className="min-h-dvh bg-background">
      <SiteHeader />
      {!isSupabaseConfigured ? (
        <SupabaseSetupNotice />
      ) : (
        <main className="mx-auto w-full max-w-md p-6">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold leading-tight">Entrar</h2>
              <CardDescription>
                Te enviamos un enlace de un solo uso. Sin contraseñas que recordar.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-density">
              {phase === "sent" ? (
                <Alert variant="success">
                  <div className="space-y-1">
                    <AlertTitle>Revisa tu correo</AlertTitle>
                    <AlertDescription>
                      Si {email} tiene cuenta, recibirás un enlace para entrar. Puedes cerrar esta
                      pestaña: el enlace te traerá de vuelta.
                    </AlertDescription>
                  </div>
                </Alert>
              ) : (
                <form className="space-y-density" onSubmit={(event) => void handleSubmit(event)}>
                  <div className="space-y-1.5">
                    <Label htmlFor="email">Correo electrónico</Label>
                    <Input
                      id="email"
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
              )}

              <p className="text-center text-sm text-muted">
                <Link to="/" className="text-primary underline">
                  Seguir editando sin cuenta
                </Link>
              </p>
            </CardContent>
          </Card>
        </main>
      )}
    </div>
  );
}
