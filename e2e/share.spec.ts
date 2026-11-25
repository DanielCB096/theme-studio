import { expect, test, type Page } from "@playwright/test";

async function register(page: Page, email: string) {
  await page.goto("/entrar");
  if (await page.getByText("Supabase no está configurado").isVisible()) {
    test.skip(true, "Supabase no configurado en este entorno");
  }
  await page.getByRole("tab", { name: "Contraseña" }).click();
  await page.locator("#password-email").fill(email);
  await page.locator("#password").fill("theme-studio-e2e-Aa1");
  await page.getByRole("button", { name: "Crear cuenta con estos datos" }).click();
  await expect(page).toHaveURL(/\/temas$/, { timeout: 15_000 });
}

test("el enlace compartido abre el tema en modo lectura y pide sesión para duplicar", async ({
  page,
  browser,
}) => {
  const stamp = Date.now();
  const name = `Compartido ${stamp}`;

  await register(page, `theme-studio-share-${stamp}@example.com`);

  await page.goto("/");
  const nameInput = page.getByLabel("Nombre del tema");
  await nameInput.fill(name);
  await nameInput.press("Enter");

  await page.getByRole("button", { name: "Guardar", exact: true }).click();
  await page.getByRole("button", { name: "Guardar tema" }).click();
  await expect(page.getByText("Tema guardado")).toBeVisible();
  await page.getByRole("button", { name: "Cerrar" }).first().click();

  await page.goto("/temas");
  const card = page.locator("li", { hasText: name });
  await expect(card).toBeVisible();
  await card.getByRole("button", { name: "Compartir" }).click();

  await expect(card.getByText("Público")).toBeVisible();
  const link = card.locator('a[href^="/t/"]');
  await expect(link).toBeVisible();
  const href = await link.getAttribute("href");
  expect(href).toBeTruthy();

  // Visitante anónimo: contexto limpio, sin sesión.
  const anonymous = await browser.newContext();
  const visitor = await anonymous.newPage();
  await visitor.goto(href ?? "/");

  await expect(visitor.getByRole("heading", { name })).toBeVisible();
  await expect(visitor.getByText("Solo lectura")).toBeVisible();
  await expect(visitor.getByRole("button", { name: "Duplicar a mi cuenta" })).toBeVisible();

  await visitor.getByRole("button", { name: "Duplicar a mi cuenta" }).click();
  await expect(visitor).toHaveURL(/\/entrar\?redirect=/);
  await expect(visitor.getByRole("button", { name: "Enviar enlace de acceso" })).toBeVisible();

  await anonymous.close();
});
