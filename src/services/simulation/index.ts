import type { SimulationConfig, SimulationState } from '@/types';

export const SIMULATION_INTERVAL_MS = 2000;

export function getSpeedLabel(speed: SimulationConfig['speed']): string {
  switch (speed) {
    case 'slow':
      return 'Slow (0.5x)';
    case 'fast':
      return 'Fast (2x)';
    default:
      return 'Normal (1x)';
  }
}

export function getSimulationStateLabel(state: SimulationState): string {
  switch (state) {
    case 'running':
      return 'SIMULATION ACTIVE';
    case 'paused':
      return 'SIMULATION PAUSED';
    default:
      return 'SIMULATION IDLE';
  }
}

// Future: connect to real-time data streams
// - Weather/rainfall APIs
// - IoT sensor MQTT/WebSocket streams
// - Traffic APIs
// - ML prediction endpoints
