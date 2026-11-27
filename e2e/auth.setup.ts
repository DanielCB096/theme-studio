import { mkdir } from "node:fs/promises";

import { expect, test as setup } from "@playwright/test";

import { signInOrCreate } from "./helpers";

const authFile = "e2e/.auth/user.json";

setup("iniciar sesión y guardar el estado", async ({ page }) => {
  await signInOrCreate(page);
  await expect(page.getByRole("button", { name: "Salir" })).toBeVisible();
  await mkdir("e2e/.auth", { recursive: true });
  await page.context().storageState({ path: authFile });
});
