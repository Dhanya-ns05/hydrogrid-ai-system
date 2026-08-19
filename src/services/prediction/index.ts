import type {
  RiskPrediction,
  PredictionWindow,
  FloodZone,
  RiskLevel,
} from '@/types';

function riskLevelFromScore(score: number): RiskLevel {
  if (score >= 85) return 'critical';
  if (score >= 60) return 'high';
  if (score >= 35) return 'medium';
  return 'low';
}

function projectRisk(
  zone: FloodZone,
  window: PredictionWindow
): { predictedScore: number; basis: string[] } {
  const windowFactor = window === 15 ? 1 : window === 30 ? 2 : 4;

  const trendComponent = zone.riseRate * windowFactor * 0.8;
  const rainfallComponent = (zone.rainfall / 100) * windowFactor * 0.5;
  const historyComponent = zone.historicalFloodFrequency * windowFactor * 2;
  const drainageDampening = (zone.drainageCapacity / 100) * windowFactor * 0.3;

  const projected = Math.min(
    100,
    Math.max(0, zone.riskScore + trendComponent + rainfallComponent + historyComponent - drainageDampening)
  );

  const basis: string[] = [];
  if (zone.trend === 'up') basis.push('Rising water-level trend');
  if (zone.rainfall > 60) basis.push(`High rainfall (${Math.round(zone.rainfall)} mm/hr)`);
  if (zone.historicalFloodFrequency > 0.5) basis.push('Historical flood pattern match');
  if (zone.drainageCapacity < 40) basis.push('Low drainage capacity');
  if (zone.riseRate > 3) basis.push(`Rapid rise rate (${zone.riseRate.toFixed(1)}%/min)`);
  if (basis.length === 0) basis.push('Current risk score projection');

  return { predictedScore: projected, basis };
}

export function predictZoneRisk(
  zone: FloodZone,
  window: PredictionWindow
): RiskPrediction {
  const { predictedScore, basis } = projectRisk(zone, window);
  const predictedRisk = riskLevelFromScore(predictedScore);

  const delta = Math.abs(predictedScore - zone.riskScore);
  const confidence = Math.max(50, Math.min(95, 95 - delta * 0.4 - (window === 60 ? 10 : window === 30 ? 5 : 0)));

  return {
    zoneId: zone.id,
    zoneName: zone.name,
    currentRisk: zone.riskLevel,
    currentRiskScore: zone.riskScore,
    predictedRisk,
    predictedRiskScore: predictedScore,
    window,
    confidence: Math.round(confidence),
    basis,
    timestamp: new Date().toISOString(),
  };
}

export function predictAllZones(
  zones: FloodZone[],
  window: PredictionWindow
): RiskPrediction[] {
  return zones.map((z) => predictZoneRisk(z, window));
}

export function shouldTriggerEmergency(prediction: RiskPrediction): boolean {
  return prediction.predictedRisk === 'critical' || prediction.predictedRisk === 'high';
}

export function getPredictionMethodology(): string {
  return 'Weighted trend analysis: rainfall intensity + water-level rise rate + historical flood frequency + drainage capacity. Not a trained ML model.';
}
