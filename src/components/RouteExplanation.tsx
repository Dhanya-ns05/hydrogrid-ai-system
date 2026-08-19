import { useStore } from '@/store/useStore';
import { CheckCircle, AlertTriangle, Info } from 'lucide-react';

export function RouteExplanation() {
  const emergencyRouteSet = useStore((s) => s.emergencyRouteSet);

  if (!emergencyRouteSet || !emergencyRouteSet.recommended || emergencyRouteSet.recommended.status === 'no_route') {
    return null;
  }

  const recommended = emergencyRouteSet.recommended;

  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-3">
        <Info className="w-4 h-4 text-primary-400" />
        <h3 className="text-sm font-bold text-white tracking-wide uppercase">
          Why This Route?
        </h3>
      </div>
      <p className="text-xs text-surface-600 mb-3">
        Recommended Route - Decision Support Explanation
      </p>
      <div className="space-y-2">
        {recommended.reasons.map((reason, i) => (
          <div key={i} className="flex items-start gap-2">
            <CheckCircle className="w-3.5 h-3.5 text-risk-low shrink-0 mt-0.5" />
            <span className="text-xs text-surface-200">{reason}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 p-3 rounded-lg bg-surface-200/20 border border-surface-200/30">
        <div className="flex items-start gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-risk-medium shrink-0 mt-0.5" />
          <p className="text-[11px] text-surface-600 leading-relaxed">
            This is a decision-support recommendation from a routing algorithm, not AI.
            The final decision remains with emergency personnel. All data is simulated.
          </p>
        </div>
      </div>
    </div>
  );
}
