import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";

import { ProtectedRoute } from "@/features/auth/ProtectedRoute";
import { SaveThemeDialog } from "@/features/themes/SaveThemeDialog";
import { DEFAULT_THEME } from "@/lib/defaultThemes";
import SharedThemePage from "@/pages/SharedThemePage";
import SignInPage from "@/pages/SignInPage";
import { useThemeStore } from "@/store/themeStore";

function resetStore() {
  useThemeStore.setState({
    theme: DEFAULT_THEME,
    past: [],
    future: [],
    lastMergeKey: null,
    lastCommitAt: 0,
  });
}

describe("rutas y sesión sin Supabase configurado", () => {
  beforeEach(resetStore);

  it("protege /temas y explica cómo configurar Supabase", () => {
    render(
      <MemoryRouter initialEntries={["/temas"]}>
        <ProtectedRoute>
          <div>contenido privado</div>
        </ProtectedRoute>
      </MemoryRouter>,
    );

    expect(screen.getByText(/supabase no está configurado/i)).toBeInTheDocument();
    expect(screen.queryByText("contenido privado")).not.toBeInTheDocument();
  });

  it("la pantalla de acceso muestra la configuración pendiente", () => {
    render(
      <MemoryRouter initialEntries={["/entrar"]}>
        <SignInPage />
      </MemoryRouter>,
    );

    expect(screen.getByText(/supabase no está configurado/i)).toBeInTheDocument();
  });

  it("el diálogo de guardar avisa de que falta configuración", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <SaveThemeDialog />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button", { name: "Guardar" }));
    expect(screen.getByText(/supabase no está configurado/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Guardar tema" })).not.toBeInTheDocument();
  });

  it("un enlace compartido inválido no consulta la base de datos", () => {
    render(
      <MemoryRouter initialEntries={["/t/no-es-un-uuid"]}>
        <Routes>
          <Route path="/t/:id" element={<SharedThemePage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText(/el enlace no es válido/i)).toBeInTheDocument();
  });
});
