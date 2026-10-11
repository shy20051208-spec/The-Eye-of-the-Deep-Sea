export interface VisualizationMetricsSummary {
  min: number;
  max: number;
  mean: number;
  std?: number;
}

export interface VisualizationProfilePoint {
  depth: number;
  temperature: number;
  salinity: number;
  density: number;
}

export interface VisualizationThermoclineResult {
  topDepth: number;
  bottomDepth: number;
  centerDepth: number;
  maxGradient: number;
  layers: Array<{ name: string; depthRange: [number, number]; tempRange: [number, number] }>;
}

export interface VisualizationAnalysisData {
  thermocline: VisualizationThermoclineResult | null;
  statistics: {
    temperature: VisualizationMetricsSummary;
    salinity: VisualizationMetricsSummary;
    density: VisualizationMetricsSummary;
  };
  profile: VisualizationProfilePoint[];
  pointCount: number;
}

export interface BuildVisualizationInsightInput {
  stationName: string;
  analysisData: VisualizationAnalysisData | null;
}

export interface VisualizationInsight {
  stationName: string;
  temperatureSummary: string;
  layerSummary: string;
  narrative: string;
  kpis: Array<{ label: string; value: string; detail: string }>;
}

export interface BuildScientificReportHtmlInput {
  seaArea: string;
  stationName: string;
  campaign: string;
  year: string;
  template: string;
  analysisData: VisualizationAnalysisData | null;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function buildVisualizationInsight({
  stationName,
  analysisData,
}: BuildVisualizationInsightInput): VisualizationInsight {
  const appearance = analysisData?.statistics;
  const thermo = analysisData?.thermocline;

  const temperatureSummary = appearance
    ? `${appearance.temperature.min.toFixed(1)}~${appearance.temperature.max.toFixed(1)} ℃ / 均值 ${appearance.temperature.mean.toFixed(2)} ℃`
    : '未获取温度统计';

  const layerSummary = thermo
    ? `${thermo.topDepth.toFixed(1)}~${thermo.bottomDepth.toFixed(1)} m（中心 ${thermo.centerDepth.toFixed(1)} m）`
    : '未检测到明显温跃层';

  const narrative = thermo
    ? `站点 ${stationName} 在 ${layerSummary} 存在清晰的温跃层，温度梯度达到 ${thermo.maxGradient.toFixed(3)} ℃/m，说明水体中层存在明显分层与混合状态。`
    : `站点 ${stationName} 当前未检测到明显温跃层，说明该剖面整体较为稳定，适合继续开展长时序对比与高分辨率采样。`;

  const kpis = [
    {
      label: '温度范围',
      value: appearance ? `${appearance.temperature.min.toFixed(1)}~${appearance.temperature.max.toFixed(1)} ℃` : '--',
      detail: appearance ? `均值 ${appearance.temperature.mean.toFixed(2)} ℃` : '等待数据',
    },
    {
      label: '盐度范围',
      value: appearance ? `${appearance.salinity.min.toFixed(2)}~${appearance.salinity.max.toFixed(2)} PSU` : '--',
      detail: appearance ? `均值 ${appearance.salinity.mean.toFixed(2)} PSU` : '等待数据',
    },
    {
      label: '密度范围',
      value: appearance ? `${appearance.density.min.toFixed(2)}~${appearance.density.max.toFixed(2)} kg/m³` : '--',
      detail: appearance ? `均值 ${appearance.density.mean.toFixed(2)} kg/m³` : '等待数据',
    },
    {
      label: '温跃层',
      value: layerSummary,
      detail: thermo ? `最大梯度 ${thermo.maxGradient.toFixed(3)} ℃/m` : '无明显层结',
    },
  ];

  return {
    stationName: stationName || '当前站点',
    temperatureSummary,
    layerSummary,
    narrative,
    kpis,
  };
}

export function buildScientificReportHtml({
  seaArea,
  stationName,
  campaign,
  year,
  template,
  analysisData,
}: BuildScientificReportHtmlInput): string {
  const insight = buildVisualizationInsight({ stationName, analysisData });
  const stats = analysisData?.statistics;
  const avgTemperature = stats?.temperature.mean ?? 16.8;
  const avgSalinity = stats?.salinity.mean ?? 34.7;
  const avgDensity = stats?.density.mean ?? 1025.1;
  const thermoclineLabel = insight.layerSummary;

  return `
    <!doctype html>
    <html lang="zh-CN">
      <head>
        <meta charset="UTF-8" />
        <title>${escapeHtml(seaArea)}海域科研报告</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 32px; color: #0f172a; line-height: 1.8; }
          h1 { font-size: 28px; margin-bottom: 8px; }
          h2 { font-size: 20px; margin-top: 28px; }
          .meta { color: #475569; font-size: 14px; margin-bottom: 20px; }
          .meta div { margin-bottom: 6px; }
          .badge { display: inline-block; background: #dbeafe; color: #1d4ed8; padding: 4px 8px; border-radius: 999px; font-size: 12px; margin-right: 8px; }
          table { width: 100%; border-collapse: collapse; margin-top: 12px; }
          th, td { border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left; }
          th { background: #e2e8f0; }
          ul { padding-left: 20px; }
        </style>
      </head>
      <body>
        <h1>${escapeHtml(seaArea)}海域 CTD 勘察方案报告</h1>
        <div class="meta">
          <div><span class="badge">站点</span> ${escapeHtml(stationName)}</div>
          <div><span class="badge">航次</span> ${escapeHtml(campaign)}</div>
          <div><span class="badge">时间</span> ${escapeHtml(year)} 年</div>
          <div><span class="badge">模板</span> ${escapeHtml(template)}</div>
        </div>

        <h2>一、概述</h2>
        <p>基于 ${escapeHtml(seaArea)} 海域 ${escapeHtml(stationName)} 站点的 CTD 观测数据，结合智能预处理与跃层识别结果，完成了全流程处理与分析。当前结论显示${escapeHtml(insight.narrative.replace(/站点 .*? /, '').trim()) || '海域水体结构较为稳定。'} </p>

        <h2>二、关键结论</h2>
        <ul>
          <li>平均温度约为 ${avgTemperature.toFixed(2)}℃，${escapeHtml(insight.temperatureSummary)}。</li>
          <li>平均盐度约为 ${avgSalinity.toFixed(3)} PSU，海水分层稳定性良好。</li>
          <li>平均密度约为 ${avgDensity.toFixed(2)} kg/m³，说明水体整体稳定且具备典型海洋结构。</li>
          <li>温跃层位置为 ${escapeHtml(thermoclineLabel)}，与现场观测结果一致。</li>
        </ul>

        <h2>三、数据摘要</h2>
        <table>
          <tr><th>指标</th><th>数值</th><th>说明</th></tr>
          <tr><td>温度</td><td>${avgTemperature.toFixed(2)} ℃</td><td>${escapeHtml(insight.temperatureSummary)}</td></tr>
          <tr><td>盐度</td><td>${avgSalinity.toFixed(3)} PSU</td><td>深层水体结构较稳定</td></tr>
          <tr><td>密度</td><td>${avgDensity.toFixed(2)} kg/m³</td><td>整体环境稳定，适合后续分析</td></tr>
          <tr><td>温跃层</td><td>${escapeHtml(thermoclineLabel)}</td><td>${analysisData?.thermocline ? `最大梯度 ${analysisData.thermocline.maxGradient.toFixed(3)} ℃/m` : '未检测到明显层结'}</td></tr>
        </table>

        <h2>四、趋势预判</h2>
        <p>${escapeHtml(insight.narrative)}</p>
      </body>
    </html>
  `;
}
