import { ScrollText, Clock } from 'lucide-react';
import { useStore } from '@/store/useStore';
import type { EventLogSeverity, EventLogCategory } from '@/types';

const severityColor: Record<EventLogSeverity, string> = {
  info: 'text-surface-600',
  warning: 'text-risk-medium',
  high: 'text-risk-high',
  critical: 'text-risk-critical',
  emergency: 'text-risk-critical',
};

const severityBg: Record<EventLogSeverity, string> = {
  info: 'bg-surface-200/20',
  warning: 'bg-risk-medium/10',
  high: 'bg-risk-high/10',
  critical: 'bg-risk-critical/10',
  emergency: 'bg-risk-critical/15',
};

const categoryIcon: Record<EventLogCategory, string> = {
  rainfall: 'RAIN',
  weather: 'WX',
  flood: 'FLOOD',
  vault: 'VAULT',
  routing: 'ROUTE',
  road: 'ROAD',
  emergency: 'EMG',
  system: 'SYS',
  alert: 'ALERT',
};

function formatTime(timestamp: string): string {
  const d = new Date(timestamp);
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
}

export function LiveEventLog() {
  const eventLog = useStore((s) => s.eventLog);

  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-4">
        <ScrollText className="w-4 h-4 text-primary-400" />
        <h3 className="text-sm font-bold text-white tracking-wide uppercase">
          Live Event Log
        </h3>
        <span className="ml-auto text-[10px] text-surface-600">{eventLog.length} events</span>
      </div>

      {eventLog.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <ScrollText className="w-8 h-8 text-surface-500 mb-2" />
          <p className="text-sm text-surface-600">No events logged yet</p>
          <p className="text-xs text-surface-600 mt-1">Start the simulation or demo to see live events</p>
        </div>
      ) : (
        <div className="space-y-1 max-h-[400px] overflow-y-auto custom-scroll">
          {eventLog.map((entry) => (
            <div
              key={entry.id}
              className={`flex items-start gap-2 p-2 rounded-lg ${severityBg[entry.severity]}`}
            >
              <div className="flex items-center gap-1.5 shrink-0">
                <Clock className="w-3 h-3 text-surface-600" />
                <span className="text-[10px] font-mono text-surface-600">{formatTime(entry.timestamp)}</span>
              </div>
              <span className="text-[9px] font-bold text-surface-600 bg-surface-200/40 px-1.5 py-0.5 rounded shrink-0">
                {categoryIcon[entry.category]}
              </span>
              <p className={`text-xs ${severityColor[entry.severity]} flex-1`}>
                {entry.message}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
