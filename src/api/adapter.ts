import type { AnalysisResult, TSGRecord, PageResp, UploadResp, LoginResp } from "@/types";

/** 后端字段不一致时，只改这里 */
export const adapter = {
  login(raw: any): LoginResp {
    return {
      token: raw?.token ?? raw?.access_token ?? "",
      username: raw?.username ?? raw?.user ?? ""
    };
  },

  upload(raw: any): UploadResp {
    return {
      fileName: raw?.fileName ?? raw?.filename ?? raw?.file_name ?? "unknown",
      insertedRows: Number(raw?.insertedRows ?? raw?.rows ?? raw?.inserted_rows ?? 0),
      uploadedAt: raw?.uploadedAt ?? raw?.uploaded_at ?? new Date().toISOString()
    };
  },

  query(raw: any): PageResp<TSGRecord> {
    const listRaw = raw?.list ?? raw?.records ?? raw?.items ?? [];
    const list: TSGRecord[] = listRaw.map((r: any) => ({
      id: r?.id ?? r?.ID,
      area: r?.area ?? r?.ocean ?? r?.region ?? "UNKNOWN",
      time: r?.time ?? r?.timestamp ?? r?.dateTime ?? undefined,
      depth: Number(r?.depth ?? r?.DEPTH ?? 0),
      temperature: Number(r?.temperature ?? r?.temp ?? r?.TEMP ?? 0),
      salinity: Number(r?.salinity ?? r?.sal ?? r?.SAL ?? 0),
      lat: r?.lat ?? r?.latitude,
      lon: r?.lon ?? r?.longitude
    }));

    return {
      list,
      page: Number(raw?.page ?? raw?.current ?? 1),
      pageSize: Number(raw?.pageSize ?? raw?.size ?? 50),
      total: Number(raw?.total ?? raw?.count ?? list.length)
    };
  },

  analysis(raw: any): AnalysisResult {
    const areaAggRaw = raw?.areaAgg ?? raw?.area_agg ?? raw?.area_stats ?? [];
    const depthRaw = raw?.depthSeries ?? raw?.depth_series ?? raw?.profile ?? [];

    return {
      areaAgg: (areaAggRaw || []).map((x: any) => ({
        area: x?.area ?? x?.region ?? "UNKNOWN",
        tempAvg: Number(x?.tempAvg ?? x?.temperature_avg ?? x?.temp_avg ?? 0),
        salAvg: Number(x?.salAvg ?? x?.salinity_avg ?? x?.sal_avg ?? 0),
        count: Number(x?.count ?? x?.n ?? 0)
      })),
      depthSeries: (depthRaw || []).map((x: any) => ({
        depth: Number(x?.depth ?? x?.z ?? 0),
        temperature: Number(x?.temperature ?? x?.temp ?? 0),
        salinity: x?.salinity != null ? Number(x?.salinity) : undefined
      })),
      compare: raw?.compare ?? raw?.comparison
    };
  }
};
