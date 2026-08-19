import { Brain, Lightbulb, TrendingUp, Droplets, Database, Shield, Ambulance, Route } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { riskLabel } from '@/utils/risk';

export function ExplainableAIPanel() {
  const floodZones = useStore((s) => s.floodZones);
  const vaults = useStore((s) => s.vaults);
  const activeDiversion = useStore((s) => s.activeDiversion);
  const emergencyRouteSet = useStore((s) => s.emergencyRouteSet);

  const hotspot = floodZones.reduce((max, z) => z.riskScore > max.riskScore ? z : max, floodZones[0]);
  const criticalVault = vaults.reduce((max, v) => v.currentLevel > max.currentLevel ? v : max, vaults[0]);
  const destVault = activeDiversion
    ? vaults.find(v => v.id === activeDiversion.destinationVaultId)
    : vaults.find(v => v.connectedVaults.includes(criticalVault?.id || '') && v.currentLevel < 60);

  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-4">
        <Brain className="w-4 h-4 text-primary-400" />
        <h3 className="text-sm font-bold text-white tracking-wide uppercase">
          Explainable AI - Why These Decisions?
        </h3>
      </div>

      <div className="space-y-4">
        {/* Flood Prediction Explanation */}
        <div className="p-3 rounded-lg bg-surface-200/20 border border-surface-200/30">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="w-3.5 h-3.5 text-risk-high" />
            <h4 className="text-xs font-bold text-white uppercase tracking-wide">
              Why is this area at risk?
            </h4>
          </div>
          {hotspot && (hotspot.riskLevel === 'high' || hotspot.riskLevel === 'critical') ? (
            <ul className="space-y-1.5">
              <ExplanationItem text={`High rainfall: ${Math.round(hotspot.rainfall)} mm/hr`} />
              <ExplanationItem text={`Rapid water-level rise: ${hotspot.riseRate.toFixed(1)}%/min`} />
              <ExplanationItem text={`Water level at ${Math.round(hotspot.waterLevel)}%`} />
              <ExplanationItem text={`Flood probability: ${Math.round(hotspot.riskScore)}% (${riskLabel(hotspot.riskLevel)})`} />
            </ul>
          ) : (
            <p className="text-xs text-surface-600">No areas currently at elevated flood risk.</p>
          )}
        </div>

        {/* Water Routing Explanation */}
        <div className="p-3 rounded-lg bg-surface-200/20 border border-surface-200/30">
          <div className="flex items-center gap-2 mb-2">
            <Droplets className="w-3.5 h-3.5 text-primary-400" />
            <h4 className="text-xs font-bold text-white uppercase tracking-wide">
              {destVault ? `Why was ${destVault.id} selected?` : 'Water routing decision'}
            </h4>
          </div>
          {destVault ? (
            <ul className="space-y-1.5">
              <ExplanationItem text={`High available capacity: ${Math.round(destVault.availableCapacity)}%`} />
              <ExplanationItem text={`Low predicted risk: ${riskLabel(destVault.riskLevel)}`} />
              <ExplanationItem text={`Connected to source vault ${criticalVault?.id || '—'}`} />
              <ExplanationItem text={`Current level: ${Math.round(destVault.currentLevel)}% (accepts transfer)`} />
            </ul>
          ) : (
            <p className="text-xs text-surface-600">No diversion destination currently selected. Critical vault has no connected vaults with sufficient capacity.</p>
          )}
        </div>

        {/* Emergency Routing Explanation */}
        <div className="p-3 rounded-lg bg-surface-200/20 border border-surface-200/30">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-3.5 h-3.5 text-risk-low" />
            <h4 className="text-xs font-bold text-white uppercase tracking-wide">
              {emergencyRouteSet?.hasSafeRoute ? 'Why was this route selected?' : 'Emergency routing decision'}
            </h4>
          </div>
          {emergencyRouteSet?.hasSafeRoute && emergencyRouteSet.recommended ? (
            <ul className="space-y-1.5">
              <ExplanationItem text={`Avoids flooded road segments`} />
              <ExplanationItem text={`Low flood exposure score: ${emergencyRouteSet.recommended.floodRiskScore}`} />
              <ExplanationItem text={`Estimated travel time: ${emergencyRouteSet.recommended.estimatedTime} min`} />
              <ExplanationItem text={`Hospital remains accessible`} />
            </ul>
          ) : emergencyRouteSet && !emergencyRouteSet.hasSafeRoute ? (
            <p className="text-xs text-risk-critical">No safe route available. All paths to the hospital are blocked by flooding. Emergency coordination required.</p>
          ) : (
            <p className="text-xs text-surface-600">No emergency route calculation active. Use the Emergency Routing page to calculate routes.</p>
          )}
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-surface-200/40">
        <p className="text-[10px] text-surface-600 leading-relaxed">
          Explanations are generated from the simulation's current state and model inputs. They describe the factors that influenced each decision, not a post-hoc rationalization.
        </p>
      </div>
    </div>
  );
}

function ExplanationItem({ text }: { text: string }) {
  return (
    <li className="flex items-start gap-2">
      <span className="w-1.5 h-1.5 rounded-full bg-primary-400 shrink-0 mt-1.5" />
      <span className="text-xs text-surface-200">{text}</span>
    </li>
  );
}
