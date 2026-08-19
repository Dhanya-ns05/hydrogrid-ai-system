import { useStore } from '@/store/useStore';
import { riskColor, riskLabel } from '@/utils/risk';
import { Table, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import type { RouteResult } from '@/types';

export function RouteComparisonTable() {
  const emergencyRouteSet = useStore((s) => s.emergencyRouteSet);

  if (!emergencyRouteSet) {
    return (
      <div className="card p-5">
        <h3 className="text-sm font-bold text-white tracking-wide uppercase mb-4">
          Route Comparison
        </h3>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Table className="w-8 h-8 text-surface-500 mb-2" />
          <p className="text-sm text-surface-700">Calculate routes to see comparison</p>
        </div>
      </div>
    );
  }

  const routes: { label: string; route: RouteResult | null; color: string }[] = [
    { label: 'Fastest', route: emergencyRouteSet.fastest, color: '#f97316' },
    { label: 'Safest', route: emergencyRouteSet.safest, color: '#22c55e' },
    { label: 'Recommended', route: emergencyRouteSet.recommended, color: '#06b6d4' },
  ];

  return (
    <div className="card p-5">
      <h3 className="text-sm font-bold text-white tracking-wide uppercase mb-4">
        Route Comparison
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-surface-600 border-b border-surface-200/40">
              <th className="text-left font-semibold uppercase tracking-wide py-2 px-2">Route</th>
              <th className="text-right font-semibold uppercase tracking-wide py-2 px-2">Distance</th>
              <th className="text-right font-semibold uppercase tracking-wide py-2 px-2">Time</th>
              <th className="text-center font-semibold uppercase tracking-wide py-2 px-2">Flood Risk</th>
              <th className="text-center font-semibold uppercase tracking-wide py-2 px-2">Traffic</th>
              <th className="text-center font-semibold uppercase tracking-wide py-2 px-2">Blocked</th>
              <th className="text-center font-semibold uppercase tracking-wide py-2 px-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {routes.map(({ label, route, color }) => {
              if (!route || route.status === 'no_route') {
                return (
                  <tr key={label} className="border-b border-surface-200/20">
                    <td className="py-2.5 px-2">
                      <span className="font-bold" style={{ color }}>{label}</span>
                    </td>
                    <td colSpan={6} className="py-2.5 px-2 text-center text-surface-600">
                      No route available
                    </td>
                  </tr>
                );
              }
              const statusBadge = route.status === 'recommended'
                ? { bg: 'bg-risk-low/15', text: 'text-risk-low', border: 'border-risk-low/30', label: 'RECOMMENDED', icon: CheckCircle }
                : route.status === 'safe'
                  ? { bg: 'bg-primary-500/10', text: 'text-primary-400', border: 'border-primary-500/20', label: 'SAFE', icon: CheckCircle }
                  : { bg: 'bg-risk-critical/10', text: 'text-risk-critical', border: 'border-risk-critical/30', label: 'NOT RECOMMENDED', icon: XCircle };
              const StatusIcon = statusBadge.icon;

              return (
                <tr
                  key={label}
                  className={`border-b border-surface-200/20 hover:bg-surface-200/20 transition-colors ${
                    route.status === 'recommended' ? 'bg-primary-500/5' : ''
                  }`}
                >
                  <td className="py-2.5 px-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                      <span className="font-bold text-white">{label}</span>
                    </div>
                  </td>
                  <td className="text-right py-2.5 px-2 text-surface-200">
                    {(route.distance / 1000).toFixed(1)} km
                  </td>
                  <td className="text-right py-2.5 px-2 text-surface-200">
                    {route.estimatedTime} min
                  </td>
                  <td className="text-center py-2.5 px-2">
                    <span
                      className="badge text-[9px] border"
                      style={{
                        backgroundColor: `${riskColor(route.floodRisk)}15`,
                        color: riskColor(route.floodRisk),
                        borderColor: `${riskColor(route.floodRisk)}30`,
                      }}
                    >
                      {riskLabel(route.floodRisk).toUpperCase()}
                    </span>
                  </td>
                  <td className="text-center py-2.5 px-2 text-surface-200">{route.trafficLevel}%</td>
                  <td className="text-center py-2.5 px-2">
                    {route.blockedRoads > 0 ? (
                      <span className="text-risk-critical font-bold">{route.blockedRoads}</span>
                    ) : (
                      <span className="text-risk-low font-bold">0</span>
                    )}
                  </td>
                  <td className="text-center py-2.5 px-2">
                    <span className={`badge text-[9px] border ${statusBadge.bg} ${statusBadge.text} ${statusBadge.border} flex items-center gap-1`}>
                      <StatusIcon className="w-2.5 h-2.5" />
                      {statusBadge.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
