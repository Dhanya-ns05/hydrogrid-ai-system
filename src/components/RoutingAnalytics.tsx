import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useStore } from '@/store/useStore';
import { Activity, Droplets, Gauge, AlertTriangle, XCircle, TrendingUp } from 'lucide-react';

export function RoutingAnalytics() {
  const diversionEvents = useStore((s) => s.diversionEvents);
  const routingAnalytics = useStore((s) => s.routingAnalytics);

  const chartData = diversionEvents.slice(0, 10).reverse().map((e, i) => ({
    name: `D${i + 1}`,
    volume: e.volume,
    score: 0,
  }));

  return (
    <div className="card p-5">
      <h3 className="text-sm font-bold text-white tracking-wide uppercase mb-4">
        Routing Analytics
      </h3>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
        <StatCard icon={Activity} label="Diversion Events" value={routingAnalytics.totalDiversions} color="text-primary-400" />
        <StatCard icon={Droplets} label="Water Diverted" value={`${routingAnalytics.totalWaterDiverted.toLocaleString()}L`} color="text-cyan-400" />
        <StatCard icon={Gauge} label="Avg Routing Score" value={routingAnalytics.totalDiversions > 0 ? Math.round(routingAnalytics.averageRoutingScore) : '—'} color="text-risk-low" />
        <StatCard icon={XCircle} label="Rejected Dest." value={routingAnalytics.rejectedDestinations} color="text-risk-high" />
        <StatCard icon={AlertTriangle} label="Overflow Warnings" value={routingAnalytics.overflowWarnings} color="text-risk-critical" />
        <StatCard icon={TrendingUp} label="Events Logged" value={diversionEvents.length} color="text-surface-200" />
      </div>

      {/* Volume chart */}
      {chartData.length > 0 ? (
        <div>
          <p className="text-[10px] font-bold text-surface-600 uppercase tracking-wide mb-2">Water Diverted Per Event (Liters)</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData} margin={{ top: 5, right: 10, bottom: 0, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a2234" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#111827', border: '1px solid #242d40', borderRadius: '8px', fontSize: '12px' }}
                cursor={{ fill: 'rgba(6,182,212,0.05)' }}
              />
              <Bar dataKey="volume" fill="#06b6d4" radius={[4, 4, 0, 0]} name="Volume (L)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Activity className="w-8 h-8 text-surface-500 mb-2" />
          <p className="text-sm text-surface-700">No diversion events yet. Start a diversion to see analytics.</p>
        </div>
      )}

      {/* Recent events */}
      {diversionEvents.length > 0 && (
        <div className="mt-4 pt-4 border-t border-surface-200/30">
          <p className="text-[10px] font-bold text-surface-600 uppercase tracking-wide mb-2">Recent Events</p>
          <div className="space-y-1.5 max-h-40 overflow-y-auto">
            {diversionEvents.slice(0, 5).map((e) => (
              <div key={e.id} className="flex items-center justify-between text-xs p-2 rounded-lg bg-surface-200/20">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-primary-400">{e.sourceVaultId}</span>
                  <span className="text-surface-600">→</span>
                  <span className="font-mono font-bold text-risk-low">{e.destinationVaultId}</span>
                </div>
                <div className="flex items-center gap-3 text-surface-600">
                  <span>{e.sourceLevelBefore}% → {e.sourceLevelAfter}%</span>
                  <span className="text-cyan-400 font-semibold">{e.volume.toLocaleString()}L</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: typeof Activity; label: string; value: string | number; color: string }) {
  return (
    <div className="p-3 rounded-lg bg-surface-200/20 border border-surface-200/30">
      <div className="flex items-center gap-2 mb-1">
        <Icon className={`w-3.5 h-3.5 ${color}`} />
        <span className="text-[10px] text-surface-600 uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-lg font-bold text-white">{value}</p>
    </div>
  );
}
