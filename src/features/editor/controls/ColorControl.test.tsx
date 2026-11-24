import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

import { ColorControl } from "@/features/editor/controls/ColorControl";
import { DEFAULT_THEME } from "@/lib/defaultThemes";
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

describe("ColorControl", () => {
  beforeEach(resetStore);

  it("muestra la etiqueta y el valor actual", () => {
    render(<ColorControl colorKey="primary" />);
    expect(screen.getByLabelText("Primario")).toHaveValue("#2563eb");
    expect(screen.getByLabelText("Elegir primario")).toHaveValue("#2563eb");
  });

  it("actualiza el tema al escribir un hex válido", async () => {
    const user = userEvent.setup();
    render(<ColorControl colorKey="primary" />);

    const input = screen.getByLabelText("Primario");
    await user.clear(input);
    await user.type(input, "#FF8800");

    expect(useThemeStore.getState().theme.colors.primary).toBe("#ff8800");
    expect(input).not.toHaveAttribute("aria-invalid");
  });

  it("marca el error y no toca el tema con un hex inválido", async () => {
    const user = userEvent.setup();
    render(<ColorControl colorKey="primary" />);

    const input = screen.getByLabelText("Primario");
    await user.clear(input);
    await user.type(input, "#12");

    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText(/hex de 6 dígitos/i)).toBeInTheDocument();
    expect(useThemeStore.getState().theme.colors.primary).toBe("#2563eb");
  });

  it("restaura el valor al perder el foco con un texto incompleto", async () => {
    const user = userEvent.setup();
    render(<ColorControl colorKey="primary" />);

    const input = screen.getByLabelText("Primario");
    await user.clear(input);
    await user.type(input, "#12");
    await user.tab();

    expect(input).toHaveValue("#2563eb");
    expect(input).not.toHaveAttribute("aria-invalid");
  });
});
