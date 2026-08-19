// Route Scoring Service
// Calculates the cost of traversing a road segment based on configurable weights.
// Safety is prioritized over simple distance minimization.

import type { RoadGraphSegment, RouteCostWeights, RiskLevel } from '@/types';

export const DEFAULT_ROUTE_WEIGHTS: RouteCostWeights = {
  floodSafety: 0.30,
  travelTime: 0.25,
  floodDepth: 0.20,
  traffic: 0.15,
  distance: 0.10,
};

export const SAFE_FLOOD_DEPTH_THRESHOLD = 20; // cm — roads above this are blocked

function riskToScore(risk: RiskLevel): number {
  switch (risk) {
    case 'critical': return 100;
    case 'high': return 75;
    case 'medium': return 50;
    case 'low': return 15;
  }
}

/**
 * Checks if a road segment is blocked and should not be used.
 * A road is blocked if:
 * - Flood depth exceeds the safe threshold
 * - Road status is CLOSED
 * - Flood risk is CRITICAL
 */
export function isRoadBlocked(road: RoadGraphSegment): boolean {
  if (road.roadStatus === 'closed') return true;
  if (road.floodRisk === 'critical') return true;
  if (road.floodDepth >= SAFE_FLOOD_DEPTH_THRESHOLD) return true;
  return false;
}

/**
 * Calculates the traversal cost of a single road segment.
 * Lower cost = better road. Blocked roads return Infinity.
 *
 * The cost is a weighted combination of:
 * - Flood safety (lower risk = lower cost)
 * - Travel time (faster = lower cost)
 * - Flood depth (shallower = lower cost)
 * - Traffic (lighter = lower cost)
 * - Distance (shorter = lower cost)
 */
export function calculateSegmentCost(
  road: RoadGraphSegment,
  weights: RouteCostWeights = DEFAULT_ROUTE_WEIGHTS
): number {
  if (isRoadBlocked(road)) return Infinity;

  // Normalize each factor to 0-1
  const floodRiskScore = riskToScore(road.floodRisk) / 100;
  const travelTimeScore = road.estimatedTravelTime / 30; // normalize to 30 min max
  const floodDepthScore = road.floodDepth / SAFE_FLOOD_DEPTH_THRESHOLD;
  const trafficScore = road.trafficLevel / 100;
  const distanceScore = road.length / 3000; // normalize to 3km max

  const cost =
    floodRiskScore * weights.floodSafety +
    travelTimeScore * weights.travelTime +
    floodDepthScore * weights.floodDepth +
    trafficScore * weights.traffic +
    distanceScore * weights.distance;

  return cost;
}

/**
 * Calculates a route-level score (0-100) for display and comparison.
 * Higher score = better route.
 */
export function calculateRouteScore(
  roads: RoadGraphSegment[],
  weights: RouteCostWeights = DEFAULT_ROUTE_WEIGHTS
): number {
  if (roads.length === 0) return 0;

  const totalDistance = roads.reduce((sum, r) => sum + r.length, 0);
  const totalTime = roads.reduce((sum, r) => sum + r.estimatedTravelTime, 0);
  const avgFloodRisk = roads.reduce((sum, r) => sum + riskToScore(r.floodRisk), 0) / roads.length;
  const avgFloodDepth = roads.reduce((sum, r) => sum + r.floodDepth, 0) / roads.length;
  const avgTraffic = roads.reduce((sum, r) => sum + r.trafficLevel, 0) / roads.length;
  const blockedCount = roads.filter(isRoadBlocked).length;

  // Normalize and invert (lower risk/depth/traffic/time = higher score)
  const safetyScore = 100 - avgFloodRisk;
  const depthScore = 100 - (avgFloodDepth / SAFE_FLOOD_DEPTH_THRESHOLD) * 100;
  const trafficScore = 100 - avgTraffic;
  const timeScore = Math.max(0, 100 - (totalTime / 30) * 100);
  const distanceScore = Math.max(0, 100 - (totalDistance / 8000) * 100);

  const score =
    safetyScore * weights.floodSafety +
    timeScore * weights.travelTime +
    depthScore * weights.floodDepth +
    trafficScore * weights.traffic +
    distanceScore * weights.distance;

  // Penalty for blocked roads
  const penalty = blockedCount * 20;

  return Math.max(0, Math.min(100, Math.round(score - penalty)));
}

/**
 * Determines the overall flood risk level for a route.
 */
export function routeFloodRisk(roads: RoadGraphSegment[]): { risk: RiskLevel; score: number } {
  if (roads.length === 0) return { risk: 'critical', score: 100 };

  const maxRisk = Math.max(...roads.map((r) => riskToScore(r.floodRisk)));
  const avgRisk = roads.reduce((sum, r) => sum + riskToScore(r.floodRisk), 0) / roads.length;
  const score = Math.round(maxRisk * 0.6 + avgRisk * 0.4);

  let risk: RiskLevel;
  if (score >= 85) risk = 'critical';
  else if (score >= 60) risk = 'high';
  else if (score >= 35) risk = 'medium';
  else risk = 'low';

  return { risk, score };
}
