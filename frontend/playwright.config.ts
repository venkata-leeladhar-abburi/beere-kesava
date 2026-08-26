import { defineConfig, devices } from "@playwright/test";
import { fileURLToPath } from "url";
import path from "path";

// This package.json is "type": "module", so __dirname isn't available —
// derive it the standard ESM way instead.
const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * E2E config. Specs live in e2e/journeys/, fixtures (including the OTP login
 * helper) in e2e/fixtures/.
 *
 * `webServer` starts both the frontend and backend dev servers for a local
 * run. In CI, start them yourself against a disposable database (see
 * docs/TESTING_PLAN.md Phase 3) and set PLAYWRIGHT_SKIP_WEBSERVER=1 so this
 * config attaches to already-running servers instead of spawning its own —
 * the backend server needs E2E_TEST_MODE=true in its own environment either
 * way, which this config cannot inject into a server it didn't start.
 */
const skipWebServer = process.env.PLAYWRIGHT_SKIP_WEBSERVER === "1";
const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:5175";
const apiURL = process.env.VITE_API_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: "./e2e/journeys",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 4 : undefined,
  reporter: [["html", { open: "never" }], ["list"]],
  timeout: 30_000,

  use: {
    baseURL,
    trace: "retain-on-failure",
    video: "retain-on-failure",
    screenshot: "only-on-failure",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  webServer: skipWebServer
    ? undefined
    : [
        {
          command: "npm run dev -- --port 5175 --strictPort",
          cwd: __dirname,
          url: baseURL,
          reuseExistingServer: !process.env.CI,
          timeout: 60_000,
        },
        {
          command: "npm run start:dev",
          cwd: "../backend",
          url: `${apiURL}/health`,
          reuseExistingServer: !process.env.CI,
          timeout: 60_000,
          env: {
            // Required for e2e/fixtures/auth.ts to retrieve a real OTP — see
            // backend/src/auth/testing/e2e-test-mode.ts. NODE_ENV is
            // deliberately left alone here (not forced to "test"): the gate
            // only needs it to not equal "production", and forcing it could
            // mask an accidental NODE_ENV=production in a real CI config.
            E2E_TEST_MODE: "true",
          },
        },
      ],
});
