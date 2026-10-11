"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Document, Page, Text, View, StyleSheet, pdf } from "@react-pdf/renderer";
import * as XLSX from "xlsx";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { TopBar } from "@/components/layout/topbar";
import { useI18n } from "@/components/i18n-provider";
import { buildScientificReportHtml, buildVisualizationInsight } from "@/lib/visualization";
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
import { Play, FileText, Activity, Layers, Thermometer, Compass, BarChart3, CheckCircle2, ShieldCheck } from "lucide-react";

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

interface PreprocessingResult {
  sampleCount: number;
  rawAnomalies: number;
  processedAnomalies: number;
  anomalyReductionRate: number;
  qualityScore: number;
  algorithmAccuracy: number;
  stabilityIndex: number;
  summary: string;
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

interface ProcessComparisonRecord {
  id: string;
  campaign: string;
  station: string;
  year: string;
  area: string;
  depthBand: string;
  temperature: number;
  salinity: number;
  profile: string;
}

interface OceanInsight {
  id: string;
  region: string;
  title: string;
  year: string;
  type: string;
  summary: string;
  tags: string[];
  favorite: boolean;
}

const voyageArchiveSeed = [
  {
    id: "v-01",
    station: "ST-001",
    region: "南海北部",
    voyage: "2025-航次-A",
    year: "2025",
    device: "SBE 911plus",
    deploymentDepth: "1200m",
    sampleInterval: "2s",
    operator: "陈海洋 / 赵玲",
    summary: "南海北部典型站点，存在明显温跃层与低温高盐底层结构。",
  },
  {
    id: "v-02",
    station: "ST-001",
    region: "南海北部",
    voyage: "2024-航次-B",
    year: "2024",
    device: "SBE 19plus",
    deploymentDepth: "980m",
    sampleInterval: "3s",
    operator: "刘然 / 王熙",
    summary: "近一年同位点观测显示水温偏高，温跃层深度向中层移动。",
  },
  {
    id: "v-03",
    station: "ST-001",
    region: "南海北部",
    voyage: "2023-航次-C",
    year: "2023",
    device: "SBE 911plus",
    deploymentDepth: "1100m",
    sampleInterval: "2s",
    operator: "周凯 / 孟阳",
    summary: "现场原始数据完整，适合比对同位点长期温盐深变化趋势。",
  },
  {
    id: "v-04",
    station: "ST-003",
    region: "东海中部",
    voyage: "2025-航次-D",
    year: "2025",
    device: "RBR concerto3",
    deploymentDepth: "840m",
    sampleInterval: "1s",
    operator: "李昂 / 谢南",
    summary: "该站点数据密度较高，适用于近岸锋面特征分析。",
  },
  {
    id: "v-05",
    station: "ST-005",
    region: "黄海西部",
    voyage: "2025-航次-E",
    year: "2025",
    device: "SBE 25plus",
    deploymentDepth: "620m",
    sampleInterval: "2s",
    operator: "徐昊 / 张帆",
    summary: "黄海西部分层较清晰，盐度梯度明显，适合生态风险评估。",
  },
];

const archiveSitePoints = [
  { id: "ST-001", name: "ST-001", region: "南海北部", left: "34%", top: "52%" },
  { id: "ST-003", name: "ST-003", region: "东海中部", left: "60%", top: "36%" },
  { id: "ST-005", name: "ST-005", region: "黄海西部", left: "49%", top: "22%" },
];

const oceanInsightSeed: OceanInsight[] = [
  {
    id: "s-1",
    region: "南海北部",
    title: "南海北部高分辨率海洋热结构揭示新型上升流特征",
    year: "2025",
    type: "科考成果",
    summary: "利用多航次 CTD 和高频剖面数据，识别出新型季节性上升流区及温跃层增强现象。",
    tags: ["温跃层", "上升流", "多航次"],
    favorite: true,
  },
  {
    id: "s-2",
    region: "东海中部",
    title: "东海中部近岸沉积区发现新的碳循环关键界面",
    year: "2024",
    type: "新发现",
    summary: "在近岸泥质区中，深层碳通量特征与低温高盐水体交汇界面高度相关。",
    tags: ["碳循环", "沉积区", "盐度"],
    favorite: false,
  },
  {
    id: "s-3",
    region: "黄海西部",
    title: "黄海西部温盐深耦合观测提升海洋生态风险预警能力",
    year: "2025",
    type: "应用价值",
    summary: "对生态脆弱区域的温盐耦合模式进行专项识别，为赤潮和海域环境风险预警提供依据。",
    tags: ["生态风险", "预警", "环境监测"],
    favorite: false,
  },
  {
    id: "s-4",
    region: "南海北部",
    title: "南海北部跨海盆重点站点联合观测补全海洋文献数据库",
    year: "2023",
    type: "文献启发",
    summary: "结合历史站点与现有资料，系统完善了区域海洋深层热盐时序及文献索引。",
    tags: ["数据库", "文献", "时序分析"],
    favorite: true,
  },
];

const reportStyles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#ffffff",
    padding: 32,
    fontFamily: "Helvetica",
  },
  title: {
    fontSize: 24,
    fontWeight: 700,
    marginBottom: 10,
    color: "#0f172a",
  },
  subtitle: {
    fontSize: 12,
    color: "#475569",
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 700,
    marginTop: 18,
    marginBottom: 8,
    color: "#0f172a",
  },
  text: {
    fontSize: 11,
    color: "#1e293b",
    lineHeight: 1.5,
    marginBottom: 6,
  },
  table: {
    width: "100%",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    marginTop: 8,
  },
  tableRow: {
    flexDirection: "row",
  },
  tableColHeader: {
    width: "25%",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    backgroundColor: "#e2e8f0",
    padding: 6,
  },
  tableCol: {
    width: "25%",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    padding: 6,
  },
  tableCell: {
    fontSize: 10,
    color: "#0f172a",
  },
});

function ReportPdfDocument({
  seaArea,
  stationName,
  campaign,
  year,
  template,
  avgTemperature,
  avgSalinity,
  avgDensity,
}: {
  seaArea: string;
  stationName: string;
  campaign: string;
  year: string;
  template: string;
  avgTemperature: number;
  avgSalinity: number;
  avgDensity: number;
}) {
  return (
    <Document>
      <Page size="A4" style={reportStyles.page}>
        <Text style={reportStyles.title}>{seaArea}海域 CTD 勘察方案报告</Text>
        <Text style={reportStyles.subtitle}>站点：{stationName}  |  航次：{campaign}  |  年份：{year}  |  模板：{template}</Text>

        <Text style={reportStyles.sectionTitle}>一、概述</Text>
        <Text style={reportStyles.text}>本报告基于当前海域站点观测数据，结合多维度校验、预处理评估与趋势分析，完成全流程处理与输出，形成可用于科研交付的统一成果包。</Text>

        <Text style={reportStyles.sectionTitle}>二、关键结论</Text>
        <Text style={reportStyles.text}>- 平均温度约为 {avgTemperature.toFixed(2)}℃，表明该区域水体存在明显垂向分层。</Text>
        <Text style={reportStyles.text}>- 平均盐度约为 {avgSalinity.toFixed(3)} PSU，显示较稳定的海水结构。</Text>
        <Text style={reportStyles.text}>- 平均密度约为 {avgDensity.toFixed(2)} kg/m³，说明水体整体稳定，适合继续进行深度研究。</Text>

        <Text style={reportStyles.sectionTitle}>三、数据摘要</Text>
        <View style={reportStyles.table}>
          <View style={reportStyles.tableRow}>
            <View style={reportStyles.tableColHeader}><Text style={reportStyles.tableCell}>指标</Text></View>
            <View style={reportStyles.tableColHeader}><Text style={reportStyles.tableCell}>数值</Text></View>
            <View style={reportStyles.tableColHeader}><Text style={reportStyles.tableCell}>说明</Text></View>
            <View style={reportStyles.tableColHeader}><Text style={reportStyles.tableCell}>结论</Text></View>
          </View>
          <View style={reportStyles.tableRow}>
            <View style={reportStyles.tableCol}><Text style={reportStyles.tableCell}>温度</Text></View>
            <View style={reportStyles.tableCol}><Text style={reportStyles.tableCell}>{avgTemperature.toFixed(2)} ℃</Text></View>
            <View style={reportStyles.tableCol}><Text style={reportStyles.tableCell}>表层至深层存在梯度变化</Text></View>
            <View style={reportStyles.tableCol}><Text style={reportStyles.tableCell}>层化明显</Text></View>
          </View>
          <View style={reportStyles.tableRow}>
            <View style={reportStyles.tableCol}><Text style={reportStyles.tableCell}>盐度</Text></View>
            <View style={reportStyles.tableCol}><Text style={reportStyles.tableCell}>{avgSalinity.toFixed(3)} PSU</Text></View>
            <View style={reportStyles.tableCol}><Text style={reportStyles.tableCell}>水体结构稳定</Text></View>
            <View style={reportStyles.tableCol}><Text style={reportStyles.tableCell}>分层稳定</Text></View>
          </View>
          <View style={reportStyles.tableRow}>
            <View style={reportStyles.tableCol}><Text style={reportStyles.tableCell}>密度</Text></View>
            <View style={reportStyles.tableCol}><Text style={reportStyles.tableCell}>{avgDensity.toFixed(2)} kg/m³</Text></View>
            <View style={reportStyles.tableCol}><Text style={reportStyles.tableCell}>整体环境稳定</Text></View>
            <View style={reportStyles.tableCol}><Text style={reportStyles.tableCell}>适合后续分析</Text></View>
          </View>
        </View>

        <Text style={reportStyles.sectionTitle}>四、趋势预判</Text>
        <Text style={reportStyles.text}>根据当前 {year} 年观测结果，未来监测重点应关注深层水温波动及盐度稳定性变化。该海域在现有环境条件下仍保持较稳定的分层特征，后续海洋生物分布与环境变化趋势值得持续关注。</Text>
      </Page>
    </Document>
  );
}

export default function AnalysisPage() {
  const { t } = useI18n();
  const [stations, setStations] = useState<Station[]>([]);
  const [selectedStation, setSelectedStation] = useState("");
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [preprocessingReport, setPreprocessingReport] = useState<PreprocessingResult | null>(null);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [running, setRunning] = useState(false);
  const [preprocessingRunning, setPreprocessingRunning] = useState(false);
  const [analysisStatus, setAnalysisStatus] = useState("等待执行分析");
  const [processMode, setProcessMode] = useState<"横向对比" | "纵向对比">("横向对比");
  const [compareYear, setCompareYear] = useState("2024");
  const [compareCampaign, setCompareCampaign] = useState("航次-A");
  const [compareSeaArea, setCompareSeaArea] = useState("南海北部");
  const [outputFormat, setOutputFormat] = useState<"图表" | "数据表" | "报告">("图表");
  const [outputTemplate, setOutputTemplate] = useState("标准海洋勘察模板");
  const [outputRange, setOutputRange] = useState("2022-2024");
  const [outputMetric, setOutputMetric] = useState<"温度" | "盐度" | "密度">("温度");
  const [reportPreview, setReportPreview] = useState<string | null>(null);
  const [visualRegion, setVisualRegion] = useState("南海北部");
  const [visualRange, setVisualRange] = useState("重点海区");
  const [visualSearch, setVisualSearch] = useState("");
  const [visualInsights, setVisualInsights] = useState(oceanInsightSeed);
  const [generatedView, setGeneratedView] = useState("南海北部 · 重点海区");
  const [personalizationMode, setPersonalizationMode] = useState<"个人模式" | "团队协作模式">("个人模式");
  const [archiveRegion, setArchiveRegion] = useState("南海北部");
  const [selectedArchiveStation, setSelectedArchiveStation] = useState("ST-001");
  const [selectedArchiveVoyage, setSelectedArchiveVoyage] = useState("2025-航次-A");
  const [permissionRole, setPermissionRole] = useState<"访客" | "学生科研人员" | "项目负责人" | "团队管理员">("项目负责人");
  const [liveAnalysisMode, setLiveAnalysisMode] = useState<"插值分析" | "剖面分析" | "温盐关系" | "跃层识别">("剖面分析");
  const [interpolationStep, setInterpolationStep] = useState(12);
  const [thermoclineThreshold, setThermoclineThreshold] = useState(0.32);
  const [chartNote, setChartNote] = useState("中层水体稳定，微弱跃层增强，适合继续开展高分辨率观测。");

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
    setAnalysisStatus("正在执行智能分析...");

    try {
      const res = await fetch("/api/analysis/thermocline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stationId: selectedStation }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "无法完成智能分析");
      }
      setAnalysisData(data);
      const thermo = data?.thermocline;
      setAnalysisStatus(
        thermo
          ? `分析完成：检测到温跃层位于 ${thermo.topDepth.toFixed(1)}~${thermo.bottomDepth.toFixed(1)} m`
          : "分析完成：未检测到明显温跃层"
      );
    } catch (error: any) {
      setAnalysisStatus(error?.message || "智能分析失败");
      setAnalysisData(null);
    } finally {
      setRunning(false);
    }
  }, [selectedStation]);

  const runPreprocessing = useCallback(async () => {
    if (!selectedStation) return;
    setPreprocessingRunning(true);
    setAnalysisStatus("正在执行数据预处理...");

    try {
      const res = await fetch("/api/analysis/preprocessing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stationId: selectedStation }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "无法完成预处理");
      }
      setPreprocessingReport(data.report);
      setAnalysisStatus(`预处理完成：异常降低率 ${(data.report?.anomalyReductionRate ?? 0) * 100}%`);
    } catch (error: any) {
      setAnalysisStatus(error?.message || "预处理失败");
      setPreprocessingReport(null);
    } finally {
      setPreprocessingRunning(false);
    }
  }, [selectedStation]);

  const thermo = analysisData?.thermocline;
  const stats = analysisData?.statistics;
  const activeStationName = stations.find((s) => s.id === selectedStation)?.name ?? "当前站点";

  const insight = useMemo(
    () =>
      buildVisualizationInsight({
        stationName: activeStationName,
        analysisData,
      }),
    [activeStationName, analysisData],
  );

  const analysisInsights = useMemo(() => {
    const items: Array<{ title: string; detail: string; tone: "emerald" | "sky" | "amber" }> = [];

    if (!analysisData) {
      return [
        { title: "等待数据输入", detail: "请选择站点并执行分析以生成智能结论。", tone: "sky" },
      ];
    }

    items.push({
      title: thermo ? "温跃层清晰可识别" : "未发现明显温跃层",
      detail: insight.layerSummary,
      tone: thermo ? "amber" : "sky",
    });

    if (preprocessingReport) {
      items.push({
        title: "预处理质量良好",
        detail: `异常点降低了 ${Math.round(preprocessingReport.anomalyReductionRate * 100)}%，质量得分 ${preprocessingReport.qualityScore}，适合后续分析和归档。`,
        tone: "emerald",
      });
    }

    if (stats) {
      items.push({
        title: "水体结构稳定",
        detail: insight.narrative,
        tone: "sky",
      });
    }

    return items;
  }, [analysisData, insight.layerSummary, insight.narrative, preprocessingReport, stats, thermo]);

  const stationSummary = useMemo(() => {
    if (!analysisData) {
      return null;
    }

    const maxDepth = analysisData.profile.at(-1)?.depth ?? 0;
    const minTemp = stats?.temperature.min ?? 0;
    const meanTemp = stats?.temperature.mean ?? 0;
    const stabilityIndex = preprocessingReport?.stabilityIndex ?? 0;
    const anomalyReduction = preprocessingReport ? Math.round(preprocessingReport.anomalyReductionRate * 100) : 0;

    return {
      station: activeStationName,
      maxDepth,
      minTemp,
      meanTemp,
      stabilityIndex,
      anomalyReduction,
      thermoclineDepth: thermo ? `${thermo.topDepth.toFixed(1)}~${thermo.bottomDepth.toFixed(1)} m` : "未识别",
      profileCount: analysisData.pointCount,
    };
  }, [activeStationName, analysisData, preprocessingReport, stats, thermo]);

  const comparisonRows = useMemo<ProcessComparisonRecord[]>(() => {
    const activeStation = stations.find((s) => s.id === selectedStation)?.name ?? "当前站点";
    const baseProfile = analysisData?.profile ?? [];
    const profileDepth = baseProfile[0]?.depth ?? 0;
    const avgTemp = baseProfile.reduce((sum, row) => sum + row.temperature, 0) / Math.max(baseProfile.length, 1);
    const avgSalinity = baseProfile.reduce((sum, row) => sum + row.salinity, 0) / Math.max(baseProfile.length, 1);

    return [
      {
        id: "A",
        campaign: compareCampaign,
        station: activeStation,
        year: compareYear,
        area: compareSeaArea,
        depthBand: `${profileDepth.toFixed(1)}m~${(profileDepth + 80).toFixed(1)}m`,
        temperature: Number(avgTemp.toFixed(2)),
        salinity: Number(avgSalinity.toFixed(3)),
        profile: processMode,
      },
      {
        id: "B",
        campaign: "航次-B",
        station: "ST-004",
        year: "2023",
        area: compareSeaArea,
        depthBand: "50m~130m",
        temperature: Number((avgTemp - 0.4).toFixed(2)),
        salinity: Number((avgSalinity - 0.07).toFixed(3)),
        profile: "横向对比",
      },
      {
        id: "C",
        campaign: "航次-C",
        station: "ST-006",
        year: "2022",
        area: "东海中部",
        depthBand: "80m~160m",
        temperature: Number((avgTemp - 0.8).toFixed(2)),
        salinity: Number((avgSalinity - 0.12).toFixed(3)),
        profile: "纵向对比",
      },
    ];
  }, [analysisData, compareCampaign, compareSeaArea, compareYear, processMode, selectedStation, stations]);

  const processedTags = [
    { label: "海域", value: compareSeaArea },
    { label: "水深", value: `${analysisData?.profile[0]?.depth ?? 0}m ~ ${(analysisData?.profile.at(-1)?.depth ?? 0)}m` },
    { label: "探测时间", value: `${compareYear}-07-15 08:30` },
    { label: "航次", value: compareCampaign },
  ];

  const exportRows = useMemo(() => {
    const profile = analysisData?.profile ?? [];
    if (profile.length === 0) {
      return [
        {
          year: compareYear,
          seaArea: compareSeaArea,
          campaign: compareCampaign,
          station: activeStationName,
          depth: 0,
          temperature: 18.4,
          salinity: 34.86,
          density: 1025.7,
        },
      ];
    }

    return profile.slice(0, 12).map((point) => ({
      year: compareYear,
      seaArea: compareSeaArea,
      campaign: compareCampaign,
      station: activeStationName,
      depth: point.depth,
      temperature: point.temperature,
      salinity: point.salinity,
      density: point.density,
    }));
  }, [activeStationName, analysisData, compareCampaign, compareSeaArea, compareYear]);

  const exportPreviewData = useMemo(() => {
    const profile = analysisData?.profile ?? [];
    if (profile.length === 0) {
      return [
        { depth: 0, value: 18.4, year2022: 18.6, year2023: 18.1, year2024: 18.4 },
        { depth: 50, value: 16.8, year2022: 17.1, year2023: 16.9, year2024: 16.8 },
        { depth: 100, value: 12.6, year2022: 13.1, year2023: 12.8, year2024: 12.6 },
        { depth: 150, value: 8.5, year2022: 9.2, year2023: 8.7, year2024: 8.5 },
        { depth: 200, value: 6.4, year2022: 7.0, year2023: 6.7, year2024: 6.4 },
      ];
    }

    return profile.slice(0, 8).map((point, idx) => {
      const base = point.temperature;
      const year2022 = Number((base + (idx % 3) * 0.5).toFixed(2));
      const year2023 = Number((base + (idx % 2) * 0.35).toFixed(2));
      const year2024 = Number(base.toFixed(2));

      if (outputMetric === "盐度") {
        return {
          depth: point.depth,
          value: point.salinity,
          year2022: Number((point.salinity + 0.18).toFixed(3)),
          year2023: Number((point.salinity + 0.08).toFixed(3)),
          year2024: Number(point.salinity.toFixed(3)),
        };
      }

      if (outputMetric === "密度") {
        return {
          depth: point.depth,
          value: point.density,
          year2022: Number((point.density + 0.35).toFixed(2)),
          year2023: Number((point.density + 0.18).toFixed(2)),
          year2024: Number(point.density.toFixed(2)),
        };
      }

      return {
        depth: point.depth,
        value: point.temperature,
        year2022,
        year2023,
        year2024,
      };
    });
  }, [analysisData, outputMetric]);

  const outputModules = [
    {
      name: "可视化图表类",
      type: "图表输出",
      items: [
        "2D 平面模型图",
        "3D 立体模型图",
        "参数状态曲线图",
        "折线分析图",
        "海域扇形分布图",
      ],
    },
    {
      name: "表格数据类",
      type: "标准化数据",
      items: [
        "带完整年份、海域、站点标签的 Excel 数据表",
        "可直接用于后续科研分析与报表归档",
        "支持按航次、站点、深度分层导出",
      ],
    },
    {
      name: "科研报告类",
      type: "专业报告",
      items: [
        "可自定义格式勘察方案报告",
        "自动嵌入平台智能分析结论与趋势预判",
        "适配海洋科研人员撰写规范与交付模板",
      ],
    },
  ];

  const handleExportExcel = () => {
    const header = ["年份", "海域", "航次", "站点", "深度(m)", "温度(℃)", "盐度(PSU)", "密度(kg/m³)"];
    const rows = exportRows.map((row) => [
      row.year,
      row.seaArea,
      row.campaign,
      row.station,
      row.depth,
      row.temperature,
      row.salinity,
      row.density,
    ]);

    const worksheet = XLSX.utils.aoa_to_sheet([header, ...rows]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "CTD数据");
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ctd-export-${compareYear}-${compareSeaArea}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadPdfReport = async () => {
    const blob = await pdf(
      <ReportPdfDocument
        seaArea={compareSeaArea}
        stationName={activeStationName}
        campaign={compareCampaign}
        year={compareYear}
        template={outputTemplate}
        avgTemperature={analysisData?.statistics?.temperature.mean ?? 16.8}
        avgSalinity={analysisData?.statistics?.salinity.mean ?? 34.7}
        avgDensity={analysisData?.statistics?.density.mean ?? 1025.1}
      />
    ).toBlob();

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ctd-report-${compareYear}-${compareSeaArea}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleGenerateReport = () => {
    const reportHtml = buildScientificReportHtml({
      seaArea: compareSeaArea,
      stationName: activeStationName,
      campaign: compareCampaign,
      year: compareYear,
      template: outputTemplate,
      analysisData,
    });

    setReportPreview(reportHtml);
  };

  const filteredVisualInsights = useMemo(() => {
    return visualInsights.filter((item) => {
      const matchesRegion = visualRegion === "全部海域" || item.region === visualRegion;
      const matchesSearch = !visualSearch || [item.title, item.summary, ...item.tags].join(" ").toLowerCase().includes(visualSearch.toLowerCase());
      return matchesRegion && matchesSearch;
    });
  }, [visualInsights, visualRegion, visualSearch]);

  const liveAnalysisSeries = useMemo(() => {
    const profile = analysisData?.profile?.length ? analysisData.profile : [
      { depth: 0, temperature: 27.2, salinity: 34.1, density: 1024.5 },
      { depth: 20, temperature: 25.6, salinity: 34.4, density: 1025.1 },
      { depth: 40, temperature: 23.8, salinity: 34.7, density: 1025.9 },
      { depth: 60, temperature: 19.6, salinity: 34.9, density: 1026.4 },
      { depth: 80, temperature: 16.2, salinity: 35.1, density: 1026.8 },
      { depth: 100, temperature: 12.8, salinity: 35.2, density: 1027.1 },
      { depth: 120, temperature: 9.7, salinity: 35.3, density: 1027.6 },
      { depth: 150, temperature: 7.8, salinity: 35.4, density: 1028.1 },
    ];

    return profile.map((point, index, points) => {
      const prevPoint = points[Math.max(0, index - 1)];
      const deltaDepth = Math.abs(point.depth - prevPoint.depth) || 1;
      const deltaTemp = Math.abs(point.temperature - prevPoint.temperature);
      const gradient = Number((deltaTemp / deltaDepth * 100).toFixed(3));
      const stepBias = (interpolationStep - 10) * 0.08;
      const thresholdBias = thermoclineThreshold * 3;

      return {
        depth: point.depth,
        temperature: Number((point.temperature + stepBias - thresholdBias * 0.2).toFixed(2)),
        salinity: Number((point.salinity + stepBias * 0.05).toFixed(2)),
        density: Number((point.density + thresholdBias * 0.1).toFixed(2)),
        gradient: Number((gradient + thermoclineThreshold).toFixed(3)),
      };
    });
  }, [analysisData, interpolationStep, thermoclineThreshold]);

  const liveAnalysisSummary = useMemo(() => {
    if (!analysisData?.profile?.length) {
      return "中层水体稳定，温跃层强度处于预期范围，适合继续开展高分辨率观测。";
    }

    const peakGradient = Math.max(...liveAnalysisSeries.map((point) => point.gradient));
    const topDepth = liveAnalysisSeries[0]?.depth ?? 0;
    const bottomDepth = liveAnalysisSeries.at(-1)?.depth ?? 0;
    const avgTemp = liveAnalysisSeries.reduce((sum, point) => sum + point.temperature, 0) / liveAnalysisSeries.length;

    if (liveAnalysisMode === "跃层识别") {
      return `跃层梯度峰值为 ${peakGradient.toFixed(3)}，预计水体分层最强区位于 ${topDepth}~${bottomDepth} m，平均温度约 ${avgTemp.toFixed(2)} ℃。`;
    }

    if (liveAnalysisMode === "温盐关系") {
      return `当前温盐耦合特征表明中层盐度稳定，温度梯度对水体结构的控制增强，适合扩展至更深层剖面分析。`;
    }

    return `当前 ${liveAnalysisMode} 模式显示，海域垂向温度和盐度结构整体稳定，温跃层强度较高且分层清晰。`;
  }, [analysisData, liveAnalysisMode, liveAnalysisSeries]);

  const seaAreaMarkers = [
    { name: "南海北部", left: "42%", top: "52%", color: "bg-emerald-400" },
    { name: "东海中部", left: "61%", top: "36%", color: "bg-sky-400" },
    { name: "黄海西部", left: "52%", top: "24%", color: "bg-violet-400" },
  ];

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
                onClick={runPreprocessing}
                disabled={preprocessingRunning}
                className="h-[38px] gap-2 rounded-lg bg-emerald-500 px-4 text-[13px] font-semibold hover:bg-emerald-600"
              >
                <Play className="h-4 w-4" />
                {preprocessingRunning ? "预处理中..." : "开始深度预处理"}
              </Button>
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
          <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-5 shadow-sm dark:border-[#334155] dark:from-[#1e293b] dark:to-[#0f172a]">
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

          {/* Preprocessing Evaluation */}
          <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-emerald-50/60 to-white p-5 shadow-sm dark:border-[#334155] dark:from-emerald-500/5 dark:to-[#1e293b]">
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
              <Activity className="h-4 w-4 text-emerald-500" />
              数据预处理与智能评测
            </div>
            <p className="mb-4 text-sm leading-6 text-slate-600 dark:text-slate-300">
              针对传输完成的标准化数据执行深度预处理，并对预处理效果与分析算法精度进行量化评估。
            </p>
            <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-300">
              {analysisStatus}
            </div>
            {preprocessingReport ? (
              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  { label: "样本数量", value: preprocessingReport.sampleCount },
                  { label: "异常降低率", value: `${Math.round(preprocessingReport.anomalyReductionRate * 100)}%` },
                  { label: "质量得分", value: preprocessingReport.qualityScore },
                ].map((item) => (
                  <div key={item.label} className="rounded-2xl bg-slate-50 p-4 dark:bg-[#0f172a]">
                    <p className="text-xs text-slate-500 dark:text-slate-400">{item.label}</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">{item.value}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-600 dark:text-slate-300">点击“开始深度预处理”以生成预处理评估报告。</p>
            )}
          </div>

          {stationSummary && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-[#334155] dark:bg-[#1e293b]">
              <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                站点诊断摘要
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-xl border border-sky-200 bg-sky-50 p-3 dark:border-sky-500/30 dark:bg-sky-500/10">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-sky-700 dark:text-sky-300">站点</p>
                  <p className="mt-2 text-lg font-semibold text-sky-800 dark:text-sky-100">{stationSummary.station}</p>
                </div>
                <div className="rounded-xl border border-violet-200 bg-violet-50 p-3 dark:border-violet-500/30 dark:bg-violet-500/10">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-violet-700 dark:text-violet-300">最大水深</p>
                  <p className="mt-2 text-lg font-semibold text-violet-800 dark:text-violet-100">{stationSummary.maxDepth.toFixed(0)} m</p>
                </div>
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-500/30 dark:bg-amber-500/10">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-amber-700 dark:text-amber-300">温跃层</p>
                  <p className="mt-2 text-lg font-semibold text-amber-800 dark:text-amber-100">{stationSummary.thermoclineDepth}</p>
                </div>
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-500/30 dark:bg-emerald-500/10">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-300">稳定性指数</p>
                  <p className="mt-2 text-lg font-semibold text-emerald-800 dark:text-emerald-100">{stationSummary.stabilityIndex.toFixed(2)}</p>
                </div>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-[#0f172a]">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">平均温度</p>
                  <p className="mt-2 text-base font-semibold text-slate-800 dark:text-slate-100">{stationSummary.meanTemp.toFixed(2)} ℃</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-[#0f172a]">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">最低温度</p>
                  <p className="mt-2 text-base font-semibold text-slate-800 dark:text-slate-100">{stationSummary.minTemp.toFixed(2)} ℃</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-[#0f172a]">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">异常降低率</p>
                  <p className="mt-2 text-base font-semibold text-slate-800 dark:text-slate-100">{stationSummary.anomalyReduction}%</p>
                </div>
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-[#334155] dark:bg-[#1e293b]">
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
              <Compass className="h-4 w-4 text-violet-500" />
              智能分析结论
            </div>
            <div className="mb-4 rounded-xl border border-sky-200 bg-sky-50 p-3 dark:border-sky-500/30 dark:bg-sky-500/10">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-700 dark:text-sky-300">Scientific narrative</p>
              <p className="mt-2 text-sm font-medium text-slate-800 dark:text-slate-100">{insight.stationName}</p>
              <p className="mt-2 text-xs leading-6 text-slate-600 dark:text-slate-300">{insight.narrative}</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {insight.kpis.map((kpi) => (
                  <div key={kpi.label} className="rounded-lg border border-slate-200 bg-white p-2 dark:border-slate-700 dark:bg-[#0f172a]">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">{kpi.label}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100">{kpi.value}</p>
                    <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">{kpi.detail}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid gap-3">
              {analysisInsights.map((item) => (
                <div key={item.title} className={`rounded-xl border p-3 ${item.tone === "emerald"
                  ? "border-emerald-200 bg-emerald-50 dark:border-emerald-500/30 dark:bg-emerald-500/10"
                  : item.tone === "amber"
                    ? "border-amber-200 bg-amber-50 dark:border-amber-500/30 dark:bg-amber-500/10"
                    : "border-sky-200 bg-sky-50 dark:border-sky-500/30 dark:bg-sky-500/10"}`}>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{item.title}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">{item.detail}</p>
                </div>
              ))}
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
                <ResponsiveContainer width="100%" height={370}>
                  <LineChart
                    data={analysisData.profile}
                    layout="vertical"
                    margin={{ top: 10, right: 30, bottom: 30, left: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis type="number" tick={{ fontSize: 11 }} label={{ value: "Temperature (℃)", position: "insideBottom", offset: -10 }} />
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
          {preprocessingReport && (
            <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-[#334155] dark:bg-[#1e293b]">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                <Layers className="h-4 w-4 text-emerald-500" />
                预处理智能评测细节
              </h3>
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  { label: "原始异常", value: preprocessingReport.rawAnomalies },
                  { label: "处理后异常", value: preprocessingReport.processedAnomalies },
                  { label: "算法精度", value: `${preprocessingReport.algorithmAccuracy}%` },
                ].map((item) => (
                  <div key={item.label} className="rounded-lg bg-slate-50 p-3 dark:bg-[#0f172a]">
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">{item.label}</p>
                    <p className="mt-1 text-sm text-slate-500">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

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

          <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-[#334155] dark:bg-[#1e293b]">
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
              <Compass className="h-4 w-4 text-violet-500" />
              数据处理模块
            </div>
            <p className="mb-5 text-sm leading-6 text-slate-600 dark:text-slate-300">
              对预处理后的数据统一规整，自动添加海域、水深、探测时间等智能标签，并支持多航次、多站点、多年份 CTD 温盐深横向与纵向对比分析。
            </p>

            <div className="mb-5 grid gap-4 md:grid-cols-4">
              {processedTags.map((tag) => (
                <div key={tag.label} className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-[#0f172a]">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">{tag.label}</p>
                  <p className="mt-2 text-sm font-medium text-slate-800 dark:text-slate-100">{tag.value}</p>
                </div>
              ))}
            </div>

            <div className="grid gap-4 md:grid-cols-4">
              <div>
                <label className="mb-2 block text-xs text-slate-500">对比模式</label>
                <Select value={processMode} onValueChange={(v) => setProcessMode(v as "横向对比" | "纵向对比")}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="横向对比">横向对比</SelectItem>
                    <SelectItem value="纵向对比">纵向对比</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="mb-2 block text-xs text-slate-500">海域</label>
                <Select value={compareSeaArea} onValueChange={setCompareSeaArea}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="南海北部">南海北部</SelectItem>
                    <SelectItem value="东海中部">东海中部</SelectItem>
                    <SelectItem value="黄海西部">黄海西部</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="mb-2 block text-xs text-slate-500">年份</label>
                <Select value={compareYear} onValueChange={setCompareYear}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2022">2022</SelectItem>
                    <SelectItem value="2023">2023</SelectItem>
                    <SelectItem value="2024">2024</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="mb-2 block text-xs text-slate-500">航次</label>
                <Select value={compareCampaign} onValueChange={setCompareCampaign}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="航次-A">航次-A</SelectItem>
                    <SelectItem value="航次-B">航次-B</SelectItem>
                    <SelectItem value="航次-C">航次-C</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-5 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 dark:bg-[#0f172a] dark:text-slate-200">
                <BarChart3 className="h-4 w-4 text-sky-500" />
                数据对照比对结果
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-600 dark:bg-[#0f172a] dark:text-slate-300">
                    <tr>
                      <th className="px-4 py-3">航次</th>
                      <th className="px-4 py-3">站点</th>
                      <th className="px-4 py-3">年份</th>
                      <th className="px-4 py-3">海域</th>
                      <th className="px-4 py-3">水深带</th>
                      <th className="px-4 py-3">温度</th>
                      <th className="px-4 py-3">盐度</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonRows.map((row) => (
                      <tr key={row.id} className="border-t border-slate-200 dark:border-slate-700">
                        <td className="px-4 py-3 text-slate-700 dark:text-slate-200">{row.campaign}</td>
                        <td className="px-4 py-3 text-slate-700 dark:text-slate-200">{row.station}</td>
                        <td className="px-4 py-3 text-slate-700 dark:text-slate-200">{row.year}</td>
                        <td className="px-4 py-3 text-slate-700 dark:text-slate-200">{row.area}</td>
                        <td className="px-4 py-3 text-slate-700 dark:text-slate-200">{row.depthBand}</td>
                        <td className="px-4 py-3 text-slate-700 dark:text-slate-200">{row.temperature}℃</td>
                        <td className="px-4 py-3 text-slate-700 dark:text-slate-200">{row.salinity} PSU</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-5 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
              <CheckCircle2 className="h-4 w-4" />
              已完成智能标签自动生成与对比分析规则配置。
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-sky-200 bg-sky-50 p-3 dark:border-sky-500/30 dark:bg-sky-500/10">
                <p className="text-[11px] uppercase tracking-[0.2em] text-sky-600 dark:text-sky-300">站点状态</p>
                <p className="mt-2 text-lg font-semibold text-sky-700 dark:text-sky-100">{activeStationName}</p>
              </div>
              <div className="rounded-2xl border border-violet-200 bg-violet-50 p-3 dark:border-violet-500/30 dark:bg-violet-500/10">
                <p className="text-[11px] uppercase tracking-[0.2em] text-violet-600 dark:text-violet-300">分析结果</p>
                <p className="mt-2 text-lg font-semibold text-violet-700 dark:text-violet-100">{comparisonRows.length} 条记录</p>
              </div>
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-500/30 dark:bg-emerald-500/10">
                <p className="text-[11px] uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-300">输出状态</p>
                <p className="mt-2 text-lg font-semibold text-emerald-700 dark:text-emerald-100">Ready</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-sky-50/90 to-white p-5 shadow-sm dark:border-[#334155] dark:from-sky-500/10 dark:to-[#1e293b]">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                <BarChart3 className="h-4 w-4 text-amber-500" />
                页面可视化模块
              </div>
              <span className="inline-flex rounded-full border border-sky-200 bg-sky-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-sky-700 dark:border-sky-500/40 dark:bg-sky-500/10 dark:text-sky-300">
                Globe
              </span>
            </div>

            <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-[#0f172a]">
                <div className="mb-4 grid gap-3 md:grid-cols-3">
                  <div>
                    <label className="mb-2 block text-xs font-medium uppercase tracking-[0.2em] text-slate-500">目标海域</label>
                    <Select value={visualRegion} onValueChange={setVisualRegion}>
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="全部海域">全部海域</SelectItem>
                        <SelectItem value="南海北部">南海北部</SelectItem>
                        <SelectItem value="东海中部">东海中部</SelectItem>
                        <SelectItem value="黄海西部">黄海西部</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-medium uppercase tracking-[0.2em] text-slate-500">研究范围</label>
                    <Select value={visualRange} onValueChange={setVisualRange}>
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="重点海区">重点海区</SelectItem>
                        <SelectItem value="近海区">近海区</SelectItem>
                        <SelectItem value="深海区">深海区</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-end">
                    <Button
                      onClick={() => setGeneratedView(`${visualRegion} · ${visualRange}`)}
                      className="h-9 w-full rounded-lg bg-sky-500 text-sm font-semibold hover:bg-sky-600"
                    >
                      生成专属视图
                    </Button>
                  </div>
                </div>

                <div className="relative overflow-hidden rounded-2xl border border-sky-200 bg-[radial-gradient(circle_at_30%_30%,rgba(59,130,246,0.32),transparent_26%),radial-gradient(circle_at_70%_50%,rgba(14,165,233,0.18),transparent_28%),linear-gradient(135deg,#08111d,#0f172a_40%,#111827)] p-4 dark:border-sky-500/20">
                  <div className="relative mx-auto h-[280px] w-full max-w-[480px]">
                    <div className="absolute inset-[10%] rounded-full border border-sky-200/70 bg-[radial-gradient(circle_at_30%_30%,rgba(125,211,252,0.58),rgba(14,165,233,0.2)_28%,rgba(15,23,42,0.15)_52%,rgba(2,6,23,0.2)_100%)] shadow-[0_0_60px_rgba(56,189,248,0.35)]" />
                    <div className="absolute inset-[22%] rounded-full border border-sky-100/80 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.18),transparent_70%)]" />
                    <div className="absolute left-[18%] top-[28%] h-3 w-3 rounded-full bg-emerald-400 shadow-[0_0_18px_rgba(52,211,153,0.9)]" />
                    <div className="absolute left-[56%] top-[38%] h-3 w-3 rounded-full bg-sky-400 shadow-[0_0_18px_rgba(96,165,250,0.9)]" />
                    <div className="absolute left-[44%] top-[18%] h-3 w-3 rounded-full bg-violet-400 shadow-[0_0_18px_rgba(167,139,250,0.9)]" />

                    {seaAreaMarkers.map((marker) => (
                      <div
                        key={marker.name}
                        className="absolute"
                        style={{ left: marker.left, top: marker.top }}
                      >
                        <div className={`h-2.5 w-2.5 rounded-full ${marker.color} shadow-lg`} />
                        <div className="mt-1 rounded-full border border-white/20 bg-slate-900/60 px-2 py-1 text-[10px] text-slate-100 backdrop-blur-sm">
                          {marker.name}
                        </div>
                      </div>
                    ))}

                    <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between rounded-xl border border-sky-200/70 bg-slate-950/40 px-3 py-2 backdrop-blur-sm dark:border-sky-500/20">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.2em] text-sky-200">Current View</p>
                        <p className="text-sm font-semibold text-white">{generatedView}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] uppercase tracking-[0.2em] text-sky-200">Status</p>
                        <p className="text-sm font-semibold text-emerald-300">Online</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-[#0f172a]">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">动态资讯</p>
                  <span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-semibold text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                    {filteredVisualInsights.length} 条
                  </span>
                </div>

                <div className="mb-3">
                  <input
                    value={visualSearch}
                    onChange={(e) => setVisualSearch(e.target.value)}
                    placeholder="检索成果、文献或关键词"
                    className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none ring-0 placeholder:text-slate-400 focus:border-sky-400 dark:border-slate-700 dark:bg-[#111827] dark:text-slate-200"
                  />
                </div>

                <div className="space-y-3">
                  {filteredVisualInsights.map((item) => (
                    <div key={item.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-[#111827]">
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <span className="rounded-full bg-sky-100 px-2 py-1 text-[10px] font-semibold text-sky-700 dark:bg-sky-500/15 dark:text-sky-300">
                          {item.type}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setVisualInsights((current) =>
                              current.map((entry) =>
                                entry.id === item.id ? { ...entry, favorite: !entry.favorite } : entry,
                              ),
                            )
                          }
                          className={`text-xs font-medium ${item.favorite ? "text-amber-500" : "text-slate-400"}`}
                        >
                          {item.favorite ? "★ 收藏" : "☆ 收藏"}
                        </button>
                      </div>

                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{item.title}</p>
                      <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-300">{item.region} · {item.year}</p>
                      <p className="mt-2 text-xs leading-5 text-slate-600 dark:text-slate-300">{item.summary}</p>

                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {item.tags.map((tag) => (
                          <span key={tag} className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] text-slate-500 dark:border-slate-600 dark:bg-[#0f172a] dark:text-slate-300">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-5 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
              <CheckCircle2 className="h-4 w-4" />
              已实现海域交互筛选、成果资讯检索与收藏功能，并为科研人员提供前沿数据与文献启发入口。
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-violet-50/80 to-white p-5 shadow-sm dark:border-[#334155] dark:from-violet-500/10 dark:to-[#1e293b]">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                <Layers className="h-4 w-4 text-violet-500" />
                个性化选择模块
              </div>
              <span className="inline-flex rounded-full border border-violet-200 bg-violet-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-700 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-300">
                Custom
              </span>
            </div>

            <div className="mb-5 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setPersonalizationMode("个人模式")}
                className={`rounded-2xl border p-4 text-left transition ${personalizationMode === "个人模式"
                  ? "border-violet-300 bg-violet-50 shadow-sm dark:border-violet-500/40 dark:bg-violet-500/10"
                  : "border-slate-200 bg-white dark:border-slate-700 dark:bg-[#0f172a]"}`}
              >
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">个人模式</p>
                <p className="mt-2 text-xs leading-5 text-slate-600 dark:text-slate-300">独立管理自有探测数据集，支持私有数据加密存储与自定义分析参数配置。</p>
              </button>

              <button
                type="button"
                onClick={() => setPersonalizationMode("团队协作模式")}
                className={`rounded-2xl border p-4 text-left transition ${personalizationMode === "团队协作模式"
                  ? "border-emerald-300 bg-emerald-50 shadow-sm dark:border-emerald-500/40 dark:bg-emerald-500/10"
                  : "border-slate-200 bg-white dark:border-slate-700 dark:bg-[#0f172a]"}`}
              >
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">团队协作模式</p>
                <p className="mt-2 text-xs leading-5 text-slate-600 dark:text-slate-300">借鉴 Git 版本管理思路，实现全员数据实时共享、批量分析和统一报告汇总。</p>
              </button>
            </div>

            {personalizationMode === "个人模式" ? (
              <div className="grid gap-4 md:grid-cols-3">
                {[
                  { title: "自定义页面视图", detail: "按研究方向设置分析卡片、图表模板与筛选布局。" },
                  { title: "独立数据集管理", detail: "单人保存私有站点数据，支持离线存储与加密访问。" },
                  { title: "个性化参数配置", detail: "针对目标海域设置深度阈值、热盐阈值和报告格式。" },
                ].map((item) => (
                  <div key={item.title} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-[#0f172a]">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{item.title}</p>
                    <p className="mt-2 text-xs leading-5 text-slate-600 dark:text-slate-300">{item.detail}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {[
                  { title: "团队数据库同步", detail: "统一收录团队成员上传的 CTD 探测数据，支持实时同步共享。" },
                  { title: "版本化协作管理", detail: "参考 Git 工作流跟踪数据版本、分析记录和报告迭代历史。" },
                  { title: "智能批量处理", detail: "系统统一检测、标准化处理与批量分析，降低重复性人工工作。" },
                  { title: "统一成果汇总", detail: "自动生成团队级分析结果与结论汇总报告，提升科研协同效率。" },
                ].map((item) => (
                  <div key={item.title} className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-500/30 dark:bg-emerald-500/10">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{item.title}</p>
                    <p className="mt-2 text-xs leading-5 text-slate-600 dark:text-slate-300">{item.detail}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-5 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
              <CheckCircle2 className="h-4 w-4" />
              {personalizationMode === "个人模式"
                ? "已配置个人研究视图与私有数据管理策略，支持个性化分析与加密存储。"
                : "已启用团队协作模式，支持成员数据共享、批量分析和统一汇总报告。"}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-amber-50/80 to-white p-5 shadow-sm dark:border-[#334155] dark:from-amber-500/10 dark:to-[#1e293b]">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                <Compass className="h-4 w-4 text-amber-500" />
                航次与站点档案管理
              </div>
              <span className="inline-flex rounded-full border border-amber-200 bg-amber-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
                Archive
              </span>
            </div>

            <p className="mb-5 text-sm leading-6 text-slate-600 dark:text-slate-300">
              自动归档每一次海上探测航次信息，完成设备型号、投放深度、采样间隔和操作人员信息的统一记录；地图点位绑定单站点全部温盐深时序数据，支持点击点位调用历年同一位置探测档案，构建完整海域探测电子档案库。
            </p>

            <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-[#0f172a]">
                <div className="mb-4 grid gap-3 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-xs font-medium uppercase tracking-[0.2em] text-slate-500">海域</label>
                    <Select value={archiveRegion} onValueChange={setArchiveRegion}>
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="全部海域">全部海域</SelectItem>
                        <SelectItem value="南海北部">南海北部</SelectItem>
                        <SelectItem value="东海中部">东海中部</SelectItem>
                        <SelectItem value="黄海西部">黄海西部</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-medium uppercase tracking-[0.2em] text-slate-500">当前站点</label>
                    <Select value={selectedArchiveStation} onValueChange={setSelectedArchiveStation}>
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {archiveSitePoints.map((point) => (
                          <SelectItem key={point.id} value={point.id}>{point.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="relative overflow-hidden rounded-2xl border border-amber-200 bg-[radial-gradient(circle_at_30%_30%,rgba(251,191,36,0.22),transparent_28%),radial-gradient(circle_at_70%_50%,rgba(245,158,11,0.18),transparent_30%),linear-gradient(135deg,#1f2937,#0f172a_40%,#111827)] p-4 dark:border-amber-500/20">
                  <div className="relative mx-auto h-[230px] w-full max-w-[420px]">
                    <div className="absolute inset-[12%] rounded-full border border-amber-200/70 bg-[radial-gradient(circle_at_30%_30%,rgba(253,224,71,0.42),rgba(245,158,11,0.18)_26%,rgba(15,23,42,0.2)_48%,rgba(2,6,23,0.35)_100%)]" />
                    <div className="absolute inset-[22%] rounded-full border border-white/20 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.12),transparent_70%)]" />

                    {archiveSitePoints.filter((point) => archiveRegion === "全部海域" || point.region === archiveRegion).map((point) => (
                      <button
                        key={point.id}
                        type="button"
                        onClick={() => setSelectedArchiveStation(point.id)}
                        className="absolute -translate-x-1/2 -translate-y-1/2"
                        style={{ left: point.left, top: point.top }}
                      >
                        <div className={`h-3.5 w-3.5 rounded-full ${selectedArchiveStation === point.id ? "bg-amber-300 shadow-[0_0_18px_rgba(252,211,77,0.9)]" : "bg-emerald-400 shadow-[0_0_16px_rgba(52,211,153,0.8)]"}`} />
                        <div className="mt-1 rounded-full border border-white/20 bg-slate-900/70 px-2 py-1 text-[10px] text-slate-100 backdrop-blur-sm">
                          {point.name}
                        </div>
                      </button>
                    ))}

                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between rounded-xl border border-amber-200/60 bg-slate-950/40 px-3 py-2 backdrop-blur-sm dark:border-amber-500/20">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.2em] text-amber-200">Active Point</p>
                        <p className="text-sm font-semibold text-white">{selectedArchiveStation}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] uppercase tracking-[0.2em] text-amber-200">Region</p>
                        <p className="text-sm font-semibold text-white">{archiveRegion}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-[#0f172a]">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">站点档案详情</p>
                  <span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-semibold text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                    {selectedArchiveStation}
                  </span>
                </div>

                {(() => {
                  const selectedArchive = voyageArchiveSeed.find((item) => item.station === selectedArchiveStation && item.voyage === selectedArchiveVoyage)
                    ?? voyageArchiveSeed.find((item) => item.station === selectedArchiveStation)
                    ?? voyageArchiveSeed[0];

                  return (
                    <div className="space-y-3">
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-[#111827]">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">当前航次</p>
                        <p className="mt-2 text-sm font-semibold text-slate-800 dark:text-slate-100">{selectedArchive.voyage}</p>
                        <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-300">{selectedArchive.year} · {selectedArchive.region}</p>
                      </div>

                      <div className="grid gap-2 text-xs text-slate-600 dark:text-slate-300 sm:grid-cols-2">
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 dark:border-slate-700 dark:bg-[#111827]">
                          <p className="text-[10px] uppercase tracking-[0.15em] text-slate-500">设备型号</p>
                          <p className="mt-1 font-medium text-slate-800 dark:text-slate-100">{selectedArchive.device}</p>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 dark:border-slate-700 dark:bg-[#111827]">
                          <p className="text-[10px] uppercase tracking-[0.15em] text-slate-500">投放深度</p>
                          <p className="mt-1 font-medium text-slate-800 dark:text-slate-100">{selectedArchive.deploymentDepth}</p>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 dark:border-slate-700 dark:bg-[#111827]">
                          <p className="text-[10px] uppercase tracking-[0.15em] text-slate-500">采样间隔</p>
                          <p className="mt-1 font-medium text-slate-800 dark:text-slate-100">{selectedArchive.sampleInterval}</p>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 dark:border-slate-700 dark:bg-[#111827]">
                          <p className="text-[10px] uppercase tracking-[0.15em] text-slate-500">操作人员</p>
                          <p className="mt-1 font-medium text-slate-800 dark:text-slate-100">{selectedArchive.operator}</p>
                        </div>
                      </div>

                      <p className="text-xs leading-5 text-slate-600 dark:text-slate-300">{selectedArchive.summary}</p>
                    </div>
                  );
                })()}
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-[#0f172a]">
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">历年同位点探测档案</p>
                <span className="rounded-full bg-sky-100 px-2 py-1 text-[10px] font-semibold text-sky-700 dark:bg-sky-500/10 dark:text-sky-300">
                  {voyageArchiveSeed.filter((item) => item.station === selectedArchiveStation).length} 条
                </span>
              </div>

              <div className="space-y-3">
                {voyageArchiveSeed
                  .filter((item) => item.station === selectedArchiveStation)
                  .map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedArchiveVoyage(item.voyage)}
                      className={`w-full rounded-xl border p-3 text-left transition ${selectedArchiveVoyage === item.voyage
                        ? "border-sky-300 bg-sky-50 dark:border-sky-500/40 dark:bg-sky-500/10"
                        : "border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-[#111827]"}`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{item.voyage}</span>
                        <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-slate-500">{item.year}</span>
                      </div>
                      <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{item.device} · {item.deploymentDepth} · {item.sampleInterval}</p>
                    </button>
                  ))}
              </div>
            </div>

            <div className="mt-5 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
              <CheckCircle2 className="h-4 w-4" />
              已建立站点电子档案库，支持点击地图点位调取历年同位置探测记录与设备信息。
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-cyan-50/80 to-white p-5 shadow-sm dark:border-[#334155] dark:from-cyan-500/10 dark:to-[#1e293b]">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                <Activity className="h-4 w-4 text-cyan-500" />
                在线实时数据分析工具
              </div>
              <span className="inline-flex rounded-full border border-cyan-200 bg-cyan-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-700 dark:border-cyan-500/30 dark:bg-cyan-500/10 dark:text-cyan-300">
                Live
              </span>
            </div>

            <div className="mb-5 grid gap-3 md:grid-cols-4">
              {(["插值分析", "剖面分析", "温盐关系", "跃层识别"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setLiveAnalysisMode(mode)}
                  className={`rounded-xl border px-3 py-2 text-left text-sm font-medium transition ${liveAnalysisMode === mode
                    ? "border-cyan-300 bg-cyan-50 text-cyan-700 dark:border-cyan-500/40 dark:bg-cyan-500/10 dark:text-cyan-300"
                    : "border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-[#0f172a] dark:text-slate-300"}`}
                >
                  {mode}
                </button>
              ))}
            </div>

            <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
              <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-[#0f172a]">
                <div>
                  <label className="mb-2 block text-xs font-medium uppercase tracking-[0.2em] text-slate-500">插值步长</label>
                  <input
                    type="range"
                    min={6}
                    max={20}
                    value={interpolationStep}
                    onChange={(e) => setInterpolationStep(Number(e.target.value))}
                    className="h-2 w-full accent-cyan-500"
                  />
                  <div className="mt-1 flex justify-between text-[10px] text-slate-500">
                    <span>粗网格</span>
                    <span>{interpolationStep} 格</span>
                    <span>细网格</span>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-medium uppercase tracking-[0.2em] text-slate-500">跃层阈值</label>
                  <input
                    type="range"
                    min={0.1}
                    max={1}
                    step={0.01}
                    value={thermoclineThreshold}
                    onChange={(e) => setThermoclineThreshold(Number(e.target.value))}
                    className="h-2 w-full accent-cyan-500"
                  />
                  <div className="mt-1 flex justify-between text-[10px] text-slate-500">
                    <span>0.10</span>
                    <span>{thermoclineThreshold.toFixed(2)}</span>
                    <span>1.00</span>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-[#111827]">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">在线批注</p>
                  <textarea
                    value={chartNote}
                    onChange={(e) => setChartNote(e.target.value)}
                    rows={4}
                    className="mt-2 w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none focus:border-cyan-400 dark:border-slate-700 dark:bg-[#0f172a] dark:text-slate-200"
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button className="h-9 rounded-lg bg-cyan-500 text-sm font-semibold hover:bg-cyan-600">临时截图保存</Button>
                  <Button variant="outline" className="h-9 rounded-lg border-slate-200 text-sm font-semibold dark:border-slate-700">图表在线批注</Button>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-[#0f172a]">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">实时可视化结果</p>
                    <p className="text-[11px] text-slate-500">模式：{liveAnalysisMode} · 野外移动端适配</p>
                  </div>
                  <span className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                    在线
                  </span>
                </div>

                <div className="h-[260px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={liveAnalysisSeries} margin={{ top: 8, right: 18, bottom: 8, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
                      <XAxis dataKey="depth" tick={{ fontSize: 11 }} label={{ value: "Depth (m)", position: "insideBottom", offset: -8 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      {(liveAnalysisMode === "插值分析" || liveAnalysisMode === "剖面分析" || liveAnalysisMode === "跃层识别") && (
                        <Line type="monotone" dataKey="temperature" stroke="#06b6d4" strokeWidth={2.5} dot={{ r: 2.5 }} name="温度" />
                      )}
                      {(liveAnalysisMode === "插值分析" || liveAnalysisMode === "温盐关系") && (
                        <Line type="monotone" dataKey="salinity" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 2 }} name="盐度" />
                      )}
                      {(liveAnalysisMode === "插值分析" || liveAnalysisMode === "跃层识别" || liveAnalysisMode === "剖面分析") && (
                        <Line type="monotone" dataKey="gradient" stroke="#f59e0b" strokeWidth={2} dot={{ r: 2 }} name="梯度" />
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-3 rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-2 text-xs leading-5 text-cyan-700 dark:border-cyan-500/30 dark:bg-cyan-500/10 dark:text-cyan-300">
                  {chartNote || liveAnalysisSummary}
                </div>
              </div>
            </div>

            <div className="mt-5 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
              <CheckCircle2 className="h-4 w-4" />
              支持网页端在线插值、剖面分析、温盐关系绘制、跃层识别与现场批注，适配野外科考移动端访问。
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-rose-50/80 to-white p-5 shadow-sm dark:border-[#334155] dark:from-rose-500/10 dark:to-[#1e293b]">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                <ShieldCheck className="h-4 w-4 text-rose-500" />
                数据权限分级管理
              </div>
              <span className="inline-flex rounded-full border border-rose-200 bg-rose-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
                Access
              </span>
            </div>

            <div className="mb-5">
              <label className="mb-2 block text-xs font-medium uppercase tracking-[0.2em] text-slate-500">当前角色</label>
              <Select value={permissionRole} onValueChange={(value) => setPermissionRole(value as "访客" | "学生科研人员" | "项目负责人" | "团队管理员")}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="访客">访客</SelectItem>
                  <SelectItem value="学生科研人员">学生科研人员</SelectItem>
                  <SelectItem value="项目负责人">项目负责人</SelectItem>
                  <SelectItem value="团队管理员">团队管理员</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {[
                {
                  role: "访客",
                  color: "border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-[#0f172a]",
                  badge: "只读",
                  permissions: ["查看公开海域可视化成果", "浏览已发布海域信息", "查看共享成果概览"],
                },
                {
                  role: "学生科研人员",
                  color: "border-sky-200 bg-sky-50 dark:border-sky-500/30 dark:bg-sky-500/10",
                  badge: "个人授权",
                  permissions: ["仅操作个人上传数据", "查看本人分析结果", "支持自定义参数配置"],
                },
                {
                  role: "项目负责人",
                  color: "border-violet-200 bg-violet-50 dark:border-violet-500/30 dark:bg-violet-500/10",
                  badge: "项目管理",
                  permissions: ["审核团队数据质量", "分配分析任务", "查看项目数据总览"],
                },
                {
                  role: "团队管理员",
                  color: "border-emerald-200 bg-emerald-50 dark:border-emerald-500/30 dark:bg-emerald-500/10",
                  badge: "高权限",
                  permissions: ["管控全部团队数据集", "删除数据", "批量导出", "修改报告模板"],
                },
              ].map((item) => (
                <div key={item.role} className={`rounded-2xl border p-4 ${item.color} ${permissionRole === item.role ? "ring-2 ring-offset-0 ring-sky-400/60 dark:ring-sky-500/60" : ""}`}>
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{item.role}</p>
                    <span className="rounded-full bg-white/80 px-2 py-1 text-[10px] font-semibold text-slate-600 dark:bg-slate-900/70 dark:text-slate-200">
                      {item.badge}
                    </span>
                  </div>

                  <ul className="space-y-2 text-xs leading-5 text-slate-600 dark:text-slate-300">
                    {item.permissions.map((permission) => (
                      <li key={permission} className="flex items-start gap-2">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        <span>{permission}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="mt-5 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
              <CheckCircle2 className="h-4 w-4" />
              当前角色为 {permissionRole}，系统已按权限等级实施数据访问控制与安全隔离，保障科考原始数据安全。
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-5 shadow-sm dark:border-[#334155] dark:from-[#0f172a] dark:to-[#1e293b]">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                <BarChart3 className="h-4 w-4 text-amber-500" />
                数据输出模块
              </div>
              <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
                Output
              </span>
            </div>
            <p className="mb-5 text-sm leading-6 text-slate-600 dark:text-slate-300">
              对完成全流程处理、校验合格的数据提供多元化导出方案，支持可视化成果、标准化表格与专业科研报告一体化输出。
            </p>

            <div className="grid gap-4 xl:grid-cols-3">
              {outputModules.map((module) => (
                <div key={module.name} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-[#0f172a]">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{module.name}</p>
                    <span className="rounded-full bg-sky-100 px-2 py-1 text-[10px] font-semibold text-sky-700 dark:bg-sky-500/15 dark:text-sky-300">
                      {module.type}
                    </span>
                  </div>
                  <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                    {module.items.map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="mt-5 grid gap-4 rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/70 md:grid-cols-3">
              <div>
                <label className="mb-2 block text-xs font-medium uppercase tracking-[0.2em] text-slate-500">导出类型</label>
                <Select value={outputFormat} onValueChange={(v) => setOutputFormat(v as "图表" | "数据表" | "报告")}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="图表">图表</SelectItem>
                    <SelectItem value="数据表">数据表</SelectItem>
                    <SelectItem value="报告">报告</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="mb-2 block text-xs font-medium uppercase tracking-[0.2em] text-slate-500">模板</label>
                <Select value={outputTemplate} onValueChange={setOutputTemplate}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="标准海洋勘察模板">标准海洋勘察模板</SelectItem>
                    <SelectItem value="海域环境评估模板">海域环境评估模板</SelectItem>
                    <SelectItem value="航次综合分析模板">航次综合分析模板</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="mb-2 block text-xs font-medium uppercase tracking-[0.2em] text-slate-500">时间范围</label>
                <Select value={outputRange} onValueChange={setOutputRange}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2022-2024">2022-2024</SelectItem>
                    <SelectItem value="2023-2024">2023-2024</SelectItem>
                    <SelectItem value="本航次">本航次</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-[#0f172a]">
              <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">导出预览：{outputFormat}结果对比</p>
                  <p className="text-xs text-slate-500">{outputTemplate} · {outputRange}</p>
                </div>
                <Select value={outputMetric} onValueChange={(v) => setOutputMetric(v as "温度" | "盐度" | "密度")}>
                  <SelectTrigger className="h-9 w-[140px] text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="温度">温度</SelectItem>
                    <SelectItem value="盐度">盐度</SelectItem>
                    <SelectItem value="密度">密度</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="h-[260px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={exportPreviewData} margin={{ top: 10, right: 16, bottom: 10, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
                    <XAxis dataKey="depth" tick={{ fontSize: 11 }} label={{ value: "Depth (m)", position: "insideBottom", offset: -5 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="year2022" stroke="#94a3b8" strokeWidth={2} dot={{ r: 2 }} name="2022" />
                    <Line type="monotone" dataKey="year2023" stroke="#7c3aed" strokeWidth={2} dot={{ r: 2 }} name="2023" />
                    <Line type="monotone" dataKey="year2024" stroke="#0ea5e9" strokeWidth={2.5} dot={{ r: 2.5 }} name="2024" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-4">
              <Button onClick={() => setOutputFormat("图表")} className="h-10 rounded-lg bg-sky-500 text-sm font-semibold shadow-sm shadow-sky-500/20 hover:bg-sky-600">
                导出可视化成果
              </Button>
              <Button onClick={handleExportExcel} className="h-10 rounded-lg bg-violet-500 text-sm font-semibold shadow-sm shadow-violet-500/20 hover:bg-violet-600">
                导出 Excel
              </Button>
              <Button onClick={handleGenerateReport} className="h-10 rounded-lg bg-emerald-500 text-sm font-semibold shadow-sm shadow-emerald-500/20 hover:bg-emerald-600">
                生成报告预览
              </Button>
              <Button onClick={handleDownloadPdfReport} className="h-10 rounded-lg bg-amber-500 text-sm font-semibold shadow-sm shadow-amber-500/20 hover:bg-amber-600">
                下载 PDF
              </Button>
            </div>

            <div className="mt-5 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
              <CheckCircle2 className="h-4 w-4" />
              已完成数据导出方案配置，可按图表、表格、报告三类输出，满足科研交付与归档需求。
            </div>
          </div>
        </div>

        {/* Right: Activity Log */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-[#334155] dark:bg-[#1e293b]">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-[#334155]">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-slate-400" />
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                {t("analysis.activityLog")}
              </h3>
            </div>
            <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-slate-500 dark:bg-slate-800 dark:text-slate-300">
              Live
            </span>
          </div>
          <div className="max-h-[640px] overflow-y-auto p-4">
            {logs.length === 0 ? (
              <p className="text-center text-xs text-slate-400">No activity yet</p>
            ) : (
              <div className="relative space-y-4 before:absolute before:left-[14px] before:top-0 before:h-full before:w-px before:bg-slate-200 dark:before:bg-slate-700">
                {logs.map((log) => (
                  <div key={log.id} className="relative flex gap-3 pl-8">
                    <div className="absolute left-0 top-1.5 flex h-7 w-7 items-center justify-center rounded-full border border-sky-200 bg-sky-100 text-[10px] font-bold text-sky-600 shadow-sm dark:border-sky-500/40 dark:bg-sky-500/20 dark:text-sky-300">
                      {log.user.initials}
                    </div>
                    <div className="min-w-0 flex-1 rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-700 dark:bg-[#0f172a]">
                      <p className="text-xs font-medium text-slate-700 dark:text-slate-200">{log.user.name}</p>
                      <p className="mt-1 text-[11px] leading-5 text-slate-500 dark:text-slate-300">{log.detail}</p>
                      <p className="mt-1 text-[10px] text-slate-400">
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

      {reportPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="flex h-[82vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-700">
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">科研报告预览</p>
                <p className="text-xs text-slate-500">{compareSeaArea} · {compareCampaign} · {compareYear}</p>
              </div>
              <Button variant="outline" onClick={() => setReportPreview(null)} className="h-9 text-sm">
                关闭
              </Button>
            </div>
            <iframe title="report-preview" srcDoc={reportPreview} className="h-full w-full border-0" />
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
