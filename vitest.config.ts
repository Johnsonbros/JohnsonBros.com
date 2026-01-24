import { defineConfig } from "vitest/config";
import path from "path";


export default defineConfig({
  resolve: {
    alias: {
      "@shared": path.resolve(import.meta.dirname, "shared"),
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
    ],
  },
});
