import { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { CityMap } from '@/components/CityMap';
import { riskColor, riskLabel } from '@/utils/risk';
import {
  Ambulance,
  MapPin,
  Hospital,
  AlertTriangle,
  Navigation,
  Info,
  Clock,
  Gauge,
  CheckCircle,
  XCircle,
  Route as RouteIcon,
  Shield,
  Loader2,
  Ban,
  Activity,
} from 'lucide-react';
import type { RouteResult } from '@/types';

export function EmergencyRoutesView() {
  const ambulances = useStore((s) => s.emergencyAmbulances);
  const hospitals = useStore((s) => s.emergencyHospitals);
  const roadSegments = useStore((s) => s.roadSegments);
  const selectedAmbulanceId = useStore((s) => s.selectedAmbulanceId);
  const selectedHospitalId = useStore((s) => s.selectedHospitalId);
  const setSelectedAmbulance = useStore((s) => s.setSelectedAmbulance);
  const setSelectedHospital = useStore((s) => s.setSelectedHospital);
  const calculateEmergencyRoutes = useStore((s) => s.calculateEmergencyRoutes);
  const clearEmergencyRoutes = useStore((s) => s.clearEmergencyRoutes);
  const emergencyRouteSet = useStore((s) => s.emergencyRouteSet);

  const [calculating, setCalculating] = useState(false);
  const [hasCalculated, setHasCalculated] = useState(false);

  const amb = ambulances.find((a) => a.id === selectedAmbulanceId);
  const hospital = hospitals.find((h) => h.id === selectedHospitalId);
  const affectedRoads = roadSegments.filter((r) => !r.accessible);

  const recommended = emergencyRouteSet?.recommended ?? null;
  const safest = emergencyRouteSet?.safest ?? null;
  const fastest = emergencyRouteSet?.fastest ?? null;

  const handleCalculate = () => {
    setCalculating(true);
    setHasCalculated(false);
    setTimeout(() => {
      calculateEmergencyRoutes();
      setCalculating(false);
      setHasCalculated(true);
    }, 700);
  };

  const handleClear = () => {
    clearEmergencyRoutes();
    setHasCalculated(false);
  };

  // Auto-clear the "just calculated" flag when route set changes externally
  useEffect(() => {
    if (!emergencyRouteSet) setHasCalculated(false);
  }, [emergencyRouteSet]);

  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Emergency Route Assistance</h2>
          <p className="text-sm text-surface-600 mt-1">
            Flood-aware ambulance routing - Simulated data for Bengaluru
          </p>
        </div>
        <span className="badge bg-risk-medium/15 text-risk-medium border border-risk-medium/30 text-[10px]">
          SIMULATED ROUTE ANALYSIS
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left panel: ambulance/hospital selection + controls */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          <div className="card p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-risk-critical/20 flex items-center justify-center border border-risk-critical/30">
                <Ambulance className="w-5 h-5 text-risk-critical" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Ambulance Routing</h3>
                <span className="text-xs font-mono text-primary-400">{amb?.id}</span>
              </div>
            </div>

            {/* Ambulance selector */}
            <div className="mb-4">
              <label className="text-[10px] font-bold text-surface-600 uppercase tracking-wide mb-1.5 block">
                Select Ambulance
              </label>
              <div className="flex flex-wrap gap-2">
                {ambulances.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => setSelectedAmbulance(a.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
                      selectedAmbulanceId === a.id
                        ? 'bg-risk-critical/10 border-risk-critical/40'
                        : 'bg-surface-200/30 border-surface-200/40 hover:border-surface-300/60'
                    }`}
                  >
                    <Ambulance className="w-3.5 h-3.5 text-risk-critical" />
                    <span className="text-xs font-mono font-bold text-white">{a.id}</span>
                    <span className="text-[10px] text-surface-600">{a.currentZone}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Hospital selector */}
            <div className="mb-4">
              <label className="text-[10px] font-bold text-surface-600 uppercase tracking-wide mb-1.5 block">
                Destination Hospital
              </label>
              <div className="flex flex-wrap gap-2">
                {hospitals.map((h) => (
                  <button
                    key={h.id}
                    onClick={() => setSelectedHospital(h.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
                      selectedHospitalId === h.id
                        ? 'bg-primary-500/10 border-primary-500/40'
                        : 'bg-surface-200/30 border-surface-200/40 hover:border-surface-300/60'
                    }`}
                  >
                    <Hospital className="w-3.5 h-3.5 text-primary-400" />
                    <span className="text-xs font-bold text-white">{h.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Current status */}
            {amb && hospital && (
              <div className="p-3 rounded-lg bg-surface-200/20 border border-surface-200/30 space-y-2 mb-4">
                <div className="flex items-center gap-2 text-xs">
                  <MapPin className="w-3.5 h-3.5 text-surface-600" />
                  <span className="text-surface-600">Origin:</span>
                  <span className="font-bold text-white">{amb.currentZone}</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <Hospital className="w-3.5 h-3.5 text-surface-600" />
                  <span className="text-surface-600">Destination:</span>
                  <span className="font-bold text-white">{hospital.name}</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <AlertTriangle className="w-3.5 h-3.5 text-surface-600" />
                  <span className="text-surface-600">Flood Condition:</span>
                  <span className="font-bold" style={{ color: emergencyRouteSet ? riskColor(emergencyRouteSet.floodCondition) : '#64748b' }}>
                    {emergencyRouteSet ? riskLabel(emergencyRouteSet.floodCondition).toUpperCase() : '—'}
                  </span>
                </div>
              </div>
            )}

            {/* Status indicator */}
            <div className="bg-surface-200/40 rounded-lg p-3 mb-3">
              <div className="flex items-center gap-2 mb-1">
                {calculating ? (
                  <Loader2 className="w-3.5 h-3.5 text-primary-400 animate-spin" />
                ) : hasCalculated && emergencyRouteSet ? (
                  <CheckCircle className="w-3.5 h-3.5 text-risk-low" />
                ) : (
                  <Activity className="w-3.5 h-3.5 text-surface-600" />
                )}
                <span className="text-[10px] text-surface-600 uppercase tracking-wide font-medium">
                  Status
                </span>
              </div>
              <p className="text-xs text-surface-800 font-medium mt-1">
                {calculating
                  ? 'Analyzing flood conditions...'
                  : hasCalculated && emergencyRouteSet
                    ? emergencyRouteSet.hasSafeRoute
                      ? 'Safest route calculated'
                      : 'No safe route available'
                    : 'Routing engine ready'}
              </p>
            </div>

            {/* Buttons */}
            <div className="flex gap-2">
              <button
                onClick={handleCalculate}
                disabled={calculating}
                className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {calculating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Navigation className="w-4 h-4" />
                )}
                {calculating ? 'Calculating...' : 'Calculate Safest Route'}
              </button>
              <button
                onClick={handleClear}
                disabled={!emergencyRouteSet}
                className="btn-secondary flex items-center justify-center disabled:opacity-50"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Affected Roads */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-risk-high" />
              <h3 className="text-sm font-bold text-white tracking-wide uppercase">
                Affected Road Segments
              </h3>
            </div>
            {affectedRoads.length === 0 ? (
              <p className="text-sm text-surface-700 py-4 text-center">All roads accessible</p>
            ) : (
              <div className="space-y-2">
                {affectedRoads.map((road) => (
                  <div
                    key={road.id}
                    className="flex items-center justify-between bg-risk-critical/10 border border-risk-critical/20 rounded-lg px-3 py-2"
                  >
                    <span className="text-sm text-white font-medium">{road.name}</span>
                    <span className="badge text-[10px] bg-risk-critical/20 text-risk-critical border border-risk-critical/30">
                      INACCESSIBLE
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Map + Results */}
        <div className="lg:col-span-2 flex flex-col gap-5">
          <CityMap
            height="h-[400px]"
            showZones={true}
            showVaults={false}
            showRoads={true}
            showHospitals={true}
            showAmbulances={true}
            showEmergencyRoute={hasCalculated}
          />

          {/* Result card */}
          {hasCalculated && emergencyRouteSet && recommended && recommended.status !== 'no_route' && (
            <RouteResultCard
              recommended={recommended}
              alternatives={[safest, fastest].filter((r): r is RouteResult => r !== null && r !== recommended)}
              floodCondition={emergencyRouteSet.floodCondition}
            />
          )}

          {/* No safe route */}
          {hasCalculated && emergencyRouteSet && !emergencyRouteSet.hasSafeRoute && (
            <div className="card p-5 border-risk-critical/40">
              <div className="flex items-center gap-2 mb-3">
                <XCircle className="w-5 h-5 text-risk-critical" />
                <h3 className="text-sm font-bold text-risk-critical uppercase">No Safe Route Available</h3>
              </div>
              <div className="space-y-2 text-xs text-surface-700">
                <p>All candidate routes are blocked or critically unsafe.</p>
                <p>
                  Blocked roads encountered: {recommended?.blockedRoads ?? 0}
                </p>
                <p>
                  Highest available safety score: {recommended?.routeScore ?? 0}/100
                </p>
                <div className="flex items-start gap-2 mt-3 p-3 bg-risk-critical/10 rounded-lg">
                  <Info className="w-3.5 h-3.5 text-risk-critical shrink-0 mt-0.5" />
                  <p className="text-surface-700">
                    This is a simulation. Emergency operators should use official real-world navigation
                    and emergency dispatch systems for actual response coordination.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function RouteResultCard({
  recommended,
  alternatives,
  floodCondition,
}: {
  recommended: RouteResult;
  alternatives: RouteResult[];
  floodCondition: import('@/types').RiskLevel;
}) {
  const routeNames = recommended.path.length > 0
    ? `Route via ${recommended.path.length} segments`
    : 'Route';

  return (
    <div className="card p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary-400" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wide">Safest Route</h3>
        </div>
        <span className="badge bg-primary-500/15 text-primary-400 border border-primary-500/30 text-[10px]">
          RECOMMENDED FOR: AMBULANCE
        </span>
      </div>

      {/* Route name */}
      <div className="flex items-center gap-2 mb-4">
        <RouteIcon className="w-4 h-4 text-surface-600" />
        <span className="text-sm font-bold text-white">{routeNames}</span>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
        <MetricCard
          icon={Shield}
          label="Safety Score"
          value={`${recommended.routeScore}/100`}
          color="#06b6d4"
        />
        <MetricCard
          icon={AlertTriangle}
          label="Flood Risk"
          value={riskLabel(recommended.floodRisk).toUpperCase()}
          color={riskColor(recommended.floodRisk)}
        />
        <MetricCard
          icon={Clock}
          label="Travel Time"
          value={`${recommended.estimatedTime} min`}
          color="#e2e8f0"
        />
        <MetricCard
          icon={Gauge}
          label="Distance"
          value={`${(recommended.distance / 1000).toFixed(1)} km`}
          color="#e2e8f0"
        />
        <MetricCard
          icon={Ban}
          label="Affected Segments"
          value={`${recommended.floodedSegments}`}
          color={recommended.floodedSegments > 0 ? '#f97316' : '#22c55e'}
        />
        <MetricCard
          icon={CheckCircle}
          label="Status"
          value={recommended.status === 'recommended' ? 'SAFE' : recommended.status === 'safe' ? 'SAFE' : 'CAUTION'}
          color={recommended.status === 'recommended' || recommended.status === 'safe' ? '#22c55e' : '#f97316'}
        />
      </div>

      {/* Why this route */}
      <div className="bg-surface-200/30 rounded-lg p-3 mb-4">
        <h4 className="text-[10px] font-bold text-surface-600 uppercase tracking-wide mb-2">
          Why This Route?
        </h4>
        <div className="space-y-1.5">
          {recommended.reasons.map((reason, i) => (
            <div key={i} className="flex items-start gap-2 text-xs text-surface-800">
              <CheckCircle className="w-3 h-3 text-risk-low shrink-0 mt-0.5" />
              <span>{reason}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Alternatives */}
      {alternatives.length > 0 && (
        <div>
          <h4 className="text-[10px] font-bold text-surface-600 uppercase tracking-wide mb-2">
            Alternative Routes
          </h4>
          <div className="space-y-2">
            {alternatives.map((alt, i) => (
              <div
                key={i}
                className="flex items-center justify-between bg-surface-200/20 border border-surface-200/30 rounded-lg px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-surface-600 uppercase">
                    {i + 1}. Alternative
                  </span>
                  <span className="text-xs text-surface-700 capitalize">{alt.type}</span>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <span className="text-surface-600">
                    Safety: <span className="font-bold text-white">{alt.routeScore}</span>
                  </span>
                  <span className="text-surface-600">
                    Time: <span className="font-bold text-white">{alt.estimatedTime} min</span>
                  </span>
                  <span className="font-bold" style={{ color: riskColor(alt.floodRisk) }}>
                    {riskLabel(alt.floodRisk).toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Flood condition footer */}
      <div className="flex items-center gap-2 mt-4 pt-3 border-t border-surface-200/30">
        <AlertTriangle className="w-3.5 h-3.5" style={{ color: riskColor(floodCondition) }} />
        <span className="text-[10px] text-surface-600 uppercase tracking-wide">
          Current Flood Condition:
        </span>
        <span className="text-xs font-bold" style={{ color: riskColor(floodCondition) }}>
          {riskLabel(floodCondition).toUpperCase()}
        </span>
        <span className="text-[10px] text-surface-600 ml-auto">SIMULATED ROUTE ANALYSIS</span>
      </div>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: typeof Shield;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="bg-surface-200/30 rounded-lg p-3 border border-surface-200/20">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className="w-3 h-3" style={{ color }} />
        <span className="text-[10px] text-surface-600 uppercase tracking-wide font-medium">
          {label}
        </span>
      </div>
      <p className="text-sm font-bold" style={{ color }}>
        {value}
      </p>
    </div>
  );
}
