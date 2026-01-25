import { defineConfig } from "vitest/config";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@shared": path.resolve(__dirname, "shared"),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "server/**/*.test.ts"],
    exclude: [
      "**/node_modules/**",
      // Node test runner files (use `node --test` instead of vitest)
      "server/tests/geocoding.test.ts",
      "server/tests/sharedThread.test.ts",
      "server/tests/alerts.test.ts",
      "server/tests/sentry-integration.test.ts",
    ],
  },
});
