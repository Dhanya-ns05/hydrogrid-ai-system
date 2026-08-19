import { CheckCircle, CloudRain, Gauge, Droplets, Database, Waypoints, Ambulance, Clock } from 'lucide-react';
import { useStore } from '@/store/useStore';
import type { FloodEventSummary } from '@/types';

export function FloodEventSummaryCard() {
  const summary = useStore((s) => s.floodEventDemo.summary);
  const demoComplete = useStore((s) => s.floodEventDemo.phase === 'complete' && !s.floodEventDemo.active);
  const hydroGridImpact = useStore((s) => s.hydroGridImpact);

  if (!summary || !demoComplete) return null;

  const metrics: { icon: typeof CloudRain; label: string; value: string }[] = [
    { icon: CloudRain, label: 'Peak Rainfall', value: `${summary.peakRainfall} mm/hr` },
    { icon: Gauge, label: 'Peak Flood Probability', value: `${summary.highestFloodRisk}%` },
    { icon: Database, label: 'Critical Vaults', value: `${summary.criticalVaults}` },
    { icon: Droplets, label: 'Water Diverted', value: `${summary.waterDiverted.toLocaleString()}L` },
    { icon: Gauge, label: 'Flood Hotspots', value: `${summary.blockedRoads > 0 ? 'Multiple' : 'None'}` },
    { icon: Waypoints, label: 'Blocked Roads', value: `${summary.blockedRoads}` },
    { icon: Ambulance, label: 'Recommended Emergency Route', value: summary.emergencyRoute },
    { icon: Clock, label: 'Estimated Simulated Delay', value: `${summary.emergencyDelay} min` },
  ];

  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-4">
        <CheckCircle className="w-5 h-5 text-risk-low" />
        <h3 className="text-sm font-bold text-white tracking-wide uppercase">
          HydroGrid Flood Event Summary
        </h3>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <div key={m.label} className="p-3 rounded-lg bg-surface-200/20 border border-surface-200/30">
              <div className="flex items-center gap-2 mb-1">
                <Icon className="w-3.5 h-3.5 text-primary-400" />
                <span className="text-[10px] text-surface-600 uppercase tracking-wide">{m.label}</span>
              </div>
              <p className="text-sm font-bold text-white">{m.value}</p>
            </div>
          );
        })}
      </div>

      {/* Response Steps */}
      <div className="p-3 rounded-lg bg-risk-low/5 border border-risk-low/20">
        <p className="text-xs font-bold text-risk-low uppercase mb-2">HydroGrid Response</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {summary.responseSteps.map((step, i) => (
            <div key={i} className="flex items-center gap-2">
              <CheckCircle className="w-3.5 h-3.5 text-risk-low shrink-0" />
              <span className="text-xs text-surface-200">{step}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Baseline vs HydroGrid */}
      {hydroGridImpact && (
        <div className="mt-5">
          <h4 className="text-xs font-bold text-white tracking-wide uppercase mb-3">
            Baseline vs HydroGrid
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 rounded-lg bg-surface-200/20 border border-surface-200/30">
              <p className="text-[10px] font-bold text-surface-600 uppercase mb-2">Without HydroGrid</p>
              <div className="space-y-1">
                <MetricRow label="Peak Water Level" value={`${Math.round(hydroGridImpact.withoutHydroGrid.maxWaterLevel)}%`} />
                <MetricRow label="Critical Vaults" value={`${hydroGridImpact.withoutHydroGrid.criticalVaults}`} />
                <MetricRow label="Overflow Events" value={`${hydroGridImpact.withoutHydroGrid.overflowEvents}`} />
                <MetricRow label="Blocked Roads" value={`${hydroGridImpact.withoutHydroGrid.blockedRoads}`} />
                <MetricRow label="Emergency Delay" value={`${hydroGridImpact.withoutHydroGrid.emergencyDelay} min`} />
              </div>
            </div>
            <div className="p-3 rounded-lg bg-primary-500/5 border border-primary-500/20">
              <p className="text-[10px] font-bold text-primary-400 uppercase mb-2">With HydroGrid</p>
              <div className="space-y-1">
                <MetricRow label="Peak Water Level" value={`${Math.round(hydroGridImpact.withHydroGrid.maxWaterLevel)}%`} />
                <MetricRow label="Critical Vaults" value={`${hydroGridImpact.withHydroGrid.criticalVaults}`} />
                <MetricRow label="Overflow Events" value={`${hydroGridImpact.withHydroGrid.overflowEvents}`} />
                <MetricRow label="Blocked Roads" value={`${hydroGridImpact.withHydroGrid.blockedRoads}`} />
                <MetricRow label="Emergency Delay" value={`${hydroGridImpact.withHydroGrid.emergencyDelay} min`} />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-3">
        <span className="badge bg-surface-200/40 text-surface-600 border border-surface-300/30">
          SIMULATED RESULTS - PROTOTYPE BEHAVIOR
        </span>
      </div>
    </div>
  );
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-surface-600">{label}</span>
      <span className="font-bold text-white">{value}</span>
    </div>
  );
}
