// Intelligent Stormwater Routing Engine
// Capacity-aware routing that evaluates multiple factors to find the safest
// destination for excess water from a critical vault.
//
// Architecture is structured for future multi-hop graph-based routing.
// Currently implements direct-neighbor routing only.

import type {
  Vault,
  RoutingWeights,
  DestinationCandidate,
  RoutingRecommendation,
  RiskLevel,
  PredictionResult,
} from '@/types';

export const DEFAULT_ROUTING_WEIGHTS: RoutingWeights = {
  availableCapacity: 0.40,
  floodRisk: 0.25,
  predictedRisk: 0.20,
  distance: 0.10,
  networkSuitability: 0.05,
};

export const MIN_SAFE_CAPACITY = 15; // minimum available capacity to be a valid destination

function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function riskToScore(risk: RiskLevel): number {
  switch (risk) {
    case 'critical':
      return 100;
    case 'high':
      return 75;
    case 'medium':
      return 50;
    case 'low':
      return 15;
  }
}

function normalize(value: number, min: number, max: number): number {
  if (max === min) return 50;
  return ((value - min) / (max - min)) * 100;
}

/**
 * Finds vaults that are at HIGH or CRITICAL risk level.
 */
export function findCriticalVaults(vaults: Vault[]): Vault[] {
  return vaults.filter(
    (v) => v.riskLevel === 'critical' || v.riskLevel === 'high'
  );
}

/**
 * Finds connected vaults that could serve as diversion destinations.
 * Filters out critical/unavailable destinations.
 */
export function findAvailableDestinations(
  sourceVault: Vault,
  allVaults: Vault[]
): Vault[] {
  return allVaults.filter((v) => {
    if (!sourceVault.connectedVaults.includes(v.id)) return false;
    if (v.riskLevel === 'critical') return false;
    if (v.availableCapacity < MIN_SAFE_CAPACITY) return false;
    return true;
  });
}

/**
 * Calculates the routing score for a single destination candidate.
 * Score = weighted sum of normalized factors (0-100).
 * Higher score = safer destination.
 */
export function calculateDestinationScore(
  sourceVault: Vault,
  destVault: Vault,
  predictions: PredictionResult[],
  weights: RoutingWeights
): DestinationCandidate {
  const distance = haversineDistance(
    sourceVault.latitude,
    sourceVault.longitude,
    destVault.latitude,
    destVault.longitude
  );

  const destPrediction = predictions.find((p) => p.id === destVault.id);
  const currentRisk = destVault.riskLevel;
  const currentRiskScore = riskToScore(currentRisk);
  const predictedRisk = destPrediction?.riskLevel ?? currentRisk;
  const predictedRiskScore = riskToScore(predictedRisk);
  const predictedProbability = destPrediction?.floodProbability ?? currentRiskScore;

  // Normalize each factor to 0-100
  // Available capacity: higher is better (already 0-100)
  const capacityScore = destVault.availableCapacity;

  // Flood risk: lower is better → invert (100 - riskScore)
  const floodRiskScore = 100 - currentRiskScore;

  // Predicted risk: lower is better → invert
  const predictedRiskScoreNorm = 100 - predictedRiskScore;

  // Distance: shorter is better → normalize and invert
  // Assume max useful distance is ~2000m for normalization
  const distanceScore = 100 - normalize(distance, 0, 2000);

  // Network suitability: more connections = better flow capacity
  const networkScore = normalize(destVault.connectedVaults.length, 1, 4);

  // Weighted total
  const totalScore =
    capacityScore * weights.availableCapacity +
    floodRiskScore * weights.floodRisk +
    predictedRiskScoreNorm * weights.predictedRisk +
    distanceScore * weights.distance +
    networkScore * weights.networkSuitability;

  const score = Math.round(totalScore);

  // Determine status
  let status: DestinationCandidate['status'] = 'available';
  const reasons: string[] = [];

  if (destVault.availableCapacity >= 50) {
    reasons.push(`${Math.round(destVault.availableCapacity)}% available capacity`);
  } else {
    reasons.push(`${Math.round(destVault.availableCapacity)}% available capacity (limited)`);
  }

  if (currentRisk === 'low') {
    reasons.push('Low current flood risk');
  } else if (currentRisk === 'medium') {
    reasons.push('Medium current flood risk');
  } else {
    reasons.push(`${currentRisk} current flood risk`);
  }

  if (predictedRisk === 'low') {
    reasons.push('Low predicted flood risk');
  } else if (predictedRisk === 'medium') {
    reasons.push('Medium predicted flood risk');
  } else {
    reasons.push(`${predictedRisk} predicted flood risk`);
  }

  reasons.push(`Connected directly`);
  reasons.push(`${Math.round(distance)}m routing distance`);

  return {
    vaultId: destVault.id,
    availableCapacity: destVault.availableCapacity,
    currentRisk,
    currentRiskScore,
    predictedRisk,
    predictedRiskScore: predictedProbability,
    distance: Math.round(distance),
    score,
    status,
    reasons,
  };
}

/**
 * Ranks all destination candidates by score (descending).
 */
export function rankDestinations(candidates: DestinationCandidate[]): DestinationCandidate[] {
  return [...candidates].sort((a, b) => b.score - a.score);
}

/**
 * Marks the top candidate as "recommended" and low-score candidates as "avoid".
 */
export function markRecommendations(
  ranked: DestinationCandidate[]
): DestinationCandidate[] {
  if (ranked.length === 0) return [];

  return ranked.map((c, i) => {
    let status: DestinationCandidate['status'] = 'available';
    if (i === 0 && c.score >= 50) status = 'recommended';
    else if (c.score < 40) status = 'avoid';
    return { ...c, status };
  });
}

/**
 * Full routing recommendation: finds critical vaults, evaluates destinations,
 * ranks them, and selects the best one.
 */
export function recommendDiversion(
  sourceVault: Vault,
  allVaults: Vault[],
  predictions: PredictionResult[],
  weights: RoutingWeights = DEFAULT_ROUTING_WEIGHTS
): RoutingRecommendation {
  const destinations = findAvailableDestinations(sourceVault, allVaults);

  const candidates = destinations.map((dest) =>
    calculateDestinationScore(sourceVault, dest, predictions, weights)
  );

  const ranked = rankDestinations(candidates);
  const marked = markRecommendations(ranked);

  const recommended = marked.find((c) => c.status === 'recommended') ?? null;

  let reason: string;
  if (!recommended) {
    if (destinations.length === 0) {
      reason =
        'No connected vaults with safe available capacity. Continue local retention and issue overflow warning.';
    } else {
      reason =
        'No destination meets the minimum safety threshold. Continue local retention and issue overflow warning.';
    }
  } else {
    reason = `${recommended.vaultId} has the highest available capacity (${Math.round(
      recommended.availableCapacity
    )}%) and ${recommended.predictedRisk === 'low' ? 'low' : 'acceptable'} predicted flood risk.`;
  }

  return {
    sourceVaultId: sourceVault.id,
    sourceLevel: sourceVault.currentLevel,
    sourceRisk: sourceVault.riskLevel,
    recommendedDestination: recommended,
    allCandidates: marked,
    hasSafeDestination: recommended !== null,
    reason,
  };
}

/**
 * Simulates a water transfer between two vaults.
 * Returns the updated levels and volume transferred.
 */
export function simulateWaterTransfer(
  sourceVault: Vault,
  destVault: Vault,
  transferPercent: number
): {
  sourceLevelAfter: number;
  destLevelAfter: number;
  volume: number;
} {
  const transferAmount = Math.min(
    transferPercent,
    sourceVault.currentLevel - 50, // don't drain below 50%
    destVault.availableCapacity // don't overflow destination
  );

  const safeTransfer = Math.max(0, transferAmount);
  const sourceLevelAfter = sourceVault.currentLevel - safeTransfer;
  const destLevelAfter = destVault.currentLevel + safeTransfer;
  const volume = (safeTransfer / 100) * sourceVault.capacity;

  return {
    sourceLevelAfter: Math.round(sourceLevelAfter * 10) / 10,
    destLevelAfter: Math.round(destLevelAfter * 10) / 10,
    volume: Math.round(volume),
  };
}

// Baseline routing: sends to first connected vault regardless of conditions
export function baselineRoute(
  sourceVault: Vault,
  allVaults: Vault[]
): { destinationId: string | null } {
  const connected = allVaults.filter((v) =>
    sourceVault.connectedVaults.includes(v.id)
  );
  if (connected.length === 0) return { destinationId: null };
  // Traditional: just pick the first connected vault
  return { destinationId: connected[0].id };
}
