import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { SiteHeader } from "@/components/layout/SiteHeader";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MagicLinkForm } from "@/features/auth/MagicLinkForm";
import { PasswordForm } from "@/features/auth/PasswordForm";
import { useAuthStore } from "@/features/auth/authStore";
import { safeRedirect } from "@/features/auth/redirect";
import { SupabaseSetupNotice } from "@/features/auth/SupabaseSetupNotice";
import { isSupabaseConfigured } from "@/lib/supabase";

type SignInMode = "magic" | "password";

export default function SignInPage() {
  const status = useAuthStore((state) => state.status);
  const [mode, setMode] = useState<SignInMode>("magic");
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const redirect = safeRedirect(searchParams.get("redirect"));

  useEffect(() => {
    if (status === "authenticated") {
      navigate(redirect, { replace: true });
    }
  }, [status, redirect, navigate]);

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
                Usa un enlace de un solo uso o tu correo y contraseña. Elige lo que te resulte más
                cómodo.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-density">
              <Tabs
                value={mode}
                onValueChange={(value) => {
                  if (value === "magic" || value === "password") setMode(value);
                }}
              >
                <TabsList aria-label="Método de acceso" className="w-full">
                  <TabsTrigger value="magic" className="flex-1">
                    Enlace mágico
                  </TabsTrigger>
                  <TabsTrigger value="password" className="flex-1">
                    Contraseña
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="magic">
                  <MagicLinkForm />
                </TabsContent>
                <TabsContent value="password">
                  <PasswordForm />
                </TabsContent>
              </Tabs>

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
