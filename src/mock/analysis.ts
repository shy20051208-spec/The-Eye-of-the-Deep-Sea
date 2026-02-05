import type { AnalysisResult, QueryParams } from "@/types";
import { mockQuery } from "./data";

function avg(nums: number[]) {
  if (!nums.length) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

export async function mockAnalyze(params: QueryParams): Promise<AnalysisResult> {
  const all = await mockQuery({ ...params, page: 1, pageSize: 99999 });
  const list = all.list;

  const byArea = new Map<string, typeof list>();
  for (const r of list) {
    const arr = byArea.get(r.area) || [];
    arr.push(r);
    byArea.set(r.area, arr);
  }

  const areaAgg = Array.from(byArea.entries()).map(([area, rows]) => ({
    area,
    tempAvg: Number(avg(rows.map((x) => x.temperature)).toFixed(2)),
    salAvg: Number(avg(rows.map((x) => x.salinity)).toFixed(2)),
    count: rows.length
  }));

  const buckets = new Map<number, typeof list>();
  for (const r of list) {
    const bucket = Math.round(r.depth / 100) * 100;
    const arr = buckets.get(bucket) || [];
    arr.push(r);
    buckets.set(bucket, arr);
  }

  const depthSeries = Array.from(buckets.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([depth, rows]) => ({
      depth,
      temperature: Number(avg(rows.map((x) => x.temperature)).toFixed(2)),
      salinity: Number(avg(rows.map((x) => x.salinity)).toFixed(2))
    }));

  const pac = areaAgg.find((x) => x.area === "PACIFIC");
  const ind = areaAgg.find((x) => x.area === "INDIAN");

  return {
    areaAgg,
    depthSeries,
    compare:
      pac && ind
        ? {
            pacific: { tempAvg: pac.tempAvg, salAvg: pac.salAvg, count: pac.count },
            indian: { tempAvg: ind.tempAvg, salAvg: ind.salAvg, count: ind.count }
          }
        : undefined
  };
}
