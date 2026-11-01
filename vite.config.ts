import { join } from "node:path";
import { defineConfig } from "vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  publicDir: ".vercel/output/static",
  server: {
    host: "0.0.0.0",
    port: Number(process.env.PORT || 3000),
    strictPort: true,
    allowedHosts: true,
  },
  preview: {
    host: "0.0.0.0",
    port: 3000,
    strictPort: true,
  },
  resolve: {
    alias: {
      "@": join(import.meta.dirname, "src"),
    },
  },
  plugins: [tailwindcss(), viteReact()],
});
