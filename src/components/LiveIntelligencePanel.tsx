import { useState, useEffect, useCallback } from 'react';
import {
  CloudRain,
  Thermometer,
  Droplets,
  Wind,
  RefreshCw,
  MapPin,
  Clock,
  Activity,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
  Loader2,
  Radio,
  Database,
  ChevronDown,
  ChevronUp,
  Cloud,
  Search,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { searchLocations, type LocationSearchResult } from '@/services/weather';
import { riskColor, riskLabel } from '@/utils/risk';

const LOCATION_PRESETS = [
  { name: 'Bengaluru Center', lat: 12.9716, lon: 77.5946 },
  { name: 'Demo Zone A', lat: 12.9756, lon: 77.5996 },
  { name: 'Demo Zone B', lat: 12.9656, lon: 77.5846 },
  { name: 'MG Road', lat: 12.9756, lon: 77.6066 },
  { name: 'Indiranagar', lat: 12.9719, lon: 77.6412 },
  { name: 'Hebbal', lat: 13.0358, lon: 77.5970 },
];

export function LiveIntelligencePanel() {
  const weather = useStore((s) => s.weather);
  const liveRisk = useStore((s) => s.liveRisk);
  const riskHistory = useStore((s) => s.riskHistory);
  const liveLocation = useStore((s) => s.liveLocation);
  const fetchWeather = useStore((s) => s.fetchWeather);
  const setLiveLocation = useStore((s) => s.setLiveLocation);
  const clearWeather = useStore((s) => s.clearWeather);

  const [showFactors, setShowFactors] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [locationQuery, setLocationQuery] = useState('');
  const [locationResults, setLocationResults] = useState<LocationSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [locationSearchError, setLocationSearchError] = useState<string | null>(null);

  const handleLocationSelect = useCallback(
    (name: string, lat: number, lon: number) => {
      setLiveLocation(lat, lon, name);
      setTimeout(() => fetchWeather(), 100);
    },
    [setLiveLocation, fetchWeather]
  );

  useEffect(() => {
    const query = locationQuery.trim();
    if (query.length < 2) {
      setLocationResults([]);
      setLocationSearchError(null);
      return;
    }

    let active = true;
    const timer = setTimeout(async () => {
      setIsSearching(true);
      setLocationSearchError(null);
      try {
        const results = await searchLocations(query);
        if (active) setLocationResults(results);
      } catch (error) {
        if (active) {
          setLocationResults([]);
          setLocationSearchError(error instanceof Error ? error.message : 'Location search failed');
        }
      } finally {
        if (active) setIsSearching(false);
      }
    }, 350);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [locationQuery]);

  // Auto-refresh polling
  useEffect(() => {
    if (!autoRefresh || !liveLocation) return;
    const interval = setInterval(() => {
      fetchWeather();
    }, weather.pollIntervalMs);
    return () => clearInterval(interval);
  }, [autoRefresh, liveLocation, weather.pollIntervalMs, fetchWeather]);

  const isFetching = weather.status === 'fetching';
  const hasData = weather.data !== null;
  const hasError = weather.status === 'error';

  return (
    <div className="card p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/15 flex items-center justify-center border border-cyan-500/25">
            <Radio className="w-4 h-4 text-cyan-400" />
          </div>
          <h3 className="text-sm font-bold text-white tracking-wide uppercase">
            Live Intelligence
          </h3>
        </div>
        <button
          onClick={() => setAutoRefresh((v) => !v)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold transition-all ${
            autoRefresh
              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
              : 'bg-surface-200/30 text-surface-700 border border-surface-200/40 hover:bg-surface-300/40'
          }`}
          title="Toggle auto-refresh"
        >
          <Activity className="w-3 h-3" />
          AUTO
        </button>
      </div>

      {/* Location selector */}
      <div className="mb-4">
        <label className="text-[10px] font-bold text-surface-600 uppercase tracking-wide mb-1.5 block">
          Analysis Location
        </label>
        <div className="flex flex-wrap gap-1.5">
          {LOCATION_PRESETS.map((loc) => {
            const isActive = liveLocation?.name === loc.name;
            return (
              <button
                key={loc.name}
                onClick={() => handleLocationSelect(loc.name, loc.lat, loc.lon)}
                disabled={isFetching}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-[10px] font-bold transition-all disabled:opacity-50 ${
                  isActive
                    ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-400'
                    : 'bg-surface-200/30 border-surface-200/40 text-surface-700 hover:border-surface-300/60'
                }`}
              >
                <MapPin className="w-3 h-3" />
                {loc.name}
              </button>
            );
          })}
        </div>
        <div className="relative mt-2">
          <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-surface-600" />
          <input
            value={locationQuery}
            onChange={(event) => setLocationQuery(event.target.value)}
            placeholder="Search a city or place"
            aria-label="Search a city or place"
            className="w-full rounded-lg border border-surface-200/40 bg-surface-200/20 py-2 pl-8 pr-3 text-xs text-white outline-none placeholder:text-surface-600 focus:border-cyan-500/50"
          />
          {isSearching && <Loader2 className="absolute right-2.5 top-2.5 w-3.5 h-3.5 animate-spin text-cyan-400" />}
          {locationResults.length > 0 && (
            <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-surface-200/50 bg-surface-100 shadow-xl">
              {locationResults.map((result) => (
                <button
                  key={`${result.latitude}-${result.longitude}`}
                  onClick={() => {
                    const name = [result.name, result.admin1, result.country].filter(Boolean).join(', ');
                    handleLocationSelect(name, result.latitude, result.longitude);
                    setLocationQuery(name);
                    setLocationResults([]);
                  }}
                  className="block w-full border-b border-surface-200/30 px-3 py-2 text-left text-xs text-white last:border-0 hover:bg-cyan-500/10"
                >
                  <span className="block font-bold">{result.name}</span>
                  <span className="text-[10px] text-surface-600">{[result.admin1, result.country].filter(Boolean).join(', ')}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        {locationSearchError && <p className="mt-1 text-[10px] text-risk-medium">{locationSearchError}</p>}
      </div>

      {/* Status indicator */}
      <div className="mb-4">
        {isFetching ? (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-cyan-500/5 border border-cyan-500/20">
            <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
            <span className="text-xs text-cyan-400 font-medium">
              Fetching live weather...
            </span>
          </div>
        ) : hasError ? (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-risk-medium/10 border border-risk-medium/30">
            <AlertCircle className="w-4 h-4 text-risk-medium shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-risk-medium">
                Unable to fetch live weather.
              </p>
              <p className="text-[10px] text-surface-600 mt-0.5">
                {weather.error ?? 'Unknown error'}. Simulation fallback active.
              </p>
            </div>
          </div>
        ) : hasData ? (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-risk-low/5 border border-risk-low/20">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-risk-low opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-risk-low"></span>
            </span>
            <span className="text-xs font-bold text-risk-low">LIVE DATA CONNECTED</span>
            <span className="text-[10px] text-surface-600 ml-auto">
              Source: {weather.data?.source}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-surface-200/20 border border-surface-200/30">
            <Database className="w-4 h-4 text-surface-600" />
            <span className="text-xs text-surface-600 font-medium">
              No live data yet. Select a location to fetch.
            </span>
          </div>
        )}
      </div>

      {/* Weather data */}
      {hasData && weather.data && (
        <>
          {/* Weather grid */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <WeatherMetric
              icon={Thermometer}
              label="Temperature"
              value={`${weather.data.temperature}°C`}
            />
            <WeatherMetric
              icon={CloudRain}
              label="Precipitation"
              value={`${weather.data.precipitation} mm`}
              highlight={weather.data.precipitation > 1}
            />
            <WeatherMetric
              icon={Droplets}
              label="Humidity"
              value={`${weather.data.humidity}%`}
            />
            <WeatherMetric
              icon={Wind}
              label="Wind Speed"
              value={`${weather.data.windSpeed} km/h`}
            />
          </div>

          {/* Weather condition + forecast */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-surface-200/20 border border-surface-200/30 mb-3">
            <div className="flex items-center gap-2">
              <Cloud className="w-4 h-4 text-surface-600" />
              <span className="text-xs text-surface-600">Condition:</span>
              <span className="text-xs font-bold text-white">
                {weather.data.weatherDescription}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <CloudRain className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-[10px] text-surface-600">3h Forecast:</span>
              <span className="text-xs font-bold text-cyan-400">
                {weather.data.forecastPrecipitation} mm
              </span>
            </div>
          </div>

          {/* Timestamp */}
          <div className="flex items-center gap-2 text-[10px] text-surface-600 mb-4">
            <Clock className="w-3 h-3" />
            <span>
              Last Updated: {new Date(weather.data.timestamp).toLocaleTimeString()}
            </span>
            <span className="ml-auto flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {weather.locationName}
            </span>
          </div>
        </>
      )}

      {/* Hydro Risk */}
      {liveRisk && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-4 h-4 text-primary-400" />
            <h4 className="text-xs font-bold text-white uppercase tracking-wide">
              Hydro Risk
            </h4>
          </div>
          <div
            className="p-4 rounded-lg border-2 transition-all"
            style={{
              backgroundColor: `${riskColor(liveRisk.level)}10`,
              borderColor: `${riskColor(liveRisk.level)}40`,
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <span
                className="text-lg font-bold"
                style={{ color: riskColor(liveRisk.level) }}
              >
                {riskLabel(liveRisk.level)}
              </span>
              <span
                className="text-2xl font-bold"
                style={{ color: riskColor(liveRisk.level) }}
              >
                {liveRisk.score}
                <span className="text-sm text-surface-600">/100</span>
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              {liveRisk.trend === 'rising' ? (
                <TrendingUp className="w-3.5 h-3.5 text-risk-high" />
              ) : liveRisk.trend === 'falling' ? (
                <TrendingDown className="w-3.5 h-3.5 text-risk-low" />
              ) : (
                <Minus className="w-3.5 h-3.5 text-surface-600" />
              )}
              <span className="text-surface-600">
                {liveRisk.trend === 'rising'
                  ? 'Rising'
                  : liveRisk.trend === 'falling'
                    ? 'Falling'
                    : 'Stable'}
              </span>
              {liveRisk.delta !== 0 && (
                <span
                  className="font-bold"
                  style={{
                    color: liveRisk.delta > 0 ? '#f97316' : '#22c55e',
                  }}
                >
                  {liveRisk.delta > 0 ? '+' : ''}
                  {liveRisk.delta} since previous update
                </span>
              )}
              {liveRisk.previousLevel !== liveRisk.level && (
                <span className="ml-auto text-[10px] text-surface-600">
                  {riskLabel(liveRisk.previousLevel)} → {riskLabel(liveRisk.level)}
                </span>
              )}
            </div>
          </div>

          {/* Risk factors toggle */}
          <button
            onClick={() => setShowFactors((v) => !v)}
            className="flex items-center gap-1.5 text-[10px] font-bold text-surface-600 uppercase tracking-wide mt-3 hover:text-surface-800 transition-colors"
          >
            {showFactors ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            Risk Factors & Data Sources
          </button>

          {showFactors && (
            <div className="mt-2 space-y-2 animate-fade-in">
              {liveRisk.factors.map((factor, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-2 rounded-lg bg-surface-200/20 border border-surface-200/30"
                >
                  <div className="flex items-center gap-2">
                    {factor.direction === 'up' ? (
                      <TrendingUp className="w-3 h-3 text-risk-high" />
                    ) : factor.direction === 'down' ? (
                      <TrendingDown className="w-3 h-3 text-risk-low" />
                    ) : (
                      <Minus className="w-3 h-3 text-surface-600" />
                    )}
                    <span className="text-xs text-surface-800">{factor.label}</span>
                    <span className="text-[10px] text-surface-600">{factor.value}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">
                      +{factor.contribution}
                    </span>
                    <span
                      className={`badge text-[8px] border ${
                        factor.source === 'live'
                          ? 'bg-risk-low/15 text-risk-low border-risk-low/30'
                          : 'bg-primary-500/15 text-primary-400 border-primary-500/30'
                      }`}
                    >
                      {factor.source === 'live' ? 'LIVE' : 'SIM'}
                    </span>
                  </div>
                </div>
              ))}

              {/* Data source summary */}
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div className="p-2 rounded-lg bg-risk-low/5 border border-risk-low/20">
                  <div className="flex items-center gap-1 mb-1">
                    <Radio className="w-2.5 h-2.5 text-risk-low" />
                    <span className="text-[8px] font-bold text-risk-low uppercase">Live Inputs</span>
                  </div>
                  <div className="space-y-0.5">
                    {liveRisk.liveInputs.map((inp, i) => (
                      <div key={i} className="text-[10px] text-surface-700">
                        {inp}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-primary-500/5 border border-primary-500/20">
                  <div className="flex items-center gap-1 mb-1">
                    <Database className="w-2.5 h-2.5 text-primary-400" />
                    <span className="text-[8px] font-bold text-primary-400 uppercase">Simulated</span>
                  </div>
                  <div className="space-y-0.5">
                    {liveRisk.simulatedInputs.map((inp, i) => (
                      <div key={i} className="text-[10px] text-surface-700">
                        {inp}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Risk history toggle */}
      {riskHistory.length > 0 && (
        <>
          <button
            onClick={() => setShowHistory((v) => !v)}
            className="flex items-center gap-1.5 text-[10px] font-bold text-surface-600 uppercase tracking-wide mb-2 hover:text-surface-800 transition-colors"
          >
            {showHistory ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            Risk History ({riskHistory.length})
          </button>
          {showHistory && (
            <div className="space-y-1.5 animate-fade-in max-h-48 overflow-y-auto">
              {[...riskHistory].reverse().map((entry, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-2 rounded-lg bg-surface-200/20 border border-surface-200/30 text-[10px]"
                >
                  <span className="text-surface-600">
                    {new Date(entry.timestamp).toLocaleTimeString()}
                  </span>
                  <span className="text-surface-700">
                    {entry.precipitation}mm
                  </span>
                  <span
                    className="font-bold"
                    style={{ color: riskColor(entry.riskLevel) }}
                  >
                    {entry.riskScore}/100
                  </span>
                  <span
                    className="badge text-[8px] border"
                    style={{
                      backgroundColor: `${riskColor(entry.riskLevel)}15`,
                      color: riskColor(entry.riskLevel),
                      borderColor: `${riskColor(entry.riskLevel)}30`,
                    }}
                  >
                    {riskLabel(entry.riskLevel)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Action buttons */}
      <div className="flex gap-2 mt-4">
        <button
          onClick={() => fetchWeather()}
          disabled={isFetching || !liveLocation}
          className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isFetching ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          Refresh Now
        </button>
        {hasData && (
          <button
            onClick={clearWeather}
            className="btn-secondary flex items-center justify-center"
          >
            Clear
          </button>
        )}
      </div>

      {/* Data source transparency footer */}
      <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-surface-200/30">
        <span className="badge bg-risk-medium/15 text-risk-medium border border-risk-medium/30 text-[8px]">
          SIMULATED ROUTE ANALYSIS
        </span>
        {hasData && (
          <span className="badge bg-risk-low/15 text-risk-low border border-risk-low/30 text-[8px]">
            LIVE WEATHER: {weather.data?.source}
          </span>
        )}
        {liveRisk && (
          <span className="badge bg-primary-500/15 text-primary-400 border border-primary-500/30 text-[8px]">
            PREDICTED: LABELLED
          </span>
        )}
      </div>
    </div>
  );
}

function WeatherMetric({
  icon: Icon,
  label,
  value,
  highlight,
}: {
  icon: typeof Thermometer;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`p-2.5 rounded-lg border ${
        highlight
          ? 'bg-cyan-500/10 border-cyan-500/30'
          : 'bg-surface-200/20 border-surface-200/30'
      }`}
    >
      <div className="flex items-center gap-1.5 mb-1">
        <Icon
          className={`w-3 h-3 ${highlight ? 'text-cyan-400' : 'text-surface-600'}`}
        />
        <span className="text-[9px] text-surface-600 uppercase tracking-wide font-medium">
          {label}
        </span>
      </div>
      <p
        className={`text-sm font-bold ${highlight ? 'text-cyan-400' : 'text-white'}`}
      >
        {value}
      </p>
    </div>
  );
}
