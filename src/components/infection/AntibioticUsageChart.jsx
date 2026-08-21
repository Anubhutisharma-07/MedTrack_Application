import React from "react";
import { TrendingUp, TrendingDown, Minus, Target } from "lucide-react";
import { ANTIBIOTIC_USAGE } from "../../services/InfectionControlService";

const TREND_ICONS = { rising: TrendingUp, declining: TrendingDown, stable: Minus };
const TREND_COLORS = { rising: "text-rose-400", declining: "text-emerald-400", stable: "text-slate-400" };

/**
 * AntibioticUsageChart
 * Displays DDD per 1000 patient-days for each antibiotic with target lines.
 * Uses simple bar visualization with inline trend indicators.
 */
export default function AntibioticUsageChart() {
  const maxDdd = Math.max(...ANTIBIOTIC_USAGE.map((a) => a.ddd), ...ANTIBIOTIC_USAGE.map((a) => a.target));

  return (
    <div className="space-y-3">
      {ANTIBIOTIC_USAGE.map((item) => {
        const TrendIcon = TREND_ICONS[item.trend] || Minus;
        const pct = Math.min(100, (item.ddd / maxDdd) * 100);
        const targetPct = (item.target / maxDdd) * 100;
        const overTarget = item.ddd > item.target;

        return (
          <div key={item.antibiotic} className="bg-white/[0.03] border border-white/5 rounded-xl p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm text-white font-bold">{item.antibiotic}</span>
                <span className="text-[9px] uppercase tracking-wider text-slate-500 font-semibold bg-white/5 px-1.5 py-0.5 rounded">
                  {item.category}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-mono font-black ${overTarget ? "text-rose-400" : "text-emerald-400"}`}>
                  {item.ddd}
                </span>
                <TrendIcon size={14} className={TREND_COLORS[item.trend]} />
              </div>
            </div>

            {/* Bar */}
            <div className="relative h-3 bg-white/5 rounded-full overflow-hidden">
              <div
                className={`absolute inset-y-0 left-0 rounded-full transition-all ${overTarget ? "bg-gradient-to-r from-amber-500/40 to-rose-500/60" : "bg-gradient-to-r from-sky-500/30 to-sky-500/50"}`}
                style={{ width: `${pct}%` }}
              />
              {/* Target line */}
              <div
                className="absolute inset-y-0 w-0.5 bg-white/40"
                style={{ left: `${targetPct}%` }}
                title={`Target: ${item.target} DDD`}
              />
            </div>

            <div className="flex items-center justify-between mt-1.5">
              <span className="text-[9px] text-slate-500">DDD/1000 patient-days</span>
              <div className="flex items-center gap-1">
                <Target size={9} className="text-slate-500" />
                <span className="text-[9px] text-slate-400">Target: {item.target}</span>
                {overTarget && (
                  <span className="text-[8px] bg-rose-500/10 text-rose-400 px-1.5 py-0.5 rounded font-bold ml-1">
                    EXCEEDS
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
