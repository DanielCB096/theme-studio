import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { createPageBlock } from "@/features/page-builder/blocks/registry";
import { LayoutInspector } from "@/features/page-builder/builder/LayoutInspector";

describe("LayoutInspector", () => {
  it("muestra solo los campos con sentido para el bloque", () => {
    render(<LayoutInspector block={createPageBlock("features")} onChange={vi.fn()} />);

    expect(screen.getByLabelText("Ancho del bloque")).toBeInTheDocument();
    expect(screen.getByLabelText("Columnas")).toBeInTheDocument();
    expect(screen.queryByLabelText("Dirección del bloque")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Invertir orden")).not.toBeInTheDocument();
  });

  it("emite el layout al cambiar las columnas", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<LayoutInspector block={createPageBlock("features")} onChange={onChange} />);

    await user.selectOptions(screen.getByLabelText("Columnas"), "2");

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ columns: 2 }));
  });

  it("muestra invertir orden cuando la dirección es fila", () => {
    const cta = createPageBlock("cta");
    cta.layout = { ...cta.layout, direction: "row" };

    render(<LayoutInspector block={cta} onChange={vi.fn()} />);

    expect(screen.getByRole("switch", { name: "Invertir orden" })).toBeInTheDocument();
  });
});
