// Stormwater Routing Service
// Re-exports the routing engine for use across the application.
// Future: multi-hop graph-based routing, real pump control integration.

export {
  DEFAULT_ROUTING_WEIGHTS,
  MIN_SAFE_CAPACITY,
  findCriticalVaults,
  findAvailableDestinations,
  calculateDestinationScore,
  rankDestinations,
  markRecommendations,
  recommendDiversion,
  simulateWaterTransfer,
  baselineRoute,
} from './routingEngine';
