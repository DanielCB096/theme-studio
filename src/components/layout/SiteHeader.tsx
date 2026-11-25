import { LogOut } from "lucide-react";
import { Link, NavLink, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/features/auth/authStore";
import { cn } from "@/lib/utils";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    "rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
    isActive ? "bg-primary text-primary-contrast" : "text-muted hover:bg-background hover:text-fg",
  );

/** Cabecera común: marca, navegación y sesión. */
export function SiteHeader() {
  const status = useAuthStore((state) => state.status);
  const user = useAuthStore((state) => state.user);

  return (
    <header className="border-b bg-surface">
      <div className="flex flex-wrap items-center gap-3 px-density py-2.5">
        <Link
          to="/"
          className="flex items-baseline gap-2 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <h1 className="text-lg font-semibold tracking-tight">Theme Studio</h1>
          <span className="hidden text-xs text-muted sm:inline">editor de temas</span>
        </Link>

        <nav aria-label="Principal" className="ml-auto flex items-center gap-1">
          {status === "authenticated" ? (
            <>
              <NavLink to="/temas" className={navLinkClass}>
                Mis temas
              </NavLink>
              <NavLink to="/pages" className={navLinkClass}>
                Páginas
              </NavLink>
            </>
          ) : null}
        </nav>

        <div className="flex items-center gap-2">
          {status === "authenticated" && user ? (
            <>
              <span className="hidden max-w-[180px] truncate text-xs text-muted md:inline">
                {user.email}
              </span>
              <SignOutButton />
            </>
          ) : null}

          {status === "anonymous" ? (
            <Link
              to="/entrar"
              className="rounded-md px-2.5 py-1.5 text-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              Entrar
            </Link>
          ) : null}
        </div>
      </div>
    </header>
  );
}

function SignOutButton() {
  const signOut = useAuthStore((state) => state.signOut);
  const navigate = useNavigate();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => {
        void signOut().then(() => navigate("/"));
      }}
    >
      <LogOut aria-hidden="true" className="h-4 w-4" />
      Salir
    </Button>
  );
}
