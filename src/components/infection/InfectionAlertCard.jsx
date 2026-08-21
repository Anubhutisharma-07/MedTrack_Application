import React from "react";
import { Skull, AlertTriangle, AlertCircle, TrendingUp, TrendingDown, Clock } from "lucide-react";
import { SEVERITY_META as INF_SEV } from "../../services/MedicationInteractionService";

const SEV = {
  critical: { icon: Skull, bg: "bg-rose-500/10 border-rose-500/30", text: "text-rose-400", pulse: true },
  high: { icon: AlertTriangle, bg: "bg-amber-500/10 border-amber-500/30", text: "text-amber-400", pulse: false },
  moderate: { icon: AlertCircle, bg: "bg-sky-500/10 border-sky-500/30", text: "text-sky-400", pulse: false },
};

const TYPE_LABELS = { outbreak: "Outbreak", resistance: "Resistance Alert", hygiene: "Compliance", usage: "Stewardship" };

function formatTime(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const hrs = Math.floor(diff / 3600_000);
  if (hrs < 1) return `${Math.floor(diff / 60_000)}m ago`;
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

/**
 * InfectionAlertCard
 * Displays an active infection control alert with severity, type, ward, count, trend, and actions.
 */
export default function InfectionAlertCard({ alert, onAcknowledge, onEscalate }) {
  const sev = SEV[alert.severity] || SEV.moderate;
  const Icon = sev.icon;
  const TrendIcon = alert.trend === "rising" ? TrendingUp : TrendingDown;

  return (
    <div className={`relative rounded-2xl border ${sev.bg} p-5 transition-all hover:shadow-lg hover:shadow-black/20 ${sev.pulse ? "animate-pulse" : ""}`}>
      {sev.pulse && (
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500" />
        </span>
      )}

      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl ${sev.bg} border flex items-center justify-center ${sev.text}`}>
            <Icon size={20} />
          </div>
          <div>
            <h3 className="text-white font-bold text-sm">{alert.infection}</h3>
            <p className="text-slate-400 text-xs">{TYPE_LABELS[alert.type] || alert.type} · {alert.ward}</p>
          </div>
        </div>
        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${sev.bg} ${sev.text}`}>
          {alert.severity}
        </span>
      </div>

      <p className="text-slate-300 text-xs leading-relaxed mb-3">{alert.message}</p>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <TrendIcon size={12} className={alert.trend === "rising" ? "text-rose-400" : "text-emerald-400"} />
            <span className="text-[10px] text-slate-400 capitalize">{alert.trend}</span>
          </div>
          <span className="text-[10px] text-slate-500">Cases: <span className="text-white font-bold">{alert.count}</span></span>
        </div>
        <div className="flex items-center gap-1 text-slate-500">
          <Clock size={10} />
          <span className="text-[10px]">{formatTime(alert.triggeredAt)}</span>
        </div>
      </div>

      <div className="flex gap-2 pt-3 border-t border-white/5">
        <button onClick={() => onAcknowledge?.(alert)} className="flex-1 px-3 py-2 bg-white/5 hover:bg-white/10 text-slate-300 text-[11px] font-semibold rounded-lg border border-white/10 transition-all">
          Acknowledge
        </button>
        <button onClick={() => onEscalate?.(alert)} className="flex-1 px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-[11px] font-semibold rounded-lg border border-rose-500/20 transition-all">
          Escalate to IPC
        </button>
      </div>
    </div>
  );
}
