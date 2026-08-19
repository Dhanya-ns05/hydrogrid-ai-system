import { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { riskColor, riskLabel } from '@/utils/risk';
import { GitBranch } from 'lucide-react';
import { ScenarioButtons } from '@/components/ScenarioButtons';
import { RoutingDecisionPanel } from '@/components/RoutingDecisionPanel';
import { DestinationComparisonTable } from '@/components/DestinationComparisonTable';
import { RoutingMap } from '@/components/RoutingMap';
import { RoutingAnalytics } from '@/components/RoutingAnalytics';
import { BaselineRoutingComparison } from '@/components/BaselineRoutingComparison';

export function WaterRoutingView() {
  const vaults = useStore((s) => s.vaults);
  const activeDiversion = useStore((s) => s.activeDiversion);
  const updateDiversionProgress = useStore((s) => s.updateDiversionProgress);

  // Auto-select the most critical vault
  const [selectedVaultId, setSelectedVaultId] = useState<string>(
    vaults.find((v) => v.riskLevel === 'critical')?.id ||
    vaults.slice().sort((a, b) => b.currentLevel - a.currentLevel)[0]?.id ||
    ''
  );

  // Animate diversion progress
  useEffect(() => {
    if (!activeDiversion || activeDiversion.progress >= 100) return;
    const interval = setInterval(() => {
      updateDiversionProgress();
    }, 400);
    return () => clearInterval(interval);
  }, [activeDiversion, updateDiversionProgress]);

  // Auto-select critical vault when vaults change (if no manual selection)
  useEffect(() => {
    if (activeDiversion) return; // don't override during diversion
    const critical = vaults.find((v) => v.riskLevel === 'critical');
    if (critical && critical.id !== selectedVaultId) {
      setSelectedVaultId(critical.id);
    }
  }, [vaults, activeDiversion, selectedVaultId]);

  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">Smart Water Routing</h2>
        <p className="text-sm text-surface-600 mt-1">
          Capacity-aware stormwater diversion engine - evaluates capacity, flood risk, predicted risk,
          distance, and network suitability - Simulated decision-support prototype
        </p>
      </div>

      {/* Scenario buttons */}
      <ScenarioButtons />

      {/* Source vault selector */}
      <div className="card p-4">
        <h3 className="text-xs font-bold text-white tracking-wide uppercase mb-3">
          Source Vault Selection
        </h3>
        <div className="flex flex-wrap gap-2">
          {vaults
            .slice()
            .sort((a, b) => b.currentLevel - a.currentLevel)
            .map((vault) => {
              const color = riskColor(vault.riskLevel);
              const isSelected = vault.id === selectedVaultId;
              const isCritical = vault.riskLevel === 'critical' || vault.riskLevel === 'high';
              return (
                <button
                  key={vault.id}
                  onClick={() => setSelectedVaultId(vault.id)}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border transition-all duration-200 ${
                    isSelected
                      ? 'bg-primary-500/10 border-primary-500/40'
                      : 'bg-surface-200/30 border-surface-200/40 hover:border-surface-300/60'
                  }`}
                >
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${color}20`, border: `1px solid ${color}40` }}
                  >
                    <GitBranch className="w-3.5 h-3.5" style={{ color }} />
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white font-mono">{vault.id}</span>
                      <span
                        className="badge text-[8px] border"
                        style={{ backgroundColor: `${color}15`, color, borderColor: `${color}30` }}
                      >
                        {riskLabel(vault.riskLevel)}
                      </span>
                    </div>
                    <span className="text-[10px] text-surface-600">{Math.round(vault.currentLevel)}% full</span>
                  </div>
                  {isCritical && (
                    <span className="w-1.5 h-1.5 rounded-full bg-risk-critical animate-pulse"></span>
                  )}
                </button>
              );
            })}
        </div>
      </div>

      {/* Map + Decision Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-white tracking-tight">Routing Map</h3>
            <span className="text-xs text-surface-600">Bengaluru, Karnataka - Simulated</span>
          </div>
          <RoutingMap sourceVaultId={selectedVaultId} />
        </div>
        <div className="lg:col-span-1">
          <RoutingDecisionPanel sourceVaultId={selectedVaultId} />
        </div>
      </div>

      {/* Destination comparison table */}
      <DestinationComparisonTable sourceVaultId={selectedVaultId} />

      {/* Baseline comparison */}
      <BaselineRoutingComparison sourceVaultId={selectedVaultId} />

      {/* Analytics */}
      <RoutingAnalytics />
    </div>
  );
}
