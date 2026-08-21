import { Pause, Play, RefreshCw } from "lucide-react";

/**
 * Variant-A simulation transport: play/pause toggle, a speed dropdown and a
 * reset button, rendered as a fragment so callers can append their own
 * (content-specific) export button inside the same flex container.
 *
 * ICU pages override the labels ("Pause stream"/"Resume stream"/"Stream speed").
 */
export default function PlaybackControls({
  playing,
  onToggle,
  speed,
  onSpeedChange,
  onReset,
  pauseLabel = "Pause simulation",
  resumeLabel = "Resume simulation",
  speedLabel = "Simulation speed",
}) {
  return (
    <>
      <div className="flex items-center rounded-xl border border-slate-800 bg-slate-900/70">
        <button
          onClick={onToggle}
          className="flex items-center gap-2 rounded-l-xl border-r border-slate-800 px-3.5 py-2.5 text-xs font-bold text-slate-300 transition hover:bg-slate-800 hover:text-white"
          aria-label={playing ? pauseLabel : resumeLabel}
        >
          {playing ? <Pause size={14} /> : <Play size={14} />}
          {playing ? "Pause" : "Resume"}
        </button>
        <select
          value={speed}
          onChange={(e) => onSpeedChange(Number(e.target.value))}
          className="rounded-r-xl bg-transparent px-2 py-2.5 text-xs font-semibold text-slate-300 outline-none"
          aria-label={speedLabel}
        >
          <option value={1} className="bg-slate-900">1× realtime</option>
          <option value={2} className="bg-slate-900">2× fast</option>
          <option value={4} className="bg-slate-900">4× turbo</option>
        </select>
      </div>
      <button
        onClick={onReset}
        className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/70 px-3.5 py-2.5 text-xs font-bold text-slate-300 transition hover:bg-slate-800 hover:text-white"
      >
        <RefreshCw size={14} /> Reset
      </button>
    </>
  );
}
