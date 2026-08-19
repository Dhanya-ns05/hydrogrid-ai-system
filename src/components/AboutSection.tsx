import { Droplets, AlertTriangle, Database, Info } from 'lucide-react';

const LIMITATIONS = [
  'Synthetic / simulated training data',
  'Prototype-scale routing',
  'No physical vault deployment',
  'No live municipal drainage integration',
  'No real-time ambulance GPS',
  'No field validation',
];

export function AboutSection() {
  return (
    <div className="space-y-5">
      {/* About */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-3">
          <Droplets className="w-4 h-4 text-primary-400" />
          <h3 className="text-sm font-bold text-white tracking-wide uppercase">HydroGrid AI</h3>
        </div>
        <p className="text-sm text-surface-200 leading-relaxed">
          An intelligent decentralized urban flood-management and emergency decision-support system that predicts localized flood risk, evaluates stormwater redistribution opportunities, and recommends safer emergency routes during extreme rainfall.
        </p>
      </div>

      {/* Data Transparency */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-3">
          <Info className="w-4 h-4 text-risk-medium" />
          <h3 className="text-sm font-bold text-white tracking-wide uppercase">Data Status</h3>
        </div>
        <div className="flex items-center gap-2 mb-3">
          <span className="badge bg-risk-medium/15 text-risk-medium border border-risk-medium/30">
            SIMULATED / SYNTHETIC DATA
          </span>
        </div>
        <p className="text-xs text-surface-600 leading-relaxed">
          Prototype results are generated using simulated sensor and urban flood conditions. Real-world deployment requires historical and live city datasets for calibration and validation.
        </p>
      </div>

      {/* Limitations */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="w-4 h-4 text-risk-high" />
          <h3 className="text-sm font-bold text-white tracking-wide uppercase">Current Limitations</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {LIMITATIONS.map((item) => (
            <div key={item} className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-risk-high shrink-0 mt-1.5" />
              <span className="text-xs text-surface-600">{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Next Validation Step */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-3">
          <Database className="w-4 h-4 text-primary-400" />
          <h3 className="text-sm font-bold text-white tracking-wide uppercase">Next Validation Step</h3>
        </div>
        <p className="text-xs text-surface-200 leading-relaxed">
          Evaluate the system using historical rainfall, flood, drainage, road, and emergency-response datasets from a target city.
        </p>
      </div>
    </div>
  );
}
