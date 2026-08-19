// Prediction Service: converts live vault/zone state into ML feature vectors
// and runs predictions. This is the bridge between the simulation state and the ML model.

import type {
  Vault,
  FloodZone,
  FeatureVector,
  PredictionResult,
  RiskLevel,
  TrendDirection,
  PredictionHorizon,
} from '@/types';
import { predictFromFeatures } from './trainingPipeline';
import type { RandomForestModel } from './randomForest';

const RISK_LABELS: RiskLevel[] = ['low', 'medium', 'high', 'critical'];

export function vaultToFeatureVector(vault: Vault, timeOfDay: number): FeatureVector {
  return {
    rainfall_intensity: vault.cumulativeRainfall / 4, // approximate current intensity from cumulative
    cumulative_rainfall: vault.cumulativeRainfall,
    current_water_level: vault.currentLevel,
    water_level_rise_rate: (100 - vault.currentLevel) > 0 ? 3.5 : 0, // estimated from trend
    vault_capacity: vault.capacity / 1000, // normalize
    available_capacity: vault.availableCapacity,
    elevation: vault.elevation,
    drainage_capacity: vault.drainageCapacity,
    historical_flood_frequency: vault.historicalFloodFrequency,
    time_of_day: timeOfDay,
    previous_water_level: vault.previousWaterLevel,
  };
}

export function zoneToFeatureVector(zone: FloodZone, timeOfDay: number): FeatureVector {
  return {
    rainfall_intensity: zone.rainfall,
    cumulative_rainfall: zone.cumulativeRainfall,
    current_water_level: zone.waterLevel,
    water_level_rise_rate: zone.riseRate,
    vault_capacity: 50, // zones don't have vaults; use average
    available_capacity: 100 - zone.waterLevel,
    elevation: zone.elevation,
    drainage_capacity: zone.drainageCapacity,
    historical_flood_frequency: zone.historicalFloodFrequency,
    time_of_day: timeOfDay,
    previous_water_level: zone.previousWaterLevel,
  };
}

function predictionText(probability: number, riskLevel: RiskLevel): string {
  if (riskLevel === 'critical') {
    return 'High probability of reaching critical water level. Immediate action required.';
  }
  if (riskLevel === 'high') {
    return 'Elevated flood risk detected. Diversion and monitoring recommended.';
  }
  if (riskLevel === 'medium') {
    return 'Moderate flood risk. Continue monitoring conditions.';
  }
  return 'Low flood risk. Conditions are within safe parameters.';
}

function trendFromProbability(prob: number, prevProb: number | null): TrendDirection {
  if (prevProb === null) return 'stable';
  const diff = prob - prevProb;
  if (diff > 2) return 'up';
  if (diff < -2) return 'down';
  return 'stable';
}

export function predictVault(
  model: RandomForestModel,
  vault: Vault,
  horizon: PredictionHorizon,
  timeOfDay: number,
  prevProb: number | null
): PredictionResult {
  const fv = vaultToFeatureVector(vault, timeOfDay);
  const features = Object.values(fv);
  const { label, probability, probabilities } = predictFromFeatures(model, features);

  // Convert probability (0-1) to 0-100 scale
  const floodProbability = Math.round(probability * 100);
  const riskLevel = RISK_LABELS[label];

  // Project future probability using rise rate and horizon
  const risePerMin = fv.water_level_rise_rate;
  const futureWaterLevel = Math.min(100, fv.current_water_level + risePerMin * horizon);
  const futureAvailable = Math.max(0, 100 - futureWaterLevel);

  // Re-predict with projected water level
  const futureFv = { ...fv, current_water_level: futureWaterLevel, available_capacity: futureAvailable };
  const futureResult = predictFromFeatures(model, Object.values(futureFv));
  const futureProbability = Math.round(futureResult.probability * 100);

  const trend = trendFromProbability(floodProbability, prevProb);

  return {
    id: vault.id,
    name: vault.id,
    floodProbability,
    riskLevel,
    trend,
    predictionText: predictionText(floodProbability, riskLevel),
    featureVector: fv,
    horizon,
    futureProbability,
  };
}

export function predictZone(
  model: RandomForestModel,
  zone: FloodZone,
  horizon: PredictionHorizon,
  timeOfDay: number,
  prevProb: number | null
): PredictionResult {
  const fv = zoneToFeatureVector(zone, timeOfDay);
  const features = Object.values(fv);
  const { label, probability } = predictFromFeatures(model, features);

  const floodProbability = Math.round(probability * 100);
  const riskLevel = RISK_LABELS[label];

  // Project future probability
  const futureWaterLevel = Math.min(100, fv.current_water_level + fv.water_level_rise_rate * horizon);
  const futureAvailable = Math.max(0, 100 - futureWaterLevel);
  const futureFv = { ...fv, current_water_level: futureWaterLevel, available_capacity: futureAvailable };
  const futureResult = predictFromFeatures(model, Object.values(futureFv));
  const futureProbability = Math.round(futureResult.probability * 100);

  const trend = trendFromProbability(floodProbability, prevProb);

  return {
    id: zone.id,
    name: zone.name,
    floodProbability,
    riskLevel,
    trend,
    predictionText: predictionText(floodProbability, riskLevel),
    featureVector: fv,
    horizon,
    futureProbability,
  };
}

// Baseline model: simple threshold rule (water level > 80% → HIGH, > 90% → CRITICAL)
export function baselinePredict(waterLevel: number): { label: number; probability: number } {
  if (waterLevel >= 90) return { label: 3, probability: 0.95 };
  if (waterLevel >= 80) return { label: 2, probability: 0.80 };
  if (waterLevel >= 50) return { label: 1, probability: 0.55 };
  return { label: 0, probability: 0.20 };
}
