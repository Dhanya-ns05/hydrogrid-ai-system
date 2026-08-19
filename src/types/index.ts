export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export type TrendDirection = 'up' | 'down' | 'stable';

export type VaultStatus = 'normal' | 'warning' | 'alert' | 'overflow';

export type SimulationSpeed = 'slow' | 'normal' | 'fast';

export type SimulationState = 'idle' | 'running' | 'paused';

export type PredictionHorizon = 5 | 10 | 15;

export type ModelStatus = 'untrained' | 'training' | 'trained' | 'error';

export interface FloodZone {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  waterLevel: number; // percentage 0-100
  rainfall: number; // mm/hr
  riseRate: number; // percentage points per minute
  riskScore: number; // 0-100
  riskLevel: RiskLevel;
  trend: TrendDirection;
  history: { time: string; waterLevel: number }[];
  // ML feature fields
  elevation: number; // meters above sea level
  drainageCapacity: number; // 0-100%
  historicalFloodFrequency: number; // 0-1
  cumulativeRainfall: number; // mm
  previousWaterLevel: number; // percentage 0-100
}

export interface Vault {
  id: string;
  latitude: number;
  longitude: number;
  capacity: number; // total capacity in liters
  currentLevel: number; // percentage 0-100
  availableCapacity: number; // percentage 0-100
  riskLevel: RiskLevel;
  connectedVaults: string[];
  status: VaultStatus;
  // ML feature fields
  elevation: number; // meters above sea level
  drainageCapacity: number; // 0-100%
  historicalFloodFrequency: number; // 0-1
  cumulativeRainfall: number; // mm
  previousWaterLevel: number; // percentage 0-100
}

export interface RainfallReading {
  id: string;
  zoneId: string;
  zoneName: string;
  intensity: number; // mm/hr
  timestamp: string;
}

export interface RoadSegment {
  id: string;
  start: { latitude: number; longitude: number };
  end: { latitude: number; longitude: number };
  name: string;
  length: number; // meters
  floodRisk: RiskLevel;
  trafficLevel: number; // 0-100
  accessible: boolean;
}

export interface Hospital {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
}

export interface Ambulance {
  id: string;
  latitude: number;
  longitude: number;
  currentZone: string;
  destinationHospital: string;
  routeStatus: 'clear' | 'at_risk' | 'blocked';
  alternativeAvailable: boolean;
}

export interface Alert {
  id: string;
  severity: 'critical' | 'high' | 'warning' | 'info';
  title: string;
  message: string;
  source: string;
  timestamp: string;
  acknowledged: boolean;
}

export interface SimulationConfig {
  rainfallIntensity: number; // 0-150 mm/hr
  waterRiseRate: number; // 0-10 %/min
  trafficLevel: number; // 0-100
  speed: SimulationSpeed;
  state: SimulationState;
  tick: number;
}

export interface KPIData {
  currentRainfall: number;
  activeFloodHotspots: number;
  criticalVaults: number;
  highestFloodRisk: number;
  waterDiverted: number;
  emergencyRoutesAffected: number;
}

// ===================== ML Prediction Engine Types =====================

export interface TrainingRow {
  rainfall_intensity: number;
  cumulative_rainfall: number;
  current_water_level: number;
  water_level_rise_rate: number;
  vault_capacity: number;
  available_capacity: number;
  elevation: number;
  drainage_capacity: number;
  historical_flood_frequency: number;
  time_of_day: number;
  previous_water_level: number;
  flood_risk: number; // 0-3 (low=0, medium=1, high=2, critical=3)
}

export interface FeatureVector {
  rainfall_intensity: number;
  cumulative_rainfall: number;
  current_water_level: number;
  water_level_rise_rate: number;
  vault_capacity: number;
  available_capacity: number;
  elevation: number;
  drainage_capacity: number;
  historical_flood_frequency: number;
  time_of_day: number;
  previous_water_level: number;
}

export interface ModelMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  confusionMatrix: number[][];
  trainSize: number;
  testSize: number;
}

export interface FeatureImportance {
  feature: string;
  importance: number;
}

export interface PredictionResult {
  id: string;
  name: string;
  floodProbability: number; // 0-100
  riskLevel: RiskLevel;
  trend: TrendDirection;
  predictionText: string;
  featureVector: FeatureVector;
  horizon: PredictionHorizon;
  futureProbability: number; // 0-100, projected at horizon
}

export interface ModelInfo {
  status: ModelStatus;
  modelType: string;
  trainingDataSize: number;
  dataType: string;
  metrics: ModelMetrics | null;
  featureImportance: FeatureImportance[];
  trainedAt: string | null;
}

// ===================== Stormwater Routing Types =====================

export interface RoutingWeights {
  availableCapacity: number; // 0-1
  floodRisk: number; // 0-1
  predictedRisk: number; // 0-1
  distance: number; // 0-1
  networkSuitability: number; // 0-1
}

export interface DestinationCandidate {
  vaultId: string;
  availableCapacity: number; // percentage
  currentRisk: RiskLevel;
  currentRiskScore: number; // 0-100
  predictedRisk: RiskLevel;
  predictedRiskScore: number; // 0-100
  distance: number; // meters
  score: number; // 0-100
  status: 'recommended' | 'available' | 'avoid';
  reasons: string[];
}

export interface RoutingRecommendation {
  sourceVaultId: string;
  sourceLevel: number;
  sourceRisk: RiskLevel;
  recommendedDestination: DestinationCandidate | null;
  allCandidates: DestinationCandidate[];
  hasSafeDestination: boolean;
  reason: string;
}

export interface DiversionEvent {
  id: string;
  sourceVaultId: string;
  destinationVaultId: string;
  sourceLevelBefore: number;
  sourceLevelAfter: number;
  destLevelBefore: number;
  destLevelAfter: number;
  volume: number; // liters
  routingScore: number;
  timestamp: string;
}

export interface RoutingAnalytics {
  totalDiversions: number;
  totalWaterDiverted: number; // liters
  averageRoutingScore: number;
  rejectedDestinations: number;
  overflowWarnings: number;
  events: DiversionEvent[];
}

export type RoutingScenario =
  | 'normal'
  | 'heavy'
  | 'extreme'
  | 'one-critical'
  | 'multiple-critical';

export interface ActiveDiversion {
  sourceVaultId: string;
  destinationVaultId: string;
  progress: number; // 0-100
  sourceStartLevel: number;
  sourceTargetLevel: number;
  destStartLevel: number;
  destTargetLevel: number;
}

// ===================== Emergency Routing Types =====================

export interface RoadNode {
  id: string;
  latitude: number;
  longitude: number;
  name: string;
}

export interface RoadGraphSegment {
  id: string;
  startNode: string;
  endNode: string;
  start: { latitude: number; longitude: number };
  end: { latitude: number; longitude: number };
  name: string;
  length: number; // meters
  floodRisk: RiskLevel;
  floodDepth: number; // cm, 0 = no flooding
  trafficLevel: number; // 0-100
  accessible: boolean;
  roadStatus: 'open' | 'at_risk' | 'closed';
  estimatedTravelTime: number; // minutes
}

export interface RouteCostWeights {
  floodSafety: number; // 0-1
  travelTime: number; // 0-1
  floodDepth: number; // 0-1
  traffic: number; // 0-1
  distance: number; // 0-1
}

export interface RouteResult {
  type: 'fastest' | 'safest' | 'recommended';
  path: string[]; // road segment ids
  nodePath: string[]; // node ids
  coordinates: { latitude: number; longitude: number }[];
  distance: number; // meters
  estimatedTime: number; // minutes
  floodRisk: RiskLevel;
  floodRiskScore: number; // 0-100
  trafficLevel: number; // 0-100
  blockedRoads: number;
  floodedSegments: number;
  routeScore: number; // 0-100, higher = better
  status: 'recommended' | 'safe' | 'not_recommended' | 'no_route';
  reasons: string[];
}

export interface EmergencyRouteSet {
  ambulanceId: string;
  hospitalId: string;
  fastest: RouteResult | null;
  safest: RouteResult | null;
  recommended: RouteResult | null;
  hasSafeRoute: boolean;
  floodCondition: RiskLevel;
  calculatedAt: string;
}

export interface EmergencyAnalytics {
  totalRouteCalculations: number;
  totalRecalculations: number;
  blockedRoadsEncountered: number;
  safeRoutesFound: number;
  averageRouteScore: number;
  averageDelay: number; // minutes
  events: EmergencyEvent[];
}

export interface EmergencyEvent {
  id: string;
  type: 'route_blocked' | 'route_recalculated' | 'safe_route_found' | 'no_safe_route';
  ambulanceId: string;
  message: string;
  timestamp: string;
}

// ===================== Full System Integration Types =====================

export type SystemModuleStatus = 'active' | 'warning' | 'idle' | 'error';

export interface SystemStatus {
  weather: SystemModuleStatus;
  floodDetection: SystemModuleStatus;
  aiPrediction: SystemModuleStatus;
  vaultNetwork: SystemModuleStatus;
  waterRouting: SystemModuleStatus;
  emergencyRouting: SystemModuleStatus;
  simulation: SystemModuleStatus;
}

export type EventLogCategory =
  | 'rainfall'
  | 'flood'
  | 'vault'
  | 'routing'
  | 'road'
  | 'emergency'
  | 'system'
  | 'alert';

export type EventLogSeverity = 'info' | 'warning' | 'high' | 'critical' | 'emergency';

export interface EventLogEntry {
  id: string;
  timestamp: string;
  category: EventLogCategory;
  severity: EventLogSeverity;
  message: string;
}

export type FloodEventPhase =
  | 'idle'
  | 'starting'
  | 'rainfall-increasing'
  | 'flood-risk-rising'
  | 'hotspot-detected'
  | 'vault-critical'
  | 'diversion-evaluating'
  | 'diversion-active'
  | 'road-flooding'
  | 'emergency-recalculating'
  | 'complete';

export interface FloodEventDemoState {
  active: boolean;
  phase: FloodEventPhase;
  step: number;
  totalSteps: number;
  startTime: string | null;
  endTime: string | null;
  summary: FloodEventSummary | null;
}

export interface FloodEventSummary {
  peakRainfall: number;
  highestFloodRisk: number;
  waterDiverted: number;
  criticalVaults: number;
  blockedRoads: number;
  emergencyRoute: string;
  emergencyDelay: number;
  responseSteps: string[];
}

export interface BaselineMetrics {
  maxWaterLevel: number;
  criticalVaults: number;
  floodHotspots: number;
  overflowEvents: number;
  blockedRoads: number;
  emergencyDelay: number;
  waterDiverted: number;
}

export interface HydroGridImpact {
  withoutHydroGrid: BaselineMetrics;
  withHydroGrid: BaselineMetrics;
}

// ===================== Evaluation & Experiment Types =====================

export interface ExperimentConfig {
  numScenarios: number;
  seed: number;
  rainfallMin: number;
  rainfallMax: number;
  initialWaterLevelMin: number;
  initialWaterLevelMax: number;
  simulationDuration: number; // ticks
  trafficLevel: number;
  floodDepthThreshold: number; // cm
}

export type SystemMode = 'baseline' | 'hydrogrid';

export interface ScenarioResult {
  scenarioId: string;
  systemMode: SystemMode;
  rainfall: number;
  peakWaterLevel: number;
  averageWaterLevel: number;
  overflowEvents: number;
  criticalVaults: number;
  highRiskVaults: number;
  floodHotspots: number;
  maxFloodProbability: number;
  waterDiverted: number;
  successfulDiversions: number;
  failedDiversions: number;
  timeToResponse: number;
  timeAboveCritical: number;
  blockedRoads: number;
  routeDistance: number;
  routeTravelTime: number;
  routeFloodExposure: number;
  routeRiskScore: number;
  emergencyDelay: number;
  waterLevelTimeSeries: number[];
}

export interface ExperimentResults {
  experimentId: string;
  config: ExperimentConfig;
  startTime: string;
  endTime: string | null;
  status: 'idle' | 'running' | 'complete';
  baselineResults: ScenarioResult[];
  hydrogridResults: ScenarioResult[];
  aiMetrics: ModelMetrics | null;
  perClassMetrics: PerClassMetrics[] | null;
}

export interface PerClassMetrics {
  className: string;
  precision: number;
  recall: number;
  f1: number;
  support: number;
}

export interface ComparisonMetrics {
  metric: string;
  baseline: number;
  hydrogrid: number;
  improvement: number | null;
  higherIsBetter: boolean;
  unit: string;
}

export interface ScenarioStats {
  metric: string;
  mean: number;
  median: number;
  min: number;
  max: number;
  stdDev: number;
  unit: string;
}

// ===================== Real-Time Data Layer Types =====================

export type DataMode = 'simulation' | 'live';

export type DataSourceStatus = 'connected' | 'disconnected' | 'error' | 'fallback';

export interface DataSourceInfo {
  mode: DataMode;
  status: DataSourceStatus;
  provider: string;
  lastFetch: string | null;
  errorMessage: string | null;
}

export interface LiveDataConfig {
  apiKey: string | null;
  apiUrl: string | null;
  pollIntervalMs: number;
  enabled: boolean;
}

// ===================== Affected Zone Intelligence Types =====================

export interface AffectedZone {
  id: string;
  name: string;
  centerLatitude: number;
  centerLongitude: number;
  radiusKm: number;
  severity: RiskLevel;
  active: boolean;
}

export interface ZoneInfrastructure {
  roadsInZone: RoadSegment[];
  roadGraphInZone: RoadGraphSegment[];
  hospitalsInZone: Hospital[];
  ambulancesInZone: Ambulance[];
  vaultsInZone: Vault[];
  floodZonesInZone: FloodZone[];
}

// ===================== Digital Twin Types =====================

export type TwinViewState = 'current' | 'predicted';

export interface TwinEntityState {
  id: string;
  type: 'road' | 'hospital' | 'ambulance' | 'vault' | 'flood_zone';
  currentState: string;
  predictedState: string;
  position: { latitude: number; longitude: number };
  riskLevel: RiskLevel;
  predictedRiskLevel: RiskLevel;
}

export interface DigitalTwinState {
  affectedZoneId: string | null;
  viewState: TwinViewState;
  entities: TwinEntityState[];
  simulationSpeed: SimulationSpeed;
  playing: boolean;
  currentTimeStep: number;
  totalPredictionSteps: number;
}

// ===================== Prediction Window Types =====================

export type PredictionWindow = 15 | 30 | 60;

export interface RiskPrediction {
  zoneId: string;
  zoneName: string;
  currentRisk: RiskLevel;
  currentRiskScore: number;
  predictedRisk: RiskLevel;
  predictedRiskScore: number;
  window: PredictionWindow;
  confidence: number;
  basis: string[];
  timestamp: string;
}

// ===================== Ambulance Selection Types =====================

export interface AmbulanceCandidate {
  ambulanceId: string;
  distanceToIncident: number;
  estimatedTravelTime: number;
  routeRisk: number;
  selectionScore: number;
  routeResult: RouteResult | null;
  selected: boolean;
  reasons: string[];
}

export interface AmbulanceSelectionResult {
  incidentLocation: { latitude: number; longitude: number };
  affectedZoneId: string;
  severity: RiskLevel;
  candidates: AmbulanceCandidate[];
  selectedAmbulance: AmbulanceCandidate | null;
  hospitalRoute: RouteResult | null;
  calculatedAt: string;
}

// ===================== Emergency Response Engine Types =====================

export type EmergencyResponseStatus = 'monitoring' | 'active' | 'standby';

export interface EmergencyResponseState {
  status: EmergencyResponseStatus;
  triggeredBy: 'auto' | 'manual' | null;
  affectedZoneId: string | null;
  severity: RiskLevel;
  unsafeRoads: RoadGraphSegment[];
  availableAmbulances: Ambulance[];
  ambulanceSelection: AmbulanceSelectionResult | null;
  primaryRoute: RouteResult | null;
  alternativeRoute: RouteResult | null;
  activatedAt: string | null;
}

// ===================== Live Weather Data Types =====================

export interface LiveWeatherData {
  latitude: number;
  longitude: number;
  temperature: number;
  precipitation: number;
  weatherCode: number;
  weatherDescription: string;
  humidity: number;
  windSpeed: number;
  forecastPrecipitation: number;
  timestamp: string;
  source: string;
}

export type WeatherFetchStatus = 'idle' | 'fetching' | 'success' | 'error';

export interface WeatherState {
  data: LiveWeatherData | null;
  status: WeatherFetchStatus;
  error: string | null;
  lastUpdated: string | null;
  pollIntervalMs: number;
  locationName: string;
}

// ===================== Live Risk Analysis Types =====================

export interface LiveRiskFactor {
  label: string;
  value: string;
  contribution: number;
  direction: 'up' | 'down' | 'stable';
  source: 'live' | 'simulated';
}

export interface LiveRiskAnalysis {
  score: number;
  level: RiskLevel;
  previousScore: number;
  previousLevel: RiskLevel;
  trend: 'rising' | 'falling' | 'stable';
  delta: number;
  factors: LiveRiskFactor[];
  liveInputs: string[];
  simulatedInputs: string[];
  timestamp: string;
}

export interface RiskHistoryEntry {
  timestamp: string;
  location: string;
  temperature: number;
  precipitation: number;
  humidity: number;
  windSpeed: number;
  forecastPrecipitation: number;
  riskScore: number;
  riskLevel: RiskLevel;
  dataSource: 'live' | 'simulated';
}
