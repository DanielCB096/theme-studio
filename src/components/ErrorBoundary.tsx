import { Component, type ErrorInfo, type ReactNode } from "react";

import { Button } from "@/components/ui/button";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * Red de seguridad global. Un error de render no debe dejar una pantalla en
 * blanco: se muestra un mensaje accionable y el detalle solo en desarrollo.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("ErrorBoundary:", error.message, info.componentStack);
  }

  override render(): ReactNode {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="grid min-h-dvh place-items-center bg-background p-6 text-fg">
        <div className="w-full max-w-md space-y-3 rounded-lg border bg-surface p-6 text-center shadow-panel">
          <p aria-hidden="true" className="text-3xl">
            ⚠️
          </p>
          <h1 className="text-lg font-semibold">Algo salió mal</h1>
          <p className="text-sm text-muted">
            La interfaz encontró un error inesperado. Los temas guardados en tu cuenta no se han
            modificado.
          </p>

          <div className="flex flex-wrap justify-center gap-2">
            <Button onClick={() => window.location.reload()}>Recargar la página</Button>
            <Button
              variant="outline"
              onClick={() => {
                window.location.href = "/";
              }}
            >
              Volver al inicio
            </Button>
          </div>

          {import.meta.env.DEV ? (
            <pre className="max-h-32 overflow-auto rounded-md border bg-background p-2 text-left text-xs text-muted">
              {error.message}
            </pre>
          ) : null}
        </div>
      </div>
    );
  }
}
