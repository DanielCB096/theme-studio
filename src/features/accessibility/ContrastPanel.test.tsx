import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

import { ContrastPanel } from "@/features/accessibility/ContrastPanel";
import { contrastRatio } from "@/lib/contrast";
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

describe("ContrastPanel", () => {
  beforeEach(resetStore);

  it("evalúa los cinco pares y resume cuántos cumplen AA", () => {
    render(<ContrastPanel />);

    expect(screen.getByText("Texto sobre fondo")).toBeInTheDocument();
    expect(screen.getByText("Texto sobre superficie")).toBeInTheDocument();
    expect(screen.getByText("Atenuado sobre superficie")).toBeInTheDocument();
    expect(screen.getByText("Primario sobre fondo")).toBeInTheDocument();
    expect(screen.getByText("Texto del botón primario")).toBeInTheDocument();
    expect(screen.getByText("5/5 AA")).toBeInTheDocument();
  });

  it("detecta un primario con poco contraste y ofrece corregirlo", async () => {
    const user = userEvent.setup();
    useThemeStore.getState().setColor("primary", "#bbbbbb");
    render(<ContrastPanel />);

    const row = screen.getByText("Primario sobre fondo").closest("li");
    expect(row).not.toBeNull();
    const scope = within(row as HTMLElement);

    expect(scope.getByText("Falla")).toBeInTheDocument();
    await user.click(scope.getByRole("button", { name: /corregir primario sobre fondo/i }));

    const { colors } = useThemeStore.getState().theme;
    expect(contrastRatio(colors.primary, colors.background)).toBeGreaterThanOrEqual(4.5);
    expect(scope.queryByText("Falla")).not.toBeInTheDocument();
  });

  it("indica que el texto del botón es derivado y no ofrece corregirlo", () => {
    render(<ContrastPanel />);
    const row = screen.getByText("Texto del botón primario").closest("li");
    const scope = within(row as HTMLElement);
    expect(scope.getByText(/derivado del primario/i)).toBeInTheDocument();
    expect(scope.queryByRole("button")).not.toBeInTheDocument();
  });
});
