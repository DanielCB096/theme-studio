import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ExportThemeDialog } from "@/features/themes/ExportThemeDialog";
import { ImportThemeDialog } from "@/features/themes/ImportThemeDialog";
import { DEFAULT_THEME } from "@/lib/defaultThemes";
import { exportThemeJson } from "@/lib/themeExport";
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

describe("ExportThemeDialog", () => {
  beforeEach(resetStore);

  it("muestra el JSON del tema actual", async () => {
    const user = userEvent.setup();
    render(<ExportThemeDialog />);

    await user.click(screen.getByRole("button", { name: "Exportar" }));

    const code = screen.getByLabelText("Código JSON");
    expect(code).toHaveTextContent(DEFAULT_THEME.id);
    expect(code.textContent).toBe(exportThemeJson(DEFAULT_THEME));
  });

  it("cambia entre JSON, CSS y Tailwind", async () => {
    const user = userEvent.setup();
    render(<ExportThemeDialog />);
    await user.click(screen.getByRole("button", { name: "Exportar" }));

    await user.click(screen.getByRole("tab", { name: "CSS" }));
    expect(screen.getByLabelText("Código CSS").textContent).toContain(":root {");

    await user.click(screen.getByRole("tab", { name: "Tailwind" }));
    expect(screen.getByLabelText("Código Tailwind").textContent).toContain('"extend"');
  });

  it("copia el contenido y lo confirma", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });

    render(<ExportThemeDialog />);
    fireEvent.click(screen.getByRole("button", { name: "Exportar" }));
    fireEvent.click(screen.getByRole("button", { name: "Copiar" }));

    expect(writeText).toHaveBeenCalledWith(exportThemeJson(DEFAULT_THEME));
    expect(await screen.findByText(/copiado al portapapeles/i)).toBeInTheDocument();
  });
});

describe("ImportThemeDialog", () => {
  beforeEach(resetStore);

  it("rechaza un JSON inválido sin tocar el tema", async () => {
    const user = userEvent.setup();
    render(<ImportThemeDialog />);
    await user.click(screen.getByRole("button", { name: "Importar" }));

    fireEvent.change(screen.getByLabelText("Contenido JSON"), {
      target: { value: '{ "name": "x" ' },
    });
    await user.click(screen.getByRole("button", { name: "Importar tema" }));

    expect(screen.getByText(/no se pudo importar/i)).toBeInTheDocument();
    expect(screen.getByText(/no es json válido/i)).toBeInTheDocument();
    expect(useThemeStore.getState().theme).toEqual(DEFAULT_THEME);
  });

  it("importa un tema válido y cierra el diálogo", async () => {
    const user = userEvent.setup();
    const imported = { ...DEFAULT_THEME, id: "tema-importado", name: "Tema importado" };
    render(<ImportThemeDialog />);
    await user.click(screen.getByRole("button", { name: "Importar" }));

    fireEvent.change(screen.getByLabelText("Contenido JSON"), {
      target: { value: JSON.stringify(imported) },
    });
    await user.click(screen.getByRole("button", { name: "Importar tema" }));

    expect(useThemeStore.getState().theme.name).toBe("Tema importado");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("muestra el error de un hex inválido con nombre legible", async () => {
    const user = userEvent.setup();
    const broken = { ...DEFAULT_THEME, colors: { ...DEFAULT_THEME.colors, primary: "azul" } };
    render(<ImportThemeDialog />);
    await user.click(screen.getByRole("button", { name: "Importar" }));

    fireEvent.change(screen.getByLabelText("Contenido JSON"), {
      target: { value: JSON.stringify(broken) },
    });
    await user.click(screen.getByRole("button", { name: "Importar tema" }));

    expect(screen.getByText(/color primario/i)).toBeInTheDocument();
  });
});
