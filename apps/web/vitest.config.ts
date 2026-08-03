import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react() as never],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
  test: {
    environment: "jsdom",
    exclude: ["**/e2e/**", "**/node_modules/**", "**/dist/**"],
    passWithNoTests: true,
    setupFiles: ["./vitest.setup.ts"],
  },
});
