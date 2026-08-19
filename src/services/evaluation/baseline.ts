// Baseline Simulation: Traditional Threshold-Based Flood Management
// Does NOT use intelligent destination scoring, flood prediction, or flood-aware routing.
// Diverts to a predefined/nearest destination when vault > threshold.
// Routes ambulance via shortest path ignoring flood risk.

import type { Vault, RoadGraphSegment, RoadNode, RiskLevel, RouteResult } from '@/types';

const BASELINE_DIVERSION_THRESHOLD = 80;
const BASELINE_FLOOD_DEPTH_THRESHOLD = 20;

function riskLevelFromVaultLevel(level: number): RiskLevel {
  if (level >= 90) return 'critical';
  if (level >= 70) return 'high';
  if (level >= 40) return 'medium';
  return 'low';
}

function riskLevelFromScore(score: number): RiskLevel {
  if (score >= 85) return 'critical';
  if (score >= 60) return 'high';
  if (score >= 35) return 'medium';
  return 'low';
}

export interface BaselineSimState {
  vaults: Vault[];
  roadGraph: RoadGraphSegment[];
  waterDiverted: number;
  overflowEvents: number;
  successfulDiversions: number;
  failedDiversions: number;
  timeAboveCritical: number;
  timeToResponse: number;
  waterLevelTimeSeries: number[];
  peakWaterLevel: number;
  totalWaterLevelSum: number;
  tickCount: number;
  criticalVaultsAtPeak: number;
  highRiskVaultsAtPeak: number;
  floodHotspots: number;
  maxFloodProbability: number;
  blockedRoads: number;
  responded: boolean;
}

export function initBaselineSim(
  vaults: Vault[],
  roadGraph: RoadGraphSegment[],
  initialWaterLevels: number[]
): BaselineSimState {
  const initVaults = vaults.map((v, i) => {
    const level = initialWaterLevels[i] ?? 40;
    return {
      ...v,
      currentLevel: level,
      availableCapacity: 100 - level,
      riskLevel: riskLevelFromVaultLevel(level),
    };
  });

  return {
    vaults: initVaults,
    roadGraph: roadGraph.map((r) => ({ ...r })),
    waterDiverted: 0,
    overflowEvents: 0,
    successfulDiversions: 0,
    failedDiversions: 0,
    timeAboveCritical: 0,
    timeToResponse: 0,
    waterLevelTimeSeries: [],
    peakWaterLevel: 0,
    totalWaterLevelSum: 0,
    tickCount: 0,
    criticalVaultsAtPeak: 0,
    highRiskVaultsAtPeak: 0,
    floodHotspots: 0,
    maxFloodProbability: 0,
    blockedRoads: 0,
    responded: false,
  };
}

export function baselineSimTick(
  state: BaselineSimState,
  rainfallIntensity: number,
  riseRate: number,
  floodDepthThreshold: number
): BaselineSimState {
  const dt = 0.5;
  let { waterDiverted, overflowEvents, successfulDiversions, failedDiversions } = state;
  let { timeAboveCritical, timeToResponse, responded } = state;

  // Update vault water levels
  const vaults = state.vaults.map((vault) => {
    const inflow = (rainfallIntensity / 150) * dt * 3;
    let newLevel = Math.min(100, vault.currentLevel + inflow);

    // Baseline: simple threshold diversion to FIRST connected vault with capacity
    if (newLevel > BASELINE_DIVERSION_THRESHOLD) {
      const connected = state.vaults.find(
        (v) => vault.connectedVaults.includes(v.id) && v.currentLevel < 70
      );
      if (connected) {
        const diversion = Math.min(2 * dt, newLevel - BASELINE_DIVERSION_THRESHOLD + 2);
        newLevel -= diversion;
        waterDiverted += diversion * (vault.capacity / 100) * 0.1;
        successfulDiversions++;
        if (!responded) {
          timeToResponse = state.tickCount;
          responded = true;
        }
      } else {
        failedDiversions++;
      }
    }

    if (newLevel >= 95) overflowEvents++;
    if (newLevel >= 90) timeAboveCritical++;

    return {
      ...vault,
      currentLevel: newLevel,
      availableCapacity: 100 - newLevel,
      riskLevel: riskLevelFromVaultLevel(newLevel),
    };
  });

  // Update road graph - baseline: simple flood depth threshold
  const roadGraph = state.roadGraph.map((road) => {
    const midLat = (road.start.latitude + road.end.latitude) / 2;
    const midLon = (road.start.longitude + road.end.longitude) / 2;

    // Simulate flood depth increasing with rainfall
    const newFloodDepth = Math.min(40, road.floodDepth + (rainfallIntensity / 150) * dt * 5);
    let newFloodRisk: RiskLevel = 'low';
    if (newFloodDepth >= floodDepthThreshold) newFloodRisk = 'critical';
    else if (newFloodDepth >= 12) newFloodRisk = 'high';
    else if (newFloodDepth >= 5) newFloodRisk = 'medium';

    const newAccessible = newFloodDepth < floodDepthThreshold && newFloodRisk !== 'critical';

    return {
      ...road,
      floodDepth: newFloodDepth,
      floodRisk: newFloodRisk,
      accessible: newAccessible,
      roadStatus: newFloodRisk === 'critical' ? 'closed' as const : newFloodRisk === 'high' ? 'at_risk' as const : 'open' as const,
    };
  });

  const avgLevel = vaults.reduce((s, v) => s + v.currentLevel, 0) / vaults.length;
  const peakWaterLevel = Math.max(state.peakWaterLevel, avgLevel);
  const criticalVaults = vaults.filter((v) => v.riskLevel === 'critical' || v.riskLevel === 'high').length;
  const highRiskVaults = vaults.filter((v) => v.riskLevel === 'high').length;
  const blockedRoads = roadGraph.filter((r) => !r.accessible).length;
  const maxFloodProb = Math.min(100, rainfallIntensity * 0.8);
  const floodHotspots = vaults.filter((v) => v.riskLevel === 'critical' || v.riskLevel === 'high').length;

  return {
    vaults,
    roadGraph,
    waterDiverted,
    overflowEvents,
    successfulDiversions,
    failedDiversions,
    timeAboveCritical,
    timeToResponse,
    responded,
    waterLevelTimeSeries: [...state.waterLevelTimeSeries, Math.round(avgLevel * 10) / 10],
    peakWaterLevel,
    totalWaterLevelSum: state.totalWaterLevelSum + avgLevel,
    tickCount: state.tickCount + 1,
    criticalVaultsAtPeak: Math.max(state.criticalVaultsAtPeak, criticalVaults),
    highRiskVaultsAtPeak: Math.max(state.highRiskVaultsAtPeak, highRiskVaults),
    floodHotspots: Math.max(state.floodHotspots, floodHotspots),
    maxFloodProbability: Math.max(state.maxFloodProbability, maxFloodProb),
    blockedRoads: Math.max(state.blockedRoads, blockedRoads),
  };
}

// Baseline emergency routing: shortest path ignoring flood risk
export function baselineEmergencyRoute(
  roadGraph: RoadGraphSegment[],
  roadNodes: RoadNode[],
  startNode: string,
  endNode: string
): RouteResult {
  const nodeMap = new Map(roadNodes.map((n) => [n.id, n]));
  const adjacency = new Map<string, { road: RoadGraphSegment; target: string }[]>();
  for (const road of roadGraph) {
    if (!adjacency.has(road.startNode)) adjacency.set(road.startNode, []);
    if (!adjacency.has(road.endNode)) adjacency.set(road.endNode, []);
    adjacency.get(road.startNode)!.push({ road, target: road.endNode });
    adjacency.get(road.endNode)!.push({ road, target: road.startNode });
  }

  // Dijkstra by distance only (ignoring flood risk)
  const dist = new Map<string, number>();
  const prev = new Map<string, { node: string; roadId: string }>();
  for (const n of roadNodes) dist.set(n.id, Infinity);
  dist.set(startNode, 0);
  const queue = [{ node: startNode, cost: 0 }];

  while (queue.length > 0) {
    queue.sort((a, b) => a.cost - b.cost);
    const current = queue.shift()!;
    if (current.node === endNode) break;
    const neighbors = adjacency.get(current.node) || [];
    for (const { road, target } of neighbors) {
      const alt = current.cost + road.length;
      if (alt < (dist.get(target) || Infinity)) {
        dist.set(target, alt);
        prev.set(target, { node: current.node, roadId: road.id });
        queue.push({ node: target, cost: alt });
      }
    }
  }

  const nodePath: string[] = [];
  const roadPath: string[] = [];
  let node = endNode;
  while (prev.has(node)) {
    nodePath.unshift(node);
    const p = prev.get(node)!;
    roadPath.unshift(p.roadId);
    node = p.node;
  }
  nodePath.unshift(startNode);

  const roadMap = new Map(roadGraph.map((r) => [r.id, r]));
  const pathRoads = roadPath.map((id) => roadMap.get(id)!).filter(Boolean);
  const distance = pathRoads.reduce((s, r) => s + r.length, 0);
  const time = pathRoads.reduce((s, r) => s + r.estimatedTravelTime, 0);
  const blocked = pathRoads.filter((r) => !r.accessible).length;
  const flooded = pathRoads.filter((r) => r.floodDepth > 0).length;

  const riskScores = pathRoads.map((r) => {
    if (r.floodRisk === 'critical') return 100;
    if (r.floodRisk === 'high') return 75;
    if (r.floodRisk === 'medium') return 50;
    return 15;
  });
  const floodExposure = riskScores.length > 0
    ? Math.round(riskScores.reduce((s, r) => s + r, 0) / riskScores.length)
    : 0;

  let routeRisk: RiskLevel = 'low';
  if (floodExposure >= 85) routeRisk = 'critical';
  else if (floodExposure >= 60) routeRisk = 'high';
  else if (floodExposure >= 35) routeRisk = 'medium';

  const coordinates = nodePath.map((id) => {
    const n = nodeMap.get(id);
    return n ? { latitude: n.latitude, longitude: n.longitude } : { latitude: 0, longitude: 0 };
  });

  return {
    type: 'fastest',
    path: roadPath,
    nodePath,
    coordinates,
    distance: Math.round(distance),
    estimatedTime: time,
    floodRisk: routeRisk,
    floodRiskScore: floodExposure,
    trafficLevel: 50,
    blockedRoads: blocked,
    floodedSegments: flooded,
    routeScore: Math.max(0, 100 - floodExposure - blocked * 20),
    status: blocked > 0 ? 'not_recommended' : 'safe',
    reasons: [],
  };
}
