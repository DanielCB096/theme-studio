import { Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";

import { useAuthStore } from "@/features/auth/authStore";
import { isSupabaseConfigured } from "@/lib/supabase";
import { SupabaseSetupNotice } from "@/features/auth/SupabaseSetupNotice";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const status = useAuthStore((state) => state.status);
  const location = useLocation();

  if (!isSupabaseConfigured) {
    return <SupabaseSetupNotice />;
  }

  if (status === "loading") {
    return (
      <div role="status" className="flex items-center justify-center gap-2 p-10 text-sm text-muted">
        <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
        Comprobando sesión…
      </div>
    );
  }

  if (status !== "authenticated") {
    const redirect = `${location.pathname}${location.search}`;
    return <Navigate to={`/entrar?redirect=${encodeURIComponent(redirect)}`} replace />;
  }

  return <>{children}</>;
}
