import type { LoginReq, LoginResp } from "@/types";

export async function mockLogin(req: LoginReq): Promise<LoginResp> {
  return {
    token: `mock-token-${req.username}-${Date.now()}`,
    username: req.username
  };
}
