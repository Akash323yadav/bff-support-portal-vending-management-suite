import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import basicSsl from "@vitejs/plugin-basic-ssl";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const target = env.VITE_API_URL || "http://127.0.0.1:4000";

  return {
    plugins: [react()],
    server: {
      allowedHosts: true,
      proxy: {
        "/api": {
          target: target,
          changeOrigin: true,
          secure: false,
        },
        "/uploads": {
          target: target,
          changeOrigin: true,
          secure: false,
        },
        "/socket.io": {
          // Use http target with ws: true for proper upgrade handling
          target: target,
          ws: true,
          // When proxying socket.io we usually want to preserve the original Host header
          // so set changeOrigin to false — this reduces Host mismatches on the backend.
          changeOrigin: true,
          secure: false,
          timeout: 300000,
          proxyTimeout: 300000,
          configure: (proxy, _options) => {
            proxy.on("error", (err, _req, _res) => {
              // Silently handle proxy errors to avoid console spam
              // console.log('proxy error', err);
            });
          },
        },
      },
    },
  };
});
