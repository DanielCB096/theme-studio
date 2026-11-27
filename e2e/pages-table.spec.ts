import { expect, test } from "@playwright/test";

import { signInOrCreate } from "./helpers";

test("buscar y paginar una tabla estática publicada", async ({ page, browser }) => {
  const stamp = Date.now();
  const pageName = `Tabla ${stamp}`;

  await signInOrCreate(page);
  await page.goto("/builder");

  await expect(page.getByLabel("Nombre de la página")).toHaveValue("Mi landing", {
    timeout: 30_000,
  });
  await page.getByLabel("Nombre de la página").fill(pageName);
  await page.getByRole("button", { name: "Guardar", exact: true }).click();
  await expect(page).toHaveURL(/\/builder\/[0-9a-f-]{36}$/, { timeout: 30_000 });

  // Bloque estático con dos columnas y siete filas.
  await page.getByRole("button", { name: "Tabla", exact: true }).click();
  await expect(page.getByLabel("Buscador")).toBeVisible();
  await expect(page.getByLabel("Buscador")).toBeChecked();
  await expect(page.getByLabel("Filas por página")).toHaveValue("10");

  await page.getByLabel("Columnas (separadas por comas)").fill("Producto, Precio");
  await page
    .getByLabel("Filas (una por línea, celdas con |)")
    .fill(
      [
        "Café | 3 €",
        "Té | 2 €",
        "Agua | 1 €",
        "Zumo | 2 €",
        "Leche | 1 €",
        "Pan | 1 €",
        "Arroz | 2 €",
      ].join("\n"),
    );
  await page.getByLabel("Filas por página").selectOption("5");

  // Los controles de la tabla deben poder usarse en el lienzo, por encima de
  // la capa de selección del bloque.
  const builderSearch = page.locator('main input[type="search"]').first();
  await builderSearch.click();
  await builderSearch.fill("Té");
  await expect(page.getByText("1 resultado")).toBeVisible();
  await builderSearch.fill("");
  await expect(page.getByText("7 resultados")).toBeVisible();
  await page.getByRole("button", { name: "Siguiente" }).click();
  await expect(page.getByText("Página 2 de 2")).toBeVisible();
  await page.getByRole("button", { name: "Anterior" }).click();
  await expect(page.getByText("Página 1 de 2")).toBeVisible();

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
  await expect(table.getByRole("columnheader", { name: "Precio" })).toBeVisible();

  // Paginación: 5 filas en la primera página y 2 en la segunda.
  await expect(visitor.getByText("Página 1 de 2")).toBeVisible();
  await expect(table.locator("tbody tr")).toHaveCount(5);
  await expect(table.getByRole("cell", { name: "Café" })).toBeVisible();
  await expect(table.getByRole("cell", { name: "Pan" })).toHaveCount(0);

  await visitor.getByRole("button", { name: "Siguiente" }).click();
  await expect(visitor.getByText("Página 2 de 2")).toBeVisible();
  await expect(table.locator("tbody tr")).toHaveCount(2);
  await expect(table.getByRole("cell", { name: "Pan" })).toBeVisible();
  await expect(table.getByRole("cell", { name: "Arroz" })).toBeVisible();
  await expect(visitor.getByRole("button", { name: "Siguiente" })).toBeDisabled();

  await visitor.getByRole("button", { name: "Anterior" }).click();
  await expect(visitor.getByText("Página 1 de 2")).toBeVisible();
  await expect(table.getByRole("cell", { name: "Café" })).toBeVisible();

  // Buscador: filtra por «Té» y muestra el estado sin resultados.
  const search = visitor.getByRole("searchbox", { name: "Buscar en la tabla" });
  await search.fill("Té");
  await expect(visitor.getByText("1 resultado")).toBeVisible();
  await expect(table.getByRole("cell", { name: "Té" })).toBeVisible();
  await expect(table.getByRole("cell", { name: "Café" })).toHaveCount(0);

  await search.fill("zzzz");
  await expect(visitor.getByText("No hay resultados.")).toBeVisible();
  await expect(table).toBeVisible();

  await search.fill("");
  await expect(visitor.getByText("7 resultados")).toBeVisible();

  await anonymous.close();
});
