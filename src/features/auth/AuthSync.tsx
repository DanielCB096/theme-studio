import { useEffect } from "react";

import { useAuthStore } from "@/features/auth/authStore";
import { supabase } from "@/lib/supabase";

/**
 * Mantiene el store de auth sincronizado con Supabase. Se monta una sola vez,
 * en la raíz de la aplicación. Si no hay configuración, no hace nada.
 */
export function AuthSync() {
  const setSession = useAuthStore((state) => state.setSession);

  useEffect(() => {
    if (!supabase) return;

    let active = true;

    void supabase.auth.getSession().then(({ data }) => {
      if (active) setSession(data.session);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, [setSession]);

  return null;
}
