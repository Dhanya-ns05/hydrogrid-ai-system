import { Radio, Database, AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { useStore } from '@/store/useStore';

export function DataModeIndicator() {
  const dataMode = useStore((s) => s.dataMode);
  const dataSourceInfo = useStore((s) => s.dataSourceInfo);
  const setDataMode = useStore((s) => s.setDataMode);

  const isLive = dataMode === 'live' && dataSourceInfo.status === 'connected';
  const isFallback = dataSourceInfo.status === 'fallback';

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold ${
          isLive
            ? 'bg-risk-low/15 border-risk-low/30 text-risk-low'
            : isFallback
              ? 'bg-risk-medium/15 border-risk-medium/30 text-risk-medium'
              : 'bg-primary-500/15 border-primary-500/30 text-primary-400'
        }`}
      >
        <span className="relative flex h-2 w-2">
          {isLive && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-risk-low opacity-75"></span>
          )}
          <span
            className={`relative inline-flex rounded-full h-2 w-2 ${
              isLive ? 'bg-risk-low' : isFallback ? 'bg-risk-medium' : 'bg-primary-400'
            }`}
          ></span>
        </span>
        {isLive ? 'LIVE DATA CONNECTED' : isFallback ? 'SIMULATION (NO API)' : 'SIMULATION MODE'}
      </div>

      <div className="flex items-center gap-1.5 text-xs text-surface-600">
        {isLive ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
        <span>{dataSourceInfo.provider}</span>
        {dataSourceInfo.lastFetch && (
          <span className="text-surface-700">
            | Last: {new Date(dataSourceInfo.lastFetch).toLocaleTimeString()}
          </span>
        )}
      </div>

      {dataSourceInfo.errorMessage && (
        <div className="flex items-center gap-1.5 text-xs text-risk-medium">
          <AlertCircle className="w-3 h-3" />
          <span>{dataSourceInfo.errorMessage}</span>
        </div>
      )}

      <div className="flex items-center gap-1 ml-auto">
        <button
          onClick={() => setDataMode('simulation')}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold transition-all ${
            dataMode === 'simulation' || isFallback
              ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
              : 'bg-surface-200/30 text-surface-700 border border-surface-200/40 hover:bg-surface-300/40'
          }`}
        >
          <Database className="w-3 h-3" />
          SIM
        </button>
        <button
          onClick={() => setDataMode('live')}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold transition-all ${
            isLive
              ? 'bg-risk-low/20 text-risk-low border border-risk-low/30'
              : 'bg-surface-200/30 text-surface-700 border border-surface-200/40 hover:bg-surface-300/40'
          }`}
        >
          <Radio className="w-3 h-3" />
          LIVE
        </button>
      </div>
    </div>
  );
}
