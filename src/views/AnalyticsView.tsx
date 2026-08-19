import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
} from 'recharts';
import { useStore } from '@/store/useStore';
import { riskColor } from '@/utils/risk';

export function AnalyticsView() {
  const zones = useStore((s) => s.floodZones);
  const vaults = useStore((s) => s.vaults);
  const simulation = useStore((s) => s.simulation);
  const waterDiverted = useStore((s) => s.waterDiverted);

  // Zone risk comparison
  const zoneData = zones.map((z) => ({
    name: z.name.replace('Demo ', ''),
    riskScore: Math.round(z.riskScore),
    waterLevel: Math.round(z.waterLevel),
    rainfall: Math.round(z.rainfall),
  }));

  // Vault capacity data
  const vaultData = vaults.map((v) => ({
    name: v.id,
    current: Math.round(v.currentLevel),
    available: Math.round(v.availableCapacity),
  }));

  // Water level trend for Zone A
  const zoneAHistory = zones[0]?.history.map((h, i) => ({
    time: `T${i}`,
    waterLevel: Math.round(h.waterLevel * 10) / 10,
  })) || [];

  // Rainfall trend (simulated from zone data)
  const rainfallTrend = zones[0]?.history.map((h, i) => ({
    time: `T${i}`,
    rainfall: Math.round(simulation.rainfallIntensity * (0.8 + Math.sin(i / 3) * 0.2)),
  })) || [];

  // Radial gauge for highest risk
  const highestRisk = Math.max(...zones.map((z) => z.riskScore));
  const radialData = [{ name: 'Risk', value: highestRisk, fill: riskColor(zones[0]?.riskLevel || 'high') }];

  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">Analytics</h2>
        <p className="text-sm text-surface-600 mt-1">
          Flood risk and vault capacity analytics - Simulated data
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SummaryCard label="Total Water Diverted" value={`${waterDiverted.toLocaleString()} L`} />
        <SummaryCard label="Average Vault Fill" value={`${Math.round(vaults.reduce((a, v) => a + v.currentLevel, 0) / vaults.length)}%`} />
        <SummaryCard label="Active Zones" value={`${zones.filter((z) => z.riskLevel !== 'low').length}`} />
        <SummaryCard label="Simulation Tick" value={`${simulation.tick}`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Water Level Trend */}
        <div className="card p-5">
          <h3 className="text-sm font-bold text-white tracking-wide uppercase mb-4">
            Water Level Trend - Zone A
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={zoneAHistory} margin={{ top: 5, right: 10, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="waterGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a2234" vertical={false} />
              <XAxis dataKey="time" hide />
              <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#111827', border: '1px solid #242d40', borderRadius: '8px', fontSize: '12px' }}
                labelStyle={{ color: '#64748b' }}
                itemStyle={{ color: '#06b6d4' }}
              />
              <Area type="monotone" dataKey="waterLevel" stroke="#06b6d4" strokeWidth={2} fill="url(#waterGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Rainfall Trend */}
        <div className="card p-5">
          <h3 className="text-sm font-bold text-white tracking-wide uppercase mb-4">
            Rainfall Intensity Trend
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={rainfallTrend} margin={{ top: 5, right: 10, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a2234" vertical={false} />
              <XAxis dataKey="time" hide />
              <YAxis domain={[0, 150]} tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#111827', border: '1px solid #242d40', borderRadius: '8px', fontSize: '12px' }}
                labelStyle={{ color: '#64748b' }}
                itemStyle={{ color: '#3b82f6' }}
              />
              <Line type="monotone" dataKey="rainfall" stroke="#3b82f6" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Zone Risk Comparison */}
        <div className="card p-5">
          <h3 className="text-sm font-bold text-white tracking-wide uppercase mb-4">
            Flood Zone Risk Comparison
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={zoneData} margin={{ top: 5, right: 10, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a2234" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#111827', border: '1px solid #242d40', borderRadius: '8px', fontSize: '12px' }}
                labelStyle={{ color: '#64748b' }}
                cursor={{ fill: 'rgba(6,182,212,0.05)' }}
              />
              <Bar dataKey="riskScore" fill="#06b6d4" radius={[4, 4, 0, 0]} name="Risk Score" />
              <Bar dataKey="waterLevel" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Water Level" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Vault Capacity + Radial Gauge */}
        <div className="card p-5">
          <h3 className="text-sm font-bold text-white tracking-wide uppercase mb-4">
            Highest Flood Risk
          </h3>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width="50%" height={220}>
              <RadialBarChart
                innerRadius="60%"
                outerRadius="100%"
                data={radialData}
                startAngle={90}
                endAngle={-270}
              >
                <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                <RadialBar background={{ fill: '#1a2234' }} dataKey="value" cornerRadius={10} />
                <Tooltip
                  contentStyle={{ background: '#111827', border: '1px solid #242d40', borderRadius: '8px', fontSize: '12px' }}
                />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="flex-1">
              <p className="text-4xl font-bold text-white">{Math.round(highestRisk)}%</p>
              <p className="text-xs text-surface-600 mt-1">Peak Risk Score</p>
              <div className="mt-3 space-y-1.5">
                {zones.map((z) => (
                  <div key={z.id} className="flex items-center justify-between text-xs">
                    <span className="text-surface-700">{z.name}</span>
                    <span className="font-bold" style={{ color: riskColor(z.riskLevel) }}>
                      {Math.round(z.riskScore)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Vault Capacity Bar */}
      <div className="card p-5">
        <h3 className="text-sm font-bold text-white tracking-wide uppercase mb-4">
          Vault Capacity Overview
        </h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={vaultData} layout="vertical" margin={{ top: 0, right: 10, bottom: 0, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1a2234" horizontal={false} />
            <XAxis type="number" domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ background: '#111827', border: '1px solid #242d40', borderRadius: '8px', fontSize: '12px' }}
              cursor={{ fill: 'rgba(6,182,212,0.05)' }}
            />
            <Bar dataKey="current" stackId="a" fill="#06b6d4" radius={[0, 0, 0, 0]} name="Filled" />
            <Bar dataKey="available" stackId="a" fill="#1a2234" radius={[0, 4, 4, 0]} name="Available" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Routing Analytics */}
      <RoutingAnalyticsSection />
    </div>
  );
}

function RoutingAnalyticsSection() {
  const diversionEvents = useStore((s) => s.diversionEvents);
  const routingAnalytics = useStore((s) => s.routingAnalytics);

  const eventData = diversionEvents.slice(0, 10).reverse().map((e, i) => ({
    name: `E${i + 1}`,
    volume: e.volume,
    sourceLevel: e.sourceLevelBefore,
    destLevel: e.destLevelAfter,
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <div className="card p-5">
        <h3 className="text-sm font-bold text-white tracking-wide uppercase mb-4">
          Routing Events
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
          <div className="p-3 rounded-lg bg-surface-200/20 border border-surface-200/30">
            <p className="text-[10px] text-surface-600 uppercase tracking-wide">Total Diversions</p>
            <p className="text-lg font-bold text-white mt-1">{routingAnalytics.totalDiversions}</p>
          </div>
          <div className="p-3 rounded-lg bg-surface-200/20 border border-surface-200/30">
            <p className="text-[10px] text-surface-600 uppercase tracking-wide">Water Diverted</p>
            <p className="text-lg font-bold text-white mt-1">{routingAnalytics.totalWaterDiverted.toLocaleString()}L</p>
          </div>
          <div className="p-3 rounded-lg bg-surface-200/20 border border-surface-200/30">
            <p className="text-[10px] text-surface-600 uppercase tracking-wide">Avg Score</p>
            <p className="text-lg font-bold text-white mt-1">
              {routingAnalytics.totalDiversions > 0 ? Math.round(routingAnalytics.averageRoutingScore) : '—'}
            </p>
          </div>
        </div>
        {eventData.length > 0 ? (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={eventData} margin={{ top: 5, right: 10, bottom: 0, left: -10 }}>
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
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-sm text-surface-700">No diversion events yet</p>
          </div>
        )}
      </div>

      <div className="card p-5">
        <h3 className="text-sm font-bold text-white tracking-wide uppercase mb-4">
          Diversion Event Log
        </h3>
        {diversionEvents.length > 0 ? (
          <div className="space-y-2 max-h-[280px] overflow-y-auto">
            {diversionEvents.map((e) => (
              <div key={e.id} className="p-3 rounded-lg bg-surface-200/20 border border-surface-200/30">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-primary-400 text-xs">{e.sourceVaultId}</span>
                    <span className="text-surface-600 text-xs">→</span>
                    <span className="font-mono font-bold text-risk-low text-xs">{e.destinationVaultId}</span>
                  </div>
                  <span className="text-[10px] text-surface-600">
                    {new Date(e.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[10px] text-surface-600">
                  <span>Source: {e.sourceLevelBefore}% → {e.sourceLevelAfter}%</span>
                  <span>Dest: {e.destLevelBefore}% → {e.destLevelAfter}%</span>
                  <span className="text-cyan-400 font-semibold">{e.volume.toLocaleString()}L diverted</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-sm text-surface-700">No events logged. Start a diversion from the Water Routing page.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-4">
      <p className="text-[10px] text-surface-600 uppercase tracking-wide font-medium">{label}</p>
      <p className="text-xl font-bold text-white mt-1">{value}</p>
    </div>
  );
}
