import {
  defineConfig,
  loadEnv,
} from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, "");
  const frontendPort = Number.parseInt(env.FRONTEND_PORT || "5173", 10);
  const backendPort = env.VITE_BACKEND_PORT || "8000";

  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
      },
    },
    server: {
      watch: {
        usePolling: true,
      },
      host: true,
      strictPort: true,
      port: frontendPort,
      proxy: {
        "/api": {
          target: `http://backend:${backendPort}`,
          changeOrigin: true,
          rewrite: (requestPath) => requestPath.replace(/^\/api/, ""),
        },
      },
    },
    build: {
      sourcemap: false,
      target: "esnext",
      outDir: "dist",
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes("node_modules")) {
              return null;
            }

            if (id.includes("@xyflow/react")) {
              return "reactflow";
            }

            if (
              id.includes("echarts") ||
              id.includes("echarts-for-react")
            ) {
              return "echarts";
            }

            if (
              id.includes("chart.js") ||
              id.includes("react-chartjs-2") ||
              id.includes("chartjs-") ||
              id.includes("date-fns")
            ) {
              return "charting";
            }

            if (
              id.includes("primereact") ||
              id.includes("react-range-slider-input") ||
              id.includes("react-bootstrap") ||
              id.includes("bootstrap") ||
              id.includes("framer-motion")
            ) {
              return "ui-kit";
            }

            if (id.includes("react-icons")) {
              return "icons";
            }

            if (
              id.includes("driver.js") ||
              id.includes("react-papaparse")
            ) {
              return "workspace-vendor";
            }

            if (
              id.includes("react-router-dom") ||
              id.includes("react-dom") ||
              id.includes("react")
            ) {
              return "react-vendor";
            }

            return null;
          },
        },
      },
    },
  };
});
