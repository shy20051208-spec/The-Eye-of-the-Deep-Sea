export interface ExportMetricsSummary {
  min: number;
  max: number;
  mean: number;
}

export interface ExportProfilePoint {
  depth: number;
  temperature: number;
  salinity: number;
  density: number;
}

export interface ExportThermoclineResult {
  topDepth: number;
  bottomDepth: number;
  centerDepth: number;
  maxGradient: number;
  layers: Array<{ name: string; depthRange: [number, number]; tempRange: [number, number] }>;
}

export interface ExportAnalysisData {
  thermocline: ExportThermoclineResult | null;
  statistics: {
    temperature: ExportMetricsSummary;
    salinity: ExportMetricsSummary;
    density: ExportMetricsSummary;
  };
  profile: ExportProfilePoint[];
  pointCount: number;
}

export interface BuildExportSummaryInput {
  stationName: string;
  template: string;
  analysisData: ExportAnalysisData | null;
  institution?: string;
  dateRange?: string;
  author?: string;
}

export interface ExportSummaryRow {
  label: string;
  value: string;
  note: string;
}

export interface ExportSummary {
  stationLabel: string;
  templateLabel: string;
  institutionLabel: string;
  totalPoints: number;
  thermoclineText: string;
  temperatureSummary: string;
  salinitySummary: string;
  densitySummary: string;
  metricsRows: ExportSummaryRow[];
  metaText: string;
}

const formatRange = (min: number, max: number, unit: string, decimals: number) => {
  const formatter = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    useGrouping: false,
  });

  return `${formatter.format(min)}~${formatter.format(max)}${unit}`;
};

export function buildExportSummary({
  stationName,
  template,
  analysisData,
  institution = '深海观测中心',
  dateRange = '未指定日期范围',
  author = '未知作者',
}: BuildExportSummaryInput): ExportSummary {
  const stat = analysisData?.statistics;
  const thermo = analysisData?.thermocline;

  const temperatureSummary = stat
    ? `${formatRange(stat.temperature.min, stat.temperature.max, '℃', 1)} / 均值 ${stat.temperature.mean.toFixed(2)}℃`
    : '--';

  const salinitySummary = stat
    ? `${formatRange(stat.salinity.min, stat.salinity.max, ' PSU', 2)} / 均值 ${stat.salinity.mean.toFixed(2)} PSU`
    : '--';

  const densitySummary = stat
    ? `${formatRange(stat.density.min, stat.density.max, ' kg/m³', 2)} / 均值 ${stat.density.mean.toFixed(2)} kg/m³`
    : '--';

  const thermoclineText = thermo
    ? `${thermo.topDepth.toFixed(1)}~${thermo.bottomDepth.toFixed(1)} m（中心 ${thermo.centerDepth.toFixed(1)} m）`
    : '未检测到明显温跃层';

  const metricsRows: ExportSummaryRow[] = [
    { label: '温度', value: stat ? `${stat.temperature.mean.toFixed(2)}℃` : '--', note: '平均温度' },
    { label: '盐度', value: stat ? `${stat.salinity.mean.toFixed(2)} PSU` : '--', note: '平均盐度' },
    { label: '密度', value: stat ? `${stat.density.mean.toFixed(2)} kg/m³` : '--', note: '平均密度' },
  ];

  return {
    stationLabel: stationName || 'ST-001',
    templateLabel: template === 'summary' ? '航次总结模板' : '标准海洋勘察模板',
    institutionLabel: institution,
    totalPoints: analysisData?.pointCount ?? 0,
    thermoclineText,
    temperatureSummary,
    salinitySummary,
    densitySummary,
    metricsRows,
    metaText: `模板：${template === 'summary' ? '航次总结模板' : '标准海洋勘察模板'} | 测站：${stationName || 'ST-001'} | 日期范围：${dateRange} | 作者：${author} | 机构：${institution}`,
  };
}
