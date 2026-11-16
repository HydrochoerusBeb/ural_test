import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const priceProxy = {
  "/api/price": {
    target: "https://api.favorit-parts.ru",
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/api\/price/, "/hs/hsprice/"),
  },
};

export default defineConfig({
  plugins: [react()],
  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: true,
    proxy: priceProxy,
  },
});
