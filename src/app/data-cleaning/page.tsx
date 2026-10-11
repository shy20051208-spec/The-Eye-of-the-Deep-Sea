"use client";

import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { TopBar } from "@/components/layout/topbar";
import { useI18n } from "@/components/i18n-provider";
import { LocaleToggle } from "@/components/locale-toggle";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, CheckCircle2, Sparkles, ShieldCheck, Trash2 } from "lucide-react";
import {
  buildCleanedMeasurements,
  buildQcReportArtifact,
  buildVersionComparisonSummary,
  coerceLegacyMeasurement,
  normalizeImportedCtdRow,
  PreprocessingReport,
  preprocessMeasurements,
} from "@/lib/data-cleaning";

interface Station {
  id: string;
  name: string;
  _count?: {
    measurements: number;
  };
}

interface CleanCandidate {
  id: string;
  date: Date;
  depth: number;
  temperature: number;
  salinity: number;
  density: number;
  status: string;
  errors: string[];
}

const simulatedCandidates: CleanCandidate[] = [];

function highlightStatus(status: string) {
  if (status === "error") return "bg-rose-50 text-rose-700";
  if (status === "warning") return "bg-amber-50 text-amber-700";
  return "bg-slate-50 text-slate-700";
}

function parseCsvLine(line: string) {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      cells.push(current);
      current = "";
    } else {
      current += ch;
    }
  }

  cells.push(current);
  return cells.map((cell) => cell.trim());
}

function downloadCsv(filename: string, rows: any[], columns: string[]) {
  const header = columns.join(",");
  const body = rows
    .map((row) =>
      columns
        .map((key) => {
          const value = row[key];
          const rendered = value === null || value === undefined ? "" : String(value);
          return `"${rendered.replace(/"/g, '""')}"`;
        })
        .join(",")
    )
    .join("\n");

  const blob = new Blob([`${header}\n${body}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function DataCleaningPage() {
  const { t } = useI18n();
  const [stations, setStations] = useState<Station[]>([]);
  const [selectedStation, setSelectedStation] = useState("");
  const [candidates, setCandidates] = useState<CleanCandidate[]>(simulatedCandidates);
  const [baselineRows, setBaselineRows] = useState<Array<{ id: string; temperature: number; salinity: number; depth: number }>>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [autoCleaning, setAutoCleaning] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const [previewText, setPreviewText] = useState<string>("");
  const [preprocessingReport, setPreprocessingReport] = useState<PreprocessingReport | null>(null);
  const [preprocessingLoading, setPreprocessingLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [binAvgRows, setBinAvgRows] = useState<any[]>([]);
  const [savedSummary, setSavedSummary] = useState("尚未保存到数据库");
  const [savedCount, setSavedCount] = useState(0);
  const [history, setHistory] = useState<Array<{ id: string; action: string; summary: string; createdAt: string; user?: { name?: string | null; initials?: string | null } }>>([]);
  const [versionSummary, setVersionSummary] = useState<{ previousCount: number; currentCount: number; deltaCount: number; temperatureDelta: number; changeLabel: string; summary: string } | null>(null);

  useEffect(() => {
    fetch("/api/stations")
      .then((r) => r.json())
      .then((data: Station[]) => {
        setStations(data);
        if (data.length > 0) setSelectedStation(data[0].id);
      });
  }, []);

  useEffect(() => {
    if (!selectedStation) return;

    setLoading(true);
    setErrorMessage("");
    setLog((prev) => [...prev, `加载测站 ${selectedStation} 的清洗预览...`]);

    fetch("/api/data-cleaning", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stationId: selectedStation }),
    })
      .then(async (res) => {
        const text = await res.text();
        const json = text ? JSON.parse(text) : null;
        if (!res.ok) {
          throw new Error(json?.error || text || "加载失败");
        }
        return json;
      })
      .then((data) => {
        const cleaned: CleanCandidate[] = (data.data ?? []).map((item: any) => {
          const normalized = coerceLegacyMeasurement(item);
          return {
            id: normalized.id,
            date: normalized.date,
            depth: normalized.depth,
            temperature: normalized.temperature,
            salinity: normalized.salinity,
            density: normalized.density,
            status: normalized.status,
            errors: normalized.errors,
          };
        });

        const nextBaseline = cleaned.map((row) => ({
          id: row.id,
          temperature: row.temperature,
          salinity: row.salinity,
          depth: row.depth,
        }));

        setCandidates(cleaned);
        setBaselineRows(nextBaseline);
        setPreviewText(`已加载 ${cleaned.length} 条记录，${cleaned.filter((item) => item.errors.length > 0).length} 条异常。`);
        setLog((prev) => [...prev, `清洗预览就绪：${cleaned.length} 条记录，${cleaned.filter((item) => item.errors.length > 0).length} 条异常。`]);
      })
      .catch((error) => {
        setErrorMessage(error.message || "无法加载数据");
        setLog((prev) => [...prev, `清洗预览加载失败：${error.message}`]);
      })
      .finally(() => setLoading(false));

    fetch(`/api/data-cleaning/history?stationId=${selectedStation}`)
      .then((res) => res.json())
      .then((data) => {
        setHistory(data.data ?? []);
      })
      .catch(() => {
        setHistory([]);
      });
  }, [selectedStation]);

  useEffect(() => {
    if (!selectedStation || candidates.length === 0) {
      setVersionSummary(null);
      return;
    }

    setVersionSummary(
      buildVersionComparisonSummary(
        baselineRows.length > 0 ? baselineRows : candidates.map((row) => ({
          id: row.id,
          temperature: row.temperature,
          salinity: row.salinity,
          depth: row.depth,
        })),
        candidates.map((row) => ({
          id: row.id,
          temperature: row.temperature,
          salinity: row.salinity,
          depth: row.depth,
        }))
      )
    );
  }, [candidates, baselineRows, selectedStation]);

  const invalidCount = useMemo(
    () => candidates.filter((row) => row.errors.length > 0).length,
    [candidates]
  );

  async function handleAutoClean() {
    if (!selectedStation) {
      setLog((prev) => [...prev, "请先选择测站。"]);
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/data-cleaning/commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stationId: selectedStation, operation: "autoClean" }),
      });
      const text = await res.text();
      const json = text ? JSON.parse(text) : null;
      if (!res.ok) throw new Error(json?.error || text || "自动校正失败");

      setLog((prev) => [...prev, json.summary]);
      setPreviewText(json.summary);

      const updatedIds = new Set(json.updated?.map((item: any) => item.id) ?? []);
      setCandidates((prev) =>
        prev.map((row) => {
          const updatedItem = json.updated?.find((item: any) => item.id === row.id);
          if (!updatedItem) return row;
          return {
            ...row,
            depth: updatedItem.depth,
            temperature: updatedItem.temperature,
            salinity: updatedItem.salinity,
            status: "normal",
            errors: [],
          };
        })
      );
    } catch (error: any) {
      setErrorMessage(error.message || "自动校正失败");
      setLog((prev) => [...prev, `自动校正失败：${error.message ?? "未知错误"}`]);
    } finally {
      setLoading(false);
    }
  }

  async function handleRemoveSelected() {
    if (!selectedStation) {
      setLog((prev) => [...prev, "请先选择测站。"]);
      return;
    }
    if (selectedIds.length === 0) {
      setLog((prev) => [...prev, "请先选择要剔除的记录。"]);
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/data-cleaning/commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stationId: selectedStation, operation: "removeSelected", selectedIds }),
      });
      const text = await res.text();
      const json = text ? JSON.parse(text) : null;
      if (!res.ok) throw new Error(json?.error || text || "剔除失败");

      setLog((prev) => [...prev, json.summary]);
      setCandidates((prev) => prev.filter((row) => !selectedIds.includes(row.id)));
      setSelectedIds([]);
      setPreviewText(json.summary);
    } catch (error: any) {
      setErrorMessage(error.message || "剔除失败");
      setLog((prev) => [...prev, `人工剔除失败：${error.message ?? "未知错误"}`]);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveCurrent() {
    if (!selectedStation) {
      setLog((prev) => [...prev, "请先选择测站后再保存。"]);
      return;
    }
    if (candidates.length === 0) {
      setLog((prev) => [...prev, "当前没有可保存的清洗结果。"]);
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      const previousRows = baselineRows.length > 0 ? baselineRows : candidates.map((row) => ({
        id: row.id,
        temperature: row.temperature,
        salinity: row.salinity,
        depth: row.depth,
      }));

      const res = await fetch("/api/data-cleaning/commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stationId: selectedStation,
          operation: "saveCurrent",
          cleanedRows: candidates.map((row) => ({
            id: row.id,
            date: row.date.toISOString(),
            depth: row.depth,
            temperature: row.temperature,
            salinity: row.salinity,
            density: row.density,
          })),
        }),
      });
      const text = await res.text();
      const json = text ? JSON.parse(text) : null;
      if (!res.ok) throw new Error(json?.error || text || "保存失败");

      const currentRows = candidates.map((row) => ({
        id: row.id,
        temperature: row.temperature,
        salinity: row.salinity,
        depth: row.depth,
      }));

      setVersionSummary(buildVersionComparisonSummary(previousRows, currentRows));
      setBaselineRows(currentRows);
      setSavedSummary(json.summary ?? "已保存到数据库");
      setSavedCount(json.savedCount ?? candidates.length);
      setLog((prev) => [...prev, json.summary]);
      setPreviewText(json.summary);
    } catch (error: any) {
      setErrorMessage(error.message || "保存失败");
      setLog((prev) => [...prev, `保存失败：${error.message ?? "未知错误"}`]);
    } finally {
      setLoading(false);
    }
  }

  async function handleRollbackPrevious() {
    if (!selectedStation) {
      setLog((prev) => [...prev, "请先选择测站后再回滚。"]);
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/data-cleaning/commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stationId: selectedStation, operation: "rollbackToPrevious" }),
      });
      const text = await res.text();
      const json = text ? JSON.parse(text) : null;
      if (!res.ok) throw new Error(json?.error || text || "回滚失败");

      setSavedSummary(json.summary ?? "已回滚到上一版本");
      setLog((prev) => [...prev, json.summary]);
      setPreviewText(json.summary);
      const refreshed = await fetch("/api/data-cleaning", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stationId: selectedStation }),
      });
      const refreshedJson = await refreshed.json();
      const nextRows = refreshedJson.data ?? [];
      setCandidates(nextRows.map((item: any) => ({
        id: item.id,
        date: item.date ? new Date(item.date) : new Date(),
        depth: item.depth,
        temperature: item.temperature,
        salinity: item.salinity,
        density: item.density,
        status: item.errors?.length ? "error" : "normal",
        errors: item.errors ?? [],
      })));
    } catch (error: any) {
      setErrorMessage(error.message || "回滚失败");
      setLog((prev) => [...prev, `回滚失败：${error.message ?? "未知错误"}`]);
    } finally {
      setLoading(false);
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }

  async function handlePreprocess() {
    if (candidates.length === 0) {
      setLog((prev) => [...prev, "请先加载测站数据再执行预处理。"]);
      return;
    }

    setPreprocessingLoading(true);
    setErrorMessage("");

    try {
      const rawData = candidates.map((row) => ({
        id: row.id,
        date: row.date,
        depth: Number.isFinite(row.depth) ? row.depth : 0,
        temperature: Number.isFinite(row.temperature) ? row.temperature : 0,
        salinity: Number.isFinite(row.salinity) ? row.salinity : 0,
        density: Number.isFinite(row.density) ? row.density : 0,
      }));

      const { cleaned, report, binAvg } = preprocessMeasurements(rawData);
      setPreprocessingReport(report);
      setBinAvgRows(binAvg ?? []);
      setCandidates(
        cleaned.map((item) => ({
          ...coerceLegacyMeasurement(item),
          status: Array.isArray(item.errors) && item.errors.length ? "error" : "normal",
          errors: Array.isArray(item.errors) ? item.errors : [],
        }))
      );

      setLog((prev) => [
        ...prev,
        `预处理完成：${report.rawAnomalies} -> ${report.processedAnomalies} 异常记录，评估得分 ${report.correctionQualityScore}。`,
      ]);
    } catch (error: any) {
      setErrorMessage(error.message || "预处理失败");
      setLog((prev) => [...prev, `预处理失败：${error.message ?? "未知错误"}`]);
    } finally {
      setPreprocessingLoading(false);
    }
  }

  async function handleImportCsv(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const rows = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
      if (rows.length < 2) throw new Error("CSV 文件至少需要表头和一条数据");

      const header = parseCsvLine(rows[0]).map((cell) => cell.toLowerCase());
      const parsed = rows.slice(1).map((line) => {
        const cells = parseCsvLine(line);
        const record: Record<string, string | number | undefined> = {};
        header.forEach((name, index) => {
          record[name] = cells[index] ?? "";
        });
        return normalizeImportedCtdRow(record);
      });

      if (parsed.length === 0) throw new Error("没有解析到有效 CTD 数据");

      setCandidates(
        parsed.map((item) => ({
          id: item.id,
          date: item.date,
          depth: item.depth,
          temperature: item.temperature,
          salinity: item.salinity,
          density: item.density,
          status: "normal",
          errors: [],
        }))
      );
      setSelectedIds([]);
      setPreviewText(`已导入 ${parsed.length} 条 CTD 记录，来源：${file.name}`);
      setLog((prev) => [...prev, `CSV 导入完成：${file.name}，共 ${parsed.length} 条记录。`]);
      setErrorMessage("");
    } catch (error: any) {
      setErrorMessage(error.message || "CSV 导入失败");
      setLog((prev) => [...prev, `CSV 导入失败：${error.message ?? "未知错误"}`]);
    } finally {
      event.target.value = "";
    }
  }

  function exportCurrentCsv() {
    if (candidates.length === 0) {
      setLog((prev) => [...prev, "没有可导出的清洗数据。"]);
      return;
    }

    downloadCsv(
      "ctd_cleaned_export.csv",
      candidates.map((row) => ({
        id: row.id,
        date: row.date.toISOString(),
        depth: row.depth,
        temperature: row.temperature,
        salinity: row.salinity,
        density: row.density,
        status: row.status,
        errors: row.errors.join("|")
      })),
      ["id", "date", "depth", "temperature", "salinity", "density", "status", "errors"]
    );
    setLog((prev) => [...prev, "已导出清洗结果 CSV。"]);
  }

  function exportBinAvgCsv() {
    if (binAvgRows.length === 0) {
      setLog((prev) => [...prev, "没有可导出的 1 dbar 层平均结果。"]);
      return;
    }

    downloadCsv(
      "ctd_binavg.csv",
      binAvgRows.map((row) => ({
        id: row.id,
        pr: row.pr,
        t: row.t,
        sp: row.sp,
        date: row.date?.toISOString?.() ?? "",
      })),
      ["id", "pr", "t", "sp", "date"]
    );
    setLog((prev) => [...prev, "已导出 1 dbar 层平均 CSV。"]);
  }

  function exportQcReportCsv() {
    const report = preprocessingReport ?? {
      rawRecords: candidates.length,
      rawAnomalies: candidates.filter((row) => row.errors.length > 0).length,
      processedAnomalies: candidates.filter((row) => row.errors.length > 0).length,
      anomalyReductionRate: 0,
      correctionQualityScore: 0,
      algorithmAccuracy: 0,
      summary: "质量控制报告",
      steps: [],
      binLevels: binAvgRows.length,
      qualityFlag: "CHECK",
      derivedSummary: {
        validPoints: candidates.length,
        densityRange: [0, 0],
        temperatureRange: [0, 0],
        binSize: 1,
        qualityFlag: "CHECK",
      },
      performance: { anomalyReduction: 0, correctionConsistency: 0, stabilityIndex: 0 },
    };

    const artifact = buildQcReportArtifact(report, candidates);
    downloadCsv(
      "ctd_qc_report.csv",
      [{
        stationName: artifact.stationName,
        qualityFlag: artifact.qualityFlag,
        rawRecords: artifact.rawRecords,
        validRecords: artifact.validRecords,
        invalidRecords: artifact.invalidRecords,
        processedAnomalies: artifact.processedAnomalies,
        rawAnomalies: artifact.rawAnomalies,
        anomalyReductionRate: artifact.anomalyReductionRate,
        correctionQualityScore: artifact.correctionQualityScore,
        algorithmAccuracy: artifact.algorithmAccuracy,
        summary: artifact.summary,
        binLevels: artifact.binLevels,
        exportedAt: artifact.exportedAt,
      }],
      [
        "stationName",
        "qualityFlag",
        "rawRecords",
        "validRecords",
        "invalidRecords",
        "processedAnomalies",
        "rawAnomalies",
        "anomalyReductionRate",
        "correctionQualityScore",
        "algorithmAccuracy",
        "summary",
        "binLevels",
        "exportedAt",
      ]
    );

    setLog((prev) => [...prev, "已导出 CTD 质量控制报告 CSV。"]);
  }

  return (
    <DashboardShell
      contentClassName="p-6"
      header={
        <TopBar
          title="数据清洗"
          right={
            <div className="flex items-center gap-3">
              <LocaleToggle />
              <ThemeToggle />
            </div>
          }
        />
      }
    >
      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <section className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-[#334155] dark:bg-[#0f172a]">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
              第一层：原始传感器校正算法（预处理必用）
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-slate-900 dark:text-slate-100">
              数据清洗模块
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
              自动检测异常值、缺失值、乱码、单位错乱，并提供一键校正或人工剔除两种方式，同时生成清洗日志。
            </p>
          </div>

          <div className="space-y-4 rounded-3xl bg-slate-50 p-4 dark:bg-[#111827]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">压力滞后校正</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  一阶滞后差分模型补偿压力传感器滞后。
                </p>
              </div>
              <Badge variant="secondary">必用</Badge>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              模拟公式：P_real = P_raw + τ · dP_raw/dt，结合滑动窗口稳定对齐温盐深采样。
            </p>
          </div>

          <div className="space-y-4 rounded-3xl bg-slate-50 p-4 dark:bg-[#111827]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">电导率-盐度换算</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  使用 UNESCO 83 标准公式转换标准化实用盐度。
                </p>
              </div>
              <Badge variant="secondary">标准</Badge>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              校验温温压组合间的合理范围，超出 0~42 的值将标记为异常并记入错误日志。
            </p>
          </div>

          <div className="space-y-4 rounded-3xl bg-slate-50 p-4 dark:bg-[#111827]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">温度热滞后校正</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  指数衰减模型+滑动平均降噪，修正温度响应滞后。
                </p>
              </div>
              <Badge variant="secondary">增强</Badge>
            </div>
          </div>

          <div className="space-y-4 rounded-3xl bg-slate-50 p-4 dark:bg-[#111827]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">异常值剔除</div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  3σ + 物理阈值双层过滤，剔除离群点和海洋物理不合理值。
                </p>
              </div>
              <Badge variant="secondary">规则</Badge>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              温度 -2~35℃，盐度 0~42，水深 ≥ 0。异常记录统一写入 `errors` JSON 字符串。
            </p>
          </div>
        </section>

        <section className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-[#334155] dark:bg-[#1e293b]">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">选择测站</p>
              <Select value={selectedStation} onValueChange={setSelectedStation}>
                <SelectTrigger className="mt-2 h-11 text-sm">
                  <SelectValue placeholder="请选择测站" />
                </SelectTrigger>
                <SelectContent>
                  {stations.map((station) => (
                    <SelectItem key={station.id} value={station.id}>{station.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {loading && (
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">正在加载测站数据…</p>
              )}
              {errorMessage && (
                <p className="mt-2 text-sm text-rose-600 dark:text-rose-300">{errorMessage}</p>
              )}
              {previewText && !loading && !errorMessage && (
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{previewText}</p>
              )}
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-[#334155] dark:bg-[#1e293b]">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">清洗日志</p>
              <textarea
                className="mt-2 min-h-[160px] w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200 dark:border-slate-700 dark:bg-[#0f172a] dark:text-slate-100 dark:focus:border-sky-400 dark:focus:ring-sky-500/30"
                value={log.join("\n")}
                readOnly
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-4">
            <Button onClick={handleAutoClean} className="gap-2 rounded-xl bg-sky-500 hover:bg-sky-600">
              <CheckCircle2 className="h-4 w-4" />
              一键自动校正
            </Button>
            <Button onClick={handleRemoveSelected} className="gap-2 rounded-xl bg-rose-500 hover:bg-rose-600">
              <Trash2 className="h-4 w-4" />
              人工剔除脏数据
            </Button>
            <Button
              onClick={handlePreprocess}
              disabled={preprocessingLoading || !selectedStation}
              className="gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-600"
            >
              <ArrowRight className="h-4 w-4" />
              {preprocessingLoading ? "预处理中..." : "开始深度预处理"}
            </Button>
            <Button
              onClick={handleSaveCurrent}
              disabled={loading || !selectedStation || candidates.length === 0}
              className="gap-2 rounded-xl bg-violet-500 hover:bg-violet-600"
            >
              <CheckCircle2 className="h-4 w-4" />
              保存清洗结果
            </Button>
            <Button
              onClick={handleRollbackPrevious}
              disabled={loading || !selectedStation}
              className="gap-2 rounded-xl bg-orange-500 hover:bg-orange-600"
            >
              <ArrowRight className="h-4 w-4" />
              回滚到上一版本
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-[#334155] dark:bg-[#1e293b]">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">数据库状态</p>
              <p className="mt-3 text-2xl font-semibold text-slate-900 dark:text-slate-100">{savedCount}</p>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{savedSummary}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-[#334155] dark:bg-[#1e293b]">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">测站历史</p>
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                {stations.find((station) => station.id === selectedStation)?.name ?? "当前未选择测站"}
              </p>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                {stations.find((station) => station.id === selectedStation)
                  ? `已入库 ${stations.find((station) => station.id === selectedStation)?._count?.measurements ?? 0} 条记录`
                  : "请选择一个测站以查看历史版本"}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-[#334155] dark:bg-[#1e293b]">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">清洗历史轨迹</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">查看测站最近的清洗、校正和剔除事件</p>
              </div>
              <Badge variant="secondary">审计</Badge>
            </div>

            {versionSummary && (
              <div className="mb-4 rounded-2xl bg-violet-50 p-4 text-sm text-violet-700 dark:bg-violet-950/40 dark:text-violet-200">
                <p className="font-semibold">版本对比：{versionSummary.changeLabel}</p>
                <p className="mt-1">{versionSummary.summary}</p>
              </div>
            )}

            {history.length === 0 ? (
              <p className="text-sm text-slate-600 dark:text-slate-300">当前测站暂无清洗历史记录。</p>
            ) : (
              <div className="space-y-3">
                {history.map((entry) => (
                  <div key={entry.id} className="rounded-2xl bg-slate-50 p-4 dark:bg-[#0f172a]">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{entry.action}</p>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {new Date(entry.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">{entry.summary}</p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      操作人：{entry.user?.name ?? "系统"}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-[#334155] dark:bg-[#1e293b]">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">真实 CTD CSV 导入</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">支持 pr/t/c 或 depth/temperature/salinity 等常见列名</p>
              </div>
              <Badge variant="secondary">上传</Badge>
            </div>
            <label className="flex cursor-pointer items-center justify-center rounded-xl border border-dashed border-sky-300 bg-sky-50 px-4 py-6 text-sm font-medium text-sky-700 transition hover:bg-sky-100 dark:border-sky-700 dark:bg-sky-950/40 dark:text-sky-200">
              <input type="file" accept=".csv,.txt" className="hidden" onChange={handleImportCsv} />
              选择 CTD CSV / TXT 文件
            </label>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button type="button" variant="outline" onClick={exportCurrentCsv} className="rounded-xl">
                导出清洗结果 CSV
              </Button>
              <Button type="button" variant="outline" onClick={exportBinAvgCsv} className="rounded-xl">
                导出 1 dbar 层平均
              </Button>
              <Button type="button" variant="outline" onClick={exportQcReportCsv} className="rounded-xl">
                导出 QC 报告
              </Button>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-[#334155] dark:bg-[#1e293b]">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">数据预处理模块</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  对已传输的标准化 CTD 数据执行深度预处理，并使用内置智能评测指标量化评估结果。
                </p>
              </div>
              <Badge variant="secondary">智能评测</Badge>
            </div>
            {preprocessingReport ? (
              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  { label: "原始异常", value: preprocessingReport.rawAnomalies },
                  { label: "处理后异常", value: preprocessingReport.processedAnomalies },
                  { label: "异常降低率", value: `${Math.round(preprocessingReport.anomalyReductionRate * 100)}%` },
                ].map((item) => (
                  <div key={item.label} className="rounded-2xl bg-slate-50 p-4 dark:bg-[#0f172a]">
                    <p className="text-xs text-slate-500 dark:text-slate-400">{item.label}</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">{item.value}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-600 dark:text-slate-300">点击“开始深度预处理”即可生成评测结果。</p>
            )}
          </div>

          {preprocessingReport && (
            <>
              <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-[#334155] dark:bg-[#1e293b]">
                <h3 className="mb-4 text-sm font-semibold text-slate-900 dark:text-slate-100">清洗步骤审计</h3>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {preprocessingReport.steps.map((step) => (
                    <div key={step.name} className="rounded-2xl bg-slate-50 p-4 dark:bg-[#0f172a]">
                      <p className="text-xs text-slate-500 dark:text-slate-400">{step.description}</p>
                      <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">{step.removed}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-[#334155] dark:bg-[#1e293b]">
                <h3 className="mb-4 text-sm font-semibold text-slate-900 dark:text-slate-100">1 dbar 层平均与派生变量</h3>
                <div className="grid gap-4 sm:grid-cols-4">
                  <div className="rounded-2xl bg-slate-50 p-4 dark:bg-[#0f172a]">
                    <p className="text-xs text-slate-500 dark:text-slate-400">有效样本数</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">{preprocessingReport.derivedSummary.validPoints}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4 dark:bg-[#0f172a]">
                    <p className="text-xs text-slate-500 dark:text-slate-400">层平均数</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">{preprocessingReport.binLevels}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4 dark:bg-[#0f172a]">
                    <p className="text-xs text-slate-500 dark:text-slate-400">温度区间</p>
                    <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100">{preprocessingReport.derivedSummary.temperatureRange[0].toFixed(2)} ~ {preprocessingReport.derivedSummary.temperatureRange[1].toFixed(2)} ℃</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4 dark:bg-[#0f172a]">
                    <p className="text-xs text-slate-500 dark:text-slate-400">密度区间</p>
                    <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100">{preprocessingReport.derivedSummary.densityRange[0].toFixed(2)} ~ {preprocessingReport.derivedSummary.densityRange[1].toFixed(2)} kg/m³</p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-[#334155] dark:bg-[#1e293b]">
                <h3 className="mb-4 text-sm font-semibold text-slate-900 dark:text-slate-100">预处理性能指标</h3>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-2xl bg-slate-50 p-4 dark:bg-[#0f172a]">
                    <p className="text-xs text-slate-500 dark:text-slate-400">评估得分</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">{preprocessingReport.correctionQualityScore}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4 dark:bg-[#0f172a]">
                    <p className="text-xs text-slate-500 dark:text-slate-400">一致性指数</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">{preprocessingReport.performance.correctionConsistency}%</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4 dark:bg-[#0f172a]">
                    <p className="text-xs text-slate-500 dark:text-slate-400">稳定性指数</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">{preprocessingReport.performance.stabilityIndex}%</p>
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-[#334155] dark:bg-[#1e293b]">
            <div className="flex items-center gap-3 text-sm font-semibold text-slate-900 dark:text-slate-100">
              <Sparkles className="h-4 w-4 text-amber-500" />
              异常数据预览
            </div>
            <div className="mt-4 space-y-3">
              {candidates.map((row) => {
                const safeDepth = Number.isFinite(row.depth) ? row.depth : 0;
                const safeTemperature = Number.isFinite(row.temperature) ? row.temperature : 0;
                const safeSalinity = Number.isFinite(row.salinity) ? row.salinity : 0;
                const safeDensity = Number.isFinite(row.density) ? row.density : 0;
                const rowErrors = Array.isArray(row.errors) ? row.errors : [];

                return (
                  <div
                    key={row.id}
                    className={`rounded-2xl border p-4 ${highlightStatus(row.status)}`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold">深度 {safeDepth.toFixed(2)} m</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          温度 {safeTemperature.toFixed(2)} ℃ · 盐度 {safeSalinity.toFixed(2)} PSU · 密度 {safeDensity.toFixed(2)}
                        </p>
                      </div>
                      <button
                        type="button"
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${rowErrors.length ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"}`}
                        onClick={() => toggleSelect(row.id)}
                      >
                        {selectedIds.includes(row.id) ? "已选中" : "选中"}
                      </button>
                    </div>
                    {rowErrors.length > 0 && (
                      <div className="mt-3 space-y-1 rounded-2xl bg-white/80 p-3 text-sm text-rose-700 dark:bg-[#6b2135]/10 dark:text-rose-200">
                        <p className="font-semibold">标记异常：</p>
                        <ul className="list-disc pl-5">
                          {rowErrors.map((err, idx) => (
                            <li key={idx}>{err}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-[#334155] dark:bg-[#1e293b]">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
              <ShieldCheck className="h-4 w-4 text-sky-500" />
              清洗算法说明
            </div>
            <ol className="space-y-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
              <li>1. 压力滞后校正（P_real = P_raw + τ · dP_raw/dt），修正上下放采样时的温盐深错位。</li>
              <li>2. 电导率-盐度转换采用 UNESCO83 规范，超出 0-42 范围视为异常。</li>
              <li>3. 温度热滞后校正使用指数衰减模型，并加滑动平均降噪。</li>
              <li>4. 异常值剔除采用 3σ + 物理阈值过滤，记录为结构化错误日志。</li>
            </ol>
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}
