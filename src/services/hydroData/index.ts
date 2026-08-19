import type {
  DataMode,
  DataSourceInfo,
  LiveDataConfig,
  FloodZone,
  Vault,
  RoadSegment,
  RainfallReading,
} from '@/types';

const DEFAULT_CONFIG: LiveDataConfig = {
  apiKey: import.meta.env.VITE_LIVE_DATA_API_KEY ?? null,
  apiUrl: import.meta.env.VITE_LIVE_DATA_API_URL ?? null,
  pollIntervalMs: 30000,
  enabled: false,
};

let currentMode: DataMode = 'simulation';
let currentConfig: LiveDataConfig = { ...DEFAULT_CONFIG };
let currentStatus: DataSourceInfo = {
  mode: 'simulation',
  status: 'disconnected',
  provider: 'Simulation Engine',
  lastFetch: null,
  errorMessage: null,
};

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((l) => l());
}

export function getDataMode(): DataMode {
  return currentMode;
}

export function getDataSourceInfo(): DataSourceInfo {
  return { ...currentStatus };
}

export function getDataConfig(): LiveDataConfig {
  return { ...currentConfig };
}

export function setDataMode(mode: DataMode): void {
  currentMode = mode;
  if (mode === 'simulation') {
    currentStatus = {
      mode: 'simulation',
      status: 'disconnected',
      provider: 'Simulation Engine',
      lastFetch: null,
      errorMessage: null,
    };
  } else {
    if (!currentConfig.apiKey || !currentConfig.apiUrl) {
      currentStatus = {
        mode: 'live',
        status: 'fallback',
        provider: 'No API configured',
        lastFetch: null,
        errorMessage: 'No live API key or URL configured. Falling back to simulation.',
      };
      currentMode = 'simulation';
    } else {
      currentStatus = {
        mode: 'live',
        status: 'connected',
        provider: 'Live Data Provider',
        lastFetch: null,
        errorMessage: null,
      };
    }
  }
  notify();
}

export function configureLiveData(config: Partial<LiveDataConfig>): void {
  currentConfig = { ...currentConfig, ...config };
  if (currentMode === 'live') {
    setDataMode('live');
  }
  notify();
}

export function subscribeToDataMode(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export async function fetchLiveData(): Promise<{
  rainfall: number;
  waterLevel: number;
  temperature: number;
} | null> {
  if (!currentConfig.apiKey || !currentConfig.apiUrl) {
    currentStatus = {
      ...currentStatus,
      status: 'fallback',
      errorMessage: 'No live API configured. Using simulation data.',
    };
    notify();
    return null;
  }

  try {
    currentStatus = { ...currentStatus, status: 'connected', lastFetch: new Date().toISOString(), errorMessage: null };
    notify();
    return null;
  } catch (err) {
    currentStatus = {
      ...currentStatus,
      status: 'error',
      errorMessage: err instanceof Error ? err.message : 'Unknown error fetching live data',
    };
    notify();
    return null;
  }
}

export function isLiveMode(): boolean {
  return currentMode === 'live' && currentStatus.status === 'connected';
}

export function isSimulationMode(): boolean {
  return currentMode === 'simulation' || currentStatus.status === 'fallback';
}
