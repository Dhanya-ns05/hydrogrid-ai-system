import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import { useStore } from '@/store/useStore';
import { usePredictionEngine } from '@/hooks/usePredictionEngine';
import { riskColor, riskLabel, trendIcon, trendLabel } from '@/utils/risk';
import { Brain, TrendingUp, Clock, AlertTriangle } from 'lucide-react';
import type { PredictionHorizon } from '@/types';

interface AIPredictionCardProps {
  horizon?: PredictionHorizon;
  vaultId?: string;
}

export function AIPredictionCard({ horizon = 10, vaultId }: AIPredictionCardProps) {
  const vaults = useStore((s) => s.vaults);
  const { predictions, isTraining } = usePredictionEngine(horizon);

  // Pick the vault to display
  const targetVaultId = vaultId || vaults[0]?.id;
  const prediction = predictions.find((p) => p.id === targetVaultId);
  const vault = vaults.find((v) => v.id === targetVaultId);

  if (isTraining || !prediction || !vault) {
    return (
      <div className="card p-5 flex flex-col gap-4 h-full">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-primary-400 animate-pulse" />
          <h3 className="text-sm font-bold text-white tracking-wide uppercase">
            AI Flood Risk Prediction
          </h3>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-surface-600">
            {isTraining ? 'Training model...' : 'Awaiting prediction...'}
          </p>
        </div>
      </div>
    );
  }

  const color = riskColor(prediction.riskLevel);
  const gaugeData = [{ name: 'Risk', value: prediction.floodProbability, fill: color }];

  return (
    <div className="card p-5 flex flex-col gap-4 h-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-primary-400" />
          <h3 className="text-sm font-bold text-white tracking-wide uppercase">
            AI Flood Risk Prediction
          </h3>
        </div>
        <span className="badge bg-primary-500/10 text-primary-400 border border-primary-500/20">
          AI POWERED
        </span>
      </div>

      <div className="flex items-center gap-4">
        {/* Gauge */}
        <div className="w-32 h-32 shrink-0 relative">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart
              innerRadius="65%"
              outerRadius="100%"
              data={gaugeData}
              startAngle={90}
              endAngle={-270}
            >
              <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
              <RadialBar background={{ fill: '#1a2234' }} dataKey="value" cornerRadius={8} />
            </RadialBarChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold" style={{ color }}>
              {prediction.floodProbability}%
            </span>
            <span className="text-[10px] text-surface-600">Flood Prob.</span>
          </div>
        </div>

        {/* Details */}
        <div className="flex-1 space-y-2">
          <div>
            <p className="text-[10px] text-surface-600 uppercase tracking-wide">Location</p>
            <p className="text-sm font-bold text-white">{prediction.name}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-surface-600 uppercase tracking-wide">Risk</span>
            <span
              className="badge text-[10px] border"
              style={{ backgroundColor: `${color}15`, color, borderColor: `${color}30` }}
            >
              {riskLabel(prediction.riskLevel)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-3 h-3 text-surface-600" />
            <span className="text-[10px] text-surface-600 uppercase tracking-wide">Trend</span>
            <span
              className="text-xs font-bold"
              style={{
                color:
                  prediction.trend === 'up'
                    ? riskColor('high')
                    : prediction.trend === 'down'
                      ? riskColor('low')
                      : '#94a3b8',
              }}
            >
              {trendIcon(prediction.trend)} {trendLabel(prediction.trend)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-3 h-3 text-surface-600" />
            <span className="text-[10px] text-surface-600 uppercase tracking-wide">Horizon</span>
            <span className="text-xs font-bold text-surface-800">{horizon} min</span>
          </div>
        </div>
      </div>

      {/* Prediction text */}
      <div className="flex items-start gap-2 p-3 rounded-lg" style={{ backgroundColor: `${color}10`, border: `1px solid ${color}20` }}>
        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" style={{ color }} />
        <p className="text-xs text-surface-800 leading-snug">{prediction.predictionText}</p>
      </div>

      {/* Future projection */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-surface-200/40 rounded-lg px-3 py-2">
          <p className="text-[10px] text-surface-600 uppercase tracking-wide">Current Probability</p>
          <p className="text-lg font-bold" style={{ color }}>
            {prediction.floodProbability}%
          </p>
        </div>
        <div className="bg-surface-200/40 rounded-lg px-3 py-2">
          <p className="text-[10px] text-surface-600 uppercase tracking-wide">
            Projected ({horizon}min)
          </p>
          <p
            className="text-lg font-bold"
            style={{
              color:
                prediction.futureProbability > prediction.floodProbability
                  ? riskColor('high')
                  : riskColor('low'),
            }}
          >
            {prediction.futureProbability}%
          </p>
        </div>
      </div>

      <p className="text-[10px] text-surface-600 text-center">
        Simulated short-term prediction - Not scientifically validated
      </p>
    </div>
  );
}
