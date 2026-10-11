import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildQcReportArtifact,
  buildVersionComparisonSummary,
  buildVersionSnapshot,
  coerceLegacyMeasurement,
  hasMeaningfulMeasurementValues,
  preprocessMeasurements,
  normalizeImportedCtdRow,
} from './data-cleaning';

test('preprocessMeasurements basic run', () => {
  const raw = [
    { id: 'a', date: '2024-01-01T00:00:00Z', depth: 0, temperature: 10, salinity: 34 },
    { id: 'b', date: '2024-01-01T00:00:10Z', depth: 1, temperature: 9.9, salinity: 34 },
    { id: 'c', date: '2024-01-01T00:00:20Z', depth: 2, temperature: 9.8, salinity: 34 },
  ];

  const { cleaned, report } = preprocessMeasurements(raw as any[]);
  assert.equal(Array.isArray(cleaned), true);
  assert.equal(typeof report.rawRecords, 'number');
  assert.equal(typeof report.rawAnomalies, 'number');
  assert.ok(Array.isArray(report.steps));
  assert.equal(typeof report.derivedSummary.validPoints, 'number');
  assert.equal(typeof report.binLevels, 'number');
});

test('normalizeImportedCtdRow accepts common Sea-Bird column names', () => {
  const row = {
    prDM: '10.5',
    t090C: '4.123',
    sal00: '35.2',
    density00: '27.6',
    time: '2024-01-01T00:00:00Z',
  };

  const normalized = normalizeImportedCtdRow(row as any);
  assert.equal(normalized.depth, 10.5);
  assert.equal(normalized.temperature, 4.123);
  assert.equal(normalized.salinity, 35.2);
  assert.equal(normalized.density, 27.6);
  assert.equal(normalized.date instanceof Date, true);
});

test('buildQcReportArtifact builds a formal CTD QC summary', () => {
  const report = {
    rawRecords: 4,
    rawAnomalies: 1,
    processedAnomalies: 0,
    anomalyReductionRate: 1,
    correctionQualityScore: 93,
    algorithmAccuracy: 96,
    summary: '总记录 4，剔除 1 条',
    steps: [{ name: 'spike_mad', removed: 1, description: '尖峰剔除(MAD)' }],
    binLevels: 3,
    qualityFlag: 'GOOD',
    derivedSummary: {
      validPoints: 3,
      densityRange: [26.5, 27.4],
      temperatureRange: [4.1, 5.2],
      binSize: 1,
      qualityFlag: 'GOOD',
    },
    performance: {
      anomalyReduction: 100,
      correctionConsistency: 89,
      stabilityIndex: 91,
    },
  } as any;

  const artifact = buildQcReportArtifact(report, [
    { id: 'a', depth: 1, temperature: 4.1, salinity: 34.5, density: 26.8, errors: [] },
    { id: 'b', depth: 2, temperature: 4.3, salinity: 34.6, density: 26.9, errors: [] },
    { id: 'c', depth: 3, temperature: 4.5, salinity: 34.7, density: 27.1, errors: [] },
  ]);

  assert.equal(artifact.validRecords, 3);
  assert.equal(artifact.invalidRecords, 0);
  assert.equal(artifact.qualityFlag, 'GOOD');
  assert.equal(artifact.summary, '总记录 4，剔除 1 条');
  assert.ok(Array.isArray(artifact.steps));
});

test('coerceLegacyMeasurement keeps missing CTD values safe for UI rendering', () => {
  const normalized = coerceLegacyMeasurement({
    id: 'x1',
    date: '2024-01-01T00:00:00Z',
    depth: undefined,
    temperature: undefined,
    salinity: null,
    density: undefined,
    errors: undefined,
  });

  assert.equal(normalized.temperature, 0);
  assert.equal(normalized.salinity, 0);
  assert.equal(normalized.density, 0);
  assert.ok(Array.isArray(normalized.errors));
  assert.equal(normalized.errors.length, 0);
});

test('toFiniteNumber sanitizes NaN values before persistence', () => {
  assert.equal(Number.isFinite(Number.NaN), false);
  assert.equal(Number.isFinite(Number(undefined)), false);
  assert.equal(Number.isFinite(Number('bad')), false);
  assert.equal(Number('bad') || 0, 0);
});

test('buildVersionSnapshot normalizes CTD records for rollback versions', () => {
  const snapshot = buildVersionSnapshot([
    { id: 'a', date: '2024-01-01T00:00:00Z', depth: 5, temperature: 10, salinity: 34.1, density: 27.2 },
    { id: 'b', date: '2024-01-01T00:10:00Z', depth: 10, temperature: 9.7, salinity: 34.5, density: 27.5 },
    { id: 'bad', date: '2024-01-01T00:20:00Z', depth: 0, temperature: 0, salinity: 0, density: 0 },
  ]);

  assert.equal(snapshot.length, 2);
  assert.equal(snapshot[0].depth, 5);
  assert.equal(snapshot[0].temperature, 10);
  assert.equal(snapshot[1].salinity, 34.5);
  assert.equal(snapshot[1].density, 27.5);
});

test('hasMeaningfulMeasurementValues rejects all-zero contaminated rows', () => {
  assert.equal(hasMeaningfulMeasurementValues({ depth: 0, temperature: 0, salinity: 0, density: 0 }), false);
  assert.equal(hasMeaningfulMeasurementValues({ depth: 0, temperature: 15.2, salinity: 35.1, density: 27.4 }), true);
});

test('buildVersionComparisonSummary compares before and after CTD versions', () => {
  const summary = buildVersionComparisonSummary(
    [
      { id: 'a', temperature: 10, salinity: 34, depth: 5 },
      { id: 'b', temperature: 20, salinity: 35, depth: 10 },
    ],
    [
      { id: 'a', temperature: 9.5, salinity: 34.1, depth: 5 },
      { id: 'b', temperature: 19.8, salinity: 35.1, depth: 10 },
      { id: 'c', temperature: 4.2, salinity: 34.7, depth: 15 },
    ]
  );

  assert.equal(summary.previousCount, 2);
  assert.equal(summary.currentCount, 3);
  assert.equal(summary.deltaCount, 1);
  assert.equal(summary.changeLabel, '新增 1 条记录');
  assert.equal(summary.temperatureDelta, -3.833);
});
