import type {
  DigitalTwinState,
  TwinEntityState,
  TwinViewState,
  AffectedZone,
  FloodZone,
  Vault,
  RoadSegment,
  RoadGraphSegment,
  Hospital,
  Ambulance,
  RiskLevel,
  SimulationSpeed,
} from '@/types';
import { computeZoneInfrastructure } from '@/services/affectedZone';

export function buildTwinEntities(
  zone: AffectedZone,
  floodZones: FloodZone[],
  vaults: Vault[],
  roadSegments: RoadSegment[],
  roadGraph: RoadGraphSegment[],
  hospitals: Hospital[],
  ambulances: Ambulance[],
  predictions: Map<string, { predictedRisk: RiskLevel; predictedScore: number }>
): TwinEntityState[] {
  const infra = computeZoneInfrastructure(
    zone,
    floodZones,
    vaults,
    roadSegments,
    roadGraph,
    hospitals,
    ambulances
  );

  const entities: TwinEntityState[] = [];

  for (const road of infra.roadGraphInZone) {
    const midLat = (road.start.latitude + road.end.latitude) / 2;
    const midLon = (road.start.longitude + road.end.longitude) / 2;
    const currentState = road.roadStatus === 'closed'
      ? 'FLOODED / BLOCKED'
      : road.roadStatus === 'at_risk'
        ? 'MODERATE RISK'
        : 'SAFE';
    const pred = predictions.get(`road-${road.id}`);
    const predictedState = pred?.predictedRisk === 'critical'
      ? 'PREDICTED: FLOODED'
      : pred?.predictedRisk === 'high'
        ? 'PREDICTED: HIGH RISK'
        : 'PREDICTED: SAFE';
    entities.push({
      id: road.id,
      type: 'road',
      currentState,
      predictedState,
      position: { latitude: midLat, longitude: midLon },
      riskLevel: road.floodRisk,
      predictedRiskLevel: pred?.predictedRisk ?? road.floodRisk,
    });
  }

  for (const hospital of infra.hospitalsInZone) {
    entities.push({
      id: hospital.id,
      type: 'hospital',
      currentState: 'OPERATIONAL',
      predictedState: 'PREDICTED: OPERATIONAL',
      position: { latitude: hospital.latitude, longitude: hospital.longitude },
      riskLevel: 'low',
      predictedRiskLevel: 'low',
    });
  }

  for (const amb of infra.ambulancesInZone) {
    const currentState = amb.routeStatus === 'blocked'
      ? 'BLOCKED'
      : amb.routeStatus === 'at_risk'
        ? 'AT RISK'
        : 'AVAILABLE';
    entities.push({
      id: amb.id,
      type: 'ambulance',
      currentState,
      predictedState: amb.routeStatus === 'blocked'
        ? 'PREDICTED: NEEDS REROUTE'
        : 'PREDICTED: AVAILABLE',
      position: { latitude: amb.latitude, longitude: amb.longitude },
      riskLevel: amb.routeStatus === 'blocked' ? 'critical' : amb.routeStatus === 'at_risk' ? 'high' : 'low',
      predictedRiskLevel: amb.routeStatus === 'blocked' ? 'high' : 'low',
    });
  }

  for (const vault of infra.vaultsInZone) {
    const currentState = vault.status === 'overflow'
      ? 'OVERFLOW'
      : vault.status === 'alert'
        ? 'CRITICAL LEVEL'
        : vault.status === 'warning'
          ? 'WARNING'
          : 'NORMAL';
    const pred = predictions.get(`vault-${vault.id}`);
    const predictedState = pred?.predictedRisk === 'critical'
      ? 'PREDICTED: OVERFLOW RISK'
      : pred?.predictedRisk === 'high'
        ? 'PREDICTED: CRITICAL'
        : 'PREDICTED: NORMAL';
    entities.push({
      id: vault.id,
      type: 'vault',
      currentState,
      predictedState,
      position: { latitude: vault.latitude, longitude: vault.longitude },
      riskLevel: vault.riskLevel,
      predictedRiskLevel: pred?.predictedRisk ?? vault.riskLevel,
    });
  }

  for (const fz of infra.floodZonesInZone) {
    const pred = predictions.get(`flood-${fz.id}`);
    entities.push({
      id: fz.id,
      type: 'flood_zone',
      currentState: `${fz.riskLevel.toUpperCase()} (${Math.round(fz.waterLevel)}%)`,
      predictedState: pred
        ? `PREDICTED: ${pred.predictedRisk.toUpperCase()} (${Math.round(pred.predictedScore)}%)`
        : 'PREDICTED: STABLE',
      position: { latitude: fz.latitude, longitude: fz.longitude },
      riskLevel: fz.riskLevel,
      predictedRiskLevel: pred?.predictedRisk ?? fz.riskLevel,
    });
  }

  return entities;
}

export function createInitialTwinState(): DigitalTwinState {
  return {
    affectedZoneId: null,
    viewState: 'current',
    entities: [],
    simulationSpeed: 'normal',
    playing: false,
    currentTimeStep: 0,
    totalPredictionSteps: 6,
  };
}

export function toggleTwinView(state: DigitalTwinState, view: TwinViewState): DigitalTwinState {
  return { ...state, viewState: view };
}

export function setTwinPlaying(state: DigitalTwinState, playing: boolean): DigitalTwinState {
  return { ...state, playing };
}

export function setTwinSpeed(state: DigitalTwinState, speed: SimulationSpeed): DigitalTwinState {
  return { ...state, simulationSpeed: speed };
}

export function advanceTwinStep(state: DigitalTwinState): DigitalTwinState {
  const nextStep = (state.currentTimeStep + 1) % (state.totalPredictionSteps + 1);
  return { ...state, currentTimeStep: nextStep };
}

export function resetTwin(state: DigitalTwinState): DigitalTwinState {
  return { ...state, currentTimeStep: 0, viewState: 'current' };
}
