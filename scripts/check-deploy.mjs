/**
 * Comprobación de humo contra un despliegue real.
 *
 * Uso: npm run check:deploy -- https://tu-demo.vercel.app
 */
import { chromium } from "@playwright/test";

const url = process.argv[2];
if (!url) {
  console.error("Falta la URL. Ejemplo: npm run check:deploy -- https://demo.vercel.app");
  process.exit(1);
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const consoleErrors = [];
page.on("console", (message) => {
  if (message.type() === "error") consoleErrors.push(message.text());
});

const result = { url };

await page.goto(url, { waitUntil: "networkidle" });
result.title = await page.title();
result.supabaseConfigured = await page.getByRole("link", { name: "Entrar" }).isVisible();

await page.goto(`${url}/temas`);
await page.waitForURL(/\/entrar\?redirect=/, { timeout: 15_000 });
result.protectedRouteRedirects = true;
await page.getByRole("tab", { name: "Contraseña" }).waitFor({ timeout: 15_000 });
result.passwordTabVisible = await page.getByRole("tab", { name: "Contraseña" }).isVisible();

await page.goto(url);
await page.locator("#ai-prompt").fill("oceano profundo, sereno y elegante");
await page.getByRole("button", { name: "Generar paleta" }).click();
await page.getByRole("button", { name: "Aplicar paleta" }).waitFor({ timeout: 80_000 });

result.localFallback = await page
  .getByText(/modo local \(sin ia\)/i)
  .isVisible()
  .catch(() => false);

const scope = page.locator("[data-preview-mode] [data-theme-mode]").first();
const before = await scope.getAttribute("style");
await page.getByRole("button", { name: "Aplicar paleta" }).click();
const after = await scope.getAttribute("style");
result.appliedToPreview = Boolean(before && after && before !== after);

await page.locator("#ai-prompt").scrollIntoViewIfNeeded();
await page.screenshot({ path: "docs/assets/demo.png" });
result.screenshot = "docs/assets/demo.png";
result.consoleErrors = consoleErrors;

console.log(JSON.stringify(result, null, 2));
await browser.close();

const ok =
  result.supabaseConfigured &&
  result.protectedRouteRedirects &&
  result.passwordTabVisible &&
  result.appliedToPreview &&
  consoleErrors.length === 0;

process.exit(ok ? 0 : 1);
