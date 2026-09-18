import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  base: "/aeromint-v3-frontend/",

  build: {
    outDir: "dist",
    assetsDir: "assets",
    sourcemap: false
  },

  server: {
    port: 5173,
    host: "0.0.0.0"
  }
});
