import { MapContainer, TileLayer, CircleMarker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useStore } from '@/store/useStore';
import { BENGALURU_CENTER } from '@/data/mockData';
import { riskColor, riskLabel } from '@/utils/risk';
import { Droplets } from 'lucide-react';
import { useEffect } from 'react';

delete (L.Icon.Default.prototype as unknown as { _getIconUrl: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function MapResizer() {
  const map = useMap();
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 100);
    return () => clearTimeout(t);
  }, [map]);
  return null;
}

export function RoutingMap({ sourceVaultId }: { sourceVaultId: string | null }) {
  const vaults = useStore((s) => s.vaults);
  const activeDiversion = useStore((s) => s.activeDiversion);

  const center: [number, number] = [BENGALURU_CENTER.latitude, BENGALURU_CENTER.longitude];

  // Find diversion route line if active
  const diversionRoute = activeDiversion
    ? (() => {
        const src = vaults.find((v) => v.id === activeDiversion.sourceVaultId);
        const dst = vaults.find((v) => v.id === activeDiversion.destinationVaultId);
        if (!src || !dst) return null;
        return {
          from: [src.latitude, src.longitude] as [number, number],
          to: [dst.latitude, dst.longitude] as [number, number],
          progress: activeDiversion.progress,
        };
      })()
    : null;

  // Also show planned route for selected source
  const plannedRoute = !activeDiversion && sourceVaultId
    ? (() => {
        const src = vaults.find((v) => v.id === sourceVaultId);
        if (!src || (src.riskLevel !== 'critical' && src.riskLevel !== 'high')) return null;
        // Find safest connected vault
        const connected = vaults
          .filter((v) => src.connectedVaults.includes(v.id) && v.riskLevel !== 'critical' && v.availableCapacity >= 15)
          .sort((a, b) => b.availableCapacity - a.availableCapacity);
        if (connected.length === 0) return null;
        const dst = connected[0];
        return {
          from: [src.latitude, src.longitude] as [number, number],
          to: [dst.latitude, dst.longitude] as [number, number],
        };
      })()
    : null;

  return (
    <div className="relative h-[420px] rounded-xl overflow-hidden border border-surface-200/60">
      <MapContainer center={center} zoom={13} className="w-full h-full" zoomControl={true}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
        />
        <MapResizer />

        {/* Vault markers */}
        {vaults.map((vault) => {
          const color = riskColor(vault.riskLevel);
          const isDiversionSource = activeDiversion?.sourceVaultId === vault.id;
          const isDiversionDest = activeDiversion?.destinationVaultId === vault.id;
          const isSelected = sourceVaultId === vault.id;
          const radius = isDiversionSource || isDiversionDest ? 16 : 12;

          return (
            <CircleMarker
              key={vault.id}
              center={[vault.latitude, vault.longitude]}
              radius={radius}
              pathOptions={{
                color,
                fillColor: color,
                fillOpacity: isDiversionSource || isDiversionDest ? 0.9 : 0.7,
                weight: isSelected || isDiversionSource || isDiversionDest ? 3 : 2,
              }}
            >
              <Popup>
                <div className="min-w-[180px]">
                  <div className="font-bold text-white text-sm mb-2 border-b border-surface-300 pb-1.5">
                    Vault {vault.id}
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between"><span className="text-surface-600">Water Level:</span><span className="font-semibold text-white">{Math.round(vault.currentLevel)}%</span></div>
                    <div className="flex justify-between"><span className="text-surface-600">Available:</span><span className="font-semibold text-white">{Math.round(vault.availableCapacity)}%</span></div>
                    <div className="flex justify-between"><span className="text-surface-600">Risk:</span><span className="font-semibold" style={{ color }}>{riskLabel(vault.riskLevel)}</span></div>
                    <div className="flex justify-between"><span className="text-surface-600">Capacity:</span><span className="font-semibold text-white">{vault.capacity.toLocaleString()}L</span></div>
                    <div className="flex justify-between"><span className="text-surface-600">Connected:</span><span className="font-semibold text-white">{vault.connectedVaults.join(', ')}</span></div>
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}

        {/* Active diversion route */}
        {diversionRoute && (
          <Polyline
            positions={[diversionRoute.from, diversionRoute.to]}
            pathOptions={{
              color: '#06b6d4',
              weight: 4,
              opacity: 0.8,
              dashArray: '10,6',
            }}
          />
        )}

        {/* Planned route (dashed preview) */}
        {plannedRoute && (
          <Polyline
            positions={[plannedRoute.from, plannedRoute.to]}
            pathOptions={{
              color: '#06b6d4',
              weight: 3,
              opacity: 0.5,
              dashArray: '8,8',
            }}
          />
        )}

        {/* Network connections (subtle) */}
        {vaults.map((v) =>
          v.connectedVaults.map((connId) => {
            const dest = vaults.find((x) => x.id === connId);
            if (!dest) return null;
            // Only draw each connection once
            if (v.id > dest.id) return null;
            return (
              <Polyline
                key={`${v.id}-${connId}`}
                positions={[
                  [v.latitude, v.longitude],
                  [dest.latitude, dest.longitude],
                ]}
                pathOptions={{
                  color: '#334155',
                  weight: 1,
                  opacity: 0.3,
                }}
              />
            );
          })
        )}
      </MapContainer>

      {/* Diversion overlay label */}
      {diversionRoute && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[500] flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-500/20 border border-primary-500/40 backdrop-blur-md">
          <Droplets className="w-3.5 h-3.5 text-primary-400 animate-pulse" />
          <span className="text-xs font-bold text-primary-400">SIMULATED WATER TRANSFER</span>
          <span className="text-xs text-surface-600">{Math.round(diversionRoute.progress)}%</span>
        </div>
      )}

      {/* Simulated data label */}
      <div className="absolute top-3 right-3 z-[500] badge bg-risk-medium/20 text-risk-medium border border-risk-medium/30">
        <span className="w-1.5 h-1.5 rounded-full bg-risk-medium animate-pulse"></span>
        SIMULATED DATA
      </div>
    </div>
  );
}
