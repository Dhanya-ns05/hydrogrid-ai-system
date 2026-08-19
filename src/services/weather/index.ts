import type { LiveWeatherData } from '@/types';

const OPEN_METEO_CURRENT_URL = 'https://api.open-meteo.com/v1/forecast';
const WEATHER_CODE_MAP: Record<number, string> = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Fog',
  48: 'Depositing rime fog',
  51: 'Light drizzle',
  53: 'Moderate drizzle',
  55: 'Dense drizzle',
  56: 'Light freezing drizzle',
  57: 'Dense freezing drizzle',
  61: 'Slight rain',
  63: 'Moderate rain',
  65: 'Heavy rain',
  66: 'Light freezing rain',
  67: 'Heavy freezing rain',
  71: 'Slight snow fall',
  73: 'Moderate snow fall',
  75: 'Heavy snow fall',
  77: 'Snow grains',
  80: 'Slight rain showers',
  81: 'Moderate rain showers',
  82: 'Violent rain showers',
  85: 'Slight snow showers',
  86: 'Heavy snow showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with slight hail',
  99: 'Thunderstorm with heavy hail',
};

function describeWeatherCode(code: number): string {
  return WEATHER_CODE_MAP[code] ?? 'Unknown';
}

export async function getCurrentWeather(
  latitude: number,
  longitude: number
): Promise<LiveWeatherData> {
  const params = new URLSearchParams({
    latitude: latitude.toFixed(4),
    longitude: longitude.toFixed(4),
    current: [
      'temperature_2m',
      'relative_humidity_2m',
      'precipitation',
      'weather_code',
      'wind_speed_10m',
    ].join(','),
    forecast_days: '1',
    hourly: 'precipitation',
    timezone: 'auto',
  });

  const url = `${OPEN_METEO_CURRENT_URL}?${params.toString()}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Weather API returned ${res.status}: ${res.statusText}`);
  }

  const json = await res.json();

  const current = json.current;
  if (!current) {
    throw new Error('Weather API response missing current data');
  }

  const weatherCode: number = current.weather_code ?? 0;
  const precipitation: number = current.precipitation ?? 0;

  let forecastPrecipitation = 0;
  if (json.hourly && Array.isArray(json.hourly.precipitation)) {
    const now = new Date();
    const times: string[] = json.hourly.time ?? [];
    const precip: number[] = json.hourly.precipitation ?? [];
    const nextHourIdx = times.findIndex((t: string) => new Date(t) >= now);
    if (nextHourIdx >= 0 && nextHourIdx < precip.length) {
      const nextHours = precip.slice(nextHourIdx, Math.min(nextHourIdx + 3, precip.length));
      forecastPrecipitation = nextHours.reduce((sum: number, v: number) => sum + (v ?? 0), 0);
    }
  }

  return {
    latitude,
    longitude,
    temperature: Math.round((current.temperature_2m ?? 0) * 10) / 10,
    precipitation: Math.round(precipitation * 10) / 10,
    weatherCode,
    weatherDescription: describeWeatherCode(weatherCode),
    humidity: Math.round(current.relative_humidity_2m ?? 0),
    windSpeed: Math.round((current.wind_speed_10m ?? 0) * 10) / 10,
    forecastPrecipitation: Math.round(forecastPrecipitation * 10) / 10,
    timestamp: new Date().toISOString(),
    source: 'Open-Meteo',
  };
}
