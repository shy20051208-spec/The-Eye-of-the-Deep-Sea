import { http, unwrap } from "./http";
import { USE_MOCK } from "@/mock";
import { mockUpload, mockQuery } from "@/mock/data";
import { adapter } from "./adapter";
import type { QueryParams, PageResp, TSGRecord, UploadResp } from "@/types";

export async function apiUpload(file: File): Promise<UploadResp> {
  if (USE_MOCK) return mockUpload(file);

  const form = new FormData();
  form.append("file", file);

  const resp = await http.post("/api/data/upload", form, {
    headers: { "Content-Type": "multipart/form-data" }
  });

  const raw = unwrap<any>(resp);
  return adapter.upload(raw);
}

export async function apiQuery(params: QueryParams): Promise<PageResp<TSGRecord>> {
  if (USE_MOCK) return mockQuery(params);

  const resp = await http.get("/api/data/query", { params });
  const raw = unwrap<any>(resp);
  return adapter.query(raw);
}
