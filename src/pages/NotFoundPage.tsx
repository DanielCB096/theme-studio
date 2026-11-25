import { Link } from "react-router-dom";

import { SiteHeader } from "@/components/layout/SiteHeader";
import { Button } from "@/components/ui/button";

export default function NotFoundPage() {
  return (
    <div className="min-h-dvh bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-md space-y-density p-8 text-center">
        <p className="font-mono text-4xl font-semibold text-muted">404</p>
        <h2 className="text-xl font-semibold">Esta página no existe</h2>
        <p className="text-sm text-muted">
          Puede que el enlace esté mal escrito o que el tema se haya eliminado.
        </p>
        <Button asChild>
          <Link to="/">Volver al editor</Link>
        </Button>
      </main>
    </div>
  );
}
