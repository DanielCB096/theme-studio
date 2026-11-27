import { expect, test } from "@playwright/test";

import { signInOrCreate } from "./helpers";

const fixture = "e2e/fixtures/dataset.csv";

test("importar un CSV, guardarlo y verlo en una tabla publicada", async ({ page, browser }) => {
  const stamp = Date.now();
  const pageName = `CSV ${stamp}`;

  await signInOrCreate(page);
  await page.goto("/builder");

  await expect(page.getByLabel("Nombre de la página")).toHaveValue("Mi landing", {
    timeout: 30_000,
  });
  await page.getByLabel("Nombre de la página").fill(pageName);
  await page.getByRole("button", { name: "Guardar", exact: true }).click();
  await expect(page).toHaveURL(/\/builder\/[0-9a-f-]{36}$/, { timeout: 30_000 });
  const pageId = page.url().split("/builder/")[1];

  // Lista de datasets: crear el primero y abrir su editor.
  await page.getByRole("link", { name: "Datos" }).click();
  await expect(page).toHaveURL(new RegExp(`/pages/${pageId}/datos$`), { timeout: 30_000 });
  await expect(page.getByRole("heading", { name: /Datasets de/ })).toBeVisible();

  await page.getByRole("button", { name: "Nuevo dataset" }).click();
  await expect(page).toHaveURL(new RegExp(`/pages/${pageId}/datos/[0-9a-f-]{36}$`), {
    timeout: 30_000,
  });
  await expect(page.getByRole("heading", { name: /Datos de/ })).toBeVisible();

  await page.getByLabel("Importar CSV").setInputFiles(fixture);
  await expect(page.getByText(/CSV importado: 3 filas/)).toBeVisible({ timeout: 30_000 });
  await expect(page.getByLabel("Fila 1, columna 3 (Notas)")).toHaveValue("Con leche, sin azúcar");

  // El E2E espera la respuesta del update antes de recargar: la interfaz puede
  // mostrar el estado antes de que el navegador reciba el 200.
  const saved = page.waitForResponse(
    (response) =>
      response.url().includes("page_datasets") &&
      response.request().method() === "PATCH" &&
      response.status() === 200,
  );

  await page.getByRole("button", { name: "Guardar datos" }).click();
  await expect(page.getByText("Datos guardados.")).toBeVisible({ timeout: 30_000 });
  await saved;

  // La recarga confirma que el dataset importado quedó persistido.
  await page.reload();
  await expect(page.getByLabel("Etiqueta de la columna 1")).toHaveValue("Producto", {
    timeout: 30_000,
  });
  await expect(page.getByLabel("Fila 1, columna 1 (Producto)")).toHaveValue("Café");
  await expect(page.getByLabel("Fila 1, columna 3 (Notas)")).toHaveValue("Con leche, sin azúcar");
  await expect(page.getByLabel("Fila 3, columna 1 (Producto)")).toHaveValue("Zumo");

  // Builder: tabla conectada al dataset importado.
  await page.goto(`/builder/${pageId}`);
  await page.getByRole("button", { name: "Tabla", exact: true }).click();
  await expect(page.getByLabel("Origen de datos")).toBeVisible();
  await page.getByLabel("Origen de datos").selectOption("page");
  await page.getByRole("button", { name: "Guardar", exact: true }).click();
  await expect(page.getByText("Cambios guardados.")).toBeVisible({ timeout: 30_000 });

  await page.getByRole("button", { name: "Publicar", exact: true }).click();
  await expect(page.getByText("Página publicada.")).toBeVisible({ timeout: 30_000 });

  const href = await page.getByRole("link", { name: /^\/p\// }).getAttribute("href");
  expect(href).toBeTruthy();

  const anonymous = await browser.newContext();
  const visitor = await anonymous.newPage();
  await visitor.goto(href ?? "/");

  const table = visitor.getByRole("table", { name: "Comparativa" });
  await expect(table).toBeVisible({ timeout: 30_000 });
  await expect(table.getByRole("columnheader", { name: "Producto" })).toBeVisible();
  await expect(table.getByRole("cell", { name: "Con leche, sin azúcar" })).toBeVisible();
  await expect(table.getByRole("cell", { name: "Zumo" })).toBeVisible();
  await expect(visitor.getByRole("link", { name: "Editar datos de la página" })).toHaveCount(0);

  await anonymous.close();
});
