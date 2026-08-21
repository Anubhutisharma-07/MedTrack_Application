import { Pause, Play, RefreshCw } from "lucide-react";

/**
 * Shared simulation controls (play/pause, 1x/2x/4x speed, reset).
 *
 * Six hub pages previously rendered this exact control cluster inline in
 * their header. `sim` is the simulation controller object exposed by the
 * page's `useSimulation`-style hook: `{ running, speed, setRunning,
 * setSpeed, reset }`.
 */

export function SimControls({ sim }) {
  return (
    <div className="flex items-center gap-1 rounded-xl border border-slate-800 bg-slate-900 px-2 py-1.5">
      <button
        onClick={() => sim.setRunning(!sim.running)}
        className="rounded-lg p-1.5 text-slate-300 hover:bg-slate-800"
        title={sim.running ? "Pause simulation" : "Resume simulation"}
      >
        {sim.running ? <Pause size={15} /> : <Play size={15} />}
      </button>
      {[1, 2, 4].map((s) => (
        <button
          key={s}
          onClick={() => sim.setSpeed(s)}
          className={`rounded-lg px-2 py-1 text-[11px] font-semibold ${sim.speed === s ? "bg-emerald-500/20 text-emerald-300" : "text-slate-400 hover:bg-slate-800"}`}
        >
          {s}×
        </button>
      ))}
      <button
        onClick={sim.reset}
        className="ml-1 rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
        title="Reset simulation"
      >
        <RefreshCw size={15} />
      </button>
    </div>
  );
}
