"use client";

import { useEffect, useState, useCallback } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { TopBar } from "@/components/layout/topbar";
import { useI18n } from "@/components/i18n-provider";
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

export default function VisualizationPage() {
  const { t } = useI18n();
  const [stations, setStations] = useState<Station[]>([]);
  const [selectedStation, setSelectedStation] = useState("");
  const [profile, setProfile] = useState<ProfilePoint[]>([]);
  const [tab, setTab] = useState("overview");

  useEffect(() => {
    fetch("/api/stations")
      .then((r) => r.json())
      .then((data: Station[]) => {
        setStations(data);
        if (data.length > 0) setSelectedStation(data[0].id);
      });
  }, []);

  const fetchProfile = useCallback(async () => {
    if (!selectedStation) return;
    const res = await fetch("/api/analysis/thermocline", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stationId: selectedStation }),
    });
    const data = await res.json();
    if (data.profile) setProfile(data.profile);
  }, [selectedStation]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

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
                <SelectTrigger className="h-9 w-[160px] text-xs">
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
      {tab === "overview" && (
        <section className="grid gap-5 lg:grid-cols-2">
          {/* Depth-Temperature Profile */}
          <div className={chartContainerClass}>
            <div className={chartHeaderClass}>
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                {t("visualization.charts.depthTemp")}
              </h3>
            </div>
            <div className="p-4">
              <ResponsiveContainer width="100%" height={260}>
                <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis
                    dataKey="temperature"
                    name="Temp"
                    unit="℃"
                    type="number"
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis
                    dataKey="depth"
                    name="Depth"
                    unit="m"
                    reversed
                    type="number"
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip
                    formatter={((value: number | string, name: string) => [
                      `${value}${name === "Temp" ? "℃" : "m"}`,
                      name,
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    ]) as any}
                  />
                  <Scatter data={profile} fill="#0ea5e9" fillOpacity={0.7} r={4} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* T-S Diagram */}
          <div className={chartContainerClass}>
            <div className={chartHeaderClass}>
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                {t("visualization.charts.tsPlot")}
              </h3>
            </div>
            <div className="p-4">
              <ResponsiveContainer width="100%" height={260}>
                <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis
                    dataKey="salinity"
                    name="Salinity"
                    unit=" PSU"
                    type="number"
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis
                    dataKey="temperature"
                    name="Temp"
                    unit="℃"
                    type="number"
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip />
                  <Scatter data={profile} fill="#8b5cf6" fillOpacity={0.7} r={4} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Depth-Salinity Profile */}
          <div className={chartContainerClass}>
            <div className={chartHeaderClass}>
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                {t("visualization.charts.depthSalinity")}
              </h3>
            </div>
            <div className="p-4">
              <ResponsiveContainer width="100%" height={260}>
                <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis
                    dataKey="salinity"
                    name="Salinity"
                    unit=" PSU"
                    type="number"
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis
                    dataKey="depth"
                    name="Depth"
                    unit="m"
                    reversed
                    type="number"
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip />
                  <Scatter data={profile} fill="#10b981" fillOpacity={0.7} r={4} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Depth-Density Profile */}
          <div className={chartContainerClass}>
            <div className={chartHeaderClass}>
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                {t("visualization.charts.depthDensity")}
              </h3>
            </div>
            <div className="p-4">
              <ResponsiveContainer width="100%" height={260}>
                <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis
                    dataKey="density"
                    name="Density"
                    unit=" kg/m³"
                    type="number"
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis
                    dataKey="depth"
                    name="Depth"
                    unit="m"
                    reversed
                    type="number"
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip />
                  <Scatter data={profile} fill="#f59e0b" fillOpacity={0.7} r={4} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>
      )}

      {tab === "time" && (
        <section className={chartContainerClass}>
          <div className={chartHeaderClass}>
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              {t("visualization.tabs.timeSeries")}
            </h3>
          </div>
          <div className="p-4">
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={profile} margin={{ top: 10, right: 30, bottom: 10, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="depth" tick={{ fontSize: 11 }} label={{ value: "Depth (m)", position: "bottom", offset: 0 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="temperature" stroke="#0ea5e9" name="Temperature (℃)" dot={{ r: 3 }} />
                <Line type="monotone" dataKey="salinity" stroke="#8b5cf6" name="Salinity (PSU)" dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {tab === "stats" && (
        <section className="grid gap-5 lg:grid-cols-2">
          <div className={chartContainerClass}>
            <div className={chartHeaderClass}>
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                Temperature Profile
              </h3>
            </div>
            <div className="p-4">
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={profile} layout="vertical" margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis type="number" tick={{ fontSize: 11 }} label={{ value: "Temperature (℃)", position: "bottom" }} />
                  <YAxis dataKey="depth" type="number" reversed tick={{ fontSize: 11 }} label={{ value: "Depth (m)", angle: -90, position: "insideLeft" }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="temperature" stroke="#0ea5e9" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className={chartContainerClass}>
            <div className={chartHeaderClass}>
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                Salinity Profile
              </h3>
            </div>
            <div className="p-4">
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={profile} layout="vertical" margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis type="number" tick={{ fontSize: 11 }} label={{ value: "Salinity (PSU)", position: "bottom" }} />
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
