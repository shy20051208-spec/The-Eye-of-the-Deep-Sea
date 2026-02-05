import { http, unwrap } from "./http";
import { USE_MOCK } from "@/mock";
import { mockAnalyze } from "@/mock/analysis";
import { adapter } from "./adapter";
import type { AnalysisResult, QueryParams } from "@/types";

export async function apiAnalyze(params: QueryParams): Promise<AnalysisResult> {
  if (USE_MOCK) return mockAnalyze(params);

  const resp = await http.post("/api/analysis/run", params);
  const raw = unwrap<any>(resp);
  return adapter.analysis(raw);
}
