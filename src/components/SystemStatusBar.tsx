import { CloudRain, Brain, Database, GitBranch, Ambulance, Activity, Settings } from 'lucide-react';
import { useStore } from '@/store/useStore';
import type { SystemModuleStatus } from '@/types';

interface ModuleEntry {
  key: 'weather' | 'aiPrediction' | 'vaultNetwork' | 'waterRouting' | 'emergencyRouting';
  label: string;
  icon: typeof CloudRain;
}

const MODULE_CONFIG: ModuleEntry[] = [
  { key: 'weather', label: 'WEATHER', icon: CloudRain },
  { key: 'aiPrediction', label: 'AI PREDICTION', icon: Brain },
  { key: 'vaultNetwork', label: 'VAULT NETWORK', icon: Database },
  { key: 'waterRouting', label: 'WATER ROUTING', icon: GitBranch },
  { key: 'emergencyRouting', label: 'EMERGENCY ROUTING', icon: Ambulance },
];

function statusColor(status: SystemModuleStatus): string {
  switch (status) {
    case 'active': return 'text-risk-low';
    case 'warning': return 'text-risk-medium';
    case 'error': return 'text-risk-critical';
    default: return 'text-surface-600';
  }
}

function statusBg(status: SystemModuleStatus): string {
  switch (status) {
    case 'active': return 'bg-risk-low/15 border-risk-low/30';
    case 'warning': return 'bg-risk-medium/15 border-risk-medium/30';
    case 'error': return 'bg-risk-critical/15 border-risk-critical/30';
    default: return 'bg-surface-200/30 border-surface-200/40';
  }
}

function statusLabel(status: SystemModuleStatus): string {
  switch (status) {
    case 'active': return 'ACTIVE';
    case 'warning': return 'WARNING';
    case 'error': return 'CRITICAL';
    default: return 'OFFLINE';
  }
}

function statusDot(status: SystemModuleStatus): string {
  switch (status) {
    case 'active': return 'bg-risk-low';
    case 'warning': return 'bg-risk-medium';
    case 'error': return 'bg-risk-critical';
    default: return 'bg-surface-500';
  }
}

export function SystemStatusBar() {
  const systemStatus = useStore((s) => s.systemStatus);
  const simState = useStore((s) => s.simulation.state);

  return (
    <div className="card p-3">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 mr-2">
          <Activity className={`w-3.5 h-3.5 ${simState === 'running' ? 'text-primary-400 animate-pulse' : 'text-surface-600'}`} />
          <span className="text-[10px] font-bold text-surface-600 uppercase tracking-wide">System Status</span>
        </div>
        {MODULE_CONFIG.map(({ key, label, icon: Icon }) => {
          const status = systemStatus[key];
          return (
            <div
              key={key}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border ${statusBg(status)}`}
            >
              <span className="relative flex h-2 w-2">
                {status === 'active' && (
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${statusDot(status)}`}></span>
                )}
                <span className={`relative inline-flex rounded-full h-2 w-2 ${statusDot(status)}`}></span>
              </span>
              <Icon className={`w-3 h-3 ${statusColor(status)}`} />
              <span className={`text-[10px] font-bold ${statusColor(status)}`}>{label}</span>
              <span className={`text-[9px] font-semibold ${statusColor(status)}`}>{statusLabel(status)}</span>
            </div>
          );
        })}
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border bg-surface-200/30 border-surface-200/40 ml-auto">
          <Settings className="w-3 h-3 text-surface-600" />
          <span className="text-[10px] font-bold text-surface-600">SIMULATION</span>
          <span className={`text-[9px] font-semibold ${statusColor(systemStatus.simulation)}`}>{statusLabel(systemStatus.simulation)}</span>
        </div>
      </div>
    </div>
  );
}
