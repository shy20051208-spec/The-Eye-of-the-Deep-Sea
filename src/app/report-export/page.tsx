"use client";

import { useState, useRef } from "react";
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

const defaultIncludeSections = [
  { key: "reportExport.exportSettings.sections.stationOverview", checked: true },
  { key: "reportExport.exportSettings.sections.tsSummaryTable", checked: true },
  { key: "reportExport.exportSettings.sections.thermoclineAnalysis", checked: true },
  { key: "reportExport.exportSettings.sections.depthProfiles", checked: true },
  { key: "reportExport.exportSettings.sections.tsDiagram", checked: false },
  { key: "reportExport.exportSettings.sections.waterMassClassification", checked: true },
];

const defaultToggles = [
  { key: "reportExport.exportSettings.toggles.pageNumbers", checked: true },
  { key: "reportExport.exportSettings.toggles.headerFooter", checked: true },
  { key: "reportExport.exportSettings.toggles.tableOfContents", checked: false },
];

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

export default function ReportExportPage() {
  const { t } = useI18n();
  const previewRef = useRef<HTMLDivElement>(null);

  const [zoom, setZoom] = useState(100);
  const [format, setFormat] = useState<"pdf" | "word">("pdf");
  const [template, setTemplate] = useState("standard");
  const [station, setStation] = useState("st001");
  const [dateRange, setDateRange] = useState(t("reportExport.exportSettings.dateRangeValue"));
  const [author, setAuthor] = useState(t("reportExport.exportSettings.authorValue"));
  const [institution, setInstitution] = useState(t("reportExport.exportSettings.institutionValue"));
  const [sections, setSections] = useState(defaultIncludeSections);
  const [togglesState, setTogglesState] = useState(defaultToggles);
  const [generating, setGenerating] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const toggleSection = (idx: number) => {
    setSections((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, checked: !s.checked } : s))
    );
  };

  const toggleSwitch = (idx: number) => {
    setTogglesState((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, checked: !s.checked } : s))
    );
  };

  // 获取预览区域的HTML内容，构建完整文档
  const buildDocumentHtml = () => {
    const stationLabel = station === "st001"
      ? t("reportExport.exportSettings.stationValue")
      : t("reportExport.exportSettings.stationOption2");
    const templateLabel = template === "standard"
      ? t("reportExport.exportSettings.standardTemplate")
      : t("reportExport.exportSettings.cruiseSummary");

    return `<!DOCTYPE html>
<html lang="zh">
<head>
<meta charset="UTF-8"/>
<title>${t("reportExport.reportTitle")}</title>
<style>
  body { font-family: "SimSun", serif; margin: 40px; color: #1e293b; font-size: 13px; }
  h1 { text-align: center; font-size: 20px; color: #0c4a6e; margin-bottom: 4px; }
  .subtitle { text-align: center; color: #64748b; font-size: 12px; margin-bottom: 2px; }
  .org { text-align: center; color: #94a3b8; font-size: 11px; margin-bottom: 24px; }
  h2 { font-size: 14px; color: #0c4a6e; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-top: 20px; }
  p { line-height: 1.7; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; }
  th { background: #f0f9ff; padding: 8px; text-align: left; font-size: 12px; border: 1px solid #e2e8f0; }
  td { padding: 8px; border: 1px solid #e2e8f0; font-size: 12px; }
  .meta { color: #64748b; font-size: 11px; margin-top: 24px; border-top: 1px solid #e2e8f0; padding-top: 12px; }
  @media print { body { margin: 20mm; } }
</style>
</head>
<body>
<h1>${t("reportExport.reportTitle")}</h1>
<p class="subtitle">${t("reportExport.reportSubtitle")}</p>
<p class="org">${institution || t("reportExport.reportOrg")}</p>

<h2>1. ${t("reportExport.previewSections.section1Title")}</h2>
<p>${t("reportExport.previewSections.section1Body")}</p>

<h2>2. ${t("reportExport.previewSections.section2Title")}</h2>
<table>
  <tr>
    <th>${t("reportExport.previewSections.table.header.parameter")}</th>
    <th>${t("reportExport.previewSections.table.header.value")}</th>
    <th>${t("reportExport.previewSections.table.header.notes")}</th>
  </tr>
  ${section2Rows
        .map(
          (r) =>
            `<tr><td>${t(r.labelKey)}</td><td>${r.value}</td><td>${t(r.noteKey)}</td></tr>`
        )
        .join("")}
</table>

<h2>3. ${t("reportExport.previewSections.section3Title")}</h2>
<p>${t("reportExport.previewSections.section3Body")}</p>

<h2>4. ${t("reportExport.previewSections.section4Title")}</h2>
<p>${t("reportExport.previewSections.section4Body")}</p>

<div class="meta">
  <p>模板：${templateLabel} | 测站：${stationLabel} | 日期范围：${dateRange} | 作者：${author} | 机构：${institution}</p>
</div>
</body>
</html>`;
  };

  const handleExportPdf = () => {
    const html = buildDocumentHtml();
    const win = window.open("", "_blank");
    if (!win) { showToast("请允许弹出窗口后重试"); return; }
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => {
      win.print();
    }, 300);
    showToast('PDF 导出窗口已打开，请在打印对话框中选择【另存为 PDF】');
  };

  const handleExportWord = () => {
    const html = buildDocumentHtml();
    const blob = new Blob(
      ["\ufeff" + html],
      { type: "application/msword;charset=utf-8" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `CTD数据分析报告_${station}_${Date.now()}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("Word 文档已开始下载");
  };

  const handlePrint = () => {
    const html = buildDocumentHtml();
    const win = window.open("", "_blank");
    if (!win) { showToast("请允许弹出窗口后重试"); return; }
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 300);
  };

  const handleGenerateReport = async () => {
    setGenerating(true);
    showToast("正在生成报告...");
    await new Promise((r) => setTimeout(r, 1200));
    setGenerating(false);
    if (format === "pdf") {
      handleExportPdf();
    } else {
      handleExportWord();
    }
  };

  return (
    <DashboardShell
      contentClassName="p-6"
      header={
        <TopBar
          title={t("reportExport.title")}
          right={
            <div className="flex items-center gap-3">
              <Button
                onClick={handleExportPdf}
                className="h-[38px] gap-2 rounded-lg bg-sky-500 px-4 text-[13px] font-semibold hover:bg-sky-600"
              >
                <Download className="h-4 w-4" />
                {t("reportExport.topbar.exportPdf")}
              </Button>
              <Button
                variant="outline"
                onClick={handleExportWord}
                className="h-[38px] gap-2 rounded-lg border-slate-200 bg-white px-4 text-[13px] font-medium text-slate-700 hover:bg-slate-50 dark:border-[#334155] dark:bg-[#1e293b] dark:text-slate-200 dark:hover:bg-[#334155]"
              >
                <FileText className="h-4 w-4 text-slate-500" />
                {t("reportExport.topbar.exportWord")}
              </Button>
              <Button
                variant="outline"
                onClick={handlePrint}
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
      {/* Toast 通知 */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-slate-800 px-5 py-3 text-sm text-white shadow-xl dark:bg-slate-700">
          {toast}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* 报告预览区 */}
        <section className="overflow-hidden rounded-[10px] border border-slate-200 bg-white dark:border-[#334155] dark:bg-[#1e293b]">
          <div className="flex h-12 items-center justify-between border-b border-slate-200 bg-slate-50 px-5 text-[13px] font-semibold text-[#0c4a6e] dark:border-[#334155] dark:bg-[#0f172a] dark:text-[#f0f9ff]">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-sky-500" />
              {t("reportExport.reportPreview")}
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <button
                onClick={() => setZoom((z) => Math.max(50, z - 10))}
                className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 text-slate-400 hover:bg-slate-100 dark:border-[#334155] dark:hover:bg-[#1e293b]"
              >
                <Minus className="h-3 w-3" />
              </button>
              <span className="w-12 text-center">{zoom}%</span>
              <button
                onClick={() => setZoom((z) => Math.min(150, z + 10))}
                className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 text-slate-400 hover:bg-slate-100 dark:border-[#334155] dark:hover:bg-[#1e293b]"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
          </div>
          <div className="overflow-auto bg-slate-100 p-8 dark:bg-[#0f172a]">
            <div
              ref={previewRef}
              style={{ transform: `scale(${zoom / 100})`, transformOrigin: "top center" }}
              className="mx-auto max-w-[520px] space-y-6 rounded-md bg-white p-10 shadow-sm dark:bg-[#1e293b]"
            >
              <div className="flex flex-col items-center gap-2 border-b border-slate-200 pb-6">
                <Waves className="h-9 w-9 text-sky-500" />
                <h2 className="text-xl font-semibold text-[#0c4a6e]">
                  {t("reportExport.reportTitle")}
                </h2>
                <p className="text-xs text-slate-500">
                  {t("reportExport.reportSubtitle")}
                </p>
                <p className="text-[10px] text-slate-400">
                  {institution || t("reportExport.reportOrg")}
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

        {/* 导出设置面板 */}
        <section className="overflow-hidden rounded-[10px] border border-slate-200 bg-white dark:border-[#334155] dark:bg-[#1e293b]">
          <div className="flex h-12 items-center gap-2 border-b border-slate-200 bg-slate-50 px-5 text-[13px] font-semibold text-[#0c4a6e] dark:border-[#334155] dark:bg-[#0f172a] dark:text-[#f0f9ff]">
            <Settings className="h-4 w-4 text-slate-500" />
            {t("reportExport.exportSettings.title")}
          </div>
          <div className="space-y-5 p-5 text-xs text-slate-600">
            {/* 报告模板 */}
            <div className="space-y-2">
              <p className="text-[12px] font-semibold tracking-[0.5px] text-[#0c4a6e]">
                {t("reportExport.exportSettings.reportTemplate")}
              </p>
              <Select value={template} onValueChange={setTemplate}>
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

            {/* 导出格式 */}
            <div className="space-y-2">
              <p className="text-[12px] font-semibold tracking-[0.5px] text-[#0c4a6e]">
                {t("reportExport.exportSettings.exportFormat")}
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setFormat("pdf")}
                  className={`flex h-9 items-center justify-center gap-2 rounded-md text-[12px] font-semibold transition-colors ${format === "pdf"
                    ? "bg-sky-500 text-white"
                    : "border border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-[#334155] dark:hover:bg-[#334155]"
                    }`}
                >
                  <FileText className="h-3.5 w-3.5" />
                  PDF
                </button>
                <button
                  onClick={() => setFormat("word")}
                  className={`flex h-9 items-center justify-center gap-2 rounded-md text-[12px] font-medium transition-colors ${format === "word"
                    ? "bg-sky-500 text-white"
                    : "border border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-[#334155] dark:hover:bg-[#334155]"
                    }`}
                >
                  <File className="h-3.5 w-3.5" />
                  Word
                </button>
              </div>
            </div>

            <div className="h-px bg-slate-200 dark:bg-[#334155]" />

            {/* 包含章节 */}
            <div className="space-y-3">
              <p className="text-[12px] font-semibold tracking-[0.5px] text-[#0c4a6e]">
                {t("reportExport.exportSettings.includeSections")}
              </p>
              <div className="space-y-2">
                {sections.map((section, idx) => (
                  <button
                    key={section.key}
                    onClick={() => toggleSection(idx)}
                    className="flex w-full cursor-pointer items-center gap-2 text-[13px] transition-opacity hover:opacity-80"
                  >
                    <span
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border transition-colors ${section.checked
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-300 bg-white dark:border-slate-600 dark:bg-[#0f172a]"
                        }`}
                    >
                      {section.checked ? <Check className="h-3 w-3" /> : null}
                    </span>
                    <span className="text-left">{t(section.key)}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="h-px bg-slate-200 dark:bg-[#334155]" />

            {/* 测站 / 日期 / 作者 / 机构 */}
            <div className="space-y-3">
              <div className="space-y-2">
                <p className="text-[12px] font-semibold tracking-[0.5px] text-[#0c4a6e]">
                  {t("reportExport.exportSettings.station")}
                </p>
                <Select value={station} onValueChange={setStation}>
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
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <p className="text-[12px] font-semibold tracking-[0.5px] text-[#0c4a6e]">
                  {t("reportExport.exportSettings.author")}
                </p>
                <Input
                  className="h-9 w-full rounded-md border-slate-200 bg-white text-[12px] text-slate-600 dark:border-[#334155] dark:bg-[#1e293b]"
                  placeholder={t("reportExport.exportSettings.authorPlaceholder")}
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <p className="text-[12px] font-semibold tracking-[0.5px] text-[#0c4a6e]">
                  {t("reportExport.exportSettings.institution")}
                </p>
                <Input
                  className="h-9 w-full rounded-md border-slate-200 bg-white text-[12px] text-slate-600 dark:border-[#334155] dark:bg-[#1e293b]"
                  placeholder={t("reportExport.exportSettings.institutionPlaceholder")}
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                />
              </div>
            </div>

            <div className="h-px bg-slate-200 dark:bg-[#334155]" />

            {/* 开关项 */}
            <div className="space-y-3">
              {togglesState.map((toggle, idx) => (
                <button
                  key={toggle.key}
                  onClick={() => toggleSwitch(idx)}
                  className="flex w-full items-center justify-between"
                >
                  <span className="text-[13px]">{t(toggle.key)}</span>
                  <span
                    className={`relative h-5 w-10 rounded-full p-0.5 transition-colors ${toggle.checked
                      ? "bg-slate-900"
                      : "bg-slate-200 dark:bg-slate-600"
                      }`}
                  >
                    <span
                      className={`block h-4 w-4 rounded-full bg-white shadow transition-transform ${toggle.checked ? "translate-x-5" : "translate-x-0"
                        }`}
                    />
                  </span>
                </button>
              ))}
            </div>

            {/* 生成报告按钮 */}
            <Button
              onClick={handleGenerateReport}
              disabled={generating}
              className="h-9 w-full gap-2 rounded-md bg-sky-500 text-sm font-semibold text-white hover:bg-sky-600 disabled:opacity-70"
            >
              <FileOutput className="h-4 w-4" />
              {generating ? "生成中..." : t("reportExport.generateReport")}
            </Button>
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}
