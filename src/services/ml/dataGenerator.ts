import type { TrainingRow } from '@/types';

// Deterministic PRNG (mulberry32) so the dataset is reproducible
function mulberry32(seed: number): () => number {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gaussian(rng: () => number, mean: number, std: number): number {
  const u1 = Math.max(rng(), 1e-10);
  const u2 = rng();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mean + z * std;
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

/**
 * Generates a realistic synthetic flood-risk training dataset.
 *
 * Target generation logic (flood_risk 0-3):
 *   - High water level + high rainfall + high rise rate + low capacity + low elevation + poor drainage → CRITICAL
 *   - Moderate combinations → HIGH / MEDIUM
 *   - Low values across the board → LOW
 *
 * This is SIMULATED TRAINING DATA, not real city data.
 * Replace generateDataset() with a CSV/API loader to use real data.
 */
export function generateDataset(numRows = 5000, seed = 42): TrainingRow[] {
  const rng = mulberry32(seed);
  const rows: TrainingRow[] = [];

  for (let i = 0; i < numRows; i++) {
    const rainfallIntensity = clamp(gaussian(rng, 55, 35), 0, 150);
    const cumulativeRainfall = clamp(gaussian(rng, 180, 120), 0, 600);
    const currentWaterLevel = clamp(gaussian(rng, 50, 25), 0, 100);
    const waterLevelRiseRate = clamp(gaussian(rng, 3.5, 2.5), 0, 10);
    const vaultCapacity = clamp(gaussian(rng, 50, 20), 10, 100); // total capacity percentage
    const availableCapacity = clamp(100 - currentWaterLevel + gaussian(rng, 0, 8), 0, 100);
    const elevation = clamp(gaussian(rng, 910, 40), 820, 1000);
    const drainageCapacity = clamp(gaussian(rng, 50, 25), 5, 95);
    const historicalFloodFrequency = clamp(gaussian(rng, 0.45, 0.25), 0, 1);
    const timeOfDay = Math.floor(rng() * 24);
    const previousWaterLevel = clamp(currentWaterLevel - waterLevelRiseRate * (1 + rng()), 0, 100);

    // --- Target generation logic ---
    // Weighted risk score from realistic relationships
    let riskScore = 0;
    riskScore += (currentWaterLevel / 100) * 35;
    riskScore += (rainfallIntensity / 150) * 20;
    riskScore += (waterLevelRiseRate / 10) * 15;
    riskScore += ((100 - availableCapacity) / 100) * 10;
    riskScore += ((900 - elevation) / 100) * 5; // lower elevation = higher risk
    riskScore += ((100 - drainageCapacity) / 100) * 8;
    riskScore += historicalFloodFrequency * 7;

    // Add noise to make it non-trivial (realistic data is never perfectly separable)
    riskScore += gaussian(rng, 0, 5);
    riskScore = clamp(riskScore, 0, 100);

    let floodRisk: number;
    if (riskScore >= 75) floodRisk = 3; // critical
    else if (riskScore >= 55) floodRisk = 2; // high
    else if (riskScore >= 35) floodRisk = 1; // medium
    else floodRisk = 0; // low

    rows.push({
      rainfall_intensity: Math.round(rainfallIntensity * 10) / 10,
      cumulative_rainfall: Math.round(cumulativeRainfall * 10) / 10,
      current_water_level: Math.round(currentWaterLevel * 10) / 10,
      water_level_rise_rate: Math.round(waterLevelRiseRate * 100) / 100,
      vault_capacity: Math.round(vaultCapacity * 10) / 10,
      available_capacity: Math.round(availableCapacity * 10) / 10,
      elevation: Math.round(elevation),
      drainage_capacity: Math.round(drainageCapacity * 10) / 10,
      historical_flood_frequency: Math.round(historicalFloodFrequency * 1000) / 1000,
      time_of_day: timeOfDay,
      previous_water_level: Math.round(previousWaterLevel * 10) / 10,
      flood_risk: floodRisk,
    });
  }

  return rows;
}

export const FEATURE_KEYS: (keyof Omit<TrainingRow, 'flood_risk'>)[] = [
  'rainfall_intensity',
  'cumulative_rainfall',
  'current_water_level',
  'water_level_rise_rate',
  'vault_capacity',
  'available_capacity',
  'elevation',
  'drainage_capacity',
  'historical_flood_frequency',
  'time_of_day',
  'previous_water_level',
];

export const FEATURE_LABELS: Record<string, string> = {
  rainfall_intensity: 'Rainfall Intensity',
  cumulative_rainfall: 'Cumulative Rainfall',
  current_water_level: 'Water Level',
  water_level_rise_rate: 'Rise Rate',
  vault_capacity: 'Vault Capacity',
  available_capacity: 'Available Capacity',
  elevation: 'Elevation',
  drainage_capacity: 'Drainage Capacity',
  historical_flood_frequency: 'Flood History',
  time_of_day: 'Time of Day',
  previous_water_level: 'Previous Water Level',
};
