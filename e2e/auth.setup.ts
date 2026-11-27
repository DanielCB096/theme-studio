import { mkdir } from "node:fs/promises";

import { expect, test as setup } from "@playwright/test";

import { signInOrCreate } from "./helpers";

const authFile = "e2e/.auth/user.json";

/**
 * La cuenta de E2E se reutiliza en todos los tests autenticados para no hacer
 * un login por prueba (el endpoint de Auth tiene límites). Si el entorno no
 * tiene Supabase, se guarda un estado vacío y las pruebas que lo necesitan se
 * omiten solas; así el CI sigue siendo útil sin secretos.
 */
setup("preparar sesión", async ({ page, context }) => {
  await page.goto("/entrar");
  const configured = await page
    .getByRole("tab", { name: "Contraseña" })
    .waitFor({ state: "visible", timeout: 5_000 })
    .then(() => true)
    .catch(() => false);

  await mkdir("e2e/.auth", { recursive: true });

  if (configured) {
    await signInOrCreate(page);
    await expect(page.getByRole("button", { name: "Salir" })).toBeVisible();
  }

  await context.storageState({ path: authFile });
});
