import { expect, test } from "@playwright/test";

import { signInOrCreate } from "./helpers";

/**
 * Hito 2C · Fase 3: dos datasets en la misma página, cada uno conectado a un
 * bloque Tabla distinto. Escrito para ejecutarse contra Supabase con la
 * migración 006 aplicada; no se ejecuta en esta fase.
 */
test("dos datasets por página alimentan dos tablas distintas en público", async ({
  page,
  browser,
}) => {
  const stamp = Date.now();
  const pageName = `Varios datasets ${stamp}`;

  await signInOrCreate(page);
  await page.goto("/builder");

  await expect(page.getByLabel("Nombre de la página")).toHaveValue("Mi landing", {
    timeout: 20_000,
  });
  await page.getByLabel("Nombre de la página").fill(pageName);
  await page.getByRole("button", { name: "Guardar", exact: true }).click();
  await expect(page).toHaveURL(/\/builder\/[0-9a-f-]{36}$/, { timeout: 20_000 });
  const pageId = page.url().split("/builder/")[1];

  // Lista de datasets → crear el primero y renombrarlo.
  await page.getByRole("link", { name: "Datos" }).click();
  await expect(page).toHaveURL(new RegExp(`/pages/${pageId}/datos$`), { timeout: 20_000 });
  await expect(page.getByRole("heading", { name: /Datasets de/ })).toBeVisible();

  await page.getByRole("button", { name: "Nuevo dataset" }).click();
  await expect(page).toHaveURL(new RegExp(`/pages/${pageId}/datos/[0-9a-f-]{36}$`), {
    timeout: 20_000,
  });
  const datasetAId = page.url().split("/datos/")[1];

  await page.getByLabel("Nombre del dataset").fill("Productos");
  await page.getByLabel("Etiqueta de la columna 1").fill("Producto");
  await page.getByLabel("Etiqueta de la columna 2").fill("Precio");
  await page.getByRole("button", { name: "Añadir fila" }).click();
  await page.getByLabel("Fila 1, columna 1 (Producto)").fill("Café");
  await page.getByLabel("Fila 1, columna 2 (Precio)").fill("3 €");
  await page.getByRole("button", { name: "Guardar datos" }).click();
  await expect(page.getByText("Datos guardados.")).toBeVisible({ timeout: 20_000 });

  // Volver a la lista y crear el segundo dataset.
  await page.getByRole("link", { name: "Datasets" }).click();
  await expect(page).toHaveURL(new RegExp(`/pages/${pageId}/datos$`), { timeout: 20_000 });
  await expect(page.getByText("Productos")).toBeVisible();

  await page.getByRole("button", { name: "Nuevo dataset" }).click();
  await expect(page).toHaveURL(new RegExp(`/pages/${pageId}/datos/[0-9a-f-]{36}$`), {
    timeout: 20_000,
  });
  const datasetBId = page.url().split("/datos/")[1];
  expect(datasetBId).not.toBe(datasetAId);

  await page.getByLabel("Nombre del dataset").fill("Servicios");
  await page.getByLabel("Etiqueta de la columna 1").fill("Servicio");
  await page.getByLabel("Etiqueta de la columna 2").fill("Desde");
  await page.getByRole("button", { name: "Añadir fila" }).click();
  await page.getByLabel("Fila 1, columna 1 (Servicio)").fill("Diseño");
  await page.getByLabel("Fila 1, columna 2 (Desde)").fill("500 €");
  await page.getByRole("button", { name: "Guardar datos" }).click();
  await expect(page.getByText("Datos guardados.")).toBeVisible({ timeout: 20_000 });

  // La lista conserva los dos datasets con sus nombres.
  await page.getByRole("link", { name: "Datasets" }).click();
  await expect(page.getByText("Productos")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText("Servicios")).toBeVisible();
  await expect(page.getByText(/2 de 10 datasets/)).toBeVisible();

  // Builder: dos bloques Tabla, cada uno con su dataset.
  await page.getByRole("link", { name: "Editar página" }).click();
  await expect(page).toHaveURL(new RegExp(`/builder/${pageId}$`), { timeout: 20_000 });

  await page.getByRole("button", { name: "Tabla", exact: true }).click();
  await expect(page.getByLabel("Origen de datos")).toBeVisible();
  await page.getByLabel("Título").fill("Productos");
  await page.getByLabel("Origen de datos").selectOption("page");
  await page.getByLabel("Dataset").selectOption({ label: "Productos" });

  await page.getByRole("button", { name: "Tabla", exact: true }).click();
  await expect(page.getByLabel("Origen de datos")).toBeVisible();
  await page.getByLabel("Título").fill("Servicios");
  await page.getByLabel("Origen de datos").selectOption("page");
  await page.getByLabel("Dataset").selectOption({ label: "Servicios" });

  await page.getByRole("button", { name: "Guardar", exact: true }).click();
  await expect(page.getByText("Cambios guardados.")).toBeVisible({ timeout: 20_000 });

  await page.getByRole("button", { name: "Publicar", exact: true }).click();
  await expect(page.getByText("Página publicada.")).toBeVisible({ timeout: 20_000 });

  const href = await page.getByRole("link", { name: /^\/p\// }).getAttribute("href");
  expect(href).toBeTruthy();

  // Anónimo: cada tabla muestra sus datos y no los del otro dataset.
  const anonymous = await browser.newContext();
  const visitor = await anonymous.newPage();
  await visitor.goto(href ?? "/");

  const productTable = visitor.getByRole("table", { name: "Productos" });
  const serviceTable = visitor.getByRole("table", { name: "Servicios" });
  await expect(productTable).toBeVisible({ timeout: 20_000 });
  await expect(serviceTable).toBeVisible();
  await expect(productTable.getByRole("cell", { name: "Café" })).toBeVisible();
  await expect(productTable.getByRole("cell", { name: "3 €" })).toBeVisible();
  await expect(productTable.getByRole("cell", { name: "Diseño" })).toHaveCount(0);
  await expect(serviceTable.getByRole("cell", { name: "Diseño" })).toBeVisible();
  await expect(serviceTable.getByRole("cell", { name: "500 €" })).toBeVisible();
  await expect(serviceTable.getByRole("cell", { name: "Café" })).toHaveCount(0);

  await anonymous.close();

  // El editor recarga por id y conserva el dataset correcto.
  await page.goto(`/pages/${pageId}/datos`);
  await expect(page.getByText("Productos")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText("Servicios")).toBeVisible();
  const productCard = page.locator("li", { hasText: "Productos" });
  await productCard.getByRole("link", { name: "Editar" }).click();
  await expect(page).toHaveURL(new RegExp(`/pages/${pageId}/datos/${datasetAId}$`), {
    timeout: 20_000,
  });
  await expect(page.getByLabel("Nombre del dataset")).toHaveValue("Productos", {
    timeout: 20_000,
  });
});
