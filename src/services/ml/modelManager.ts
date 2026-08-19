// Model Manager: singleton that manages the trained model lifecycle.
// Trains the model once on startup, then provides it for live predictions.
// The architecture is designed so the JS prototype model can be replaced
// with a Python/scikit-learn backend later — just swap trainModel() and
// predictFromFeatures() with API calls.

import type { ModelInfo, ModelMetrics, FeatureImportance } from '@/types';
import { trainModel, type TrainingResult } from './trainingPipeline';
import type { RandomForestModel } from './randomForest';

class ModelManager {
  private model: RandomForestModel | null = null;
  private info: ModelInfo = {
    status: 'untrained',
    modelType: 'Random Forest',
    trainingDataSize: 0,
    dataType: 'SIMULATED',
    metrics: null,
    featureImportance: [],
    trainedAt: null,
  };
  private trainingPromise: Promise<TrainingResult> | null = null;

  get status(): ModelInfo['status'] {
    return this.info.status;
  }

  getModel(): RandomForestModel | null {
    return this.model;
  }

  getInfo(): ModelInfo {
    return { ...this.info };
  }

  async train(): Promise<TrainingResult> {
    if (this.trainingPromise) return this.trainingPromise;

    this.info = { ...this.info, status: 'training' };

    this.trainingPromise = new Promise((resolve) => {
      // Defer to next tick so the UI can show "training" status
      setTimeout(() => {
        const result = trainModel(5000);
        this.model = result.model;
        this.info = {
          status: 'trained',
          modelType: 'Random Forest',
          trainingDataSize: result.trainingDataSize,
          dataType: 'SIMULATED',
          metrics: result.metrics,
          featureImportance: result.featureImportance,
          trainedAt: new Date().toISOString(),
        };
        resolve(result);
      }, 50);
    });

    return this.trainingPromise;
  }
}

export const modelManager = new ModelManager();
