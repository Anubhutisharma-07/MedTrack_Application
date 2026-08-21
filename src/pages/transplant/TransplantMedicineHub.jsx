import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity, AlertTriangle, Brain, Calendar, CheckCircle2, Clock,
  FileText, Filter, Gauge, Pause, Play, RefreshCw, Search, Shield,
  ShieldCheck, Siren, Stethoscope, Syringe, Thermometer, TrendingDown,
  TrendingUp, User, Users, Zap, Pill, Heart, HeartPulse, Target,
  Droplets, Timer, Award, ChevronRight, Download, MapPin, Truck, ShieldAlert,
  Box, ThermometerSnowflake, CircleDot, Crosshair, Layers, Eye,
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

/* ------------------------------------------------------------------ *
 *  MedTrack Transplant Medicine Command Hub
 *  ------------------------------------------------------------------
 *  Five consoles for transplant programme oversight:
 *    1. Waitlist           – organ waitlist queue with priority, CPRA,
 *                           sensitisation and comorbidity data.
 *    2. Donor Matching     – donor offers, HLA match scoring and
 *                           organ-specific allocation review.
 *    3. Post-Transplant    – recipient vitals, immunosuppression
 *                           levels and rejection / infection flags.
 *    4. GVHD Management    – graft-versus-host disease grading,
 *                           treatment protocols and response tracking.
 *    5. Organ Procurement  – cold ischaemia, preservation method,
 *                           crossmatch and transport logistics.
 * ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ *
 *  Seed data
 * ------------------------------------------------------------------ */

const WAITLIST = [
  { id: "WL-001", name: "James Mitchell", age: 58, sex: "M", organ: "Kidney", bloodType: "O+", status: "Active", listDate: "2025-11-15", waitingDays: 279, priority: "High", sensitization: "12%", cpra: 15, dialysis: true, comorbidities: ["Diabetes Type 2", "Hypertension"], coordinator: "TX Coord Williams" },
  { id: "WL-002", name: "Patricia Nakamura", age: 52, sex: "F", organ: "Liver", bloodType: "A-", status: "Active", listDate: "2026-01-10", waitingDays: 223, priority: "Critical", sensitization: "45%", cpra: 62, dialysis: false, comorbidities: ["NASH Cirrhosis", "Ascites"], coordinator: "TX Coord Garcia" },
  { id: "WL-003", name: "Robert Chen", age: 45, sex: "M", organ: "Heart", bloodType: "B+", status: "Status 1A", listDate: "2026-07-01", waitingDays: 50, priority: "Critical", sensitization: "8%", cpra: 5, dialysis: false, comorbidities: ["Ischemic Cardiomyopathy", "LVAD"], coordinator: "TX Coord Lee" },
  { id: "WL-004", name: "Angela Dubois", age: 67, sex: "F", organ: "Kidney-Pancreas", bloodType: "AB+", status: "Active", listDate: "2025-09-20", waitingDays: 335, priority: "Moderate", sensitization: "22%", cpra: 28, dialysis: true, comorbidities: ["Type 1 Diabetes", "ESRD"], coordinator: "TX Coord Williams" },
  { id: "WL-005", name: "William Park", age: 38, sex: "M", organ: "Liver", bloodType: "O-", status: "Active", listDate: "2026-03-05", waitingDays: 168, priority: "High", sensitization: "3%", cpra: 2, dialysis: false, comorbidities: ["Autoimmune Hepatitis"], coordinator: "TX Coord Patel" },
  { id: "WL-006", name: "Dorothy Wilson", age: 71, sex: "F", organ: "Lung", bloodType: "A+", status: "Status 1B", listDate: "2026-06-15", waitingDays: 66, priority: "Critical", sensitization: "18%", cpra: 22, dialysis: false, comorbidities: ["COPD", "Pulmonary Fibrosis"], coordinator: "TX Coord Garcia" },
  { id: "WL-007", name: "Marcus Thompson", age: 29, sex: "M", organ: "Kidney", bloodType: "B-", status: "Active", listDate: "2026-02-14", waitingDays: 188, priority: "Moderate", sensitization: "67%", cpra: 78, dialysis: true, comorbidities: ["FSGS", "Hypertension"], coordinator: "TX Coord Lee" },
  { id: "WL-008", name: "Evelyn Rossi", age: 62, sex: "F", organ: "Heart", bloodType: "O+", status: "Status 1A", listDate: "2026-08-01", waitingDays: 19, priority: "Critical", sensitization: "5%", cpra: 3, dialysis: false, comorbidities: ["Dilated Cardiomyopathy", "EF 12%"], coordinator: "TX Coord Patel" },
];

const DONOR_CASES = [
  { id: "DN-001", donorId: "D-88421", age: 34, sex: "M", bloodType: "O+", organ: "Kidney", mechanism: "CVA", BMI: 24, creatinine: 1.1, hcv: false, cmv: true, matchScore: 94, matchReasons: ["Zero mismatch HLA", "Low PRA recipient"], status: "Offered" },
  { id: "DN-002", donorId: "D-88422", age: 52, sex: "F", bloodType: "A-", organ: "Liver", mechanism: "Anoxia", BMI: 28, creatinine: 1.8, hcv: false, cmv: false, matchScore: 78, matchReasons: ["ABO compatible", "Size match adequate"], status: "Under Review" },
  { id: "DN-003", donorId: "D-88423", age: 22, sex: "M", bloodType: "B+", organ: "Heart", mechanism: "Trauma", BMI: 22, creatinine: 0.9, hcv: false, cmv: true, matchScore: 98, matchReasons: ["Perfect HLA match", "Low ischemia"], status: "Approved" },
  { id: "DN-004", donorId: "D-88424", age: 48, sex: "F", bloodType: "AB+", organ: "Kidney-Pancreas", mechanism: "CVA", BMI: 31, creatinine: 2.2, hcv: false, cmv: true, matchScore: 65, matchReasons: ["ABO compatible", "High BMI concern"], status: "Conditional" },
  { id: "DN-005", donorId: "D-88425", age: 18, sex: "M", bloodType: "O-", organ: "Lung", mechanism: "Trauma", BMI: 21, creatinine: 0.7, hcv: false, cmv: false, matchScore: 91, matchReasons: ["Ideal donor age", "Low ischemia"], status: "Offered" },
  { id: "DN-006", donorId: "D-88426", age: 61, sex: "F", bloodType: "A+", organ: "Liver (split)", mechanism: "Anoxia", BMI: 26, creatinine: 1.5, hcv: true, cmv: true, matchScore: 58, matchReasons: ["HCV positive donor", "Older donor age"], status: "Declined" },
];

const POST_TX = [
  { id: "PT-001", name: "Sarah Kim", age: 42, organ: "Kidney", txDate: "2026-06-15", txDay: 66, donor: "Living", immunosuppression: ["Tacrolimus 4mg BID", "MMF 500mg BID", "Pred 5mg QD"], tacLevel: 8.2, creatinine: 1.1, gfr: 72, glucose: 110, rejection: false, infection: false, cmv: "Positive - treated", compliance: "Excellent", riskScore: "Low" },
  { id: "PT-002", name: "Michael Brown", age: 55, organ: "Liver", txDate: "2026-04-20", txDay: 122, donor: "Deceased", immunosuppression: ["Tacrolimus 3mg BID", "MMF 750mg BID"], tacLevel: 6.8, creatinine: 1.4, gfr: 58, glucose: 135, rejection: false, infection: true, cmv: "Negative", compliance: "Good", riskScore: "Moderate" },
  { id: "PT-003", name: "Linda Garcia", age: 38, organ: "Heart", txDate: "2026-08-01", txDay: 50, donor: "Deceased", immunosuppression: ["Tacrolimus 5mg BID", "MMF 1000mg BID", "Pred 10mg QD", "Everolimus 1mg BID"], tacLevel: 11.2, creatinine: 1.6, gfr: 52, glucose: 148, rejection: true, infection: false, cmv: "Indeterminate", compliance: "Fair", riskScore: "High" },
  { id: "PT-004", name: "David Chen", age: 61, organ: "Kidney-Pancreas", txDate: "2026-03-10", txDay: 163, donor: "Deceased", immunosuppression: ["Tacrolimus 3mg BID", "Sirolimus 2mg QD"], tacLevel: 7.5, creatinine: 1.0, gfr: 82, glucose: 95, rejection: false, infection: false, cmv: "Positive - prophylaxis", compliance: "Excellent", riskScore: "Low" },
  { id: "PT-005", name: "Angela Wilson", age: 48, organ: "Lung", txDate: "2026-07-15", txDay: 36, donor: "Deceased", immunosuppression: ["Tacrolimus 6mg BID", "MMF 1000mg BID", "Pred 20mg QD"], tacLevel: 14.5, creatinine: 2.1, gfr: 38, glucose: 165, rejection: true, infection: true, cmv: "Positive - viremia", compliance: "Poor", riskScore: "Critical" },
  { id: "PT-006", name: "Robert Park", age: 56, organ: "Liver", txDate: "2026-01-20", txDay: 213, donor: "Living", immunosuppression: ["Tacrolimus 2mg BID", "MMF 500mg BID"], tacLevel: 5.8, creatinine: 1.2, gfr: 68, glucose: 105, rejection: false, infection: false, cmv: "Negative", compliance: "Excellent", riskScore: "Low" },
];

const GVHD = [
  { id: "GV-001", name: "Thomas Lee", age: 35, txType: "Allo HSCT", donorType: "MUD 9/10", gvhType: "Acute", grade: "II", onsetDay: 28, organs: ["Skin", "Liver"], skinPct: 35, bilirubin: 4.2, treatment: ["Methylpred 2mg/kg", "Ruxolitinib 10mg BID"], response: "Partial", karnofsky: 70, riskScore: "Moderate" },
  { id: "GV-002", name: "Maria Santos", age: 28, txType: "Allo HSCT", donorType: "Haplo", gvhType: "Chronic", grade: "Moderate", onsetDay: 120, organs: ["Skin", "Eyes", "Mouth"], skinPct: 20, bilirubin: 1.1, treatment: ["Prednisone 1mg/kg", "ECP"], response: "Stable", karnofsky: 85, riskScore: "Low" },
  { id: "GV-003", name: "James Okafor", age: 42, txType: "Allo HSCT", donorType: "MRD 10/10", gvhType: "Acute", grade: "III", onsetDay: 35, organs: ["Skin", "GI", "Liver"], skinPct: 60, bilirubin: 8.5, treatment: ["Methylpred 2mg/kg", "Infliximab", "Ruxolitinib 15mg BID"], response: "Refractory", karnofsky: 40, riskScore: "Critical" },
  { id: "GV-004", name: "Helen Kowalski", age: 55, txType: "Allo HSCT", donorType: "MUD 10/10", gvhType: "Chronic", grade: "Severe", onsetDay: 200, organs: ["Skin", "Lungs", "Liver"], skinPct: 45, bilirubin: 2.8, treatment: ["Belumosudil 200mg QD", "ECP", "Pred 0.5mg/kg"], response: "Slow improvement", karnofsky: 55, riskScore: "High" },
  { id: "GV-005", name: "Carlos Mendez", age: 31, txType: "Allo HSCT", donorType: "Haplo", gvhType: "Acute", grade: "I", onsetDay: 22, organs: ["Skin"], skinPct: 15, bilirubin: 0.9, treatment: ["Prednisone 1mg/kg", "Topical steroids"], response: "Complete", karnofsky: 90, riskScore: "Low" },
  { id: "GV-006", name: "Grace Yamamoto", age: 48, txType: "Allo HSCT", donorType: "MUD 9/10", gvhType: "Chronic", grade: "Mild", onsetDay: 150, organs: ["Eyes", "Mouth"], skinPct: 5, bilirubin: 1.0, treatment: ["Topical steroids", "Artificial tears"], response: "Stable", karnofsky: 80, riskScore: "Low" },
];

const PROCUREMENT = [
  { id: "PR-001", organ: "Kidney", donorId: "D-88421", team: "Alpha", coldIschemia: "4h 22m", perfusion: "Static Cold", preservation: "UW Solution", crossmatch: "Negative", status: "In Transit", violations: 0 },
  { id: "PR-002", organ: "Heart", donorId: "D-88423", team: "Beta", coldIschemia: "2h 45m", perfusion: "Normothermic", preservation: "Cardioplegia", crossmatch: "Negative", status: "Implanting", violations: 0 },
  { id: "PR-003", organ: "Liver", donorId: "D-88422", team: "Alpha", coldIschemia: "6h 15m", perfusion: "Static Cold", preservation: "HTK Solution", crossmatch: "N/A", status: "Awaiting OR", violations: 1 },
  { id: "PR-004", organ: "Lung", donorId: "D-88425", team: "Gamma", coldIschemia: "3h 30m", perfusion: "EVLP", preservation: "Perfad-X", crossmatch: "Borderline", status: "EVLP Assessment", violations: 0 },
  { id: "PR-005", organ: "Kidney-Pancreas", donorId: "D-88424", team: "Beta", coldIschemia: "8h 10m", perfusion: "Static Cold", preservation: "UW Solution", crossmatch: "Pending", status: "Conditional", violations: 2 },
  { id: "PR-006", organ: "Liver (split)", donorId: "D-88426", team: "Gamma", coldIschemia: "5h 50m", perfusion: "Static Cold", preservation: "UW Solution", crossmatch: "N/A HCV+", status: "Splitting", violations: 0 },
];

const TABS = [
  { key: "waitlist", label: "Waitlist", icon: Users, blurb: "Active organ waitlist with priority, CPRA & sensitisation" },
  { key: "donor", label: "Donor Matching", icon: Crosshair, blurb: "Donor offers, HLA matching & allocation review" },
  { key: "posttx", label: "Post-Transplant", icon: Activity, blurb: "Recipient vitals, tacrolimus levels & rejection flags" },
  { key: "gvhd", label: "GVHD", icon: ShieldAlert, blurb: "Graft-versus-host grading, treatment & response" },
  { key: "procurement", label: "Procurement", icon: Truck, blurb: "Organ logistics, ischaemia time & preservation" },
];

/* ------------------------------------------------------------------ *
 *  Helpers
 * ------------------------------------------------------------------ */

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function jitter(base, pct) { return base * (1 + (Math.random() - 0.5) * 2 * pct); }
function simPostTx(p) {
  return {
    ...p,
    creatinine: parseFloat(clamp(jitter(p.creatinine, 0.05), 0.5, 5).toFixed(1)),
    tacLevel: parseFloat(clamp(jitter(p.tacLevel, 0.04), 2, 20).toFixed(1)),
    glucose: Math.round(clamp(jitter(p.glucose, 0.03), 70, 300)),
  };
}
function simGvhd(g) {
  return {
    ...g,
    skinPct: Math.round(clamp(jitter(g.skinPct, 0.03), 0, 100)),
    bilirubin: parseFloat(clamp(jitter(g.bilirubin, 0.04), 0.3, 15).toFixed(1)),
  };
}

function priorityTone(p) {
  if (p === "Critical") return "red";
  if (p === "High") return "amber";
  return "yellow";
}

function riskTone(r) {
  if (r === "Critical") return "red";
  if (r === "High") return "amber";
  if (r === "Moderate") return "yellow";
  return "green";
}

function matchScoreColor(score) {
  if (score >= 90) return "text-emerald-400";
  if (score >= 75) return "text-sky-400";
  if (score >= 60) return "text-amber-400";
  return "text-rose-400";
}

function statusDotColor(status) {
  const map = {
    "Offered": "bg-sky-400",
    "Under Review": "bg-amber-400",
    "Approved": "bg-emerald-400",
    "Conditional": "bg-violet-400",
    "Declined": "bg-rose-400",
    "In Transit": "bg-sky-400",
    "Implanting": "bg-emerald-400",
    "Awaiting OR": "bg-amber-400",
    "EVLP Assessment": "bg-violet-400",
    "Splitting": "bg-cyan-400",
  };
  return map[status] || "bg-slate-400";
}

/* ------------------------------------------------------------------ *
 *  Tab 1 – Waitlist
 * ------------------------------------------------------------------ */

function WaitlistTab({ data, toasts }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [modal, setModal] = useState(null);
  const filters = ["All", "Critical", "High", "Moderate"];

  const filtered = useMemo(
    () =>
      data.filter((p) => {
        const s =
          !search ||
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.organ.toLowerCase().includes(search.toLowerCase()) ||
          p.id.toLowerCase().includes(search.toLowerCase());
        const f = filter === "All" ? true : p.priority === filter;
        return s && f;
      }),
    [data, search, filter]
  );

  const onExport = useCallback(() => {
    downloadCsv(
      "waitlist.csv",
      filtered.map((p) => ({
        ID: p.id,
        Name: p.name,
        Age: p.age,
        Organ: p.organ,
        Blood: p.bloodType,
        Status: p.status,
        Days: p.waitingDays,
        Priority: p.priority,
        CPRA: p.cpra,
      }))
    );
    toasts.toast("Waitlist exported", "Low");
  }, [filtered, toasts]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <CompactSearch value={search} onChange={setSearch} placeholder="Search patient, organ..." />
        <FilterChips options={filters} value={filter} onChange={setFilter} />
        <div className="ml-auto">
          <ExportCsvButton onClick={onExport} />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((p) => (
          <div
            key={p.id}
            onClick={() => setModal(p)}
            className="bg-slate-900 border border-slate-800 rounded-xl p-4 cursor-pointer hover:border-slate-600 transition group"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-sm font-semibold text-slate-100 group-hover:text-cyan-400 transition">
                  {p.name}
                </p>
                <p className="text-xs text-slate-500">
                  {p.id} · Age {p.age}
                </p>
              </div>
              <ToneBadge tone={priorityTone(p.priority)}>{p.priority}</ToneBadge>
            </div>
            <div className="bg-slate-950/50 rounded-lg p-3 mb-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-slate-500">Organ</span>
                <span className="text-sm font-bold text-cyan-400">{p.organ}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="text-center">
                  <p className="text-slate-500">Blood</p>
                  <p className="font-mono font-bold text-slate-300">{p.bloodType}</p>
                </div>
                <div className="text-center">
                  <p className="text-slate-500">Days</p>
                  <p className="font-mono font-bold text-slate-300">{p.waitingDays}</p>
                </div>
                <div className="text-center">
                  <p className="text-slate-500">CPRA</p>
                  <p className="font-mono font-bold text-slate-300">{p.cpra}%</p>
                </div>
              </div>
            </div>
            <div className="text-xs text-slate-500 mb-1">
              <span className="font-medium">Status:</span> {p.status}
            </div>
            <div className="text-xs text-slate-500 mb-2">
              <span className="font-medium">Comorbidities:</span> {p.comorbidities.join(", ")}
            </div>
            <div className="flex items-center gap-2">
              {p.dialysis && <ToneBadge tone="amber">Dialysis</ToneBadge>}
              <ToneBadge tone="slate">{p.coordinator}</ToneBadge>
            </div>
          </div>
        ))}
      </div>
      {filtered.length === 0 && <EmptyState message="No waitlist patients match" icon={Users} />}
      {modal && (
        <Modal title={"Waitlist — " + modal.name} subtitle={modal.id} onClose={() => setModal(null)}>
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <Row label="Organ" value={modal.organ} />
              <Row label="Blood" value={modal.bloodType} />
              <Row label="Status" value={modal.status} />
              <Row label="List Date" value={modal.listDate} />
              <Row label="Days Waiting" value={modal.waitingDays} />
              <Row label="Priority" value={modal.priority} />
              <Row label="Sensitization" value={modal.sensitization} />
              <Row label="CPRA" value={modal.cpra + "%"} />
              <Row label="Dialysis" value={modal.dialysis ? "Yes" : "No"} />
              <Row label="Coordinator" value={modal.coordinator} />
            </div>
            <div className="border-t border-slate-800 pt-3">
              <Row label="Comorbidities" value={modal.comorbidities.join(", ")} />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 *  Tab 2 – Donor Matching
 * ------------------------------------------------------------------ */

function DonorMatchingTab({ data, toasts }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [modal, setModal] = useState(null);
  const filters = ["All", "Offered", "Under Review", "Approved", "Conditional", "Declined"];

  const filtered = useMemo(
    () =>
      data.filter((d) => {
        const s =
          !search ||
          d.donorId.toLowerCase().includes(search.toLowerCase()) ||
          d.organ.toLowerCase().includes(search.toLowerCase()) ||
          d.id.toLowerCase().includes(search.toLowerCase());
        const f = filter === "All" ? true : d.status === filter;
        return s && f;
      }),
    [data, search, filter]
  );

  const onExport = useCallback(() => {
    downloadCsv(
      "donor-matching.csv",
      filtered.map((d) => ({
        ID: d.id,
        DonorID: d.donorId,
        Organ: d.organ,
        Blood: d.bloodType,
        Age: d.age,
        MatchScore: d.matchScore,
        Status: d.status,
        HCV: d.hcv,
        CMV: d.cmv,
      }))
    );
    toasts.toast("Donor matches exported", "Low");
  }, [filtered, toasts]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <CompactSearch value={search} onChange={setSearch} placeholder="Search donor, organ..." />
        <FilterChips options={filters} value={filter} onChange={setFilter} />
        <div className="ml-auto">
          <ExportCsvButton onClick={onExport} />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((d) => (
          <div
            key={d.id}
            onClick={() => setModal(d)}
            className="bg-slate-900 border border-slate-800 rounded-xl p-4 cursor-pointer hover:border-slate-600 transition group"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-sm font-semibold text-slate-100 group-hover:text-emerald-400 transition">
                  {d.organ}
                </p>
                <p className="text-xs text-slate-500">
                  {d.donorId} · {d.age}{d.sex} · {d.bloodType}
                </p>
              </div>
              <div className="text-right">
                <p className={`text-xl font-black ${matchScoreColor(d.matchScore)}`}>
                  {d.matchScore}
                </p>
                <p className="text-[9px] text-slate-500 uppercase tracking-wider">match</p>
              </div>
            </div>
            <div className="flex items-center gap-2 mb-3">
              <span className="flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ${statusDotColor(d.status)}`} />
                <span className="text-xs font-medium text-slate-300">{d.status}</span>
              </span>
              <span className="text-[10px] text-slate-500">·</span>
              <span className="text-xs text-slate-500">{d.mechanism}</span>
            </div>
            <div className="bg-slate-950/50 rounded-lg p-3 mb-3">
              <div className="grid grid-cols-4 gap-2 text-xs">
                <div className="text-center">
                  <p className="text-slate-500">BMI</p>
                  <p className="font-mono font-bold text-slate-300">{d.BMI}</p>
                </div>
                <div className="text-center">
                  <p className="text-slate-500">Cr</p>
                  <p className="font-mono font-bold text-slate-300">{d.creatinine}</p>
                </div>
                <div className="text-center">
                  <p className="text-slate-500">HCV</p>
                  <p className={`font-mono font-bold ${d.hcv ? "text-rose-400" : "text-emerald-400"}`}>
                    {d.hcv ? "+" : "−"}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-slate-500">CMV</p>
                  <p className={`font-mono font-bold ${d.cmv ? "text-amber-400" : "text-emerald-400"}`}>
                    {d.cmv ? "+" : "−"}
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-1 mb-3">
              {d.matchReasons.map((r, i) => (
                <div key={i} className="flex items-start gap-1.5 text-[11px] text-slate-400">
                  <CheckCircle2 size={12} className="mt-0.5 shrink-0 text-emerald-500" />
                  {r}
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between border-t border-slate-800 pt-3">
              <span className="text-[10px] text-slate-500">Mechanism: {d.mechanism}</span>
              <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                Review <ChevronRight size={13} />
              </span>
            </div>
          </div>
        ))}
      </div>
      {filtered.length === 0 && <EmptyState message="No donor cases match" icon={Crosshair} />}
      {modal && (
        <Modal title={"Donor — " + modal.donorId} subtitle={modal.organ} onClose={() => setModal(null)}>
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <Row label="Donor ID" value={modal.donorId} />
              <Row label="Organ" value={modal.organ} />
              <Row label="Age / Sex" value={`${modal.age}${modal.sex}`} />
              <Row label="Blood Type" value={modal.bloodType} />
              <Row label="BMI" value={modal.BMI} />
              <Row label="Creatinine" value={modal.creatinine} />
              <Row label="HCV" value={modal.hcv ? "Positive" : "Negative"} />
              <Row label="CMV" value={modal.cmv ? "Positive" : "Negative"} />
              <Row label="Mechanism" value={modal.mechanism} />
              <Row label="Match Score" value={modal.matchScore} />
              <Row label="Status" value={modal.status} />
            </div>
            <div className="border-t border-slate-800 pt-3">
              <p className="text-xs font-semibold text-slate-400 mb-2">Match Reasons</p>
              {modal.matchReasons.map((r, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-slate-300 mb-1">
                  <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-emerald-500" />
                  {r}
                </div>
              ))}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 *  Tab 3 – Post-Transplant Monitoring
 * ------------------------------------------------------------------ */

function PostTransplantTab({ data, toasts }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [modal, setModal] = useState(null);
  const filters = ["All", "Low", "Moderate", "High", "Critical"];

  const filtered = useMemo(
    () =>
      data.filter((p) => {
        const s =
          !search ||
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.organ.toLowerCase().includes(search.toLowerCase()) ||
          p.id.toLowerCase().includes(search.toLowerCase());
        const f = filter === "All" ? true : p.riskScore === filter;
        return s && f;
      }),
    [data, search, filter]
  );

  const onExport = useCallback(() => {
    downloadCsv(
      "post-transplant.csv",
      filtered.map((p) => ({
        ID: p.id,
        Name: p.name,
        Organ: p.organ,
        TxDay: p.txDay,
        TacLevel: p.tacLevel,
        Creatinine: p.creatinine,
        GFR: p.gfr,
        Glucose: p.glucose,
        Rejection: p.rejection,
        Infection: p.infection,
        Risk: p.riskScore,
      }))
    );
    toasts.toast("Post-transplant data exported", "Low");
  }, [filtered, toasts]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <CompactSearch value={search} onChange={setSearch} placeholder="Search recipient, organ..." />
        <FilterChips options={filters} value={filter} onChange={setFilter} />
        <div className="ml-auto">
          <ExportCsvButton onClick={onExport} />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((p) => {
          const tacHigh = p.tacLevel > 12;
          const tacLow = p.tacLevel < 5;
          return (
            <div
              key={p.id}
              onClick={() => setModal(p)}
              className={`bg-slate-900 border rounded-xl p-4 cursor-pointer hover:border-slate-600 transition group ${
                p.rejection || p.infection ? "border-rose-500/30" : "border-slate-800"
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-sm font-semibold text-slate-100 group-hover:text-cyan-400 transition">
                    {p.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {p.id} · {p.organ} · Day {p.txDay}
                  </p>
                </div>
                <ToneBadge tone={riskTone(p.riskScore)}>{p.riskScore}</ToneBadge>
              </div>
              <div className="bg-slate-950/50 rounded-lg p-3 mb-3">
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="text-center">
                    <p className="text-slate-500">Tac</p>
                    <p className={`font-mono font-bold ${tacHigh ? "text-rose-400" : tacLow ? "text-amber-400" : "text-emerald-400"}`}>
                      {p.tacLevel}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-slate-500">Cr</p>
                    <p className={`font-mono font-bold ${p.creatinine > 1.5 ? "text-rose-400" : "text-slate-300"}`}>
                      {p.creatinine}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-slate-500">GFR</p>
                    <p className={`font-mono font-bold ${p.gfr < 50 ? "text-rose-400" : "text-slate-300"}`}>
                      {p.gfr}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {p.rejection && <ToneBadge tone="red">Rejection</ToneBadge>}
                {p.infection && <ToneBadge tone="amber">Infection</ToneBadge>}
                <ToneBadge tone="slate">{p.compliance}</ToneBadge>
              </div>
              <div className="text-[11px] text-slate-500 mb-1">
                <span className="font-medium">CMV:</span> {p.cmv}
              </div>
              <div className="text-[11px] text-slate-500 mb-3">
                <span className="font-medium">Donor:</span> {p.donor} · Glucose: {p.glucose}
              </div>
              <div className="flex items-center justify-between border-t border-slate-800 pt-3">
                <div className="flex gap-1">
                  {p.immunosuppression.slice(0, 2).map((med, i) => (
                    <span key={i} className="rounded-md bg-slate-800 px-1.5 py-0.5 text-[9px] text-slate-400">
                      {med.split(" ")[0]}
                    </span>
                  ))}
                  {p.immunosuppression.length > 2 && (
                    <span className="rounded-md bg-slate-800 px-1.5 py-0.5 text-[9px] text-slate-500">
                      +{p.immunosuppression.length - 2}
                    </span>
                  )}
                </div>
                <span className="flex items-center gap-1 text-[11px] font-semibold text-cyan-400">
                  Detail <ChevronRight size={13} />
                </span>
              </div>
            </div>
          );
        })}
      </div>
      {filtered.length === 0 && <EmptyState message="No post-transplant patients match" icon={Activity} />}
      {modal && (
        <Modal title={"Post-Tx — " + modal.name} subtitle={modal.id} onClose={() => setModal(null)}>
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <Row label="Organ" value={modal.organ} />
              <Row label="Tx Date" value={modal.txDate} />
              <Row label="Post-Tx Day" value={modal.txDay} />
              <Row label="Donor Type" value={modal.donor} />
              <Row label="Tacrolimus" value={modal.tacLevel + " ng/mL"} />
              <Row label="Creatinine" value={modal.creatinine + " mg/dL"} />
              <Row label="GFR" value={modal.gfr + " mL/min"} />
              <Row label="Glucose" value={modal.glucose + " mg/dL"} />
              <Row label="Rejection" value={modal.rejection ? "Yes" : "No"} />
              <Row label="Infection" value={modal.infection ? "Yes" : "No"} />
              <Row label="CMV" value={modal.cmv} />
              <Row label="Compliance" value={modal.compliance} />
              <Row label="Risk Score" value={modal.riskScore} />
            </div>
            <div className="border-t border-slate-800 pt-3">
              <p className="text-xs font-semibold text-slate-400 mb-2">Immunosuppression Regimen</p>
              {modal.immunosuppression.map((med, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-slate-300 mb-1">
                  <Pill size={13} className="mt-0.5 shrink-0 text-cyan-500" />
                  {med}
                </div>
              ))}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 *  Tab 4 – GVHD Management
 * ------------------------------------------------------------------ */

function GvhdTab({ data, toasts }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [modal, setModal] = useState(null);
  const filters = ["All", "Acute", "Chronic"];

  const filtered = useMemo(
    () =>
      data.filter((g) => {
        const s =
          !search ||
          g.name.toLowerCase().includes(search.toLowerCase()) ||
          g.id.toLowerCase().includes(search.toLowerCase()) ||
          g.txType.toLowerCase().includes(search.toLowerCase());
        const f = filter === "All" ? true : g.gvhType === filter;
        return s && f;
      }),
    [data, search, filter]
  );

  const onExport = useCallback(() => {
    downloadCsv(
      "gvhd.csv",
      filtered.map((g) => ({
        ID: g.id,
        Name: g.name,
        TxType: g.txType,
        Donor: g.donorType,
        Type: g.gvhType,
        Grade: g.grade,
        SkinPct: g.skinPct,
        Bilirubin: g.bilirubin,
        Karnofsky: g.karnofsky,
        Response: g.response,
        Risk: g.riskScore,
      }))
    );
    toasts.toast("GVHD data exported", "Low");
  }, [filtered, toasts]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <CompactSearch value={search} onChange={setSearch} placeholder="Search patient, HSCT type..." />
        <FilterChips options={filters} value={filter} onChange={setFilter} />
        <div className="ml-auto">
          <ExportCsvButton onClick={onExport} />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((g) => (
          <div
            key={g.id}
            onClick={() => setModal(g)}
            className={`bg-slate-900 border rounded-xl p-4 cursor-pointer hover:border-slate-600 transition group ${
              g.riskScore === "Critical" ? "border-rose-500/30" : "border-slate-800"
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-sm font-semibold text-slate-100 group-hover:text-violet-400 transition">
                  {g.name}
                </p>
                <p className="text-xs text-slate-500">
                  {g.id} · {g.txType}
                </p>
              </div>
              <ToneBadge tone={riskTone(g.riskScore)}>{g.riskScore}</ToneBadge>
            </div>
            <div className="flex items-center gap-2 mb-3">
              <ToneBadge tone={g.gvhType === "Acute" ? "red" : "sky"}>{g.gvhType}</ToneBadge>
              <span className="text-xs text-slate-400">Grade {g.grade}</span>
              <span className="text-[10px] text-slate-500">· Day {g.onsetDay}</span>
            </div>
            <div className="bg-slate-950/50 rounded-lg p-3 mb-3">
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="text-center">
                  <p className="text-slate-500">Skin</p>
                  <p className={`font-mono font-bold ${g.skinPct > 40 ? "text-rose-400" : "text-slate-300"}`}>
                    {g.skinPct}%
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-slate-500">Bili</p>
                  <p className={`font-mono font-bold ${g.bilirubin > 3 ? "text-rose-400" : "text-slate-300"}`}>
                    {g.bilirubin}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-slate-500">KPS</p>
                  <p className={`font-mono font-bold ${g.karnofsky < 50 ? "text-rose-400" : "text-slate-300"}`}>
                    {g.karnofsky}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {g.organs.map((organ, i) => (
                <span key={i} className="rounded-md bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400">
                  {organ}
                </span>
              ))}
            </div>
            <div className="text-[11px] text-slate-500 mb-1">
              <span className="font-medium">Donor:</span> {g.donorType}
            </div>
            <div className="text-[11px] text-slate-500 mb-1">
              <span className="font-medium">Response:</span> {g.response}
            </div>
            <div className="flex items-center justify-between border-t border-slate-800 pt-3 mt-2">
              <span className="text-[10px] text-slate-500">
                {g.treatment.length} medication{g.treatment.length !== 1 ? "s" : ""}
              </span>
              <span className="flex items-center gap-1 text-[11px] font-semibold text-violet-400">
                Manage <ChevronRight size={13} />
              </span>
            </div>
          </div>
        ))}
      </div>
      {filtered.length === 0 && <EmptyState message="No GVHD cases match" icon={Shield} />}
      {modal && (
        <Modal title={"GVHD — " + modal.name} subtitle={modal.id} onClose={() => setModal(null)}>
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <Row label="Tx Type" value={modal.txType} />
              <Row label="Donor Type" value={modal.donorType} />
              <Row label="GVHD Type" value={modal.gvhType} />
              <Row label="Grade" value={modal.grade} />
              <Row label="Onset Day" value={modal.onsetDay} />
              <Row label="Skin Involvement" value={modal.skinPct + "%"} />
              <Row label="Bilirubin" value={modal.bilirubin} />
              <Row label="Karnofsky" value={modal.karnofsky} />
              <Row label="Response" value={modal.response} />
              <Row label="Risk Score" value={modal.riskScore} />
            </div>
            <div className="border-t border-slate-800 pt-3">
              <p className="text-xs font-semibold text-slate-400 mb-2">Affected Organs</p>
              <div className="flex flex-wrap gap-1.5">
                {modal.organs.map((organ, i) => (
                  <span key={i} className="rounded-md bg-violet-500/10 border border-violet-500/20 px-2 py-1 text-[11px] font-medium text-violet-300">
                    {organ}
                  </span>
                ))}
              </div>
            </div>
            <div className="border-t border-slate-800 pt-3">
              <p className="text-xs font-semibold text-slate-400 mb-2">Treatment Protocol</p>
              {modal.treatment.map((med, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-slate-300 mb-1">
                  <Pill size={13} className="mt-0.5 shrink-0 text-violet-500" />
                  {med}
                </div>
              ))}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 *  Tab 5 – Organ Procurement & Logistics
 * ------------------------------------------------------------------ */

function ProcurementTab({ data, toasts }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [modal, setModal] = useState(null);
  const filters = ["All", "In Transit", "Implanting", "Awaiting OR", "EVLP Assessment", "Conditional", "Splitting"];

  const filtered = useMemo(
    () =>
      data.filter((p) => {
        const s =
          !search ||
          p.organ.toLowerCase().includes(search.toLowerCase()) ||
          p.donorId.toLowerCase().includes(search.toLowerCase()) ||
          p.id.toLowerCase().includes(search.toLowerCase()) ||
          p.team.toLowerCase().includes(search.toLowerCase());
        const f = filter === "All" ? true : p.status === filter;
        return s && f;
      }),
    [data, search, filter]
  );

  const onExport = useCallback(() => {
    downloadCsv(
      "procurement.csv",
      filtered.map((p) => ({
        ID: p.id,
        Organ: p.organ,
        DonorID: p.donorId,
        Team: p.team,
        ColdIschemia: p.coldIschemia,
        Perfusion: p.perfusion,
        Preservation: p.preservation,
        Crossmatch: p.crossmatch,
        Status: p.status,
        Violations: p.violations,
      }))
    );
    toasts.toast("Procurement data exported", "Low");
  }, [filtered, toasts]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <CompactSearch value={search} onChange={setSearch} placeholder="Search organ, donor, team..." />
        <FilterChips options={filters} value={filter} onChange={setFilter} />
        <div className="ml-auto">
          <ExportCsvButton onClick={onExport} />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((p) => (
          <div
            key={p.id}
            onClick={() => setModal(p)}
            className="bg-slate-900 border border-slate-800 rounded-xl p-4 cursor-pointer hover:border-slate-600 transition group"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-sm font-semibold text-slate-100 group-hover:text-sky-400 transition">
                  {p.organ}
                </p>
                <p className="text-xs text-slate-500">
                  {p.id} · {p.donorId}
                </p>
              </div>
              <span className="flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ${statusDotColor(p.status)}`} />
                <span className="text-xs font-medium text-slate-300">{p.status}</span>
              </span>
            </div>
            <div className="bg-slate-950/50 rounded-lg p-3 mb-3">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-slate-500 mb-0.5">Cold Ischaemia</p>
                  <p className="font-mono font-bold text-slate-300 flex items-center gap-1">
                    <Timer size={12} className="text-cyan-500" />
                    {p.coldIschemia}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 mb-0.5">Perfusion</p>
                  <p className="text-slate-300 font-medium">{p.perfusion}</p>
                </div>
                <div>
                  <p className="text-slate-500 mb-0.5">Preservation</p>
                  <p className="text-slate-300 font-medium">{p.preservation}</p>
                </div>
                <div>
                  <p className="text-slate-500 mb-0.5">Crossmatch</p>
                  <p className={`font-medium ${
                    p.crossmatch === "Negative" ? "text-emerald-400" :
                    p.crossmatch === "Pending" ? "text-amber-400" :
                    p.crossmatch === "Borderline" ? "text-orange-400" :
                    "text-slate-400"
                  }`}>
                    {p.crossmatch}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] text-slate-500">Team: <span className="font-medium text-slate-300">{p.team}</span></span>
              {p.violations > 0 && (
                <ToneBadge tone="red">{p.violations} violation{p.violations !== 1 ? "s" : ""}</ToneBadge>
              )}
            </div>
            <div className="flex items-center justify-between border-t border-slate-800 pt-3">
              <span className="text-[10px] text-slate-500">Perfusion: {p.perfusion}</span>
              <span className="flex items-center gap-1 text-[11px] font-semibold text-sky-400">
                Track <ChevronRight size={13} />
              </span>
            </div>
          </div>
        ))}
      </div>
      {filtered.length === 0 && <EmptyState message="No procurement cases match" icon={Truck} />}
      {modal && (
        <Modal title={"Procurement — " + modal.organ} subtitle={modal.id} onClose={() => setModal(null)}>
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <Row label="Organ" value={modal.organ} />
              <Row label="Donor ID" value={modal.donorId} />
              <Row label="Surgical Team" value={modal.team} />
              <Row label="Status" value={modal.status} />
              <Row label="Cold Ischaemia" value={modal.coldIschemia} />
              <Row label="Perfusion Method" value={modal.perfusion} />
              <Row label="Preservation" value={modal.preservation} />
              <Row label="Crossmatch" value={modal.crossmatch} />
              <Row label="Violations" value={modal.violations} />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 *  Main hub component
 * ------------------------------------------------------------------ */

export default function TransplantMedicineHub() {
  const [activeTab, setActiveTab] = useState("waitlist");
  const [waitlist, setWaitlist] = useState(WAITLIST);
  const [donors, setDonors] = useState(DONOR_CASES);
  const [postTx, setPostTx] = useState(POST_TX);
  const [gvhd, setGvhd] = useState(GVHD);
  const toasts = useToastTray();

  /* Lightweight simulation: gently jitter post-tx vitals & GVHD markers
     every 8 seconds so dashboards feel alive. */
  useEffect(() => {
    const id = setInterval(() => {
      setPostTx((prev) => prev.map(simPostTx));
      setGvhd((prev) => prev.map(simGvhd));
    }, 8000);
    return () => clearInterval(id);
  }, []);

  const stats = useMemo(() => {
    const criticalWaitlist = waitlist.filter((p) => p.priority === "Critical").length;
    const approvedDonors = donors.filter((d) => d.status === "Approved").length;
    const rejectionCases = postTx.filter((p) => p.rejection).length;
    const criticalGvhd = gvhd.filter((g) => g.riskScore === "Critical" || g.riskScore === "High").length;
    return { criticalWaitlist, approvedDonors, rejectionCases, criticalGvhd };
  }, [waitlist, donors, postTx, gvhd]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <PageHeader
            icon={<HeartPulse size={26} className="text-emerald-400" />}
            title="Transplant Medicine Command Hub"
            subtitle="Waitlist · Donor Matching · Post-Tx · GVHD · Procurement"
          />
        </div>

        {/* Stat row */}
        <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard icon={Users} label="Critical waitlist" value={stats.criticalWaitlist} sub="Status 1A / 1B / Critical" tone="rose" />
          <StatCard icon={CheckCircle2} label="Approved donors" value={stats.approvedDonors} sub="Ready for allocation" tone="emerald" />
          <StatCard icon={AlertTriangle} label="Rejection cases" value={stats.rejectionCases} sub="Active post-tx rejections" tone="amber" />
          <StatCard icon={Shield} label="High-risk GVHD" value={stats.criticalGvhd} sub="Critical / High grade" tone="violet" />
        </div>

        {/* Tabs */}
        <div className="mt-8">
          <TabsBar tabs={TABS} active={activeTab} onChange={setActiveTab} accent="emerald" />

          <div className="mt-5">
            {activeTab === "waitlist" && <WaitlistTab data={waitlist} toasts={toasts} />}
            {activeTab === "donor" && <DonorMatchingTab data={donors} toasts={toasts} />}
            {activeTab === "posttx" && <PostTransplantTab data={postTx} toasts={toasts} />}
            {activeTab === "gvhd" && <GvhdTab data={gvhd} toasts={toasts} />}
            {activeTab === "procurement" && <ProcurementTab data={PROCUREMENT} toasts={toasts} />}
          </div>
        </div>
      </div>

      {/* Toast tray */}
      <ToastTray toasts={toasts.toasts} critical={["High", "Critical"]} />

      {/* Footer */}
      <Footer>
        MedTrack Transplant Medicine Hub · Data refreshes every 8s · {new Date().getFullYear()}
      </Footer>
    </div>
  );
}
