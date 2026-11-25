import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ErrorBoundary } from "@/components/ErrorBoundary";

function Bomb(): never {
  throw new Error("fallo de prueba");
}

describe("ErrorBoundary", () => {
  it("muestra un mensaje accionable en lugar de una pantalla en blanco", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>,
    );

    expect(screen.getByRole("heading", { name: /algo salió mal/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /recargar/i })).toBeInTheDocument();
    expect(screen.getByText(/fallo de prueba/i)).toBeInTheDocument();

    vi.restoreAllMocks();
  });
});
