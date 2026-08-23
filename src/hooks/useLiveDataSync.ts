import { useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { getLiveDataRefreshInterval } from '@/services/liveData';

export function useLiveDataSync(): void {
  const location = useStore((state) => state.liveLocation);
  const dataMode = useStore((state) => state.dataMode);
  const refreshLiveData = useStore((state) => state.refreshLiveData);

  useEffect(() => {
    if (dataMode !== 'live') return;
    if (!location) {
      if (!navigator.geolocation) return;
      navigator.geolocation.getCurrentPosition(
        (position) => useStore.getState().setLiveLocation(position.coords.latitude, position.coords.longitude, 'Current location'),
        () => useStore.setState({
          liveData: { ...useStore.getState().liveData, status: 'unavailable', error: 'Location permission unavailable', dataStatus: 'UNAVAILABLE' },
          dataMode: 'live',
          floodZones: [],
          vaults: [],
          roadSegments: [],
          alerts: [],
          riskPredictions: [],
        })
      );
      return;
    }
    void refreshLiveData();
    const interval = window.setInterval(() => void refreshLiveData(), getLiveDataRefreshInterval());
    return () => window.clearInterval(interval);
  }, [dataMode, location, refreshLiveData]);
}