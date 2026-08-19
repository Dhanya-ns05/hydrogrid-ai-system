import { useStore } from '@/store/useStore';
import { VAULT_NETWORK_CONNECTIONS } from '@/data/mockData';
import { riskColor, riskLabel, vaultStatusLabel, vaultStatusColor } from '@/utils/risk';
import { Database, ArrowRight, GitBranch } from 'lucide-react';
import { useState } from 'react';
import type { Vault } from '@/types';
import { ScenarioButtons } from '@/components/ScenarioButtons';
import { RoutingDecisionPanel } from '@/components/RoutingDecisionPanel';
import { DestinationComparisonTable } from '@/components/DestinationComparisonTable';
import { RoutingMap } from '@/components/RoutingMap';
import { RoutingAnalytics } from '@/components/RoutingAnalytics';
import { BaselineRoutingComparison } from '@/components/BaselineRoutingComparison';

export function HydroGridNetworkView() {
  const vaults = useStore((s) => s.vaults);
  const [selectedVault, setSelectedVault] = useState<string | null>(null);

  const selected = vaults.find((v) => v.id === selectedVault);

  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">HydroGrid Vault Network</h2>
        <p className="text-sm text-surface-600 mt-1">
          Virtual stormwater vault monitoring - 5 nodes - Simulated data
        </p>
      </div>

      {/* Vault Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {vaults.map((vault) => (
          <VaultCard key={vault.id} vault={vault} onClick={() => setSelectedVault(vault.id)} />
        ))}
      </div>

      {/* Network Visualization + Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 card p-6">
          <h3 className="text-sm font-bold text-white tracking-wide uppercase mb-4">
            Network Topology
          </h3>
          <NetworkGraph
            vaults={vaults}
            selectedId={selectedVault}
            onSelect={setSelectedVault}
          />
        </div>

        <div className="lg:col-span-1 card p-5">
          {selected ? (
            <VaultDetail vault={selected} allVaults={vaults} />
          ) : (
            <div className="flex flex-col items-center justify-center h-full py-12 text-center">
              <Database className="w-10 h-10 text-surface-500 mb-3" />
              <p className="text-sm text-surface-700 font-medium">Select a vault node</p>
              <p className="text-xs text-surface-600 mt-1">
                Click any node in the network or card above
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Smart Water Routing Section */}
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-2">
          <GitBranch className="w-5 h-5 text-primary-400" />
          <h3 className="text-lg font-bold text-white tracking-tight">Smart Water Routing</h3>
          <span className="text-xs text-surface-600 ml-2">Capacity-aware stormwater diversion</span>
        </div>
        <ScenarioButtons />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold text-white tracking-tight">Routing Map</h4>
              <span className="text-xs text-surface-600">Bengaluru, Karnataka - Simulated</span>
            </div>
            <RoutingMap sourceVaultId={vaults.slice().sort((a, b) => b.currentLevel - a.currentLevel)[0]?.id || ''} />
          </div>
          <div className="lg:col-span-1">
            <RoutingDecisionPanel sourceVaultId={vaults.slice().sort((a, b) => b.currentLevel - a.currentLevel)[0]?.id || ''} />
          </div>
        </div>
        <DestinationComparisonTable sourceVaultId={vaults.slice().sort((a, b) => b.currentLevel - a.currentLevel)[0]?.id || ''} />
        <BaselineRoutingComparison sourceVaultId={vaults.slice().sort((a, b) => b.currentLevel - a.currentLevel)[0]?.id || ''} />
        <RoutingAnalytics />
      </div>
    </div>
  );
}

function VaultCard({ vault, onClick }: { vault: Vault; onClick: () => void }) {
  const color = riskColor(vault.riskLevel);
  const statusColor = vaultStatusColor(vault.status);

  return (
    <div
      onClick={onClick}
      className="card p-4 cursor-pointer hover:border-primary-500/40 transition-all duration-300"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${color}20`, border: `1px solid ${color}40` }}
          >
            <Database className="w-4 h-4" style={{ color }} />
          </div>
          <h4 className="text-sm font-bold text-white">{vault.id}</h4>
        </div>
        <span
          className="badge border text-[10px]"
          style={{
            backgroundColor: `${statusColor}15`,
            color: statusColor,
            borderColor: `${statusColor}30`,
          }}
        >
          {vaultStatusLabel(vault.status)}
        </span>
      </div>

      <div className="space-y-2.5">
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-surface-600 uppercase tracking-wide">Water Level</span>
            <span className="text-xs font-bold" style={{ color }}>
              {Math.round(vault.currentLevel)}%
            </span>
          </div>
          <div className="h-2 bg-surface-300/40 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${vault.currentLevel}%`, backgroundColor: color }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="bg-surface-200/40 rounded-lg px-2.5 py-1.5">
            <p className="text-[10px] text-surface-600 uppercase">Capacity Left</p>
            <p className="text-xs font-bold text-white mt-0.5">
              {Math.round(vault.availableCapacity)}%
            </p>
          </div>
          <div className="bg-surface-200/40 rounded-lg px-2.5 py-1.5">
            <p className="text-[10px] text-surface-600 uppercase">Risk</p>
            <p className="text-xs font-bold mt-0.5" style={{ color }}>
              {riskLabel(vault.riskLevel)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 pt-1">
          <span className="text-[10px] text-surface-600 uppercase">Connected:</span>
          <div className="flex flex-wrap gap-1">
            {vault.connectedVaults.map((id) => (
              <span
                key={id}
                className="text-[10px] font-mono text-primary-400 bg-primary-500/10 px-1.5 py-0.5 rounded"
              >
                {id}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function NetworkGraph({
  vaults,
  selectedId,
  onSelect,
}: {
  vaults: Vault[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  // Layout: HG-01 top-left, HG-02 top-right, HG-03 bottom-left, HG-04 bottom-right, HG-05 far-bottom-right
  const positions: Record<string, { x: number; y: number }> = {
    'HG-01': { x: 20, y: 15 },
    'HG-02': { x: 70, y: 15 },
    'HG-03': { x: 20, y: 60 },
    'HG-04': { x: 70, y: 60 },
    'HG-05': { x: 70, y: 90 },
  };

  return (
    <div className="relative w-full" style={{ height: '420px' }}>
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        {VAULT_NETWORK_CONNECTIONS.map((conn, i) => {
          const from = positions[conn.from];
          const to = positions[conn.to];
          if (!from || !to) return null;
          const fromVault = vaults.find((v) => v.id === conn.from);
          const isCritical = fromVault && fromVault.currentLevel > 75;
          return (
            <line
              key={i}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke={isCritical ? '#f97316' : '#2f3a52'}
              strokeWidth={isCritical ? '0.6' : '0.4'}
              strokeDasharray={isCritical ? '1.5,1' : undefined}
              opacity={isCritical ? 0.8 : 0.5}
            >
              {isCritical && (
                <animate
                  attributeName="stroke-dashoffset"
                  from="0"
                  to="5"
                  dur="1s"
                  repeatCount="indefinite"
                />
              )}
            </line>
          );
        })}
      </svg>

      {vaults.map((vault) => {
        const pos = positions[vault.id];
        if (!pos) return null;
        const color = riskColor(vault.riskLevel);
        const isSelected = selectedId === vault.id;

        return (
          <button
            key={vault.id}
            onClick={() => onSelect(vault.id)}
            className="absolute -translate-x-1/2 -translate-y-1/2 group"
            style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
          >
            <div
              className={`relative flex flex-col items-center gap-1 transition-all duration-300 ${
                isSelected ? 'scale-110' : 'hover:scale-105'
              }`}
            >
              <div
                className="w-16 h-16 rounded-2xl flex flex-col items-center justify-center border-2 transition-all"
                style={{
                  backgroundColor: `${color}20`,
                  borderColor: isSelected ? color : `${color}50`,
                  boxShadow: isSelected ? `0 0 20px ${color}40` : 'none',
                }}
              >
                <Database className="w-4 h-4 mb-0.5" style={{ color }} />
                <span className="text-[10px] font-bold text-white font-mono">{vault.id}</span>
              </div>
              <span
                className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                style={{ backgroundColor: `${color}20`, color }}
              >
                {Math.round(vault.currentLevel)}%
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function VaultDetail({ vault, allVaults }: { vault: Vault; allVaults: Vault[] }) {
  const color = riskColor(vault.riskLevel);
  const connectedVaults = allVaults.filter((v) => vault.connectedVaults.includes(v.id));

  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${color}20`, border: `1px solid ${color}40` }}
        >
          <Database className="w-5 h-5" style={{ color }} />
        </div>
        <div>
          <h3 className="text-base font-bold text-white">{vault.id}</h3>
          <span className="text-xs" style={{ color }}>
            {riskLabel(vault.riskLevel)} - {vaultStatusLabel(vault.status)}
          </span>
        </div>
      </div>

      <div className="h-2 bg-surface-300/40 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${vault.currentLevel}%`, backgroundColor: color }}
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Stat label="Water Level" value={`${Math.round(vault.currentLevel)}%`} />
        <Stat label="Available" value={`${Math.round(vault.availableCapacity)}%`} />
        <Stat label="Total Capacity" value={`${vault.capacity.toLocaleString()} L`} />
        <Stat label="Risk Score" value={`${Math.round(vault.currentLevel)}/100`} />
      </div>

      <div>
        <p className="text-xs text-surface-600 uppercase tracking-wide font-medium mb-2">
          Connected Vaults
        </p>
        <div className="space-y-2">
          {connectedVaults.map((v) => (
            <div
              key={v.id}
              className="flex items-center justify-between bg-surface-200/40 rounded-lg px-3 py-2"
            >
              <div className="flex items-center gap-2">
                <ArrowRight className="w-3.5 h-3.5 text-surface-600" />
                <span className="text-sm font-mono font-bold text-white">{v.id}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-16 h-1.5 bg-surface-300/40 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${v.currentLevel}%`, backgroundColor: riskColor(v.riskLevel) }}
                  />
                </div>
                <span className="text-xs font-bold text-surface-800">
                  {Math.round(v.availableCapacity)}% avail
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface-200/40 rounded-lg px-3 py-2">
      <p className="text-[10px] text-surface-600 uppercase tracking-wide">{label}</p>
      <p className="text-sm font-bold text-white mt-0.5">{value}</p>
    </div>
  );
}
