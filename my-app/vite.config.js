import { defineConfig } from "vite";
import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import svgr from 'vite-plugin-svgr'

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [tailwindcss(), react(), svgr()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: "0.0.0.0",
    port: 5188,
    strictPort: true,
    proxy: {
      // Same-origin /api so HttpOnly townx_session cookie is sent automatically.
      "/api": {
        target: "http://127.0.0.1:8024",
        changeOrigin: true,
      },
    },
  },
});
