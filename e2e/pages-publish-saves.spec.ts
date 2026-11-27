import { expect, test } from "@playwright/test";

import { signInOrCreate } from "./helpers";

test("publicar guarda los cambios pendientes del lienzo", async ({ page, browser }) => {
  const stamp = Date.now();
  const pageName = `Publicar ${stamp}`;

  await signInOrCreate(page);
  await page.goto("/builder");

  await expect(page.getByLabel("Nombre de la página")).toHaveValue("Mi landing", {
    timeout: 20_000,
  });
  await page.getByLabel("Nombre de la página").fill(pageName);
  await page.getByRole("button", { name: "Guardar", exact: true }).click();
  await expect(page).toHaveURL(/\/builder\/[0-9a-f-]{36}$/, { timeout: 20_000 });

  // Se edita el lienzo y se publica directamente, sin pulsar Guardar.
  await page.getByRole("button", { name: "Tabla", exact: true }).click();
  await page.getByLabel("Título").fill("Tabla publicada");
  await page.getByRole("button", { name: "Publicar", exact: true }).click();
  await expect(page.getByText("Página publicada.")).toBeVisible({ timeout: 20_000 });

  const href = await page.getByRole("link", { name: /^\/p\// }).getAttribute("href");
  expect(href).toBeTruthy();

  const anonymous = await browser.newContext();
  const visitor = await anonymous.newPage();
  await visitor.goto(href ?? "/");
  await expect(visitor.getByRole("table", { name: "Tabla publicada" })).toBeVisible({
    timeout: 20_000,
  });
  await anonymous.close();
});
