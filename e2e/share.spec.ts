import { expect, test } from "@playwright/test";

import { signInOrCreate } from "./helpers";

test("el enlace compartido abre el tema en modo lectura y pide sesión para duplicar", async ({
  page,
  browser,
}) => {
  const stamp = Date.now();
  const name = `Compartido ${stamp}`;

  await signInOrCreate(page);

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

  // Visitante anónimo: contexto limpio, sin la sesión del storageState.
  const anonymous = await browser.newContext({
    storageState: { cookies: [], origins: [] },
  });
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
