"use client";

import { useEffect, useState, useCallback } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { TopBar } from "@/components/layout/topbar";
import { useI18n } from "@/components/i18n-provider";
import { LocaleToggle } from "@/components/locale-toggle";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
} from "recharts";
import { Play, FileText, Activity, Layers, Thermometer } from "lucide-react";

interface Station {
  id: string;
  name: string;
}

interface ThermoclineResult {
  topDepth: number;
  bottomDepth: number;
  centerDepth: number;
  maxGradient: number;
  layers: { name: string; depthRange: [number, number]; tempRange: [number, number] }[];
}

interface AnalysisData {
  thermocline: ThermoclineResult | null;
  statistics: {
    temperature: { min: number; max: number; mean: number; std: number };
    salinity: { min: number; max: number; mean: number };
    density: { min: number; max: number; mean: number };
  };
  profile: { depth: number; temperature: number; salinity: number; density: number }[];
  pointCount: number;
}

interface AuditLog {
  id: string;
  action: string;
  detail: string;
  createdAt: string;
  user: { name: string; initials: string };
}

export default function AnalysisPage() {
  const { t } = useI18n();
  const [stations, setStations] = useState<Station[]>([]);
  const [selectedStation, setSelectedStation] = useState("");
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    fetch("/api/stations")
      .then((r) => r.json())
      .then((data: Station[]) => {
        setStations(data);
        if (data.length > 0) setSelectedStation(data[0].id);
      });
    fetch("/api/audit-logs")
      .then((r) => r.json())
      .then((data) => setLogs(data.data || []));
  }, []);

  const runAnalysis = useCallback(async () => {
    if (!selectedStation) return;
    setRunning(true);
    const res = await fetch("/api/analysis/thermocline", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stationId: selectedStation }),
    });
    const data = await res.json();
    setAnalysisData(data);
    setRunning(false);
  }, [selectedStation]);

  const thermo = analysisData?.thermocline;
  const stats = analysisData?.statistics;

  return (
    <DashboardShell
      contentClassName="p-6"
      header={
        <TopBar
          title={t("analysis.title")}
          left={
            <span className="inline-flex h-6 items-center gap-1 rounded-full bg-emerald-50 px-3 text-[11px] font-semibold text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400" />
              {t("common.aiReady")}
            </span>
          }
          right={
            <div className="flex items-center gap-3">
              <Button
                onClick={runAnalysis}
                disabled={running}
                className="h-[38px] gap-2 rounded-lg bg-sky-500 px-4 text-[13px] font-semibold hover:bg-sky-600"
              >
                <Play className="h-4 w-4" />
                {running ? "Running..." : t("analysis.runAnalysis")}
              </Button>
              <LocaleToggle />
              <ThemeToggle />
            </div>
          }
        />
      }
    >
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Config + Results */}
        <div className="space-y-5 lg:col-span-2">
          {/* Configuration */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-[#334155] dark:bg-[#1e293b]">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
              <Layers className="h-4 w-4 text-sky-500" />
              {t("analysis.config.title")}
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs text-slate-500">{t("analysis.config.station")}</label>
                <Select value={selectedStation} onValueChange={setSelectedStation}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Select station" />
                  </SelectTrigger>
                  <SelectContent>
                    {stations.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-500">{t("analysis.config.type")}</label>
                <Select defaultValue="thermocline">
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="thermocline">Thermocline Detection</SelectItem>
                    <SelectItem value="statistics">Statistical Summary</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Thermocline Chart */}
          {analysisData && (
            <div className="rounded-xl border border-slate-200 bg-white dark:border-[#334155] dark:bg-[#1e293b]">
              <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-3 dark:border-[#334155]">
                <Thermometer className="h-4 w-4 text-sky-500" />
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Temperature Profile & Thermocline
                </h3>
              </div>
              <div className="p-4">
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart
                    data={analysisData.profile}
                    layout="vertical"
                    margin={{ top: 10, right: 30, bottom: 10, left: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis type="number" tick={{ fontSize: 11 }} label={{ value: "Temperature (℃)", position: "bottom" }} />
                    <YAxis dataKey="depth" type="number" reversed tick={{ fontSize: 11 }} label={{ value: "Depth (m)", angle: -90, position: "insideLeft" }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="temperature" stroke="#0ea5e9" strokeWidth={2} dot={{ r: 3 }} />
                    {thermo && (
                      <>
                        <ReferenceArea
                          y1={thermo.topDepth}
                          y2={thermo.bottomDepth}
                          fill="#f59e0b"
                          fillOpacity={0.15}
                          label={{ value: "Thermocline", position: "insideLeft", fontSize: 11 }}
                        />
                        <ReferenceLine y={thermo.centerDepth} stroke="#ef4444" strokeDasharray="5 5" label={{ value: `Max gradient: ${thermo.maxGradient}℃/m`, position: "right", fontSize: 10 }} />
                      </>
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Statistics Summary */}
          {stats && (
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { label: "Temperature", data: stats.temperature, unit: "℃", color: "sky" },
                { label: "Salinity", data: stats.salinity, unit: "PSU", color: "violet" },
                { label: "Density", data: stats.density, unit: "kg/m³", color: "amber" },
              ].map((item) => (
                <div key={item.label} className="rounded-xl border border-slate-200 bg-white p-4 dark:border-[#334155] dark:bg-[#1e293b]">
                  <h4 className="mb-3 text-xs font-semibold uppercase text-slate-400">{item.label}</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-slate-500">Min</span><span className="font-medium text-slate-700 dark:text-slate-200">{item.data.min} {item.unit}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Max</span><span className="font-medium text-slate-700 dark:text-slate-200">{item.data.max} {item.unit}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Mean</span><span className="font-medium text-slate-700 dark:text-slate-200">{item.data.mean} {item.unit}</span></div>
                    {"std" in item.data && (
                      <div className="flex justify-between"><span className="text-slate-500">Std</span><span className="font-medium text-slate-700 dark:text-slate-200">{(item.data as { std: number }).std} {item.unit}</span></div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Thermocline Result */}
          {thermo && (
            <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-[#334155] dark:bg-[#1e293b]">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                <Activity className="h-4 w-4 text-amber-500" />
                Thermocline Detection Result
              </h3>
              <div className="grid gap-3 sm:grid-cols-3">
                {thermo.layers.map((layer) => (
                  <div key={layer.name} className="rounded-lg bg-slate-50 p-3 dark:bg-[#0f172a]">
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">{layer.name}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Depth: {layer.depthRange[0]}–{layer.depthRange[1]}m
                    </p>
                    <p className="text-xs text-slate-500">
                      Temp: {layer.tempRange[0]}–{layer.tempRange[1]}℃
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Activity Log */}
        <div className="rounded-xl border border-slate-200 bg-white dark:border-[#334155] dark:bg-[#1e293b]">
          <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3 dark:border-[#334155]">
            <FileText className="h-4 w-4 text-slate-400" />
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              {t("analysis.activityLog")}
            </h3>
          </div>
          <div className="max-h-[600px] overflow-y-auto p-4">
            {logs.length === 0 ? (
              <p className="text-center text-xs text-slate-400">No activity yet</p>
            ) : (
              <div className="space-y-3">
                {logs.map((log) => (
                  <div key={log.id} className="flex gap-3 border-b border-slate-50 pb-3 last:border-0 dark:border-[#1e293b]">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sky-100 text-[10px] font-bold text-sky-600 dark:bg-sky-500/20 dark:text-sky-400">
                      {log.user.initials}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-slate-700 dark:text-slate-200">{log.user.name}</p>
                      <p className="text-[11px] text-slate-500">{log.detail}</p>
                      <p className="mt-0.5 text-[10px] text-slate-400">
                        {new Date(log.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
