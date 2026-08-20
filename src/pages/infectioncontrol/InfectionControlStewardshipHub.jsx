import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity, AlertTriangle, Bug, Calendar, CheckCircle2, Clock, Droplets,
  FileText, Filter, FlaskConical, Gauge, Hand, Pause, Play, RefreshCw,
  Search, Shield, ShieldCheck, Siren, Stethoscope, Syringe, TrendingDown,
  TrendingUp, User, Users, Pill, AlertOctagon,
} from "lucide-react";
import { ExportCsvButton } from "../../components/common/ExportButton";
import { downloadCsv } from "../../utils/csv";
import { CompactStatCard as StatCard } from "../../components/common/StatCard";
import { CompactSearch } from "../../components/common/SearchBox";
import { FilterChips } from "../../components/common/FilterChips";
import { Row } from "../../components/common/InfoRow";
import { EmptyState } from "../../components/common/EmptyState";
import { ToneBadge } from "../../components/common/ToneBadge";
import { TabsBar } from "../../components/common/TabsBar";
import { SimpleModal as Modal } from "../../components/common/Modal";
import ToastTray, { useToastTray } from "../../components/common/ToastTray";
import { PageHeader, Footer } from "../../components/common/PageHeader";

/* ── Seed data ── */

const HAI_SURVEILLANCE = [
  { id: "HAI-001", patient: "Eleanor Vance", age: 74, unit: "ICU-3A", infection: "CAUTI", organism: "E. coli", onsetDay: 5, site: "Urinary Catheter", wbc: 14200, temp: 38.9, cultures: "Positive", sensitivity: "ESBL \u2014 Resistant", antibiotics: ["Meropenem"], isolation: false, resolved: false, riskLevel: "High", lastCulture: "4h ago", nurse: "RN Torres", reportedBy: "Lab Auto-Flag" },
  { id: "HAI-002", patient: "Marcus Chen", age: 62, unit: "MICU-07", infection: "CLABSI", organism: "S. aureus (MRSA)", onsetDay: 3, site: "Central Line \u2014 RIJ", wbc: 18500, temp: 39.4, cultures: "Positive x2", sensitivity: "MRSA \u2014 Vanco Sensitive", antibiotics: ["Vancomycin"], isolation: true, resolved: false, riskLevel: "Critical", lastCulture: "2h ago", nurse: "RN Patel", reportedBy: "Blood Culture Flag" },
  { id: "HAI-003", patient: "Diane Foster", age: 58, unit: "SICU-02", infection: "SSI", organism: "K. pneumoniae", onsetDay: 7, site: "Abdominal Incision", wbc: 11800, temp: 38.2, cultures: "Pending", sensitivity: "Pending", antibiotics: ["Cefepime"], isolation: false, resolved: false, riskLevel: "Moderate", lastCulture: "1h ago", nurse: "RN Kim", reportedBy: "Surgical Team" },
  { id: "HAI-004", patient: "Robert Okafor", age: 81, unit: "Med-Surg 4W", infection: "VAP", organism: "P. aeruginosa", onsetDay: 10, site: "Endotracheal Tube", wbc: 16200, temp: 39.1, cultures: "Positive", sensitivity: "Multidrug Resistant", antibiotics: ["Tobramycin", "Pip-Tazo"], isolation: true, resolved: false, riskLevel: "Critical", lastCulture: "3h ago", nurse: "RN Davis", reportedBy: "Ventilator Protocol" },
  { id: "HAI-005", patient: "Sandra Lim", age: 45, unit: "Onc-2", infection: "CDI", organism: "C. difficile", onsetDay: 2, site: "Gastrointestinal", wbc: 9800, temp: 37.8, cultures: "Toxin A/B Positive", sensitivity: "N/A", antibiotics: ["Vancomycin PO"], isolation: true, resolved: false, riskLevel: "Moderate", lastCulture: "6h ago", nurse: "RN Garcia", reportedBy: "Diarrhea Alert" },
  { id: "HAI-006", patient: "Thomas Wright", age: 69, unit: "Cardio-1", infection: "CAUTI", organism: "Enterococcus (VRE)", onsetDay: 8, site: "Urinary Catheter", wbc: 12400, temp: 38.5, cultures: "Positive", sensitivity: "VRE \u2014 Linezolid Sensitive", antibiotics: ["Linezolid"], isolation: true, resolved: true, riskLevel: "Low", lastCulture: "2d ago", nurse: "RN Johnson", reportedBy: "Catheter Audit" },
  { id: "HAI-007", patient: "Angela Rossi", age: 77, unit: "ICU-1B", infection: "CLABSI", organism: "Candida albicans", onsetDay: 6, site: "Central Line \u2014 PICC", wbc: 15600, temp: 38.7, cultures: "Positive", sensitivity: "Fluconazole Sensitive", antibiotics: ["Fluconazole"], isolation: false, resolved: false, riskLevel: "High", lastCulture: "5h ago", nurse: "RN Ahmed", reportedBy: "Blood Culture Flag" },
  { id: "HAI-008", patient: "James Park", age: 55, unit: "Neuro-ICU", infection: "VAP", organism: "A. baumannii", onsetDay: 12, site: "Endotracheal Tube", wbc: 20100, temp: 40.1, cultures: "Positive x3", sensitivity: "Pan-Resistant", antibiotics: ["Colistin"], isolation: true, resolved: false, riskLevel: "Critical", lastCulture: "30m ago", nurse: "RN Nakamura", reportedBy: "Ventilator Protocol" },
];

const STEWARDSHIP_DRUGS = [
  { id: "ABX-001", drug: "Meropenem", drugClass: "Carbapenem", indication: "ESBL E. coli UTI", ddd: 3.0, unitsDispensed: 42, costPerDay: 185.00, spectrum: "Broad", restricted: true, formulary: "Restricted", interventions: 2, deEscalated: false, dot: 14, alerts: ["Auto-stop in 2 days", "ID consult recommended"], pharm: "Pharm Liu" },
  { id: "ABX-002", drug: "Vancomycin", drugClass: "Glycopeptide", indication: "MRSA CLABSI", ddd: 2.0, unitsDispensed: 56, costPerDay: 42.00, spectrum: "Narrow-GP", restricted: false, formulary: "Open", interventions: 1, deEscalated: false, dot: 14, alerts: ["TDM due"], pharm: "Pharm Liu" },
  { id: "ABX-003", drug: "Cefepime", drugClass: "4th-Gen Cephalosporin", indication: "SSI Prophylaxis", ddd: 2.0, unitsDispensed: 30, costPerDay: 28.00, spectrum: "Broad", restricted: false, formulary: "Open", interventions: 0, deEscalated: true, dot: 7, alerts: ["De-escalation target"], pharm: "Pharm Patel" },
  { id: "ABX-004", drug: "Linezolid", drugClass: "Oxazolidinone", indication: "VRE Bacteremia", ddd: 2.0, unitsDispensed: 18, costPerDay: 320.00, spectrum: "Gram Positive", restricted: true, formulary: "Restricted", interventions: 1, deEscalated: false, dot: 9, alerts: ["Platelet monitoring"], pharm: "Pharm Liu" },
  { id: "ABX-005", drug: "Colistin", drugClass: "Polymyxin", indication: "Pan-Resistant A. baumannii", ddd: 9.0, unitsDispensed: 12, costPerDay: 450.00, spectrum: "Last-Resort", restricted: true, formulary: "Restricted \u2014 ID Only", interventions: 3, deEscalated: false, dot: 5, alerts: ["Nephrotoxicity Risk", "ID mandatory", "Renal adjust"], pharm: "Pharm Liu" },
  { id: "ABX-006", drug: "Piperacillin-Tazobactam", drugClass: "Beta-Lactam + Inhibitor", indication: "Pseudomonas VAP", ddd: 4.0, unitsDispensed: 48, costPerDay: 55.00, spectrum: "Broad", restricted: false, formulary: "Open", interventions: 1, deEscalated: true, dot: 10, alerts: ["Reassess combo"], pharm: "Pharm Patel" },
];

const HAND_HYGIENE_OBS = [
  { id: "HH-001", unit: "ICU Block", period: "Aug W3", beforePt: 92, afterPt: 88, beforeAseptic: 95, afterBF: 97, afterContact: 85, totalOpp: 420, compliant: 386, rate: 91.9, hw: 280, sanit: 106, auditors: 4, target: 90, status: "Passing", trend: "Improving", notes: "ICU consistently above target" },
  { id: "HH-002", unit: "Med-Surg 4W", period: "Aug W3", beforePt: 78, afterPt: 72, beforeAseptic: 85, afterBF: 90, afterContact: 70, totalOpp: 350, compliant: 274, rate: 78.3, hw: 180, sanit: 94, auditors: 3, target: 90, status: "Failing", trend: "Declining", notes: "After-contact compliance critically low" },
  { id: "HH-003", unit: "SICU", period: "Aug W3", beforePt: 88, afterPt: 84, beforeAseptic: 92, afterBF: 94, afterContact: 80, totalOpp: 280, compliant: 240, rate: 85.7, hw: 165, sanit: 75, auditors: 3, target: 90, status: "Borderline", trend: "Stable", notes: "Needs improvement in after-contact" },
  { id: "HH-004", unit: "Oncology-2", period: "Aug W3", beforePt: 96, afterPt: 94, beforeAseptic: 98, afterBF: 99, afterContact: 92, totalOpp: 200, compliant: 191, rate: 95.5, hw: 140, sanit: 51, auditors: 2, target: 90, status: "Excellent", trend: "Improving", notes: "Best compliance in hospital" },
  { id: "HH-005", unit: "ED", period: "Aug W3", beforePt: 68, afterPt: 62, beforeAseptic: 75, afterBF: 82, afterContact: 58, totalOpp: 500, compliant: 326, rate: 65.2, hw: 200, sanit: 126, auditors: 5, target: 90, status: "Failing", trend: "Declining", notes: "Urgent intervention needed" },
  { id: "HH-006", unit: "NICU", period: "Aug W3", beforePt: 98, afterPt: 97, beforeAseptic: 99, afterBF: 100, afterContact: 96, totalOpp: 160, compliant: 157, rate: 98.1, hw: 120, sanit: 37, auditors: 2, target: 95, status: "Excellent", trend: "Stable", notes: "Exceeds neonatal target" },
];

const OUTBREAK_EVENTS = [
  { id: "OB-001", pathogen: "S. aureus (MRSA)", type: "Bacterial", units: ["ICU-3A", "ICU-1B", "MICU-07"], cases: 6, source: "HCW Carrier Pending", firstCase: "2026-08-10", lastCase: "2026-08-19", r0: 1.8, status: "Active", phase: "Containment", traced: 42, isolated: 12, prophylaxis: "Mupirocin Decolonization", envClean: "Enhanced Q8H", risk: "High", escalate: 2, lead: "Dr. Nakamura", phNotif: false, update: "2h ago" },
  { id: "OB-002", pathogen: "C. difficile", type: "Bacterial", units: ["Med-Surg 4W", "Cardio-1"], cases: 4, source: "Shared Bathroom", firstCase: "2026-08-12", lastCase: "2026-08-18", r0: 1.2, status: "Active", phase: "Investigation", traced: 18, isolated: 6, prophylaxis: "Fidaxomicin", envClean: "Bleach Q4H", risk: "Moderate", escalate: 1, lead: "Dr. Park", phNotif: false, update: "4h ago" },
  { id: "OB-003", pathogen: "Candida auris", type: "Fungal", units: ["ICU-1B", "ICU-3A"], cases: 3, source: "Colonized Admission", firstCase: "2026-08-08", lastCase: "2026-08-16", r0: 1.5, status: "Contained", phase: "Surveillance", traced: 28, isolated: 8, prophylaxis: "CHG Bathing", envClean: "UV-C + Chemical Q6H", risk: "Critical", escalate: 3, lead: "Dr. Nakamura", phNotif: true, update: "1d ago" },
  { id: "OB-004", pathogen: "RSV", type: "Viral", units: ["PICU", "Ped-2"], cases: 11, source: "Community Surge", firstCase: "2026-08-05", lastCase: "2026-08-20", r0: 2.4, status: "Active", phase: "Surge Mgmt", traced: 55, isolated: 15, prophylaxis: "Palivizumab", envClean: "Air Filtration", risk: "High", escalate: 2, lead: "Dr. Park", phNotif: true, update: "1h ago" },
];

const ENV_AUDITS = [
  { id: "ENV-001", area: "ICU-3A", auditor: "EVS Tech Brown", date: "2026-08-20", method: "ATP Bioluminescence", atp: 142, threshold: 200, status: "Pass", highTouch: 94, terminal: "Passed", bleach: "1000ppm", uv: true, sinceClean: "2h", notes: "Bed rails re-cleaned" },
  { id: "ENV-002", area: "Med-Surg 4W Bath", auditor: "EVS Tech Garcia", date: "2026-08-20", method: "Visual + ATP", atp: 380, threshold: 200, status: "Fail", highTouch: 62, terminal: "Failed \u2014 Retry", bleach: "1000ppm", uv: false, sinceClean: "6h", notes: "Soap dispenser, floor drain" },
  { id: "ENV-003", area: "SICU", auditor: "EVS Tech Nguyen", date: "2026-08-20", method: "ATP Bioluminescence", atp: 88, threshold: 200, status: "Pass", highTouch: 98, terminal: "Passed", bleach: "1000ppm", uv: true, sinceClean: "1h", notes: "Exemplary \u2014 model unit" },
  { id: "ENV-004", area: "ED Triage", auditor: "EVS Tech Brown", date: "2026-08-20", method: "Visual + ATP", atp: 265, threshold: 200, status: "Fail", highTouch: 55, terminal: "Scheduled", bleach: "500ppm", uv: false, sinceClean: "8h", notes: "High turnover \u2014 scheduling Q2H" },
  { id: "ENV-005", area: "Oncology-2", auditor: "EVS Tech Martinez", date: "2026-08-20", method: "ATP Bioluminescence", atp: 65, threshold: 200, status: "Pass", highTouch: 99, terminal: "Passed", bleach: "1000ppm", uv: true, sinceClean: "30m", notes: "Immunocompromised protocol" },
  { id: "ENV-006", area: "NICU", auditor: "EVS Tech Martinez", date: "2026-08-20", method: "ATP + Culture", atp: 45, threshold: 150, status: "Pass", highTouch: 100, terminal: "Passed", bleach: "1000ppm", uv: true, sinceClean: "45m", notes: "NICU stringent threshold met" },
];

/* ── Simulation helpers ── */
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function jitter(base, pct) { return base * (1 + (Math.random() - 0.5) * 2 * pct); }
function simHai(p) { return { ...p, wbc: Math.round(clamp(jitter(p.wbc, 0.03), 4000, 25000)), temp: parseFloat(clamp(jitter(p.temp, 0.008), 36, 41).toFixed(1)) }; }
function simHygiene(h) { return { ...h, rate: parseFloat(clamp(jitter(h.rate, 0.02), 50, 100).toFixed(1)) }; }
function simOutbreak(o) { return { ...o, r0: parseFloat(clamp(jitter(o.r0, 0.05), 0.5, 4).toFixed(1)), traced: Math.round(clamp(jitter(o.traced, 0.03), 5, 100)) }; }

/* ── Tab: HAI Surveillance ── */
function HaiSurveillanceTab({ toasts }) {
  const [data, setData] = useState(HAI_SURVEILLANCE);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [sim, setSim] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [modal, setModal] = useState(null);
  const ref = useRef(null);
  const filters = ["All", "Critical", "High", "Moderate", "Low", "Resolved"];

  const filtered = useMemo(() => data.filter((p) => {
    const s = !search || p.patient.toLowerCase().includes(search.toLowerCase()) || p.infection.toLowerCase().includes(search.toLowerCase()) || p.organism.toLowerCase().includes(search.toLowerCase());
    const f = filter === "All" ? true : filter === "Resolved" ? p.resolved : p.riskLevel === filter;
    return s && f;
  }), [data, search, filter]);

  useEffect(() => {
    if (sim) ref.current = setInterval(() => setData((d) => d.map(simHai)), 2000 / speed);
    return () => clearInterval(ref.current);
  }, [sim, speed]);

  const onExport = useCallback(() => {
    downloadCsv("hai-surveillance.csv", filtered.map((p) => ({ ID: p.id, Patient: p.patient, Age: p.age, Unit: p.unit, Infection: p.infection, Organism: p.organism, Onset: p.onsetDay, Site: p.site, WBC: p.wbc, Temp: p.temp, Cultures: p.cultures, Risk: p.riskLevel, Isolation: p.isolation ? "Yes" : "No", Abx: p.antibiotics.join("; "), Resolved: p.resolved ? "Yes" : "No" })));
    toasts.add({ tone: "success", text: "HAI data exported" });
  }, [filtered, toasts]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <CompactSearch value={search} onChange={setSearch} placeholder="Search patient, infection, organism..." />
        <FilterChips options={filters} value={filter} onChange={setFilter} />
        <div className="ml-auto flex items-center gap-2">
          <ExportCsvButton onClick={onExport} />
          <button onClick={() => setSim((s) => !s)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition ${sim ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30"}`}>
            {sim ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />} {sim ? "Pause" : "Simulate"}
          </button>
          {sim && <div className="flex items-center gap-1 bg-slate-800 rounded-lg border border-slate-700 px-1">
            {[1, 2, 4].map((s) => <button key={s} onClick={() => setSpeed(s)} className={`px-2 py-1 text-xs rounded-md font-medium transition ${speed === s ? "bg-cyan-500/20 text-cyan-400" : "text-slate-400 hover:text-slate-200"}`}>{s}x</button>)}
          </div>}
          {sim && <button onClick={() => setData(HAI_SURVEILLANCE)} className="flex items-center gap-1 px-2 py-1.5 text-xs text-slate-400 hover:text-slate-200"><RefreshCw className="w-3 h-3" /> Reset</button>}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((p) => (
          <div key={p.id} onClick={() => setModal(p)} className="bg-slate-900 border border-slate-800 rounded-xl p-4 cursor-pointer hover:border-slate-600 transition group">
            <div className="flex items-start justify-between mb-3">
              <div><p className="text-sm font-semibold text-slate-100 group-hover:text-red-400 transition">{p.patient}</p><p className="text-xs text-slate-500">{p.id} \u00b7 {p.unit} \u00b7 Age {p.age}</p></div>
              <ToneBadge tone={p.riskLevel === "Critical" ? "red" : p.riskLevel === "High" ? "amber" : p.riskLevel === "Moderate" ? "yellow" : "green"}>{p.riskLevel}</ToneBadge>
            </div>
            <div className="bg-slate-950/50 rounded-lg p-3 mb-3">
              <div className="flex items-center justify-between mb-1"><span className="text-xs text-slate-500">Infection</span><span className="text-sm font-bold text-red-400">{p.infection}</span></div>
              <p className="text-xs text-slate-400 mb-2">{p.organism}</p>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="text-center"><p className="text-slate-500">Temp</p><p className={`font-mono font-bold ${p.temp >= 39 ? "text-red-400" : p.temp >= 38 ? "text-amber-400" : "text-emerald-400"}`}>{p.temp}\u00b0C</p></div>
                <div className="text-center"><p className="text-slate-500">WBC</p><p className={`font-mono font-bold ${p.wbc >= 15000 ? "text-red-400" : p.wbc >= 11000 ? "text-amber-400" : "text-emerald-400"}`}>{p.wbc.toLocaleString()}</p></div>
                <div className="text-center"><p className="text-slate-500">Day</p><p className="font-mono font-bold text-slate-300">{p.onsetDay}</p></div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1"><Bug className="w-3 h-3" /><span className="truncate">{p.site}</span></div>
            <div className="flex items-center gap-2 text-xs text-slate-500"><Syringe className="w-3 h-3" /><span className="truncate">{p.antibiotics.join(", ")}</span></div>
            <div className="flex items-center gap-2 mt-2">
              {p.isolation && <ToneBadge tone="red">Isolation</ToneBadge>}
              {p.resolved && <ToneBadge tone="green">Resolved</ToneBadge>}
              <ToneBadge tone={p.sensitivity.includes("Resistant") ? "red" : "green"}>{p.sensitivity.split(" \u2014 ")[0]}</ToneBadge>
            </div>
          </div>
        ))}
      </div>
      {filtered.length === 0 && <EmptyState message="No HAI cases match your filters" icon={Bug} />}
      {modal && <Modal title={`HAI \u2014 ${modal.patient}`} subtitle={`${modal.id} \u00b7 ${modal.infection}`} onClose={() => setModal(null)}>
        <div className="space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <Row label="Infection" value={modal.infection} /><Row label="Organism" value={modal.organism} />
            <Row label="Site" value={modal.site} /><Row label="Onset" value={`Day ${modal.onsetDay}`} />
            <Row label="Temperature" value={`${modal.temp}\u00b0C`} /><Row label="WBC" value={modal.wbc.toLocaleString()} />
            <Row label="Cultures" value={modal.cultures} /><Row label="Sensitivity" value={modal.sensitivity} />
          </div>
          <div className="border-t border-slate-800 pt-3 grid grid-cols-2 gap-3">
            <Row label="Antibiotics" value={modal.antibiotics.join(", ")} /><Row label="Isolation" value={modal.isolation ? "Contact + Droplet" : "Standard"} />
            <Row label="Risk" value={modal.riskLevel} /><Row label="Nurse" value={modal.nurse} />
            <Row label="Reported By" value={modal.reportedBy} /><Row label="Last Culture" value={modal.lastCulture} />
          </div>
        </div>
      </Modal>}
    </div>
  );
}

/* ── Tab: Antimicrobial Stewardship ── */
function StewardshipTab({ toasts }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [modal, setModal] = useState(null);
  const filters = ["All", "Restricted", "De-Escalated", "High-Cost", "Last-Resort"];
  const filtered = useMemo(() => STEWARDSHIP_DRUGS.filter((d) => {
    const s = !search || d.drug.toLowerCase().includes(search.toLowerCase()) || d.indication.toLowerCase().includes(search.toLowerCase());
    const f = filter === "All" ? true : filter === "Restricted" ? d.restricted : filter === "De-Escalated" ? d.deEscalated : filter === "High-Cost" ? d.costPerDay >= 100 : d.spectrum === "Last-Resort";
    return s && f;
  }), [search, filter]);
  const onExport = useCallback(() => {
    downloadCsv("stewardship.csv", filtered.map((d) => ({ Drug: d.drug, Class: d.drugClass, Indication: d.indication, DDD: d.ddd, Cost: `$${d.costPerDay}`, Restricted: d.restricted ? "Yes" : "No", DOT: d.dot, Interventions: d.interventions, DeEsc: d.deEscalated ? "Yes" : "No", Pharm: d.pharm })));
    toasts.add({ tone: "success", text: "Stewardship data exported" });
  }, [filtered, toasts]);
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
        <StatCard icon={Pill} label="Restricted Drugs" value={STEWARDSHIP_DRUGS.filter((d) => d.restricted).length} accent="text-amber-400" />
        <StatCard icon={TrendingDown} label="De-Escalated" value={STEWARDSHIP_DRUGS.filter((d) => d.deEscalated).length} accent="text-emerald-400" />
        <StatCard icon={AlertTriangle} label="Total Interventions" value={STEWARDSHIP_DRUGS.reduce((s, d) => s + d.interventions, 0)} accent="text-red-400" />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <CompactSearch value={search} onChange={setSearch} placeholder="Search drug, indication..." />
        <FilterChips options={filters} value={filter} onChange={setFilter} />
        <div className="ml-auto"><ExportCsvButton onClick={onExport} /></div>
      </div>
      <div className="space-y-3">
        {filtered.map((d) => (
          <div key={d.id} onClick={() => setModal(d)} className="bg-slate-900 border border-slate-800 rounded-xl p-4 cursor-pointer hover:border-slate-600 transition group">
            <div className="flex flex-col md:flex-row md:items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-semibold text-slate-100 group-hover:text-cyan-400 transition">{d.drug}</p>
                  <ToneBadge tone={d.restricted ? "amber" : "green"}>{d.restricted ? "Restricted" : "Open"}</ToneBadge>
                  {d.deEscalated && <ToneBadge tone="cyan">De-Escalated</ToneBadge>}
                </div>
                <p className="text-xs text-slate-500">{d.drugClass} \u00b7 {d.indication}</p>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <div className="text-center"><p className="text-slate-500">DDD</p><p className="font-mono font-bold text-slate-200">{d.ddd}</p></div>
                <div className="text-center"><p className="text-slate-500">Cost/Day</p><p className={`font-mono font-bold ${d.costPerDay >= 100 ? "text-red-400" : "text-emerald-400"}`}>${d.costPerDay}</p></div>
                <div className="text-center"><p className="text-slate-500">DOT</p><p className="font-mono font-bold text-slate-200">{d.dot}d</p></div>
              </div>
              <div className="flex items-center gap-2">
                {d.alerts.length > 0 && <ToneBadge tone="red">{d.alerts.length} Alert{d.alerts.length > 1 ? "s" : ""}</ToneBadge>}
                <ToneBadge tone="purple">{d.formulary.split(" \u2014 ")[0]}</ToneBadge>
              </div>
            </div>
          </div>
        ))}
      </div>
      {filtered.length === 0 && <EmptyState message="No antimicrobials match your filters" icon={Pill} />}
      {modal && <Modal title={`Stewardship \u2014 ${modal.drug}`} subtitle={modal.drugClass} onClose={() => setModal(null)}>
        <div className="space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <Row label="Drug" value={modal.drug} /><Row label="Class" value={modal.drugClass} />
            <Row label="Indication" value={modal.indication} /><Row label="DDD" value={`${modal.ddd} g`} />
            <Row label="Units Dispensed" value={modal.unitsDispensed} /><Row label="Cost/Day" value={`$${modal.costPerDay}`} />
            <Row label="Days of Therapy" value={`${modal.dot} days`} /><Row label="Spectrum" value={modal.spectrum} />
          </div>
          <div className="border-t border-slate-800 pt-3 grid grid-cols-2 gap-3">
            <Row label="Restricted" value={modal.restricted ? "Yes" : "No"} /><Row label="Formulary" value={modal.formulary} />
            <Row label="Interventions" value={modal.interventions} /><Row label="De-Escalated" value={modal.deEscalated ? "Yes" : "No"} />
            <Row label="Pharmacist" value={modal.pharm} />
          </div>
          {modal.alerts.length > 0 && <div className="border-t border-slate-800 pt-3">
            <h4 className="text-xs font-semibold text-slate-400 uppercase mb-2">Active Alerts</h4>
            <ul className="space-y-1">{modal.alerts.map((a, i) => <li key={i} className="flex items-start gap-2 text-xs text-amber-400"><AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" /><span>{a}</span></li>)}</ul>
          </div>}
        </div>
      </Modal>}
    </div>
  );
}

/* ── Tab: Hand Hygiene Compliance ── */
function HandHygieneTab({ toasts }) {
  const [data, setData] = useState(HAND_HYGIENE_OBS);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [sim, setSim] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [modal, setModal] = useState(null);
  const ref = useRef(null);
  const filters = ["All", "Passing", "Failing", "Borderline", "Excellent"];
  const filtered = useMemo(() => data.filter((h) => {
    const s = !search || h.unit.toLowerCase().includes(search.toLowerCase());
    const f = filter === "All" || h.status === filter;
    return s && f;
  }), [data, search, filter]);
  useEffect(() => {
    if (sim) ref.current = setInterval(() => setData((d) => d.map(simHygiene)), 2000 / speed);
    return () => clearInterval(ref.current);
  }, [sim, speed]);
  const onExport = useCallback(() => {
    downloadCsv("hand-hygiene.csv", filtered.map((h) => ({ Unit: h.unit, Period: h.period, Before: `${h.beforePt}%`, After: `${h.afterPt}%`, Aseptic: `${h.beforeAseptic}%`, "Body Fluid": `${h.afterBF}%`, Contact: `${h.afterContact}%`, Rate: `${h.rate}%`, Target: `${h.target}%`, Status: h.status, Trend: h.trend })));
    toasts.add({ tone: "success", text: "Hand hygiene data exported" });
  }, [filtered, toasts]);
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <CompactSearch value={search} onChange={setSearch} placeholder="Search unit..." />
        <FilterChips options={filters} value={filter} onChange={setFilter} />
        <div className="ml-auto flex items-center gap-2">
          <ExportCsvButton onClick={onExport} />
          <button onClick={() => setSim((s) => !s)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition ${sim ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30"}`}>
            {sim ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />} {sim ? "Pause" : "Simulate"}
          </button>
          {sim && <div className="flex items-center gap-1 bg-slate-800 rounded-lg border border-slate-700 px-1">
            {[1, 2, 4].map((s) => <button key={s} onClick={() => setSpeed(s)} className={`px-2 py-1 text-xs rounded-md font-medium transition ${speed === s ? "bg-cyan-500/20 text-cyan-400" : "text-slate-400 hover:text-slate-200"}`}>{s}x</button>)}
          </div>}
          {sim && <button onClick={() => setData(HAND_HYGIENE_OBS)} className="flex items-center gap-1 px-2 py-1.5 text-xs text-slate-400 hover:text-slate-200"><RefreshCw className="w-3 h-3" /> Reset</button>}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((h) => (
          <div key={h.id} onClick={() => setModal(h)} className="bg-slate-900 border border-slate-800 rounded-xl p-4 cursor-pointer hover:border-slate-600 transition group">
            <div className="flex items-start justify-between mb-3">
              <div><p className="text-sm font-semibold text-slate-100 group-hover:text-cyan-400 transition">{h.unit}</p><p className="text-xs text-slate-500">{h.period} \u00b7 {h.totalOpp} opportunities</p></div>
              <ToneBadge tone={h.status === "Excellent" ? "green" : h.status === "Passing" ? "emerald" : h.status === "Failing" ? "red" : "amber"}>{h.status}</ToneBadge>
            </div>
            <div className="bg-slate-950/50 rounded-lg p-3 mb-3">
              <div className="flex items-center justify-between mb-2"><span className="text-xs text-slate-500">Compliance</span><span className={`text-lg font-mono font-bold ${h.rate >= h.target ? "text-emerald-400" : "text-red-400"}`}>{h.rate}%</span></div>
              <div className="w-full bg-slate-800 rounded-full h-2"><div className={`h-2 rounded-full transition-all ${h.rate >= h.target ? "bg-emerald-500" : "bg-red-500"}`} style={{ width: `${Math.min(h.rate, 100)}%` }} /></div>
              <p className="text-xs text-slate-500 mt-1">Target: {h.target}%</p>
            </div>
            <div className="grid grid-cols-5 gap-1 text-center text-xs">
              <div><p className="text-slate-500 text-[10px]">PrePt</p><p className="font-mono font-bold text-slate-300">{h.beforePt}%</p></div>
              <div><p className="text-slate-500 text-[10px]">PostPt</p><p className="font-mono font-bold text-slate-300">{h.afterPt}%</p></div>
              <div><p className="text-slate-500 text-[10px]">Aseptic</p><p className="font-mono font-bold text-slate-300">{h.beforeAseptic}%</p></div>
              <div><p className="text-slate-500 text-[10px]">BodyFl</p><p className="font-mono font-bold text-slate-300">{h.afterBF}%</p></div>
              <div><p className="text-slate-500 text-[10px]">Contact</p><p className={`font-mono font-bold ${h.afterContact >= 85 ? "text-emerald-400" : h.afterContact >= 70 ? "text-amber-400" : "text-red-400"}`}>{h.afterContact}%</p></div>
            </div>
            <div className="flex items-center justify-between mt-3 text-xs text-slate-500">
              <span>{h.auditors} auditors</span>
              <ToneBadge tone={h.trend === "Improving" ? "green" : h.trend === "Declining" ? "red" : "yellow"}>{h.trend}</ToneBadge>
            </div>
          </div>
        ))}
      </div>
      {filtered.length === 0 && <EmptyState message="No hand hygiene units match your filters" icon={Hand} />}
      {modal && <Modal title={`Hand Hygiene \u2014 ${modal.unit}`} subtitle={modal.period} onClose={() => setModal(null)}>
        <div className="space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <Row label="Overall" value={`${modal.rate}%`} /><Row label="Target" value={`${modal.target}%`} />
            <Row label="Opportunities" value={modal.totalOpp} /><Row label="Compliant" value={modal.compliant} />
            <Row label="Before Patient" value={`${modal.beforePt}%`} /><Row label="After Patient" value={`${modal.afterPt}%`} />
            <Row label="Before Aseptic" value={`${modal.beforeAseptic}%`} /><Row label="After Body Fluid" value={`${modal.afterBF}%`} />
            <Row label="After Contact" value={`${modal.afterContact}%`} /><Row label="Auditors" value={modal.auditors} />
          </div>
          <div className="border-t border-slate-800 pt-3 grid grid-cols-2 gap-3">
            <Row label="Handwash" value={modal.hw} /><Row label="Sanitizer" value={modal.sanit} />
            <Row label="Status" value={modal.status} /><Row label="Trend" value={modal.trend} /><Row label="Notes" value={modal.notes} />
          </div>
        </div>
      </Modal>}
    </div>
  );
}

/* ── Tab: Outbreak Management ── */
function OutbreakTab({ toasts }) {
  const [data, setData] = useState(OUTBREAK_EVENTS);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [sim, setSim] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [modal, setModal] = useState(null);
  const ref = useRef(null);
  const filters = ["All", "Active", "Contained", "Critical", "High"];
  const filtered = useMemo(() => data.filter((o) => {
    const s = !search || o.pathogen.toLowerCase().includes(search.toLowerCase()) || o.units.some((u) => u.toLowerCase().includes(search.toLowerCase()));
    const f = filter === "All" ? true : filter === "Active" || filter === "Contained" ? o.status === filter : o.risk === filter;
    return s && f;
  }), [data, search, filter]);
  useEffect(() => {
    if (sim) ref.current = setInterval(() => setData((d) => d.map(simOutbreak)), 2000 / speed);
    return () => clearInterval(ref.current);
  }, [sim, speed]);
  const onExport = useCallback(() => {
    downloadCsv("outbreaks.csv", filtered.map((o) => ({ Pathogen: o.pathogen, Type: o.type, Units: o.units.join("; "), Cases: o.cases, R0: o.r0, Status: o.status, Phase: o.phase, Traced: o.traced, Isolated: o.isolated, Risk: o.risk, Escalation: o.escalate, Lead: o.lead, PH: o.phNotif ? "Yes" : "No" })));
    toasts.add({ tone: "success", text: "Outbreak data exported" });
  }, [filtered, toasts]);
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <CompactSearch value={search} onChange={setSearch} placeholder="Search pathogen, unit..." />
        <FilterChips options={filters} value={filter} onChange={setFilter} />
        <div className="ml-auto flex items-center gap-2">
          <ExportCsvButton onClick={onExport} />
          <button onClick={() => setSim((s) => !s)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition ${sim ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30"}`}>
            {sim ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />} {sim ? "Pause" : "Simulate"}
          </button>
          {sim && <div className="flex items-center gap-1 bg-slate-800 rounded-lg border border-slate-700 px-1">
            {[1, 2, 4].map((s) => <button key={s} onClick={() => setSpeed(s)} className={`px-2 py-1 text-xs rounded-md font-medium transition ${speed === s ? "bg-cyan-500/20 text-cyan-400" : "text-slate-400 hover:text-slate-200"}`}>{s}x</button>)}
          </div>}
          {sim && <button onClick={() => setData(OUTBREAK_EVENTS)} className="flex items-center gap-1 px-2 py-1.5 text-xs text-slate-400 hover:text-slate-200"><RefreshCw className="w-3 h-3" /> Reset</button>}
        </div>
      </div>
      <div className="space-y-4">
        {filtered.map((o) => (
          <div key={o.id} onClick={() => setModal(o)} className="bg-slate-900 border border-slate-800 rounded-xl p-5 cursor-pointer hover:border-slate-600 transition group">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-base font-semibold text-slate-100 group-hover:text-red-400 transition">{o.pathogen}</p>
                  <ToneBadge tone={o.status === "Active" ? "red" : "green"}>{o.status}</ToneBadge>
                  <ToneBadge tone={o.risk === "Critical" ? "red" : o.risk === "High" ? "amber" : "yellow"}>{o.risk}</ToneBadge>
                </div>
                <p className="text-xs text-slate-500">{o.type} \u00b7 Phase: {o.phase} \u00b7 Lead: {o.lead}</p>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <div className="text-center"><p className="text-slate-500">Cases</p><p className="font-mono font-bold text-red-400 text-lg">{o.cases}</p></div>
                <div className="text-center"><p className="text-slate-500">R\u2080</p><p className={`font-mono font-bold text-lg ${o.r0 >= 2 ? "text-red-400" : o.r0 >= 1 ? "text-amber-400" : "text-emerald-400"}`}>{o.r0}</p></div>
                <div className="text-center"><p className="text-slate-500">Traced</p><p className="font-mono font-bold text-slate-200 text-lg">{o.traced}</p></div>
                <div className="text-center"><p className="text-slate-500">Isolated</p><p className="font-mono font-bold text-amber-400 text-lg">{o.isolated}</p></div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-2"><span>Units: {o.units.join(", ")}</span></div>
            <div className="flex flex-wrap gap-2 text-xs">
              <ToneBadge tone="purple">Level {o.escalate}</ToneBadge>
              {o.phNotif && <ToneBadge tone="cyan">PH Notified</ToneBadge>}
              <ToneBadge tone="slate">{o.firstCase} \u2192 {o.lastCase}</ToneBadge>
            </div>
            <p className="text-xs text-slate-600 mt-2">Last update: {o.update}</p>
          </div>
        ))}
      </div>
      {filtered.length === 0 && <EmptyState message="No outbreak events match your filters" icon={Siren} />}
      {modal && <Modal title={`Outbreak \u2014 ${modal.pathogen}`} subtitle={modal.id} onClose={() => setModal(null)}>
        <div className="space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <Row label="Pathogen" value={modal.pathogen} /><Row label="Type" value={modal.type} />
            <Row label="Cases" value={modal.cases} /><Row label="R\u2080" value={modal.r0} />
            <Row label="First Case" value={modal.firstCase} /><Row label="Last Case" value={modal.lastCase} />
            <Row label="Units" value={modal.units.join(", ")} /><Row label="Status" value={modal.status} />
            <Row label="Phase" value={modal.phase} /><Row label="Escalation" value={modal.escalate} />
            <Row label="Risk" value={modal.risk} /><Row label="Lead" value={modal.lead} />
          </div>
          <div className="border-t border-slate-800 pt-3 grid grid-cols-2 gap-3">
            <Row label="Traced" value={`${modal.traced} contacts`} /><Row label="Isolated" value={`${modal.isolated} patients`} />
            <Row label="Prophylaxis" value={modal.prophylaxis} /><Row label="Env Cleaning" value={modal.envClean} />
            <Row label="Source" value={modal.source} /><Row label="PH Notified" value={modal.phNotif ? "Yes" : "No"} />
          </div>
        </div>
      </Modal>}
    </div>
  );
}

/* ── Tab: Environmental Cleaning Audits ── */
function EnvironmentalTab({ toasts }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [modal, setModal] = useState(null);
  const filters = ["All", "Pass", "Fail"];
  const filtered = useMemo(() => ENV_AUDITS.filter((e) => {
    const s = !search || e.area.toLowerCase().includes(search.toLowerCase()) || e.auditor.toLowerCase().includes(search.toLowerCase());
    const f = filter === "All" || e.status === filter;
    return s && f;
  }), [search, filter]);
  const onExport = useCallback(() => {
    downloadCsv("env-audits.csv", filtered.map((e) => ({ Area: e.area, Auditor: e.auditor, Date: e.date, Method: e.method, ATP: e.atp, Threshold: e.threshold, Status: e.status, "High-Touch": `${e.highTouch}%`, Terminal: e.terminal, Bleach: e.bleach, UV: e.uv ? "Yes" : "No", Notes: e.notes })));
    toasts.add({ tone: "success", text: "Environmental audit data exported" });
  }, [filtered, toasts]);
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
        <StatCard icon={CheckCircle2} label="Audits Passed" value={ENV_AUDITS.filter((e) => e.status === "Pass").length} accent="text-emerald-400" />
        <StatCard icon={AlertTriangle} label="Audits Failed" value={ENV_AUDITS.filter((e) => e.status === "Fail").length} accent="text-red-400" />
        <StatCard icon={Gauge} label="Avg ATP" value={Math.round(ENV_AUDITS.reduce((s, e) => s + e.atp, 0) / ENV_AUDITS.length)} accent="text-cyan-400" />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <CompactSearch value={search} onChange={setSearch} placeholder="Search area, auditor..." />
        <FilterChips options={filters} value={filter} onChange={setFilter} />
        <div className="ml-auto"><ExportCsvButton onClick={onExport} /></div>
      </div>
      <div className="space-y-3">
        {filtered.map((e) => (
          <div key={e.id} onClick={() => setModal(e)} className="bg-slate-900 border border-slate-800 rounded-xl p-4 cursor-pointer hover:border-slate-600 transition group flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-sm font-semibold text-slate-100 group-hover:text-cyan-400 transition">{e.area}</p>
                <ToneBadge tone={e.status === "Pass" ? "green" : "red"}>{e.status}</ToneBadge>
              </div>
              <p className="text-xs text-slate-500">{e.auditor} \u00b7 {e.date} \u00b7 {e.method}</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="text-center"><p className="text-slate-500">ATP</p><p className={`font-mono font-bold ${e.atp <= e.threshold ? "text-emerald-400" : "text-red-400"}`}>{e.atp}</p></div>
              <div className="text-center"><p className="text-slate-500">Threshold</p><p className="font-mono font-bold text-slate-300">{e.threshold}</p></div>
              <div className="text-center"><p className="text-slate-500">High-Touch</p><p className={`font-mono font-bold ${e.highTouch >= 90 ? "text-emerald-400" : e.highTouch >= 70 ? "text-amber-400" : "text-red-400"}`}>{e.highTouch}%</p></div>
            </div>
            <div className="flex items-center gap-2">
              <ToneBadge tone={e.uv ? "green" : "amber"}>{e.uv ? "UV Done" : "UV Pending"}</ToneBadge>
              <ToneBadge tone="slate">{e.bleach}</ToneBadge>
            </div>
          </div>
        ))}
      </div>
      {filtered.length === 0 && <EmptyState message="No environmental audits match your filters" icon={ShieldCheck} />}
      {modal && <Modal title={`Env Audit \u2014 ${modal.area}`} subtitle={modal.id} onClose={() => setModal(null)}>
        <div className="space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <Row label="Area" value={modal.area} /><Row label="Auditor" value={modal.auditor} />
            <Row label="Date" value={modal.date} /><Row label="Method" value={modal.method} />
            <Row label="ATP Score" value={`${modal.atp} RLU`} /><Row label="Threshold" value={`${modal.threshold} RLU`} />
            <Row label="Status" value={modal.status} /><Row label="High-Touch" value={`${modal.highTouch}%`} />
            <Row label="Terminal Clean" value={modal.terminal} /><Row label="Bleach" value={modal.bleach} />
            <Row label="UV-C Cycle" value={modal.uv ? "Complete" : "Pending"} /><Row label="Since Clean" value={modal.sinceClean} />
          </div>
          <div className="border-t border-slate-800 pt-3"><Row label="Notes" value={modal.notes} /></div>
        </div>
      </Modal>}
    </div>
  );
}

/* ── Main component ── */
export default function InfectionControlStewardshipHub() {
  const [activeTab, setActiveTab] = useState("hai");
  const toasts = useToastTray();
  const tabs = [
    { key: "hai", label: "HAI Surveillance", icon: Bug },
    { key: "stewardship", label: "Antimicrobial Rx", icon: Pill },
    { key: "hygiene", label: "Hand Hygiene", icon: Hand },
    { key: "outbreak", label: "Outbreak Mgmt", icon: Siren },
    { key: "environmental", label: "Env. Cleaning", icon: ShieldCheck },
  ];
  const stats = useMemo(() => ({
    critHai: HAI_SURVEILLANCE.filter((p) => p.riskLevel === "Critical").length,
    activeOb: OUTBREAK_EVENTS.filter((o) => o.status === "Active").length,
    totalCases: OUTBREAK_EVENTS.reduce((s, o) => s + o.cases, 0),
    failHH: HAND_HYGIENE_OBS.filter((h) => h.status === "Failing").length,
  }), []);
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <ToastTray toasts={toasts} />
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <PageHeader icon={Bug} title="Infection Control & Antimicrobial Stewardship" subtitle="HAI surveillance, antibiotic stewardship, hand hygiene compliance, outbreak management, and environmental cleaning audits" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard icon={AlertTriangle} label="Critical HAI" value={stats.critHai} accent="text-red-400" />
          <StatCard icon={Siren} label="Active Outbreaks" value={stats.activeOb} accent="text-amber-400" />
          <StatCard icon={Bug} label="Total Cases" value={stats.totalCases} accent="text-red-400" />
          <StatCard icon={Hand} label="Failing HH Units" value={stats.failHH} accent="text-cyan-400" />
        </div>
        <TabsBar tabs={tabs} active={activeTab} onChange={setActiveTab} />
        <div className="bg-slate-950">
          {activeTab === "hai" && <HaiSurveillanceTab toasts={toasts} />}
          {activeTab === "stewardship" && <StewardshipTab toasts={toasts} />}
          {activeTab === "hygiene" && <HandHygieneTab toasts={toasts} />}
          {activeTab === "outbreak" && <OutbreakTab toasts={toasts} />}
          {activeTab === "environmental" && <EnvironmentalTab toasts={toasts} />}
        </div>
        <Footer>Infection Control & Antimicrobial Stewardship Hub \u00b7 MedTrack Application \u00b7 N/A \u2014 Clinical Console</Footer>
      </div>
    </div>
  );
}
