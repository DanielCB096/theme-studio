import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

const { submitMock } = vi.hoisted(() => ({ submitMock: vi.fn() }));

vi.mock("@/features/page-builder/submissions", () => ({ submitPageForm: submitMock }));

import { PageRenderer } from "@/features/page-builder/PageRenderer";
import { createLandingDocument } from "@/features/page-builder/templates/landing";
import { DEFAULT_THEME } from "@/lib/defaultThemes";

const page = createLandingDocument(DEFAULT_THEME, "Landing con formulario");
const PAGE_ID = "123e4567-e89b-42d3-a456-426614174000";

afterEach(() => {
  submitMock.mockReset();
});

describe("bloque form en una página pública", () => {
  it("envía los campos controlados y muestra el mensaje de éxito", async () => {
    submitMock.mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<PageRenderer page={page} runtime={{ mode: "public", pageId: PAGE_ID }} />);

    await user.type(screen.getByLabelText("Nombre"), "Ana");
    await user.type(screen.getByLabelText("Correo"), "ana@example.com");
    await user.type(screen.getByLabelText("Mensaje"), "Hola");
    await user.click(screen.getByRole("button", { name: "Enviar mensaje" }));

    expect(await screen.findByText(/gracias/i)).toBeInTheDocument();
    expect(submitMock).toHaveBeenCalledWith(PAGE_ID, {
      Nombre: "Ana",
      Correo: "ana@example.com",
      Mensaje: "Hola",
    });
  });

  it("muestra el error sin perder los valores escritos", async () => {
    submitMock.mockRejectedValue(new Error("No se pudo conectar con el servidor."));
    const user = userEvent.setup();
    render(<PageRenderer page={page} runtime={{ mode: "public", pageId: PAGE_ID }} />);

    await user.type(screen.getByLabelText("Nombre"), "Ana");
    await user.type(screen.getByLabelText("Correo"), "ana@example.com");
    await user.click(screen.getByRole("button", { name: "Enviar mensaje" }));

    expect(await screen.findByText("No se pudo conectar con el servidor.")).toBeInTheDocument();
    expect(screen.getByLabelText("Nombre")).toHaveValue("Ana");
    expect(screen.getByLabelText("Correo")).toHaveValue("ana@example.com");
  });

  it("no envía si falta el id de la página", async () => {
    const user = userEvent.setup();
    render(<PageRenderer page={page} runtime={{ mode: "public", pageId: null }} />);

    await user.type(screen.getByLabelText("Nombre"), "Ana");
    await user.type(screen.getByLabelText("Correo"), "ana@example.com");
    await user.click(screen.getByRole("button", { name: "Enviar mensaje" }));

    expect(await screen.findByText(/no se pudo identificar la página/i)).toBeInTheDocument();
    expect(submitMock).not.toHaveBeenCalled();
  });
});
