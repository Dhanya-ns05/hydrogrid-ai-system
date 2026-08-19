// Random Forest Classifier — ensemble of decision trees with bagging
// This is a real ML ensemble algorithm, not a rule-based system.

import {
  buildTree,
  predictTree,
  predictLabel,
  computeTreeFeatureImportance,
  type TreeNode,
  type TrainingSample,
} from './decisionTree';

export interface RandomForestModel {
  trees: TreeNode[];
  numFeatures: number;
  featureImportance: number[];
  numTrees: number;
  maxDepth: number;
}

function shuffleArray<T>(arr: T[], rng: () => number): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function mulberry32(seed: number): () => number {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface RandomForestConfig {
  numTrees: number;
  maxDepth: number;
  minSamplesSplit: number;
  maxThresholds: number;
  maxFeatures: number; // features per split (sqrt(n) typical)
  bootstrapRatio: number;
  seed: number;
}

export const DEFAULT_RF_CONFIG: RandomForestConfig = {
  numTrees: 30,
  maxDepth: 8,
  minSamplesSplit: 10,
  maxThresholds: 20,
  maxFeatures: 4, // ~sqrt(11) ≈ 3.3
  bootstrapRatio: 0.8,
  seed: 42,
};

export function trainRandomForest(
  samples: TrainingSample[],
  config: RandomForestConfig = DEFAULT_RF_CONFIG
): RandomForestModel {
  const rng = mulberry32(config.seed);
  const numFeatures = samples[0].features.length;
  const trees: TreeNode[] = [];
  const allImportance = new Array(numFeatures).fill(0);

  const maxFeatures = Math.min(config.maxFeatures, numFeatures);

  for (let t = 0; t < config.numTrees; t++) {
    // Bootstrap sampling (bagging)
    const bootSize = Math.floor(samples.length * config.bootstrapRatio);
    const shuffled = shuffleArray(samples, rng);
    const bootstrap = shuffled.slice(0, bootSize);

    // Random feature subset for this tree
    const allFeatureIndices = [...Array(numFeatures).keys()];
    const shuffledFeatures = shuffleArray(allFeatureIndices, rng);
    const featureSubset = shuffledFeatures.slice(0, maxFeatures);

    const tree = buildTree(
      bootstrap,
      config.maxDepth,
      config.minSamplesSplit,
      config.maxThresholds,
      0,
      featureSubset
    );
    trees.push(tree);

    // Accumulate feature importance
    const treeImportance = computeTreeFeatureImportance(tree, bootstrap.length, numFeatures);
    for (let f = 0; f < numFeatures; f++) {
      allImportance[f] += treeImportance[f];
    }
  }

  // Normalize feature importance
  const totalImportance = allImportance.reduce((a, b) => a + b, 0);
  const normalizedImportance =
    totalImportance > 0
      ? allImportance.map((v) => v / totalImportance)
      : allImportance.map(() => 1 / numFeatures);

  return {
    trees,
    numFeatures,
    featureImportance: normalizedImportance,
    numTrees: config.numTrees,
    maxDepth: config.maxDepth,
  };
}

export function predictForest(
  model: RandomForestModel,
  features: number[]
): { probabilities: number[]; label: number; probability: number } {
  // Average probabilities across all trees (soft voting)
  const sumProbs = new Array(4).fill(0);
  for (const tree of model.trees) {
    const probs = predictTree(tree, features);
    for (let c = 0; c < 4; c++) sumProbs[c] += probs[c];
  }

  const avgProbs = sumProbs.map((p) => p / model.trees.length);

  // Pick the class with highest average probability
  let maxProb = 0;
  let label = 0;
  for (let c = 0; c < 4; c++) {
    if (avgProbs[c] > maxProb) {
      maxProb = avgProbs[c];
      label = c;
    }
  }

  return { probabilities: avgProbs, label, probability: maxProb };
}

export function predictForestLabel(model: RandomForestModel, features: number[]): number {
  // Majority vote across all trees
  const votes = new Array(4).fill(0);
  for (const tree of model.trees) {
    const label = predictLabel(tree, features);
    votes[label]++;
  }
  let maxVotes = 0;
  let label = 0;
  for (let c = 0; c < 4; c++) {
    if (votes[c] > maxVotes) {
      maxVotes = votes[c];
      label = c;
    }
  }
  return label;
}
