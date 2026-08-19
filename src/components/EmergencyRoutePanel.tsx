import { useStore } from '@/store/useStore';
import { riskColor, riskLabel } from '@/utils/risk';
import { Ambulance, MapPin, Hospital, Navigation, Clock, Gauge, AlertTriangle, CheckCircle, XCircle, Route as RouteIcon } from 'lucide-react';
import type { RouteResult } from '@/types';

export function EmergencyRoutePanel() {
  const ambulances = useStore((s) => s.emergencyAmbulances);
  const hospitals = useStore((s) => s.emergencyHospitals);
  const selectedAmbulanceId = useStore((s) => s.selectedAmbulanceId);
  const selectedHospitalId = useStore((s) => s.selectedHospitalId);
  const setSelectedAmbulance = useStore((s) => s.setSelectedAmbulance);
  const setSelectedHospital = useStore((s) => s.setSelectedHospital);
  const calculateEmergencyRoutes = useStore((s) => s.calculateEmergencyRoutes);
  const clearEmergencyRoutes = useStore((s) => s.clearEmergencyRoutes);
  const emergencyRouteSet = useStore((s) => s.emergencyRouteSet);

  const amb = ambulances.find((a) => a.id === selectedAmbulanceId);
  const hospital = hospitals.find((h) => h.id === selectedHospitalId);
  const recommended = emergencyRouteSet?.recommended;

  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-4">
        <Ambulance className="w-4 h-4 text-risk-critical" />
        <h3 className="text-sm font-bold text-white tracking-wide uppercase">
          Emergency Route Assistance
        </h3>
      </div>

      {/* Ambulance selector */}
      <div className="space-y-3">
        <div>
          <label className="text-[10px] font-bold text-surface-600 uppercase tracking-wide mb-1.5 block">Ambulance</label>
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
        <div>
          <label className="text-[10px] font-bold text-surface-600 uppercase tracking-wide mb-1.5 block">Destination Hospital</label>
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
          <div className="p-3 rounded-lg bg-surface-200/20 border border-surface-200/30 space-y-2">
            <div className="flex items-center gap-2 text-xs">
              <MapPin className="w-3.5 h-3.5 text-surface-600" />
              <span className="text-surface-600">Current Location:</span>
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

        {/* Recommended route summary */}
        {recommended && recommended.status !== 'no_route' && (
          <div className="p-3 rounded-lg bg-primary-500/5 border border-primary-500/20">
            <div className="flex items-center gap-2 mb-2">
              <RouteIcon className="w-3.5 h-3.5 text-primary-400" />
              <span className="text-xs font-bold text-primary-400 uppercase">Recommended Route</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3 h-3 text-surface-600" />
                <span className="text-surface-600">Time:</span>
                <span className="font-bold text-white">{recommended.estimatedTime} min</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Gauge className="w-3 h-3 text-surface-600" />
                <span className="text-surface-600">Dist:</span>
                <span className="font-bold text-white">{(recommended.distance / 1000).toFixed(1)} km</span>
              </div>
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="w-3 h-3 text-surface-600" />
                <span className="text-surface-600">Risk:</span>
                <span className="font-bold" style={{ color: riskColor(recommended.floodRisk) }}>
                  {riskLabel(recommended.floodRisk).toUpperCase()}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle className="w-3 h-3 text-surface-600" />
                <span className="text-surface-600">Score:</span>
                <span className="font-bold text-white">{recommended.routeScore}/100</span>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-1.5">
              {recommended.status === 'recommended' ? (
                <CheckCircle className="w-3.5 h-3.5 text-risk-low" />
              ) : (
                <XCircle className="w-3.5 h-3.5 text-risk-critical" />
              )}
              <span className={`text-xs font-bold ${recommended.status === 'recommended' ? 'text-risk-low' : 'text-risk-critical'}`}>
                {recommended.status === 'recommended' ? 'RECOMMENDED' : 'NOT RECOMMENDED'}
              </span>
            </div>
          </div>
        )}

        {/* No safe route warning */}
        {emergencyRouteSet && !emergencyRouteSet.hasSafeRoute && (
          <div className="p-3 rounded-lg bg-risk-critical/10 border border-risk-critical/30">
            <div className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-risk-critical" />
              <span className="text-sm font-bold text-risk-critical">NO SAFE ROUTE CURRENTLY AVAILABLE</span>
            </div>
            <p className="text-xs text-surface-600 mt-1">Emergency coordination required.</p>
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => calculateEmergencyRoutes()}
            className="btn-primary flex-1 flex items-center justify-center gap-2"
          >
            <Navigation className="w-4 h-4" />
            Calculate Route
          </button>
          <button
            onClick={() => calculateEmergencyRoutes()}
            className="btn-secondary flex items-center justify-center gap-2"
            disabled={!emergencyRouteSet}
          >
            Recalculate
          </button>
          <button
            onClick={() => clearEmergencyRoutes()}
            className="btn-secondary flex items-center justify-center"
            disabled={!emergencyRouteSet}
          >
            Clear
          </button>
        </div>

        <div className="flex items-center gap-1.5 text-[10px] text-surface-600">
          <span className="badge bg-risk-medium/15 text-risk-medium border border-risk-medium/30">SIMULATED EMERGENCY DATA</span>
        </div>
      </div>
    </div>
  );
}
