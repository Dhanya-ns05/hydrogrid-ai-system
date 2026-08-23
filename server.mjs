import http from 'node:http';
import { URL } from 'node:url';

const PORT = Number(process.env.PORT ?? 8787);
const WEATHER_API = 'https://api.open-meteo.com/v1/forecast';
const GEOCODING_API = 'https://nominatim.openstreetmap.org/reverse';
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
  const riskScore = Math.round(Math.min(100, rainfallScore + forecastScore + runoffScore + soilScore));
  const riskLevel = riskScore >= 75 ? 'critical' : riskScore >= 50 ? 'high' : riskScore >= 25 ? 'medium' : 'low';
  const observedAt = new Date().toISOString();
  const source = 'Open-Meteo via HydroGrid backend';
  const region = regionPayload.address ?? {};
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
    risk: { score: riskScore, level: riskLevel, basis: ['current rainfall', 'next 3-hour rainfall', 'surface runoff', 'soil moisture'] },
    network: {
      status: 'unavailable',
      source: 'No configured public vault network provider',
      lastUpdated: null,
      error: 'No public vault or water-level network feed is available for this location.',
    },
    floodZones: [], vaults: [], roads: [], predictions: [],
    alerts: [{
      id: 'live-flood-events-unavailable',
      severity: 'info',
      title: 'NO ACTIVE EVENT',
      message: 'No public flood or water-level event feed is available for this location.',
      source: 'HydroGrid backend',
      timestamp: observedAt,
      acknowledged: false,
    }],
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
  if (requestUrl.pathname !== '/api/live-data' || !['GET', 'POST'].includes(request.method ?? '')) {
    return json(response, 404, { error: 'Not found' });
  }
  try {
    const input = request.method === 'GET'
      ? { latitude: requestUrl.searchParams.get('latitude'), longitude: requestUrl.searchParams.get('longitude') }
      : await readBody(request);
    const result = await buildLiveData(input);
    result.weather.region = result.region;
    return json(response, 200, result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Live data unavailable';
    return json(response, message === 'Valid latitude and longitude are required' ? 400 : 503, {
      status: message === 'Valid latitude and longitude are required' ? 'invalid_request' : 'unavailable',
      error: message,
    });
  }
});

server.listen(PORT, '0.0.0.0', () => console.log(`HydroGrid live backend listening on http://localhost:${PORT}`));