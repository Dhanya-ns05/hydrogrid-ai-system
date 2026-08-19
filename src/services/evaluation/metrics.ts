// Evaluation Metrics: AI model metrics, water management metrics,
// hotspot metrics, emergency route metrics, and comparison calculations.

import type {
  ModelMetrics,
  PerClassMetrics,
  ScenarioResult,
  ComparisonMetrics,
  ScenarioStats,
  SystemMode,
  RiskLevel,
} from '@/types';

const RISK_CLASS_NAMES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

export function computePerClassMetrics(
  confusionMatrix: number[][],
  numClasses = 4
): PerClassMetrics[] {
  const results: PerClassMetrics[] = [];

  for (let c = 0; c < numClasses; c++) {
    let tp = 0;
    let fp = 0;
    let fn = 0;
    let support = 0;

    for (let i = 0; i < numClasses; i++) {
      for (let j = 0; j < numClasses; j++) {
        if (i === c && j === c) tp = confusionMatrix[i][j];
        if (j === c && i !== c) fp += confusionMatrix[i][j];
        if (i === c && j !== c) fn += confusionMatrix[i][j];
        if (i === c) support += confusionMatrix[i][j];
      }
    }

    const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
    const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
    const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;

    results.push({
      className: RISK_CLASS_NAMES[c],
      precision: Math.round(precision * 1000) / 1000,
      recall: Math.round(recall * 1000) / 1000,
      f1: Math.round(f1 * 1000) / 1000,
      support,
    });
  }

  return results;
}

export function formatConfusionMatrix(cm: number[][]): { actual: string; predicted: string[]; values: number[] }[] {
  return cm.map((row, i) => ({
    actual: RISK_CLASS_NAMES[i],
    predicted: RISK_CLASS_NAMES,
    values: row,
  }));
}

function mean(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

function median(arr: number[]): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function stdDev(arr: number[]): number {
  if (arr.length < 2) return 0;
  const m = mean(arr);
  const variance = arr.reduce((s, v) => s + (v - m) ** 2, 0) / arr.length;
  return Math.sqrt(variance);
}

export function computeComparisonMetrics(
  baseline: ScenarioResult[],
  hydrogrid: ScenarioResult[]
): ComparisonMetrics[] {
  const getVal = (results: ScenarioResult[], key: keyof ScenarioResult): number => {
    return mean(results.map((r) => r[key] as number));
  };

  const improvement = (base: number, hydro: number, higherIsBetter: boolean): number | null => {
    if (base === 0) return null;
    const pct = ((base - hydro) / base) * 100;
    return Math.round(pct * 10) / 10;
  };

  const metrics: ComparisonMetrics[] = [
    {
      metric: 'Peak Water Level',
      baseline: Math.round(getVal(baseline, 'peakWaterLevel') * 10) / 10,
      hydrogrid: Math.round(getVal(hydrogrid, 'peakWaterLevel') * 10) / 10,
      improvement: improvement(getVal(baseline, 'peakWaterLevel'), getVal(hydrogrid, 'peakWaterLevel'), false),
      higherIsBetter: false,
      unit: '%',
    },
    {
      metric: 'Average Water Level',
      baseline: Math.round(getVal(baseline, 'averageWaterLevel') * 10) / 10,
      hydrogrid: Math.round(getVal(hydrogrid, 'averageWaterLevel') * 10) / 10,
      improvement: improvement(getVal(baseline, 'averageWaterLevel'), getVal(hydrogrid, 'averageWaterLevel'), false),
      higherIsBetter: false,
      unit: '%',
    },
    {
      metric: 'Overflow Events',
      baseline: Math.round(getVal(baseline, 'overflowEvents') * 10) / 10,
      hydrogrid: Math.round(getVal(hydrogrid, 'overflowEvents') * 10) / 10,
      improvement: improvement(getVal(baseline, 'overflowEvents'), getVal(hydrogrid, 'overflowEvents'), false),
      higherIsBetter: false,
      unit: '',
    },
    {
      metric: 'Critical Vaults',
      baseline: Math.round(getVal(baseline, 'criticalVaults') * 10) / 10,
      hydrogrid: Math.round(getVal(hydrogrid, 'criticalVaults') * 10) / 10,
      improvement: improvement(getVal(baseline, 'criticalVaults'), getVal(hydrogrid, 'criticalVaults'), false),
      higherIsBetter: false,
      unit: '',
    },
    {
      metric: 'Flood Hotspots',
      baseline: Math.round(getVal(baseline, 'floodHotspots') * 10) / 10,
      hydrogrid: Math.round(getVal(hydrogrid, 'floodHotspots') * 10) / 10,
      improvement: improvement(getVal(baseline, 'floodHotspots'), getVal(hydrogrid, 'floodHotspots'), false),
      higherIsBetter: false,
      unit: '',
    },
    {
      metric: 'Blocked Roads',
      baseline: Math.round(getVal(baseline, 'blockedRoads') * 10) / 10,
      hydrogrid: Math.round(getVal(hydrogrid, 'blockedRoads') * 10) / 10,
      improvement: improvement(getVal(baseline, 'blockedRoads'), getVal(hydrogrid, 'blockedRoads'), false),
      higherIsBetter: false,
      unit: '',
    },
    {
      metric: 'Water Diverted',
      baseline: Math.round(getVal(baseline, 'waterDiverted')),
      hydrogrid: Math.round(getVal(hydrogrid, 'waterDiverted')),
      improvement: improvement(getVal(baseline, 'waterDiverted'), getVal(hydrogrid, 'waterDiverted'), true),
      higherIsBetter: true,
      unit: 'L',
    },
    {
      metric: 'Successful Diversions',
      baseline: Math.round(getVal(baseline, 'successfulDiversions') * 10) / 10,
      hydrogrid: Math.round(getVal(hydrogrid, 'successfulDiversions') * 10) / 10,
      improvement: improvement(getVal(baseline, 'successfulDiversions'), getVal(hydrogrid, 'successfulDiversions'), true),
      higherIsBetter: true,
      unit: '',
    },
    {
      metric: 'Failed Diversions',
      baseline: Math.round(getVal(baseline, 'failedDiversions') * 10) / 10,
      hydrogrid: Math.round(getVal(hydrogrid, 'failedDiversions') * 10) / 10,
      improvement: improvement(getVal(baseline, 'failedDiversions'), getVal(hydrogrid, 'failedDiversions'), false),
      higherIsBetter: false,
      unit: '',
    },
    {
      metric: 'Time Above Critical',
      baseline: Math.round(getVal(baseline, 'timeAboveCritical') * 10) / 10,
      hydrogrid: Math.round(getVal(hydrogrid, 'timeAboveCritical') * 10) / 10,
      improvement: improvement(getVal(baseline, 'timeAboveCritical'), getVal(hydrogrid, 'timeAboveCritical'), false),
      higherIsBetter: false,
      unit: 'ticks',
    },
    {
      metric: 'Route Flood Exposure',
      baseline: Math.round(getVal(baseline, 'routeFloodExposure') * 10) / 10,
      hydrogrid: Math.round(getVal(hydrogrid, 'routeFloodExposure') * 10) / 10,
      improvement: improvement(getVal(baseline, 'routeFloodExposure'), getVal(hydrogrid, 'routeFloodExposure'), false),
      higherIsBetter: false,
      unit: '/100',
    },
    {
      metric: 'Emergency Delay',
      baseline: Math.round(getVal(baseline, 'emergencyDelay') * 10) / 10,
      hydrogrid: Math.round(getVal(hydrogrid, 'emergencyDelay') * 10) / 10,
      improvement: improvement(getVal(baseline, 'emergencyDelay'), getVal(hydrogrid, 'emergencyDelay'), false),
      higherIsBetter: false,
      unit: 'min',
    },
    {
      metric: 'Route Travel Time',
      baseline: Math.round(getVal(baseline, 'routeTravelTime') * 10) / 10,
      hydrogrid: Math.round(getVal(hydrogrid, 'routeTravelTime') * 10) / 10,
      improvement: improvement(getVal(baseline, 'routeTravelTime'), getVal(hydrogrid, 'routeTravelTime'), false),
      higherIsBetter: false,
      unit: 'min',
    },
  ];

  return metrics;
}

export function computeScenarioStats(
  results: ScenarioResult[],
  mode: SystemMode
): ScenarioStats[] {
  const metrics: { key: keyof ScenarioResult; label: string; unit: string }[] = [
    { key: 'peakWaterLevel', label: 'Peak Water Level', unit: '%' },
    { key: 'averageWaterLevel', label: 'Average Water Level', unit: '%' },
    { key: 'overflowEvents', label: 'Overflow Events', unit: '' },
    { key: 'criticalVaults', label: 'Critical Vaults', unit: '' },
    { key: 'floodHotspots', label: 'Flood Hotspots', unit: '' },
    { key: 'waterDiverted', label: 'Water Diverted', unit: 'L' },
    { key: 'successfulDiversions', label: 'Successful Diversions', unit: '' },
    { key: 'blockedRoads', label: 'Blocked Roads', unit: '' },
    { key: 'routeFloodExposure', label: 'Route Flood Exposure', unit: '/100' },
    { key: 'emergencyDelay', label: 'Emergency Delay', unit: 'min' },
  ];

  return metrics.map((m) => {
    const values = results.map((r) => r[m.key] as number);
    return {
      metric: `${m.label} (${mode})`,
      mean: Math.round(mean(values) * 10) / 10,
      median: Math.round(median(values) * 10) / 10,
      min: Math.round(Math.min(...values) * 10) / 10,
      max: Math.round(Math.max(...values) * 10) / 10,
      stdDev: Math.round(stdDev(values) * 10) / 10,
      unit: m.unit,
    };
  });
}
