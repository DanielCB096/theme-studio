import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/aiPalette", () => ({ generatePalette: vi.fn() }));

import { PaletteGenerator } from "@/features/ai/PaletteGenerator";
import { generatePalette } from "@/lib/aiPalette";
import { contrastRatio } from "@/lib/contrast";
import { DEFAULT_THEME } from "@/lib/defaultThemes";
import { useThemeStore } from "@/store/themeStore";
import type { ThemeColors } from "@/types/theme";

const generated: ThemeColors = {
  primary: "#eeeeee",
  secondary: "#333333",
  background: "#ffffff",
  surface: "#ffffff",
  text: "#eeeeee",
  muted: "#dddddd",
  border: "#eeeeee",
  success: "#eeeeee",
  danger: "#eeeeee",
};

const mockGenerate = vi.mocked(generatePalette);

function resetStore() {
  useThemeStore.setState({
    theme: DEFAULT_THEME,
    past: [],
    future: [],
    lastMergeKey: null,
    lastCommitAt: 0,
  });
}

describe("PaletteGenerator", () => {
  beforeEach(() => {
    resetStore();
    mockGenerate.mockReset();
  });

  it("genera, corrige contraste y aplica la paleta", async () => {
    const user = userEvent.setup();
    mockGenerate.mockResolvedValue({ colors: generated, source: "gemini" });
    render(<PaletteGenerator />);

    await user.type(screen.getByLabelText("Describe la paleta"), "  desierto suave  ");
    await user.click(screen.getByRole("button", { name: "Generar paleta" }));

    expect(mockGenerate).toHaveBeenCalledWith("desierto suave");
    expect(await screen.findByText(/corregido para aa/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Aplicar paleta" }));

    const { colors } = useThemeStore.getState().theme;
    expect(contrastRatio(colors.text, colors.background)).toBeGreaterThanOrEqual(4.5);
    expect(colors.primary).not.toBe(generated.primary);
    expect(screen.getByRole("status")).toHaveTextContent(/paleta aplicada/i);
  });

  it("muestra el error del servidor sin modificar el tema", async () => {
    const user = userEvent.setup();
    mockGenerate.mockRejectedValue(new Error("Demasiadas peticiones."));
    render(<PaletteGenerator />);

    await user.type(screen.getByLabelText("Describe la paleta"), "prueba");
    await user.click(screen.getByRole("button", { name: "Generar paleta" }));

    expect(await screen.findByText("Demasiadas peticiones.")).toBeInTheDocument();
    expect(useThemeStore.getState().theme).toEqual(DEFAULT_THEME);
    expect(screen.queryByRole("button", { name: "Aplicar paleta" })).not.toBeInTheDocument();
  });

  it("valida el prompt antes de llamar a la IA", async () => {
    const user = userEvent.setup();
    render(<PaletteGenerator />);

    await user.click(screen.getByRole("button", { name: "Generar paleta" }));

    expect(screen.getByText(/al menos 3 caracteres/i)).toBeInTheDocument();
    expect(mockGenerate).not.toHaveBeenCalled();
  });

  it("avisa cuando la paleta viene del modo local", async () => {
    const user = userEvent.setup();
    mockGenerate.mockResolvedValue({ colors: generated, source: "local" });
    render(<PaletteGenerator />);

    await user.type(screen.getByLabelText("Describe la paleta"), "bosque");
    await user.click(screen.getByRole("button", { name: "Generar paleta" }));

    expect(await screen.findByText(/modo local \(sin ia\)/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Aplicar paleta" })).toBeInTheDocument();
  });

  it("permite descartar la propuesta", async () => {
    const user = userEvent.setup();
    mockGenerate.mockResolvedValue({ colors: generated, source: "gemini" });
    render(<PaletteGenerator />);

    await user.type(screen.getByLabelText("Describe la paleta"), "bosque");
    await user.click(screen.getByRole("button", { name: "Generar paleta" }));
    await screen.findByRole("button", { name: "Aplicar paleta" });

    await user.click(screen.getByRole("button", { name: "Descartar" }));
    expect(screen.queryByRole("button", { name: "Aplicar paleta" })).not.toBeInTheDocument();
    expect(useThemeStore.getState().theme).toEqual(DEFAULT_THEME);
  });
});
