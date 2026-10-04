import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// Relative base so the build works from any path, such as a GitHub Pages project site.
export default defineConfig({
  base: "./",
  plugins: [react()],
  test: { include: ["src/**/*.test.ts"] },
});
