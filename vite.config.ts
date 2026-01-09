import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    target: "esnext",
    cssTarget: "esnext",
    rollupOptions: {
      output: {
        manualChunks: {
          // Split heavy dependencies into separate chunks for better caching
          'vendor-charts': ['recharts'],
          'vendor-motion': ['framer-motion'],
          'vendor-pptx': ['pptxgenjs'],
          'vendor-pdf': ['jspdf'],
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-query': ['@tanstack/react-query'],
        },
      },
    },
  },
  esbuild: {
    target: "esnext",
  },
}));
