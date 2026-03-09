import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            // Order matters: match most specific first to avoid cycles
            if (
              id.includes("chart.js") ||
              id.includes("react-chartjs-2") ||
              id.includes("chartjs-plugin")
            ) {
              return "chart";
            }
            if (id.includes("@mui") || id.includes("@emotion")) {
              return "mui";
            }
            if (
              id.includes("/react-dom/") ||
              id.includes("/react/") ||
              id.includes("react@")
            ) {
              return "react-vendor";
            }
            if (id.includes("@tanstack")) {
              return "tanstack";
            }
            if (id.includes("react-router")) {
              return "react-router";
            }
            if (id.includes("@radix-ui")) {
              return "radix";
            }
            if (id.includes("styled-components")) {
              return "styled-components";
            }
            if (id.includes("exceljs")) {
              return "exceljs";
            }
            if (id.includes("swiper")) {
              return "swiper";
            }
            if (id.includes("lucide-react")) {
              return "lucide";
            }
            if (id.includes("react-image-gallery")) {
              return "react-image-gallery";
            }
            if (id.includes("fast-xml-parser")) {
              return "fast-xml-parser";
            }
            if (id.includes("@react-oauth/google")) {
              return "google-oauth";
            }
            // Avoid catch-all "vendor" to prevent circular chunks
          }
        },
      },
    },
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
});
