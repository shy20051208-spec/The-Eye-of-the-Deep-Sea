import axios from "axios";
import { ElMessage } from "element-plus";
import { useAuthStore } from "@/store";
import type { ApiResp } from "@/types";
import { toFriendlyError } from "@/utils/error";

const baseURL = import.meta.env.VITE_API_BASE_URL;
const timeout = Number(import.meta.env.VITE_REQUEST_TIMEOUT || 15000);

export const http = axios.create({
  baseURL,
  timeout
});

http.interceptors.request.use((config) => {
  const auth = useAuthStore();
  if (auth.token) {
    config.headers = config.headers || {};
    (config.headers as any).Authorization = `Bearer ${auth.token}`;
  }
  return config;
});

http.interceptors.response.use(
  (resp) => resp,
  (err) => {
    ElMessage.error(toFriendlyError(err));
    return Promise.reject(err);
  }
);

export function unwrap<T>(resp: any): T {
  const d: ApiResp<T> | T = resp?.data;

  if (d && typeof d === "object" && "code" in (d as any) && "data" in (d as any)) {
    const r = d as ApiResp<T>;
    if (r.code !== 0) {
      const msg = r.message || "接口返回错误";
      ElMessage.error(msg);
      throw new Error(msg);
    }
    return r.data;
  }

  return d as T;
}
