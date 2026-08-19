import { LineChart, Line, ResponsiveContainer, YAxis, Tooltip, XAxis, ReferenceLine } from 'recharts';
import { useStore } from '@/store/useStore';
import { riskColor, riskBgClass, riskLabel, trendIcon, trendLabel } from '@/utils/risk';

export function FloodRiskPanel() {
  const zones = useStore((s) => s.floodZones);
  const zone = zones[0]; // Demo Zone A is the main hotspot

  if (!zone) return null;

  const chartData = zone.history.map((h, i) => ({
    index: i,
    waterLevel: Math.round(h.waterLevel * 10) / 10,
    time: new Date(h.time).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }),
  }));

  return (
    <div className="card p-5 flex flex-col gap-4 h-full">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-white tracking-wide uppercase">
          Current Flood Risk
        </h3>
        <span
          className={`badge border ${riskBgClass(zone.riskLevel)}`}
        >
          {riskLabel(zone.riskLevel)}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Metric label="Location" value={zone.name} />
        <Metric label="Risk" value={riskLabel(zone.riskLevel)} color={riskColor(zone.riskLevel)} />
        <Metric label="Flood Probability" value={`${Math.round(zone.riskScore)}%`} />
        <Metric label="Water Level" value={`${Math.round(zone.waterLevel)}%`} />
        <Metric label="Rainfall" value={`${Math.round(zone.rainfall)} mm/hr`} />
        <Metric label="Water Rise Rate" value={`${zone.riseRate.toFixed(1)}%/min`} />
        <Metric
          label="Trend"
          value={`${trendIcon(zone.trend)} ${trendLabel(zone.trend)}`}
          color={zone.trend === 'up' ? riskColor('high') : zone.trend === 'down' ? riskColor('low') : undefined}
        />
      </div>

      {/* Water Level Chart */}
      <div className="flex-1 min-h-[160px]">
        <p className="text-xs text-surface-600 font-medium mb-2">
          Water Level Over Time
        </p>
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
            <XAxis dataKey="index" hide />
            <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{
                background: '#111827',
                border: '1px solid #242d40',
                borderRadius: '8px',
                fontSize: '12px',
              }}
              labelStyle={{ color: '#64748b' }}
              itemStyle={{ color: '#06b6d4' }}
              formatter={((v: number) => [`${v}%`, 'Water Level']) as never}
              labelFormatter={((_v: unknown, payload: { payload?: { time?: string } }[]) => {
                const p = payload?.[0]?.payload;
                return p?.time ?? '';
              }) as never}
            />
            <ReferenceLine y={85} stroke="#ef4444" strokeDasharray="4 4" strokeOpacity={0.4} />
            <Line
              type="monotone"
              dataKey="waterLevel"
              stroke="#06b6d4"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: '#06b6d4' }}
              isAnimationActive={true}
              animationDuration={500}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function Metric({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="bg-surface-200/40 rounded-lg px-3 py-2">
      <p className="text-[10px] text-surface-600 uppercase tracking-wide font-medium">{label}</p>
      <p className="text-sm font-bold mt-0.5" style={color ? { color } : { color: '#e2e8f0' }}>
        {value}
      </p>
    </div>
  );
}
