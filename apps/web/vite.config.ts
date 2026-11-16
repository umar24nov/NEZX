import { fileURLToPath, URL } from "node:url";

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const src = fileURLToPath(new URL("./src", import.meta.url));
const shared = fileURLToPath(new URL("../../packages/shared/src/index.ts", import.meta.url));

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": src,
      "@nezx/shared": shared,
    },
  },
  server: {
    port: 5173,
    // Local dev talks to the API through this proxy, so cookies stay first-party.
    proxy: {
      "/api": {
        target: "http://localhost:4000",
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: 4173,
  },
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (/[\\/]node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/.test(id)) {
            return "react";
          }
          if (id.includes("@radix-ui")) return "radix";
          if (id.includes("@tanstack") || id.includes("zustand")) return "state";
          if (id.includes("react-hook-form") || id.includes("@hookform")) return "forms";
          if (id.includes("better-auth")) return "auth";
          if (id.includes("zod")) return "validation";
          return "vendor";
        },
      },
    },
  },
});
