// Training Pipeline: data generation → preprocessing → train/test split →
// training → prediction → evaluation
// All metrics are calculated from the actual model, never hardcoded.

import type { TrainingRow, ModelMetrics, FeatureImportance } from '@/types';
import { generateDataset, FEATURE_KEYS, FEATURE_LABELS } from './dataGenerator';
import {
  trainRandomForest,
  predictForestLabel,
  predictForest,
  DEFAULT_RF_CONFIG,
  type RandomForestModel,
} from './randomForest';
import type { TrainingSample } from './decisionTree';

function shuffleArray<T>(arr: T[], seed: number): T[] {
  let a = seed;
  const rng = () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function rowsToSamples(rows: TrainingRow[]): TrainingSample[] {
  return rows.map((row) => ({
    features: FEATURE_KEYS.map((k) => row[k]),
    label: row.flood_risk,
  }));
}

function trainTestSplit(
  samples: TrainingSample[],
  trainRatio: number,
  seed: number
): { train: TrainingSample[]; test: TrainingSample[] } {
  const shuffled = shuffleArray(samples, seed);
  const splitIndex = Math.floor(shuffled.length * trainRatio);
  return {
    train: shuffled.slice(0, splitIndex),
    test: shuffled.slice(splitIndex),
  };
}

function calculateMetrics(
  model: RandomForestModel,
  testSamples: TrainingSample[]
): ModelMetrics {
  const numClasses = 4;
  const confusionMatrix: number[][] = Array.from({ length: numClasses }, () =>
    new Array(numClasses).fill(0)
  );

  let correct = 0;
  const truePositives = new Array(numClasses).fill(0);
  const falsePositives = new Array(numClasses).fill(0);
  const falseNegatives = new Array(numClasses).fill(0);

  for (const sample of testSamples) {
    const predicted = predictForestLabel(model, sample.features);
    const actual = sample.label;
    confusionMatrix[actual][predicted]++;
    if (predicted === actual) correct++;
    else {
      falsePositives[predicted]++;
      falseNegatives[actual]++;
    }
    if (predicted === actual) truePositives[actual]++;
  }

  // Macro-averaged precision, recall, F1
  let precisionSum = 0;
  let recallSum = 0;
  let f1Sum = 0;
  let validClasses = 0;

  for (let c = 0; c < numClasses; c++) {
    const tp = truePositives[c];
    const fp = falsePositives[c];
    const fn = falseNegatives[c];
    const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
    const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
    const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;
    precisionSum += precision;
    recallSum += recall;
    f1Sum += f1;
    validClasses++;
  }

  return {
    accuracy: correct / testSamples.length,
    precision: precisionSum / validClasses,
    recall: recallSum / validClasses,
    f1Score: f1Sum / validClasses,
    confusionMatrix,
    trainSize: 0, // filled by caller
    testSize: testSamples.length,
  };
}

export interface TrainingResult {
  model: RandomForestModel;
  metrics: ModelMetrics;
  featureImportance: FeatureImportance[];
  trainingDataSize: number;
}

export function trainModel(numRows = 5000): TrainingResult {
  // 1. Data generation
  const dataset = generateDataset(numRows);

  // 2. Data preprocessing → convert to training samples
  const allSamples = rowsToSamples(dataset);

  // 3. Train/test split (80/20)
  const { train, test } = trainTestSplit(allSamples, 0.8, 42);

  // 4. Model training
  const model = trainRandomForest(train, DEFAULT_RF_CONFIG);

  // 5. Evaluation
  const metrics = calculateMetrics(model, test);
  metrics.trainSize = train.length;

  // 6. Feature importance from the trained model
  const featureImportance: FeatureImportance[] = model.featureImportance.map(
    (importance, i) => ({
      feature: FEATURE_KEYS[i],
      importance: Math.round(importance * 1000) / 1000,
    })
  );
  featureImportance.sort((a, b) => b.importance - a.importance);

  return {
    model,
    metrics,
    featureImportance,
    trainingDataSize: numRows,
  };
}

export function predictFromFeatures(
  model: RandomForestModel,
  features: number[]
): { label: number; probability: number; probabilities: number[] } {
  const result = predictForest(model, features);
  return {
    label: result.label,
    probability: result.probability,
    probabilities: result.probabilities,
  };
}

export { FEATURE_LABELS };
