import { useEffect, useState, useCallback } from 'react';
import { useStore } from '@/store/useStore';
import { modelManager } from '@/services/ml/modelManager';
import { predictVault, predictZone, baselinePredict } from '@/services/ml/predictionService';
import type { PredictionResult, ModelInfo, PredictionHorizon } from '@/types';

export function usePredictionEngine(horizon: PredictionHorizon = 10) {
  const [modelInfo, setModelInfo] = useState<ModelInfo>(modelManager.getInfo());
  const [predictions, setPredictions] = useState<PredictionResult[]>([]);
  const [baselineResults, setBaselineResults] = useState<
    { id: string; label: number; probability: number }[]
  >([]);
  const [isTraining, setIsTraining] = useState(false);

  const vaults = useStore((s) => s.vaults);
  const floodZones = useStore((s) => s.floodZones);
  const simTick = useStore((s) => s.simulation.tick);

  // Train the model on mount
  useEffect(() => {
    let mounted = true;
    setIsTraining(true);
    setModelInfo(modelManager.getInfo());

    modelManager.train().then(() => {
      if (mounted) {
        setModelInfo(modelManager.getInfo());
        setIsTraining(false);
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  // Run predictions whenever the simulation ticks or horizon changes
  const runPredictions = useCallback(() => {
    const model = modelManager.getModel();
    if (!model) return;

    const now = new Date();
    const timeOfDay = now.getHours() + now.getMinutes() / 60;

    const vaultPredictions = vaults.map((vault) =>
      predictVault(model, vault, horizon, timeOfDay, null)
    );
    const zonePredictions = floodZones.map((zone) =>
      predictZone(model, zone, horizon, timeOfDay, null)
    );

    setPredictions([...vaultPredictions, ...zonePredictions]);

    // Baseline predictions (threshold-based)
    const baseline = [...vaults, ...floodZones].map((item) => {
      const wl = 'currentLevel' in item ? item.currentLevel : item.waterLevel;
      return { id: item.id, ...baselinePredict(wl) };
    });
    setBaselineResults(baseline);
  }, [vaults, floodZones, horizon]);

  useEffect(() => {
    runPredictions();
  }, [runPredictions, simTick]);

  return {
    modelInfo,
    predictions,
    baselineResults,
    isTraining,
    retrain: () => {
      setIsTraining(true);
      modelManager.train().then(() => {
        setModelInfo(modelManager.getInfo());
        setIsTraining(false);
        runPredictions();
      });
    },
  };
}
