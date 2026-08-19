import { CloudRain, TrendingUp, Brain, MapPin, Database, GitBranch, Droplets, Waypoints, Ambulance, Route, ArrowDown, CheckCircle } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { riskColor, riskLabel } from '@/utils/risk';

export function HowHydroGridThinks() {
  const simulation = useStore((s) => s.simulation);
  const floodZones = useStore((s) => s.floodZones);
  const vaults = useStore((s) => s.vaults);
  const activeDiversion = useStore((s) => s.activeDiversion);
  const roadGraph = useStore((s) => s.roadGraph);
  const emergencyRouteSet = useStore((s) => s.emergencyRouteSet);
  const floodEventDemo = useStore((s) => s.floodEventDemo);

  // Find highest risk zone
  const hotspot = floodZones.reduce((max, z) => z.riskScore > max.riskScore ? z : max, floodZones[0]);
  // Find most critical vault
  const criticalVault = vaults.reduce((max, v) => v.currentLevel > max.currentLevel ? v : max, vaults[0]);
  // Find blocked roads
  const blockedRoads = roadGraph.filter(r => !r.accessible);

  // Build the decision chain dynamically
  const chain: { icon: typeof CloudRain; label: string; value: string; active: boolean }[] = [
    {
      icon: CloudRain,
      label: 'Rainfall',
      value: `${Math.round(simulation.rainfallIntensity)} mm/hr`,
      active: simulation.rainfallIntensity > 30,
    },
    {
      icon: TrendingUp,
      label: 'Water Level Rising',
      value: `${Math.round(hotspot?.waterLevel || 0)}% in ${hotspot?.name || '—'}`,
      active: (hotspot?.waterLevel || 0) > 40,
    },
    {
      icon: Brain,
      label: 'Flood Probability',
      value: `${Math.round(hotspot?.riskScore || 0)}% - ${hotspot ? riskLabel(hotspot.riskLevel) : '—'}`,
      active: (hotspot?.riskScore || 0) > 50,
    },
    {
      icon: MapPin,
      label: 'Flood Hotspot',
      value: hotspot ? `${hotspot.name} (${riskLabel(hotspot.riskLevel)})` : 'None detected',
      active: (hotspot?.riskLevel || 'low') === 'high' || (hotspot?.riskLevel || 'low') === 'critical',
    },
    {
      icon: Database,
      label: 'Critical Vault',
      value: `${criticalVault?.id || '—'} at ${Math.round(criticalVault?.currentLevel || 0)}%`,
      active: (criticalVault?.currentLevel || 0) > 75,
    },
    {
      icon: GitBranch,
      label: 'Evaluating Destinations',
      value: activeDiversion
        ? `${activeDiversion.sourceVaultId} → ${activeDiversion.destinationVaultId}`
        : criticalVault && criticalVault.currentLevel > 75
          ? 'Searching connected vaults...'
          : 'No action needed',
      active: !!activeDiversion || (criticalVault?.currentLevel || 0) > 75,
    },
    {
      icon: Droplets,
      label: 'Water Diversion',
      value: activeDiversion
        ? `Active: ${activeDiversion.sourceVaultId} → ${activeDiversion.destinationVaultId}`
        : 'Inactive',
      active: !!activeDiversion,
    },
    {
      icon: Waypoints,
      label: 'Road Risk Updated',
      value: blockedRoads.length > 0
        ? `${blockedRoads.length} road(s) blocked`
        : 'All roads passable',
      active: blockedRoads.length > 0,
    },
    {
      icon: Ambulance,
      label: 'Ambulance Route',
      value: emergencyRouteSet
        ? emergencyRouteSet.hasSafeRoute
          ? `Safe route found (${emergencyRouteSet.recommended?.estimatedTime || 0} min)`
          : 'NO SAFE ROUTE'
        : blockedRoads.length > 0
          ? 'Recalculation needed'
          : 'Normal route clear',
      active: blockedRoads.length > 0 || !!emergencyRouteSet,
    },
  ];

  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-4">
        <Route className="w-4 h-4 text-primary-400" />
        <h3 className="text-sm font-bold text-white tracking-wide uppercase">
          How HydroGrid Thinks
        </h3>
        <span className="ml-auto text-[10px] text-surface-600">Live Decision Chain</span>
      </div>

      <div className="space-y-1">
        {chain.map((step, i) => {
          const Icon = step.icon;
          const isLast = i === chain.length - 1;
          return (
            <div key={i}>
              <div className={`flex items-center gap-3 p-2 rounded-lg transition-all ${
                step.active ? 'bg-primary-500/5 border border-primary-500/15' : 'opacity-50'
              }`}>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                  step.active ? 'bg-primary-500/15' : 'bg-surface-200/30'
                }`}>
                  <Icon className={`w-3.5 h-3.5 ${step.active ? 'text-primary-400' : 'text-surface-600'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-semibold ${step.active ? 'text-white' : 'text-surface-600'}`}>
                    {step.label}
                  </p>
                </div>
                <p className={`text-xs font-mono ${step.active ? 'text-primary-400' : 'text-surface-600'}`}>
                  {step.value}
                </p>
                {step.active && !isLast && (
                  <CheckCircle className="w-3 h-3 text-risk-low shrink-0" />
                )}
              </div>
              {!isLast && (
                <div className="flex items-center justify-center py-0.5">
                  <ArrowDown className={`w-3 h-3 ${step.active ? 'text-primary-400/40' : 'text-surface-600/30'}`} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {floodEventDemo.summary && (
        <div className="mt-4 p-3 rounded-lg bg-risk-low/5 border border-risk-low/20">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-3.5 h-3.5 text-risk-low" />
            <span className="text-xs font-bold text-risk-low uppercase">System Response Complete</span>
          </div>
          <div className="space-y-1">
            {floodEventDemo.summary.responseSteps.map((step, i) => (
              <div key={i} className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3 text-risk-low shrink-0" />
                <span className="text-xs text-surface-200">{step}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
