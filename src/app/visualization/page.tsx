"use client";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { TopBar } from "@/components/layout/topbar";
import { ThemeToggle } from "@/components/theme-toggle";
import { LocaleToggle } from "@/components/locale-toggle";
import { Flame, Grid3X3, Thermometer, Droplets } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { chartCards, timeSeriesCards } from "@/lib/mock-data";
import { useI18n } from "@/components/i18n-provider";

export default function VisualizationPage() {
  const { t } = useI18n();
  return (
    <DashboardShell
      contentClassName="p-6"
      header={
        <TopBar
          title={t("visualization.title")}
          left={
            <Tabs defaultValue="overview" className="hidden md:flex">
              <TabsList className="h-9 rounded-lg bg-slate-100 p-1 dark:bg-[#334155]">
                <TabsTrigger value="overview">
                  {t("visualization.tabs.overview")}
                </TabsTrigger>
                <TabsTrigger value="time">
                  {t("visualization.tabs.timeSeries")}
                </TabsTrigger>
                <TabsTrigger value="stats">
                  {t("visualization.tabs.statistics")}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          }
          right={
            <div className="flex items-center gap-3">
              <Select defaultValue="station-049">
                <SelectTrigger className="h-9 w-48 rounded-lg border-slate-200 bg-white text-[13px] text-slate-700 dark:border-[#334155] dark:bg-[#1e293b] dark:text-slate-200">
                  <SelectValue placeholder={t("common.selectStation")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="station-049">
                    {t("visualization.stations.station049")}
                  </SelectItem>
                  <SelectItem value="station-115">
                    {t("visualization.stations.station115")}
                  </SelectItem>
                  <SelectItem value="station-221">
                    {t("visualization.stations.station221")}
                  </SelectItem>
                  <SelectItem value="station-305">
                    {t("visualization.stations.station305")}
                  </SelectItem>
                </SelectContent>
              </Select>
              <LocaleToggle />
              <ThemeToggle />
            </div>
          }
        />
      }
    >
      <section className="grid gap-5 lg:grid-cols-2">
        {chartCards.map((chart) => {
          const Icon =
            chart.icon === "thermometer"
              ? Thermometer
              : chart.icon === "grid-3x3"
              ? Grid3X3
              : chart.icon === "droplets"
              ? Droplets
              : Flame;
          return (
            <div
              key={chart.key}
              className="overflow-hidden rounded-[10px] border border-slate-200 bg-white dark:border-[#334155] dark:bg-[#1e293b]"
            >
              <div className="flex h-[52px] items-center justify-between border-b border-slate-100 px-5 dark:border-[#334155]">
                <div className="flex items-center gap-2">
                  <Icon className="h-[18px] w-[18px]" style={{ color: chart.color }} />
                  <span className="text-sm font-semibold text-[#0c4a6e] dark:text-[#f0f9ff]">
                    {t(chart.titleKey)}
                  </span>
                </div>
                <div className="hidden items-center gap-4 text-[11px] text-slate-400 md:flex">
                  {chart.legendKeys.map((item, index) => (
                    <span key={`${chart.key}-${item}`} className="flex items-center gap-1">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: chart.color, opacity: 0.4 + index * 0.2 }}
                      />
                      {t(item)}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex h-[240px] items-center justify-center text-sm text-slate-400 dark:text-slate-500">
                {t("visualization.chartPlaceholder")}
              </div>
            </div>
          );
        })}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-slate-600 dark:text-slate-300">
          {t("visualization.timeSeriesTitle")}
        </h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {timeSeriesCards.map((title) => (
            <div
              key={title}
              className="rounded-[10px] border border-slate-200 bg-white p-4 dark:border-[#334155] dark:bg-[#1e293b]"
            >
              <div className="text-sm font-semibold text-[#0c4a6e] dark:text-[#f0f9ff]">
                {t(title)}
              </div>
              <div className="mt-3 flex h-24 items-center justify-center rounded-md border border-dashed border-slate-200 bg-slate-50 text-xs text-slate-400 dark:border-[#334155] dark:bg-[#0f172a] dark:text-slate-500">
                {t("visualization.sparkline")}
              </div>
            </div>
          ))}
        </div>
      </section>
    </DashboardShell>
  );
}
