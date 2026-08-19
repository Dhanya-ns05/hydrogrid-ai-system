import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useStore } from '@/store/useStore';
import { usePredictionEngine } from '@/hooks/usePredictionEngine';
import { BENGALURU_CENTER } from '@/data/mockData';
import { riskColor, riskLabel, trendIcon, trendLabel } from '@/utils/risk';
import type { PredictionHorizon, RiskLevel } from '@/types';

// Fix Leaflet default icon issue
delete (L.Icon.Default.prototype as unknown as { _getIconUrl: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function MapResizer() {
  const map = useMap();
  setTimeout(() => map.invalidateSize(), 100);
  return null;
}

function probabilityColor(prob: number): string {
  if (prob >= 75) return '#ef4444';
  if (prob >= 50) return '#f97316';
  if (prob >= 25) return '#eab308';
  return '#22c55e';
}

function probRiskLevel(prob: number): RiskLevel {
  if (prob >= 75) return 'critical';
  if (prob >= 50) return 'high';
  if (prob >= 25) return 'medium';
  return 'low';
}

export function PredictionMap({ horizon = 10, height = 'h-[500px]' }: { horizon?: PredictionHorizon; height?: string }) {
  const floodZones = useStore((s) => s.floodZones);
  const vaults = useStore((s) => s.vaults);
  const { predictions, isTraining } = usePredictionEngine(horizon);

  const center: [number, number] = [BENGALURU_CENTER.latitude, BENGALURU_CENTER.longitude];

  return (
    <div className={`relative ${height} rounded-xl overflow-hidden border border-surface-200/60`}>
      <MapContainer center={center} zoom={13} className="w-full h-full" zoomControl={true} attributionControl={true}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
        />
        <MapResizer />

        {/* Flood zones with AI predictions */}
        {floodZones.map((zone) => {
          const pred = predictions.find((p) => p.id === zone.id);
          const prob = pred?.floodProbability ?? 0;
          const color = probabilityColor(prob);
          return (
            <CircleMarker
              key={zone.id}
              center={[zone.latitude, zone.longitude]}
              radius={18 + (prob / 100) * 18}
              pathOptions={{ color, fillColor: color, fillOpacity: 0.35, weight: 2 }}
            >
              <Popup>
                <div className="min-w-[220px]">
                  <div className="font-bold text-white text-sm mb-2 border-b border-surface-300 pb-1.5">
                    {zone.name} - AI Prediction
                  </div>
                  <div className="space-y-1 text-xs">
                    <Row label="Flood Probability" value={`${prob}%`} color={color} />
                    <Row label="Risk Level" value={riskLabel(probRiskLevel(prob))} color={color} />
                    <Row label="Rainfall" value={`${Math.round(zone.rainfall)} mm/hr`} />
                    <Row label="Water Level" value={`${Math.round(zone.waterLevel)}%`} />
                    <Row label="Rise Rate" value={`${zone.riseRate.toFixed(1)}%/min`} />
                    <Row label="Available Capacity" value={`${Math.round(100 - zone.waterLevel)}%`} />
                    {pred && (
                      <Row
                        label={`Projected (${horizon}min)`}
                        value={`${pred.futureProbability}%`}
                        color={probabilityColor(pred.futureProbability)}
                      />
                    )}
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}

        {/* Vaults with AI predictions */}
        {vaults.map((vault) => {
          const pred = predictions.find((p) => p.id === vault.id);
          const prob = pred?.floodProbability ?? 0;
          const color = probabilityColor(prob);
          return (
            <CircleMarker
              key={vault.id}
              center={[vault.latitude, vault.longitude]}
              radius={10 + (prob / 100) * 6}
              pathOptions={{ color, fillColor: color, fillOpacity: 0.8, weight: 2 }}
            >
              <Popup>
                <div className="min-w-[220px]">
                  <div className="font-bold text-white text-sm mb-2 border-b border-surface-300 pb-1.5">
                    Vault {vault.id} - AI Prediction
                  </div>
                  <div className="space-y-1 text-xs">
                    <Row label="Flood Probability" value={`${prob}%`} color={color} />
                    <Row label="Risk Level" value={riskLabel(probRiskLevel(prob))} color={color} />
                    <Row label="Rainfall" value={`${Math.round(vault.cumulativeRainfall / 4)} mm/hr`} />
                    <Row label="Water Level" value={`${Math.round(vault.currentLevel)}%`} />
                    <Row label="Rise Rate" value={`${pred?.featureVector.water_level_rise_rate.toFixed(1) ?? '0.0'}%/min`} />
                    <Row label="Available Capacity" value={`${Math.round(vault.availableCapacity)}%`} />
                    {pred && (
                      <Row
                        label={`Projected (${horizon}min)`}
                        value={`${pred.futureProbability}%`}
                        color={probabilityColor(pred.futureProbability)}
                      />
                    )}
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-[500] card px-3 py-2.5 bg-surface-50/90 backdrop-blur-md">
        <div className="text-[10px] font-semibold text-surface-600 uppercase tracking-wide mb-2">
          AI Risk Score
        </div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
          <LegendItem color="#22c55e" label="0-25%" />
          <LegendItem color="#eab308" label="25-50%" />
          <LegendItem color="#f97316" label="50-75%" />
          <LegendItem color="#ef4444" label="75-100%" />
        </div>
      </div>

      {/* Labels */}
      <div className="absolute top-3 right-3 z-[500] flex flex-col gap-1.5">
        <div className="badge bg-primary-500/20 text-primary-400 border border-primary-500/30">
          <Brain />
          AI PREDICTION MAP
        </div>
        <div className="badge bg-risk-medium/20 text-risk-medium border border-risk-medium/30">
          <span className="w-1.5 h-1.5 rounded-full bg-risk-medium animate-pulse"></span>
          SIMULATED DATA
        </div>
      </div>

      {isTraining && (
        <div className="absolute inset-0 z-[600] bg-surface-0/80 flex items-center justify-center">
          <div className="text-center">
            <div className="w-10 h-10 mx-auto mb-3 rounded-full border-2 border-primary-500 border-t-transparent animate-spin"></div>
            <p className="text-sm text-primary-400 font-medium">Training AI Model...</p>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-surface-600">{label}:</span>
      <span className="font-semibold" style={color ? { color } : { color: '#e2e8f0' }}>
        {value}
      </span>
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }}></span>
      <span className="text-xs text-surface-800">{label}</span>
    </div>
  );
}

function Brain() {
  return (
    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" />
      <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z" />
    </svg>
  );
}
