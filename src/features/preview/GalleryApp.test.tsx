import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { GalleryApp } from "@/features/preview/GalleryApp";
import { ThemeScope } from "@/features/preview/ThemeScope";
import { DEFAULT_THEME } from "@/lib/defaultThemes";

function renderGallery() {
  return render(
    <ThemeScope theme={DEFAULT_THEME}>
      <GalleryApp />
    </ThemeScope>,
  );
}

describe("GalleryApp", () => {
  it("muestra navegación, formulario, tabla y alerta", () => {
    renderGallery();
    expect(screen.getByRole("navigation", { name: "Secciones" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Resumen" })).toBeInTheDocument();
    expect(screen.getByRole("form", { name: "Recordatorio" })).toBeInTheDocument();
    expect(
      screen.getByRole("table", { name: "Facturas emitidas en noviembre" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(/todo en orden/i);
  });

  it("envía el formulario y confirma al usuario", async () => {
    const user = userEvent.setup();
    renderGallery();

    await user.type(screen.getByLabelText("Correo del cliente"), "cliente@ejemplo.com");
    await user.click(screen.getByRole("button", { name: "Enviar recordatorio" }));

    expect(screen.getByText(/recordatorio enviado/i)).toBeInTheDocument();
  });

  it("abre y cierra el modal de nueva factura", async () => {
    const user = userEvent.setup();
    renderGallery();

    await user.click(screen.getByRole("button", { name: /nueva factura/i }));
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByLabelText("Cliente")).toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: "Cancelar" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
