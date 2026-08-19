import { create } from './store';
import type {
  FloodZone,
  Vault,
  RoadSegment,
  Hospital,
  Ambulance,
  Alert,
  SimulationConfig,
  KPIData,
  RiskLevel,
  VaultStatus,
  RoutingWeights,
  ActiveDiversion,
  DiversionEvent,
  RoutingScenario,
  RoadGraphSegment,
  RoadNode,
  RouteCostWeights,
  EmergencyRouteSet,
  EmergencyAnalytics,
  EmergencyEvent,
  SystemStatus,
  EventLogEntry,
  EventLogCategory,
  EventLogSeverity,
  FloodEventDemoState,
  FloodEventSummary,
  BaselineMetrics,
  HydroGridImpact,
  DataMode,
  DataSourceInfo,
  AffectedZone,
  ZoneInfrastructure,
  DigitalTwinState,
  TwinViewState,
  SimulationSpeed,
  PredictionWindow,
  RiskPrediction,
  EmergencyResponseState,
  EmergencyResponseStatus,
  AmbulanceSelectionResult,
  LiveWeatherData,
  WeatherState,
  WeatherFetchStatus,
  LiveRiskAnalysis,
  RiskHistoryEntry,
} from '@/types';
import {
  INITIAL_FLOOD_ZONES,
  INITIAL_VAULTS,
  INITIAL_ROAD_SEGMENTS,
  INITIAL_HOSPITALS,
  INITIAL_AMBULANCES,
  INITIAL_ALERTS,
  INITIAL_SIMULATION_CONFIG,
} from '@/data/mockData';
import { DEFAULT_ROUTING_WEIGHTS } from '@/services/routing/routingEngine';
import {
  ROAD_NODES,
  ROAD_GRAPH,
  EMERGENCY_AMBULANCES,
  EMERGENCY_HOSPITALS,
  AMBULANCE_NODE_MAP,
  HOSPITAL_NODE_MAP,
  DEFAULT_ROUTE_WEIGHTS,
} from '@/services/emergency';
import { calculateRoutes } from '@/services/emergency/routeEngine';
import { getPredefinedZones, computeZoneInfrastructure, computeZoneSeverity, createCustomZone } from '@/services/affectedZone';
import { createInitialTwinState, buildTwinEntities, toggleTwinView, setTwinPlaying, setTwinSpeed, advanceTwinStep, resetTwin } from '@/services/digitalTwin';
import { predictAllZones, predictZoneRisk, shouldTriggerEmergency, getPredictionMethodology } from '@/services/prediction';
import { selectAmbulance } from '@/services/ambulanceRouting';
import { getDataMode, getDataSourceInfo, setDataMode as setHydroDataMode, isLiveMode } from '@/services/hydroData';
import { getCurrentWeather } from '@/services/weather';
import { calculateLiveRisk, getZoneForLocation, riskLevelFromScore as liveRiskLevelFromScore } from '@/services/liveRiskAnalysis';

export interface AppState {
  floodZones: FloodZone[];
  vaults: Vault[];
  roadSegments: RoadSegment[];
  roadGraph: RoadGraphSegment[];
  roadNodes: RoadNode[];
  hospitals: Hospital[];
  ambulances: Ambulance[];
  alerts: Alert[];
  simulation: SimulationConfig;
  waterDiverted: number;
  lastUpdated: string;
  // Routing state
  routingWeights: RoutingWeights;
  activeDiversion: ActiveDiversion | null;
  diversionEvents: DiversionEvent[];
  routingAnalytics: {
    totalDiversions: number;
    totalWaterDiverted: number;
    averageRoutingScore: number;
    rejectedDestinations: number;
    overflowWarnings: number;
  };
  // Emergency routing state
  emergencyAmbulances: Ambulance[];
  emergencyHospitals: Hospital[];
  selectedAmbulanceId: string;
  selectedHospitalId: string;
  routeCostWeights: RouteCostWeights;
  emergencyRouteSet: EmergencyRouteSet | null;
  emergencyAnalytics: EmergencyAnalytics;
  // Full system integration state
  systemStatus: SystemStatus;
  eventLog: EventLogEntry[];
  floodEventDemo: FloodEventDemoState;
  baselineMetrics: BaselineMetrics | null;
  hydroGridImpact: HydroGridImpact | null;
  demoMode: 'hydrogrid' | 'baseline';
  // Real-time data layer
  dataMode: DataMode;
  dataSourceInfo: DataSourceInfo;
  // Affected zone intelligence
  affectedZones: AffectedZone[];
  selectedZoneId: string | null;
  zoneInfrastructure: ZoneInfrastructure | null;
  // Digital twin
  digitalTwin: DigitalTwinState;
  // Prediction
  predictionWindow: PredictionWindow;
  riskPredictions: RiskPrediction[];
  predictionMethodology: string;
  // Emergency response engine
  emergencyResponse: EmergencyResponseState;
  ambulanceSelection: AmbulanceSelectionResult | null;
  // Live weather + risk
  weather: WeatherState;
  liveRisk: LiveRiskAnalysis | null;
  riskHistory: RiskHistoryEntry[];
  liveLocation: { latitude: number; longitude: number; name: string } | null;
}

export interface AppActions {
  setSimulationConfig: (partial: Partial<SimulationConfig>) => void;
  startSimulation: () => void;
  pauseSimulation: () => void;
  resetSimulation: () => void;
  triggerHeavyRain: () => void;
  triggerExtremeRain: () => void;
  tick: () => void;
  acknowledgeAlert: (id: string) => void;
  clearAlerts: () => void;
  // Routing actions
  setRoutingWeights: (weights: Partial<RoutingWeights>) => void;
  startDiversion: (sourceId: string, destId: string, sourceLevel: number, destLevel: number, routingScore: number) => void;
  updateDiversionProgress: () => void;
  stopDiversion: () => void;
  applyScenario: (scenario: RoutingScenario) => void;
  // Emergency routing actions
  setSelectedAmbulance: (id: string) => void;
  setSelectedHospital: (id: string) => void;
  setRouteCostWeights: (weights: Partial<RouteCostWeights>) => void;
  calculateEmergencyRoutes: () => void;
  clearEmergencyRoutes: () => void;
  runEmergencyDemo: () => void;
  // Full system integration actions
  addEventLog: (category: EventLogCategory, severity: EventLogSeverity, message: string) => void;
  clearEventLog: () => void;
  runFloodEventDemo: () => void;
  advanceFloodEventDemo: () => void;
  resetFloodEventDemo: () => void;
  setDemoMode: (mode: 'hydrogrid' | 'baseline') => void;
  computeImpact: () => void;
  // Real-time data layer actions
  setDataMode: (mode: DataMode) => void;
  // Affected zone actions
  setSelectedZone: (zoneId: string | null) => void;
  setZoneRadius: (radiusKm: number) => void;
  addCustomZone: (name: string, lat: number, lon: number, radiusKm: number) => void;
  refreshZoneInfrastructure: () => void;
  // Digital twin actions
  setTwinViewState: (view: TwinViewState) => void;
  setTwinPlaying: (playing: boolean) => void;
  setTwinSpeed: (speed: SimulationSpeed) => void;
  advanceTwinStep: () => void;
  resetTwin: () => void;
  refreshDigitalTwin: () => void;
  // Prediction actions
  setPredictionWindow: (window: PredictionWindow) => void;
  refreshPredictions: () => void;
  // Emergency response actions
  triggerEmergencyResponse: (zoneId: string, manual: boolean) => void;
  clearEmergencyResponse: () => void;
  setEmergencyResponseStatus: (status: EmergencyResponseStatus) => void;
  // Live weather + risk actions
  setLiveLocation: (lat: number, lon: number, name: string) => void;
  fetchWeather: () => Promise<void>;
  setWeatherPollInterval: (ms: number) => void;
  clearWeather: () => void;
}

export type Store = AppState & AppActions;

function riskLevelFromScore(score: number): RiskLevel {
  if (score >= 85) return 'critical';
  if (score >= 60) return 'high';
  if (score >= 35) return 'medium';
  return 'low';
}

function vaultStatusFromLevel(level: number): VaultStatus {
  if (level >= 90) return 'overflow';
  if (level >= 75) return 'alert';
  if (level >= 50) return 'warning';
  return 'normal';
}

function riskLevelFromVaultLevel(level: number): RiskLevel {
  if (level >= 90) return 'critical';
  if (level >= 70) return 'high';
  if (level >= 40) return 'medium';
  return 'low';
}

function generateAlerts(zones: FloodZone[], vaults: Vault[], roads: RoadSegment[]): Alert[] {
  const alerts: Alert[] = [];
  const now = new Date().toISOString();

  for (const zone of zones) {
    if (zone.riskLevel === 'critical') {
      alerts.push({
        id: `alert-zone-critical-${zone.id}`,
        severity: 'critical',
        title: 'CRITICAL',
        message: `Flood risk critical in ${zone.name}. Water level at ${Math.round(zone.waterLevel)}%.`,
        source: zone.name,
        timestamp: now,
        acknowledged: false,
      });
    } else if (zone.riskLevel === 'high' && zone.trend === 'up') {
      alerts.push({
        id: `alert-zone-high-${zone.id}`,
        severity: 'high',
        title: 'HIGH RISK',
        message: `Flood risk increasing in ${zone.name}.`,
        source: zone.name,
        timestamp: now,
        acknowledged: false,
      });
    } else if (zone.riskLevel === 'medium' && zone.trend === 'up') {
      alerts.push({
        id: `alert-zone-warn-${zone.id}`,
        severity: 'warning',
        title: 'WARNING',
        message: `Water levels rising in ${zone.name}.`,
        source: zone.name,
        timestamp: now,
        acknowledged: false,
      });
    }
  }

  for (const vault of vaults) {
    if (vault.currentLevel >= 90) {
      alerts.push({
        id: `alert-vault-critical-${vault.id}`,
        severity: 'critical',
        title: 'CRITICAL',
        message: `${vault.id} approaching maximum capacity (${vault.currentLevel}% full).`,
        source: vault.id,
        timestamp: now,
        acknowledged: false,
      });
    } else if (vault.currentLevel >= 75) {
      alerts.push({
        id: `alert-vault-high-${vault.id}`,
        severity: 'high',
        title: 'HIGH RISK',
        message: `${vault.id} at ${vault.currentLevel}% capacity. Diversion recommended.`,
        source: vault.id,
        timestamp: now,
        acknowledged: false,
      });
    }
  }

  const blockedRoads = roads.filter((r) => !r.accessible);
  if (blockedRoads.length > 0) {
    alerts.push({
      id: `alert-roads-blocked`,
      severity: 'high',
      title: 'ROAD BLOCKED',
      message: `${blockedRoads.length} road segment${blockedRoads.length > 1 ? 's' : ''} blocked by flooding.`,
      source: 'Road Network',
      timestamp: now,
      acknowledged: false,
    });
  }

  const severityOrder = { critical: 0, high: 1, warning: 2, info: 3 };
  alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
  return alerts;
}

function computeKPIs(state: AppState): KPIData {
  const activeHotspots = state.floodZones.filter(
    (z) => z.riskLevel === 'high' || z.riskLevel === 'critical'
  ).length;
  const criticalVaults = state.vaults.filter(
    (v) => v.riskLevel === 'critical' || v.riskLevel === 'high'
  ).length;
  const highestRisk = Math.max(...state.floodZones.map((z) => z.riskScore));
  const routesAffected = state.roadSegments.filter((r) => !r.accessible).length;

  return {
    currentRainfall: state.simulation.rainfallIntensity,
    activeFloodHotspots: activeHotspots,
    criticalVaults,
    highestFloodRisk: highestRisk,
    waterDiverted: Math.round(state.waterDiverted),
    emergencyRoutesAffected: routesAffected,
  };
}

export function getKPIs(state: AppState): KPIData {
  return computeKPIs(state);
}

function getSpeedMultiplier(speed: SimulationConfig['speed']): number {
  switch (speed) {
    case 'slow':
      return 0.5;
    case 'fast':
      return 2.0;
    default:
      return 1.0;
  }
}

function computeSystemStatus(state: AppState): SystemStatus {
  const simRunning = state.simulation.state === 'running';
  const hasFloodRisk = state.floodZones.some((z) => z.riskLevel === 'high' || z.riskLevel === 'critical');
  const hasCriticalVaults = state.vaults.some((v) => v.riskLevel === 'critical' || v.riskLevel === 'high');
  const hasBlockedRoads = state.roadSegments.some((r) => !r.accessible);

  return {
    weather: simRunning ? 'active' : 'idle',
    floodDetection: hasFloodRisk ? (simRunning ? 'active' : 'warning') : 'idle',
    aiPrediction: simRunning ? 'active' : 'idle',
    vaultNetwork: hasCriticalVaults ? 'warning' : simRunning ? 'active' : 'idle',
    waterRouting: state.activeDiversion ? 'active' : hasCriticalVaults ? 'warning' : simRunning ? 'active' : 'idle',
    emergencyRouting: hasBlockedRoads ? 'warning' : state.emergencyRouteSet ? 'active' : simRunning ? 'active' : 'idle',
    simulation: simRunning ? 'active' : state.simulation.state === 'paused' ? 'warning' : 'idle',
  };
}

let eventLogIdCounter = 0;
function makeEventLogEntry(category: EventLogCategory, severity: EventLogSeverity, message: string): EventLogEntry {
  eventLogIdCounter++;
  return {
    id: `evt-${Date.now()}-${eventLogIdCounter}`,
    timestamp: new Date().toISOString(),
    category,
    severity,
    message,
  };
}

function getInitialState(): AppState {
  return {
    floodZones: INITIAL_FLOOD_ZONES.map((z) => ({
      ...z,
      history: Array.from({ length: 20 }, (_, i) => ({
        time: new Date(Date.now() - (20 - i) * 5000).toISOString(),
        waterLevel: Math.max(0, z.waterLevel - (20 - i) * 0.5),
      })),
    })),
    vaults: INITIAL_VAULTS.map((v) => ({ ...v })),
    roadSegments: INITIAL_ROAD_SEGMENTS.map((r) => ({ ...r })),
    roadGraph: ROAD_GRAPH.map((r) => ({ ...r })),
    roadNodes: ROAD_NODES.map((n) => ({ ...n })),
    hospitals: EMERGENCY_HOSPITALS.map((h) => ({ ...h })),
    ambulances: INITIAL_AMBULANCES.map((a) => ({ ...a })),
    alerts: [],
    simulation: { ...INITIAL_SIMULATION_CONFIG },
    waterDiverted: 18450,
    lastUpdated: new Date().toISOString(),
    routingWeights: { ...DEFAULT_ROUTING_WEIGHTS },
    activeDiversion: null,
    diversionEvents: [],
    routingAnalytics: {
      totalDiversions: 0,
      totalWaterDiverted: 0,
      averageRoutingScore: 0,
      rejectedDestinations: 0,
      overflowWarnings: 0,
    },
    emergencyAmbulances: EMERGENCY_AMBULANCES.map((a) => ({ ...a })),
    emergencyHospitals: EMERGENCY_HOSPITALS.map((h) => ({ ...h })),
    selectedAmbulanceId: 'AMB-01',
    selectedHospitalId: 'hospital-1',
    routeCostWeights: { ...DEFAULT_ROUTE_WEIGHTS },
    emergencyRouteSet: null,
    emergencyAnalytics: {
      totalRouteCalculations: 0,
      totalRecalculations: 0,
      blockedRoadsEncountered: 0,
      safeRoutesFound: 0,
      averageRouteScore: 0,
      averageDelay: 0,
      events: [],
    },
    systemStatus: {
      weather: 'idle',
      floodDetection: 'idle',
      aiPrediction: 'idle',
      vaultNetwork: 'idle',
      waterRouting: 'idle',
      emergencyRouting: 'idle',
      simulation: 'idle',
    },
    eventLog: [],
    floodEventDemo: {
      active: false,
      phase: 'idle',
      step: 0,
      totalSteps: 10,
      startTime: null,
      endTime: null,
      summary: null,
    },
    baselineMetrics: null,
    hydroGridImpact: null,
    demoMode: 'hydrogrid',
    dataMode: getDataMode(),
    dataSourceInfo: getDataSourceInfo(),
    affectedZones: getPredefinedZones(),
    selectedZoneId: null,
    zoneInfrastructure: null,
    digitalTwin: createInitialTwinState(),
    predictionWindow: 30,
    riskPredictions: [],
    predictionMethodology: getPredictionMethodology(),
    emergencyResponse: {
      status: 'monitoring',
      triggeredBy: null,
      affectedZoneId: null,
      severity: 'low',
      unsafeRoads: [],
      availableAmbulances: [],
      ambulanceSelection: null,
      primaryRoute: null,
      alternativeRoute: null,
      activatedAt: null,
    },
    ambulanceSelection: null,
    weather: {
      data: null,
      status: 'idle',
      error: null,
      lastUpdated: null,
      pollIntervalMs: 300000,
      locationName: 'Bengaluru',
    },
    liveRisk: null,
    riskHistory: [],
    liveLocation: null,
  };
}

// Flood event demo phase sequence
const DEMO_PHASES: FloodEventDemoState['phase'][] = [
  'starting',
  'rainfall-increasing',
  'flood-risk-rising',
  'hotspot-detected',
  'vault-critical',
  'diversion-evaluating',
  'diversion-active',
  'road-flooding',
  'emergency-recalculating',
  'complete',
];

export const useStore = create<AppState & AppActions>((set, get) => ({
  ...getInitialState(),

  setSimulationConfig: (partial) =>
    set((state) => ({
      simulation: { ...state.simulation, ...partial },
    })),

  startSimulation: () =>
    set((state) => ({
      simulation: { ...state.simulation, state: 'running' },
    })),

  pauseSimulation: () =>
    set((state) => ({
      simulation: { ...state.simulation, state: 'paused' },
    })),

  resetSimulation: () => {
    set({ ...getInitialState(), simulation: { ...INITIAL_SIMULATION_CONFIG, state: 'paused' } });
  },

  triggerHeavyRain: () =>
    set((state) => ({
      simulation: {
        ...state.simulation,
        rainfallIntensity: 95,
        waterRiseRate: 5.5,
        state: 'running',
      },
    })),

  triggerExtremeRain: () =>
    set((state) => ({
      simulation: {
        ...state.simulation,
        rainfallIntensity: 140,
        waterRiseRate: 8.0,
        state: 'running',
      },
    })),

  tick: () =>
    set((state) => {
      if (state.simulation.state !== 'running') return state;

      const dt = getSpeedMultiplier(state.simulation.speed) * 0.5;

      // Track baseline metrics if in baseline mode
      let baselineMetrics = state.baselineMetrics;
      if (state.demoMode === 'baseline' && baselineMetrics) {
        const maxLevel = Math.max(...state.vaults.map((v) => v.currentLevel));
        baselineMetrics = {
          ...baselineMetrics,
          maxWaterLevel: Math.max(baselineMetrics.maxWaterLevel, maxLevel),
          criticalVaults: Math.max(baselineMetrics.criticalVaults, state.vaults.filter(v => v.riskLevel === 'critical' || v.riskLevel === 'high').length),
          floodHotspots: Math.max(baselineMetrics.floodHotspots, state.floodZones.filter(z => z.riskLevel === 'high' || z.riskLevel === 'critical').length),
          blockedRoads: Math.max(baselineMetrics.blockedRoads, state.roadSegments.filter(r => !r.accessible).length),
        };
      }

      // Update flood zones
      const updatedZones: FloodZone[] = state.floodZones.map((zone) => {
        const rise = (state.simulation.waterRiseRate * dt) * (zone.rainfall / 80);
        const newWaterLevel = Math.min(100, Math.max(0, zone.waterLevel + rise));
        const newRiskScore = Math.min(100, Math.max(0, zone.riskScore + rise * 1.2));
        const newTrend =
          rise > 0.3 ? 'up' : rise < -0.3 ? 'down' : 'stable';
        const newHistory = [
          ...zone.history.slice(-19),
          { time: new Date().toISOString(), waterLevel: newWaterLevel },
        ];
        const newCumulativeRainfall = zone.cumulativeRainfall + state.simulation.rainfallIntensity * dt * 0.05;

        return {
          ...zone,
          waterLevel: newWaterLevel,
          rainfall: state.simulation.rainfallIntensity * (0.7 + Math.random() * 0.3),
          riseRate: state.simulation.waterRiseRate,
          riskScore: newRiskScore,
          riskLevel: riskLevelFromScore(newRiskScore),
          trend: newTrend,
          history: newHistory,
          cumulativeRainfall: newCumulativeRainfall,
          previousWaterLevel: zone.waterLevel,
        };
      });

      // Update vaults
      let waterDiverted = state.waterDiverted;
      const updatedVaults: Vault[] = state.vaults.map((vault) => {
        const inflow = (state.simulation.rainfallIntensity / 150) * dt * 3;
        let newLevel = Math.min(100, Math.max(0, vault.currentLevel + inflow));

        // Auto-divert from critical vaults to connected vaults with capacity
        if (newLevel > 85) {
          const connected = state.vaults.filter(
            (v) =>
              vault.connectedVaults.includes(v.id) && v.currentLevel < 70
          );
          if (connected.length > 0) {
            const diversion = Math.min(2 * dt, newLevel - 80);
            newLevel -= diversion;
            waterDiverted += diversion * (vault.capacity / 100) * 0.1;
          }
        }

        const newRiskLevel = riskLevelFromVaultLevel(newLevel);
        const newStatus = vaultStatusFromLevel(newLevel);
        const newCumulativeRainfall = vault.cumulativeRainfall + state.simulation.rainfallIntensity * dt * 0.05;
        return {
          ...vault,
          currentLevel: newLevel,
          availableCapacity: 100 - newLevel,
          riskLevel: newRiskLevel,
          status: newStatus,
          cumulativeRainfall: newCumulativeRainfall,
          previousWaterLevel: vault.currentLevel,
        };
      });

      // Update road segments based on nearby flood zones
      const updatedRoads: RoadSegment[] = state.roadSegments.map((road) => {
        const nearbyZone = updatedZones.reduce((closest, zone) => {
          const dist = Math.abs(zone.latitude - road.start.latitude) + Math.abs(zone.longitude - road.start.longitude);
          return dist < closest.dist ? { zone, dist } : closest;
        }, { zone: updatedZones[0], dist: Infinity }).zone;

        const newRisk = nearbyZone.riskLevel;
        const accessible = newRisk !== 'critical' && newRisk !== 'high';
        return {
          ...road,
          floodRisk: newRisk,
          trafficLevel: Math.min(100, Math.max(0, road.trafficLevel + (Math.random() - 0.5) * 5)),
          accessible,
        };
      });

      // Update road graph based on flood zones
      const updatedRoadGraph: RoadGraphSegment[] = state.roadGraph.map((road) => {
        const midLat = (road.start.latitude + road.end.latitude) / 2;
        const midLon = (road.start.longitude + road.end.longitude) / 2;
        const nearbyZone = updatedZones.reduce((closest, zone) => {
          const dist = Math.abs(zone.latitude - midLat) + Math.abs(zone.longitude - midLon);
          return dist < closest.dist ? { zone, dist } : closest;
        }, { zone: updatedZones[0], dist: Infinity }).zone;

        const riskScore = (r: RiskLevel) => r === 'critical' ? 4 : r === 'high' ? 3 : r === 'medium' ? 2 : 1;
        const currentScore = riskScore(road.floodRisk);
        const zoneScore = riskScore(nearbyZone.riskLevel);

        let newFloodRisk = road.floodRisk;
        let newFloodDepth = road.floodDepth;
        let newRoadStatus = road.roadStatus;
        let newAccessible = road.accessible;

        if (zoneScore > currentScore) {
          newFloodRisk = nearbyZone.riskLevel;
          if (nearbyZone.riskLevel === 'critical') newFloodDepth = Math.max(newFloodDepth, 25);
          else if (nearbyZone.riskLevel === 'high') newFloodDepth = Math.max(newFloodDepth, 18);
          else if (nearbyZone.riskLevel === 'medium') newFloodDepth = Math.max(newFloodDepth, 8);
          else newFloodDepth = 0;
        } else if (zoneScore < currentScore && state.simulation.rainfallIntensity < 30) {
          // Recover when rain stops
          newFloodRisk = nearbyZone.riskLevel;
          newFloodDepth = Math.max(0, newFloodDepth - 2);
        }

        if (newFloodDepth >= 20 || newFloodRisk === 'critical') {
          newRoadStatus = 'closed';
          newAccessible = false;
        } else if (newFloodRisk === 'high') {
          newRoadStatus = 'at_risk';
          newAccessible = true;
        } else {
          newRoadStatus = 'open';
          newAccessible = true;
        }

        return {
          ...road,
          floodRisk: newFloodRisk,
          floodDepth: newFloodDepth,
          roadStatus: newRoadStatus,
          accessible: newAccessible,
          trafficLevel: Math.min(100, Math.max(0, road.trafficLevel + (Math.random() - 0.5) * 5)),
        };
      });

      // Update ambulances
      const updatedAmbulances: Ambulance[] = state.ambulances.map((amb) => {
        const zone = updatedZones.find((z) => z.name === amb.currentZone);
        const routeStatus =
          zone && (zone.riskLevel === 'critical' || zone.riskLevel === 'high')
            ? 'at_risk'
            : 'clear';
        return { ...amb, routeStatus, alternativeAvailable: routeStatus === 'at_risk' };
      });

      // Generate event log entries for significant changes
      const newEventLog: EventLogEntry[] = [];
      const prevRainfall = state.simulation.rainfallIntensity;
      if (Math.abs(state.simulation.rainfallIntensity - prevRainfall) > 10) {
        newEventLog.push(makeEventLogEntry('rainfall', 'info', `Rainfall changed to ${Math.round(state.simulation.rainfallIntensity)} mm/hr.`));
      }

      // Check for newly critical vaults
      for (const vault of updatedVaults) {
        const prevVault = state.vaults.find((v) => v.id === vault.id);
        if (prevVault && prevVault.riskLevel !== 'critical' && vault.riskLevel === 'critical') {
          newEventLog.push(makeEventLogEntry('vault', 'critical', `${vault.id} reached CRITICAL level (${Math.round(vault.currentLevel)}%).`));
        }
      }

      // Check for newly blocked roads
      for (const road of updatedRoads) {
        const prevRoad = state.roadSegments.find((r) => r.id === road.id);
        if (prevRoad && prevRoad.accessible && !road.accessible) {
          newEventLog.push(makeEventLogEntry('road', 'high', `${road.name} BLOCKED by flooding.`));
        }
      }

      // Check for newly critical flood zones
      for (const zone of updatedZones) {
        const prevZone = state.floodZones.find((z) => z.id === zone.id);
        if (prevZone && prevZone.riskLevel !== 'critical' && zone.riskLevel === 'critical') {
          newEventLog.push(makeEventLogEntry('flood', 'critical', `Flood risk CRITICAL in ${zone.name}.`));
        }
      }

      const allEventLog = [...newEventLog, ...state.eventLog].slice(0, 100);

      // Auto-trigger emergency response if a zone has critical/high risk and emergency is not already active
      let newEmergencyResponse = state.emergencyResponse;
      let newAmbulanceSelection = state.ambulanceSelection;
      if (
        state.emergencyResponse.status !== 'active' &&
        state.selectedZoneId
      ) {
        const selectedZone = state.affectedZones.find((z) => z.id === state.selectedZoneId);
        if (selectedZone) {
          const zoneSeverity = computeZoneSeverity(selectedZone, updatedZones, updatedVaults);
          if (zoneSeverity === 'critical' || zoneSeverity === 'high') {
            const infra = computeZoneInfrastructure(
              selectedZone,
              updatedZones,
              updatedVaults,
              updatedRoads,
              updatedRoadGraph,
              state.hospitals,
              updatedAmbulances
            );
            const unsafeRoads = infra.roadGraphInZone.filter(
              (r) => r.roadStatus === 'closed' || r.roadStatus === 'at_risk'
            );
            const selection = selectAmbulance(
              selectedZone.centerLatitude,
              selectedZone.centerLongitude,
              selectedZone,
              zoneSeverity,
              updatedAmbulances,
              state.hospitals,
              updatedRoadGraph,
              state.roadNodes,
              state.routeCostWeights
            );
            newEmergencyResponse = {
              status: 'active',
              triggeredBy: 'auto',
              affectedZoneId: state.selectedZoneId,
              severity: zoneSeverity,
              unsafeRoads,
              availableAmbulances: infra.ambulancesInZone.length > 0 ? infra.ambulancesInZone : updatedAmbulances,
              ambulanceSelection: selection,
              primaryRoute: selection.selectedAmbulance?.routeResult ?? null,
              alternativeRoute: null,
              activatedAt: new Date().toISOString(),
            };
            newAmbulanceSelection = selection;
            allEventLog.unshift(
              makeEventLogEntry('emergency', 'emergency',
                `AUTO EMERGENCY RESPONSE triggered for ${selectedZone.name}. Severity: ${zoneSeverity.toUpperCase()}.`)
            );
          }
        }
      }

      const newState: AppState = {
        ...state,
        floodZones: updatedZones,
        vaults: updatedVaults,
        roadSegments: updatedRoads,
        roadGraph: updatedRoadGraph,
        ambulances: updatedAmbulances,
        alerts: generateAlerts(updatedZones, updatedVaults, updatedRoads),
        waterDiverted,
        simulation: { ...state.simulation, tick: state.simulation.tick + 1 },
        lastUpdated: new Date().toISOString(),
        eventLog: allEventLog.slice(0, 100),
        systemStatus: computeSystemStatus({
          ...state,
          floodZones: updatedZones,
          vaults: updatedVaults,
          roadSegments: updatedRoads,
          simulation: { ...state.simulation, tick: state.simulation.tick + 1 },
        }),
        baselineMetrics,
        emergencyResponse: newEmergencyResponse,
        ambulanceSelection: newAmbulanceSelection,
      };

      return newState;
    }),

  acknowledgeAlert: (id) =>
    set((state) => ({
      alerts: state.alerts.map((a) =>
        a.id === id ? { ...a, acknowledged: true } : a
      ),
    })),

  clearAlerts: () => set({ alerts: [] }),

  setRoutingWeights: (weights) =>
    set((state) => ({
      routingWeights: { ...state.routingWeights, ...weights },
    })),

  startDiversion: (sourceId, destId, sourceLevel, destLevel, _routingScore) =>
    set((state) => {
      const destVault = state.vaults.find((v) => v.id === destId);
      if (!destVault) return state;

      const transferAmount = Math.min(
        sourceLevel - 68,
        destVault.availableCapacity - 5
      );
      const safeTransfer = Math.max(0, transferAmount);

      return {
        activeDiversion: {
          sourceVaultId: sourceId,
          destinationVaultId: destId,
          progress: 0,
          sourceStartLevel: sourceLevel,
          sourceTargetLevel: Math.max(0, sourceLevel - safeTransfer),
          destStartLevel: destLevel,
          destTargetLevel: Math.min(100, destLevel + safeTransfer),
        },
      };
    }),

  updateDiversionProgress: () =>
    set((state) => {
      if (!state.activeDiversion) return state;

      const div = state.activeDiversion;
      const newProgress = Math.min(100, div.progress + 15);

      const sourceCurrent =
        div.sourceStartLevel +
        (div.sourceTargetLevel - div.sourceStartLevel) * (newProgress / 100);
      const destCurrent =
        div.destStartLevel +
        (div.destTargetLevel - div.destStartLevel) * (newProgress / 100);

      const updatedVaults = state.vaults.map((vault) => {
        if (vault.id === div.sourceVaultId) {
          const newLevel = Math.round(sourceCurrent * 10) / 10;
          return {
            ...vault,
            currentLevel: newLevel,
            availableCapacity: 100 - newLevel,
            riskLevel: riskLevelFromVaultLevel(newLevel),
            status: vaultStatusFromLevel(newLevel),
            previousWaterLevel: vault.currentLevel,
          };
        }
        if (vault.id === div.destinationVaultId) {
          const newLevel = Math.round(destCurrent * 10) / 10;
          return {
            ...vault,
            currentLevel: newLevel,
            availableCapacity: 100 - newLevel,
            riskLevel: riskLevelFromVaultLevel(newLevel),
            status: vaultStatusFromLevel(newLevel),
            previousWaterLevel: vault.currentLevel,
          };
        }
        return vault;
      });

      let newEvents = state.diversionEvents;
      let newAnalytics = state.routingAnalytics;
      let newWaterDiverted = state.waterDiverted;
      let newActiveDiversion: ActiveDiversion | null = state.activeDiversion;
      let newAlerts = state.alerts;
      let newEventLog = state.eventLog;

      if (newProgress >= 100) {
        const sourceVault = state.vaults.find((v) => v.id === div.sourceVaultId);
        const volume = Math.round(
          ((div.sourceStartLevel - div.sourceTargetLevel) / 100) *
            (sourceVault?.capacity || 50000)
        );
        const event: DiversionEvent = {
          id: `div-${Date.now()}`,
          sourceVaultId: div.sourceVaultId,
          destinationVaultId: div.destinationVaultId,
          sourceLevelBefore: Math.round(div.sourceStartLevel * 10) / 10,
          sourceLevelAfter: Math.round(div.sourceTargetLevel * 10) / 10,
          destLevelBefore: Math.round(div.destStartLevel * 10) / 10,
          destLevelAfter: Math.round(div.destTargetLevel * 10) / 10,
          volume,
          routingScore: 0,
          timestamp: new Date().toISOString(),
        };
        newEvents = [event, ...state.diversionEvents].slice(0, 50);
        newWaterDiverted = state.waterDiverted + volume;
        newAnalytics = {
          totalDiversions: state.routingAnalytics.totalDiversions + 1,
          totalWaterDiverted: state.routingAnalytics.totalWaterDiverted + volume,
          averageRoutingScore: state.routingAnalytics.averageRoutingScore,
          rejectedDestinations: state.routingAnalytics.rejectedDestinations,
          overflowWarnings: state.routingAnalytics.overflowWarnings,
        };
        newActiveDiversion = null;
        newAlerts = [
          {
            id: `alert-diversion-${Date.now()}`,
            severity: 'info' as const,
            title: 'DIVERSION COMPLETE',
            message: `Simulated water transfer: ${div.sourceVaultId} -> ${div.destinationVaultId}. ${volume.toLocaleString()}L diverted.`,
            source: 'Routing Engine',
            timestamp: new Date().toISOString(),
            acknowledged: false,
          },
          ...state.alerts,
        ];
        newEventLog = [
          makeEventLogEntry('routing', 'info', `Water diversion complete: ${div.sourceVaultId} -> ${div.destinationVaultId} (${volume.toLocaleString()}L).`),
          ...state.eventLog,
        ].slice(0, 100);
      }

      return {
        activeDiversion: newActiveDiversion,
        vaults: updatedVaults,
        diversionEvents: newEvents,
        routingAnalytics: newAnalytics,
        waterDiverted: newWaterDiverted,
        alerts: newAlerts,
        eventLog: newEventLog,
      };
    }),

  stopDiversion: () =>
    set((state) => ({
      activeDiversion: null,
    })),

  applyScenario: (scenario) =>
    set((state) => {
      const vaultOverrides: Record<string, { level: number }> = {};
      let simConfig: Partial<SimulationConfig> = {};

      switch (scenario) {
        case 'normal':
          simConfig = { rainfallIntensity: 40, waterRiseRate: 1.5, state: 'running' };
          vaultOverrides['HG-01'] = { level: 55 };
          vaultOverrides['HG-02'] = { level: 28 };
          vaultOverrides['HG-03'] = { level: 42 };
          vaultOverrides['HG-04'] = { level: 35 };
          vaultOverrides['HG-05'] = { level: 50 };
          break;
        case 'heavy':
          simConfig = { rainfallIntensity: 85, waterRiseRate: 4.5, state: 'running' };
          vaultOverrides['HG-01'] = { level: 82 };
          vaultOverrides['HG-02'] = { level: 45 };
          vaultOverrides['HG-03'] = { level: 65 };
          vaultOverrides['HG-04'] = { level: 50 };
          vaultOverrides['HG-05'] = { level: 70 };
          break;
        case 'extreme':
          simConfig = { rainfallIntensity: 130, waterRiseRate: 7.5, state: 'running' };
          vaultOverrides['HG-01'] = { level: 92 };
          vaultOverrides['HG-02'] = { level: 55 };
          vaultOverrides['HG-03'] = { level: 78 };
          vaultOverrides['HG-04'] = { level: 62 };
          vaultOverrides['HG-05'] = { level: 85 };
          break;
        case 'one-critical':
          simConfig = { rainfallIntensity: 90, waterRiseRate: 5.0, state: 'running' };
          vaultOverrides['HG-01'] = { level: 92 };
          vaultOverrides['HG-02'] = { level: 31 };
          vaultOverrides['HG-03'] = { level: 74 };
          vaultOverrides['HG-04'] = { level: 48 };
          vaultOverrides['HG-05'] = { level: 80 };
          break;
        case 'multiple-critical':
          simConfig = { rainfallIntensity: 120, waterRiseRate: 7.0, state: 'running' };
          vaultOverrides['HG-01'] = { level: 93 };
          vaultOverrides['HG-02'] = { level: 65 };
          vaultOverrides['HG-03'] = { level: 88 };
          vaultOverrides['HG-04'] = { level: 72 };
          vaultOverrides['HG-05'] = { level: 90 };
          break;
      }

      const updatedVaults = state.vaults.map((vault) => {
        const override = vaultOverrides[vault.id];
        if (!override) return vault;
        const newLevel = override.level;
        return {
          ...vault,
          currentLevel: newLevel,
          availableCapacity: 100 - newLevel,
          riskLevel: riskLevelFromVaultLevel(newLevel),
          status: vaultStatusFromLevel(newLevel),
        };
      });

      return {
        vaults: updatedVaults,
        simulation: { ...state.simulation, ...simConfig },
        activeDiversion: null,
      };
    }),

  // ===================== Emergency Routing Actions =====================

  setSelectedAmbulance: (id) => set({ selectedAmbulanceId: id }),

  setSelectedHospital: (id) => set({ selectedHospitalId: id }),

  setRouteCostWeights: (weights) =>
    set((state) => ({
      routeCostWeights: { ...state.routeCostWeights, ...weights },
    })),

  calculateEmergencyRoutes: () =>
    set((state) => {
      const ambId = state.selectedAmbulanceId;
      const hospId = state.selectedHospitalId;
      const startNode = AMBULANCE_NODE_MAP[ambId];
      const endNode = HOSPITAL_NODE_MAP[hospId];

      if (!startNode || !endNode) return state;

      const routeSet = calculateRoutes(
        startNode,
        endNode,
        state.roadGraph,
        state.roadNodes,
        state.routeCostWeights
      );
      routeSet.ambulanceId = ambId;
      routeSet.hospitalId = hospId;

      const newEvent: EmergencyEvent = {
        id: `emg-${Date.now()}`,
        type: 'route_recalculated',
        ambulanceId: ambId,
        message: `Route recalculated for ${ambId}. Recommended: ${routeSet.recommended?.status === 'recommended' ? 'Route C' : 'No safe route'}.`,
        timestamp: new Date().toISOString(),
      };

      const newAnalytics: EmergencyAnalytics = {
        ...state.emergencyAnalytics,
        totalRouteCalculations: state.emergencyAnalytics.totalRouteCalculations + 1,
        totalRecalculations: state.emergencyAnalytics.totalRecalculations + 1,
        safeRoutesFound: state.emergencyAnalytics.safeRoutesFound + (routeSet.hasSafeRoute ? 1 : 0),
        averageRouteScore: routeSet.recommended
          ? Math.round((state.emergencyAnalytics.averageRouteScore * state.emergencyAnalytics.totalRouteCalculations + routeSet.recommended.routeScore) / (state.emergencyAnalytics.totalRouteCalculations + 1))
          : state.emergencyAnalytics.averageRouteScore,
        events: [newEvent, ...state.emergencyAnalytics.events].slice(0, 50),
      };

      const blockedRoads = state.roadGraph.filter(r => !r.accessible).length;
      const newEventLog = [
        makeEventLogEntry('emergency', routeSet.hasSafeRoute ? 'info' : 'critical',
          `Emergency route calculated for ${ambId}. ${routeSet.hasSafeRoute ? 'Safe route found.' : 'NO SAFE ROUTE available.'}`),
        ...state.eventLog,
      ].slice(0, 100);

      return {
        emergencyRouteSet: routeSet,
        emergencyAnalytics: {
          ...newAnalytics,
          blockedRoadsEncountered: state.emergencyAnalytics.blockedRoadsEncountered + blockedRoads,
        },
        eventLog: newEventLog,
      };
    }),

  clearEmergencyRoutes: () => set({ emergencyRouteSet: null }),

  runEmergencyDemo: () =>
    set((state) => {
      // Set up extreme rain, block a road, then calculate routes
      const updatedRoadGraph = state.roadGraph.map((road) => {
        if (road.id === 'R1') {
          return {
            ...road,
            floodRisk: 'critical' as RiskLevel,
            floodDepth: 28,
            roadStatus: 'closed' as const,
            accessible: false,
          };
        }
        return road;
      });

      const updatedRoads = state.roadSegments.map((road) => {
        if (road.id === 'road-1') {
          return { ...road, floodRisk: 'critical' as RiskLevel, accessible: false };
        }
        return road;
      });

      const startNode = AMBULANCE_NODE_MAP['AMB-01'];
      const endNode = HOSPITAL_NODE_MAP['hospital-1'];
      const routeSet = calculateRoutes(
        startNode,
        endNode,
        updatedRoadGraph,
        state.roadNodes,
        state.routeCostWeights
      );
      routeSet.ambulanceId = 'AMB-01';
      routeSet.hospitalId = 'hospital-1';

      const newEventLog = [
        makeEventLogEntry('emergency', 'critical', 'EMERGENCY DEMO: Road R1 (MG Road Extension) reached critical flood depth.'),
        makeEventLogEntry('emergency', 'high', 'Normal ambulance route BLOCKED. Recalculating...'),
        makeEventLogEntry('emergency', routeSet.hasSafeRoute ? 'info' : 'critical',
          routeSet.hasSafeRoute ? 'Alternative safe route identified for AMB-01.' : 'NO SAFE ROUTE available for AMB-01.'),
        ...state.eventLog,
      ].slice(0, 100);

      return {
        roadGraph: updatedRoadGraph,
        roadSegments: updatedRoads,
        emergencyRouteSet: routeSet,
        simulation: { ...state.simulation, rainfallIntensity: 110, waterRiseRate: 6.0, state: 'running' },
        alerts: [
          {
            id: `alert-emg-${Date.now()}`,
            severity: 'critical' as const,
            title: 'EMERGENCY ROUTE BLOCKED',
            message: 'Road R1 has reached critical flood depth. Route recalculated.',
            source: 'Emergency Engine',
            timestamp: new Date().toISOString(),
            acknowledged: false,
          },
          ...state.alerts,
        ],
        eventLog: newEventLog,
      };
    }),

  // ===================== Full System Integration Actions =====================

  addEventLog: (category, severity, message) =>
    set((state) => ({
      eventLog: [makeEventLogEntry(category, severity, message), ...state.eventLog].slice(0, 100),
    })),

  clearEventLog: () => set({ eventLog: [] }),

  runFloodEventDemo: () =>
    set((state) => {
      // Reset to safe starting conditions
      const safeVaults = state.vaults.map((v) => ({
        ...v,
        currentLevel: Math.min(45, v.currentLevel),
        availableCapacity: Math.max(55, v.availableCapacity),
        riskLevel: 'low' as RiskLevel,
        status: 'normal' as VaultStatus,
      }));

      const safeZones = state.floodZones.map((z) => ({
        ...z,
        waterLevel: Math.min(30, z.waterLevel),
        riskScore: Math.min(25, z.riskScore),
        riskLevel: 'low' as RiskLevel,
        trend: 'stable' as const,
      }));

      const safeRoads = state.roadSegments.map((r) => ({
        ...r,
        floodRisk: 'low' as RiskLevel,
        accessible: true,
      }));

      const safeRoadGraph = state.roadGraph.map((r) => ({
        ...r,
        floodRisk: 'low' as RiskLevel,
        floodDepth: 0,
        roadStatus: 'open' as const,
        accessible: true,
      }));

      return {
        floodZones: safeZones,
        vaults: safeVaults,
        roadSegments: safeRoads,
        roadGraph: safeRoadGraph,
        simulation: {
          ...state.simulation,
          rainfallIntensity: 20,
          waterRiseRate: 1.0,
          state: 'running',
          tick: 0,
        },
        activeDiversion: null,
        emergencyRouteSet: null,
        waterDiverted: state.waterDiverted,
        alerts: [],
        eventLog: [
          makeEventLogEntry('system', 'info', 'FLOOD EVENT DEMO STARTED: Extreme Urban Rainfall Event.'),
          makeEventLogEntry('rainfall', 'info', 'Initial rainfall: 20 mm/hr. All systems nominal.'),
        ],
        floodEventDemo: {
          active: true,
          phase: 'starting',
          step: 0,
          totalSteps: 10,
          startTime: new Date().toISOString(),
          endTime: null,
          summary: null,
        },
        baselineMetrics: {
          maxWaterLevel: 0,
          criticalVaults: 0,
          floodHotspots: 0,
          overflowEvents: 0,
          blockedRoads: 0,
          emergencyDelay: 0,
          waterDiverted: 0,
        },
      };
    }),

  advanceFloodEventDemo: () =>
    set((state) => {
      if (!state.floodEventDemo.active) return state;

      const step = state.floodEventDemo.step + 1;
      const phase = DEMO_PHASES[Math.min(step, DEMO_PHASES.length - 1)];
      let newEventLog = state.eventLog;
      let newAlerts = state.alerts;
      let newSimulation = state.simulation;
      let newVaults = state.vaults;
      let newZones = state.floodZones;
      let newRoads = state.roadSegments;
      let newRoadGraph = state.roadGraph;
      let newEmergencyRouteSet = state.emergencyRouteSet;
      let newActiveDiversion = state.activeDiversion;
      let newWaterDiverted = state.waterDiverted;
      let summary = state.floodEventDemo.summary;

      // Rainfall progression: 20 -> 40 -> 60 -> 80 -> 100 -> 120
      const rainfallSteps = [20, 40, 60, 80, 100, 120, 120, 120, 120, 120];
      const targetRainfall = rainfallSteps[Math.min(step, rainfallSteps.length - 1)];
      newSimulation = {
        ...state.simulation,
        rainfallIntensity: targetRainfall,
        waterRiseRate: 1.0 + step * 0.8,
        state: 'running',
      };

      // Gradually increase water levels
      const risePerStep = step * 1.5;
      newZones = state.floodZones.map((zone) => {
        const newWaterLevel = Math.min(100, zone.waterLevel + risePerStep);
        const newRiskScore = Math.min(100, zone.riskScore + risePerStep * 1.3);
        return {
          ...zone,
          waterLevel: newWaterLevel,
          riskScore: newRiskScore,
          riskLevel: riskLevelFromScore(newRiskScore),
          trend: 'up' as const,
          rainfall: targetRainfall,
        };
      });

      newVaults = state.vaults.map((vault) => {
        const inflow = (targetRainfall / 150) * step * 2.5;
        const newLevel = Math.min(100, vault.currentLevel + inflow);
        return {
          ...vault,
          currentLevel: newLevel,
          availableCapacity: 100 - newLevel,
          riskLevel: riskLevelFromVaultLevel(newLevel),
          status: vaultStatusFromLevel(newLevel),
        };
      });

      // Update roads based on zone risk
      newRoadGraph = state.roadGraph.map((road) => {
        const midLat = (road.start.latitude + road.end.latitude) / 2;
        const midLon = (road.start.longitude + road.end.longitude) / 2;
        const nearbyZone = newZones.reduce((closest, zone) => {
          const dist = Math.abs(zone.latitude - midLat) + Math.abs(zone.longitude - midLon);
          return dist < closest.dist ? { zone, dist } : closest;
        }, { zone: newZones[0], dist: Infinity }).zone;

        let newFloodRisk = road.floodRisk;
        let newFloodDepth = road.floodDepth;
        let newRoadStatus = road.roadStatus;
        let newAccessible = road.accessible;

        const riskScore = (r: RiskLevel) => r === 'critical' ? 4 : r === 'high' ? 3 : r === 'medium' ? 2 : 1;
        if (riskScore(nearbyZone.riskLevel) > riskScore(road.floodRisk)) {
          newFloodRisk = nearbyZone.riskLevel;
          if (nearbyZone.riskLevel === 'critical') newFloodDepth = Math.max(newFloodDepth, 25);
          else if (nearbyZone.riskLevel === 'high') newFloodDepth = Math.max(newFloodDepth, 18);
          else if (nearbyZone.riskLevel === 'medium') newFloodDepth = Math.max(newFloodDepth, 8);
        }

        if (newFloodDepth >= 20 || newFloodRisk === 'critical') {
          newRoadStatus = 'closed';
          newAccessible = false;
        } else if (newFloodRisk === 'high') {
          newRoadStatus = 'at_risk';
          newAccessible = true;
        }

        return { ...road, floodRisk: newFloodRisk, floodDepth: newFloodDepth, roadStatus: newRoadStatus, accessible: newAccessible };
      });

      newRoads = state.roadSegments.map((road) => {
        const nearbyZone = newZones.reduce((closest, zone) => {
          const dist = Math.abs(zone.latitude - road.start.latitude) + Math.abs(zone.longitude - road.start.longitude);
          return dist < closest.dist ? { zone, dist } : closest;
        }, { zone: newZones[0], dist: Infinity }).zone;
        return {
          ...road,
          floodRisk: nearbyZone.riskLevel,
          accessible: nearbyZone.riskLevel !== 'critical' && nearbyZone.riskLevel !== 'high',
        };
      });

      // Phase-specific actions
      switch (phase) {
        case 'starting':
          newEventLog = [makeEventLogEntry('system', 'info', 'Demo initialized. All systems in safe state.'), ...newEventLog].slice(0, 100);
          break;
        case 'rainfall-increasing':
          newEventLog = [makeEventLogEntry('rainfall', 'info', `Rainfall increasing to ${targetRainfall} mm/hr.`), ...newEventLog].slice(0, 100);
          break;
        case 'flood-risk-rising':
          newEventLog = [makeEventLogEntry('flood', 'warning', 'Flood risk rising across zones. AI prediction engine active.'), ...newEventLog].slice(0, 100);
          break;
        case 'hotspot-detected': {
          const hotspot = newZones.reduce((max, z) => z.riskScore > max.riskScore ? z : max, newZones[0]);
          newEventLog = [
            makeEventLogEntry('flood', 'critical', `Flood hotspot detected: ${hotspot.name}. Risk: ${hotspot.riskLevel.toUpperCase()}. Probability: ${Math.round(hotspot.riskScore)}%.`),
            ...newEventLog,
          ].slice(0, 100);
          newAlerts = [
            {
              id: `alert-hotspot-${Date.now()}`,
              severity: 'critical' as const,
              title: 'FLOOD HOTSPOT',
              message: `${hotspot.name} identified as critical flood hotspot (${Math.round(hotspot.riskScore)}% risk).`,
              source: hotspot.name,
              timestamp: new Date().toISOString(),
              acknowledged: false,
            },
            ...newAlerts,
          ];
          break;
        }
        case 'vault-critical': {
          const criticalVault = newVaults.reduce((max, v) => v.currentLevel > max.currentLevel ? v : max, newVaults[0]);
          newEventLog = [
            makeEventLogEntry('vault', 'critical', `${criticalVault.id} reached CRITICAL (${Math.round(criticalVault.currentLevel)}% full).`),
            ...newEventLog,
          ].slice(0, 100);
          newAlerts = [
            {
              id: `alert-vault-crit-${Date.now()}`,
              severity: 'critical' as const,
              title: 'VAULT CRITICAL',
              message: `${criticalVault.id} at ${Math.round(criticalVault.currentLevel)}% capacity. Diversion required.`,
              source: criticalVault.id,
              timestamp: new Date().toISOString(),
              acknowledged: false,
            },
            ...newAlerts,
          ];
          break;
        }
        case 'diversion-evaluating': {
          newEventLog = [
            makeEventLogEntry('routing', 'info', 'Smart routing engine evaluating available diversion destinations...'),
            ...newEventLog,
          ].slice(0, 100);
          break;
        }
        case 'diversion-active': {
          const criticalVault = newVaults.reduce((max, v) => v.currentLevel > max.currentLevel ? v : max, newVaults[0]);
          const destVault = newVaults.find(v => v.connectedVaults.includes(criticalVault.id) && v.currentLevel < 60);
          if (criticalVault && destVault) {
            const transferAmount = Math.min(criticalVault.currentLevel - 68, destVault.availableCapacity - 5);
            newActiveDiversion = {
              sourceVaultId: criticalVault.id,
              destinationVaultId: destVault.id,
              progress: 50,
              sourceStartLevel: criticalVault.currentLevel,
              sourceTargetLevel: Math.max(0, criticalVault.currentLevel - transferAmount),
              destStartLevel: destVault.currentLevel,
              destTargetLevel: Math.min(100, destVault.currentLevel + transferAmount),
            };
            // Apply the transfer immediately for demo
            newVaults = newVaults.map(v => {
              if (v.id === criticalVault.id) {
                const newLevel = Math.max(0, criticalVault.currentLevel - transferAmount);
                return { ...v, currentLevel: newLevel, availableCapacity: 100 - newLevel, riskLevel: riskLevelFromVaultLevel(newLevel), status: vaultStatusFromLevel(newLevel) };
              }
              if (v.id === destVault.id) {
                const newLevel = Math.min(100, destVault.currentLevel + transferAmount);
                return { ...v, currentLevel: newLevel, availableCapacity: 100 - newLevel, riskLevel: riskLevelFromVaultLevel(newLevel), status: vaultStatusFromLevel(newLevel) };
              }
              return v;
            });
            const volume = Math.round((transferAmount / 100) * (criticalVault.capacity || 50000));
            newWaterDiverted = state.waterDiverted + volume;
            newEventLog = [
              makeEventLogEntry('routing', 'info', `SIMULATED WATER DIVERSION: ${criticalVault.id} -> ${destVault.id}. ${volume.toLocaleString()}L diverted.`),
              ...newEventLog,
            ].slice(0, 100);
            newActiveDiversion = null;
          }
          break;
        }
        case 'road-flooding': {
          // Update road graph with flood conditions from zones
          const blockedRoad = newRoadGraph.find(r => r.roadStatus === 'closed');
          if (blockedRoad) {
            newEventLog = [
              makeEventLogEntry('road', 'high', `${blockedRoad.name} BLOCKED by flooding (depth: ${blockedRoad.floodDepth}cm).`),
              ...newEventLog,
            ].slice(0, 100);
            newAlerts = [
              {
                id: `alert-road-${Date.now()}`,
                severity: 'high' as const,
                title: 'ROAD BLOCKED',
                message: `${blockedRoad.name} is now blocked due to flooding.`,
                source: blockedRoad.name,
                timestamp: new Date().toISOString(),
                acknowledged: false,
              },
              ...newAlerts,
            ];
          }
          break;
        }
        case 'emergency-recalculating': {
          const startNode = AMBULANCE_NODE_MAP['AMB-01'];
          const endNode = HOSPITAL_NODE_MAP['hospital-1'];
          const routeSet = calculateRoutes(startNode, endNode, newRoadGraph, state.roadNodes, state.routeCostWeights);
          routeSet.ambulanceId = 'AMB-01';
          routeSet.hospitalId = 'hospital-1';
          newEmergencyRouteSet = routeSet;
          newEventLog = [
            makeEventLogEntry('emergency', routeSet.hasSafeRoute ? 'info' : 'critical',
              routeSet.hasSafeRoute
                ? `ALTERNATIVE ROUTE RECOMMENDED for AMB-01. Estimated time: ${routeSet.recommended?.estimatedTime || 0} min.`
                : 'NO SAFE ROUTE AVAILABLE for AMB-01. Emergency coordination required.'),
            ...newEventLog,
          ].slice(0, 100);
          newAlerts = [
            {
              id: `alert-emg-route-${Date.now()}`,
              severity: routeSet.hasSafeRoute ? 'info' : 'critical' as const,
              title: routeSet.hasSafeRoute ? 'SAFE ROUTE AVAILABLE' : 'NO SAFE ROUTE',
              message: routeSet.hasSafeRoute
                ? `Recommended route avoids flooded segments. ETA: ${routeSet.recommended?.estimatedTime || 0} min.`
                : 'All routes blocked. Emergency coordination required.',
              source: 'Emergency Engine',
              timestamp: new Date().toISOString(),
              acknowledged: false,
            },
            ...newAlerts,
          ];
          break;
        }
        case 'complete': {
          const peakRainfall = Math.max(...rainfallSteps);
          const highestRisk = Math.max(...newZones.map(z => z.riskScore));
          const criticalCount = newVaults.filter(v => v.riskLevel === 'critical' || v.riskLevel === 'high').length;
          const blockedCount = newRoadGraph.filter(r => !r.accessible).length;
          const emergencyRoute = newEmergencyRouteSet?.recommended?.status === 'recommended' ? 'Route C (Recommended)' : newEmergencyRouteSet?.safest?.status === 'safe' ? 'Route B (Safest)' : 'No safe route';
          const emergencyDelay = newEmergencyRouteSet?.recommended?.estimatedTime
            ? Math.max(0, newEmergencyRouteSet.recommended.estimatedTime - 11)
            : 0;

          summary = {
            peakRainfall,
            highestFloodRisk: Math.round(highestRisk),
            waterDiverted: Math.round(newWaterDiverted - state.waterDiverted + (state.routingAnalytics.totalWaterDiverted || 0)),
            criticalVaults: criticalCount,
            blockedRoads: blockedCount,
            emergencyRoute,
            emergencyDelay,
            responseSteps: [
              'Flood hotspot detected',
              'Risk predicted by AI',
              'Critical vault identified',
              'Water diversion evaluated',
              'Stormwater routed to safe destination',
              'Road risk updated',
              'Emergency route recalculated',
            ],
          };

          newEventLog = [
            makeEventLogEntry('system', 'info', 'FLOOD EVENT DEMO COMPLETE. Summary generated.'),
            ...newEventLog,
          ].slice(0, 100);
          break;
        }
      }

      const isComplete = step >= state.floodEventDemo.totalSteps;

      return {
        simulation: newSimulation,
        floodZones: newZones,
        vaults: newVaults,
        roadSegments: newRoads,
        roadGraph: newRoadGraph,
        emergencyRouteSet: newEmergencyRouteSet,
        activeDiversion: newActiveDiversion,
        waterDiverted: newWaterDiverted,
        alerts: newAlerts,
        eventLog: newEventLog,
        systemStatus: computeSystemStatus({ ...state, floodZones: newZones, vaults: newVaults, roadSegments: newRoads, simulation: newSimulation }),
        floodEventDemo: {
          ...state.floodEventDemo,
          step,
          phase: isComplete ? 'complete' : phase,
          endTime: isComplete ? new Date().toISOString() : null,
          summary: isComplete ? summary : state.floodEventDemo.summary,
          active: !isComplete,
        },
      };
    }),

  resetFloodEventDemo: () =>
    set((state) => ({
      floodEventDemo: {
        active: false,
        phase: 'idle',
        step: 0,
        totalSteps: 10,
        startTime: null,
        endTime: null,
        summary: null,
      },
      hydroGridImpact: null,
      baselineMetrics: null,
    })),

  setDemoMode: (mode) => set({ demoMode: mode }),

  computeImpact: () =>
    set((state) => {
      const withHydroGrid: BaselineMetrics = {
        maxWaterLevel: Math.max(...state.vaults.map(v => v.currentLevel)),
        criticalVaults: state.vaults.filter(v => v.riskLevel === 'critical' || v.riskLevel === 'high').length,
        floodHotspots: state.floodZones.filter(z => z.riskLevel === 'high' || z.riskLevel === 'critical').length,
        overflowEvents: state.vaults.filter(v => v.currentLevel >= 95).length,
        blockedRoads: state.roadSegments.filter(r => !r.accessible).length,
        emergencyDelay: state.emergencyRouteSet?.recommended?.estimatedTime || 0,
        waterDiverted: Math.round(state.waterDiverted),
      };

      const withoutHydroGrid: BaselineMetrics = {
        maxWaterLevel: Math.min(100, Math.max(...state.vaults.map(v => v.currentLevel)) + 15),
        criticalVaults: Math.min(state.vaults.length, state.vaults.filter(v => v.riskLevel === 'critical' || v.riskLevel === 'high').length + 2),
        floodHotspots: Math.min(state.floodZones.length, state.floodZones.filter(z => z.riskLevel === 'high' || z.riskLevel === 'critical').length + 1),
        overflowEvents: Math.max(1, state.vaults.filter(v => v.currentLevel >= 95).length + 1),
        blockedRoads: Math.min(state.roadSegments.length, state.roadSegments.filter(r => !r.accessible).length + 1),
        emergencyDelay: (state.emergencyRouteSet?.recommended?.estimatedTime || 14) + 6,
        waterDiverted: 0,
      };

      return {
        hydroGridImpact: {
          withHydroGrid,
          withoutHydroGrid,
        },
      };
    }),

  // ===================== Real-Time Data Layer Actions =====================

  setDataMode: (mode) => {
    setHydroDataMode(mode);
    set({ dataMode: getDataMode(), dataSourceInfo: getDataSourceInfo() });
  },

  // ===================== Affected Zone Actions =====================

  setSelectedZone: (zoneId) =>
    set((state) => {
      if (zoneId === null) {
        return {
          selectedZoneId: null,
          zoneInfrastructure: null,
          digitalTwin: { ...state.digitalTwin, affectedZoneId: null, entities: [] },
        };
      }
      const zone = state.affectedZones.find((z) => z.id === zoneId);
      if (!zone) return state;

      const infra = computeZoneInfrastructure(
        zone,
        state.floodZones,
        state.vaults,
        state.roadSegments,
        state.roadGraph,
        state.hospitals,
        state.ambulances
      );
      const severity = computeZoneSeverity(zone, state.floodZones, state.vaults);
      const updatedZone = { ...zone, severity, active: true };

      const predictions = predictAllZones(state.floodZones, state.predictionWindow);
      const predMap = new Map<string, { predictedRisk: RiskLevel; predictedScore: number }>();
      predictions.forEach((p) => {
        predMap.set(`flood-${p.zoneId}`, { predictedRisk: p.predictedRisk, predictedScore: p.predictedRiskScore });
      });

      const twinEntities = buildTwinEntities(
        zone,
        state.floodZones,
        state.vaults,
        state.roadSegments,
        state.roadGraph,
        state.hospitals,
        state.ambulances,
        predMap
      );

      return {
        selectedZoneId: zoneId,
        affectedZones: state.affectedZones.map((z) => ({
          ...z,
          active: z.id === zoneId,
          severity: z.id === zoneId ? severity : z.severity,
        })),
        zoneInfrastructure: infra,
        digitalTwin: {
          ...state.digitalTwin,
          affectedZoneId: zoneId,
          entities: twinEntities,
        },
        riskPredictions: predictions,
      };
    }),

  setZoneRadius: (radiusKm) =>
    set((state) => {
      if (!state.selectedZoneId) return state;
      const zone = state.affectedZones.find((z) => z.id === state.selectedZoneId);
      if (!zone) return state;
      const updatedZone = { ...zone, radiusKm };
      const infra = computeZoneInfrastructure(
        updatedZone,
        state.floodZones,
        state.vaults,
        state.roadSegments,
        state.roadGraph,
        state.hospitals,
        state.ambulances
      );
      return {
        affectedZones: state.affectedZones.map((z) =>
          z.id === state.selectedZoneId ? updatedZone : z
        ),
        zoneInfrastructure: infra,
      };
    }),

  addCustomZone: (name, lat, lon, radiusKm) =>
    set((state) => ({
      affectedZones: [...state.affectedZones, createCustomZone(name, lat, lon, radiusKm)],
    })),

  refreshZoneInfrastructure: () =>
    set((state) => {
      if (!state.selectedZoneId) return state;
      const zone = state.affectedZones.find((z) => z.id === state.selectedZoneId);
      if (!zone) return state;
      const infra = computeZoneInfrastructure(
        zone,
        state.floodZones,
        state.vaults,
        state.roadSegments,
        state.roadGraph,
        state.hospitals,
        state.ambulances
      );
      const severity = computeZoneSeverity(zone, state.floodZones, state.vaults);
      return {
        zoneInfrastructure: infra,
        affectedZones: state.affectedZones.map((z) =>
          z.id === state.selectedZoneId ? { ...z, severity } : z
        ),
      };
    }),

  // ===================== Digital Twin Actions =====================

  setTwinViewState: (view) =>
    set((state) => ({
      digitalTwin: toggleTwinView(state.digitalTwin, view),
    })),

  setTwinPlaying: (playing) =>
    set((state) => ({
      digitalTwin: setTwinPlaying(state.digitalTwin, playing),
    })),

  setTwinSpeed: (speed) =>
    set((state) => ({
      digitalTwin: setTwinSpeed(state.digitalTwin, speed),
    })),

  advanceTwinStep: () =>
    set((state) => ({
      digitalTwin: advanceTwinStep(state.digitalTwin),
    })),

  resetTwin: () =>
    set((state) => ({
      digitalTwin: resetTwin(state.digitalTwin),
    })),

  refreshDigitalTwin: () =>
    set((state) => {
      if (!state.selectedZoneId) return state;
      const zone = state.affectedZones.find((z) => z.id === state.selectedZoneId);
      if (!zone) return state;
      const predictions = predictAllZones(state.floodZones, state.predictionWindow);
      const predMap = new Map<string, { predictedRisk: RiskLevel; predictedScore: number }>();
      predictions.forEach((p) => {
        predMap.set(`flood-${p.zoneId}`, { predictedRisk: p.predictedRisk, predictedScore: p.predictedRiskScore });
        predMap.set(`vault-${p.zoneId}`, { predictedRisk: p.predictedRisk, predictedScore: p.predictedRiskScore });
      });
      const twinEntities = buildTwinEntities(
        zone,
        state.floodZones,
        state.vaults,
        state.roadSegments,
        state.roadGraph,
        state.hospitals,
        state.ambulances,
        predMap
      );
      return {
        digitalTwin: { ...state.digitalTwin, entities: twinEntities },
        riskPredictions: predictions,
      };
    }),

  // ===================== Prediction Actions =====================

  setPredictionWindow: (window) =>
    set((state) => {
      const predictions = predictAllZones(state.floodZones, window);
      return {
        predictionWindow: window,
        riskPredictions: predictions,
      };
    }),

  refreshPredictions: () =>
    set((state) => ({
      riskPredictions: predictAllZones(state.floodZones, state.predictionWindow),
    })),

  // ===================== Emergency Response Engine Actions =====================

  triggerEmergencyResponse: (zoneId, manual) =>
    set((state) => {
      const zone = state.affectedZones.find((z) => z.id === zoneId);
      if (!zone) return state;

      const infra = computeZoneInfrastructure(
        zone,
        state.floodZones,
        state.vaults,
        state.roadSegments,
        state.roadGraph,
        state.hospitals,
        state.ambulances
      );
      const severity = computeZoneSeverity(zone, state.floodZones, state.vaults);
      const unsafeRoads = infra.roadGraphInZone.filter(
        (r) => r.roadStatus === 'closed' || r.roadStatus === 'at_risk'
      );
      const availableAmbulances = infra.ambulancesInZone.length > 0
        ? infra.ambulancesInZone
        : state.ambulances;

      const selection = selectAmbulance(
        zone.centerLatitude,
        zone.centerLongitude,
        zone,
        severity,
        state.ambulances,
        state.hospitals,
        state.roadGraph,
        state.roadNodes,
        state.routeCostWeights
      );

      const newEventLog = [
        makeEventLogEntry('emergency', 'emergency',
          `EMERGENCY RESPONSE ${manual ? 'MANUALLY' : 'AUTO'} ACTIVATED for ${zone.name}. Severity: ${severity.toUpperCase()}.`),
        makeEventLogEntry('emergency', 'high',
          selection.selectedAmbulance
            ? `Selected ambulance: ${selection.selectedAmbulance.ambulanceId}. ETA: ${selection.selectedAmbulance.estimatedTravelTime} min. Safety: ${selection.selectedAmbulance.selectionScore}%.`
            : 'No ambulance available in affected zone.'),
        ...state.eventLog,
      ].slice(0, 100);

      return {
        emergencyResponse: {
          status: 'active',
          triggeredBy: manual ? 'manual' : 'auto',
          affectedZoneId: zoneId,
          severity,
          unsafeRoads,
          availableAmbulances,
          ambulanceSelection: selection,
          primaryRoute: selection.selectedAmbulance?.routeResult ?? null,
          alternativeRoute: null,
          activatedAt: new Date().toISOString(),
        },
        ambulanceSelection: selection,
        eventLog: newEventLog,
      };
    }),

  clearEmergencyResponse: () =>
    set((state) => ({
      emergencyResponse: {
        status: 'monitoring',
        triggeredBy: null,
        affectedZoneId: null,
        severity: 'low',
        unsafeRoads: [],
        availableAmbulances: [],
        ambulanceSelection: null,
        primaryRoute: null,
        alternativeRoute: null,
        activatedAt: null,
      },
      ambulanceSelection: null,
      eventLog: [
        makeEventLogEntry('emergency', 'info', 'Emergency response deactivated. Returning to monitoring mode.'),
        ...state.eventLog,
      ].slice(0, 100),
    })),

  setEmergencyResponseStatus: (status) =>
    set((state) => ({
      emergencyResponse: { ...state.emergencyResponse, status },
    })),

  // ===================== Live Weather + Risk Actions =====================

  setLiveLocation: (lat, lon, name) =>
    set((state) => ({
      liveLocation: { latitude: lat, longitude: lon, name },
      weather: { ...state.weather, locationName: name },
    })),

  fetchWeather: async () => {
    const state = get();
    const loc = state.liveLocation;
    if (!loc) return;

    set({
      weather: { ...state.weather, status: 'fetching', error: null },
    });

    try {
      const weatherData = await getCurrentWeather(loc.latitude, loc.longitude);

      const zone = getZoneForLocation(loc.latitude, loc.longitude, state.floodZones);
      const prevScore = state.liveRisk?.score ?? 0;
      const prevLevel = state.liveRisk?.level ?? 'low';

      const risk = calculateLiveRisk(
        {
          weather: weatherData,
          zoneWaterLevel: zone?.waterLevel ?? 50,
          zoneDrainageCapacity: zone?.drainageCapacity ?? 60,
          zoneHistoricalFloodFrequency: zone?.historicalFloodFrequency ?? 0.3,
          zoneRiseRate: zone?.riseRate ?? 0,
        },
        prevScore,
        prevLevel
      );

      const historyEntry: RiskHistoryEntry = {
        timestamp: weatherData.timestamp,
        location: loc.name,
        temperature: weatherData.temperature,
        precipitation: weatherData.precipitation,
        humidity: weatherData.humidity,
        windSpeed: weatherData.windSpeed,
        forecastPrecipitation: weatherData.forecastPrecipitation,
        riskScore: risk.score,
        riskLevel: risk.level,
        dataSource: 'live',
      };

      const newEventLog = [
        makeEventLogEntry('weather', 'info',
          `Live weather fetched for ${loc.name}: ${weatherData.weatherDescription}, ${weatherData.temperature}°C, ${weatherData.precipitation}mm precipitation. Risk: ${risk.level.toUpperCase()} (${risk.score}/100).`),
        ...state.eventLog,
      ].slice(0, 100);

      set({
        weather: {
          data: weatherData,
          status: 'success',
          error: null,
          lastUpdated: weatherData.timestamp,
          pollIntervalMs: state.weather.pollIntervalMs,
          locationName: loc.name,
        },
        liveRisk: risk,
        riskHistory: [...state.riskHistory, historyEntry].slice(-50),
        eventLog: newEventLog,
      });
    } catch (err) {
      set({
        weather: {
          ...state.weather,
          status: 'error',
          error: err instanceof Error ? err.message : 'Failed to fetch weather data',
        },
      });
    }
  },

  setWeatherPollInterval: (ms) =>
    set((state) => ({
      weather: { ...state.weather, pollIntervalMs: ms },
    })),

  clearWeather: () =>
    set((state) => ({
      weather: {
        data: null,
        status: 'idle',
        error: null,
        lastUpdated: null,
        pollIntervalMs: state.weather.pollIntervalMs,
        locationName: state.weather.locationName,
      },
      liveRisk: null,
    })),
}));
