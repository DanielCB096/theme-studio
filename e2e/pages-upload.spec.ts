import { expect, test } from "@playwright/test";

import { signInOrCreate } from "./helpers";

test("subir un logo a Storage y verlo en la página publicada", async ({ page, browser }) => {
  const stamp = Date.now();
  const title = `Logo Storage ${stamp}`;

  await signInOrCreate(page);
  await page.goto("/builder");
  await page.getByText("Bloques", { exact: true }).waitFor({ timeout: 25_000 });

  await page.getByRole("button", { name: /1\. navbar/ }).click();
  const inspector = page.getByRole("complementary", { name: "Propiedades del bloque" });
  await inspector.locator("#logo-upload").setInputFiles("e2e/fixtures/logo.png");
  await inspector.getByText("Imagen subida y aplicada.").waitFor({ timeout: 30_000 });

  await page.getByRole("button", { name: /2\. hero/ }).click();
  await inspector.getByLabel("Título", { exact: true }).fill(title);

  await page.getByRole("button", { name: "Guardar", exact: true }).click();
  await page.waitForURL(/\/builder\/[0-9a-f-]{36}$/, { timeout: 25_000 });
  await page.getByRole("button", { name: "Publicar", exact: true }).click();
  await page.getByText("Página publicada.").waitFor({ timeout: 25_000 });

  const link = page.getByRole("link", { name: /^\/p\// }).first();
  const href = await link.getAttribute("href");
  expect(href).toBeTruthy();

  const anonymous = await browser.newContext();
  const visitor = await anonymous.newPage();
  await visitor.goto(href ?? "/");

  const logo = visitor.locator('img[alt="Nébula"]');
  await expect(logo).toBeVisible();
  const src = await logo.getAttribute("src");
  expect(src).toContain("/storage/v1/object/public/page-assets/");
  expect(await logo.evaluate((image) => (image as HTMLImageElement).naturalWidth > 0)).toBe(true);

  await anonymous.close();
});
