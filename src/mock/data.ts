import type { PageResp, QueryParams, TSGRecord, UploadResp } from "@/types";
import { nowISO } from "@/utils/time";

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

const AREAS = ["PACIFIC", "INDIAN"] as const;

const dataset: TSGRecord[] = Array.from({ length: 800 }, (_, i) => {
  const area = AREAS[i % AREAS.length];
  const depth = Math.round(rand(0, 6000));
  const temperature = Number((rand(-1, 30) - depth / 400).toFixed(2));
  const salinity = Number((rand(30, 37) + depth / 8000).toFixed(2));
  return {
    id: i + 1,
    area,
    time: new Date(Date.now() - i * 3600 * 1000).toISOString(),
    depth,
    temperature,
    salinity
  };
});

export async function mockUpload(_: File): Promise<UploadResp> {
  return {
    fileName: "mock-file.csv",
    insertedRows: 1234,
    uploadedAt: nowISO()
  };
}

export async function mockQuery(params: QueryParams): Promise<PageResp<TSGRecord>> {
  let list = dataset.slice();

  if (params.area) list = list.filter((r) => r.area === params.area);
  if (params.depthMin != null) list = list.filter((r) => r.depth >= (params.depthMin as number));
  if (params.depthMax != null) list = list.filter((r) => r.depth <= (params.depthMax as number));
  if (params.timeStart) list = list.filter((r) => (r.time || "") >= params.timeStart!);
  if (params.timeEnd) list = list.filter((r) => (r.time || "") <= params.timeEnd!);

  const page = params.page || 1;
  const pageSize = params.pageSize || 50;
  const total = list.length;

  const start = (page - 1) * pageSize;
  const paged = list.slice(start, start + pageSize);

  return { list: paged, page, pageSize, total };
}
