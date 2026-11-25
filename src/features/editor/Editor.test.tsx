import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

import App from "@/App";
import { hexToRgb, rgbToHsl } from "@/lib/color";
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

function themeScope() {
  const preview = screen.getByRole("main", { name: "Vista previa" });
  const scope = preview.querySelector<HTMLElement>("[data-theme-mode]");
  if (!scope) throw new Error("No se encontró el contenedor del tema");
  return scope;
}

describe("Editor", () => {
  beforeEach(resetStore);

  it("aplica los cambios del panel a las variables CSS de la vista previa", async () => {
    const user = userEvent.setup();
    render(<App />);

    const slider = screen.getByRole("slider", { name: "Radio de borde" });
    expect(themeScope().style.getPropertyValue("--radius")).toBe("10px");

    slider.focus();
    await user.keyboard("{ArrowRight}");

    expect(useThemeStore.getState().theme.shape.radius).toBe(11);
    expect(themeScope().style.getPropertyValue("--radius")).toBe("11px");
  });

  it("deshace con el botón y rehace con el atajo de teclado", async () => {
    const user = userEvent.setup();
    render(<App />);

    const slider = screen.getByRole("slider", { name: "Radio de borde" });
    slider.focus();
    await user.keyboard("{ArrowRight}");

    const undoButton = screen.getByRole("button", { name: "Deshacer" });
    expect(undoButton).toBeEnabled();
    await user.click(undoButton);
    expect(useThemeStore.getState().theme.shape.radius).toBe(10);

    await user.keyboard("{Control>}{Shift>}z{/Shift}{/Control}");
    expect(useThemeStore.getState().theme.shape.radius).toBe(11);

    await user.keyboard("{Control>}z{/Control}");
    expect(useThemeStore.getState().theme.shape.radius).toBe(10);
  });

  it("cambia el modo y conserva el color primario", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Oscuro" }));

    const { theme } = useThemeStore.getState();
    expect(theme.mode).toBe("dark");
    expect(themeScope().style.getPropertyValue("--color-background")).not.toBe("#f8fafc");
    expect(themeScope().style.getPropertyValue("--color-primary")).toBe(theme.colors.primary);

    // Conserva la identidad de marca: mismo tono, luminosidad ajustada.
    const before = rgbToHsl(hexToRgb("#2563eb")).h;
    const after = rgbToHsl(hexToRgb(theme.colors.primary)).h;
    expect(Math.abs(before - after)).toBeLessThan(3);
  });

  it("aplica un color escrito a mano a la vista previa", async () => {
    const user = userEvent.setup();
    render(<App />);

    const input = screen.getByLabelText("Primario");
    await user.clear(input);
    await user.type(input, "#FF8800");

    expect(useThemeStore.getState().theme.colors.primary).toBe("#ff8800");
    expect(themeScope().style.getPropertyValue("--color-primary")).toBe("#ff8800");
  });

  it("cambia fuente, densidad y tamaño de botón", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.selectOptions(screen.getByLabelText("Fuente"), "serif");
    expect(themeScope().style.getPropertyValue("--font-family")).toContain("Georgia");

    await user.selectOptions(screen.getByLabelText("Densidad"), "spacious");
    expect(themeScope().style.getPropertyValue("--density-gap")).toBe("16px");

    await user.selectOptions(screen.getByLabelText("Tamaño de botón"), "lg");
    expect(themeScope().style.getPropertyValue("--btn-height-default")).toBe("48px");
  });

  it("renombra el tema al confirmar con Enter", async () => {
    const user = userEvent.setup();
    render(<App />);

    const nameInput = screen.getByLabelText("Nombre del tema");
    await user.clear(nameInput);
    await user.type(nameInput, "Aurora{Enter}");

    expect(useThemeStore.getState().theme.name).toBe("Aurora");
    expect(screen.getByRole("heading", { level: 1, name: "Theme Studio" })).toBeInTheDocument();
  });

  it("no intercepta el deshacer nativo dentro de un campo de texto", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("slider", { name: "Radio de borde" }));
    await user.keyboard("{ArrowRight}");

    const nameInput = screen.getByLabelText("Nombre del tema");
    await user.click(nameInput);
    await user.keyboard("{Control>}z{/Control}");

    expect(useThemeStore.getState().theme.shape.radius).toBe(11);
  });
});
