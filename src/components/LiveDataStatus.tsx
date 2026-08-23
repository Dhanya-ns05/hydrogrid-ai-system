import { Clock3, Database, MapPin, Radio, WifiOff } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { getLiveDataEndpoint } from '@/services/liveData';

export function LiveDataStatus() {
  const liveData = useStore((state) => state.liveData);
  const location = liveData.selectedLocation;
  const isConnected = liveData.status === 'connected';

  return (
    <section className="card border-cyan-500/25 p-4" aria-label="Live Data Status">
      <div className="flex flex-wrap items-center gap-2">
        {isConnected ? <Radio className="h-4 w-4 text-risk-low" /> : <WifiOff className="h-4 w-4 text-risk-medium" />}
        <h2 className="text-sm font-bold uppercase tracking-wide text-white">Live Data Status</h2>
        <span className={`badge border text-[9px] ${isConnected ? 'border-risk-low/30 bg-risk-low/10 text-risk-low' : 'border-risk-medium/30 bg-risk-medium/10 text-risk-medium'}`}>
          {liveData.dataStatus}
        </span>
      </div>
      <div className="mt-3 grid grid-cols-1 gap-2 text-xs text-surface-600 sm:grid-cols-2 lg:grid-cols-6">
        <div className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{location ? `${location.name} (${location.latitude.toFixed(3)}, ${location.longitude.toFixed(3)})` : 'Location unavailable'}</div>
        <div className="flex items-center gap-1.5"><Database className="h-3.5 w-3.5" />{liveData.source ?? 'Backend not connected'}</div>
        <div className="flex items-center gap-1.5"><Database className="h-3.5 w-3.5" />API: {getLiveDataEndpoint()}</div>
        <div className="flex items-center gap-1.5"><Radio className="h-3.5 w-3.5" />{liveData.status === 'connected' ? 'Backend connected' : liveData.status === 'loading' ? 'Connecting...' : 'Live data unavailable'}</div>
        <div className="flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5" />Updated: {liveData.lastUpdated ? new Date(liveData.lastUpdated).toLocaleTimeString() : 'Never'}</div>
        <div className="flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5" />Next refresh: {liveData.nextRefreshAt ? new Date(liveData.nextRefreshAt).toLocaleTimeString() : 'Unavailable'}</div>
      </div>
      {liveData.error && <p className="mt-2 text-xs text-risk-medium">Live data unavailable: {liveData.error}</p>}
    </section>
  );
}