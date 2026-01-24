import { defineConfig } from "vitest/config";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared"),
      "@johnsonbros/unified-cards": path.resolve(
        __dirname,
        "shared",
        "unified-cards",
      ),
      "@assets": path.resolve(__dirname, "client", "src", "assets"),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./test/setup.ts"],
    include: ["client/src/**/*.test.tsx", "shared/**/*.test.tsx"],
  },
});
