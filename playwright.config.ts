import { defineConfig, devices } from "@playwright/test";

const externalBaseURL = process.env.PLAYWRIGHT_BASE_URL;
const baseURL = externalBaseURL ?? "http://127.0.0.1:4173";
const isCI = Boolean(process.env.CI);
const authFile = "e2e/.auth/user.json";
const anonymousTests = [/auth\.spec\.ts/, /preview\.spec\.ts/, /mobile\.spec\.ts/];

/**
 * E2E contra el servidor de desarrollo, para no exigir un build previo en cada
 * ejecución local. Con PLAYWRIGHT_BASE_URL se puede apuntar a un despliegue
 * real sin arrancar servidor. En CI se limita la concurrencia y se amplían los
 * tiempos: el runner comparte CPU y el arranque en frío de Vite es más lento.
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: isCI ? 120_000 : 60_000,
  expect: { timeout: isCI ? 15_000 : 5_000 },
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  ...(isCI ? { workers: 2 } : {}),
  reporter: isCI ? "list" : [["list"], ["html", { open: "never" }]],
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], storageState: authFile },
      dependencies: ["setup"],
      testIgnore: [/auth\.setup\.ts/, ...anonymousTests],
    },
    {
      name: "anonymous",
      use: { ...devices["Desktop Chrome"] },
      testMatch: anonymousTests,
    },
  ],
  ...(externalBaseURL
    ? {}
    : {
        webServer: {
          command: "npm run dev -- --port 4173 --strictPort --host 127.0.0.1",
          url: "http://127.0.0.1:4173",
          reuseExistingServer: !isCI,
          timeout: 120_000,
        },
      }),
});
