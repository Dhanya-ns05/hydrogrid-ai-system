import { CityMap } from '@/components/CityMap';
import { ExplainableAIPanel } from '@/components/ExplainableAIPanel';
import { AIPredictionCard } from '@/components/AIPredictionCard';
import { useStore } from '@/store/useStore';
import { riskColor, riskLabel, trendIcon, trendLabel } from '@/utils/risk';

export function FloodMapView() {
  const zones = useStore((s) => s.floodZones);

  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Flood AI</h2>
          <p className="text-sm text-surface-600 mt-1">
            AI-powered flood hotspot detection and risk prediction - Simulated data for Bengaluru
          </p>
        </div>
      </div>

      <AIPredictionCard />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        <div className="lg:col-span-3">
          <CityMap height="h-[600px]" />
        </div>

        <div className="lg:col-span-1 flex flex-col gap-3">
          <h3 className="text-sm font-bold text-white tracking-wide uppercase">
            Flood Hotspots
          </h3>
          {zones.map((zone) => {
            const color = riskColor(zone.riskLevel);
            return (
              <div
                key={zone.id}
                className="card p-4 hover:border-primary-500/40 transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-bold text-white">{zone.name}</h4>
                  <span
                    className="badge border"
                    style={{
                      backgroundColor: `${color}15`,
                      color,
                      borderColor: `${color}30`,
                    }}
                  >
                    {riskLabel(zone.riskLevel)}
                  </span>
                </div>
                <div className="space-y-2">
                  <Bar label="Water Level" value={zone.waterLevel} color={color} />
                  <Bar label="Flood Probability" value={zone.riskScore} color={color} />
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <Info label="Rainfall" value={`${Math.round(zone.rainfall)} mm/hr`} />
                    <Info label="Rise Rate" value={`${zone.riseRate.toFixed(1)}%/min`} />
                    <Info
                      label="Trend"
                      value={`${trendIcon(zone.trend)} ${trendLabel(zone.trend)}`}
                      color={zone.trend === 'up' ? riskColor('high') : zone.trend === 'down' ? riskColor('low') : undefined}
                    />
                    <Info label="Risk Score" value={`${Math.round(zone.riskScore)}/100`} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Bar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] text-surface-600 uppercase tracking-wide font-medium">{label}</span>
        <span className="text-xs font-bold text-white">{Math.round(value)}%</span>
      </div>
      <div className="h-1.5 bg-surface-300/40 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${value}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

function Info({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="bg-surface-200/40 rounded-lg px-2.5 py-1.5">
      <p className="text-[10px] text-surface-600 uppercase tracking-wide">{label}</p>
      <p className="text-xs font-bold mt-0.5" style={color ? { color } : { color: '#e2e8f0' }}>
        {value}
      </p>
    </div>
  );
}
