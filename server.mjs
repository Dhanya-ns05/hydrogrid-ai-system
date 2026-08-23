import http from 'node:http';
import { URL } from 'node:url';
import { appendFile, mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const PORT = Number(process.env.PORT ?? 8787);
const WEATHER_API = 'https://api.open-meteo.com/v1/forecast';
const FLOOD_API = 'https://flood-api.open-meteo.com/v1/flood';
const OSRM_API = 'https://router.project-osrm.org/route/v1/driving';
const TOMTOM_API_KEY = process.env.TOMTOM_API_KEY;
const TOMTOM_API = 'https://api.tomtom.com/routing/1/calculateRoute';
const GEOCODING_API = 'https://nominatim.openstreetmap.org/reverse';
const OVERPASS_API = process.env.OVERPASS_API ?? 'https://overpass-api.de/api/interpreter';
const VAULT_CONFIG_FILE = process.env.VAULT_INFRASTRUCTURE_FILE ?? './config/vault-infrastructure.json';
const SNAPSHOT_FILE = process.env.LIVE_SNAPSHOT_FILE ?? './data/live-snapshots.jsonl';
const WEATHER_CODES = {
  0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
  45: 'Fog', 48: 'Depositing rime fog', 51: 'Drizzle', 61: 'Rain',
  63: 'Moderate rain', 65: 'Heavy rain', 71: 'Snow', 80: 'Rain showers',
  81: 'Moderate rain showers', 82: 'Violent rain showers', 95: 'Thunderstorm',
  96: 'Thunderstorm with hail', 99: 'Thunderstorm with heavy hail',
};

function json(response, status, body) {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  response.end(JSON.stringify(body));
}

async function readBody(request) {
  let body = '';
  for await (const chunk of request) body += chunk;
  return body ? JSON.parse(body) : {};
}

function coordinates(input) {
  const latitude = Number(input.latitude ?? input.lat);
  const longitude = Number(input.longitude ?? input.lon ?? input.lng);
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    throw new Error('Valid latitude and longitude are required');
  }
  return { latitude, longitude };
}

function sumNext(values, start, count = 3) {
  return values.slice(start, start + count).reduce((sum, value) => sum + (Number(value) || 0), 0);
}

async function getJson(url, headers = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  let response;
  try {
    response = await fetch(url, { headers, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
  if (!response.ok) {
    const details = await response.text().catch(() => '');
    throw new Error(`Upstream API returned ${response.status}${details ? `: ${details.slice(0, 180)}` : ''}`);
  }
  return response.json();
}

async function postJson(url, body, headers = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  let response;
  try {
    response = await fetch(url, { method: 'POST', headers, body, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
  if (!response.ok) throw new Error(`Upstream API returned ${response.status}`);
  return response.json();
}

function finite(value) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

async function getHospitals(location) {
  const query = `[out:json][timeout:20];nwr[amenity=hospital](around:30000,${location.latitude},${location.longitude});out center tags;`;
  const payload = await postJson(OVERPASS_API, new URLSearchParams({ data: query }).toString(), {
    'Content-Type': 'application/x-www-form-urlencoded',
    'User-Agent': 'HydroGridAI/1.0 (live flood dashboard)',
  });
  const elements = Array.isArray(payload.elements) ? payload.elements : [];
  return elements
    .map((element) => {
      const latitude = finite(element.lat ?? element.center?.lat);
      const longitude = finite(element.lon ?? element.center?.lon);
      if (latitude === null || longitude === null) return null;
      return {
        id: `osm-hospital-${element.type}-${element.id}`,
        name: element.tags?.name ?? 'Unnamed hospital',
        latitude,
        longitude,
        source: 'OpenStreetMap Overpass',
      };
    })
    .filter(Boolean)
    .slice(0, 50);
}

async function getVaultInfrastructure(regionName) {
  try {
    const config = JSON.parse(await readFile(VAULT_CONFIG_FILE, 'utf8'));
    return (Array.isArray(config.regions?.[regionName]) ? config.regions[regionName] : []).filter((vault) =>
      typeof vault?.id === 'string' &&
      Number.isFinite(vault.latitude) && Number.isFinite(vault.longitude) &&
      Number.isFinite(vault.capacity) && Array.isArray(vault.connectedVaults)
    );
  } catch {
    return [];
  }
}

async function persistSnapshot(snapshot) {
  await mkdir(path.dirname(SNAPSHOT_FILE), { recursive: true });
  await appendFile(SNAPSHOT_FILE, `${JSON.stringify(snapshot)}\n`, 'utf8');
}

async function getSnapshots() {
  try {
    const content = await readFile(SNAPSHOT_FILE, 'utf8');
    return content.split('\n').filter(Boolean).map((line) => JSON.parse(line)).slice(-1000);
  } catch (error) {
    if (error?.code === 'ENOENT') return [];
    throw error;
  }
}

async function buildLiveData(input) {
  const location = coordinates(input);
  const weatherParams = new URLSearchParams({
    latitude: location.latitude.toFixed(4),
    longitude: location.longitude.toFixed(4),
    current: 'temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m',
    hourly: 'precipitation,soil_moisture_0_to_7cm,precipitation_probability',
    forecast_days: '2',
    timezone: 'auto',
  });
  const weatherPayload = await getJson(`${WEATHER_API}?${weatherParams}`);
  let floodPayload = null;
  let floodError = null;
  try {
    const floodParams = new URLSearchParams({
      latitude: location.latitude.toFixed(4),
      longitude: location.longitude.toFixed(4),
      daily: 'river_discharge',
      forecast_days: '7',
      timezone: 'auto',
    });
    floodPayload = await getJson(`${FLOOD_API}?${floodParams}`);
  } catch (error) {
    floodError = error instanceof Error ? error.message : 'Flood provider unavailable';
  }
  let regionPayload = { address: {} };
  try {
    regionPayload = await getJson(`${GEOCODING_API}?${new URLSearchParams({ lat: String(location.latitude), lon: String(location.longitude), format: 'jsonv2', zoom: '10' })}`, {
      'User-Agent': 'HydroGridAI/1.0 (public flood-risk dashboard)',
      Accept: 'application/json',
    });
  } catch {
    regionPayload = { address: {} };
  }

  const current = weatherPayload.current;
  if (!current || typeof current.temperature_2m !== 'number' || typeof current.precipitation !== 'number') {
    throw new Error('Weather provider returned incomplete current data');
  }
  const hourly = weatherPayload.hourly ?? {};
  const currentIndex = hourly.time?.findIndex((time) => new Date(time) >= new Date()) ?? -1;
  const start = currentIndex >= 0 ? currentIndex : 0;
  const recentRainfall = Number(current.precipitation) || 0;
  const forecastRainfall = sumNext(hourly.precipitation ?? [], start);
  const surfaceRunoff = sumNext(hourly.surface_runoff ?? [], start);
  const soilMoisture = Number(current.soil_moisture_0_to_1cm ?? hourly.soil_moisture_0_to_7cm?.[start]);
  const probability = Number(hourly.precipitation_probability?.[start]);
  const rainfallScore = Math.min(35, recentRainfall * 7);
  const forecastScore = Math.min(25, forecastRainfall * 2.5);
  const runoffScore = Number.isFinite(surfaceRunoff) ? Math.min(20, surfaceRunoff * 2) : 0;
  const soilScore = Number.isFinite(soilMoisture) ? Math.min(10, soilMoisture * 10) : 0;
  const discharge = floodPayload?.daily?.river_discharge?.[0];
  const dischargeSeries = floodPayload?.daily?.river_discharge ?? [];
  const maxDischarge = Math.max(...dischargeSeries.filter((value) => typeof value === 'number'));
  const floodAvailable = typeof discharge === 'number' && Number.isFinite(discharge) && Number.isFinite(maxDischarge);
  const floodScore = floodAvailable && maxDischarge > 0 ? Math.min(30, (discharge / maxDischarge) * 30) : 0;
  const riskScore = Math.round(Math.min(100, rainfallScore + forecastScore + runoffScore + soilScore + floodScore));
  const riskLevel = riskScore >= 75 ? 'critical' : riskScore >= 50 ? 'high' : riskScore >= 25 ? 'medium' : 'low';
  const observedAt = new Date().toISOString();
  const source = 'Open-Meteo via HydroGrid backend';
  const region = regionPayload.address ?? {};
  const regionName = region.state ?? 'Unknown region';
  let hospitals = [];
  let hospitalError = null;
  try {
    hospitals = await getHospitals(location);
  } catch (error) {
    hospitalError = error instanceof Error ? error.message : 'Hospital provider unavailable';
  }
  const vaults = await getVaultInfrastructure(regionName);
  const provenance = (field) => ({ status: 'live', source, observedAt, reliability: 0.95, field });
  return {
    location: { ...location, name: region.city ?? region.town ?? region.municipality ?? region.village ?? 'Selected location' },
    region: {
      name: region.city ?? region.town ?? region.municipality ?? region.village ?? 'Unknown region',
      country: region.country ?? 'Unknown country',
      admin1: region.state ?? null,
      source: 'OpenStreetMap Nominatim',
      detectedAt: observedAt,
    },
    source,
    observedAt,
    weather: {
      latitude: location.latitude,
      longitude: location.longitude,
      temperature: Math.round(current.temperature_2m * 10) / 10,
      precipitation: Math.round(recentRainfall * 10) / 10,
      weatherCode: current.weather_code ?? 0,
      weatherDescription: WEATHER_CODES[current.weather_code] ?? 'Unknown',
      humidity: Math.round(current.relative_humidity_2m ?? 0),
      windSpeed: Math.round((current.wind_speed_10m ?? 0) * 10) / 10,
      forecastPrecipitation: Math.round(forecastRainfall * 10) / 10,
      timestamp: observedAt,
      source,
      region: undefined,
      environmental: {
        elevation: typeof weatherPayload.elevation === 'number' ? weatherPayload.elevation : null,
        soilMoisture: Number.isFinite(soilMoisture) ? soilMoisture : null,
        surfaceRunoff: Number.isFinite(surfaceRunoff) ? Math.round(surfaceRunoff * 10) / 10 : null,
        precipitationProbability: Number.isFinite(probability) ? probability : null,
      },
      provenance: {
        temperature: provenance('temperature'), precipitation: provenance('precipitation'),
        humidity: provenance('humidity'), windSpeed: provenance('windSpeed'), environmental: provenance('environmental'),
      },
    },
    risk: { score: riskScore, level: riskLevel, basis: ['current rainfall', 'next 3-hour rainfall', 'surface runoff', 'soil moisture', ...(floodAvailable ? ['GloFAS river discharge relative to 7-day forecast'] : [])] },
    network: {
      status: 'unavailable',
      source: 'No configured public vault network provider',
      lastUpdated: null,
      error: 'No public vault or water-level network feed is available for this location.',
    },
    floodZones: [], vaults, roads: [], predictions: [], alerts: [], hospitals,
    dataQuality: {
      hospitals: hospitals.length > 0 ? 'live' : 'unavailable',
      vaults: vaults.length > 0 ? 'configured' : 'unavailable',
      flood: floodAvailable ? 'live' : 'unavailable',
      errors: hospitalError ? [`Hospitals: ${hospitalError}`] : [],
    },
    floodData: floodAvailable
      ? { riverDischarge: discharge, source: 'Open-Meteo Flood API (GloFAS)', observedAt }
      : { source: null, observedAt: null, error: floodError },
  };
}

async function buildLiveRoute(input) {
  const origin = coordinates({ latitude: input.originLatitude, longitude: input.originLongitude });
  const destination = coordinates({ latitude: input.destinationLatitude, longitude: input.destinationLongitude });
  const tomtomCoordinatePath = `${origin.latitude},${origin.longitude}:${destination.latitude},${destination.longitude}`;
  const osrmCoordinatePath = `${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}`;
  const url = TOMTOM_API_KEY
    ? `${TOMTOM_API}/${tomtomCoordinatePath}/json?${new URLSearchParams({ key: TOMTOM_API_KEY, routeType: 'fastest', traffic: 'true' })}`
    : `${OSRM_API}/${osrmCoordinatePath}?${new URLSearchParams({ overview: 'full', geometries: 'geojson', steps: 'true' })}`;
  const payload = await getJson(url);
  if (TOMTOM_API_KEY) {
    const route = payload.routes?.[0];
    if (!route?.legs?.[0]?.points) throw new Error('TomTom returned no route');
    return {
      source: 'TomTom Routing API',
      distance: route.summary.lengthInMeters,
      duration: Math.round(route.summary.travelTimeInSeconds / 60),
      coordinates: route.legs[0].points.map((point) => ({ latitude: point.latitude, longitude: point.longitude })),
    };
  }
  const route = payload.routes?.[0];
  if (!route?.geometry?.coordinates) throw new Error('OSRM returned no route');
  return {
    source: 'OSRM OpenStreetMap routing',
    distance: Math.round(route.distance),
    duration: Math.round(route.duration / 60),
    coordinates: route.geometry.coordinates.map(([longitude, latitude]) => ({ latitude, longitude })),
  };
}

const server = http.createServer(async (request, response) => {
  if (request.method === 'OPTIONS') return json(response, 204, {});
  if (request.method === 'GET' && request.url === '/') {
    return json(response, 200, {
      service: 'HydroGrid live backend',
      status: 'ok',
      endpoint: 'POST or GET /api/live-data',
    });
  }
  const requestUrl = new URL(request.url ?? '/', `http://${request.headers.host ?? 'localhost'}`);
  if (requestUrl.pathname === '/api/live-route' && request.method === 'GET') {
    try {
      return json(response, 200, await buildLiveRoute({
        originLatitude: requestUrl.searchParams.get('originLatitude'),
        originLongitude: requestUrl.searchParams.get('originLongitude'),
        destinationLatitude: requestUrl.searchParams.get('destinationLatitude'),
        destinationLongitude: requestUrl.searchParams.get('destinationLongitude'),
      }));
    } catch (error) {
      const invalid = error instanceof Error && error.message === 'Valid latitude and longitude are required';
      return json(response, invalid ? 400 : 503, { status: invalid ? 'invalid_request' : 'unavailable', error: error instanceof Error ? error.message : 'Live route unavailable' });
    }
  }
  if (requestUrl.pathname === '/api/live-snapshots' && request.method === 'GET') {
    try {
      return json(response, 200, { snapshots: await getSnapshots() });
    } catch (error) {
      return json(response, 503, { status: 'unavailable', error: error instanceof Error ? error.message : 'Snapshot storage unavailable' });
    }
  }
  if (requestUrl.pathname !== '/api/live-data' || !['GET', 'POST'].includes(request.method ?? '')) {
    return json(response, 404, { error: 'Not found' });
  }
  try {
    const input = request.method === 'GET'
      ? { latitude: requestUrl.searchParams.get('latitude'), longitude: requestUrl.searchParams.get('longitude') }
      : await readBody(request);
    const result = await buildLiveData(input);
    result.weather.region = result.region;
    try {
      await persistSnapshot({ ...result, snapshotType: 'live', persistedAt: new Date().toISOString() });
    } catch (error) {
      result.dataQuality.errors.push(`Snapshots: ${error instanceof Error ? error.message : 'Snapshot storage unavailable'}`);
    }
    return json(response, 200, result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Live data unavailable';
    console.error(`Live data request failed: ${message}`);
    return json(response, message === 'Valid latitude and longitude are required' ? 400 : 503, {
      status: message === 'Valid latitude and longitude are required' ? 'invalid_request' : 'unavailable',
      error: message,
    });
  }
});

server.listen(PORT, '0.0.0.0', () => console.log(`HydroGrid live backend listening on http://localhost:${PORT}`));