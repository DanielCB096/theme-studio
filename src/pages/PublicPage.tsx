import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { PageRenderer } from "@/features/page-builder/PageRenderer";
import { getPublicPage } from "@/features/page-builder/pageRepository";
import type { PageDocument } from "@/types/page";

type State =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; page: PageDocument };

export default function PublicPage() {
  const { slug } = useParams<{ slug: string }>();
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    if (!slug) {
      setState({ status: "error", message: "Falta el identificador de la página." });
      return;
    }

    let active = true;
    setState({ status: "loading" });

    getPublicPage(slug)
      .then(({ page }) => {
        if (!active) return;
        document.title = `${page.name} · Theme Studio`;
        setState({ status: "ready", page });
      })
      .catch((cause: unknown) => {
        if (active) {
          setState({
            status: "error",
            message: cause instanceof Error ? cause.message : "No se pudo cargar la página.",
          });
        }
      });

    return () => {
      active = false;
    };
  }, [slug]);

  if (state.status === "loading") {
    return (
      <div
        role="status"
        className="grid min-h-dvh place-items-center bg-background text-sm text-muted"
      >
        <span className="flex items-center gap-2">
          <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
          Cargando página…
        </span>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="grid min-h-dvh place-items-center bg-background p-density">
        <div className="w-full max-w-md space-y-density">
          <Alert variant="danger">
            <div className="space-y-1">
              <AlertTitle>No se pudo abrir la página</AlertTitle>
              <AlertDescription>{state.message}</AlertDescription>
            </div>
          </Alert>
          <Button asChild variant="outline">
            <Link to="/">Ir a Theme Studio</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <PageRenderer page={state.page} />
    </div>
  );
}
