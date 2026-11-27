import { expect, test, type Page } from "@playwright/test";

/**
 * Cuenta fija para los E2E. Reutilizarla evita crear un usuario nuevo en cada
 * ejecución y chocar con el rate limit de correos de Supabase.
 */
export const E2E_EMAIL = "theme-studio-e2e@example.com";
export const E2E_PASSWORD = "theme-studio-e2e-Aa1";

/**
 * Entra con la cuenta E2E y, si no existe, la crea. Deja la sesión iniciada en
 * `/temas`.
 */
export async function signInOrCreate(page: Page): Promise<void> {
  // Con `storageState` la sesión ya está iniciada; se evita un login por test.
  await page.goto("/temas");
  const signedIn = await page
    .getByRole("button", { name: "Salir" })
    .waitFor({ state: "visible", timeout: 2_000 })
    .then(() => true)
    .catch(() => false);
  if (signedIn) return;

  await page.goto("/entrar");
  if (await page.getByText("Supabase no está configurado").isVisible()) {
    test.skip(true, "Supabase no configurado en este entorno");
  }

  await page.getByRole("tab", { name: "Contraseña" }).click();
  await page.locator("#password-email").fill(E2E_EMAIL);
  await page.locator("#password").fill(E2E_PASSWORD);

  await page.getByRole("button", { name: "Entrar", exact: true }).click();

  const signedInPromise = page
    .waitForURL(/\/temas$/, { timeout: 20_000 })
    .then(() => true)
    .catch(() => null);
  const failedPromise = page
    .locator('[role="alert"]')
    .waitFor({ timeout: 20_000 })
    .then(() => false)
    .catch(() => null);

  const result = await Promise.race([signedInPromise, failedPromise]);
  if (result === true) return;

  // Primera ejecución o cuenta borrada: se crea con las mismas credenciales.
  await page.getByRole("button", { name: "Crear cuenta con estos datos" }).click();
  await expect(page).toHaveURL(/\/temas$/, { timeout: 20_000 });
}
