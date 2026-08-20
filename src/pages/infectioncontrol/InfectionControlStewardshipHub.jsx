import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity, AlertTriangle, Beaker, Bed, Calendar, CheckCircle2, Clock,
  Droplets, Eye, FileText, Filter, FlaskConical, Gauge, Heart,
  HeartPulse, Hospital, Layers, MapPin, Microscope, Pause, Play,
  Pill, PlayCircle, Plus, RefreshCw, Search, Shield, ShieldCheck,
  ShieldAlert, Stethoscope, Syringe, Thermometer, Timer, TrendingDown,
  TrendingUp, User, Users, Zap, ChevronRight, X, Bug, ThermometerSnowflake,
  Scan, Target, AlertOctagon, FlaskRound, BadgeAlert, Siren,
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
 *  MedTrack Infection Control & Antimicrobial Stewardship Hub
 *  ------------------------------------------------------------------
 *  Five consoles for hospital infection prevention:
 *    1. HAIs Dashboard     – hospital-acquired infection surveillance
 *                           (CAUTI, CLABSI, SSI, C. diff, MRSA).
 *    2. Antibiotic Rx      – antimicrobial stewardship: utilization,
 *                           spectrum index, restricted agents.
 *    3. Hand Hygiene       – compliance monitoring by department,
 *                           missed opportunities, nudges.
 *    4. Isolation & PPE    – room status, precaution level, PPE
 *                           stock and compliance.
 *    5. Outbreak Watch     – cluster detection, epi curves, risk
 *                           heat-map by ward.
 * ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ *
 *  Seed data
 * ------------------------------------------------------------------ */

const HAI_RECORDS = [
  { id: "HAI-001", type: "CAUTI", patient: "Robert Kim", age: 72, unit: "ICU West", organism: "E. coli", resistance: "ESBL+", device: "Foley catheter", daysDevice: 14, onsetDay: 12, severity: "High", reportedBy: "Dr. Patel", status: "Active" },
  { id: "HAI-002", type: "CLABSI", patient: "Maria Santos", age: 58, unit: "Oncology", organism: "S. aureus", resistance: "MRSA", device: "Central line", daysDevice: 21, onsetDay: 18, severity: "Critical", reportedBy: "Dr. Kim", status: "Active" },
  { id: "HAI-003", type: "SSI", patient: "James O'Brien", age: 64, unit: "Surgical", organism: "K. pneumoniae", resistance: "CRE", device: "N/A (surgical)", daysDevice: 0, onsetDay: 5, severity: "High", reportedBy: "Dr. Lee", status: "Under Review" },
  { id: "HAI-004", type: "C. diff", patient: "Linda Chen", age: 45, unit: "Med-Surg", organism: "C. difficile", resistance: "N/A", device: "N/A", daysDevice: 0, onsetDay: 8, severity: "Moderate", reportedBy: "NP Garcia", status: "Active" },
  { id: "HAI-005", type: "MRSA", patient: "William Davis", age: 81, unit: "Rehab", organism: "S. aureus", resistance: "MRSA", device: "Wound VAC", daysDevice: 7, onsetDay: 10, severity: "Moderate", reportedBy: "Dr. Patel", status: "Resolved" },
  { id: "HAI-006", type: "CAUTI", patient: "Angela Park", age: 67, unit: "ICU East", organism: "P. aeruginosa", resistance: "MDR", device: "Foley catheter", daysDevice: 11, onsetDay: 9, severity: "Critical", reportedBy: "Dr. Kim", status: "Active" },
  { id: "HAI-007", type: "VAP", patient: "Thomas Brown", age: 55, unit: "ICU West", organism: "A. baumannii", resistance: "XDR", device: "Endotracheal tube", daysDevice: 16, onsetDay: 13, severity: "Critical", reportedBy: "Dr. Lee", status: "Active" },
  { id: "HAI-008", type: "CLABSI", patient: "Dorothy Wilson", age: 70, unit: "Cardiology", organism: "Candida albicans", resistance: "N/A", device: "PICC line", daysDevice: 9, onsetDay: 7, severity: "Moderate", reportedBy: "Dr. Patel", status: "Under Review" },
];

const ANTIBIOTIC_RECORDS = [
  { id: "AB-001", drug: "Meropenem", category: "Carbapenem", patient: "Robert Kim", unit: "ICU West", dose: "1g IV q8h", dot: 14, indication: "ESBL E. coli CAUTI", restricted: true, deEscalated: false, spectrum: "Broad", startDay: "2026-07-28", prescriber: "Dr. Patel" },
  { id: "AB-002", drug: "Vancomycin", category: "Glycopeptide", patient: "Maria Santos", unit: "Oncology", dose: "15mg/kg IV q12h", dot: 18, indication: "MRSA CLABSI", restricted: true, deEscalated: false, spectrum: "Narrow", startDay: "2026-07-22", prescriber: "Dr. Kim" },
  { id: "AB-003", drug: "Ceftriaxone", category: "Cephalosporin", patient: "James O'Brien", unit: "Surgical", dose: "2g IV q24h", dot: 5, indication: "SSI prophylaxis → therapeutic", restricted: false, deEscalated: true, spectrum: "Broad", startDay: "2026-08-05", prescriber: "Dr. Lee" },
  { id: "AB-004", drug: "Metronidazole", category: "Nitroimidazole", patient: "Linda Chen", unit: "Med-Surg", dose: "500mg PO q8h", dot: 8, indication: "C. difficile infection", restricted: false, deEscalated: false, spectrum: "Narrow", startDay: "2026-08-02", prescriber: "NP Garcia" },
  { id: "AB-005", drug: "Colistin", category: "Polymyxin", patient: "Angela Park", unit: "ICU East", dose: "MU IV q12h", dot: 11, indication: "MDR Pseudomonas CAUTI", restricted: true, deEscalated: false, spectrum: "Last-resort", startDay: "2026-07-29", prescriber: "Dr. Patel" },
  { id: "AB-006", drug: "Linezolid", category: "Oxazolidinone", patient: "Thomas Brown", unit: "ICU West", dose: "600mg IV q12h", dot: 13, indication: "XDR Acinetobacter VAP", restricted: true, deEscalated: false, spectrum: "Broad", startDay: "2026-07-27", prescriber: "Dr. Kim" },
  { id: "AB-007", drug: "Amoxicillin-Clav", category: "Penicillin", patient: "Dorothy Wilson", unit: "Cardiology", dose: "875mg PO q12h", dot: 7, indication: "Empiric → candida identified", restricted: false, deEscalated: true, spectrum: "Narrow", startDay: "2026-08-03", prescriber: "Dr. Patel" },
  { id: "AB-008", drug: "Piperacillin-Taz", category: "Penicillin", patient: "William Davis", unit: "Rehab", dose: "4.5g IV q8h", dot: 10, indication: "Empiric MRSA coverage", restricted: false, deEscalated: true, spectrum: "Broad", startDay: "2026-07-30", prescriber: "Dr. Lee" },
];

const HAND_HYGIENE = [
  { id: "HH-001", department: "ICU West", opportunities: 1240, performed: 1178, rate: 95, observer: "Nurse Chen", lastAudit: "2026-08-18", trend: "up" },
  { id: "HH-002", department: "ICU East", opportunities: 980, performed: 912, rate: 93, observer: "Nurse Kim", lastAudit: "2026-08-17", trend: "stable" },
  { id: "HH-003", department: "Emergency", opportunities: 2100, performed: 1785, rate: 85, observer: "Dr. Garcia", lastAudit: "2026-08-18", trend: "down" },
  { id: "HH-004", department: "Oncology", opportunities: 860, performed: 817, rate: 95, observer: "Nurse Lee", lastAudit: "2026-08-16", trend: "up" },
  { id: "HH-005", department: "Surgical", opportunities: 1580, performed: 1469, rate: 93, observer: "Nurse Patel", lastAudit: "2026-08-18", trend: "stable" },
  { id: "HH-006", department: "Med-Surg", opportunities: 1850, performed: 1573, rate: 85, observer: "NP Wilson", lastAudit: "2026-08-15", trend: "down" },
  { id: "HH-007", department: "Oncology", opportunities: 720, performed: 705, rate: 98, observer: "Nurse Kim", lastAudit: "2026-08-18", trend: "up" },
  { id: "HH-008", department: "Pediatrics", opportunities: 1100, performed: 1023, rate: 93, observer: "Nurse Davis", lastAudit: "2026-08-17", trend: "stable" },
];

const ISOLATION_ROOMS = [
  { id: "IR-001", room: "412-A", unit: "ICU West", patient: "Robert Kim", precaution: "Contact", organism: "ESBL E. coli", ppeCompliance: 92, daysIsolation: 5, staffBriefed: 18, visitorsRestricted: true, status: "Active" },
  { id: "IR-002", room: "308-B", unit: "Oncology", patient: "Maria Santos", precaution: "Contact + Droplet", organism: "MRSA", ppeCompliance: 88, daysIsolation: 8, staffBriefed: 22, visitorsRestricted: true, status: "Active" },
  { id: "IR-003", room: "201-A", unit: "Surgical", patient: "James O'Brien", precaution: "Contact", organism: "CRE Klebsiella", ppeCompliance: 95, daysIsolation: 3, staffBriefed: 12, visitorsRestricted: false, status: "Active" },
  { id: "IR-004", room: "515-C", unit: "ICU East", patient: "Angela Park", precaution: "Droplet", organism: "MDR Pseudomonas", ppeCompliance: 90, daysIsolation: 6, staffBriefed: 15, visitorsRestricted: true, status: "Active" },
  { id: "IR-005", room: "110-A", unit: "Rehab", patient: "William Davis", precaution: "Contact", organism: "MRSA", ppeCompliance: 97, daysIsolation: 2, staffBriefed: 8, visitorsRestricted: false, status: "DC Pending" },
  { id: "IR-006", room: "602-B", unit: "ICU West", patient: "Thomas Brown", precaution: "Airborne", organism: "XDR Acinetobacter", ppeCompliance: 85, daysIsolation: 7, staffBriefed: 20, visitorsRestricted: true, status: "Active" },
];

const OUTBREAK_CLUSTERS = [
  { id: "OB-001", organism: "CRE Klebsiella pneumoniae", type: "CRE", cases: 4, unit: "ICU West", firstSeen: "2026-08-10", lastSeen: "2026-08-18", risk: "High", status: "Investigating", source: "Possible sink drain reservoir", actions: ["Environmental cultures sent", "Enhanced terminal cleaning", "Contact precautions for all ICU West"] },
  { id: "OB-002", organism: "Candida auris", type: "Candida", cases: 2, unit: "ICU East", firstSeen: "2026-08-15", lastSeen: "2026-08-17", risk: "Critical", status: "Active", source: "Screening of roommates", actions: ["Pre-emptive contact for all ICU East", "Chlorhexidine bathing protocol", "Environmental decontamination"] },
  { id: "OB-003", organism: "Norovirus", type: "Viral", cases: 8, unit: "Med-Surg", firstSeen: "2026-08-12", lastSeen: "2026-08-19", risk: "Moderate", status: "Declining", source: "Staff & visitor transmission", actions: ["Cohorting of cases", "Enhanced hand hygiene", "Visitor restrictions on 3 North"] },
  { id: "OB-004", organism: "MRSA (LA-MRSA)", type: "MRSA", cases: 3, unit: "Rehab", firstSeen: "2026-08-14", lastSeen: "2026-08-18", risk: "Moderate", status: "Investigating", source: "Gym equipment sharing?", actions: ["Decolonization protocol", "Equipment audit", "Active surveillance cultures"] },
  { id: "OB-005", organism: "Pseudomonas aeruginosa (MDR)", type: "MDR-GNR", cases: 2, unit: "ICU East", firstSeen: "2026-08-16", lastSeen: "2026-08-18", risk: "High", status: "Active", source: "Ventilator circuit?", actions: ["Ventilator circuit audit", "Respiratory therapy review", "Water system sampling"] },
];

const HAI_TYPE_META = {
  CAUTI: { icon: Droplets, color: "text-sky-400 bg-sky-500/10 border-sky-500/20" },
  CLABSI: { icon: Syringe, color: "text-violet-400 bg-violet-500/10 border-violet-500/20" },
  SSI: { icon: Syringe, color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
  "C. diff": { icon: Bug, color: "text-rose-400 bg-rose-500/10 border-rose-500/20" },
  MRSA: { icon: ShieldAlert, color: "text-red-400 bg-red-500/10 border-red-500/20" },
  VAP: { icon: ThermometerSnowflake, color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20" },
};

const TABS = [
  { key: "hais", label: "HAIs Dashboard", icon: Bug, blurb: "Hospital-acquired infection surveillance & rates" },
  { key: "abx", label: "Antibiotic Rx", icon: Pill, blurb: "Antimicrobial stewardship & utilization tracking" },
  { key: "hygiene", label: "Hand Hygiene", icon: Droplets, blurb: "Compliance monitoring & missed opportunities" },
  { key: "isolation", label: "Isolation & PPE", icon: Shield, blurb: "Room status, precautions & PPE compliance" },
  { key: "outbreak", label: "Outbreak Watch", icon: AlertOctagon, blurb: "Cluster detection & epidemiological tracking" },
];

/* ------------------------------------------------------------------ *
 *  Helpers
 * ------------------------------------------------------------------ */

function severityTone(s) {
  if (s === "Critical") return "red";
  if (s === "High") return "amber";
  if (s === "Moderate") return "yellow";
  return "green";
}

function riskTone(r) {
  if (r === "Critical") return "red";
  if (r === "High") return "amber";
  if (r === "Moderate") return "yellow";
  return "green";
}

function precautionColor(p) {
  if (p === "Airborne") return "text-red-400 border-red-500/30 bg-red-500/10";
  if (p.includes("Contact + Droplet")) return "text-amber-400 border-amber-500/30 bg-amber-500/10";
  if (p === "Contact") return "text-sky-400 border-sky-500/30 bg-sky-500/10";
  if (p === "Droplet") return "text-violet-400 border-violet-500/30 bg-violet-500/10";
  return "text-slate-400 border-slate-500/30 bg-slate-500/10";
}

function complianceBar(rate) {
  if (rate >= 95) return "bg-emerald-500";
  if (rate >= 90) return "bg-sky-500";
  if (rate >= 85) return "bg-amber-500";
  return "bg-rose-500";
}

/* ------------------------------------------------------------------ *
 *  Tab 1 – HAIs Dashboard
 * ------------------------------------------------------------------ */

function HaiDashboardTab({ data, toasts }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [modal, setModal] = useState(null);
  const filters = ["All", "CAUTI", "CLABSI", "SSI", "C. diff", "MRSA", "VAP"];

  const filtered = useMemo(
    () =>
      data.filter((h) => {
        const s =
          !search ||
          h.patient.toLowerCase().includes(search.toLowerCase()) ||
          h.organism.toLowerCase().includes(search.toLowerCase()) ||
          h.unit.toLowerCase().includes(search.toLowerCase()) ||
          h.id.toLowerCase().includes(search.toLowerCase());
        const f = filter === "All" ? true : h.type === filter;
        return s && f;
      }),
    [data, search, filter]
  );

  const onExport = useCallback(() => {
    downloadCsv(
      "hai-surveillance.csv",
      filtered.map((h) => ({
        ID: h.id, Type: h.type, Patient: h.patient, Unit: h.unit,
        Organism: h.organism, Resistance: h.resistance, Device: h.device,
        DaysDevice: h.daysDevice, Severity: h.severity, Status: h.status,
      }))
    );
    toasts.toast("HAIs data exported", "Low");
  }, [filtered, toasts]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <CompactSearch value={search} onChange={setSearch} placeholder="Search patient, organism, unit..." />
        <FilterChips options={filters} value={filter} onChange={setFilter} />
        <div className="ml-auto"><ExportCsvButton onClick={onExport} /></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((h) => {
          const meta = HAI_TYPE_META[h.type] || HAI_TYPE_META["CAUTI"];
          const Icon = meta.icon;
          return (
            <div
              key={h.id}
              onClick={() => setModal(h)}
              className={`bg-slate-900 border rounded-xl p-4 cursor-pointer hover:border-slate-600 transition group ${
                h.severity === "Critical" ? "border-rose-500/30" : "border-slate-800"
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className={`rounded-lg border p-2 ${meta.color}`}><Icon size={16} /></div>
                  <div>
                    <p className="text-sm font-semibold text-slate-100 group-hover:text-cyan-400 transition">{h.patient}</p>
                    <p className="text-xs text-slate-500">{h.id} · {h.unit}</p>
                  </div>
                </div>
                <ToneBadge tone={severityTone(h.severity)}>{h.severity}</ToneBadge>
              </div>
              <div className="bg-slate-950/50 rounded-lg p-3 mb-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-500">HAI Type</span>
                  <span className="text-sm font-bold text-cyan-400">{h.type}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="text-center">
                    <p className="text-slate-500">Organism</p>
                    <p className="font-mono font-bold text-slate-300 text-[11px]">{h.organism}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-slate-500">Resistance</p>
                    <p className={`font-mono font-bold ${h.resistance !== "N/A" ? "text-rose-400" : "text-slate-300"} text-[11px]`}>{h.resistance}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-slate-500">Day</p>
                    <p className="font-mono font-bold text-slate-300">{h.onsetDay}</p>
                  </div>
                </div>
              </div>
              <div className="text-[11px] text-slate-500 mb-1">
                <span className="font-medium">Device:</span> {h.device} ({h.daysDevice}d)
              </div>
              <div className="flex items-center justify-between border-t border-slate-800 pt-3 mt-2">
                <ToneBadge tone={h.status === "Active" ? "red" : h.status === "Resolved" ? "green" : "yellow"}>{h.status}</ToneBadge>
                <span className="flex items-center gap-1 text-[11px] font-semibold text-cyan-400">Detail <ChevronRight size={13} /></span>
              </div>
            </div>
          );
        })}
      </div>
      {filtered.length === 0 && <EmptyState message="No HAI records match" icon={Bug} />}
      {modal && (
        <Modal title={`HAI — ${modal.type}`} subtitle={modal.id} onClose={() => setModal(null)}>
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <Row label="Patient" value={modal.patient} />
              <Row label="Age" value={modal.age} />
              <Row label="Unit" value={modal.unit} />
              <Row label="HAI Type" value={modal.type} />
              <Row label="Organism" value={modal.organism} />
              <Row label="Resistance" value={modal.resistance} />
              <Row label="Device" value={modal.device} />
              <Row label="Days on Device" value={modal.daysDevice} />
              <Row label="Onset Day" value={modal.onsetDay} />
              <Row label="Severity" value={modal.severity} />
              <Row label="Reported By" value={modal.reportedBy} />
              <Row label="Status" value={modal.status} />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 *  Tab 2 – Antibiotic Stewardship
 * ------------------------------------------------------------------ */

function AntibioticStewardshipTab({ data, toasts }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [modal, setModal] = useState(null);
  const filters = ["All", "Restricted", "De-escalated"];

  const filtered = useMemo(
    () =>
      data.filter((a) => {
        const s =
          !search ||
          a.drug.toLowerCase().includes(search.toLowerCase()) ||
          a.patient.toLowerCase().includes(search.toLowerCase()) ||
          a.unit.toLowerCase().includes(search.toLowerCase()) ||
          a.indication.toLowerCase().includes(search.toLowerCase());
        const f =
          filter === "All" ? true :
          filter === "Restricted" ? a.restricted :
          filter === "De-escalated" ? a.deEscalated : true;
        return s && f;
      }),
    [data, search, filter]
  );

  const onExport = useCallback(() => {
    downloadCsv(
      "antibiotic-stewardship.csv",
      filtered.map((a) => ({
        ID: a.id, Drug: a.drug, Category: a.category, Patient: a.patient,
        Unit: a.unit, DOT: a.dot, Indication: a.indication,
        Restricted: a.restricted, DeEscalated: a.deEscalated, Spectrum: a.spectrum,
      }))
    );
    toasts.toast("Antibiotic data exported", "Low");
  }, [filtered, toasts]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <CompactSearch value={search} onChange={setSearch} placeholder="Search drug, patient, unit..." />
        <FilterChips options={filters} value={filter} onChange={setFilter} />
        <div className="ml-auto"><ExportCsvButton onClick={onExport} /></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((a) => (
          <div
            key={a.id}
            onClick={() => setModal(a)}
            className="bg-slate-900 border border-slate-800 rounded-xl p-4 cursor-pointer hover:border-slate-600 transition group"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-sm font-semibold text-slate-100 group-hover:text-emerald-400 transition">{a.drug}</p>
                <p className="text-xs text-slate-500">{a.id} · {a.category}</p>
              </div>
              <div className="flex gap-1">
                {a.restricted && <ToneBadge tone="red">Restricted</ToneBadge>}
                {a.deEscalated && <ToneBadge tone="green">De-escalated</ToneBadge>}
              </div>
            </div>
            <div className="bg-slate-950/50 rounded-lg p-3 mb-3">
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="text-center">
                  <p className="text-slate-500">DOT</p>
                  <p className="font-mono font-bold text-slate-300">{a.dot}d</p>
                </div>
                <div className="text-center">
                  <p className="text-slate-500">Spectrum</p>
                  <p className={`font-bold ${a.spectrum === "Last-resort" ? "text-rose-400" : a.spectrum === "Broad" ? "text-amber-400" : "text-emerald-400"}`}>{a.spectrum}</p>
                </div>
                <div className="text-center">
                  <p className="text-slate-500">Unit</p>
                  <p className="font-bold text-slate-300 text-[11px]">{a.unit}</p>
                </div>
              </div>
            </div>
            <div className="text-[11px] text-slate-500 mb-1">
              <span className="font-medium">Patient:</span> {a.patient}
            </div>
            <div className="text-[11px] text-slate-500 mb-1">
              <span className="font-medium">Dose:</span> {a.dose}
            </div>
            <div className="text-[11px] text-slate-500 mb-3">
              <span className="font-medium">Indication:</span> {a.indication}
            </div>
            <div className="flex items-center justify-between border-t border-slate-800 pt-3">
              <span className="text-[10px] text-slate-500">{a.prescriber} · {a.startDay}</span>
              <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400">Review <ChevronRight size={13} /></span>
            </div>
          </div>
        ))}
      </div>
      {filtered.length === 0 && <EmptyState message="No antibiotic orders match" icon={Pill} />}
      {modal && (
        <Modal title={`Antibiotic — ${modal.drug}`} subtitle={modal.id} onClose={() => setModal(null)}>
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <Row label="Drug" value={modal.drug} />
              <Row label="Category" value={modal.category} />
              <Row label="Patient" value={modal.patient} />
              <Row label="Unit" value={modal.unit} />
              <Row label="Dose" value={modal.dose} />
              <Row label="DOT" value={modal.dot + " days"} />
              <Row label="Indication" value={modal.indication} />
              <Row label="Restricted" value={modal.restricted ? "Yes" : "No"} />
              <Row label="De-escalated" value={modal.deEscalated ? "Yes" : "No"} />
              <Row label="Spectrum" value={modal.spectrum} />
              <Row label="Start Date" value={modal.startDay} />
              <Row label="Prescriber" value={modal.prescriber} />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 *  Tab 3 – Hand Hygiene Compliance
 * ------------------------------------------------------------------ */

function HandHygieneTab({ data, toasts }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [modal, setModal] = useState(null);
  const filters = ["All", "≥95%", "90-94%", "<90%"];

  const filtered = useMemo(
    () =>
      data.filter((h) => {
        const s =
          !search ||
          h.department.toLowerCase().includes(search.toLowerCase()) ||
          h.observer.toLowerCase().includes(search.toLowerCase());
        const f =
          filter === "All" ? true :
          filter === "≥95%" ? h.rate >= 95 :
          filter === "90-94%" ? h.rate >= 90 && h.rate < 95 :
          filter === "<90%" ? h.rate < 90 : true;
        return s && f;
      }),
    [data, search, filter]
  );

  const overallRate = useMemo(() => {
    const totalOpp = data.reduce((a, d) => a + d.opportunities, 0);
    const totalPerf = data.reduce((a, d) => a + d.performed, 0);
    return totalOpp > 0 ? Math.round((totalPerf / totalOpp) * 100) : 0;
  }, [data]);

  const onExport = useCallback(() => {
    downloadCsv(
      "hand-hygiene.csv",
      filtered.map((h) => ({
        Department: h.department, Opportunities: h.opportunities,
        Performed: h.performed, Rate: h.rate, Observer: h.observer,
        LastAudit: h.lastAudit, Trend: h.trend,
      }))
    );
    toasts.toast("Hand hygiene data exported", "Low");
  }, [filtered, toasts]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <CompactSearch value={search} onChange={setSearch} placeholder="Search department, observer..." />
        <FilterChips options={filters} value={filter} onChange={setFilter} />
        <div className="ml-auto">
          <span className="text-xs text-slate-400 mr-3">Overall: <span className={`font-bold ${overallRate >= 95 ? "text-emerald-400" : overallRate >= 90 ? "text-sky-400" : "text-rose-400"}`}>{overallRate}%</span></span>
          <ExportCsvButton onClick={onExport} />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((h) => (
          <div
            key={h.id}
            onClick={() => setModal(h)}
            className={`bg-slate-900 border rounded-xl p-4 cursor-pointer hover:border-slate-600 transition group ${
              h.rate < 90 ? "border-rose-500/20" : "border-slate-800"
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-sm font-semibold text-slate-100 group-hover:text-sky-400 transition">{h.department}</p>
                <p className="text-xs text-slate-500">{h.id} · {h.observer}</p>
              </div>
              <div className="text-right">
                <p className={`text-2xl font-black ${h.rate >= 95 ? "text-emerald-400" : h.rate >= 90 ? "text-sky-400" : "text-rose-400"}`}>{h.rate}%</p>
                <p className="text-[9px] text-slate-500 uppercase tracking-wider">compliance</p>
              </div>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden mb-3">
              <div className={`h-full rounded-full transition-all ${complianceBar(h.rate)}`} style={{ width: `${h.rate}%` }} />
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs mb-3">
              <div className="text-center">
                <p className="text-slate-500">Opportunities</p>
                <p className="font-mono font-bold text-slate-300">{h.opportunities.toLocaleString()}</p>
              </div>
              <div className="text-center">
                <p className="text-slate-500">Performed</p>
                <p className="font-mono font-bold text-slate-300">{h.performed.toLocaleString()}</p>
              </div>
              <div className="text-center">
                <p className="text-slate-500">Missed</p>
                <p className="font-mono font-bold text-rose-400">{(h.opportunities - h.performed).toLocaleString()}</p>
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-slate-800 pt-3">
              <div className="flex items-center gap-1.5">
                {h.trend === "up" && <TrendingUp size={13} className="text-emerald-400" />}
                {h.trend === "down" && <TrendingDown size={13} className="text-rose-400" />}
                {h.trend === "stable" && <Activity size={13} className="text-sky-400" />}
                <span className="text-[10px] text-slate-500 capitalize">{h.trend}</span>
              </div>
              <span className="flex items-center gap-1 text-[11px] font-semibold text-sky-400">Detail <ChevronRight size={13} /></span>
            </div>
          </div>
        ))}
      </div>
      {filtered.length === 0 && <EmptyState message="No hand hygiene records match" icon={Droplets} />}
      {modal && (
        <Modal title={`Hand Hygiene — ${modal.department}`} subtitle={modal.id} onClose={() => setModal(null)}>
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <Row label="Department" value={modal.department} />
              <Row label="Compliance" value={modal.rate + "%"} />
              <Row label="Opportunities" value={modal.opportunities} />
              <Row label="Performed" value={modal.performed} />
              <Row label="Missed" value={modal.opportunities - modal.performed} />
              <Row label="Observer" value={modal.observer} />
              <Row label="Last Audit" value={modal.lastAudit} />
              <Row label="Trend" value={modal.trend} />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 *  Tab 4 – Isolation & PPE
 * ------------------------------------------------------------------ */

function IsolationPpeTab({ data, toasts }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [modal, setModal] = useState(null);
  const filters = ["All", "Airborne", "Contact", "Droplet", "Contact + Droplet"];

  const filtered = useMemo(
    () =>
      data.filter((r) => {
        const s =
          !search ||
          r.patient.toLowerCase().includes(search.toLowerCase()) ||
          r.room.toLowerCase().includes(search.toLowerCase()) ||
          r.unit.toLowerCase().includes(search.toLowerCase()) ||
          r.organism.toLowerCase().includes(search.toLowerCase());
        const f = filter === "All" ? true : r.precaution === filter;
        return s && f;
      }),
    [data, search, filter]
  );

  const onExport = useCallback(() => {
    downloadCsv(
      "isolation-rooms.csv",
      filtered.map((r) => ({
        Room: r.room, Unit: r.unit, Patient: r.patient,
        Precaution: r.precaution, Organism: r.organism,
        PPECompliance: r.ppeCompliance, DaysIsolation: r.daysIsolation,
        VisitorsRestricted: r.visitorsRestricted, Status: r.status,
      }))
    );
    toasts.toast("Isolation data exported", "Low");
  }, [filtered, toasts]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <CompactSearch value={search} onChange={setSearch} placeholder="Search patient, room, unit..." />
        <FilterChips options={filters} value={filter} onChange={setFilter} />
        <div className="ml-auto"><ExportCsvButton onClick={onExport} /></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((r) => (
          <div
            key={r.id}
            onClick={() => setModal(r)}
            className="bg-slate-900 border border-slate-800 rounded-xl p-4 cursor-pointer hover:border-slate-600 transition group"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-sm font-semibold text-slate-100 group-hover:text-violet-400 transition">{r.room}</p>
                <p className="text-xs text-slate-500">{r.patient} · {r.unit}</p>
              </div>
              <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-bold ${precautionColor(r.precaution)}`}>
                {r.precaution}
              </span>
            </div>
            <div className="bg-slate-950/50 rounded-lg p-3 mb-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-slate-500">PPE Compliance</span>
                <span className={`text-sm font-bold ${r.ppeCompliance >= 95 ? "text-emerald-400" : r.ppeCompliance >= 90 ? "text-sky-400" : "text-rose-400"}`}>{r.ppeCompliance}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${complianceBar(r.ppeCompliance)}`} style={{ width: `${r.ppeCompliance}%` }} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs mb-3">
              <div className="bg-slate-950/50 rounded-lg p-2 text-center">
                <p className="text-slate-500">Days</p>
                <p className="font-mono font-bold text-slate-300">{r.daysIsolation}</p>
              </div>
              <div className="bg-slate-950/50 rounded-lg p-2 text-center">
                <p className="text-slate-500">Staff Briefed</p>
                <p className="font-mono font-bold text-slate-300">{r.staffBriefed}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 mb-2">
              {r.visitorsRestricted && <ToneBadge tone="amber">Visitors Restricted</ToneBadge>}
              <ToneBadge tone={r.status === "Active" ? "red" : "yellow"}>{r.status}</ToneBadge>
            </div>
            <div className="text-[11px] text-slate-500 mb-3">
              <span className="font-medium">Organism:</span> {r.organism}
            </div>
            <div className="flex items-center justify-between border-t border-slate-800 pt-3">
              <span className="text-[10px] text-slate-500">Unit: {r.unit}</span>
              <span className="flex items-center gap-1 text-[11px] font-semibold text-violet-400">Manage <ChevronRight size={13} /></span>
            </div>
          </div>
        ))}
      </div>
      {filtered.length === 0 && <EmptyState message="No isolation rooms match" icon={Shield} />}
      {modal && (
        <Modal title={`Isolation — ${modal.room}`} subtitle={modal.patient} onClose={() => setModal(null)}>
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <Row label="Room" value={modal.room} />
              <Row label="Unit" value={modal.unit} />
              <Row label="Patient" value={modal.patient} />
              <Row label="Precaution" value={modal.precaution} />
              <Row label="Organism" value={modal.organism} />
              <Row label="PPE Compliance" value={modal.ppeCompliance + "%"} />
              <Row label="Days in Isolation" value={modal.daysIsolation} />
              <Row label="Staff Briefed" value={modal.staffBriefed} />
              <Row label="Visitors Restricted" value={modal.visitorsRestricted ? "Yes" : "No"} />
              <Row label="Status" value={modal.status} />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 *  Tab 5 – Outbreak Surveillance
 * ------------------------------------------------------------------ */

function OutbreakWatchTab({ data, toasts }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [modal, setModal] = useState(null);
  const filters = ["All", "Active", "Investigating", "Declining"];

  const filtered = useMemo(
    () =>
      data.filter((o) => {
        const s =
          !search ||
          o.organism.toLowerCase().includes(search.toLowerCase()) ||
          o.unit.toLowerCase().includes(search.toLowerCase()) ||
          o.id.toLowerCase().includes(search.toLowerCase());
        const f = filter === "All" ? true : o.status === filter;
        return s && f;
      }),
    [data, search, filter]
  );

  const onExport = useCallback(() => {
    downloadCsv(
      "outbreak-surveillance.csv",
      filtered.map((o) => ({
        ID: o.id, Organism: o.organism, Type: o.type, Cases: o.cases,
        Unit: o.unit, FirstSeen: o.firstSeen, LastSeen: o.lastSeen,
        Risk: o.risk, Status: o.status, Source: o.source,
      }))
    );
    toasts.toast("Outbreak data exported", "Low");
  }, [filtered, toasts]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <CompactSearch value={search} onChange={setSearch} placeholder="Search organism, unit..." />
        <FilterChips options={filters} value={filter} onChange={setFilter} />
        <div className="ml-auto"><ExportCsvButton onClick={onExport} /></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((o) => (
          <div
            key={o.id}
            onClick={() => setModal(o)}
            className={`bg-slate-900 border rounded-xl p-4 cursor-pointer hover:border-slate-600 transition group ${
              o.risk === "Critical" ? "border-rose-500/30" : o.risk === "High" ? "border-amber-500/20" : "border-slate-800"
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-sm font-semibold text-slate-100 group-hover:text-rose-400 transition">{o.organism}</p>
                <p className="text-xs text-slate-500">{o.id} · {o.unit}</p>
              </div>
              <ToneBadge tone={riskTone(o.risk)}>{o.risk}</ToneBadge>
            </div>
            <div className="bg-slate-950/50 rounded-lg p-3 mb-3">
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="text-center">
                  <p className="text-slate-500">Cases</p>
                  <p className={`font-mono font-bold ${o.cases >= 5 ? "text-rose-400" : "text-slate-300"}`}>{o.cases}</p>
                </div>
                <div className="text-center">
                  <p className="text-slate-500">First Seen</p>
                  <p className="font-bold text-slate-300 text-[11px]">{o.firstSeen}</p>
                </div>
                <div className="text-center">
                  <p className="text-slate-500">Last Seen</p>
                  <p className="font-bold text-slate-300 text-[11px]">{o.lastSeen}</p>
                </div>
              </div>
            </div>
            <div className="text-[11px] text-slate-500 mb-2">
              <span className="font-medium">Source:</span> {o.source}
            </div>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {o.actions.slice(0, 2).map((a, i) => (
                <span key={i} className="rounded-md bg-slate-800 px-1.5 py-0.5 text-[9px] text-slate-400">{a}</span>
              ))}
              {o.actions.length > 2 && (
                <span className="rounded-md bg-slate-800 px-1.5 py-0.5 text-[9px] text-slate-500">+{o.actions.length - 2}</span>
              )}
            </div>
            <div className="flex items-center justify-between border-t border-slate-800 pt-3">
              <ToneBadge tone={o.status === "Active" ? "red" : o.status === "Investigating" ? "amber" : "green"}>{o.status}</ToneBadge>
              <span className="flex items-center gap-1 text-[11px] font-semibold text-rose-400">Investigate <ChevronRight size={13} /></span>
            </div>
          </div>
        ))}
      </div>
      {filtered.length === 0 && <EmptyState message="No outbreak clusters detected" icon={AlertOctagon} />}
      {modal && (
        <Modal title={`Outbreak — ${modal.organism}`} subtitle={modal.id} onClose={() => setModal(null)}>
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <Row label="Organism" value={modal.organism} />
              <Row label="Type" value={modal.type} />
              <Row label="Cases" value={modal.cases} />
              <Row label="Unit" value={modal.unit} />
              <Row label="First Seen" value={modal.firstSeen} />
              <Row label="Last Seen" value={modal.lastSeen} />
              <Row label="Risk Level" value={modal.risk} />
              <Row label="Status" value={modal.status} />
              <Row label="Probable Source" value={modal.source} />
            </div>
            <div className="border-t border-slate-800 pt-3">
              <p className="text-xs font-semibold text-slate-400 mb-2">Active Interventions</p>
              {modal.actions.map((a, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-slate-300 mb-1">
                  <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-amber-500" />
                  {a}
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
 *  Main hub component
 * ------------------------------------------------------------------ */

export default function InfectionControlStewardshipHub() {
  const [activeTab, setActiveTab] = useState("hais");
  const toasts = useToastTray();

  const stats = useMemo(() => {
    const activeHais = HAI_RECORDS.filter((h) => h.status === "Active").length;
    const restrictedAbx = ANTIBIOTIC_RECORDS.filter((a) => a.restricted && !a.deEscalated).length;
    const avgHygiene = Math.round(HAND_HYGIENE.reduce((a, d) => a + d.rate, 0) / HAND_HYGIENE.length);
    const activeOutbreaks = OUTBREAK_CLUSTERS.filter((o) => o.status === "Active").length;
    return { activeHais, restrictedAbx, avgHygiene, activeOutbreaks };
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <PageHeader
          icon={<ShieldCheck size={26} className="text-emerald-400" />}
          title="Infection Control & Antimicrobial Stewardship"
          subtitle="HAIs · Antibiotics · Hand Hygiene · Isolation · Outbreaks"
        />

        {/* Stat row */}
        <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard icon={Bug} label="Active HAIs" value={stats.activeHais} sub="Hospital-acquired infections" tone="rose" />
          <StatCard icon={Pill} label="Restricted ABx" value={stats.restrictedAbx} sub="Non-de-escalated restricted agents" tone="amber" />
          <StatCard icon={Droplets} label="Hygiene Rate" value={stats.avgHygiene + "%"} sub="Overall hand hygiene compliance" tone="emerald" />
          <StatCard icon={AlertOctagon} label="Active Outbreaks" value={stats.activeOutbreaks} sub="Clusters under investigation" tone="violet" />
        </div>

        {/* Tabs */}
        <div className="mt-8">
          <TabsBar tabs={TABS} active={activeTab} onChange={setActiveTab} accent="emerald" />

          <div className="mt-5">
            {activeTab === "hais" && <HaiDashboardTab data={HAI_RECORDS} toasts={toasts} />}
            {activeTab === "abx" && <AntibioticStewardshipTab data={ANTIBIOTIC_RECORDS} toasts={toasts} />}
            {activeTab === "hygiene" && <HandHygieneTab data={HAND_HYGIENE} toasts={toasts} />}
            {activeTab === "isolation" && <IsolationPpeTab data={ISOLATION_ROOMS} toasts={toasts} />}
            {activeTab === "outbreak" && <OutbreakWatchTab data={OUTBREAK_CLUSTERS} toasts={toasts} />}
          </div>
        </div>
      </div>

      {/* Toast tray */}
      <ToastTray toasts={toasts.toasts} critical={["High", "Critical"]} />

      {/* Footer */}
      <Footer>
        MedTrack Infection Control Hub · Antimicrobial Stewardship · {new Date().getFullYear()}
      </Footer>
    </div>
  );
}
