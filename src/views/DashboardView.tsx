import { KPICards } from '@/components/KPICards';
import { CityMap } from '@/components/CityMap';
import { FloodRiskPanel } from '@/components/FloodRiskPanel';
import { AlertsPanel } from '@/components/AlertsPanel';
import { SimulationControl } from '@/components/SimulationControl';
import { SystemStatusBar } from '@/components/SystemStatusBar';
import { DemoControlPanel } from '@/components/DemoControlPanel';
import { HowHydroGridThinks } from '@/components/HowHydroGridThinks';
import { LiveEventLog } from '@/components/LiveEventLog';
import { FloodEventSummaryCard } from '@/components/FloodEventSummaryCard';
import { ArrowDown, GitBranch, Droplets, CheckCircle, AlertTriangle } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { riskColor, riskLabel } from '@/utils/risk';

interface DashboardViewProps {
  presentationMode?: boolean;
}

export function DashboardView({ presentationMode = false }: DashboardViewProps) {
  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      <KPICards />

      {/* System Status Bar */}
      <SystemStatusBar />

      {/* Flow indicator */}
      <div className="hidden xl:flex items-center justify-center gap-2 text-xs text-surface-600 font-medium">
        <span className="badge bg-primary-500/10 text-primary-400 border border-primary-500/20">RAIN</span>
        <ArrowDown className="w-3 h-3" />
        <span className="badge bg-risk-high/10 text-risk-high border border-risk-high/20">FLOOD RISK</span>
        <ArrowDown className="w-3 h-3" />
        <span className="badge bg-accent-500/10 text-accent-400 border border-accent-500/20">HYDROGRID VAULTS</span>
        <ArrowDown className="w-3 h-3" />
        <span className="badge bg-primary-500/10 text-primary-400 border border-primary-500/20">WATER ROUTING</span>
        <ArrowDown className="w-3 h-3" />
        <span className="badge bg-risk-critical/10 text-risk-critical border border-risk-critical/20">EMERGENCY ROUTING</span>
      </div>

      {/* Main Grid: Map + Right Panel */}
      <div className={`grid grid-cols-1 gap-5 ${presentationMode ? 'lg:grid-cols-4' : 'lg:grid-cols-3'}`}>
        <div className={presentationMode ? 'lg:col-span-3' : 'lg:col-span-2'}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-white tracking-tight">City Command Map</h2>
            <span className="text-xs text-surface-600">Bengaluru, Karnataka - Simulated</span>
          </div>
          <CityMap height={presentationMode ? 'h-[600px]' : 'h-[520px]'} />
        </div>
        <div className={presentationMode ? 'lg:col-span-1' : 'lg:col-span-1'}>
          {!presentationMode && <FloodRiskPanel />}
          {presentationMode && <DemoControlPanel />}
        </div>
      </div>

      {/* Demo Control + Decision Chain */}
      {!presentationMode && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <DemoControlPanel />
          <HowHydroGridThinks />
        </div>
      )}

      {/* Flood Event Summary (only shows when demo is complete) */}
      <FloodEventSummaryCard />

      {/* Routing Summary */}
      <RoutingSummaryCard />

      {/* Bottom Grid: Alerts + Simulation + Event Log */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-1">
          <AlertsPanel />
        </div>
        <div className="lg:col-span-1">
          <LiveEventLog />
        </div>
        <div className="lg:col-span-1">
          <SimulationControl />
        </div>
      </div>
    </div>
  );
}

function RoutingSummaryCard() {
  const vaults = useStore((s) => s.vaults);
  const activeDiversion = useStore((s) => s.activeDiversion);
  const routingAnalytics = useStore((s) => s.routingAnalytics);
  const waterDiverted = useStore((s) => s.waterDiverted);

  const criticalVaults = vaults.filter(
    (v) => v.riskLevel === 'critical' || v.riskLevel === 'high'
  );

  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-4">
        <GitBranch className="w-4 h-4 text-primary-400" />
        <h3 className="text-sm font-bold text-white tracking-wide uppercase">
          Stormwater Routing Summary
        </h3>
        {activeDiversion && (
          <span className="ml-auto badge bg-primary-500/15 text-primary-400 border border-primary-500/30 animate-pulse">
            <Droplets className="w-3 h-3 mr-1" />
            DIVERSION ACTIVE
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3 rounded-lg bg-surface-200/20 border border-surface-200/30">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-3.5 h-3.5 text-risk-high" />
            <span className="text-[10px] text-surface-600 uppercase tracking-wide">Critical Vaults</span>
          </div>
          <p className="text-lg font-bold text-white">{criticalVaults.length}</p>
          <div className="flex flex-wrap gap-1 mt-1">
            {criticalVaults.map((v) => (
              <span
                key={v.id}
                className="badge text-[8px] border"
                style={{
                  backgroundColor: `${riskColor(v.riskLevel)}15`,
                  color: riskColor(v.riskLevel),
                  borderColor: `${riskColor(v.riskLevel)}30`,
                }}
              >
                {v.id}
              </span>
            ))}
          </div>
        </div>

        <div className="p-3 rounded-lg bg-surface-200/20 border border-surface-200/30">
          <div className="flex items-center gap-2 mb-1">
            <Droplets className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[10px] text-surface-600 uppercase tracking-wide">Water Diverted</span>
          </div>
          <p className="text-lg font-bold text-white">{waterDiverted.toLocaleString()}L</p>
          <p className="text-[10px] text-surface-600 mt-1">Total simulated</p>
        </div>

        <div className="p-3 rounded-lg bg-surface-200/20 border border-surface-200/30">
          <div className="flex items-center gap-2 mb-1">
            <GitBranch className="w-3.5 h-3.5 text-primary-400" />
            <span className="text-[10px] text-surface-600 uppercase tracking-wide">Diversion Events</span>
          </div>
          <p className="text-lg font-bold text-white">{routingAnalytics.totalDiversions}</p>
          <p className="text-[10px] text-surface-600 mt-1">Simulated transfers</p>
        </div>

        <div className="p-3 rounded-lg bg-surface-200/20 border border-surface-200/30">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="w-3.5 h-3.5 text-risk-low" />
            <span className="text-[10px] text-surface-600 uppercase tracking-wide">Avg Score</span>
          </div>
          <p className="text-lg font-bold text-white">
            {routingAnalytics.totalDiversions > 0 ? Math.round(routingAnalytics.averageRoutingScore) : '—'}
          </p>
          <p className="text-[10px] text-surface-600 mt-1">Routing quality</p>
        </div>
      </div>

      {activeDiversion && (
        <div className="mt-3 p-3 rounded-lg bg-primary-500/5 border border-primary-500/20">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-mono font-bold text-white">{activeDiversion.sourceVaultId}</span>
            <ArrowDown className="w-3 h-3 text-primary-400 animate-pulse" />
            <span className="font-mono font-bold text-primary-400">{activeDiversion.destinationVaultId}</span>
            <span className="ml-auto text-surface-600">
              {Math.round(activeDiversion.sourceStartLevel)}% → {Math.round(activeDiversion.sourceTargetLevel)}% | {Math.round(activeDiversion.progress)}% complete
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
