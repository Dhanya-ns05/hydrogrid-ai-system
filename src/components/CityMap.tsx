import { MapContainer, TileLayer, CircleMarker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useMemo } from 'react';
import { useStore } from '@/store/useStore';
import { BENGALURU_CENTER } from '@/data/mockData';
import { riskColor, riskLabel, vaultStatusLabel } from '@/utils/risk';
import type { RiskLevel } from '@/types';

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

interface CityMapProps {
  height?: string;
  showZones?: boolean;
  showVaults?: boolean;
  showRoads?: boolean;
  showHospitals?: boolean;
  showAmbulances?: boolean;
  showEmergencyRoute?: boolean;
}

export function CityMap({
  height = 'h-[500px]',
  showZones = true,
  showVaults = true,
  showRoads = true,
  showHospitals = true,
  showAmbulances = true,
  showEmergencyRoute = false,
}: CityMapProps) {
  const floodZones = useStore((s) => s.floodZones);
  const vaults = useStore((s) => s.vaults);
  const roadSegments = useStore((s) => s.roadSegments);
  const hospitals = useStore((s) => s.hospitals);
  const ambulances = useStore((s) => s.ambulances);
  const activeDiversion = useStore((s) => s.activeDiversion);
  const emergencyRouteSet = useStore((s) => s.emergencyRouteSet);

  const diversionLine = activeDiversion
    ? (() => {
        const src = vaults.find((v) => v.id === activeDiversion.sourceVaultId);
        const dst = vaults.find((v) => v.id === activeDiversion.destinationVaultId);
        if (!src || !dst) return null;
        return {
          from: [src.latitude, src.longitude] as [number, number],
          to: [dst.latitude, dst.longitude] as [number, number],
        };
      })()
    : null;

  const center: [number, number] = [BENGALURU_CENTER.latitude, BENGALURU_CENTER.longitude];

  const roadColor = (risk: RiskLevel) => {
    switch (risk) {
      case 'critical':
        return '#ef4444';
      case 'high':
        return '#f97316';
      case 'medium':
        return '#eab308';
      default:
        return '#22c55e';
    }
  };

  const hospitalIcon = useMemo(
    () =>
      L.divIcon({
        className: '',
        html: `<div class="hydro-marker" style="width:28px;height:28px;background:#3b82f6;font-size:14px;color:white;">\u2717</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      }),
    []
  );

  const ambulanceIcon = useMemo(
    () =>
      L.divIcon({
        className: '',
        html: `<div class="hydro-marker" style="width:28px;height:28px;background:#ffffff;font-size:14px;color:#0a0e14;">\u26A0</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      }),
    []
  );

  return (
    <div className={`relative ${height} rounded-xl overflow-hidden border border-surface-200/60`}>
      <MapContainer
        center={center}
        zoom={13}
        className="w-full h-full"
        zoomControl={true}
        attributionControl={true}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
        />
        <MapResizer />

        {/* Flood Zones */}
        {showZones &&
          floodZones.map((zone) => {
            const color = riskColor(zone.riskLevel);
            return (
              <CircleMarker
                key={zone.id}
                center={[zone.latitude, zone.longitude]}
                radius={20 + (zone.waterLevel / 100) * 15}
                pathOptions={{
                  color,
                  fillColor: color,
                  fillOpacity: 0.3,
                  weight: 2,
                }}
              >
                <Popup>
                  <div className="min-w-[200px]">
                    <div className="font-bold text-white text-sm mb-2 border-b border-surface-300 pb-1.5">
                      {zone.name}
                    </div>
                    <div className="space-y-1 text-xs">
                      <Row label="Location" value={zone.name} />
                      <Row label="Flood Risk" value={riskLabel(zone.riskLevel)} color={color} />
                      <Row label="Water Level" value={`${Math.round(zone.waterLevel)}%`} />
                      <Row label="Rainfall" value={`${Math.round(zone.rainfall)} mm/hr`} />
                      <Row label="Risk Status" value={riskLabel(zone.riskLevel)} color={color} />
                      <Row
                        label="Trend"
                        value={`${zone.trend === 'up' ? '\u2191' : zone.trend === 'down' ? '\u2193' : '\u2192'} ${zone.trend}`}
                      />
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}

        {/* Vaults */}
        {showVaults &&
          vaults.map((vault) => {
            const color = riskColor(vault.riskLevel);
            return (
              <CircleMarker
                key={vault.id}
                center={[vault.latitude, vault.longitude]}
                radius={12}
                pathOptions={{
                  color,
                  fillColor: color,
                  fillOpacity: 0.8,
                  weight: 2,
                }}
              >
                <Popup>
                  <div className="min-w-[200px]">
                    <div className="font-bold text-white text-sm mb-2 border-b border-surface-300 pb-1.5">
                      Vault {vault.id}
                    </div>
                    <div className="space-y-1 text-xs">
                      <Row label="Vault ID" value={vault.id} />
                      <Row label="Water Level" value={`${Math.round(vault.currentLevel)}%`} />
                      <Row label="Capacity" value={`${vault.capacity.toLocaleString()} L`} />
                      <Row
                        label="Available"
                        value={`${Math.round(vault.availableCapacity)}%`}
                      />
                      <Row label="Risk" value={riskLabel(vault.riskLevel)} color={color} />
                      <Row label="Status" value={vaultStatusLabel(vault.status)} color={color} />
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}

        {/* Roads */}
        {showRoads &&
          roadSegments.map((road) => (
            <Polyline
              key={road.id}
              positions={[
                [road.start.latitude, road.start.longitude],
                [road.end.latitude, road.end.longitude],
              ]}
              pathOptions={{
                color: roadColor(road.floodRisk),
                weight: road.accessible ? 4 : 2,
                opacity: road.accessible ? 0.7 : 0.4,
                dashArray: road.accessible ? undefined : '8,8',
              }}
            >
              <Popup>
                <div className="min-w-[160px]">
                  <div className="font-bold text-white text-sm mb-1">{road.name}</div>
                  <div className="space-y-1 text-xs">
                    <Row label="Length" value={`${road.length} m`} />
                    <Row label="Flood Risk" value={riskLabel(road.floodRisk)} color={roadColor(road.floodRisk)} />
                    <Row label="Traffic" value={`${Math.round(road.trafficLevel)}%`} />
                    <Row label="Accessible" value={road.accessible ? 'Yes' : 'No'} />
                  </div>
                </div>
              </Popup>
            </Polyline>
          ))}

        {/* Hospitals */}
        {showHospitals &&
          hospitals.map((hospital) => (
            <CircleMarker
              key={hospital.id}
              center={[hospital.latitude, hospital.longitude]}
              radius={10}
              pathOptions={{
                color: '#3b82f6',
                fillColor: '#3b82f6',
                fillOpacity: 0.9,
                weight: 3,
              }}
            >
              <Popup>
                <div className="font-bold text-white text-sm">{hospital.name}</div>
                <div className="text-xs text-surface-700 mt-1">Hospital</div>
              </Popup>
            </CircleMarker>
          ))}

        {/* Ambulances */}
        {showAmbulances &&
          ambulances.map((amb) => (
            <CircleMarker
              key={amb.id}
              center={[amb.latitude, amb.longitude]}
              radius={8}
              pathOptions={{
                color: '#ffffff',
                fillColor: '#ef4444',
                fillOpacity: 0.9,
                weight: 3,
              }}
            >
              <Popup>
                <div className="min-w-[160px]">
                  <div className="font-bold text-white text-sm mb-1">{amb.id}</div>
                  <div className="space-y-1 text-xs">
                    <Row label="Location" value={amb.currentZone} />
                    <Row label="Destination" value={amb.destinationHospital} />
                    <Row
                      label="Route"
                      value={amb.routeStatus === 'at_risk' ? 'AT RISK' : amb.routeStatus === 'blocked' ? 'BLOCKED' : 'CLEAR'}
                      color={amb.routeStatus === 'at_risk' ? '#f97316' : amb.routeStatus === 'blocked' ? '#ef4444' : '#22c55e'}
                    />
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          ))}

        {/* Active Diversion Route */}
        {diversionLine && (
          <Polyline
            positions={[diversionLine.from, diversionLine.to]}
            pathOptions={{
              color: '#06b6d4',
              weight: 5,
              opacity: 0.85,
              dashArray: '10,6',
            }}
          />
        )}

        {/* Emergency Recommended Route */}
        {showEmergencyRoute && emergencyRouteSet?.recommended && emergencyRouteSet.recommended.coordinates.length > 1 && (
          <Polyline
            positions={emergencyRouteSet.recommended.coordinates.map((c) => [c.latitude, c.longitude] as [number, number])}
            pathOptions={{
              color: '#06b6d4',
              weight: 6,
              opacity: 0.9,
            }}
          />
        )}

        {/* Emergency Safest Route (alternative, thinner) */}
        {showEmergencyRoute && emergencyRouteSet?.safest && emergencyRouteSet.safest.coordinates.length > 1 &&
          emergencyRouteSet.safest !== emergencyRouteSet.recommended && (
          <Polyline
            positions={emergencyRouteSet.safest.coordinates.map((c) => [c.latitude, c.longitude] as [number, number])}
            pathOptions={{
              color: '#3b82f6',
              weight: 4,
              opacity: 0.5,
              dashArray: '8,6',
            }}
          />
        )}

        {/* Emergency Fastest Route (alternative, thinner) */}
        {showEmergencyRoute && emergencyRouteSet?.fastest && emergencyRouteSet.fastest.coordinates.length > 1 &&
          emergencyRouteSet.fastest !== emergencyRouteSet.recommended && (
          <Polyline
            positions={emergencyRouteSet.fastest.coordinates.map((c) => [c.latitude, c.longitude] as [number, number])}
            pathOptions={{
              color: '#f97316',
              weight: 3,
              opacity: 0.4,
              dashArray: '6,4',
            }}
          />
        )}
      </MapContainer>

      {/* Map Legend Overlay */}
      <div className="absolute bottom-4 left-4 z-[500] card px-3 py-2.5 bg-surface-50/90 backdrop-blur-md">
        <div className="text-[10px] font-semibold text-surface-600 uppercase tracking-wide mb-2">
          Risk Legend
        </div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
          <LegendItem color={riskColor('low')} label="Low" />
          <LegendItem color={riskColor('medium')} label="Medium" />
          <LegendItem color={riskColor('high')} label="High" />
          <LegendItem color={riskColor('critical')} label="Critical" />
          {showEmergencyRoute && (
            <>
              <LegendItem color="#06b6d4" label="Safe Route" />
              <LegendItem color="#f97316" label="Fastest" />
            </>
          )}
        </div>
      </div>

      {/* Simulated Data Label */}
      <div className="absolute top-3 right-3 z-[500] badge bg-risk-medium/20 text-risk-medium border border-risk-medium/30">
        <span className="w-1.5 h-1.5 rounded-full bg-risk-medium animate-pulse"></span>
        SIMULATED DATA
      </div>
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
      <span
        className="w-2.5 h-2.5 rounded-full"
        style={{ backgroundColor: color }}
      ></span>
      <span className="text-xs text-surface-800">{label}</span>
    </div>
  );
}
