import { useState } from 'react';
import { Droplets, LayoutDashboard, Map, Network, GitBranch, Ambulance, BarChart3, Settings, Activity, Monitor } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { getSimulationStateLabel } from '@/services/simulation';

export type ViewName =
  | 'dashboard'
  | 'flood-map'
  | 'hydrogrid-network'
  | 'water-routing'
  | 'emergency-routes'
  | 'analytics'
  | 'system';

interface NavItem {
  id: ViewName;
  label: string;
  icon: typeof LayoutDashboard;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
  { id: 'flood-map', label: 'Flood AI', icon: Map },
  { id: 'hydrogrid-network', label: 'HydroGrid Network', icon: Network },
  { id: 'emergency-routes', label: 'Emergency Routing', icon: Ambulance },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'system', label: 'System Architecture', icon: Settings },
];

interface LayoutProps {
  activeView: ViewName;
  onViewChange: (view: ViewName) => void;
  presentationMode: boolean;
  onTogglePresentationMode: () => void;
  children: React.ReactNode;
}

export function Layout({ activeView, onViewChange, presentationMode, onTogglePresentationMode, children }: LayoutProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const simState = useStore((s) => s.simulation.state);

  return (
    <div className="min-h-screen bg-surface-0 flex flex-col">
      {/* Top Navigation */}
      <header className="sticky top-0 z-[1000] bg-surface-50/90 backdrop-blur-md border-b border-surface-200/60">
        <div className="px-4 lg:px-6 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-900/30">
              <Droplets className="w-5 h-5 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-base font-bold text-white tracking-tight leading-none">
                HYDROGRID <span className="text-primary-400">AI</span>
              </h1>
              <p className="text-[10px] text-surface-700 font-medium tracking-wide mt-0.5">
                FLOOD PREDICTION & STORMWATER ROUTING
              </p>
            </div>
            <div className="sm:hidden">
              <h1 className="text-base font-bold text-white tracking-tight leading-none">
                HYDROGRID <span className="text-primary-400">AI</span>
              </h1>
            </div>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => onViewChange(item.id)}
                  className={`nav-link flex items-center gap-2 ${
                    activeView === item.id ? 'nav-link-active' : ''
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Right side controls */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Presentation Mode Toggle */}
            <button
              onClick={onTogglePresentationMode}
              className={`btn flex items-center gap-1.5 text-xs ${
                presentationMode
                  ? 'bg-primary-600 text-white'
                  : 'bg-surface-200/60 text-surface-800 hover:bg-surface-300'
              }`}
              title="Toggle Presentation Mode"
            >
              <Monitor className="w-3.5 h-3.5" />
              <span className="hidden md:inline">{presentationMode ? 'EXIT PRESENTATION' : 'PRESENTATION MODE'}</span>
              <span className="md:hidden">PRES</span>
            </button>

            {/* Simulation Status */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-500/10 border border-primary-500/20">
              <span className="relative flex h-2 w-2">
                {simState === 'running' && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                )}
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${
                    simState === 'running'
                      ? 'bg-primary-400'
                      : simState === 'paused'
                        ? 'bg-risk-medium'
                        : 'bg-surface-500'
                  }`}
                ></span>
              </span>
              <span className="text-xs font-semibold text-primary-400 hidden md:inline">
                {getSimulationStateLabel(simState)}
              </span>
              <span className="text-xs font-semibold text-primary-400 md:hidden">
                {simState === 'running' ? 'ACTIVE' : simState === 'paused' ? 'PAUSED' : 'IDLE'}
              </span>
            </div>
            <button
              className="lg:hidden btn-secondary !px-2.5 !py-2"
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileNavOpen && (
          <nav className="lg:hidden border-t border-surface-200/60 px-4 py-3 flex flex-wrap gap-2 animate-fade-in">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onViewChange(item.id);
                    setMobileNavOpen(false);
                  }}
                  className={`nav-link flex items-center gap-2 ${
                    activeView === item.id ? 'nav-link-active' : ''
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        )}
      </header>

      {/* Main Content */}
      <main className={`flex-1 ${presentationMode ? 'p-2 lg:p-3' : 'p-4 lg:p-6'} max-w-[1800px] w-full mx-auto`}>
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-surface-200/60 px-4 lg:px-6 py-3 flex items-center justify-between text-xs text-surface-600">
        <div className="flex items-center gap-2">
          <Activity className="w-3.5 h-3.5" />
          <span>SIMULATED DATA - Demo City: Bengaluru, Karnataka, India</span>
        </div>
        <span className="hidden sm:inline">HydroGrid AI Foundation v1.0</span>
      </footer>
    </div>
  );
}
