import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import { AuthSync } from "@/features/auth/AuthSync";
import { ProtectedRoute } from "@/features/auth/ProtectedRoute";
import EditorPage from "@/pages/EditorPage";

const SignInPage = lazy(() => import("@/pages/SignInPage"));
const ThemesPage = lazy(() => import("@/pages/ThemesPage"));
const SharedThemePage = lazy(() => import("@/pages/SharedThemePage"));
const NotFoundPage = lazy(() => import("@/pages/NotFoundPage"));

function RouteFallback() {
  return (
    <div
      role="status"
      className="grid min-h-dvh place-items-center bg-background text-sm text-muted"
    >
      Cargando…
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthSync />
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<EditorPage />} />
          <Route path="/entrar" element={<SignInPage />} />
          <Route
            path="/temas"
            element={
              <ProtectedRoute>
                <ThemesPage />
              </ProtectedRoute>
            }
          />
          <Route path="/t/:id" element={<SharedThemePage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
