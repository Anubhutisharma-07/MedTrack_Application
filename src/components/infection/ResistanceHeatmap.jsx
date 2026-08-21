import React from "react";
import { ORGANISMS, ANTIBIOTICS, RESISTANCE_MATRIX, resistanceLevel, resistanceColor } from "../../services/InfectionControlService";

/**
 * ResistanceHeatmap
 * Color-coded grid showing organism × antibiotic resistance percentages.
 * Green = sensitive, Yellow = intermediate, Red = resistant.
 */
export default function ResistanceHeatmap() {
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[680px]">
        {/* Column Headers */}
        <div className="flex">
          <div className="w-28 flex-shrink-0 px-2 py-2">
            <span className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Organism</span>
          </div>
          {ANTIBIOTICS.map((ab) => (
            <div key={ab} className="flex-1 px-1 py-2 text-center">
              <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold leading-tight block">{ab}</span>
            </div>
          ))}
        </div>

        {/* Rows */}
        {ORGANISMS.map((org, ri) => (
          <div key={org} className="flex items-center border-t border-white/5">
            <div className="w-28 flex-shrink-0 px-2 py-2">
              <span className="text-xs text-white font-semibold">{org}</span>
            </div>
            {RESISTANCE_MATRIX[ri].map((pct, ci) => {
              const level = resistanceLevel(pct);
              const colorCls = resistanceColor(level);
              return (
                <div key={ci} className="flex-1 px-1 py-1">
                  <div
                    className={`rounded-lg py-2 text-center font-mono text-xs font-bold border border-white/5 ${colorCls} transition-all hover:scale-110 hover:z-10 cursor-default`}
                    title={`${org} × ${ANTIBIOTICS[ci]}: ${pct}% resistant (${level})`}
                  >
                    {pct}%
                  </div>
                </div>
              );
            })}
          </div>
        ))}

        {/* Legend */}
        <div className="flex items-center gap-4 mt-4 pt-3 border-t border-white/5">
          <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Legend:</span>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-emerald-500/20 border border-emerald-500/30" />
            <span className="text-[10px] text-slate-400">Sensitive (≤10%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-amber-500/20 border border-amber-500/30" />
            <span className="text-[10px] text-slate-400">Intermediate (11-30%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-rose-500/20 border border-rose-500/30" />
            <span className="text-[10px] text-slate-400">Resistant (&gt;30%)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
