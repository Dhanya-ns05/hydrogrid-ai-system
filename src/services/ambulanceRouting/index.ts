import type {
  Ambulance,
  AmbulanceCandidate,
  AmbulanceSelectionResult,
  Hospital,
  RoadGraphSegment,
  RoadNode,
  RouteResult,
  RouteCostWeights,
  RiskLevel,
  AffectedZone,
} from '@/types';
import { calculateRoutes } from '@/services/emergency/routeEngine';
import { AMBULANCE_NODE_MAP, HOSPITAL_NODE_MAP } from '@/services/emergency';
import { isPointInZone } from '@/services/affectedZone';

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function selectAmbulance(
  incidentLat: number,
  incidentLon: number,
  zone: AffectedZone,
  severity: RiskLevel,
  ambulances: Ambulance[],
  hospitals: Hospital[],
  roadGraph: RoadGraphSegment[],
  roadNodes: RoadNode[],
  costWeights: RouteCostWeights
): AmbulanceSelectionResult {
  const zoneAmbulances = ambulances.filter((a) =>
    isPointInZone(a.latitude, a.longitude, zone)
  );
  const candidates = zoneAmbulances.length > 0 ? zoneAmbulances : ambulances;

  const evaluated: AmbulanceCandidate[] = candidates.map((amb) => {
    const distance = haversineKm(amb.latitude, amb.longitude, incidentLat, incidentLon);

    const startNode = AMBULANCE_NODE_MAP[amb.id];
    const nearestHospital = hospitals.reduce((closest, h) => {
      const d = haversineKm(incidentLat, incidentLon, h.latitude, h.longitude);
      return d < closest.dist ? { hospital: h, dist: d } : closest;
    }, { hospital: hospitals[0], dist: Infinity }).hospital;

    const endNode = HOSPITAL_NODE_MAP[nearestHospital.id];

    let routeResult: RouteResult | null = null;
    if (startNode && endNode) {
      const routeSet = calculateRoutes(startNode, endNode, roadGraph, roadNodes, costWeights);
      routeResult = routeSet.recommended;
    }

    const estimatedTravelTime = routeResult?.estimatedTime ?? Math.max(5, distance * 3);
    const routeRisk = routeResult?.floodRiskScore ?? 50;

    const distanceScore = Math.max(0, 100 - distance * 15);
    const timeScore = Math.max(0, 100 - estimatedTravelTime * 4);
    const safetyScore = 100 - routeRisk;
    const selectionScore = Math.round(
      distanceScore * 0.3 + timeScore * 0.35 + safetyScore * 0.35
    );

    const reasons: string[] = [];
    reasons.push(`Distance: ${distance.toFixed(1)} km`);
    reasons.push(`Est. travel time: ${estimatedTravelTime} min`);
    reasons.push(`Route safety: ${Math.round(safetyScore)}%`);
    if (routeResult && routeResult.blockedRoads > 0) {
      reasons.push(`Avoids ${routeResult.blockedRoads} blocked road(s)`);
    }

    return {
      ambulanceId: amb.id,
      distanceToIncident: distance,
      estimatedTravelTime,
      routeRisk,
      selectionScore,
      routeResult,
      selected: false,
      reasons,
    };
  });

  evaluated.sort((a, b) => b.selectionScore - a.selectionScore);
  if (evaluated.length > 0) {
    evaluated[0].selected = true;
  }

  const selected = evaluated.length > 0 ? evaluated[0] : null;

  let hospitalRoute: RouteResult | null = null;
  if (selected && selected.routeResult) {
    hospitalRoute = selected.routeResult;
  }

  return {
    incidentLocation: { latitude: incidentLat, longitude: incidentLon },
    affectedZoneId: zone.id,
    severity,
    candidates: evaluated,
    selectedAmbulance: selected,
    hospitalRoute,
    calculatedAt: new Date().toISOString(),
  };
}
