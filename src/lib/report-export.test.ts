import test from 'node:test';
import assert from 'node:assert/strict';
import { buildExportSummary } from './report-export';

test('buildExportSummary composes a scientific report summary from analysis data', () => {
  const summary = buildExportSummary({
    stationName: 'ST-001',
    template: 'standard',
    analysisData: {
      thermocline: {
        topDepth: 5,
        bottomDepth: 20,
        centerDepth: 12.5,
        maxGradient: 0.42,
        layers: [],
      },
      statistics: {
        temperature: { min: 10, max: 22, mean: 16 },
        salinity: { min: 32.1, max: 35.4, mean: 33.7 },
        density: { min: 1020.8, max: 1027.2, mean: 1024.1 },
      },
      profile: [
        { depth: 0, temperature: 20, salinity: 34.1, density: 1024.1 },
        { depth: 10, temperature: 16, salinity: 33.2, density: 1024.6 },
        { depth: 20, temperature: 10, salinity: 32.1, density: 1027.2 },
      ],
      pointCount: 3,
    },
    institution: '深海观测中心',
    dateRange: '2025-01-01 ~ 2025-12-31',
    author: '周航',
  });

  assert.equal(summary.stationLabel, 'ST-001');
  assert.equal(summary.totalPoints, 3);
  assert.match(summary.thermoclineText, /5\.0~20\.0 m/);
  assert.equal(summary.temperatureSummary, '10.0~22.0℃ / 均值 16.00℃');
  assert.equal(summary.salinitySummary, '32.10~35.40 PSU / 均值 33.70 PSU');
  assert.equal(summary.densitySummary, '1020.80~1027.20 kg/m³ / 均值 1024.10 kg/m³');
  assert.equal(summary.metricsRows[0].label, '温度');
});

test('buildExportSummary falls back cleanly when no thermocline is detected', () => {
  const summary = buildExportSummary({
    stationName: 'ST-005',
    template: 'summary',
    analysisData: null,
    institution: '黄海前沿站',
    dateRange: '2025Q4',
    author: '张帆',
  });

  assert.equal(summary.stationLabel, 'ST-005');
  assert.equal(summary.thermoclineText, '未检测到明显温跃层');
  assert.equal(summary.totalPoints, 0);
  assert.equal(summary.metricsRows.length, 3);
});
