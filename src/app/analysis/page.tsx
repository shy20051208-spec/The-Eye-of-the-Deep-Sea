"use client";

import {
  Activity,
  Compass,
  Cpu,
  FileText,
  History,
  Layers,
  Play,
  Settings2,
} from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { TopBar } from "@/components/layout/topbar";
import { ThemeToggle } from "@/components/theme-toggle";
import { LocaleToggle } from "@/components/locale-toggle";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/i18n-provider";

export default function AnalysisPage() {
  const { t } = useI18n();
  return (
    <DashboardShell
      contentClassName="p-6"
      header={
        <TopBar
          title={t("analysis.title")}
          left={
            <span className="inline-flex h-6 items-center gap-1 rounded-full bg-emerald-50 px-3 text-[11px] font-semibold text-emerald-600">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
              {t("common.aiReady")}
            </span>
          }
          right={
            <div className="flex items-center gap-3">
              <Button className="h-[38px] gap-2 rounded-lg bg-sky-500 px-4 text-[13px] font-semibold hover:bg-sky-600">
                <Play className="h-4 w-4" />
                {t("analysis.runAnalysis")}
              </Button>
              <Button
                variant="outline"
                className="h-[38px] gap-2 rounded-lg border-slate-200 bg-white px-4 text-[13px] font-medium text-slate-700 hover:bg-slate-50 dark:border-[#334155] dark:bg-[#1e293b] dark:text-slate-200 dark:hover:bg-[#334155]"
              >
                <FileText className="h-4 w-4 text-slate-500" />
                {t("analysis.generateReport")}
              </Button>
              <LocaleToggle />
              <ThemeToggle />
            </div>
          }
        />
      }
    >
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-5">
          <section className="overflow-hidden rounded-[10px] border border-slate-200 bg-white dark:border-[#334155] dark:bg-[#1e293b]">
            <div className="flex h-11 items-center justify-between border-b border-slate-200 bg-sky-50 px-4 dark:border-[#334155] dark:bg-[#0f172a]">
              <div className="flex items-center gap-2 text-[13px] font-semibold text-[#0c4a6e] dark:text-[#f0f9ff]">
                <Settings2 className="h-4 w-4 text-sky-500" />
                {t("analysis.config.title")}
              </div>
              <span className="text-slate-400">▴</span>
            </div>
            <div className="grid gap-4 p-4 md:grid-cols-2">
              <div className="space-y-2">
                <p className="text-[11px] font-semibold text-slate-600">
                  {t("analysis.config.analysisType")}
                </p>
                <div className="flex h-9 items-center rounded-md border border-slate-200 bg-white px-3 text-[13px] text-slate-500 dark:border-[#334155] dark:bg-[#1e293b]">
                  {t("analysis.config.anomalyDetection")}
                </div>
                <p className="text-[11px] font-semibold text-slate-600">
                  {t("analysis.config.thermoclineMethod")}
                </p>
                <div className="flex h-9 items-center rounded-md border border-slate-200 bg-white px-3 text-[13px] text-slate-500 dark:border-[#334155] dark:bg-[#1e293b]">
                  {t("analysis.config.gradientBased")}
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-[11px] font-semibold text-slate-600">
                  {t("analysis.config.depthRange")}
                </p>
                <div className="flex h-9 items-center justify-between rounded-md border border-slate-200 bg-white px-3 text-[13px] text-slate-500 dark:border-[#334155] dark:bg-[#1e293b]">
                  <span>0 - 500</span>
                  <span className="text-slate-400">{t("common.auto")}</span>
                </div>
                <p className="text-[11px] font-semibold text-slate-600">
                  {t("analysis.config.gradientThreshold")}
                </p>
                <div className="flex h-9 items-center rounded-md border border-slate-200 bg-white px-3 text-[13px] text-slate-500 dark:border-[#334155] dark:bg-[#1e293b]">
                  0.42 ℃/m
                </div>
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-[10px] border border-slate-200 bg-white dark:border-[#334155] dark:bg-[#1e293b]">
            <div className="flex h-[52px] items-center gap-2 border-b border-slate-100 px-5 text-sm font-semibold text-[#0c4a6e] dark:border-[#334155] dark:text-[#f0f9ff]">
              <Activity className="h-[18px] w-[18px] text-sky-500" />
              {t("analysis.summaryTitle", { station: "ST-001" })}
            </div>
            <div className="grid gap-3 p-5 md:grid-cols-3">
              {[
                { labelKey: "analysis.summaryCards.meanTemp", value: "18.4℃", bg: "bg-sky-50", border: "border-sky-200" },
                { labelKey: "analysis.summaryCards.meanSalinity", value: "34.86 PSU", bg: "bg-blue-50", border: "border-blue-200" },
                { labelKey: "analysis.summaryCards.density", value: "1025.7", bg: "bg-purple-50", border: "border-purple-200" },
              ].map((item) => (
                <div
                  key={item.labelKey}
                  className={`rounded-lg border p-4 ${item.bg} ${item.border}`}
                >
                  <p className="text-xs font-semibold text-slate-500">
                    {t(item.labelKey)}
                  </p>
                  <p className="mt-2 text-lg font-semibold text-[#0c4a6e]">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="overflow-hidden rounded-[10px] border border-slate-200 bg-white dark:border-[#334155] dark:bg-[#1e293b]">
            <div className="flex h-[52px] items-center justify-between border-b border-slate-100 px-5 dark:border-[#334155]">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#0c4a6e] dark:text-[#f0f9ff]">
                <Layers className="h-[18px] w-[18px] text-amber-500" />
                {t("analysis.thermocline.title")}
              </div>
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-600">
                {t("analysis.thermocline.layersDetected", { count: 3 })}
              </span>
            </div>
            <div className="flex flex-wrap gap-5 p-5">
              <div className="flex h-[240px] flex-1 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-400 dark:border-[#334155] dark:bg-[#0f172a]">
                {t("analysis.thermocline.placeholder")}
              </div>
              <div className="w-[260px] space-y-3">
                {[
                  { labelKey: "analysis.thermocline.layer1", bg: "bg-amber-50", border: "border-amber-200" },
                  { labelKey: "analysis.thermocline.pycnocline", bg: "bg-blue-50", border: "border-blue-200" },
                  { labelKey: "analysis.thermocline.halocline", bg: "bg-emerald-50", border: "border-emerald-200" },
                ].map((item) => (
                  <div
                    key={item.labelKey}
                    className={`rounded-lg border p-3 text-[12px] font-semibold text-slate-600 ${item.bg} ${item.border}`}
                  >
                    {t(item.labelKey)}
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-5">
          <section className="overflow-hidden rounded-[10px] border border-slate-200 bg-white dark:border-[#334155] dark:bg-[#1e293b]">
            <div className="flex h-[52px] items-center gap-2 border-b border-slate-100 px-5 text-sm font-semibold text-[#0c4a6e] dark:border-[#334155] dark:text-[#f0f9ff]">
              <Cpu className="h-[18px] w-[18px] text-violet-500" />
              {t("analysis.oceanModelOutputs")}
            </div>
            <div className="space-y-3 p-4">
              {[
                { labelKey: "analysis.modelCards.waveHeight", bg: "bg-purple-50", border: "border-purple-200" },
                { labelKey: "analysis.modelCards.salinityFlux", bg: "bg-sky-50", border: "border-sky-200" },
                { labelKey: "analysis.modelCards.currentSpeed", bg: "bg-emerald-50", border: "border-emerald-200" },
              ].map((item) => (
                <div
                  key={item.labelKey}
                  className={`rounded-lg border p-3 text-sm text-slate-600 ${item.bg} ${item.border}`}
                >
                  {t(item.labelKey)}
                </div>
              ))}
            </div>
          </section>

          <section className="overflow-hidden rounded-[10px] border border-slate-200 bg-white dark:border-[#334155] dark:bg-[#1e293b]">
            <div className="flex h-[52px] items-center gap-2 border-b border-slate-100 px-5 text-sm font-semibold text-[#0c4a6e] dark:border-[#334155] dark:text-[#f0f9ff]">
              <Compass className="h-[18px] w-[18px] text-cyan-500" />
              {t("analysis.waterMass.title")}
            </div>
            <div className="space-y-2 p-4">
              {[
                t("analysis.waterMass.items.layer1"),
                t("analysis.waterMass.items.layer2"),
                t("analysis.waterMass.items.layer3"),
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 p-3 text-xs text-slate-500 dark:border-[#334155] dark:bg-[#0f172a]"
                >
                  <span>{t("analysis.waterMass.layerLabel")}</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="overflow-hidden rounded-[10px] border border-slate-200 bg-white dark:border-[#334155] dark:bg-[#1e293b]">
            <div className="flex h-[52px] items-center gap-2 border-b border-slate-100 px-5 text-sm font-semibold text-[#0c4a6e] dark:border-[#334155] dark:text-[#f0f9ff]">
              <History className="h-[18px] w-[18px] text-slate-500" />
              {t("analysis.activity.title")}
            </div>
            <div className="space-y-3 p-4 text-xs text-slate-500">
              {[
                { textKey: "analysis.activity.items.thermoComplete", color: "bg-emerald-500" },
                { textKey: "analysis.activity.items.modelRefreshed", color: "bg-blue-500" },
                { textKey: "analysis.activity.items.waterMassRunning", color: "bg-amber-500" },
                { textKey: "analysis.activity.items.datasetQueued", color: "bg-violet-500" },
              ].map((item) => (
                <div key={item.textKey} className="flex items-start gap-3">
                  <span className={`mt-1 h-2 w-2 rounded-full ${item.color}`} />
                  <div>
                    <p className="font-medium text-slate-600 dark:text-slate-300">
                      {t(item.textKey)}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {t("analysis.activity.timeAgo")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </DashboardShell>
  );
}
