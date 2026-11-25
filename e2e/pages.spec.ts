import { expect, test } from "@playwright/test";

import { signInOrCreate } from "./helpers";

test("crear página desde plantilla, editar, guardar, publicar y abrir en tres anchos", async ({
  page,
  browser,
}) => {
  const stamp = Date.now();
  const title = `Landing ${stamp}`;
  const pageName = `Página ${stamp}`;

  await signInOrCreate(page);
  await page.goto("/builder");

  await expect(page.getByLabel("Nombre de la página")).toHaveValue("Mi landing");

  // Selecciona el hero en la estructura y edita su título.
  await page.getByRole("button", { name: /2\. hero/i }).click();
  const inspector = page.getByRole("complementary", { name: "Propiedades del bloque" });
  await inspector.getByLabel("Título").fill(title);

  await page.getByLabel("Nombre de la página").fill(pageName);
  await page.getByRole("button", { name: "Guardar", exact: true }).click();

  await expect(page).toHaveURL(/\/builder\/[0-9a-f-]{36}$/, { timeout: 20_000 });

  await page.getByRole("button", { name: "Publicar", exact: true }).click();
  await expect(page.getByText("Página publicada.")).toBeVisible({ timeout: 20_000 });

  const link = page.getByRole("link", { name: /^\/p\// });
  const href = await link.getAttribute("href");
  expect(href).toBeTruthy();

  // Visitante anónimo en un contexto limpio.
  const anonymous = await browser.newContext();
  const visitor = await anonymous.newPage();
  await visitor.goto(href ?? "/");

  await expect(visitor.getByRole("heading", { level: 1, name: title })).toBeVisible();
  await expect(visitor.getByRole("form", { name: /hablemos/i })).toBeVisible();

  for (const width of [375, 768, 1280]) {
    await visitor.setViewportSize({ width, height: 900 });
    await expect(visitor.getByRole("heading", { level: 1, name: title })).toBeVisible();
    const overflow = await visitor.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1);
  }

  await anonymous.close();
});
