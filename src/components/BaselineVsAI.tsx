import { useStore } from '@/store/useStore';
import { usePredictionEngine } from '@/hooks/usePredictionEngine';
import { baselinePredict } from '@/services/ml/predictionService';
import { riskColor } from '@/utils/risk';
import { Brain, Sliders, ArrowRight } from 'lucide-react';
import type { PredictionHorizon, RiskLevel } from '@/types';

const RISK_LABELS: RiskLevel[] = ['low', 'medium', 'high', 'critical'];

export function BaselineVsAI({ horizon = 10 }: { horizon?: PredictionHorizon }) {
  const vaults = useStore((s) => s.vaults);
  const { predictions, isTraining } = usePredictionEngine(horizon);

  const comparisonData = vaults.map((vault) => {
    const aiPred = predictions.find((p) => p.id === vault.id);
    const baseline = baselinePredict(vault.currentLevel);
    return {
      id: vault.id,
      aiProbability: aiPred?.floodProbability ?? 0,
      aiLabel: aiPred?.riskLevel ?? 'low',
      baselineProbability: Math.round(baseline.probability * 100),
      baselineLabel: RISK_LABELS[baseline.label],
      waterLevel: Math.round(vault.currentLevel),
    };
  });

  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-4">
        <Sliders className="w-4 h-4 text-primary-400" />
        <h3 className="text-sm font-bold text-white tracking-wide uppercase">
          Baseline vs AI Model
        </h3>
      </div>
      <p className="text-xs text-surface-600 mb-4">
        Baseline uses a single threshold (water level &gt; 80% = HIGH). AI considers
        rainfall, water level, rise rate, capacity, elevation, and flood history simultaneously.
      </p>

      {isTraining ? (
        <p className="text-sm text-surface-600">Training model...</p>
      ) : (
        <div className="space-y-3">
          {comparisonData.map((item) => (
            <div key={item.id} className="bg-surface-200/30 rounded-lg p-3 border border-surface-200/40">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-white font-mono">{item.id}</span>
                <span className="text-xs text-surface-600">Water: {item.waterLevel}%</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {/* Baseline */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1.5">
                    <Sliders className="w-3 h-3 text-surface-600" />
                    <span className="text-[10px] text-surface-600 uppercase tracking-wide font-medium">
                      Baseline
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-surface-300/40 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${item.baselineProbability}%`,
                          backgroundColor: riskColor(item.baselineLabel),
                        }}
                      />
                    </div>
                    <span className="text-xs font-bold text-surface-800 w-8 text-right">
                      {item.baselineProbability}%
                    </span>
                  </div>
                </div>

                {/* AI */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1.5">
                    <Brain className="w-3 h-3 text-primary-400" />
                    <span className="text-[10px] text-primary-400 uppercase tracking-wide font-medium">
                      AI Model
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-surface-300/40 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${item.aiProbability}%`,
                          backgroundColor: riskColor(item.aiLabel),
                        }}
                      />
                    </div>
                    <span className="text-xs font-bold text-primary-400 w-8 text-right">
                      {item.aiProbability}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Difference indicator */}
              {item.aiProbability !== item.baselineProbability && (
                <div className="flex items-center gap-1.5 mt-2 text-[10px]">
                  <ArrowRight className="w-3 h-3 text-surface-600" />
                  <span className="text-surface-600">
                    AI {item.aiProbability > item.baselineProbability ? 'elevates' : 'reduces'} risk by{' '}
                    <span className="font-bold text-surface-800">
                      {Math.abs(item.aiProbability - item.baselineProbability)}%
                    </span>{' '}
                    using multi-variable analysis
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <p className="text-[10px] text-surface-600 mt-3 text-center">
        Comparison shows how AI uses multiple variables vs single-threshold baseline
      </p>
    </div>
  );
}
