import { CloudRain, AlertTriangle, Database, Gauge, Droplets, Ambulance } from 'lucide-react';
import { useStore, getKPIs } from '@/store/useStore';
import { formatNumber } from '@/utils/risk';
import type { KPIData } from '@/types';

const iconMap = {
  currentRainfall: CloudRain,
  activeFloodHotspots: AlertTriangle,
  criticalVaults: Database,
  highestFloodRisk: Gauge,
  waterDiverted: Droplets,
  emergencyRoutesAffected: Ambulance,
};

const labelMap: Record<keyof KPIData, string> = {
  currentRainfall: 'Current Rainfall',
  activeFloodHotspots: 'Active Flood Hotspots',
  criticalVaults: 'Critical Vaults',
  highestFloodRisk: 'Highest Flood Risk',
  waterDiverted: 'Water Diverted',
  emergencyRoutesAffected: 'Emergency Routes Affected',
};

const unitMap: Record<keyof KPIData, string> = {
  currentRainfall: 'mm/hr',
  activeFloodHotspots: '',
  criticalVaults: '',
  highestFloodRisk: '%',
  waterDiverted: 'L',
  emergencyRoutesAffected: '',
};

export function KPICards() {
  const state = useStore((s) => s);
  const kpis = getKPIs(state);

  const entries = Object.entries(kpis) as [keyof KPIData, number][];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
      {entries.map(([key, value]) => {
        const Icon = iconMap[key];
        const isCritical =
          (key === 'highestFloodRisk' && value >= 85) ||
          (key === 'criticalVaults' && value >= 2) ||
          (key === 'activeFloodHotspots' && value >= 3);

        return (
          <div key={key} className="kpi-card group">
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-lg bg-surface-200/60 flex items-center justify-center group-hover:bg-primary-500/10 transition-colors">
                <Icon
                  className={`w-4 h-4 ${
                    isCritical ? 'text-risk-critical' : 'text-primary-400'
                  }`}
                />
              </div>
              {isCritical && (
                <span className="w-2 h-2 rounded-full bg-risk-critical animate-glow"></span>
              )}
            </div>
            <div>
              <p className="text-2xl font-bold text-white tracking-tight leading-none">
                {key === 'waterDiverted' ? formatNumber(value) : value}
                {unitMap[key] && (
                  <span className="text-sm font-medium text-surface-600 ml-1">
                    {unitMap[key]}
                  </span>
                )}
              </p>
              <p className="text-xs text-surface-600 font-medium mt-1.5">
                {labelMap[key]}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
