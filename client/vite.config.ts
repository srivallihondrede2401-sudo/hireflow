import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Served from https://<user>.github.io/hireflow/ on GitHub Pages
export default defineConfig({
  plugins: [react()],
  base: "/hireflow/",
});
