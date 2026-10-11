import test from 'node:test';
import assert from 'node:assert/strict';
import { buildVisualizationInsight, buildScientificReportHtml } from './visualization';

test('buildVisualizationInsight composes a usable scientific narrative', () => {
  const insight = buildVisualizationInsight({
    stationName: 'ST-003',
    analysisData: {
      thermocline: {
        topDepth: 12,
        bottomDepth: 32,
        centerDepth: 22,
        maxGradient: 0.41,
        layers: [],
      },
      statistics: {
        temperature: { min: 6.2, max: 24.8, mean: 16.4, std: 3.1 },
        salinity: { min: 33.1, max: 35.8, mean: 34.7 },
        density: { min: 1022.8, max: 1028.3, mean: 1025.4 },
      },
      profile: [
        { depth: 0, temperature: 24.8, salinity: 34.1, density: 1023.3 },
        { depth: 20, temperature: 16.4, salinity: 34.7, density: 1025.4 },
        { depth: 40, temperature: 6.2, salinity: 35.8, density: 1028.3 },
      ],
      pointCount: 3,
    },
  });

  assert.equal(insight.stationName, 'ST-003');
  assert.match(insight.temperatureSummary, /24\.8/);
  assert.match(insight.layerSummary, /12\.0~32\.0 m/);
  assert.match(insight.narrative, /温跃层/);
  assert.equal(insight.kpis.length, 4);
});

test('buildScientificReportHtml uses live analysis values in the report preview', () => {
  const reportHtml = buildScientificReportHtml({
    seaArea: '南海北部',
    stationName: 'ST-003',
    campaign: '航次-A',
    year: '2024',
    template: '标准海洋勘察模板',
    analysisData: {
      thermocline: {
        topDepth: 12,
        bottomDepth: 32,
        centerDepth: 22,
        maxGradient: 0.41,
        layers: [],
      },
      statistics: {
        temperature: { min: 6.2, max: 24.8, mean: 16.4, std: 3.1 },
        salinity: { min: 33.1, max: 35.8, mean: 34.7 },
        density: { min: 1022.8, max: 1028.3, mean: 1025.4 },
      },
      profile: [
        { depth: 0, temperature: 24.8, salinity: 34.1, density: 1023.3 },
        { depth: 20, temperature: 16.4, salinity: 34.7, density: 1025.4 },
        { depth: 40, temperature: 6.2, salinity: 35.8, density: 1028.3 },
      ],
      pointCount: 3,
    },
  });

  assert.match(reportHtml, /ST-003/);
  assert.match(reportHtml, /16\.40 ℃/);
  assert.match(reportHtml, /12\.0~32\.0 m/);
  assert.match(reportHtml, /温跃层/);
});
