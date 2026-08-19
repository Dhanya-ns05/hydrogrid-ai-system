import { usePredictionEngine } from '@/hooks/usePredictionEngine';
import { FEATURE_LABELS } from '@/services/ml/trainingPipeline';
import { HelpCircle } from 'lucide-react';
import type { PredictionHorizon } from '@/types';

export function FeatureImportanceChart({ horizon = 10 }: { horizon?: PredictionHorizon }) {
  const { modelInfo, isTraining } = usePredictionEngine(horizon);

  if (isTraining || !modelInfo.featureImportance.length) {
    return (
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <HelpCircle className="w-4 h-4 text-primary-400 animate-pulse" />
          <h3 className="text-sm font-bold text-white tracking-wide uppercase">
            Why Is This Location At Risk?
          </h3>
        </div>
        <p className="text-sm text-surface-600">Computing feature importance...</p>
      </div>
    );
  }

  const maxImportance = Math.max(...modelInfo.featureImportance.map((f) => f.importance));

  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-4">
        <HelpCircle className="w-4 h-4 text-primary-400" />
        <h3 className="text-sm font-bold text-white tracking-wide uppercase">
          Why Is This Location At Risk?
        </h3>
      </div>
      <p className="text-xs text-surface-600 mb-4">
        Model feature importance - which variables drive the flood risk prediction
      </p>

      <div className="space-y-2.5">
        {modelInfo.featureImportance.map((fi) => {
          const label = FEATURE_LABELS[fi.feature] || fi.feature;
          const widthPct = (fi.importance / maxImportance) * 100;
          const pct = Math.round(fi.importance * 100);

          return (
            <div key={fi.feature}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-surface-800 font-medium">{label}</span>
                <span className="text-xs font-bold text-primary-400 font-mono">{pct}%</span>
              </div>
              <div className="h-2.5 bg-surface-300/40 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${widthPct}%`,
                    background: 'linear-gradient(90deg, #06b6d4, #3b82f6)',
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-[10px] text-surface-600 mt-4 text-center">
        Computed from trained Random Forest model - Explainable AI
      </p>
    </div>
  );
}
