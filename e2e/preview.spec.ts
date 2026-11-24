import { expect, test } from "@playwright/test";

test("la vista previa se reorganiza según el ancho del dispositivo", async ({ page }) => {
  await page.goto("/");

  // Escritorio: navegación lateral y tabla.
  const desktop = page.locator('[data-device="desktop"]');
  await expect(desktop).toHaveAttribute("data-device-width", "1280");
  await expect(desktop.locator('nav[aria-label="Secciones"]')).toBeVisible();
  await expect(desktop.locator("table")).toBeVisible();

  // Móvil: menú desplegable, sin barra lateral, tabla sustituida por tarjetas.
  await page.getByRole("button", { name: "Móvil" }).click();
  const mobile = page.locator('[data-device="mobile"]');
  await expect(mobile).toHaveAttribute("data-device-width", "375");
  await expect(mobile.locator('nav[aria-label="Secciones"]')).toBeHidden();
  await expect(mobile.locator("details")).toBeVisible();
  await expect(mobile.locator("table")).toBeHidden();
  await expect(mobile.getByText("F-2041 · Marta Ríos")).toBeVisible();

  // Rotar intercambia ancho y alto sin dejar de ser móvil.
  await page.getByRole("button", { name: "Rotar dispositivo" }).click();
  await expect(mobile).toHaveAttribute("data-device-width", "812");
  await expect(mobile).toHaveAttribute("data-device-height", "375");
});

test("los cambios del panel se reflejan en la vista previa y sobreviven a una recarga", async ({
  page,
}) => {
  await page.goto("/");

  const frame = page.locator('[data-device="desktop"]');
  const scope = frame.locator("[data-theme-mode]");

  await page.getByRole("slider", { name: "Radio de borde" }).focus();
  await page.keyboard.press("ArrowRight");

  await expect
    .poll(() => scope.evaluate((el) => el.style.getPropertyValue("--radius")))
    .toBe("11px");

  await page.getByRole("button", { name: "Oscuro" }).click();
  await expect(scope).toHaveAttribute("data-theme-mode", "dark");

  await page.reload();
  await expect(frame.locator("[data-theme-mode]")).toHaveAttribute("data-theme-mode", "dark");
  await expect
    .poll(() =>
      frame.locator("[data-theme-mode]").evaluate((el) => el.style.getPropertyValue("--radius")),
    )
    .toBe("11px");
});
