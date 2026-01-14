import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "e2e",
  timeout: 60_000,
  use: {
    baseURL: "http://localhost:5000",
    trace: "on-first-retry",
  },
  webServer: {
    command: "npm run dev",
    port: 5000,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
