import React, { useState, useMemo } from "react";
import {
  Activity, AlertTriangle, BarChart3, Beaker, Clock, Droplets, Filter,
  HeartPulse, Shield, ShieldCheck, Thermometer, Users,
} from "lucide-react";
import { StatCard } from "../../components/common/StatCard";
import { TabsBar } from "../../components/common/TabsBar";
import ToastStack, { useToasts } from "../../components/common/ToastStack";
import ResistanceHeatmap from "../../components/infection/ResistanceHeatmap";
import AntibioticUsageChart from "../../components/infection/AntibioticUsageChart";
import InfectionAlertCard from "../../components/infection/InfectionAlertCard";
import {
  ACTIVE_ALERTS, WARD_SURVEILLANCE, HAND_HYGIENE, ANTIBIOTIC_USAGE,
  INFECTION_TYPES, calculateOverallHaiRate, calculateHandHygieneAvg,
  calculateAvgDdd, getDddExceedances,
} from "../../services/InfectionControlService";

const TABS = [
  { key: "surveillance", label: "Surveillance", icon: Activity, blurb: "Ward-level HAI rates, hand hygiene & active alerts" },
  { key: "resistance", label: "Resistance Patterns", icon: Beaker, blurb: "Organism × antibiotic resistance heatmap & trends" },
  { key: "stewardship", label: "Antibiotic Stewardship", icon: ShieldCheck, blurb: "DDD metrics, spectrum analysis & compliance targets" },
];

export default function InfectionControlHub({ onNavigate }) {
  const [activeTab, setActiveTab] = useState("surveillance");
  const [selectedWard, setSelectedWard] = useState("all");
  const { toasts, addToast } = useToasts();

  const haiRate = useMemo(() => calculateOverallHaiRate(), []);
  const hhAvg = useMemo(() => calculateHandHygieneAvg(), []);
  const avgDdd = useMemo(() => calculateAvgDdd(), []);
  const exceedances = useMemo(() => getDddExceedances(), []);
  const criticalAlerts = ACTIVE_ALERTS.filter((a) => a.severity === "critical").length;

  const filteredWards = useMemo(() => {
    if (selectedWard === "all") return WARD_SURVEILLANCE;
    return WARD_SURVEILLANCE.filter((w) => w.wardId === selectedWard);
  }, [selectedWard]);

  const handleAcknowledge = (alert) => addToast(`Acknowledged: ${alert.infection} in ${alert.ward}`, "success");
  const handleEscalate = (alert) => addToast(`Escalated: ${alert.infection} to IPC team`, "warning");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <ToastStack toasts={toasts} />

      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-rose-500/5 via-amber-500/5 to-emerald-500/5 pointer-events-none" />
        <div className="max-w-[1440px] mx-auto px-6 pt-10 pb-6 relative">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
              <Shield size={20} className="text-rose-400" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight">
                Infection Control & <span className="text-rose-400">Antibiotic Stewardship</span>
              </h1>
              <p className="text-slate-400 text-xs mt-0.5">
                Hospital-acquired infection surveillance, resistance monitoring & antimicrobial stewardship
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-6 pb-16">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard icon={Activity} label="HAI Rate" value={`${haiRate}`} suffix="/1K pd" tone={haiRate > 5 ? "text-amber-400" : "text-emerald-400"} />
          <StatCard icon={ShieldCheck} label="Hand Hygiene" value={`${hhAvg}`} suffix="%" tone={hhAvg > 90 ? "text-emerald-400" : "text-amber-400"} />
          <StatCard icon={BarChart3} label="Avg DDD" value={`${avgDdd}`} suffix="/1K pd" tone="text-sky-400" />
          <StatCard icon={AlertTriangle} label="Active Alerts" value={`${ACTIVE_ALERTS.length}`} tone={criticalAlerts > 0 ? "text-rose-400" : "text-emerald-400"} />
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <TabsBar tabs={TABS} active={activeTab} onChange={setActiveTab} />
        </div>

        {/* ── Surveillance Tab ─────────────────────────────────── */}
        {activeTab === "surveillance" && (
          <div className="grid lg:grid-cols-[1fr_380px] gap-6">
            <div className="space-y-6">
              {/* Ward Selector */}
              <div className="flex items-center gap-2">
                <Filter size={14} className="text-slate-500" />
                <div className="flex gap-1.5">
                  {[{ id: "all", name: "All Wards" }, ...WARD_SURVEILLANCE.map((w) => ({ id: w.wardId, name: w.wardName }))].map((w) => (
                    <button key={w.id} onClick={() => setSelectedWard(w.id)}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all border ${selectedWard === w.id ? "bg-white/10 border-white/20 text-white" : "bg-transparent border-transparent text-slate-500 hover:text-slate-300"}`}>
                      {w.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Ward Cards */}
              <div className="grid md:grid-cols-2 gap-4">
                {filteredWards.map((w) => (
                  <div key={w.wardId} className="bg-white/[0.03] border border-white/5 rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-white font-bold text-sm">{w.wardName}</h3>
                      <span className="text-[9px] uppercase tracking-wider text-slate-500 bg-white/5 px-2 py-0.5 rounded">{w.beds} beds</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">HAI Rate</p>
                        <p className={`text-lg font-black ${w.haiRate > 6 ? "text-amber-400" : "text-emerald-400"}`}>{w.haiRate}<span className="text-xs text-slate-500">/1K</span></p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">Hand Hygiene</p>
                        <p className={`text-lg font-black ${w.handHygiene > 90 ? "text-emerald-400" : "text-amber-400"}`}>{w.handHygiene}%</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 pt-2 border-t border-white/5">
                      <span>Occupied: <span className="text-white font-bold">{w.occupied}</span>/{w.beds}</span>
                      <span>Infections: <span className={`font-bold ${w.infections > 2 ? "text-rose-400" : "text-emerald-400"}`}>{w.infections}</span></span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Hand Hygiene by Moment */}
              <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-5">
                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                  <Droplets size={14} className="text-sky-400" />
                  WHO 5 Moments — Hand Hygiene Compliance
                </h3>
                <div className="space-y-3">
                  {HAND_HYGIENE.map((h) => (
                    <div key={h.moment}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-slate-300">{h.moment}</span>
                        <span className={`text-xs font-mono font-bold ${h.rate >= h.target ? "text-emerald-400" : "text-amber-400"}`}>{h.rate}%</span>
                      </div>
                      <div className="relative h-2 bg-white/5 rounded-full overflow-hidden">
        
