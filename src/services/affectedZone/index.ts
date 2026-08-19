import type {
  AffectedZone,
  ZoneInfrastructure,
  FloodZone,
  Vault,
  RoadSegment,
  RoadGraphSegment,
  Hospital,
  Ambulance,
  RiskLevel,
} from '@/types';

const PREDEFINED_ZONES: AffectedZone[] = [
  {
    id: 'zone-central',
    name: 'Central Bengaluru (MG Road)',
    centerLatitude: 12.9756,
    centerLongitude: 77.6066,
    radiusKm: 3,
    severity: 'medium',
    active: false,
  },
  {
    id: 'zone-east',
    name: 'East Bengaluru (Indiranagar)',
    centerLatitude: 12.9719,
    centerLongitude: 77.6412,
    radiusKm: 3,
    severity: 'medium',
    active: false,
  },
  {
    id: 'zone-south',
    name: 'South Bengaluru (Jayanagar)',
    centerLatitude: 12.9250,
    centerLongitude: 77.5938,
    radiusKm: 3,
    severity: 'medium',
    active: false,
  },
  {
    id: 'zone-north',
    name: 'North Bengaluru (Hebbal)',
    centerLatitude: 13.0358,
    centerLongitude: 77.5970,
    radiusKm: 3,
    severity: 'medium',
    active: false,
  },
];

export function getPredefinedZones(): AffectedZone[] {
  return PREDEFINED_ZONES.map((z) => ({ ...z }));
}

function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
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

export function isPointInZone(
  lat: number,
  lon: number,
  zone: AffectedZone
): boolean {
  return haversineKm(lat, lon, zone.centerLatitude, zone.centerLongitude) <= zone.radiusKm;
}

export function computeZoneInfrastructure(
  zone: AffectedZone,
  floodZones: FloodZone[],
  vaults: Vault[],
  roadSegments: RoadSegment[],
  roadGraph: RoadGraphSegment[],
  hospitals: Hospital[],
  ambulances: Ambulance[]
): ZoneInfrastructure {
  return {
    roadsInZone: roadSegments.filter(
      (r) =>
        isPointInZone(r.start.latitude, r.start.longitude, zone) ||
        isPointInZone(r.end.latitude, r.end.longitude, zone)
    ),
    roadGraphInZone: roadGraph.filter(
      (r) =>
        isPointInZone(r.start.latitude, r.start.longitude, zone) ||
        isPointInZone(r.end.latitude, r.end.longitude, zone)
    ),
    hospitalsInZone: hospitals.filter((h) =>
      isPointInZone(h.latitude, h.longitude, zone)
    ),
    ambulancesInZone: ambulances.filter((a) =>
      isPointInZone(a.latitude, a.longitude, zone)
    ),
    vaultsInZone: vaults.filter((v) =>
      isPointInZone(v.latitude, v.longitude, zone)
    ),
    floodZonesInZone: floodZones.filter((fz) =>
      isPointInZone(fz.latitude, fz.longitude, zone)
    ),
  };
}

export function computeZoneSeverity(
  zone: AffectedZone,
  floodZones: FloodZone[],
  vaults: Vault[]
): RiskLevel {
  const infra = computeZoneInfrastructure(
    zone,
    floodZones,
    vaults,
    [],
    [],
    [],
    []
  );
  const zoneFloodZones = infra.floodZonesInZone;
  if (zoneFloodZones.length === 0) return 'low';

  const maxRiskScore = Math.max(...zoneFloodZones.map((z) => z.riskScore));
  if (maxRiskScore >= 85) return 'critical';
  if (maxRiskScore >= 60) return 'high';
  if (maxRiskScore >= 35) return 'medium';
  return 'low';
}

export function createCustomZone(
  name: string,
  lat: number,
  lon: number,
  radiusKm: number
): AffectedZone {
  return {
    id: `zone-custom-${Date.now()}`,
    name,
    centerLatitude: lat,
    centerLongitude: lon,
    radiusKm,
    severity: 'medium',
    active: false,
  };
}
