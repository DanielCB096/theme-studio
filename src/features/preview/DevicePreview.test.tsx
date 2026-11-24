import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/features/preview/GalleryApp", () => ({
  GalleryApp: () => <div data-testid="gallery">galería simulada</div>,
}));

import { DevicePreview } from "@/features/preview/DevicePreview";
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

function frame(device: string): HTMLElement {
  const element = document.querySelector<HTMLElement>(`[data-device="${device}"]`);
  if (!element) throw new Error(`No hay marco para ${device}`);
  return element;
}

describe("DevicePreview", () => {
  beforeEach(resetStore);

  it("empieza en escritorio a 1280 px", () => {
    render(<DevicePreview />);
    expect(frame("desktop")).toHaveAttribute("data-device-width", "1280");
    expect(screen.getByRole("button", { name: "Escritorio" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByTestId("gallery")).toBeInTheDocument();
  });

  it("cambia a móvil y rota a horizontal", async () => {
    const user = userEvent.setup();
    render(<DevicePreview />);

    await user.click(screen.getByRole("button", { name: "Móvil" }));
    expect(frame("mobile")).toHaveAttribute("data-device-width", "375");
    expect(frame("mobile")).toHaveAttribute("data-device-height", "812");

    await user.click(screen.getByRole("button", { name: "Rotar dispositivo" }));
    expect(frame("mobile")).toHaveAttribute("data-device-width", "812");
    expect(frame("mobile")).toHaveAttribute("data-device-height", "375");

    expect(screen.getByRole("button", { name: "Móvil" })).toHaveAttribute("aria-pressed", "true");
  });

  it("desactiva la rotación en escritorio", async () => {
    const user = userEvent.setup();
    render(<DevicePreview />);

    expect(screen.getByRole("button", { name: "Rotar dispositivo" })).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Tableta" }));
    expect(screen.getByRole("button", { name: "Rotar dispositivo" })).toBeEnabled();

    await user.click(screen.getByRole("button", { name: "Escritorio" }));
    expect(screen.getByRole("button", { name: "Rotar dispositivo" })).toBeDisabled();
  });

  it("muestra un marco libre con el ancho que fija el control", () => {
    render(<DevicePreview />);

    fireEvent.click(screen.getByRole("button", { name: "Libre" }));
    expect(frame("free")).toHaveAttribute("data-device-width", "720");

    const slider = screen.getByLabelText("Ancho libre");
    fireEvent.change(slider, { target: { value: "500" } });

    expect(frame("free")).toHaveAttribute("data-device-width", "500");
    expect(screen.getByText("500 px")).toBeInTheDocument();
  });

  it("muestra los tres tamaños a la vez", async () => {
    const user = userEvent.setup();
    render(<DevicePreview />);

    await user.click(screen.getByRole("button", { name: "Todas" }));

    expect(frame("mobile")).toHaveAttribute("data-device-width", "375");
    expect(frame("tablet")).toHaveAttribute("data-device-width", "768");
    expect(frame("desktop")).toHaveAttribute("data-device-width", "1280");
    expect(screen.getAllByTestId("gallery")).toHaveLength(3);
  });

  it("mantiene el tema al cambiar de dispositivo", async () => {
    const user = userEvent.setup();
    useThemeStore.getState().setRadius(20);
    render(<DevicePreview />);

    await user.click(screen.getByRole("button", { name: "Tableta" }));

    const scope = frame("tablet").querySelector<HTMLElement>("[data-theme-mode]");
    expect(scope?.style.getPropertyValue("--radius")).toBe("20px");
  });
});
