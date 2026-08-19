import { useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, SkipForward, Zap, Gauge } from 'lucide-react';
import { useStore } from '@/store/useStore';
import type { SimulationSpeed } from '@/types';

const DEMO_STEPS = [
  'Rainfall begins increasing',
  'Water levels begin rising',
  'Flood Risk AI detects increasing risk',
  'A flood hotspot appears',
  'A HydroGrid vault becomes critical',
  'The routing engine evaluates connected vaults',
  'The safest available destination is selected',
  'Simulated water diversion begins',
  'Flood risk changes',
  'Nearby road conditions deteriorate',
  'An ambulance route becomes unsafe',
  'Emergency routing recalculates',
  'A safer route is recommended',
  'The final impact summary appears',
];

export function DemoControlPanel() {
  const floodEventDemo = useStore((s) => s.floodEventDemo);
  const runFloodEventDemo = useStore((s) => s.runFloodEventDemo);
  const advanceFloodEventDemo = useStore((s) => s.advanceFloodEventDemo);
  const resetFloodEventDemo = useStore((s) => s.resetFloodEventDemo);
  const pauseSimulation = useStore((s) => s.pauseSimulation);
  const startSimulation = useStore((s) => s.startSimulation);
  const setSimulationConfig = useStore((s) => s.setSimulationConfig);
  const simulation = useStore((s) => s.simulation);
  const computeImpact = useStore((s) => s.computeImpact);

  const demoActive = floodEventDemo.active;
  const demoComplete = floodEventDemo.phase === 'complete' && !floodEventDemo.active;

  // Auto-advance demo
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (!demoActive) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const speedMs = simulation.speed === 'slow' ? 8000 : simulation.speed === 'fast' ? 2000 : 4000;

    intervalRef.current = setInterval(() => {
      advanceFloodEventDemo();
    }, speedMs);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [demoActive, simulation.speed, advanceFloodEventDemo]);

  // Compute impact when demo completes
  const wasActiveRef = useRef(false);
  useEffect(() => {
    if (wasActiveRef.current && demoComplete) {
      computeImpact();
    }
    wasActiveRef.current = demoActive;
  }, [demoActive, demoComplete, computeImpact]);

  const handleStart = () => {
    runFloodEventDemo();
    startSimulation();
  };

  const handlePause = () => {
    pauseSimulation();
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const handleResume = () => {
    if (floodEventDemo.active) {
      startSimulation();
    }
  };

  const handleReset = () => {
    resetFloodEventDemo();
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const handleSkip = () => {
    // Skip to step 5 (vault-critical) which is the most dramatic part
    const targetStep = 5;
    const stepsToAdvance = Math.max(0, targetStep - floodEventDemo.step);
    for (let i = 0; i < stepsToAdvance; i++) {
      advanceFloodEventDemo();
    }
  };

  const currentStepIndex = Math.min(floodEventDemo.step, DEMO_STEPS.length - 1);
  const progress = demoComplete ? 100 : (floodEventDemo.step / floodEventDemo.totalSteps) * 100;

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-risk-critical" />
          <h3 className="text-sm font-bold text-white tracking-wide uppercase">
            HydroGrid Demo
          </h3>
        </div>
        {demoActive && (
          <span className="badge bg-risk-critical/15 text-risk-critical border border-risk-critical/30 animate-pulse">
            DEMO RUNNING
          </span>
        )}
        {demoComplete && (
          <span className="badge bg-risk-low/15 text-risk-low border border-risk-low/30">
            DEMO COMPLETE
          </span>
        )}
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs text-surface-600 mb-1.5">
          <span>Step {Math.min(floodEventDemo.step + 1, floodEventDemo.totalSteps)} of {floodEventDemo.totalSteps}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-2 bg-surface-200/40 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary-500 to-primary-400 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Current step description */}
      {(demoActive || demoComplete) && (
        <div className="mb-4 p-3 rounded-lg bg-primary-500/5 border border-primary-500/20">
          <p className="text-xs text-surface-600 uppercase tracking-wide mb-1">Current Step</p>
          <p className="text-sm font-semibold text-white">
            {demoComplete ? 'Demo complete - summary available below' : DEMO_STEPS[currentStepIndex]}
          </p>
        </div>
      )}

      {/* Control buttons */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        {!demoActive && !demoComplete && (
          <button onClick={handleStart} className="btn-danger flex items-center justify-center gap-1.5 col-span-2">
            <Zap className="w-4 h-4" />
            START HYDROGRID DEMO
          </button>
        )}
        {demoActive && simulation.state === 'running' && (
          <button onClick={handlePause} className="btn-warning flex items-center justify-center gap-1.5">
            <Pause className="w-3.5 h-3.5" />
            Pause
          </button>
        )}
        {demoActive && simulation.state !== 'running' && (
          <button onClick={handleResume} className="btn-primary flex items-center justify-center gap-1.5">
            <Play className="w-3.5 h-3.5" />
            Resume
          </button>
        )}
        {demoActive && (
          <button onClick={handleSkip} className="btn-secondary flex items-center justify-center gap-1.5">
            <SkipForward className="w-3.5 h-3.5" />
            Skip to Critical
          </button>
        )}
        {(demoActive || demoComplete) && (
          <button onClick={handleReset} className="btn-secondary flex items-center justify-center gap-1.5 col-span-2">
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Demo
          </button>
        )}
      </div>

      {/* Speed control */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Gauge className="w-3.5 h-3.5 text-surface-600" />
          <label className="text-xs font-medium text-surface-600 uppercase tracking-wide">
            Demo Speed
          </label>
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {([
            { value: 'slow' as SimulationSpeed, label: '0.5x' },
            { value: 'normal' as SimulationSpeed, label: '1x' },
            { value: 'fast' as SimulationSpeed, label: '2x' },
            { value: 'fast' as SimulationSpeed, label: '4x' },
          ]).map((opt) => (
            <button
              key={opt.label}
              onClick={() => setSimulationConfig({ speed: opt.value })}
              className={`btn text-xs ${simulation.speed === opt.value ? 'bg-primary-600 text-white' : 'bg-surface-200/60 text-surface-800 hover:bg-surface-300'}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3">
        <span className="badge bg-surface-200/40 text-surface-600 border border-surface-300/30">
          SIMULATED FLOOD EVENT
        </span>
      </div>
    </div>
  );
}
