import { expect, test } from "@playwright/test";

import { signInOrCreate } from "./helpers";

test("acceso, guardado y persistencia tras recargar", async ({ page }) => {
  await signInOrCreate(page);
  await expect(page.getByRole("button", { name: "Salir" })).toBeVisible();

  await page.goto("/");

  const slider = page.getByRole("slider", { name: "Radio de borde" });
  await slider.focus();
  await page.keyboard.press("ArrowRight");

  await page.getByRole("button", { name: "Guardar", exact: true }).click();
  await page.getByRole("button", { name: "Guardar tema" }).click();
  await expect(page.getByText("Tema guardado")).toBeVisible();
  await page.getByRole("button", { name: "Cerrar" }).first().click();

  await page.reload();
  await expect(page.getByRole("button", { name: "Salir" })).toBeVisible();

  await page.goto("/temas");
  await expect(page.getByRole("heading", { name: "Mis temas" })).toBeVisible();
  await expect(page.getByText("Claro por defecto").first()).toBeVisible();
});
