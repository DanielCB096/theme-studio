import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import { AuthSync } from "@/features/auth/AuthSync";
import { ProtectedRoute } from "@/features/auth/ProtectedRoute";
import EditorPage from "@/pages/EditorPage";

const SignInPage = lazy(() => import("@/pages/SignInPage"));
const ThemesPage = lazy(() => import("@/pages/ThemesPage"));
const SharedThemePage = lazy(() => import("@/pages/SharedThemePage"));
const PagesPage = lazy(() => import("@/pages/PagesPage"));
const PageBuilderPage = lazy(() => import("@/pages/PageBuilderPage"));
const SubmissionsPage = lazy(() => import("@/pages/SubmissionsPage"));
const DatasetsPage = lazy(() => import("@/pages/DatasetsPage"));
const DatasetPage = lazy(() => import("@/pages/DatasetPage"));
const PublicPage = lazy(() => import("@/pages/PublicPage"));
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
          <Route
            path="/pages"
            element={
              <ProtectedRoute>
                <PagesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/builder"
            element={
              <ProtectedRoute>
                <PageBuilderPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/builder/:id"
            element={
              <ProtectedRoute>
                <PageBuilderPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pages/:id/datos"
            element={
              <ProtectedRoute>
                <DatasetsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pages/:id/datos/:datasetId"
            element={
              <ProtectedRoute>
                <DatasetPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pages/:id/respuestas"
            element={
              <ProtectedRoute>
                <SubmissionsPage />
              </ProtectedRoute>
            }
          />
          <Route path="/p/:slug" element={<PublicPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
