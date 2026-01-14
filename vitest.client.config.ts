import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@johnsonbros/unified-cards": path.resolve(
        import.meta.dirname,
        "shared",
        "unified-cards",
      ),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./test/setup.ts"],
    include: ["client/src/**/*.test.tsx", "shared/**/*.test.tsx"],
  },
});
