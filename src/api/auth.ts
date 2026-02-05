import { http, unwrap } from "./http";
import { USE_MOCK } from "@/mock";
import { mockLogin } from "@/mock/auth";
import { adapter } from "./adapter";
import type { LoginReq, LoginResp } from "@/types";

export async function apiLogin(req: LoginReq): Promise<LoginResp> {
  if (USE_MOCK) return mockLogin(req);

  const resp = await http.post("/api/auth/login", req);
  const raw = unwrap<any>(resp);
  return adapter.login(raw);
}
