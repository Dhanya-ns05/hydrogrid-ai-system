// CART Decision Tree Classifier with Gini impurity
// This is a real ML algorithm implementation, not a rule-based system.

export interface TreeNode {
  isLeaf: boolean;
  prediction?: number[];
  label?: number;
  feature?: number;
  threshold?: number;
  left?: TreeNode;
  right?: TreeNode;
  samples?: number;
}

export interface TrainingSample {
  features: number[];
  label: number;
}

const NUM_CLASSES = 4; // low=0, medium=1, high=2, critical=3

function giniImpurity(samples: TrainingSample[]): number {
  if (samples.length === 0) return 0;
  const counts = new Array(NUM_CLASSES).fill(0);
  for (const s of samples) counts[s.label]++;
  let gini = 1;
  for (let c = 0; c < NUM_CLASSES; c++) {
    const p = counts[c] / samples.length;
    gini -= p * p;
  }
  return gini;
}

function classDistribution(samples: TrainingSample[]): number[] {
  const counts = new Array(NUM_CLASSES).fill(0);
  for (const s of samples) counts[s.label]++;
  return counts.map((c) => c / samples.length);
}

function bestSplit(
  samples: TrainingSample[],
  featureIndex: number,
  maxThresholds: number
): { threshold: number; gini: number } | null {
  const values = samples.map((s) => s.features[featureIndex]);
  const uniqueVals = [...new Set(values)].sort((a, b) => a - b);

  if (uniqueVals.length < 2) return null;

  // Use candidate midpoints; limit for performance
  let candidates: number[] = [];
  for (let i = 0; i < uniqueVals.length - 1; i++) {
    candidates.push((uniqueVals[i] + uniqueVals[i + 1]) / 2);
  }
  if (candidates.length > maxThresholds) {
    const step = candidates.length / maxThresholds;
    candidates = candidates.filter((_, i) => i % Math.floor(step) === 0);
  }

  let bestGini = Infinity;
  let bestThreshold = candidates[0];

  for (const threshold of candidates) {
    const left = samples.filter((s) => s.features[featureIndex] <= threshold);
    const right = samples.filter((s) => s.features[featureIndex] > threshold);

    if (left.length === 0 || right.length === 0) continue;

    const weightedGini =
      (left.length / samples.length) * giniImpurity(left) +
      (right.length / samples.length) * giniImpurity(right);

    if (weightedGini < bestGini) {
      bestGini = weightedGini;
      bestThreshold = threshold;
    }
  }

  return { threshold: bestThreshold, gini: bestGini };
}

export function buildTree(
  samples: TrainingSample[],
  maxDepth: number,
  minSamplesSplit: number,
  maxThresholds: number,
  depth = 0,
  featureIndices?: number[]
): TreeNode {
  const numFeatures = samples[0].features.length;
  const featuresToTry = featureIndices ?? [...Array(numFeatures).keys()];

  // Stopping conditions
  if (
    depth >= maxDepth ||
    samples.length < minSamplesSplit ||
    giniImpurity(samples) === 0
  ) {
    return {
      isLeaf: true,
      prediction: classDistribution(samples),
      label: mostFrequentLabel(samples),
      samples: samples.length,
    };
  }

  // Find best split across all features
  let bestFeature = -1;
  let bestThreshold = 0;
  let bestGini = giniImpurity(samples);

  for (const fi of featuresToTry) {
    const split = bestSplit(samples, fi, maxThresholds);
    if (split && split.gini < bestGini) {
      bestGini = split.gini;
      bestFeature = fi;
      bestThreshold = split.threshold;
    }
  }

  // No improvement found → leaf
  if (bestFeature === -1) {
    return {
      isLeaf: true,
      prediction: classDistribution(samples),
      label: mostFrequentLabel(samples),
      samples: samples.length,
    };
  }

  const leftSamples = samples.filter((s) => s.features[bestFeature] <= bestThreshold);
  const rightSamples = samples.filter((s) => s.features[bestFeature] > bestThreshold);

  if (leftSamples.length === 0 || rightSamples.length === 0) {
    return {
      isLeaf: true,
      prediction: classDistribution(samples),
      label: mostFrequentLabel(samples),
      samples: samples.length,
    };
  }

  return {
    isLeaf: false,
    feature: bestFeature,
    threshold: bestThreshold,
    left: buildTree(leftSamples, maxDepth, minSamplesSplit, maxThresholds, depth + 1, featureIndices),
    right: buildTree(rightSamples, maxDepth, minSamplesSplit, maxThresholds, depth + 1, featureIndices),
    samples: samples.length,
  };
}

function mostFrequentLabel(samples: TrainingSample[]): number {
  const counts = new Array(NUM_CLASSES).fill(0);
  for (const s of samples) counts[s.label]++;
  let max = 0;
  let label = 0;
  for (let c = 0; c < NUM_CLASSES; c++) {
    if (counts[c] > max) {
      max = counts[c];
      label = c;
    }
  }
  return label;
}

export function predictTree(node: TreeNode, features: number[]): number[] {
  if (node.isLeaf) return node.prediction ?? [0, 0, 0, 0];
  if (features[node.feature!] <= node.threshold!) {
    return predictTree(node.left!, features);
  }
  return predictTree(node.right!, features);
}

export function predictLabel(node: TreeNode, features: number[]): number {
  if (node.isLeaf) return node.label ?? 0;
  if (features[node.feature!] <= node.threshold!) {
    return predictLabel(node.left!, features);
  }
  return predictLabel(node.right!, features);
}

// Accumulate feature importance by tracking which features are used for splits
// weighted by the number of samples they affect
export function computeTreeFeatureImportance(
  node: TreeNode,
  totalSamples: number,
  numFeatures: number
): number[] {
  const importance = new Array(numFeatures).fill(0);
  accumulateImportance(node, totalSamples, importance);
  return importance;
}

function accumulateImportance(
  node: TreeNode,
  totalSamples: number,
  importance: number[]
): void {
  if (node.isLeaf) return;
  if (node.feature !== undefined && node.samples !== undefined) {
    importance[node.feature] += node.samples / totalSamples;
  }
  if (node.left) accumulateImportance(node.left, totalSamples, importance);
  if (node.right) accumulateImportance(node.right, totalSamples, importance);
}
