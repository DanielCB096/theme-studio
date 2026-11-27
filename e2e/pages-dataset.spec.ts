import { expect, test } from "@playwright/test";

import { signInOrCreate } from "./helpers";

test("editar los datos de una página y conectarlos a una tabla publicada", async ({
  page,
  browser,
}) => {
  const stamp = Date.now();
  const pageName = `Datos ${stamp}`;

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

  await page.getByLabel("Nombre del dataset").fill("Productos");
  await page.getByLabel("Etiqueta de la columna 1").fill("Producto");
  await page.getByLabel("Etiqueta de la columna 2").fill("Precio");
  await page.getByRole("button", { name: "Añadir fila" }).click();
  await page.getByLabel("Fila 1, columna 1 (Producto)").fill("Café E2E");
  await page.getByLabel("Fila 1, columna 2 (Precio)").fill("3 €");
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

  // La recarga confirma que el dataset se persistió de verdad en Supabase.
  await page.reload();
  await expect(page.getByLabel("Nombre del dataset")).toHaveValue("Productos", {
    timeout: 30_000,
  });
  await expect(page.getByLabel("Etiqueta de la columna 1")).toHaveValue("Producto", {
    timeout: 30_000,
  });
  await expect(page.getByLabel("Fila 1, columna 1 (Producto)")).toHaveValue("Café E2E");

  // Builder: añadir una tabla y conectarla al dataset de la página.
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

  // Visitante anónimo: la tabla muestra los datos guardados.
  const anonymous = await browser.newContext();
  const visitor = await anonymous.newPage();
  await visitor.goto(href ?? "/");

  const table = visitor.getByRole("table", { name: "Comparativa" });
  await expect(table).toBeVisible({ timeout: 30_000 });
  await expect(table.getByRole("columnheader", { name: "Producto" })).toBeVisible();
  await expect(table.getByRole("columnheader", { name: "Precio" })).toBeVisible();
  await expect(table.getByRole("cell", { name: "Café E2E" })).toBeVisible();
  await expect(table.getByRole("cell", { name: "3 €" })).toBeVisible();
  await expect(visitor.getByRole("link", { name: "Editar datos de la página" })).toHaveCount(0);

  await anonymous.close();
});
