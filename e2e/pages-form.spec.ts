import { expect, test } from "@playwright/test";

import { signInOrCreate } from "./helpers";

test("enviar el formulario público y gestionar la respuesta en la bandeja", async ({
  page,
  browser,
}) => {
  const stamp = Date.now();
  const pageName = `Formulario ${stamp}`;
  const message = `Hola desde E2E ${stamp}`;

  await signInOrCreate(page);
  await page.goto("/builder");

  await expect(page.getByLabel("Nombre de la página")).toHaveValue("Mi landing", {
    timeout: 20_000,
  });
  await page.getByLabel("Nombre de la página").fill(pageName);
  await page.getByRole("button", { name: "Guardar", exact: true }).click();
  await expect(page).toHaveURL(/\/builder\/[0-9a-f-]{36}$/, { timeout: 20_000 });
  const pageId = page.url().split("/builder/")[1];

  await page.getByRole("button", { name: "Publicar", exact: true }).click();
  await expect(page.getByText("Página publicada.")).toBeVisible({ timeout: 20_000 });

  const href = await page.getByRole("link", { name: /^\/p\// }).getAttribute("href");
  expect(href).toBeTruthy();

  // Visitante anónimo: envía el formulario de la página publicada.
  const anonymous = await browser.newContext();
  const visitor = await anonymous.newPage();
  await visitor.goto(href ?? "/");

  const form = visitor.getByRole("form", { name: /hablemos/i });
  await form.getByLabel("Nombre", { exact: true }).fill("Visitante E2E");
  await form.getByLabel("Correo", { exact: true }).fill("visitante@example.com");
  await form.getByLabel("Mensaje", { exact: true }).fill(message);
  await form.getByRole("button", { name: "Enviar mensaje" }).click();
  await expect(visitor.getByText(/Gracias\. Hemos recibido/)).toBeVisible({ timeout: 20_000 });
  await anonymous.close();

  // El dueño revisa la respuesta, la marca como leída y descarga el CSV.
  await page.goto(`/pages/${pageId}/respuestas`);
  await expect(page.getByRole("heading", { name: /Respuestas/ })).toBeVisible();
  await expect(page.getByText(message)).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText("Nueva", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Marcar respuesta como leída" }).click();
  await expect(page.getByText("Leída", { exact: true })).toBeVisible();

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Descargar CSV" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/-respuestas\.csv$/);
});
