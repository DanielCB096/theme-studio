import { BrowserRouter, Route, Routes } from "react-router-dom";

import { AuthSync } from "@/features/auth/AuthSync";
import { ProtectedRoute } from "@/features/auth/ProtectedRoute";
import EditorPage from "@/pages/EditorPage";
import NotFoundPage from "@/pages/NotFoundPage";
import SharedThemePage from "@/pages/SharedThemePage";
import SignInPage from "@/pages/SignInPage";
import ThemesPage from "@/pages/ThemesPage";

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthSync />
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
    </BrowserRouter>
  );
}
