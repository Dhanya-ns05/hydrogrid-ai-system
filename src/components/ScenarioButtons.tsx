import { CloudRain, CloudOff, CloudLightning, AlertCircle, AlertTriangle } from 'lucide-react';
import { useStore } from '@/store/useStore';
import type { RoutingScenario } from '@/types';

const SCENARIOS: { id: RoutingScenario; label: string; icon: typeof CloudRain; color: string }[] = [
  { id: 'normal', label: 'Normal Rain', icon: CloudOff, color: 'text-risk-low' },
  { id: 'heavy', label: 'Heavy Rain', icon: CloudRain, color: 'text-risk-medium' },
  { id: 'extreme', label: 'Extreme Rain', icon: CloudLightning, color: 'text-risk-critical' },
  { id: 'one-critical', label: 'One Vault Critical', icon: AlertCircle, color: 'text-risk-high' },
  { id: 'multiple-critical', label: 'Multiple Vaults Critical', icon: AlertTriangle, color: 'text-risk-critical' },
];

export function ScenarioButtons() {
  const applyScenario = useStore((s) => s.applyScenario);

  return (
    <div className="card p-4">
      <h3 className="text-xs font-bold text-white tracking-wide uppercase mb-3">
        Simulation Scenarios
      </h3>
      <div className="flex flex-wrap gap-2">
        {SCENARIOS.map((s) => {
          const Icon = s.icon;
          return (
            <button
              key={s.id}
              onClick={() => applyScenario(s.id)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-200/40 border border-surface-200/40 hover:border-primary-500/40 hover:bg-primary-500/10 transition-all duration-200 group"
            >
              <Icon className={`w-4 h-4 ${s.color}`} />
              <span className="text-xs font-semibold text-surface-200 group-hover:text-white">
                {s.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
