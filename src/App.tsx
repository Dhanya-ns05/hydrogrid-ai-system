import { useState } from 'react';
import { Layout, type ViewName } from '@/components/Layout';
import { DashboardView } from '@/views/DashboardView';
import { FloodMapView } from '@/views/FloodMapView';
import { HydroGridNetworkView } from '@/views/HydroGridNetworkView';
import { WaterRoutingView } from '@/views/WaterRoutingView';
import { EmergencyRoutesView } from '@/views/EmergencyRoutesView';
import { AnalyticsView } from '@/views/AnalyticsView';
import { SystemView } from '@/views/SystemView';
import { useSimulationEngine } from '@/hooks/useSimulationEngine';

function App() {
  const [activeView, setActiveView] = useState<ViewName>('dashboard');
  const [presentationMode, setPresentationMode] = useState(false);
  useSimulationEngine();

  return (
    <Layout
      activeView={activeView}
      onViewChange={setActiveView}
      presentationMode={presentationMode}
      onTogglePresentationMode={() => setPresentationMode((p) => !p)}
    >
      {activeView === 'dashboard' && <DashboardView presentationMode={presentationMode} />}
      {activeView === 'flood-map' && <FloodMapView />}
      {activeView === 'hydrogrid-network' && <HydroGridNetworkView />}
      {activeView === 'water-routing' && <WaterRoutingView />}
      {activeView === 'emergency-routes' && <EmergencyRoutesView />}
      {activeView === 'analytics' && <AnalyticsView />}
      {activeView === 'system' && <SystemView />}
    </Layout>
  );
}

export default App;
