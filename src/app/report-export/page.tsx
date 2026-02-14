"use client";

import {
  Check,
  Eye,
  Download,
  File,
  FileOutput,
  FileText,
  Image as ImageIcon,
  Minus,
  Plus,
  Settings,
  Printer,
  Waves,
} from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { TopBar } from "@/components/layout/topbar";
import { ThemeToggle } from "@/components/theme-toggle";
import { LocaleToggle } from "@/components/locale-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useI18n } from "@/components/i18n-provider";

const section2Rows = [
  {
    labelKey: "reportExport.previewSections.table.row1.label",
    value: "18.4℃",
    noteKey: "reportExport.previewSections.table.row1.note",
  },
  {
    labelKey: "reportExport.previewSections.table.row2.label",
    value: "34.86 PSU",
    noteKey: "reportExport.previewSections.table.row2.note",
  },
  {
    labelKey: "reportExport.previewSections.table.row3.label",
    value: "1025.7 kg/m³",
    noteKey: "reportExport.previewSections.table.row3.note",
  },
];

const includeSections = [
  {
    key: "reportExport.exportSettings.sections.stationOverview",
    checked: true,
  },
  {
    key: "reportExport.exportSettings.sections.tsSummaryTable",
    checked: true,
  },
  {
    key: "reportExport.exportSettings.sections.thermoclineAnalysis",
    checked: true,
  },
  {
    key: "reportExport.exportSettings.sections.depthProfiles",
    checked: true,
  },
  {
    key: "reportExport.exportSettings.sections.tsDiagram",
    checked: false,
  },
  {
    key: "reportExport.exportSettings.sections.waterMassClassification",
    checked: true,
  },
];

const toggles = [
  {
    key: "reportExport.exportSettings.toggles.pageNumbers",
    checked: true,
  },
  {
    key: "reportExport.exportSettings.toggles.headerFooter",
    checked: true,
  },
  {
    key: "reportExport.exportSettings.toggles.tableOfContents",
    checked: false,
  },
];

export default function ReportExportPage() {
  const { t } = useI18n();

  return (
    <DashboardShell
      contentClassName="p-6"
      header={
        <TopBar
          title={t("reportExport.title")}
          right={
            <div className="flex items-center gap-3">
              <Button className="h-[38px] gap-2 rounded-lg bg-sky-500 px-4 text-[13px] font-semibold hover:bg-sky-600">
                <Download className="h-4 w-4" />
                {t("reportExport.topbar.exportPdf")}
              </Button>
              <Button
                variant="outline"
                className="h-[38px] gap-2 rounded-lg border-slate-200 bg-white px-4 text-[13px] font-medium text-slate-700 hover:bg-slate-50 dark:border-[#334155] dark:bg-[#1e293b] dark:text-slate-200 dark:hover:bg-[#334155]"
              >
                <FileText className="h-4 w-4 text-slate-500" />
                {t("reportExport.topbar.exportWord")}
              </Button>
              <Button
                variant="outline"
                className="h-[38px] gap-2 rounded-lg border-slate-200 bg-white px-4 text-[13px] font-medium text-slate-700 hover:bg-slate-50 dark:border-[#334155] dark:bg-[#1e293b] dark:text-slate-200 dark:hover:bg-[#334155]"
              >
                <Printer className="h-4 w-4 text-slate-500" />
                {t("reportExport.topbar.print")}
              </Button>
              <LocaleToggle />
              <ThemeToggle />
            </div>
          }
        />
      }
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="overflow-hidden rounded-[10px] border border-slate-200 bg-white dark:border-[#334155] dark:bg-[#1e293b]">
          <div className="flex h-12 items-center justify-between border-b border-slate-200 bg-slate-50 px-5 text-[13px] font-semibold text-[#0c4a6e] dark:border-[#334155] dark:bg-[#0f172a] dark:text-[#f0f9ff]">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-sky-500" />
              {t("reportExport.reportPreview")}
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <button className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 text-slate-400 dark:border-[#334155]">
                <Minus className="h-3 w-3" />
              </button>
              100%
              <button className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 text-slate-400 dark:border-[#334155]">
                <Plus className="h-3 w-3" />
              </button>
            </div>
          </div>
          <div className="bg-slate-100 p-8 dark:bg-[#0f172a]">
            <div className="mx-auto max-w-[520px] space-y-6 rounded-md bg-white p-10 shadow-sm dark:bg-[#1e293b]">
              <div className="flex flex-col items-center gap-2 border-b border-slate-200 pb-6">
                <Waves className="h-9 w-9 text-sky-500" />
                <h2 className="text-xl font-semibold text-[#0c4a6e]">
                  {t("reportExport.reportTitle")}
                </h2>
                <p className="text-xs text-slate-500">
                  {t("reportExport.reportSubtitle")}
                </p>
                <p className="text-[10px] text-slate-400">
                  {t("reportExport.reportOrg")}
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-[#0c4a6e]">
                  {t("reportExport.previewSections.section1Title")}
                </h3>
                <p className="text-xs leading-5 text-slate-600">
                  {t("reportExport.previewSections.section1Body")}
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-[#0c4a6e]">
                  {t("reportExport.previewSections.section2Title")}
                </h3>
                <div className="overflow-hidden rounded-md border border-slate-200">
                  <div className="grid grid-cols-[1.2fr_0.8fr_0.8fr] bg-sky-50 px-3 py-2 text-[11px] font-semibold text-slate-500">
                    <span>{t("reportExport.previewSections.table.header.parameter")}</span>
                    <span>{t("reportExport.previewSections.table.header.value")}</span>
                    <span>{t("reportExport.previewSections.table.header.notes")}</span>
                  </div>
                  {section2Rows.map((row) => (
                    <div
                      key={row.labelKey}
                      className="grid grid-cols-[1.2fr_0.8fr_0.8fr] border-t border-slate-100 px-3 py-2 text-[11px] text-slate-500"
                    >
                      <span>{t(row.labelKey)}</span>
                      <span className="text-slate-600">{row.value}</span>
                      <span className="text-slate-400">{t(row.noteKey)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-[#0c4a6e]">
                  {t("reportExport.previewSections.section3Title")}
                </h3>
                <p className="text-xs leading-5 text-slate-600">
                  {t("reportExport.previewSections.section3Body")}
                </p>
                <div className="relative h-[140px] overflow-hidden rounded-md border border-sky-200 bg-sky-50">
                  <span className="absolute left-4 top-3 text-[9px] font-semibold text-[#0c4a6e]">
                    {t("reportExport.previewSections.figure1Title")}
                  </span>
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-[11px] text-sky-500">
                    <ImageIcon className="h-6 w-6" />
                    <span className="font-medium">
                      {t("reportExport.previewSections.figure1Title")}
                    </span>
                    <span className="text-[9px] text-slate-400">
                      {t("reportExport.previewSections.figure1Note")}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-[#0c4a6e]">
                  {t("reportExport.previewSections.section4Title")}
                </h3>
                <p className="text-xs leading-5 text-slate-600">
                  {t("reportExport.previewSections.section4Body")}
                </p>
                <div className="relative h-[130px] overflow-hidden rounded-md border border-sky-200 bg-sky-50">
                  <span className="absolute left-4 top-3 text-[9px] font-semibold text-[#0c4a6e]">
                    {t("reportExport.previewSections.figure2Title")}
                  </span>
                  <div className="absolute bottom-4 right-6 flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                    <span className="h-1.5 w-1.5 rounded-full bg-cyan-500" />
                    <span className="h-1.5 w-1.5 rounded-full bg-violet-500" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-[10px] border border-slate-200 bg-white dark:border-[#334155] dark:bg-[#1e293b]">
          <div className="flex h-12 items-center gap-2 border-b border-slate-200 bg-slate-50 px-5 text-[13px] font-semibold text-[#0c4a6e] dark:border-[#334155] dark:bg-[#0f172a] dark:text-[#f0f9ff]">
            <Settings className="h-4 w-4 text-slate-500" />
            {t("reportExport.exportSettings.title")}
          </div>
          <div className="space-y-5 p-5 text-xs text-slate-600">
            <div className="space-y-2">
              <p className="text-[12px] font-semibold tracking-[0.5px] text-[#0c4a6e]">
                {t("reportExport.exportSettings.reportTemplate")}
              </p>
              <Select defaultValue="standard">
                <SelectTrigger className="h-9 w-full rounded-md border-slate-200 bg-white text-[12px] text-slate-600 dark:border-[#334155] dark:bg-[#1e293b]">
                  <SelectValue placeholder={t("reportExport.exportSettings.templatePlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">
                    {t("reportExport.exportSettings.standardTemplate")}
                  </SelectItem>
                  <SelectItem value="summary">{t("reportExport.exportSettings.cruiseSummary")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <p className="text-[12px] font-semibold tracking-[0.5px] text-[#0c4a6e]">
                {t("reportExport.exportSettings.exportFormat")}
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button className="flex h-9 items-center justify-center gap-2 rounded-md bg-sky-500 text-[12px] font-semibold text-white">
                  <FileText className="h-3.5 w-3.5" />
                  PDF
                </button>
                <button className="flex h-9 items-center justify-center gap-2 rounded-md border border-slate-200 text-[12px] font-medium text-slate-500 dark:border-[#334155]">
                  <File className="h-3.5 w-3.5" />
                  Word
                </button>
              </div>
            </div>

            <div className="h-px bg-slate-200 dark:bg-[#334155]" />

            <div className="space-y-3">
              <p className="text-[12px] font-semibold tracking-[0.5px] text-[#0c4a6e]">
                {t("reportExport.exportSettings.includeSections")}
              </p>
              <div className="space-y-2">
                {includeSections.map((section) => (
                  <div key={section.key} className="flex items-center gap-2 text-[13px]">
                    <span
                      className={`flex h-4 w-4 items-center justify-center rounded-sm border ${
                        section.checked
                          ? "border-slate-900 bg-slate-900 text-white"
                          : "border-slate-300 bg-white"
                      }`}
                    >
                      {section.checked ? (
                        <Check className="h-3 w-3" />
                      ) : null}
                    </span>
                    <span>{t(section.key)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="h-px bg-slate-200 dark:bg-[#334155]" />

            <div className="space-y-3">
              <div className="space-y-2">
                <p className="text-[12px] font-semibold tracking-[0.5px] text-[#0c4a6e]">
                  {t("reportExport.exportSettings.station")}
                </p>
                <Select defaultValue="st001">
                  <SelectTrigger className="h-9 w-full rounded-md border-slate-200 bg-white text-[12px] text-slate-600 dark:border-[#334155] dark:bg-[#1e293b]">
                    <SelectValue placeholder={t("reportExport.exportSettings.stationPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="st001">
                      {t("reportExport.exportSettings.stationValue")}
                    </SelectItem>
                    <SelectItem value="st002">
                      {t("reportExport.exportSettings.stationOption2")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <p className="text-[12px] font-semibold tracking-[0.5px] text-[#0c4a6e]">
                  {t("reportExport.exportSettings.dateRange")}
                </p>
                <Input
                  className="h-9 w-full rounded-md border-slate-200 bg-white text-[12px] text-slate-600 dark:border-[#334155] dark:bg-[#1e293b]"
                  placeholder={t("reportExport.exportSettings.dateRangePlaceholder")}
                  defaultValue={t("reportExport.exportSettings.dateRangeValue")}
                />
              </div>

              <div className="space-y-2">
                <p className="text-[12px] font-semibold tracking-[0.5px] text-[#0c4a6e]">
                  {t("reportExport.exportSettings.author")}
                </p>
                <Input
                  className="h-9 w-full rounded-md border-slate-200 bg-white text-[12px] text-slate-600 dark:border-[#334155] dark:bg-[#1e293b]"
                  placeholder={t("reportExport.exportSettings.authorPlaceholder")}
                  defaultValue={t("reportExport.exportSettings.authorValue")}
                />
              </div>

              <div className="space-y-2">
                <p className="text-[12px] font-semibold tracking-[0.5px] text-[#0c4a6e]">
                  {t("reportExport.exportSettings.institution")}
                </p>
                <Input
                  className="h-9 w-full rounded-md border-slate-200 bg-white text-[12px] text-slate-600 dark:border-[#334155] dark:bg-[#1e293b]"
                  placeholder={t("reportExport.exportSettings.institutionPlaceholder")}
                  defaultValue={t("reportExport.exportSettings.institutionValue")}
                />
              </div>
            </div>

            <div className="h-px bg-slate-200 dark:bg-[#334155]" />

            <div className="space-y-3">
              {toggles.map((toggle) => (
                <div key={toggle.key} className="flex items-center justify-between">
                  <span className="text-[13px]">{t(toggle.key)}</span>
                  <span
                    className={`relative h-5 w-10 rounded-full p-0.5 ${
                      toggle.checked
                        ? "bg-slate-900"
                        : "bg-slate-200 dark:bg-slate-600"
                    }`}
                  >
                    <span
                      className={`block h-4 w-4 rounded-full bg-white transition-transform ${
                        toggle.checked ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </span>
                </div>
              ))}
            </div>

            <Button className="h-9 w-full gap-2 rounded-md bg-sky-500 text-sm font-semibold text-white hover:bg-sky-600">
              <FileOutput className="h-4 w-4" />
              {t("reportExport.generateReport")}
            </Button>
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}
