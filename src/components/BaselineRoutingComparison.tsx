import { useStore } from '@/store/useStore';
import { recommendDiversion, baselineRoute } from '@/services/routing/routingEngine';
import { riskColor, riskLabel } from '@/utils/risk';
import { usePredictionEngine } from '@/hooks/usePredictionEngine';
import { useMemo } from 'react';
import { GitBranch, ArrowRight, CheckCircle, AlertTriangle } from 'lucide-react';

export function BaselineRoutingComparison({ sourceVaultId }: { sourceVaultId: string | null }) {
  const vaults = useStore((s) => s.vaults);
  const routingWeights = useStore((s) => s.routingWeights);
  const { predictions } = usePredictionEngine(10);

  const sourceVault = sourceVaultId ? vaults.find((v) => v.id === sourceVaultId) : null;

  const smartRec = useMemo(() => {
    if (!sourceVault) return null;
    return recommendDiversion(sourceVault, vaults, predictions, routingWeights);
  }, [sourceVault, vaults, predictions, routingWeights]);

  const baselineRec = useMemo(() => {
    if (!sourceVault) return null;
    return baselineRoute(sourceVault, vaults);
  }, [sourceVault, vaults]);

  if (!sourceVault || !smartRec || !baselineRec) {
    return null;
  }

  const smartDest = smartRec.recommendedDestination;
  const smartDestVault = smartDest ? vaults.find((v) => v.id === smartDest.vaultId) : null;
  const baselineDestVault = baselineRec.destinationId ? vaults.find((v) => v.id === baselineRec.destinationId) : null;

  const smartSafe = smartRec.hasSafeDestination;
  const baselineSafe = baselineDestVault && baselineDestVault.riskLevel !== 'critical' && baselineDestVault.availableCapacity >= 15;

  return (
    <div className="card p-5">
      <h3 className="text-sm font-bold text-white tracking-wide uppercase mb-4">
        Baseline vs Smart Routing
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Traditional */}
        <div className="p-4 rounded-lg bg-surface-200/20 border border-surface-200/40">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-risk-medium" />
            <span className="text-xs font-bold text-surface-200 uppercase">Traditional Threshold</span>
          </div>
          <p className="text-[11px] text-surface-600 mb-3">
            Sends water to a predefined destination regardless of current conditions.
          </p>
          {baselineDestVault ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs">
                <span className="font-mono font-bold text-white">{sourceVault.id}</span>
                <ArrowRight className="w-3 h-3 text-surface-600" />
                <span className="font-mono font-bold" style={{ color: riskColor(baselineDestVault.riskLevel) }}>{baselineDestVault.id}</span>
              </div>
              <div className="text-xs space-y-0.5 text-surface-600">
                <p>Available: {Math.round(baselineDestVault.availableCapacity)}%</p>
                <p>Risk: <span style={{ color: riskColor(baselineDestVault.riskLevel) }}>{riskLabel(baselineDestVault.riskLevel)}</span></p>
              </div>
              <div className={`flex items-center gap-1.5 text-xs font-semibold ${baselineSafe ? 'text-risk-low' : 'text-risk-critical'}`}>
                {baselineSafe ? <CheckCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                {baselineSafe ? 'Safe destination' : 'UNSAFE - may overflow destination'}
              </div>
            </div>
          ) : (
            <p className="text-xs text-surface-600">No connected vault available</p>
          )}
        </div>

        {/* Smart */}
        <div className="p-4 rounded-lg bg-primary-500/5 border border-primary-500/20">
          <div className="flex items-center gap-2 mb-3">
            <GitBranch className="w-4 h-4 text-primary-400" />
            <span className="text-xs font-bold text-primary-400 uppercase">HydroGrid Smart Routing</span>
          </div>
          <p className="text-[11px] text-surface-600 mb-3">
            Evaluates capacity + flood risk + predicted risk + distance + network suitability.
          </p>
          {smartDest && smartDestVault ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs">
                <span className="font-mono font-bold text-white">{sourceVault.id}</span>
                <ArrowRight className="w-3 h-3 text-primary-400" />
                <span className="font-mono font-bold" style={{ color: riskColor(smartDestVault.riskLevel) }}>{smartDestVault.id}</span>
                <span className="ml-auto text-sm font-bold text-primary-400">{smartDest.score}/100</span>
              </div>
              <div className="text-xs space-y-0.5 text-surface-600">
                <p>Available: {Math.round(smartDest.availableCapacity)}%</p>
                <p>Risk: <span style={{ color: riskColor(smartDest.currentRisk) }}>{riskLabel(smartDest.currentRisk)}</span></p>
                <p>Predicted: <span style={{ color: riskColor(smartDest.predictedRisk) }}>{riskLabel(smartDest.predictedRisk)}</span></p>
                <p>Distance: {smartDest.distance}m</p>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-risk-low">
                <CheckCircle className="w-3 h-3" />
                Safe destination - all factors evaluated
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-risk-critical">
              <AlertTriangle className="w-3 h-3" />
              NO SAFE DIVERSION - holding for safety
            </div>
          )}
        </div>
      </div>

      {/* Comparison note */}
      <div className="mt-4 p-3 rounded-lg bg-surface-200/15 border border-surface-200/25">
        <p className="text-[11px] text-surface-600 leading-relaxed">
          The traditional approach routes to a fixed destination. The smart routing engine evaluates
          all connected vaults against multiple weighted factors and only recommends diversion when
          a safe destination exists. Results are based on simulated data - this is a decision-support
          prototype, not real drainage control.
        </p>
      </div>
    </div>
  );
}
