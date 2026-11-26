import { defineConfig, devices } from "@playwright/test";

const externalBaseURL = process.env.PLAYWRIGHT_BASE_URL;
const baseURL = externalBaseURL ?? "http://127.0.0.1:4173";

/**
 * E2E contra el servidor de desarrollo, para no exigir un build previo en cada
 * ejecución local. Con PLAYWRIGHT_BASE_URL se puede apuntar a un despliegue
 * real sin arrancar servidor.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "list" : [["list"], ["html", { open: "never" }]],
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  ...(externalBaseURL
    ? {}
    : {
        webServer: {
          command: "npm run dev -- --port 4173 --strictPort --host 127.0.0.1",
          url: "http://127.0.0.1:4173",
          reuseExistingServer: !process.env.CI,
          timeout: 120_000,
        },
      }),
});
