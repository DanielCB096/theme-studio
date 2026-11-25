import { expect, test } from "@playwright/test";

test("registro, guardado y persistencia tras recargar", async ({ page }) => {
  const email = `theme-studio-e2e-${Date.now()}@example.com`;
  const password = "theme-studio-e2e-Aa1";

  await page.goto("/entrar");
  if (await page.getByText("Supabase no está configurado").isVisible()) {
    test.skip(true, "Supabase no configurado en este entorno");
  }

  await page.getByRole("tab", { name: "Contraseña" }).click();
  await page.locator("#password-email").fill(email);
  await page.locator("#password").fill(password);
  await page.getByRole("button", { name: "Crear cuenta con estos datos" }).click();

  // Con «Confirm email» desactivado, signUp devuelve sesión y la app redirige.
  await expect(page).toHaveURL(/\/temas$/, { timeout: 15_000 });
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
