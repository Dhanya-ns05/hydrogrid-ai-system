import { useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { SIMULATION_INTERVAL_MS } from '@/services/simulation';

export function useSimulationEngine() {
  const tick = useStore((s) => s.tick);
  const simState = useStore((s) => s.simulation.state);
  const dataMode = useStore((s) => s.dataMode);

  useEffect(() => {
    if (simState !== 'running' || dataMode === 'live') return;
    const interval = setInterval(() => {
      tick();
    }, SIMULATION_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [tick, simState, dataMode]);
}
