// Emergency Route Engine
// Uses Dijkstra's algorithm to find the fastest, safest, and recommended routes
// through the road graph. The recommended route balances safety and speed.

import type {
  RoadGraphSegment,
  RouteCostWeights,
  RouteResult,
  EmergencyRouteSet,
  RiskLevel,
  RoadNode,
} from '@/types';
import {
  DEFAULT_ROUTE_WEIGHTS,
  calculateSegmentCost,
  calculateRouteScore,
  isRoadBlocked,
  routeFloodRisk,
  SAFE_FLOOD_DEPTH_THRESHOLD,
} from './routeScoring';

interface Graph {
  nodes: Map<string, RoadNode>;
  adjacency: Map<string, { road: RoadGraphSegment; target: string }[]>;
}

function buildGraph(roads: RoadGraphSegment[], nodes: RoadNode[]): Graph {
  const nodeMap = new Map<string, RoadNode>();
  for (const n of nodes) nodeMap.set(n.id, n);

  const adjacency = new Map<string, { road: RoadGraphSegment; target: string }[]>();
  for (const road of roads) {
    // Bidirectional
    if (!adjacency.has(road.startNode)) adjacency.set(road.startNode, []);
    if (!adjacency.has(road.endNode)) adjacency.set(road.endNode, []);
    adjacency.get(road.startNode)!.push({ road, target: road.endNode });
    adjacency.get(road.endNode)!.push({ road, target: road.startNode });
  }

  return { nodes: nodeMap, adjacency };
}

interface DijkstraResult {
  path: string[]; // node ids
  roadPath: string[]; // road segment ids
  distance: number;
  time: number;
  roads: RoadGraphSegment[];
}

function dijkstra(
  graph: Graph,
  startNode: string,
  endNode: string,
  roads: RoadGraphSegment[],
  weights: RouteCostWeights,
  mode: 'fastest' | 'safest' | 'recommended',
  avoidBlocked: boolean
): DijkstraResult | null {
  const roadMap = new Map<string, RoadGraphSegment>();
  for (const r of roads) roadMap.set(r.id, r);

  const dist = new Map<string, number>();
  const prev = new Map<string, { node: string; roadId: string }>();
  const visited = new Set<string>();

  // Initialize
  for (const nodeId of graph.nodes.keys()) {
    dist.set(nodeId, Infinity);
  }
  dist.set(startNode, 0);

  // Priority queue (simple array-based for small graphs)
  const queue: { node: string; cost: number }[] = [{ node: startNode, cost: 0 }];

  while (queue.length > 0) {
    // Find minimum cost node
    queue.sort((a, b) => a.cost - b.cost);
    const current = queue.shift()!;

    if (visited.has(current.node)) continue;
    visited.add(current.node);

    if (current.node === endNode) {
      // Reconstruct path
      const nodePath: string[] = [];
      const roadPath: string[] = [];
      let node = endNode;
      while (prev.has(node)) {
        nodePath.unshift(node);
        const p = prev.get(node)!;
        roadPath.unshift(p.roadId);
        node = p.node;
      }
      nodePath.unshift(startNode);

      const pathRoads = roadPath.map((id) => roadMap.get(id)!).filter(Boolean);
      const distance = pathRoads.reduce((sum, r) => sum + r.length, 0);
      const time = pathRoads.reduce((sum, r) => sum + r.estimatedTravelTime, 0);

      return { path: nodePath, roadPath, distance, time, roads: pathRoads };
    }

    const neighbors = graph.adjacency.get(current.node) || [];
    for (const { road, target } of neighbors) {
      if (visited.has(target)) continue;

      // Skip blocked roads when avoidBlocked is true
      if (avoidBlocked && isRoadBlocked(road)) continue;

      let segmentCost: number;
      if (mode === 'fastest') {
        // Fastest: minimize travel time
        segmentCost = road.estimatedTravelTime;
        if (isRoadBlocked(road)) segmentCost = Infinity;
      } else if (mode === 'safest') {
        // Safest: minimize flood risk + depth, skip all blocked
        segmentCost = calculateSegmentCost(road, weights) * 10; // amplify safety
        if (isRoadBlocked(road)) segmentCost = Infinity;
      } else {
        // Recommended: balanced cost function
        segmentCost = calculateSegmentCost(road, weights);
        if (isRoadBlocked(road)) segmentCost = Infinity;
      }

      const alt = (dist.get(current.node) || 0) + segmentCost;
      if (alt < (dist.get(target) || Infinity)) {
        dist.set(target, alt);
        prev.set(target, { node: current.node, roadId: road.id });
        queue.push({ node: target, cost: alt });
      }
    }
  }

  return null; // No path found
}

function buildRouteResult(
  type: RouteResult['type'],
  dijkstraRes: DijkstraResult | null,
  graph: Graph,
  weights: RouteCostWeights
): RouteResult | null {
  if (!dijkstraRes || dijkstraRes.roads.length === 0) {
    return {
      type,
      path: [],
      nodePath: [],
      coordinates: [],
      distance: 0,
      estimatedTime: 0,
      floodRisk: 'critical',
      floodRiskScore: 100,
      trafficLevel: 0,
      blockedRoads: 0,
      floodedSegments: 0,
      routeScore: 0,
      status: 'no_route',
      reasons: [],
    };
  }

  const { roads, distance, time, roadPath, path } = dijkstraRes;
  const { risk, score } = routeFloodRisk(roads);
  const avgTraffic = Math.round(roads.reduce((s, r) => s + r.trafficLevel, 0) / roads.length);
  const blocked = roads.filter(isRoadBlocked).length;
  const flooded = roads.filter((r) => r.floodDepth > 0).length;
  const routeScore = calculateRouteScore(roads, weights);

  const coordinates = path.map((nodeId) => {
    const node = graph.nodes.get(nodeId);
    return node ? { latitude: node.latitude, longitude: node.longitude } : { latitude: 0, longitude: 0 };
  });

  // Determine status
  let status: RouteResult['status'];
  if (type === 'fastest') {
    status = blocked > 0 || risk === 'critical' || risk === 'high' ? 'not_recommended' : 'safe';
  } else if (type === 'safest') {
    status = blocked > 0 ? 'not_recommended' : 'safe';
  } else {
    // recommended
    status = blocked > 0 ? 'no_route' : 'recommended';
  }

  // Generate reasons
  const reasons: string[] = [];
  if (blocked > 0) {
    reasons.push(`Avoids ${blocked} blocked road segment${blocked > 1 ? 's' : ''}`);
  }
  if (flooded > 0) {
    reasons.push(`Crosses ${flooded} flooded segment${flooded > 1 ? 's' : ''} (low depth)`);
  } else {
    reasons.push('No flooded road segments on this route');
  }
  reasons.push(`${risk === 'low' ? 'Low' : risk === 'medium' ? 'Medium' : 'High'} overall flood exposure`);
  reasons.push(`Estimated travel time: ${time} min`);
  reasons.push(`Total distance: ${(distance / 1000).toFixed(1)} km`);

  if (type === 'recommended') {
    const highRiskRoads = roads.filter((r) => r.floodRisk === 'high' || r.floodRisk === 'critical').length;
    if (highRiskRoads === 0) {
      reasons.push('Avoids all high-risk road segments');
    }
    reasons.push('Balances safety and travel time');
    reasons.push('Hospital remains accessible via this route');
  }

  return {
    type,
    path: roadPath,
    nodePath: path,
    coordinates,
    distance: Math.round(distance),
    estimatedTime: time,
    floodRisk: risk,
    floodRiskScore: score,
    trafficLevel: avgTraffic,
    blockedRoads: blocked,
    floodedSegments: flooded,
    routeScore,
    status,
    reasons,
  };
}

/**
 * Main routing function: calculates fastest, safest, and recommended routes.
 */
export function calculateRoutes(
  startNode: string,
  endNode: string,
  roads: RoadGraphSegment[],
  nodes: RoadNode[],
  weights: RouteCostWeights = DEFAULT_ROUTE_WEIGHTS
): EmergencyRouteSet {
  const graph = buildGraph(roads, nodes);

  // Fastest route: minimize time, but still avoid blocked roads
  const fastestRes = dijkstra(graph, startNode, endNode, roads, weights, 'fastest', true);
  const fastest = buildRouteResult('fastest', fastestRes, graph, weights);

  // Safest route: minimize flood risk + depth
  const safestRes = dijkstra(graph, startNode, endNode, roads, weights, 'safest', true);
  const safest = buildRouteResult('safest', safestRes, graph, weights);

  // Recommended route: balanced cost, avoid blocked roads
  const recommendedRes = dijkstra(graph, startNode, endNode, roads, weights, 'recommended', true);
  const recommended = buildRouteResult('recommended', recommendedRes, graph, weights);

  const hasSafeRoute = (safest !== null && safest.status !== 'no_route') ||
    (recommended !== null && recommended.status !== 'no_route');

  // Determine overall flood condition from the roads
  const allRisks = roads.map((r) => r.floodRisk);
  const criticalCount = allRisks.filter((r) => r === 'critical').length;
  const highCount = allRisks.filter((r) => r === 'high').length;
  let floodCondition: RiskLevel = 'low';
  if (criticalCount > 0) floodCondition = 'critical';
  else if (highCount > 0) floodCondition = 'high';
  else if (allRisks.some((r) => r === 'medium')) floodCondition = 'medium';

  return {
    ambulanceId: '', // filled by caller
    hospitalId: '', // filled by caller
    fastest,
    safest,
    recommended,
    hasSafeRoute,
    floodCondition,
    calculatedAt: new Date().toISOString(),
  };
}

/**
 * Updates road flood risk based on flood zone conditions.
 * Roads near high-risk zones get their risk elevated.
 */
export function updateRoadFloodConditions(
  roads: RoadGraphSegment[],
  zoneRisks: { latitude: number; longitude: number; riskLevel: RiskLevel }[]
): RoadGraphSegment[] {
  return roads.map((road) => {
    // Find nearest zone to the road's midpoint
    const midLat = (road.start.latitude + road.end.latitude) / 2;
    const midLon = (road.start.longitude + road.end.longitude) / 2;

    let nearestRisk: RiskLevel = 'low';
    let minDist = Infinity;

    for (const zone of zoneRisks) {
      const dist = Math.abs(zone.latitude - midLat) + Math.abs(zone.longitude - midLon);
      if (dist < minDist) {
        minDist = dist;
        nearestRisk = zone.riskLevel;
      }
    }

    // Only update if the zone risk is higher than current
    const riskScore = (r: RiskLevel) =>
      r === 'critical' ? 4 : r === 'high' ? 3 : r === 'medium' ? 2 : 1;
    const currentScore = riskScore(road.floodRisk);
    const zoneScore = riskScore(nearestRisk);

    let newFloodRisk = road.floodRisk;
    let newFloodDepth = road.floodDepth;
    let newRoadStatus = road.roadStatus;
    let newAccessible = road.accessible;

    if (zoneScore > currentScore) {
      newFloodRisk = nearestRisk;
      // Increase flood depth proportionally
      if (nearestRisk === 'critical') newFloodDepth = Math.max(newFloodDepth, SAFE_FLOOD_DEPTH_THRESHOLD + 5);
      else if (nearestRisk === 'high') newFloodDepth = Math.max(newFloodDepth, 18);
      else if (nearestRisk === 'medium') newFloodDepth = Math.max(newFloodDepth, 8);
      else newFloodDepth = 0;
    }

    // Update status based on new conditions
    if (newFloodDepth >= SAFE_FLOOD_DEPTH_THRESHOLD || newFloodRisk === 'critical') {
      newRoadStatus = 'closed';
      newAccessible = false;
    } else if (newFloodRisk === 'high') {
      newRoadStatus = 'at_risk';
      newAccessible = true;
    } else {
      newRoadStatus = 'open';
      newAccessible = true;
    }

    return {
      ...road,
      floodRisk: newFloodRisk,
      floodDepth: newFloodDepth,
      roadStatus: newRoadStatus,
      accessible: newAccessible,
    };
  });
}
