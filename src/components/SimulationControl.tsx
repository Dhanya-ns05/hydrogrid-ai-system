import { Play, Pause, RotateCcw, CloudRain, Zap, Gauge, TrendingUp, Car } from 'lucide-react';
import { useStore } from '@/store/useStore';
import type { SimulationSpeed } from '@/types';

export function SimulationControl() {
  const simulation = useStore((s) => s.simulation);
  const setSimulationConfig = useStore((s) => s.setSimulationConfig);
  const startSimulation = useStore((s) => s.startSimulation);
  const pauseSimulation = useStore((s) => s.pauseSimulation);
  const resetSimulation = useStore((s) => s.resetSimulation);
  const triggerHeavyRain = useStore((s) => s.triggerHeavyRain);
  const triggerExtremeRain = useStore((s) => s.triggerExtremeRain);

  const isRunning = simulation.state === 'running';

  return (
    <div className="card p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-white tracking-wide uppercase">
          Simulation Control
        </h3>
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            {isRunning && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
            )}
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                isRunning ? 'bg-primary-400' : 'bg-risk-medium'
              }`}
            ></span>
          </span>
          <span className="text-xs font-semibold text-primary-400">
            {isRunning ? 'SIMULATION MODE' : 'PAUSED'}
          </span>
        </div>
      </div>

      {/* Sliders */}
      <div className="space-y-4">
        <SliderControl
          icon={CloudRain}
          label="Rainfall Intensity"
          value={simulation.rainfallIntensity}
          min={0}
          max={150}
          step={1}
          unit="mm/hr"
          onChange={(v) => setSimulationConfig({ rainfallIntensity: v })}
        />
        <SliderControl
          icon={TrendingUp}
          label="Water Rise Rate"
          value={simulation.waterRiseRate}
          min={0}
          max={10}
          step={0.1}
          unit="%/min"
          onChange={(v) => setSimulationConfig({ waterRiseRate: v })}
        />
        <SliderControl
          icon={Car}
          label="Traffic Level"
          value={simulation.trafficLevel}
          min={0}
          max={100}
          step={1}
          unit="%"
          onChange={(v) => setSimulationConfig({ trafficLevel: v })}
        />
      </div>

      {/* Simulation Speed */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Gauge className="w-3.5 h-3.5 text-surface-600" />
          <label className="text-xs font-medium text-surface-600 uppercase tracking-wide">
            Simulation Speed
          </label>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {(['slow', 'normal', 'fast'] as SimulationSpeed[]).map((speed) => (
            <button
              key={speed}
              onClick={() => setSimulationConfig({ speed })}
              className={`btn text-xs capitalize ${
                simulation.speed === speed
                  ? 'bg-primary-600 text-white'
                  : 'bg-surface-200/60 text-surface-800 hover:bg-surface-300'
              }`}
            >
              {speed}
            </button>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-3 gap-2">
        {!isRunning ? (
          <button onClick={startSimulation} className="btn-primary flex items-center justify-center gap-1.5">
            <Play className="w-3.5 h-3.5" />
            Start
          </button>
        ) : (
          <button onClick={pauseSimulation} className="btn-warning flex items-center justify-center gap-1.5">
            <Pause className="w-3.5 h-3.5" />
            Pause
          </button>
        )}
        <button onClick={resetSimulation} className="btn-secondary flex items-center justify-center gap-1.5">
          <RotateCcw className="w-3.5 h-3.5" />
          Reset
        </button>
        <button onClick={triggerHeavyRain} className="btn-secondary flex items-center justify-center gap-1.5">
          <CloudRain className="w-3.5 h-3.5" />
          Heavy
        </button>
      </div>

      <button onClick={triggerExtremeRain} className="btn-danger flex items-center justify-center gap-1.5 w-full">
        <Zap className="w-4 h-4" />
        Trigger Extreme Rain Event
      </button>
    </div>
  );
}

interface SliderControlProps {
  icon: typeof CloudRain;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (value: number) => void;
}

function SliderControl({
  icon: Icon,
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: SliderControlProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <Icon className="w-3.5 h-3.5 text-surface-600" />
          <label className="text-xs font-medium text-surface-600 uppercase tracking-wide">
            {label}
          </label>
        </div>
        <span className="text-xs font-bold text-primary-400 font-mono">
          {value.toFixed(step < 1 ? 1 : 0)} {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="slider"
      />
    </div>
  );
}
