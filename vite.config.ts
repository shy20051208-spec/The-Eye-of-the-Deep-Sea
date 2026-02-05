import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "node:path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");
  return {
    plugins: [vue()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src")
      }
    },
    server: {
      port: 5173,
      proxy: {
        // 真实后端联调时：前端可直接用 VITE_API_BASE_URL=http://localhost:8081
        // 也可改为 /api 代理到 8081（看你们团队偏好）
      }
    },
    define: {
      __APP_ENV__: JSON.stringify(env.VITE_APP_ENV || mode)
    }
  };
});
