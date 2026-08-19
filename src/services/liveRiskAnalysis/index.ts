import type { LiveWeatherData, LiveRiskAnalysis, LiveRiskFactor, RiskLevel, FloodZone } from '@/types';

export const RISK_THRESHOLDS = {
  low: 25,
  medium: 50,
  high: 75,
  critical: 100,
} as const;

export function riskLevelFromScore(score: number): RiskLevel {
  if (score > RISK_THRESHOLDS.high) return 'critical';
  if (score > RISK_THRESHOLDS.medium) return 'high';
  if (score > RISK_THRESHOLDS.low) return 'medium';
  return 'low';
}

interface RiskInputs {
  weather: LiveWeatherData;
  zoneWaterLevel: number;
  zoneDrainageCapacity: number;
  zoneHistoricalFloodFrequency: number;
  zoneRiseRate: number;
}

export function calculateLiveRisk(
  inputs: RiskInputs,
  previousScore: number,
  previousLevel: RiskLevel
): LiveRiskAnalysis {
  const { weather, zoneWaterLevel, zoneDrainageCapacity, zoneHistoricalFloodFrequency, zoneRiseRate } = inputs;

  const factors: LiveRiskFactor[] = [];

  // 1. Rainfall contribution (live) — 0-30 points
  const precip = weather.precipitation;
  const rainfallScore = Math.min(30, precip * 6);
  factors.push({
    label: 'Current Precipitation',
    value: `${precip.toFixed(1)} mm`,
    contribution: Math.round(rainfallScore),
    direction: rainfallScore > 10 ? 'up' : 'stable',
    source: 'live',
  });

  // 2. Forecast rainfall contribution (live) — 0-20 points
  const forecast = weather.forecastPrecipitation;
  const forecastScore = Math.min(20, forecast * 2);
  factors.push({
    label: 'Forecast Rainfall (3h)',
    value: `${forecast.toFixed(1)} mm`,
    contribution: Math.round(forecastScore),
    direction: forecastScore > 8 ? 'up' : 'stable',
    source: 'live',
  });

  // 3. Humidity contribution (live) — 0-10 points
  const humidityScore = Math.min(10, (weather.humidity - 50) * 0.2);
  factors.push({
    label: 'Humidity',
    value: `${weather.humidity}%`,
    contribution: Math.round(Math.max(0, humidityScore)),
    direction: weather.humidity > 80 ? 'up' : 'stable',
    source: 'live',
  });

  // 4. Water level contribution (simulated) — 0-20 points
  const waterLevelScore = Math.min(20, (zoneWaterLevel / 100) * 20);
  factors.push({
    label: 'Water Level',
    value: `${Math.round(zoneWaterLevel)}%`,
    contribution: Math.round(waterLevelScore),
    direction: zoneRiseRate > 1 ? 'up' : zoneRiseRate < -0.5 ? 'down' : 'stable',
    source: 'simulated',
  });

  // 5. Drainage capacity contribution (simulated) — 0-10 points (inverse)
  const drainageScore = Math.min(10, ((100 - zoneDrainageCapacity) / 100) * 10);
  factors.push({
    label: 'Drainage Capacity',
    value: `${Math.round(zoneDrainageCapacity)}%`,
    contribution: Math.round(drainageScore),
    direction: zoneDrainageCapacity < 40 ? 'up' : 'stable',
    source: 'simulated',
  });

  // 6. Historical flood frequency (simulated) — 0-10 points
  const historyScore = Math.min(10, zoneHistoricalFloodFrequency * 10);
  factors.push({
    label: 'Historical Flood Frequency',
    value: `${Math.round(zoneHistoricalFloodFrequency * 100)}%`,
    contribution: Math.round(historyScore),
    direction: 'stable',
    source: 'simulated',
  });

  const totalScore = Math.min(100, Math.max(0, Math.round(
    rainfallScore + forecastScore + Math.max(0, humidityScore) + waterLevelScore + drainageScore + historyScore
  )));

  const level = riskLevelFromScore(totalScore);
  const delta = totalScore - previousScore;
  const trend: LiveRiskAnalysis['trend'] = delta > 2 ? 'rising' : delta < -2 ? 'falling' : 'stable';

  const liveInputs = factors.filter((f) => f.source === 'live').map((f) => f.label);
  const simulatedInputs = factors.filter((f) => f.source === 'simulated').map((f) => f.label);

  return {
    score: totalScore,
    level,
    previousScore,
    previousLevel,
    trend,
    delta,
    factors,
    liveInputs,
    simulatedInputs,
    timestamp: new Date().toISOString(),
  };
}

export function getZoneForLocation(
  latitude: number,
  longitude: number,
  zones: FloodZone[]
): FloodZone | null {
  let closest: FloodZone | null = null;
  let minDist = Infinity;
  for (const zone of zones) {
    const dist = Math.abs(zone.latitude - latitude) + Math.abs(zone.longitude - longitude);
    if (dist < minDist) {
      minDist = dist;
      closest = zone;
    }
  }
  return closest;
}
