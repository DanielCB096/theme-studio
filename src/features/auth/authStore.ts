import type { Session, User } from "@supabase/supabase-js";
import { create } from "zustand";

import { isSupabaseConfigured, supabase } from "@/lib/supabase";

export type AuthStatus = "loading" | "anonymous" | "authenticated" | "disabled";

interface AuthState {
  status: AuthStatus;
  user: User | null;
  session: Session | null;
  setSession: (session: Session | null) => void;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  status: isSupabaseConfigured ? "loading" : "disabled",
  user: null,
  session: null,

  setSession: (session) =>
    set({
      session,
      user: session?.user ?? null,
      status: session ? "authenticated" : "anonymous",
    }),

  signOut: async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    set({ session: null, user: null, status: "anonymous" });
  },
}));
