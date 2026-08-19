// Experiment Runner: deterministic scenario generation + simulation execution
// Runs N scenarios for both baseline and hydrogrid modes, collecting metrics.

import type {
  ExperimentConfig,
  ScenarioResult,
  SystemMode,
  Vault,
  RoadGraphSegment,
  RoadNode,
  RiskLevel,
} from '@/types';
import { INITIAL_VAULTS } from '@/data/mockData';
import { ROAD_GRAPH, ROAD_NODES, AMBULANCE_NODE_MAP, HOSPITAL_NODE_MAP } from '@/services/emergency';
import { calculateRoutes } from '@/services/emergency/routeEngine';
import { recommendDiversion } from '@/services/routing/routingEngine';
import {
  initBaselineSim,
  baselineSimTick,
  baselineEmergencyRoute,
  type BaselineSimState,
} from './baseline';

// Deterministic PRNG (mulberry32)
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

export interface ScenarioParams {
  rainfall: number;
  riseRate: number;
  initialWaterLevels: number[];
  trafficLevel: number;
  floodDepthThreshold: number;
}

export function generateScenarios(config: ExperimentConfig): ScenarioParams[] {
  const rng = mulberry32(config.seed);
  const scenarios: ScenarioParams[] = [];

  for (let i = 0; i < config.numScenarios; i++) {
    const rainfall =
      config.rainfallMin + rng() * (config.rainfallMax - config.rainfallMin);
    const riseRate = 1 + rng() * 7;
    const initialWaterLevels = INITIAL_VAULTS.map(() =>
      config.initialWaterLevelMin +
      rng() * (config.initialWaterLevelMax - config.initialWaterLevelMin)
    );
    const trafficLevel = config.trafficLevel;
    const floodDepthThreshold = config.floodDepthThreshold;

    scenarios.push({
      rainfall: Math.round(rainfall * 10) / 10,
      riseRate: Math.round(riseRate * 100) / 100,
      initialWaterLevels: initialWaterLevels.map((l) => Math.round(l * 10) / 10),
      trafficLevel,
      floodDepthThreshold,
    });
  }

  return scenarios;
}

function runBaselineScenario(
  params: ScenarioParams,
  duration: number,
  scenarioId: string
): ScenarioResult {
  const state = initBaselineSim(INITIAL_VAULTS, ROAD_GRAPH, params.initialWaterLevels);

  let simState: BaselineSimState = state;
  for (let t = 0; t < duration; t++) {
    simState = baselineSimTick(
      simState,
      params.rainfall,
      params.riseRate,
      params.floodDepthThreshold
    );
  }

  // Baseline emergency route: shortest path ignoring flood risk
  const startNode = AMBULANCE_NODE_MAP['AMB-01'];
  const endNode = HOSPITAL_NODE_MAP['hospital-1'];
  const route = baselineEmergencyRoute(simState.roadGraph, ROAD_NODES, startNode, endNode);

  const avgWaterLevel = simState.tickCount > 0
    ? simState.totalWaterLevelSum / simState.tickCount
    : 0;

  return {
    scenarioId,
    systemMode: 'baseline',
    rainfall: params.rainfall,
    peakWaterLevel: Math.round(simState.peakWaterLevel * 10) / 10,
    averageWaterLevel: Math.round(avgWaterLevel * 10) / 10,
    overflowEvents: simState.overflowEvents,
    criticalVaults: simState.criticalVaultsAtPeak,
    highRiskVaults: simState.highRiskVaultsAtPeak,
    floodHotspots: simState.floodHotspots,
    maxFloodProbability: Math.round(simState.maxFloodProbability),
    waterDiverted: Math.round(simState.waterDiverted),
    successfulDiversions: simState.successfulDiversions,
    failedDiversions: simState.failedDiversions,
    timeToResponse: simState.timeToResponse,
    timeAboveCritical: simState.timeAboveCritical,
    blockedRoads: simState.blockedRoads,
    routeDistance: route.distance,
    routeTravelTime: route.estimatedTime,
    routeFloodExposure: route.floodRiskScore,
    routeRiskScore: route.routeScore,
    emergencyDelay: Math.max(0, route.estimatedTime - 11),
    waterLevelTimeSeries: simState.waterLevelTimeSeries,
  };
}

function runHydrogridScenario(
  params: ScenarioParams,
  duration: number,
  scenarioId: string
): ScenarioResult {
  // HydroGrid: intelligent routing with capacity scoring + flood prediction
  const vaults: Vault[] = INITIAL_VAULTS.map((v, i) => {
    const level = params.initialWaterLevels[i] ?? 40;
    return {
      ...v,
      currentLevel: level,
      availableCapacity: 100 - level,
      riskLevel: riskLevelFromVaultLevel(level),
    };
  });

  let waterDiverted = 0;
  let overflowEvents = 0;
  let successfulDiversions = 0;
  let failedDiversions = 0;
  let timeAboveCritical = 0;
  let timeToResponse = 0;
  let responded = false;
  const waterLevelTimeSeries: number[] = [];
  let peakWaterLevel = 0;
  let totalWaterLevelSum = 0;
  let tickCount = 0;
  let criticalVaultsAtPeak = 0;
  let highRiskVaultsAtPeak = 0;
  let floodHotspots = 0;
  let maxFloodProbability = 0;
  let blockedRoads = 0;

  let currentVaults = [...vaults];
  let currentRoadGraph: RoadGraphSegment[] = ROAD_GRAPH.map((r) => ({ ...r }));

  for (let t = 0; t < duration; t++) {
    const dt = 0.5;

    // Update vault levels
    currentVaults = currentVaults.map((vault) => {
      const inflow = (params.rainfall / 150) * dt * 3;
      let newLevel = Math.min(100, vault.currentLevel + inflow);

      // HydroGrid: intelligent diversion using routing engine
      if (newLevel > 75) {
        const updatedVaultForRec = { ...vault, currentLevel: newLevel, availableCapacity: 100 - newLevel, riskLevel: riskLevelFromVaultLevel(newLevel) };
        const rec = recommendDiversion(updatedVaultForRec, currentVaults, [], {
          availableCapacity: 0.4,
          floodRisk: 0.25,
          predictedRisk: 0.2,
          distance: 0.1,
          networkSuitability: 0.05,
        });
        if (rec.hasSafeDestination && rec.recommendedDestination) {
          const dest = currentVaults.find((v) => v.id === rec.recommendedDestination!.vaultId);
          if (dest && dest.availableCapacity > 5) {
            const transfer = Math.min(2 * dt, newLevel - 68, dest.availableCapacity - 5);
            newLevel -= transfer;
            waterDiverted += transfer * (vault.capacity / 100) * 0.1;
            successfulDiversions++;
            if (!responded) {
              timeToResponse = t;
              responded = true;
            }
          } else {
            failedDiversions++;
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

    // Update road graph with flood conditions
    currentRoadGraph = currentRoadGraph.map((road) => {
      const newFloodDepth = Math.min(40, road.floodDepth + (params.rainfall / 150) * dt * 5);
      let newFloodRisk: RiskLevel = 'low';
      if (newFloodDepth >= params.floodDepthThreshold) newFloodRisk = 'critical';
      else if (newFloodDepth >= 12) newFloodRisk = 'high';
      else if (newFloodDepth >= 5) newFloodRisk = 'medium';

      const newAccessible = newFloodDepth < params.floodDepthThreshold && newFloodRisk !== 'critical';

      return {
        ...road,
        floodDepth: newFloodDepth,
        floodRisk: newFloodRisk,
        accessible: newAccessible,
        roadStatus: newFloodRisk === 'critical' ? 'closed' as const : newFloodRisk === 'high' ? 'at_risk' as const : 'open' as const,
      };
    });

    const avgLevel = currentVaults.reduce((s, v) => s + v.currentLevel, 0) / currentVaults.length;
    peakWaterLevel = Math.max(peakWaterLevel, avgLevel);
    totalWaterLevelSum += avgLevel;
    tickCount++;
    waterLevelTimeSeries.push(Math.round(avgLevel * 10) / 10);

    const critCount = currentVaults.filter((v) => v.riskLevel === 'critical' || v.riskLevel === 'high').length;
    const highCount = currentVaults.filter((v) => v.riskLevel === 'high').length;
    criticalVaultsAtPeak = Math.max(criticalVaultsAtPeak, critCount);
    highRiskVaultsAtPeak = Math.max(highRiskVaultsAtPeak, highCount);
    floodHotspots = Math.max(floodHotspots, critCount);
    maxFloodProbability = Math.max(maxFloodProbability, Math.min(100, params.rainfall * 0.7));
    blockedRoads = Math.max(blockedRoads, currentRoadGraph.filter((r) => !r.accessible).length);
  }

  // HydroGrid emergency route: flood-aware routing
  const startNode = AMBULANCE_NODE_MAP['AMB-01'];
  const endNode = HOSPITAL_NODE_MAP['hospital-1'];
  const routeSet = calculateRoutes(startNode, endNode, currentRoadGraph, ROAD_NODES, {
    floodSafety: 0.30,
    travelTime: 0.25,
    floodDepth: 0.20,
    traffic: 0.15,
    distance: 0.10,
  });
  const recommended = routeSet.recommended || routeSet.safest;

  const avgWaterLevel = tickCount > 0 ? totalWaterLevelSum / tickCount : 0;

  return {
    scenarioId,
    systemMode: 'hydrogrid',
    rainfall: params.rainfall,
    peakWaterLevel: Math.round(peakWaterLevel * 10) / 10,
    averageWaterLevel: Math.round(avgWaterLevel * 10) / 10,
    overflowEvents,
    criticalVaults: criticalVaultsAtPeak,
    highRiskVaults: highRiskVaultsAtPeak,
    floodHotspots,
    maxFloodProbability: Math.round(maxFloodProbability),
    waterDiverted: Math.round(waterDiverted),
    successfulDiversions,
    failedDiversions,
    timeToResponse,
    timeAboveCritical,
    blockedRoads,
    routeDistance: recommended?.distance || 0,
    routeTravelTime: recommended?.estimatedTime || 0,
    routeFloodExposure: recommended?.floodRiskScore || 0,
    routeRiskScore: recommended?.routeScore || 0,
    emergencyDelay: Math.max(0, (recommended?.estimatedTime || 14) - 11),
    waterLevelTimeSeries,
  };
}

export function runExperiment(config: ExperimentConfig): {
  baselineResults: ScenarioResult[];
  hydrogridResults: ScenarioResult[];
} {
  const scenarios = generateScenarios(config);
  const baselineResults: ScenarioResult[] = [];
  const hydrogridResults: ScenarioResult[] = [];

  for (let i = 0; i < scenarios.length; i++) {
    const scenarioId = `S${String(i + 1).padStart(3, '0')}`;
    baselineResults.push(
      runBaselineScenario(scenarios[i], config.simulationDuration, scenarioId)
    );
    hydrogridResults.push(
      runHydrogridScenario(scenarios[i], config.simulationDuration, scenarioId)
    );
  }

  return { baselineResults, hydrogridResults };
}
