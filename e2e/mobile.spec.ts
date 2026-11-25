import { devices, expect, test } from "@playwright/test";

test.use({ ...devices["Pixel 5"] });

test("el editor es usable en un móvil emulado", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Theme Studio" })).toBeVisible();

  // Sin scroll horizontal: el panel y la vista previa se apilan.
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);

  // Los controles siguen siendo operables con el dedo.
  await page.getByRole("button", { name: "Móvil" }).click();
  await expect(page.locator('[data-device="mobile"]')).toHaveAttribute("data-device-width", "375");

  const color = page.getByLabel("Primario", { exact: true });
  await color.fill("#0f766e");
  await expect(color).toHaveValue("#0f766e");
});
