import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// @ts-expect-error process is a nodejs global
const host = process.env.TAURI_DEV_HOST;

export default defineConfig(async () => ({
  plugins: [tailwindcss(), react()],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  build: {
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom"],
          "vendor-codemirror": [
            "@uiw/react-codemirror",
            "@uiw/codemirror-theme-dracula",
            "@codemirror/view",
            "@codemirror/state",
            "@codemirror/commands",
          ],
          "vendor-codemirror-langs": [
            "@codemirror/lang-javascript",
            "@codemirror/lang-python",
            "@codemirror/lang-rust",
            "@codemirror/lang-sql",
            "@codemirror/lang-html",
            "@codemirror/lang-css",
            "@codemirror/lang-json",
            "@codemirror/lang-markdown",
            "@codemirror/lang-java",
            "@codemirror/lang-cpp",
          ],
          "vendor-motion": ["framer-motion"],
        },
      },
    },
  },

  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      ignored: ["**/src-tauri/**"],
    },
  },
}));
