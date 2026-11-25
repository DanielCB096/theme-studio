import { CopyPlus, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { SiteHeader } from "@/components/layout/SiteHeader";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/features/auth/authStore";
import { DeviceFrame } from "@/features/preview/DeviceFrame";
import { duplicateTheme, getTheme, isUuid } from "@/features/themes/themeRepository";
import { useThemeStore } from "@/store/themeStore";
import type { Theme } from "@/types/theme";

type LoadState =
  { status: "loading" } | { status: "error"; message: string } | { status: "ready"; theme: Theme };

export default function SharedThemePage() {
  const { id } = useParams<{ id: string }>();
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [duplicating, setDuplicating] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const status = useAuthStore((auth) => auth.status);
  const loadTheme = useThemeStore((store) => store.loadTheme);
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) {
      setState({ status: "error", message: "Falta el identificador del tema." });
      return;
    }
    if (!isUuid(id)) {
      setState({ status: "error", message: "El enlace no es válido." });
      return;
    }

    let active = true;
    setState({ status: "loading" });

    getTheme(id)
      .then((theme) => {
        if (active) setState({ status: "ready", theme });
      })
      .catch((cause: unknown) => {
        if (active) {
          setState({
            status: "error",
            message: cause instanceof Error ? cause.message : "No se pudo cargar el tema.",
          });
        }
      });

    return () => {
      active = false;
    };
  }, [id]);

  const handleDuplicate = async () => {
    if (!id) return;
    if (status !== "authenticated") {
      navigate(`/entrar?redirect=${encodeURIComponent(`/t/${id}`)}`);
      return;
    }

    setDuplicating(true);
    setActionError(null);
    try {
      const copy = await duplicateTheme(id);
      loadTheme(copy);
      navigate("/");
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : "No se pudo duplicar el tema.");
      setDuplicating(false);
    }
  };

  return (
    <div className="min-h-dvh bg-background">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl space-y-density p-density">
        {state.status === "loading" ? (
          <div role="status" className="flex items-center gap-2 p-8 text-sm text-muted">
            <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
            Cargando tema compartido…
          </div>
        ) : null}

        {state.status === "error" ? (
          <div className="space-y-density">
            <Alert variant="danger">
              <div className="space-y-1">
                <AlertTitle>No se pudo abrir el tema</AlertTitle>
                <AlertDescription>{state.message}</AlertDescription>
              </div>
            </Alert>
            <Button asChild variant="outline">
              <Link to="/">Ir al editor</Link>
            </Button>
          </div>
        ) : null}

        {state.status === "ready" ? (
          <>
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-semibold leading-tight">{state.theme.name}</h2>
                  <Badge variant="neutral">Solo lectura</Badge>
                  <Badge variant={state.theme.mode === "dark" ? "primary" : "neutral"}>
                    {state.theme.mode === "dark" ? "Oscuro" : "Claro"}
                  </Badge>
                </div>
                <p className="text-sm text-muted">
                  Tema público compartido. Duplícalo para editarlo en tu cuenta.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button asChild variant="outline">
                  <Link to="/">Crear el mío</Link>
                </Button>
                <Button onClick={() => void handleDuplicate()} disabled={duplicating}>
                  <CopyPlus aria-hidden="true" className="h-4 w-4" />
                  {duplicating ? "Duplicando…" : "Duplicar a mi cuenta"}
                </Button>
              </div>
            </div>

            {actionError ? (
              <Alert variant="danger">
                <AlertDescription>{actionError}</AlertDescription>
              </Alert>
            ) : null}

            <div className="flex justify-center">
              <DeviceFrame
                theme={state.theme}
                device="shared"
                label="Escritorio"
                width={1280}
                height={800}
              />
            </div>
          </>
        ) : null}
      </main>
    </div>
  );
}
