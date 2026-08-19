import type { FloodZone } from '@/types';

export async function getFloodZones(): Promise<FloodZone[]> {
  // MOCK IMPLEMENTATION
  // Future: connect to IoT sensor data, flood datasets, ML prediction API
  return Promise.resolve([]);
}

export async function getFloodPrediction(
  zoneId: string
): Promise<{ riskScore: number; horizon: string }> {
  // MOCK IMPLEMENTATION
  // Future: ML flood prediction model
  return Promise.resolve({ riskScore: 0, horizon: '0h' });
}
