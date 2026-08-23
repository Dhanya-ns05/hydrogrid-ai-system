import type { Alert, FloodZone, LiveDataState, LiveWeatherData, RegionInfo, RiskPrediction, RoadSegment, Vault } from '@/types';

const BACKEND_URL = import.meta.env.VITE_BACKEND_API_URL ?? '/api/live-data';
const REFRESH_INTERVAL_MS = 300000;

export interface LiveDataRequest {
  latitude: number;
  longitude: number;
}

export interface LiveDataResponse {
  location?: { latitude?: number; longitude?: number; name?: string };
  region?: Partial<RegionInfo>;
  weather?: Partial<LiveWeatherData>;
  source?: string;
  observedAt?: string;
  floodZones?: FloodZone[];
  vaults?: Vault[];
  roads?: RoadSegment[];
  alerts?: Alert[];
  predictions?: RiskPrediction[];
  network?: LiveDataState['network'];
}

export interface LiveDataResult {
  weather: LiveWeatherData;
  state: LiveDataState;
  entities: Pick<LiveDataResponse, 'floodZones' | 'vaults' | 'roads' | 'alerts' | 'predictions'>;
}

function makeRegion(request: LiveDataRequest, response: LiveDataResponse): RegionInfo {
  return {
    name: response.region?.name ?? 'Unknown region',
    country: response.region?.country ?? 'Unknown country',
    admin1: response.region?.admin1 ?? null,
    source: response.region?.source ?? 'Backend region service',
    detectedAt: response.region?.detectedAt ?? new Date().toISOString(),
  };
}

function normalizeWeather(request: LiveDataRequest, response: LiveDataResponse): LiveWeatherData {
  const weather = response.weather;
  if (!weather || typeof weather.temperature !== 'number' || typeof weather.precipitation !== 'number') {
    throw new Error('Backend response is missing required weather values');
  }
  const timestamp = response.observedAt ?? weather.timestamp ?? new Date().toISOString();
  const source = response.source ?? weather.source ?? 'Backend live data API';
  return {
    latitude: request.latitude,
    longitude: request.longitude,
    temperature: weather.temperature,
    precipitation: weather.precipitation,
    weatherCode: weather.weatherCode ?? 0,
    weatherDescription: weather.weatherDescription ?? 'Unknown',
    humidity: weather.humidity ?? 0,
    windSpeed: weather.windSpeed ?? 0,
    forecastPrecipitation: weather.forecastPrecipitation ?? 0,
    timestamp,
    source,
    region: makeRegion(request, response),
    environmental: weather.environmental ?? {
      elevation: null,
      soilMoisture: null,
      surfaceRunoff: null,
      precipitationProbability: null,
    },
    provenance: weather.provenance ?? {
      temperature: { status: 'live', source, observedAt: timestamp, reliability: 1 },
      precipitation: { status: 'live', source, observedAt: timestamp, reliability: 1 },
      humidity: { status: 'live', source, observedAt: timestamp, reliability: 1 },
      windSpeed: { status: 'live', source, observedAt: timestamp, reliability: 1 },
      environmental: { status: 'live', source, observedAt: timestamp, reliability: 1 },
    },
  };
}

export async function fetchLiveData(request: LiveDataRequest): Promise<LiveDataResult> {
  const response = await fetch(BACKEND_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(request),
  });
  if (!response.ok) throw new Error(`Backend live data API returned ${response.status}`);

  const payload = (await response.json()) as LiveDataResponse;
  const weather = normalizeWeather(request, payload);
  const lastUpdated = weather.timestamp;
  return {
    weather,
    state: {
      status: 'connected',
      selectedLocation: { ...request, name: payload.location?.name ?? weather.region.name },
      source: weather.source,
      lastUpdated,
      nextRefreshAt: new Date(Date.now() + REFRESH_INTERVAL_MS).toISOString(),
      error: null,
      dataStatus: 'LIVE',
      network: payload.network ?? {
        status: (payload.vaults?.length ?? 0) > 0 ? 'live' : 'unavailable',
        source: payload.source ?? 'Backend vault network service',
        lastUpdated: (payload.vaults?.length ?? 0) > 0 ? lastUpdated : null,
        error: (payload.vaults?.length ?? 0) > 0 ? null : 'Backend returned no vault network data for this location',
      },
    },
    entities: {
      floodZones: payload.floodZones,
      vaults: payload.vaults,
      roads: payload.roads,
      alerts: payload.alerts,
      predictions: payload.predictions,
    },
  };
}

export function getLiveDataRefreshInterval(): number {
  return REFRESH_INTERVAL_MS;
}

export function getLiveDataEndpoint(): string {
  return BACKEND_URL;
}