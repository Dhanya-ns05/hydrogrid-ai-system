import { Brain, Scale, Shield, CheckCircle, Circle, Droplets } from 'lucide-react';

const TRADITIONAL = [
  'Passive drainage',
  'Limited local monitoring',
  'Fixed routing',
  'Reactive response',
  'Flood and emergency management often operate separately',
];

const HYDROGRID = [
  'Predictive flood-risk analysis',
  'Decentralized monitoring',
  'Capacity-aware water routing',
  'Dynamic flood-aware emergency routing',
  'Unified decision-support dashboard',
];

const INNOVATIONS = [
  {
    icon: Brain,
    title: 'PREDICT',
    color: 'text-primary-400',
    bg: 'bg-primary-500/10',
    border: 'border-primary-500/20',
    description: 'AI estimates flood risk before conditions become critical.',
  },
  {
    icon: Scale,
    title: 'BALANCE',
    color: 'text-accent-400',
    bg: 'bg-accent-500/10',
    border: 'border-accent-500/20',
    description: 'The system evaluates available vault capacity and intelligently recommends where excess water should be routed.',
  },
  {
    icon: Shield,
    title: 'PROTECT',
    color: 'text-risk-low',
    bg: 'bg-risk-low/10',
    border: 'border-risk-low/20',
    description: 'The system uses flood conditions to recommend safer emergency routes.',
  },
];

export function WhyHydroGrid() {
  return (
    <div className="space-y-5">
      {/* Three Core Innovations */}
      <div className="card p-5">
        <h3 className="text-sm font-bold text-white tracking-wide uppercase mb-4">
          What Makes HydroGrid Different?
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {INNOVATIONS.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className={`p-4 rounded-lg ${item.bg} border ${item.border}`}>
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={`w-5 h-5 ${item.color}`} />
                  <span className={`text-base font-bold ${item.color}`}>{item.title}</span>
                </div>
                <p className="text-xs text-surface-200 leading-relaxed">{item.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Comparison: Traditional vs HydroGrid */}
      <div className="card p-5">
        <h3 className="text-sm font-bold text-white tracking-wide uppercase mb-4">
          Why HydroGrid?
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Circle className="w-4 h-4 text-surface-600" />
              <h4 className="text-xs font-bold text-surface-600 uppercase tracking-wide">Traditional Systems</h4>
            </div>
            <div className="space-y-2">
              {TRADITIONAL.map((item) => (
                <div key={item} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-surface-500 shrink-0 mt-1.5" />
                  <span className="text-xs text-surface-600">{item}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Droplets className="w-4 h-4 text-primary-400" />
              <h4 className="text-xs font-bold text-primary-400 uppercase tracking-wide">HydroGrid</h4>
            </div>
            <div className="space-y-2">
              {HYDROGRID.map((item) => (
                <div key={item} className="flex items-start gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-risk-low shrink-0 mt-0.5" />
                  <span className="text-xs text-surface-200">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-4 p-3 rounded-lg bg-primary-500/5 border border-primary-500/15">
          <p className="text-xs text-surface-200 leading-relaxed">
            HydroGrid's prototype combines these capabilities into one decentralized decision-support architecture.
          </p>
        </div>
      </div>
    </div>
  );
}
