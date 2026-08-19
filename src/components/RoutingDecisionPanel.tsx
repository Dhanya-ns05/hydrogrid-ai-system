import { GitBranch, ArrowRight, CheckCircle, XCircle, Droplets, Gauge, MapPin, AlertTriangle } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { riskColor, riskLabel } from '@/utils/risk';
import { recommendDiversion } from '@/services/routing/routingEngine';
import { usePredictionEngine } from '@/hooks/usePredictionEngine';
import { useMemo } from 'react';

export function RoutingDecisionPanel({ sourceVaultId }: { sourceVaultId: string | null }) {
  const vaults = useStore((s) => s.vaults);
  const routingWeights = useStore((s) => s.routingWeights);
  const activeDiversion = useStore((s) => s.activeDiversion);
  const startDiversion = useStore((s) => s.startDiversion);
  const stopDiversion = useStore((s) => s.stopDiversion);
  const { predictions } = usePredictionEngine(10);

  const sourceVault = sourceVaultId ? vaults.find((v) => v.id === sourceVaultId) : null;

  const recommendation = useMemo(() => {
    if (!sourceVault) return null;
    return recommendDiversion(sourceVault, vaults, predictions, routingWeights);
  }, [sourceVault, vaults, predictions, routingWeights]);

  if (!sourceVault) {
    return (
      <div className="card p-5">
        <h3 className="text-sm font-bold text-white tracking-wide uppercase mb-4">
          Smart Water Routing
        </h3>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <GitBranch className="w-8 h-8 text-surface-500 mb-2" />
          <p className="text-sm text-surface-700">Select a critical vault to evaluate routing options</p>
        </div>
      </div>
    );
  }

  const sourceColor = riskColor(sourceVault.riskLevel);
  const dest = recommendation?.recommendedDestination;
  const destVault = dest ? vaults.find((v) => v.id === dest.vaultId) : null;
  const destColor = destVault ? riskColor(destVault.riskLevel) : '#64748b';
  const isDiverting = activeDiversion !== null;

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-white tracking-wide uppercase">
          Smart Water Routing
        </h3>
        {isDiverting && (
          <span className="badge bg-primary-500/15 text-primary-400 border border-primary-500/30 animate-pulse">
            <Droplets className="w-3 h-3 mr-1" />
            DIVERSION ACTIVE
          </span>
        )}
      </div>

      {/* Source Vault */}
      <div className="space-y-3">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-200/30 border border-surface-200/40">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${sourceColor}20`, border: `1px solid ${sourceColor}40` }}
          >
            <GitBranch className="w-4 h-4" style={{ color: sourceColor }} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white font-mono">{sourceVault.id}</span>
              <span className="badge text-[9px] border" style={{ backgroundColor: `${sourceColor}15`, color: sourceColor, borderColor: `${sourceColor}30` }}>
                {riskLabel(sourceVault.riskLevel)}
              </span>
            </div>
            <div className="flex items-center gap-4 mt-1">
              <span className="text-xs text-surface-600 flex items-center gap-1">
                <Gauge className="w-3 h-3" /> {Math.round(sourceVault.currentLevel)}% full
              </span>
              <span className="text-xs text-surface-600 flex items-center gap-1">
                <Droplets className="w-3 h-3" /> {Math.round(sourceVault.availableCapacity)}% avail
              </span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-surface-600 uppercase">Source</p>
          </div>
        </div>

        {/* Arrow / Flow indicator */}
        <div className="flex items-center justify-center gap-2 py-1">
          {isDiverting ? (
            <div className="flex flex-col items-center gap-1">
              <ArrowRight className="w-5 h-5 text-primary-400 animate-pulse" />
              <span className="text-[10px] text-primary-400 font-bold animate-pulse">SIMULATED WATER TRANSFER</span>
            </div>
          ) : (
            <ArrowRight className="w-5 h-5 text-surface-600" />
          )}
        </div>

        {/* Destination */}
        {dest && destVault ? (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-risk-low/5 border border-risk-low/20">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${destColor}20`, border: `1px solid ${destColor}40` }}
            >
              <CheckCircle className="w-4 h-4" style={{ color: destColor }} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white font-mono">{destVault.id}</span>
                <span className="badge bg-risk-low/15 text-risk-low border border-risk-low/30 text-[9px]">
                  RECOMMENDED
                </span>
              </div>
              <div className="flex items-center gap-4 mt-1">
                <span className="text-xs text-surface-600 flex items-center gap-1">
                  <Gauge className="w-3 h-3" /> {Math.round(destVault.currentLevel)}% full
                </span>
                <span className="text-xs text-surface-600 flex items-center gap-1">
                  <Droplets className="w-3 h-3" /> {Math.round(dest.availableCapacity)}% avail
                </span>
                <span className="text-xs text-surface-600 flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {dest.distance}m
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-white leading-none">{dest.score}</p>
              <p className="text-[10px] text-surface-600 uppercase mt-0.5">Score / 100</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-risk-critical/10 border border-risk-critical/30">
            <XCircle className="w-5 h-5 text-risk-critical shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-bold text-risk-critical">NO SAFE DIVERSION AVAILABLE</p>
              <p className="text-xs text-surface-600 mt-0.5">Continue local retention and issue overflow warning.</p>
            </div>
          </div>
        )}

        {/* Decision */}
        <div className="p-3 rounded-lg bg-primary-500/5 border border-primary-500/20">
          <div className="flex items-center gap-2 mb-2">
            {dest ? (
              <CheckCircle className="w-4 h-4 text-risk-low" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-risk-critical" />
            )}
            <span className="text-xs font-bold text-white uppercase tracking-wide">
              Decision: {dest ? 'DIVERT WATER' : 'HOLD - NO SAFE ROUTE'}
            </span>
          </div>
          <p className="text-xs text-surface-700 leading-relaxed">{recommendation?.reason}</p>
        </div>

        {/* Explainability */}
        {dest && (
          <div className="p-3 rounded-lg bg-surface-200/20 border border-surface-200/30">
            <p className="text-[10px] font-bold text-surface-600 uppercase tracking-wide mb-2">Why this destination?</p>
            <div className="space-y-1">
              {dest.reasons.map((r, i) => (
                <div key={i} className="flex items-start gap-2">
                  <CheckCircle className="w-3 h-3 text-risk-low shrink-0 mt-0.5" />
                  <span className="text-xs text-surface-200">{r}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action button */}
        {dest && destVault && (
          <button
            onClick={() => {
              if (isDiverting) {
                stopDiversion();
              } else {
                startDiversion(
                  sourceVault.id,
                  destVault.id,
                  sourceVault.currentLevel,
                  destVault.currentLevel,
                  dest.score
                );
              }
            }}
            disabled={isDiverting && activeDiversion?.progress >= 100}
            className={`w-full flex items-center justify-center gap-2 mt-1 ${
              isDiverting ? 'btn-secondary' : 'btn-primary'
            }`}
          >
            <Droplets className="w-4 h-4" />
            {isDiverting ? 'STOP DIVERSION' : 'START DIVERSION'}
          </button>
        )}
      </div>
    </div>
  );
}
