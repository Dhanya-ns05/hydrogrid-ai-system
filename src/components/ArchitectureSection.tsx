import { Cpu, Map, Brain, Database, Radio, CheckCircle, Circle, ArrowDown, Layers, Code, Cloud } from 'lucide-react';

const ARCHITECTURE_LAYERS = [
  { label: 'DATA SOURCES', icon: Cloud, implemented: true },
  { label: 'SENSOR / SIMULATION LAYER', icon: Radio, implemented: true },
  { label: 'FLOOD AI', icon: Brain, implemented: true },
  { label: 'DECISION ENGINE', icon: Cpu, implemented: true },
  { label: 'HYDROGRID VAULT NETWORK', icon: Database, implemented: true },
  { label: 'WATER ROUTING', icon: Layers, implemented: true },
  { label: 'ROAD RISK ENGINE', icon: Map, implemented: true },
  { label: 'EMERGENCY ROUTING', icon: Map, implemented: true },
  { label: 'DASHBOARD / ALERTS / ANALYTICS', icon: Code, implemented: true },
];

const TECH_STACK = [
  { category: 'Frontend', value: 'React', implemented: true },
  { category: 'Map', value: 'Leaflet / OpenStreetMap', implemented: true },
  { category: 'AI', value: 'Python / scikit-learn architecture', implemented: true },
  { category: 'Backend', value: 'Existing application backend', implemented: true },
  { category: 'Data', value: 'Synthetic / simulated prototype data', implemented: true },
  { category: 'Communication', value: 'ESP32 / LoRa / ESP-NOW concept', implemented: false },
];

const IMPLEMENTED = [
  'Flood-risk prediction prototype',
  'Flood hotspot detection',
  'Vault simulation',
  'Intelligent water-routing algorithm',
  'Emergency route recommendation',
  'Full flood-event simulation',
  'Evaluation framework',
  'Dashboard and analytics',
];

const FUTURE = [
  'Physical ESP32 sensor nodes',
  'Real rainfall APIs',
  'Real water-level sensors',
  'Real traffic data',
  'Real OpenStreetMap city-scale routing',
  'Municipal drainage data',
  'Hospital / emergency APIs',
  'Physical HydroGrid vault',
];

export function ArchitectureSection() {
  return (
    <div className="space-y-5">
      {/* Architecture Flow */}
      <div className="card p-5">
        <h3 className="text-sm font-bold text-white tracking-wide uppercase mb-4">
          Technical Architecture
        </h3>
        <div className="space-y-1">
          {ARCHITECTURE_LAYERS.map((layer, i) => {
            const Icon = layer.icon;
            const isLast = i === ARCHITECTURE_LAYERS.length - 1;
            return (
              <div key={i}>
                <div className="flex items-center gap-3 p-2 rounded-lg bg-surface-200/20 border border-surface-200/30">
                  <div className="w-8 h-8 rounded-lg bg-primary-500/10 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-primary-400" />
                  </div>
                  <span className="text-xs font-bold text-white tracking-wide">{layer.label}</span>
                  {layer.implemented ? (
                    <CheckCircle className="w-3.5 h-3.5 text-risk-low ml-auto" />
                  ) : (
                    <span className="badge bg-risk-medium/10 text-risk-medium border border-risk-medium/20 text-[9px] ml-auto">FUTURE</span>
                  )}
                </div>
                {!isLast && (
                  <div className="flex items-center justify-center py-0.5">
                    <ArrowDown className="w-3 h-3 text-primary-400/30" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Tech Stack */}
      <div className="card p-5">
        <h3 className="text-sm font-bold text-white tracking-wide uppercase mb-4">
          Technologies Used
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {TECH_STACK.map((tech) => (
            <div key={tech.category} className="p-3 rounded-lg bg-surface-200/20 border border-surface-200/30">
              <p className="text-[10px] text-surface-600 uppercase tracking-wide font-medium">{tech.category}</p>
              <p className="text-xs font-bold text-white mt-1">{tech.value}</p>
              {tech.implemented ? (
                <span className="badge bg-risk-low/10 text-risk-low border border-risk-low/20 text-[9px] mt-1.5 inline-flex">IMPLEMENTED</span>
              ) : (
                <span className="badge bg-risk-medium/10 text-risk-medium border border-risk-medium/20 text-[9px] mt-1.5 inline-flex">FUTURE HARDWARE</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Implemented vs Future */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="w-4 h-4 text-risk-low" />
            <h3 className="text-sm font-bold text-white tracking-wide uppercase">
              Currently Implemented
            </h3>
          </div>
          <div className="space-y-2">
            {IMPLEMENTED.map((item) => (
              <div key={item} className="flex items-start gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-risk-low shrink-0 mt-0.5" />
                <span className="text-xs text-surface-200">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Circle className="w-4 h-4 text-surface-600" />
            <h3 className="text-sm font-bold text-surface-600 tracking-wide uppercase">
              Future Integration
            </h3>
          </div>
          <div className="space-y-2">
            {FUTURE.map((item) => (
              <div key={item} className="flex items-start gap-2">
                <Circle className="w-3.5 h-3.5 text-surface-600 shrink-0 mt-0.5" />
                <span className="text-xs text-surface-600">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
