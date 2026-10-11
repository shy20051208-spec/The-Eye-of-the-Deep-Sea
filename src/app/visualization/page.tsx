"use client";

import { useEffect, useState, useCallback } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { TopBar } from "@/components/layout/topbar";
import { useI18n } from "@/components/i18n-provider";
import { buildVisualizationInsight } from "@/lib/visualization";
import { LocaleToggle } from "@/components/locale-toggle";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from "recharts";

interface Station {
  id: string;
  name: string;
  seaArea: string;
}

interface ProfilePoint {
  depth: number;
  temperature: number;
  salinity: number;
  density: number;
}

interface AnalysisData {
  thermocline: {
    topDepth: number;
    bottomDepth: number;
    centerDepth: number;
    maxGradient: number;
    layers: Array<{ name: string; depthRange: [number, number]; tempRange: [number, number] }>;
  } | null;
  statistics: {
    temperature: { min: number; max: number; mean: number; std: number };
    salinity: { min: number; max: number; mean: number };
    density: { min: number; max: number; mean: number };
  };
  profile: ProfilePoint[];
  pointCount: number;
}

export default function VisualizationPage() {
  const { t } = useI18n();
  const [stations, setStations] = useState<Station[]>([]);
  const [selectedStation, setSelectedStation] = useState("");
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [tab, setTab] = useState("overview");

  useEffect(() => {
    fetch("/api/stations")
      .then((r) => r.json())
      .then((data: Station[]) => {
        setStations(data);
        if (data.length > 0) setSelectedStation(data[0].id);
      })
      .catch(() => setStations([]));
  }, []);

  const fetchProfile = useCallback(async () => {
    if (!selectedStation) {
      setAnalysisData(null);
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/analysis/thermocline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stationId: selectedStation }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "无法加载可视化数据");
      }
      setAnalysisData(data);
    } catch (error: any) {
      setErrorMessage(error.message || "加载分析数据失败");
      setAnalysisData(null);
    } finally {
      setLoading(false);
    }
  }, [selectedStation]);

  useEffect(() => {
    void fetchProfile();
  }, [fetchProfile]);

  const profile = analysisData?.profile ?? [];
  const stats = analysisData?.statistics;
  const thermocline = analysisData?.thermocline;
  const insight = buildVisualizationInsight({ stationName: stations.find((s) => s.id === selectedStation)?.name ?? "当前站点", analysisData });

  const summaryCards = insight.kpis.map((card) => ({
    label: card.label,
    value: card.value,
    detail: card.detail,
  }));

  const chartContainerClass =
    "overflow-hidden rounded-[10px] border border-slate-200 bg-white dark:border-[#334155] dark:bg-[#1e293b]";
  const chartHeaderClass =
    "flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-[#334155]";

  return (
    <DashboardShell
      contentClassName="p-6"
      header={
        <TopBar
          title={t("visualization.title")}
          left={
            <Tabs value={tab} onValueChange={setTab} className="hidden md:flex">
              <TabsList className="h-9 rounded-lg bg-slate-100 p-1 dark:bg-[#334155]">
                <TabsTrigger value="overview">{t("visualization.tabs.overview")}</TabsTrigger>
                <TabsTrigger value="time">{t("visualization.tabs.timeSeries")}</TabsTrigger>
                <TabsTrigger value="stats">{t("visualization.tabs.statistics")}</TabsTrigger>
              </TabsList>
            </Tabs>
          }
          right={
            <div className="flex items-center gap-3">
              <Select value={selectedStation} onValueChange={setSelectedStation}>
                <SelectTrigger className="h-9 w-[180px] text-xs">
                  <SelectValue placeholder="Select station" />
                </SelectTrigger>
                <SelectContent>
                  {stations.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <LocaleToggle />
              <ThemeToggle />
            </div>
          }
        />
      }
    >
      <div className="space-y-5">
        <div className="rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-800 dark:border-sky-900/60 dark:bg-sky-950/40 dark:text-sky-200">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-700 dark:text-sky-300">Scientific narrative</p>
              <h3 className="mt-1 text-lg font-semibold">{insight.stationName}</h3>
            </div>
            <span className="rounded-full border border-sky-200 bg-white px-2.5 py-1 text-[11px] font-medium dark:border-sky-800 dark:bg-sky-900/50">{insight.layerSummary}</span>
          </div>
          <p className="mt-3 leading-6 text-sky-800/90 dark:text-sky-100/90">{insight.narrative}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => (
            <div key={card.label} className="rounded-xl border border-slate-200 bg-white p-4 dark:border-[#334155] dark:bg-[#1e293b]">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">{card.label}</p>
              <p className="mt-3 text-2xl font-semibold text-slate-900 dark:text-slate-100">{card.value}</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{card.detail}</p>
            </div>
          ))}
        </div>

        {errorMessage && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200">
            {errorMessage}
          </div>
        )}

        {loading && (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600 dark:border-[#334155] dark:bg-[#1e293b] dark:text-slate-300">
            正在加载测站可视化数据…
          </div>
        )}

        {!loading && !errorMessage && profile.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600 dark:border-slate-700 dark:bg-[#0f172a] dark:text-slate-300">
            当前测站没有可展示的 CTD 剖面数据，请先导入或保存清洗结果。
          </div>
        )}
      </div>

      {!loading && profile.length > 0 && tab === "overview" && (
        <section className="mt-6 grid gap-5 lg:grid-cols-2">
          <div className={chartContainerClass}>
            <div className={chartHeaderClass}>
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">{t("visualization.charts.depthTemp")}</h3>
            </div>
            <div className="p-4">
              <ResponsiveContainer width="100%" height={260}>
                <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="temperature" name="Temp" unit="℃" type="number" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="depth" name="Depth" unit="m" reversed type="number" tick={{ fontSize: 11 }} />
                  <Tooltip formatter={((value: number | string, name: string) => [`${value}${name === "Temp" ? "℃" : "m"}`, name]) as any} />
                  <Scatter data={profile} fill="#0ea5e9" fillOpacity={0.7} r={4} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className={chartContainerClass}>
            <div className={chartHeaderClass}>
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">{t("visualization.charts.tsPlot")}</h3>
            </div>
            <div className="p-4">
              <ResponsiveContainer width="100%" height={260}>
                <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="salinity" name="Salinity" unit=" PSU" type="number" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="temperature" name="Temp" unit="℃" type="number" tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Scatter data={profile} fill="#8b5cf6" fillOpacity={0.7} r={4} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className={chartContainerClass}>
            <div className={chartHeaderClass}>
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">{t("visualization.charts.depthSalinity")}</h3>
            </div>
            <div className="p-4">
              <ResponsiveContainer width="100%" height={260}>
                <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="salinity" name="Salinity" unit=" PSU" type="number" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="depth" name="Depth" unit="m" reversed type="number" tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Scatter data={profile} fill="#10b981" fillOpacity={0.7} r={4} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className={chartContainerClass}>
            <div className={chartHeaderClass}>
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">{t("visualization.charts.depthDensity")}</h3>
            </div>
            <div className="p-4">
              <ResponsiveContainer width="100%" height={260}>
                <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="density" name="Density" unit=" kg/m³" type="number" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="depth" name="Depth" unit="m" reversed type="number" tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Scatter data={profile} fill="#f59e0b" fillOpacity={0.7} r={4} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>
      )}

      {!loading && profile.length > 0 && tab === "time" && (
        <section className="mt-6">
          <div className={chartContainerClass}>
            <div className={chartHeaderClass}>
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">{t("visualization.tabs.timeSeries")}</h3>
            </div>
            <div className="p-4">
              <ResponsiveContainer width="100%" height={420}>
                <LineChart data={profile} margin={{ top: 10, right: 30, bottom: 50, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="depth" tick={{ fontSize: 11 }} label={{ value: "Depth (m)", position: "insideBottom", offset: -30 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend verticalAlign="bottom" wrapperStyle={{ paddingTop: 40 }} />
                  <Line type="monotone" dataKey="temperature" stroke="#0ea5e9" name="Temperature (℃)" dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="salinity" stroke="#8b5cf6" name="Salinity (PSU)" dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>
      )}

      {!loading && profile.length > 0 && tab === "stats" && (
        <section className="mt-6 grid gap-5 lg:grid-cols-2">
          <div className={chartContainerClass}>
            <div className={chartHeaderClass}>
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Temperature Profile</h3>
            </div>
            <div className="p-4">
              <ResponsiveContainer width="100%" height={370}>
                <LineChart data={profile} layout="vertical" margin={{ top: 10, right: 20, bottom: 30, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis type="number" tick={{ fontSize: 11 }} label={{ value: "Temperature (℃)", position: "insideBottom", offset: -10 }} />
                  <YAxis dataKey="depth" type="number" reversed tick={{ fontSize: 11 }} label={{ value: "Depth (m)", angle: -90, position: "insideLeft" }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="temperature" stroke="#0ea5e9" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className={chartContainerClass}>
            <div className={chartHeaderClass}>
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Salinity Profile</h3>
            </div>
            <div className="p-4">
              <ResponsiveContainer width="100%" height={370}>
                <LineChart data={profile} layout="vertical" margin={{ top: 10, right: 20, bottom: 30, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis type="number" tick={{ fontSize: 11 }} label={{ value: "Salinity (PSU)", position: "insideBottom", offset: -10 }} />
                  <YAxis dataKey="depth" type="number" reversed tick={{ fontSize: 11 }} label={{ value: "Depth (m)", angle: -90, position: "insideLeft" }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="salinity" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>
      )}
    </DashboardShell>
  );
}
