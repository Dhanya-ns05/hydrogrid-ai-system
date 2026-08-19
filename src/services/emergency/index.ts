// Emergency Routing Service
// Re-exports the road network, route scoring, and route engine.
// Future: OpenStreetMap integration, live traffic API, GPS ambulance tracking.

export {
  ROAD_NODES,
  ROAD_GRAPH,
  EMERGENCY_AMBULANCES,
  EMERGENCY_HOSPITALS,
  AMBULANCE_NODE_MAP,
  HOSPITAL_NODE_MAP,
} from './roadNetwork';

export {
  DEFAULT_ROUTE_WEIGHTS,
  SAFE_FLOOD_DEPTH_THRESHOLD,
  isRoadBlocked,
  calculateSegmentCost,
  calculateRouteScore,
  routeFloodRisk,
} from './routeScoring';

export {
  calculateRoutes,
  updateRoadFloodConditions,
} from './routeEngine';
