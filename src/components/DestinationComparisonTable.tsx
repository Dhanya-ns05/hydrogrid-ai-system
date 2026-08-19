import { useStore } from '@/store/useStore';
import { recommendDiversion } from '@/services/routing/routingEngine';
import { riskColor, riskLabel } from '@/utils/risk';
import { usePredictionEngine } from '@/hooks/usePredictionEngine';
import { useMemo } from 'react';
import { Table } from 'lucide-react';

export function DestinationComparisonTable({ sourceVaultId }: { sourceVaultId: string | null }) {
  const vaults = useStore((s) => s.vaults);
  const routingWeights = useStore((s) => s.routingWeights);
  const { predictions } = usePredictionEngine(10);

  const sourceVault = sourceVaultId ? vaults.find((v) => v.id === sourceVaultId) : null;

  const recommendation = useMemo(() => {
    if (!sourceVault) return null;
    return recommendDiversion(sourceVault, vaults, predictions, routingWeights);
  }, [sourceVault, vaults, predictions, routingWeights]);

  if (!sourceVault || !recommendation) {
    return (
      <div className="card p-5">
        <h3 className="text-sm font-bold text-white tracking-wide uppercase mb-4">
          Destination Comparison
        </h3>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Table className="w-8 h-8 text-surface-500 mb-2" />
          <p className="text-sm text-surface-700">Select a vault to compare destinations</p>
        </div>
      </div>
    );
  }

  const candidates = recommendation.allCandidates;

  if (candidates.length === 0) {
    return (
      <div className="card p-5">
        <h3 className="text-sm font-bold text-white tracking-wide uppercase mb-4">
          Destination Comparison
        </h3>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <p className="text-sm text-surface-700">No connected vaults with safe available capacity</p>
        </div>
      </div>
    );
  }

  const statusBadge = (status: string) => {
    switch (status) {
      case 'recommended':
        return { bg: 'bg-risk-low/15', text: 'text-risk-low', border: 'border-risk-low/30', label: 'RECOMMENDED' };
      case 'available':
        return { bg: 'bg-primary-500/10', text: 'text-primary-400', border: 'border-primary-500/20', label: 'AVAILABLE' };
      case 'avoid':
        return { bg: 'bg-risk-critical/10', text: 'text-risk-critical', border: 'border-risk-critical/30', label: 'AVOID' };
      default:
        return { bg: 'bg-surface-200/30', text: 'text-surface-600', border: 'border-surface-200/40', label: status.toUpperCase() };
    }
  };

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-white tracking-wide uppercase">
          Destination Comparison
        </h3>
        <span className="text-xs text-surface-600">
          From <span className="font-mono font-bold text-primary-400">{sourceVault.id}</span>
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-surface-600 border-b border-surface-200/40">
              <th className="text-left font-semibold uppercase tracking-wide py-2 px-2">Vault</th>
              <th className="text-right font-semibold uppercase tracking-wide py-2 px-2">Avail. Cap.</th>
              <th className="text-center font-semibold uppercase tracking-wide py-2 px-2">Current Risk</th>
              <th className="text-center font-semibold uppercase tracking-wide py-2 px-2">Predicted Risk</th>
              <th className="text-right font-semibold uppercase tracking-wide py-2 px-2">Distance</th>
              <th className="text-right font-semibold uppercase tracking-wide py-2 px-2">Score</th>
              <th className="text-center font-semibold uppercase tracking-wide py-2 px-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {candidates.map((c) => {
              const sb = statusBadge(c.status);
              return (
                <tr
                  key={c.vaultId}
                  className={`border-b border-surface-200/20 hover:bg-surface-200/20 transition-colors ${
                    c.status === 'recommended' ? 'bg-risk-low/5' : ''
                  }`}
                >
                  <td className="py-2.5 px-2">
                    <span className="font-mono font-bold text-white">{c.vaultId}</span>
                  </td>
                  <td className="text-right py-2.5 px-2">
                    <span className="font-semibold text-surface-200">{Math.round(c.availableCapacity)}%</span>
                  </td>
                  <td className="text-center py-2.5 px-2">
                    <span
                      className="badge text-[9px] border"
                      style={{
                        backgroundColor: `${riskColor(c.currentRisk)}15`,
                        color: riskColor(c.currentRisk),
                        borderColor: `${riskColor(c.currentRisk)}30`,
                      }}
                    >
                      {riskLabel(c.currentRisk)}
                    </span>
                  </td>
                  <td className="text-center py-2.5 px-2">
                    <span
                      className="badge text-[9px] border"
                      style={{
                        backgroundColor: `${riskColor(c.predictedRisk)}15`,
                        color: riskColor(c.predictedRisk),
                        borderColor: `${riskColor(c.predictedRisk)}30`,
                      }}
                    >
                      {riskLabel(c.predictedRisk)}
                    </span>
                  </td>
                  <td className="text-right py-2.5 px-2 text-surface-200">{c.distance}m</td>
                  <td className="text-right py-2.5 px-2">
                    <span className={`font-bold ${c.score >= 70 ? 'text-risk-low' : c.score >= 50 ? 'text-risk-medium' : 'text-risk-critical'}`}>
                      {c.score}
                    </span>
                  </td>
                  <td className="text-center py-2.5 px-2">
                    <span className={`badge text-[9px] border ${sb.bg} ${sb.text} ${sb.border}`}>
                      {sb.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Weight configuration */}
      <div className="mt-4 pt-4 border-t border-surface-200/30">
        <p className="text-[10px] font-bold text-surface-600 uppercase tracking-wide mb-2">Routing Score Weights</p>
        <div className="grid grid-cols-5 gap-2">
          {(
            [
              { label: 'Capacity', value: routingWeights.availableCapacity },
              { label: 'Flood Risk', value: routingWeights.floodRisk },
              { label: 'Predicted', value: routingWeights.predictedRisk },
              { label: 'Distance', value: routingWeights.distance },
              { label: 'Network', value: routingWeights.networkSuitability },
            ] as const
          ).map((w) => (
            <div key={w.label} className="text-center">
              <p className="text-[10px] text-surface-600">{w.label}</p>
              <p className="text-sm font-bold text-primary-400">{Math.round(w.value * 100)}%</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
