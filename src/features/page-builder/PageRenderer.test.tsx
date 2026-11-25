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

  it("coloca la navbar a los lados sin sacar el resto del contenido", () => {
    const pageWithSidebar = structuredClone(page);
    const navbar = pageWithSidebar.blocks[pageWithSidebar.rootIds[0] ?? ""];
    if (navbar?.type !== "navbar") throw new Error("Falta la navbar");
    navbar.props.placement = "left";

    const { container } = render(<PageRenderer page={pageWithSidebar} />);

    expect(container.querySelector('[data-nav-placement="left"]')).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: /tu producto/i })).toBeInTheDocument();
  });

  it("aplica el ancho del layout al contenedor del bloque", () => {
    const compactPage = structuredClone(page);
    const heroId = compactPage.rootIds[1] ?? "";
    const hero = compactPage.blocks[heroId];
    if (!hero) throw new Error("Falta el hero");
    hero.layout = { ...hero.layout, width: "compact" };

    const { container } = render(<PageRenderer page={compactPage} />);
    const shell = container.querySelector(`[data-block-id="${heroId}"]`);

    expect(shell?.className).toContain("max-w-2xl");
  });

  it("muestra el logo por URL con su texto alternativo", () => {
    const pageWithLogo = structuredClone(page);
    const navbar = pageWithLogo.blocks[pageWithLogo.rootIds[0] ?? ""];
    if (navbar?.type !== "navbar") throw new Error("Falta la navbar");
    navbar.props.logoUrl = "https://example.com/logo.png";
    navbar.props.logoAlt = "Logotipo de Nébula";

    render(<PageRenderer page={pageWithLogo} />);

    const logo = screen.getByRole("img", { name: "Logotipo de Nébula" });
    expect(logo).toHaveAttribute("src", "https://example.com/logo.png");
  });

  it("muestra la marca textual cuando no hay logo", () => {
    const { container } = render(<PageRenderer page={page} />);
    const header = container.querySelector("header");

    expect(header?.querySelector("img")).toBeNull();
    expect(header).toHaveTextContent("Nébula");
  });

  it("muestra un estado vacío sin bloques", () => {
    render(<PageRenderer page={{ ...page, rootIds: [], blocks: {} }} />);
    expect(screen.getByText(/no tiene bloques/i)).toBeInTheDocument();
  });
});
