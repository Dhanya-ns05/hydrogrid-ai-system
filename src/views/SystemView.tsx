import { SimulationControl } from '@/components/SimulationControl';
import { SystemStatusBar } from '@/components/SystemStatusBar';
import { ArchitectureSection } from '@/components/ArchitectureSection';
import { AboutSection } from '@/components/AboutSection';
import { WhyHydroGrid } from '@/components/WhyHydroGrid';
import { useStore } from '@/store/useStore';
import { getSimulationStateLabel } from '@/services/simulation';
import { Activity, Database, MapPin, AlertTriangle, Ambulance, GitBranch, Settings } from 'lucide-react';

export function SystemView() {
  const simulation = useStore((s) => s.simulation);
  const vaults = useStore((s) => s.vaults);
  const zones = useStore((s) => s.floodZones);
  const roads = useStore((s) => s.roadSegments);
  const hospitals = useStore((s) => s.hospitals);
  const ambulances = useStore((s) => s.ambulances);

  const modules = [
    { name: 'Weather Service', icon: Activity, status: 'mock', description: 'Rainfall data & forecasts' },
    { name: 'Flood Service', icon: AlertTriangle, status: 'mock', description: 'Flood zone detection & prediction' },
    { name: 'Vault Service', icon: Database, status: 'mock', description: 'Stormwater vault monitoring' },
    { name: 'Routing Service', icon: GitBranch, status: 'mock', description: 'Capacity-aware water routing' },
    { name: 'Emergency Service', icon: Ambulance, status: 'mock', description: 'Flood-aware ambulance routing' },
    { name: 'Simulation Engine', icon: Settings, status: 'active', description: 'Real-time data simulation' },
  ];

  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">System Architecture</h2>
        <p className="text-sm text-surface-600 mt-1">
          Technical architecture, module status, and project information
        </p>
      </div>

      {/* System Status Bar */}
      <SystemStatusBar />

      {/* System Status Banner */}
      <div className="card p-4 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <span className="relative flex h-3 w-3">
            {simulation.state === 'running' && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
            )}
            <span
              className={`relative inline-flex rounded-full h-3 w-3 ${
                simulation.state === 'running' ? 'bg-primary-400' : 'bg-risk-medium'
              }`}
            ></span>
          </span>
          <div>
            <p className="text-sm font-bold text-white">{getSimulationStateLabel(simulation.state)}</p>
            <p className="text-xs text-surface-600">Tick: {simulation.tick} | Speed: {simulation.speed}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="badge bg-surface-200/60 text-surface-800 border border-surface-300/40">
            <MapPin className="w-3 h-3" />
            Bengaluru
          </span>
          <span className="badge bg-risk-medium/20 text-risk-medium border border-risk-medium/30">
            SIMULATED
          </span>
        </div>
      </div>

      {/* Why HydroGrid - Value & Differentiation */}
      <WhyHydroGrid />

      {/* Technical Architecture */}
      <ArchitectureSection />

      {/* Service Modules + Simulation Control */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-1">
          <SimulationControl />
        </div>

        <div className="lg:col-span-2 card p-5">
          <h3 className="text-sm font-bold text-white tracking-wide uppercase mb-4">
            Service Modules
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {modules.map((mod) => {
              const Icon = mod.icon;
              const isActive = mod.status === 'active';
              return (
                <div
                  key={mod.name}
                  className="flex items-center gap-3 p-3 bg-surface-200/30 rounded-lg border border-surface-200/40"
                >
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                      isActive ? 'bg-primary-500/15' : 'bg-surface-300/30'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-primary-400' : 'text-surface-600'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">{mod.name}</span>
                      <span
                        className={`badge text-[9px] border ${
                          isActive
                            ? 'bg-primary-500/10 text-primary-400 border-primary-500/20'
                            : 'bg-risk-medium/10 text-risk-medium border-risk-medium/20'
                        }`}
                      >
                        {isActive ? 'ACTIVE' : 'MOCK'}
                      </span>
                    </div>
                    <p className="text-xs text-surface-600 mt-0.5">{mod.description}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Data Inventory */}
          <div className="mt-5 pt-5 border-t border-surface-200/60">
            <h4 className="text-sm font-bold text-white tracking-wide uppercase mb-3">
              Data Inventory
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              <DataChip icon={AlertTriangle} label="Flood Zones" count={zones.length} />
              <DataChip icon={Database} label="Vaults" count={vaults.length} />
              <DataChip icon={MapPin} label="Road Segments" count={roads.length} />
              <DataChip icon={Activity} label="Hospitals" count={hospitals.length} />
              <DataChip icon={Ambulance} label="Ambulances" count={ambulances.length} />
              <DataChip icon={GitBranch} label="Connections" count={vaults.reduce((a, v) => a + v.connectedVaults.length, 0)} />
            </div>
          </div>
        </div>
      </div>

      {/* About, Limitations, Data Transparency */}
      <AboutSection />
    </div>
  );
}

function DataChip({
  icon: Icon,
  label,
  count,
}: {
  icon: typeof Database;
  label: string;
  count: number;
}) {
  return (
    <div className="bg-surface-200/30 rounded-lg p-2.5 border border-surface-200/40">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className="w-3 h-3 text-surface-600" />
        <span className="text-[10px] text-surface-600 uppercase tracking-wide font-medium">
          {label}
        </span>
      </div>
      <p className="text-lg font-bold text-white">{count}</p>
    </div>
  );
}
