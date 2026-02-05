export type AreaType =
  | "PACIFIC"
  | "INDIAN"
  | "ATLANTIC"
  | "ARCTIC"
  | "SOUTHERN"
  | string;

export interface TSGRecord {
  id?: number | string;
  area: AreaType;
  time?: string; // ISO string
  depth: number; // meters
  temperature: number; // °C
  salinity: number; // PSU
  lat?: number;
  lon?: number;
}

export interface PageResp<T> {
  list: T[];
  page: number;
  pageSize: number;
  total: number;
}

export interface QueryParams {
  area?: AreaType | "";
  timeStart?: string; // ISO
  timeEnd?: string; // ISO
  depthMin?: number | null;
  depthMax?: number | null;
  page?: number;
  pageSize?: number;
}

export interface UploadResp {
  fileName: string;
  insertedRows: number;
  uploadedAt: string;
}

export interface LoginReq {
  username: string;
  password: string;
}

export interface LoginResp {
  token: string;
  username: string;
}

/** 算法分析结果（前端内部标准） */
export interface AnalysisResult {
  areaAgg: Array<{
    area: AreaType;
    tempAvg: number;
    salAvg: number;
    count: number;
  }>;
  depthSeries: Array<{
    depth: number;
    temperature: number;
    salinity?: number;
  }>;
  compare?: {
    pacific: { tempAvg: number; salAvg: number; count: number };
    indian: { tempAvg: number; salAvg: number; count: number };
  };
}

export interface ApiResp<T> {
  code: number; // 0 success, else error
  message: string;
  data: T;
  traceId?: string;
}

export type MetricType = "temperature" | "salinity";
