import type { Vault } from '@/types';

export async function getVaults(): Promise<Vault[]> {
  // MOCK IMPLEMENTATION
  // Future: connect to IoT stormwater vault sensors via MQTT/WebSocket
  return Promise.resolve([]);
}

export async function getVaultStatus(
  vaultId: string
): Promise<{ level: number; status: string }> {
  // MOCK IMPLEMENTATION
  return Promise.resolve({ level: 0, status: 'unknown' });
}
