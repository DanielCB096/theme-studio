import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { PageRenderer } from "@/features/page-builder/PageRenderer";
import { DEFAULT_THEME } from "@/lib/defaultThemes";
import { createLandingDocument } from "@/features/page-builder/templates/landing";

const page = createLandingDocument(DEFAULT_THEME, "Landing de prueba");

describe("PageRenderer", () => {
  it("renderiza los bloques de la plantilla", () => {
    render(<PageRenderer page={page} />);

    expect(screen.getByRole("heading", { level: 1, name: /tu producto/i })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: /navegación principal/i })).toBeInTheDocument();
    expect(screen.getByRole("form", { name: /hablemos/i })).toBeInTheDocument();
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
  });

  it("no emite enlaces con protocolos peligrosos", () => {
    const { container } = render(<PageRenderer page={page} />);
    for (const anchor of container.querySelectorAll("a")) {
      expect(anchor.getAttribute("href")?.toLowerCase().startsWith("javascript:")).toBe(false);
    }
  });

  it("muestra el control de selección y avisa al pulsarlo", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<PageRenderer page={page} selectedId={page.rootIds[1] ?? null} onSelect={onSelect} />);

    const selectHero = screen.getByRole("button", { name: /seleccionar bloque 2: hero/i });
    expect(selectHero).toHaveAttribute("aria-pressed", "true");
    await user.click(selectHero);
    expect(onSelect).toHaveBeenCalledWith(page.rootIds[1]);
  });

  it("muestra un estado vacío sin bloques", () => {
    render(<PageRenderer page={{ ...page, rootIds: [], blocks: {} }} />);
    expect(screen.getByText(/no tiene bloques/i)).toBeInTheDocument();
  });
});
