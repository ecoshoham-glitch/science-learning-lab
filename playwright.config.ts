import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end tests run against a production build (`next start`).
 * CHROMIUM_PATH lets the tests use a locally provided browser when Playwright's own download is unavailable.
 */
const executablePath = process.env.CHROMIUM_PATH || undefined;
const launchOptions = executablePath ? { executablePath, args: ["--no-sandbox", "--disable-gpu"] } : {};

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 45_000,
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:3100",
    trace: "off",
    launchOptions,
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], launchOptions } },
    { name: "phone", use: { ...devices["Pixel 7"], launchOptions } },
  ],
  webServer: {
    command: "npx next start -p 3100",
    url: "http://localhost:3100/he",
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
