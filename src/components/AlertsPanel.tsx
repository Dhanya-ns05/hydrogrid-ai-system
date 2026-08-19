import { AlertTriangle, AlertCircle, AlertOctagon, Info, X } from 'lucide-react';
import { useStore } from '@/store/useStore';
import type { Alert } from '@/types';

const severityConfig = {
  critical: {
    icon: AlertOctagon,
    color: 'text-risk-critical',
    bg: 'bg-risk-critical/10',
    border: 'border-risk-critical/30',
    dot: 'bg-risk-critical',
  },
  high: {
    icon: AlertTriangle,
    color: 'text-risk-high',
    bg: 'bg-risk-high/10',
    border: 'border-risk-high/30',
    dot: 'bg-risk-high',
  },
  warning: {
    icon: AlertCircle,
    color: 'text-risk-medium',
    bg: 'bg-risk-medium/10',
    border: 'border-risk-medium/30',
    dot: 'bg-risk-medium',
  },
  info: {
    icon: Info,
    color: 'text-accent-400',
    bg: 'bg-accent-500/10',
    border: 'border-accent-500/30',
    dot: 'bg-accent-400',
  },
};

export function AlertsPanel() {
  const alerts = useStore((s) => s.alerts);
  const acknowledgeAlert = useStore((s) => s.acknowledgeAlert);

  return (
    <div className="card flex flex-col h-full max-h-[500px]">
      <div className="flex items-center justify-between px-5 py-4 border-b border-surface-200/60">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-risk-high" />
          <h3 className="text-sm font-bold text-white tracking-wide uppercase">
            Live Alerts
          </h3>
        </div>
        <span className="badge bg-surface-200/60 text-surface-800 border border-surface-300/40">
          {alerts.filter((a) => !a.acknowledged).length} Active
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-8 text-center">
            <div className="w-12 h-12 rounded-full bg-risk-low/10 flex items-center justify-center mb-3">
              <Info className="w-6 h-6 text-risk-low" />
            </div>
            <p className="text-sm text-surface-700 font-medium">No active alerts</p>
            <p className="text-xs text-surface-600 mt-1">System operating normally</p>
          </div>
        ) : (
          alerts.map((alert) => (
            <AlertItem
              key={alert.id}
              alert={alert}
              onAcknowledge={() => acknowledgeAlert(alert.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

function AlertItem({ alert, onAcknowledge }: { alert: Alert; onAcknowledge: () => void }) {
  const config = severityConfig[alert.severity];
  const Icon = config.icon;

  return (
    <div
      className={`relative ${config.bg} ${config.border} border rounded-lg p-3 pr-8 transition-all duration-300 ${
        alert.acknowledged ? 'opacity-40' : 'animate-slide-up'
      }`}
    >
      <div className="flex items-start gap-2.5">
        <Icon className={`w-4 h-4 ${config.color} shrink-0 mt-0.5`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className={`text-xs font-bold ${config.color} uppercase tracking-wide`}>
              {alert.title}
            </span>
            <span className="text-[10px] text-surface-600">
              {new Date(alert.timestamp).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
          <p className="text-xs text-surface-800 leading-snug">{alert.message}</p>
          <p className="text-[10px] text-surface-600 mt-1 font-mono">Source: {alert.source}</p>
        </div>
      </div>
      {!alert.acknowledged && (
        <button
          onClick={onAcknowledge}
          className="absolute top-2 right-2 text-surface-600 hover:text-surface-900 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
