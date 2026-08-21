import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Activity,
  Heart,
  HeartPulse,
  ShieldAlert,
  AlertTriangle,
  Zap,
  Gauge,
  Sliders,
  TrendingUp,
  TrendingDown,
  Wind,
  Droplets,
  Radio,
  FileText,
  Download,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  User,
  Users,
  Eye,
  Layers,
  ChevronRight,
  Stethoscope,
  Siren,
  X,
  Plus,
  Play,
  Pause,
  SlidersHorizontal,
  Flame,
  ShieldCheck,
  Award,
  Cpu,
  ArrowUpRight,
  ArrowDownRight,
  Maximize2,
  Baby,
  Thermometer,
  Pill,
  Scale
} from "lucide-react";
import { downloadCsv } from "../../utils/csv";
import { useKindToasts, KindToastTray } from "../../components/common/HubToasts";
import { DetailRow as Row, AlertStatCard as StatCard, MiniStat as Vital } from "../../components/common/HubCards";

// ==========================================
// SEED PICU PATIENTS DATA
// ==========================================
const SEED_PICU_PATIENTS = [
  {
    id: "PT-PICU-401",
    name: "Noah Alexander",
    ageMonths: 14,
    gender: "Male",
    weightKg: 10.4,
    bed: "PICU-POD-01",
    diagnosis: "Severe RSV Bronchiolitis / Secondary Bacterial Pneumonia / Pediatric ARDS",
    ventMode: "HFOV (SensorMedics 3100A)",
    hfovFreqHz: 9.0,
    hfovMap: 22.0, // cmH2O
    hfovDeltaP: 42.0, // cmH2O (Amplitude)
    hfovFiO2: 0.70, // 70%
    hfovBiasFlow: 24, // L/min
    hfovITime: 33, // 33%
    hr: 154,
    map: 58,
    sbp: 82,
    dbp: 46,
    cvp: 11,
    spo2: 91,
    etco2: 48,
    tempC: 38.6,
    pao2: 66,
    paco2: 54,
    ph: 7.26,
    hco3: 21.2,
    lactate: 2.8,
    oi: 23.3, // (22 * 70) / 66 -> Severe PARDS
    osi: 16.9,
    vis: 24.5,
    pelod2: 8,
    prism4: 18.4, // % mortality risk
    pardsSeverity: "SEVERE_PARDS",
    inotropes: [
      { drug: "Epinephrine", dose: 0.12, unit: "mcg/kg/min" },
      { drug: "Milrinone", dose: 0.50, unit: "mcg/kg/min" },
      { drug: "Norepinephrine", dose: 0.05, unit: "mcg/kg/min" }
    ],
    sedationLines: [
      { drug: "Dexmedetomidine", rate: 0.7, unit: "mcg/kg/hr" },
      { drug: "Midazolam", rate: 0.15, unit: "mg/kg/hr" },
      { drug: "Vecuronium", rate: 0.1, unit: "mg/kg/hr" }
    ],
    fluids: "D5 0.45% NS + 20 mEq KCl @ 35 mL/hr",
    urineOutput: 1.4, // mL/kg/hr
    status: "CRITICAL",
    riskCategory: "Severe Pediatric Hypoxemic Failure",
    admissionTime: "2026-08-19 03:15",
    attendingPhysician: "Dr. Maya Lin, MD (Pediatric Critical Care)",
    alerts: [
      "Oxygenation Index (OI 23.3) exceeds Severe PARDS threshold (OI >= 16)",
      "High-Frequency Delta-P requires active chest wiggle monitoring",
      "Lactate rising (2.8 mmol/L) - VIS titrated to 24.5"
    ]
  },
  {
    id: "PT-PICU-402",
    name: "Sophia Grace Martinez",
    ageMonths: 38,
    gender: "Female",
    weightKg: 14.8,
    bed: "PICU-POD-02",
    diagnosis: "Meningococcal Septic Shock / Purpura Fulminans / Multi-Organ Dysfunction",
    ventMode: "Conventional PRVC",
    pip: 28,
    peep: 10,
    rr: 28,
    vt: 88, // ~6 mL/kg
    fiO2: 0.55,
    hr: 168,
    map: 50,
    sbp: 74,
    dbp: 38,
    cvp: 8,
    spo2: 94,
    etco2: 36,
    tempC: 39.4,
    pao2: 78,
    paco2: 38,
    ph: 7.18,
    hco3: 14.5,
    lactate: 5.4,
    oi: 9.8, // (14 * 55) / 78 -> Moderate PARDS
    osi: 8.2,
    vis: 42.0,
    pelod2: 12,
    prism4: 31.2,
    pardsSeverity: "MODERATE_PARDS",
    inotropes: [
      { drug: "Norepinephrine", dose: 0.25, unit: "mcg/kg/min" },
      { drug: "Epinephrine", dose: 0.15, unit: "mcg/kg/min" },
      { drug: "Vasopressin", dose: 0.0005, unit: "units/kg/min" }
    ],
    sedationLines: [
      { drug: "Fentanyl", rate: 2.0, unit: "mcg/kg/hr" },
      { drug: "Midazolam", rate: 0.2, unit: "mg/kg/hr" }
    ],
    fluids: "Albumin 5% bolus + Plasmalyte maintenance @ 48 mL/hr",
    urineOutput: 0.6, // Oliguria
    status: "CRITICAL",
    riskCategory: "Refractory Septic Shock / PELOD-2 > 10",
    admissionTime: "2026-08-19 18:40",
    attendingPhysician: "Dr. Ethan Hayes, MD (Pediatric Intensivist)",
    alerts: [
      "Severe Hyperlactatemia (5.4 mmol/L) with High VIS Score (42.0)",
      "Oliguria (< 1.0 mL/kg/hr) meeting KDIGO Stage 2 AKI criteria",
      "Septic shock hemodynamic refractory alert - hydrocortisone indicated"
    ]
  },
  {
    id: "PT-PICU-403",
    name: "Liam Chen",
    ageMonths: 6,
    gender: "Male",
    weightKg: 6.8,
    bed: "PICU-POD-03",
    diagnosis: "Post-Operative Norwood Stage 1 (HLHS) / Delayed Sternal Closure",
    ventMode: "SIMV-PC",
    pip: 22,
    peep: 6,
    rr: 32,
    vt: 40,
    fiO2: 0.40,
    hr: 142,
    map: 48,
    sbp: 68,
    dbp: 38,
    cvp: 9,
    spo2: 82, // Target 75-85% for balanced single ventricle circulation
    etco2: 40,
    tempC: 37.1,
    pao2: 44,
    paco2: 42,
    ph: 7.35,
    hco3: 22.0,
    lactate: 2.1,
    oi: 7.2,
    osi: 3.9,
    vis: 18.0,
    pelod2: 5,
    prism4: 12.0,
    pardsSeverity: "MILD_PARDS",
    inotropes: [
      { drug: "Milrinone", dose: 0.60, unit: "mcg/kg/min" },
      { drug: "Epinephrine", dose: 0.06, unit: "mcg/kg/min" },
      { drug: "Dopamine", dose: 4.0, unit: "mcg/kg/min" }
    ],
    sedationLines: [
      { drug: "Morphine", rate: 20, unit: "mcg/kg/hr" },
      { drug: "Dexmedetomidine", rate: 0.5, unit: "mcg/kg/hr" }
    ],
    fluids: "D10 0.2% NS @ 20 mL/hr",
    urineOutput: 2.2,
    status: "GUARDED",
    riskCategory: "Congenital Single Ventricle Physiology",
    admissionTime: "2026-08-18 11:20",
    attendingPhysician: "Dr. Alistair Finch, MD (Pediatric Cardiac Critical Care)",
    alerts: [
      "Single ventricle Qp:Qs balanced target: SpO2 locked at 75-85%",
      "Chest open with silastic patch: strict mediastinal aseptic protocol",
      "Near-infrared spectroscopy (NIRS): Renal 62%, Cerebral 68%"
    ]
  },
  {
    id: "PT-PICU-404",
    name: "Emily Watson",
    ageMonths: 72, // 6 yo
    gender: "Female",
    weightKg: 21.0,
    bed: "PICU-POD-04",
    diagnosis: "Status Epilepticus / Refractory to 2nd-line Anticonvulsants / Continuous EEG",
    ventMode: "AC-VC",
    pip: 20,
    peep: 5,
    rr: 20,
    vt: 145,
    fiO2: 0.35,
    hr: 96,
    map: 72,
    sbp: 104,
    dbp: 56,
    cvp: 6,
    spo2: 99,
    etco2: 38,
    tempC: 37.3,
    pao2: 102,
    paco2: 39,
    ph: 7.39,
    hco3: 23.4,
    lactate: 1.2,
    oi: 2.4,
    osi: 2.5,
    vis: 2.0,
    pelod2: 2,
    prism4: 4.5,
    pardsSeverity: "NO_PARDS",
    inotropes: [
      { drug: "Dobutamine", dose: 2.0, unit: "mcg/kg/min" }
    ],
    sedationLines: [
      { drug: "Midazolam Infusion", rate: 0.6, unit: "mg/kg/hr" },
      { drug: "Ketamine Infusion", rate: 1.5, unit: "mg/kg/hr" },
      { drug: "Propofol", rate: 2.0, unit: "mg/kg/hr" }
    ],
    fluids: "D5 0.45% NS @ 62 mL/hr",
    urineOutput: 2.8,
    status: "STABLE",
    riskCategory: "Continuous Burst Suppression Target",
    admissionTime: "2026-08-17 20:10",
    attendingPhysician: "Dr. Maya Lin, MD (Pediatric Critical Care)",
    alerts: [
      "Continuous Video-EEG: 85% Burst Suppression Achieved",
      "Propofol Infusion Syndrome (PRIS) surveillance: Triglycerides & CK q12h",
      "Neuromonitoring ICP: 11 mmHg (Target < 15 mmHg)"
    ]
  }
];

export default function PicuCriticalTelemetryHub() {
  const { toasts, toast } = useKindToasts();
  const [patients, setPatients] = useState(SEED_PICU_PATIENTS);
  const [selectedPatientId, setSelectedPatientId] = useState(SEED_PICU_PATIENTS[0].id);
  const [activeTab, setActiveTab] = useState("overview"); // overview, hfov, scores, calculations, protocols
  const [isLiveStreaming, setIsLiveStreaming] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSeverity, setFilterSeverity] = useState("ALL");
  const [inspectModalOpen, setInspectModalOpen] = useState(false);
  const [protocolModal, setProtocolModal] = useState(null);

  // Dynamic calculation workbench states
  const [calcAgeMonths, setCalcAgeMonths] = useState(18);
  const [calcWeightKg, setCalcWeightKg] = useState(11.5);
  const [calcMeanPaw, setCalcMeanPaw] = useState(20.0);
  const [calcFiO2, setCalcFiO2] = useState(65);
  const [calcPaO2, setCalcPaO2] = useState(72);
  const [calcSpO2, setCalcSpO2] = useState(92);
  const [calcEpiDose, setCalcEpiDose] = useState(0.1);
  const [calcNorepiDose, setCalcNorepiDose] = useState(0.08);
  const [calcMilrinoneDose, setCalcMilrinoneDose] = useState(0.5);
  const [calcVasoDose, setCalcVasoDose] = useState(0.0004);

  const selectedPatient = useMemo(() => {
    return patients.find((p) => p.id === selectedPatientId) || patients[0];
  }, [patients, selectedPatientId]);

  // Live telemetry stream simulator
  useEffect(() => {
    if (!isLiveStreaming) return;
    const interval = setInterval(() => {
      setPatients((prev) =>
        prev.map((pt) => {
          const hrDelta = Math.floor(Math.random() * 5) - 2;
          const mapDelta = Math.floor(Math.random() * 3) - 1;
          const spo2Delta = Math.random() > 0.8 ? (Math.random() > 0.5 ? 1 : -1) : 0;
          return {
            ...pt,
            hr: Math.max(60, Math.min(220, pt.hr + hrDelta)),
            map: Math.max(30, Math.min(120, pt.map + mapDelta)),
            spo2: Math.max(70, Math.min(100, pt.spo2 + spo2Delta))
          };
        })
      );
    }, 2500);
    return () => clearInterval(interval);
  }, [isLiveStreaming]);

  // Filtered patient list
  const filteredPatients = useMemo(() => {
    return patients.filter((pt) => {
      const matchesSearch =
        pt.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pt.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pt.bed.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pt.diagnosis.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSeverity =
        filterSeverity === "ALL" ||
        (filterSeverity === "CRITICAL" && pt.status === "CRITICAL") ||
        (filterSeverity === "PARDS" && pt.pardsSeverity.includes("PARDS")) ||
        (filterSeverity === "HFOV" && pt.ventMode.includes("HFOV"));
      return matchesSearch && matchesSeverity;
    });
  }, [patients, searchQuery, filterSeverity]);

  // Calculated Workbench metrics
  const computedOI = useMemo(() => {
    if (!calcPaO2 || calcPaO2 <= 0) return 0;
    return Number(((calcMeanPaw * calcFiO2) / calcPaO2).toFixed(2));
  }, [calcMeanPaw, calcFiO2, calcPaO2]);

  const computedOSI = useMemo(() => {
    if (!calcSpO2 || calcSpO2 <= 0) return 0;
    return Number(((calcMeanPaw * calcFiO2) / calcSpO2).toFixed(2));
  }, [calcMeanPaw, calcFiO2, calcSpO2]);

  const computedVIS = useMemo(() => {
    const epi = Number(calcEpiDose) || 0;
    const norepi = Number(calcNorepiDose) || 0;
    const mil = Number(calcMilrinoneDose) || 0;
    const vaso = Number(calcVasoDose) || 0;
    const total = 100 * epi + 100 * norepi + 10 * mil + 10000 * vaso;
    return Number(total.toFixed(2));
  }, [calcEpiDose, calcNorepiDose, calcMilrinoneDose, calcVasoDose]);

  const handleExportCsv = () => {
    const headers = [
      "Patient ID",
      "Name",
      "Age (Months)",
      "Bed",
      "Status",
      "Ventilation Mode",
      "Oxygenation Index (OI)",
      "VIS Score",
      "PELOD-2",
      "PRISM-IV Mortality %",
      "PARDS Severity",
      "MAP (mmHg)",
      "Heart Rate (bpm)",
      "SpO2 (%)",
      "Lactate (mmol/L)"
    ];
    const rows = patients.map((p) => [
      p.id,
      p.name,
      p.ageMonths,
      p.bed,
      p.status,
      p.ventMode,
      p.oi,
      p.vis,
      p.pelod2,
      p.prism4,
      p.pardsSeverity,
      p.map,
      p.hr,
      p.spo2,
      p.lactate
    ]);
    downloadCsv("picu_critical_telemetry_manifest.csv", headers, rows);
    toast.success("PICU Telemetry & Clinical Manifest exported to CSV successfully.");
  };

  const triggerEmergencyProtocol = (protocolName) => {
    setProtocolModal(protocolName);
    toast.error(`EMERGENCY ALERT: ${protocolName} initiated for ${selectedPatient.name} (${selectedPatient.bed})`);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-6 font-sans">
      <KindToastTray toasts={toasts} />

      {/* HEADER COMMAND BAR */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-950/80 border border-cyan-500/30 text-cyan-400 shadow-lg shadow-cyan-950/50">
              <Baby className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white flex items-center gap-2">
                Pediatric ICU & Critical Telemetry Command Station
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/40 text-cyan-300 font-semibold tracking-normal uppercase">
                  PALICC-2 / PELOD-2 / HFOV
                </span>
              </h1>
              <p className="text-sm text-slate-400">
                Continuous high-frequency oscillatory ventilation metrics, pediatric hemodynamics, vasoactive scoring, and multi-organ dysfunction surveillance.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-stretch md:self-auto justify-end">
          <button
            onClick={() => setIsLiveStreaming(!isLiveStreaming)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all border ${
              isLiveStreaming
                ? "bg-rose-950/60 border-rose-500/40 text-rose-300 hover:bg-rose-900/60"
                : "bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800"
            }`}
          >
            {isLiveStreaming ? <Pause className="w-3.5 h-3.5 animate-pulse" /> : <Play className="w-3.5 h-3.5" />}
            {isLiveStreaming ? "LIVE STREAM ACTIVE" : "STREAM PAUSED"}
          </button>

          <button
            onClick={handleExportCsv}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold bg-slate-900 border border-slate-700 text-slate-200 hover:bg-slate-800 transition-all"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            EXPORT CSV
          </button>

          <button
            onClick={() => triggerEmergencyProtocol("PEDIATRIC CODE BLUE / RAPID ARREST")}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-extrabold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-950 transition-all"
          >
            <Siren className="w-4 h-4 animate-bounce" />
            CODE BLUE
          </button>
        </div>
      </div>

      {/* QUICK STATS HEADER */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
        <StatCard
          icon={Users}
          label="PICU Census"
          value={`${patients.length} Beds`}
          subtext="100% Monitored"
          color="cyan"
        />
        <StatCard
          icon={Wind}
          label="HFOV / High Support"
          value={patients.filter((p) => p.ventMode.includes("HFOV") || p.oi >= 16).length.toString()}
          subtext="SensorMedics 3100"
          color="purple"
        />
        <StatCard
          icon={ShieldAlert}
          label="Severe PARDS (OI >= 16)"
          value={patients.filter((p) => p.oi >= 16).length.toString()}
          subtext="PALICC-2 Criteria"
          color="rose"
        />
        <StatCard
          icon={Zap}
          label="High VIS Score (>20)"
          value={patients.filter((p) => p.vis >= 20).length.toString()}
          subtext="Inotrope Heavy"
          color="amber"
        />
        <StatCard
          icon={Activity}
          label="PELOD-2 > 6 (MODS)"
          value={patients.filter((p) => p.pelod2 >= 6).length.toString()}
          subtext="Multi-Organ Risk"
          color="indigo"
        />
        <StatCard
          icon={ShieldCheck}
          label="Clinical Safety Guard"
          value="100% Compliant"
          subtext="FDA 21 CFR Pt 11"
          color="emerald"
        />
      </div>

      {/* MAIN WORKSPACE GRID */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* LEFT COLUMN: PATIENT SELECTION & LIST */}
        <div className="xl:col-span-4 space-y-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl">
            <div className="flex items-center justify-between gap-2 mb-3">
              <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4 text-cyan-400" />
                Active PICU Cohort ({filteredPatients.length})
              </h2>
              <span className="text-xs text-slate-500 font-mono">Live Telemetry</span>
            </div>

            {/* SEARCH AND FILTERS */}
            <div className="space-y-2 mb-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search name, bed, diagnosis..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                {["ALL", "CRITICAL", "PARDS", "HFOV"].map((sev) => (
                  <button
                    key={sev}
                    onClick={() => setFilterSeverity(sev)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                      filterSeverity === sev
                        ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/50"
                        : "bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200"
                    }`}
                  >
                    {sev}
                  </button>
                ))}
              </div>
            </div>

            {/* PATIENT LIST */}
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {filteredPatients.map((p) => {
                const isSelected = p.id === selectedPatient.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPatientId(p.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? "bg-slate-800/90 border-cyan-500/60 shadow-lg shadow-cyan-950/30 ring-1 ring-cyan-500/30"
                        : "bg-slate-950/60 border-slate-800/80 hover:bg-slate-800/40 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-100">{p.name}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-cyan-400">
                            {p.bed}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 line-clamp-1">{p.diagnosis}</p>
                      </div>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          p.status === "CRITICAL"
                            ? "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                            : p.status === "GUARDED"
                            ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                            : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                        }`}
                      >
                        {p.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-4 gap-1 pt-2 border-t border-slate-800/80 text-center text-[10px]">
                      <div className="bg-slate-900/60 rounded p-1">
                        <span className="text-slate-500 block">HR</span>
                        <span className="font-bold text-slate-200">{p.hr}</span>
                      </div>
                      <div className="bg-slate-900/60 rounded p-1">
                        <span className="text-slate-500 block">MAP</span>
                        <span className="font-bold text-cyan-300">{p.map}</span>
                      </div>
                      <div className="bg-slate-900/60 rounded p-1">
                        <span className="text-slate-500 block">OI</span>
                        <span className={`font-bold ${p.oi >= 16 ? "text-rose-400" : "text-amber-300"}`}>
                          {p.oi}
                        </span>
                      </div>
                      <div className="bg-slate-900/60 rounded p-1">
                        <span className="text-slate-500 block">VIS</span>
                        <span className={`font-bold ${p.vis >= 20 ? "text-rose-400" : "text-emerald-300"}`}>
                          {p.vis}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: ACTIVE PATIENT CONSOLE & TABS */}
        <div className="xl:col-span-8 space-y-4">
          {/* PATIENT BANNER */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-5 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
              <div>
                <div className="flex items-center gap-3">
                  <span className="text-xl md:text-2xl font-black text-white">{selectedPatient.name}</span>
                  <span className="text-xs px-2.5 py-1 rounded-md bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-mono font-bold">
                    {selectedPatient.id}
                  </span>
                  <span className="text-xs px-2.5 py-1 rounded-md bg-purple-950 border border-purple-500/40 text-purple-300 font-mono font-bold">
                    {selectedPatient.bed}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1 flex items-center gap-3 flex-wrap">
                  <span>Age: <b className="text-slate-200">{selectedPatient.ageMonths} mos ({Math.floor(selectedPatient.ageMonths/12)}y {selectedPatient.ageMonths%12}m)</b></span>
                  <span>•</span>
                  <span>Weight: <b className="text-slate-200">{selectedPatient.weightKg} kg</b></span>
                  <span>•</span>
                  <span>Gender: <b className="text-slate-200">{selectedPatient.gender}</b></span>
                  <span>•</span>
                  <span>Attending: <b className="text-cyan-400">{selectedPatient.attendingPhysician}</b></span>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setInspectModalOpen(true)}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/40 flex items-center gap-1.5 transition-all shadow-lg"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Full Clinical Inspector
                </button>
                <button
                  onClick={() => triggerEmergencyProtocol("MASSIVE TRANSFUSION PROTOCOL (MTP)")}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-500/40 flex items-center gap-1.5 transition-all"
                >
                  <Droplets className="w-3.5 h-3.5" />
                  Pediatric MTP
                </button>
              </div>
            </div>

            {/* LIVE VITALS STRIP */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5 mt-5 pt-4 border-t border-slate-800/80">
              <Vital label="Heart Rate" value={`${selectedPatient.hr} bpm`} status={selectedPatient.hr > 150 ? "high" : "normal"} />
              <Vital label="Arterial MAP" value={`${selectedPatient.map} mmHg`} status={selectedPatient.map < 55 ? "critical" : "normal"} />
              <Vital label="SpO2 Sat" value={`${selectedPatient.spo2}%`} status={selectedPatient.spo2 < 92 ? "warning" : "normal"} />
              <Vital label="Blood Lactate" value={`${selectedPatient.lactate} mmol/L`} status={selectedPatient.lactate > 2.0 ? "warning" : "normal"} />
              <Vital label="Oxygenation Index" value={selectedPatient.oi.toString()} status={selectedPatient.oi >= 16 ? "critical" : "warning"} />
              <Vital label="VIS Score" value={selectedPatient.vis.toString()} status={selectedPatient.vis >= 20 ? "critical" : "normal"} />
            </div>
          </div>

          {/* TAB NAVIGATION */}
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
            {[
              { id: "overview", label: "PICU Telemetry & Vitals", icon: Activity },
              { id: "hfov", label: "HFOV & Respiratory Mechanics", icon: Wind },
              { id: "scores", label: "Risk Scores (PELOD/PRISM)", icon: ShieldAlert },
              { id: "calculations", label: "Real-Time Calculator Workbench", icon: Sliders },
              { id: "protocols", label: "Emergency & Resuscitation Protocols", icon: Siren }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    isActive
                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-md shadow-cyan-950/40"
                      : "bg-slate-900/60 text-slate-400 border border-slate-800/80 hover:text-slate-200 hover:bg-slate-800/60"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* TAB CONTENT: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* INOTROPE & VASOACTIVE INFUSIONS */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl">
                  <h3 className="text-sm font-bold text-slate-200 mb-3 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-amber-400" />
                      Vasoactive & Inotropic Lines (VIS = {selectedPatient.vis})
                    </span>
                    <span className="text-[11px] font-mono text-amber-400 font-semibold">Continuous Infusion</span>
                  </h3>
                  <div className="space-y-2">
                    {selectedPatient.inotropes.map((ino, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs">
                        <span className="font-semibold text-slate-200">{ino.drug}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-amber-300">{ino.dose}</span>
                          <span className="text-slate-500 text-[10px]">{ino.unit}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800">
                    <h4 className="text-xs font-bold text-slate-400 mb-2 flex items-center gap-1.5">
                      <Pill className="w-3.5 h-3.5 text-cyan-400" /> Sedation, Analgesia & Neuromuscular Blockade
                    </h4>
                    <div className="space-y-1.5">
                      {selectedPatient.sedationLines.map((sed, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 rounded bg-slate-950/60 border border-slate-800/80 text-[11px]">
                          <span className="text-slate-300">{sed.drug}</span>
                          <span className="font-mono text-cyan-300 font-bold">{sed.rate} {sed.unit}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* BLOOD GAS & ORGAN PERFUSION */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
                  <h3 className="text-sm font-bold text-slate-200 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <HeartPulse className="w-4 h-4 text-cyan-400" />
                      Arterial Blood Gas & Perfusion Indices
                    </span>
                    <span className="text-[11px] font-mono text-cyan-400">q2h ABG Sync</span>
                  </h3>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                      <span className="text-slate-500 text-[10px] block">pH</span>
                      <span className={`font-mono font-bold text-sm ${selectedPatient.ph < 7.30 ? "text-rose-400" : "text-emerald-400"}`}>
                        {selectedPatient.ph}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                      <span className="text-slate-500 text-[10px] block">PaO2</span>
                      <span className="font-mono font-bold text-sm text-cyan-300">{selectedPatient.pao2} mmHg</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                      <span className="text-slate-500 text-[10px] block">PaCO2</span>
                      <span className="font-mono font-bold text-sm text-purple-300">{selectedPatient.paco2} mmHg</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                      <span className="text-slate-500 text-[10px] block">HCO3-</span>
                      <span className="font-mono font-bold text-sm text-slate-200">{selectedPatient.hco3} mEq/L</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                      <span className="text-slate-500 text-[10px] block">Lactate</span>
                      <span className={`font-mono font-bold text-sm ${selectedPatient.lactate > 2.0 ? "text-rose-400" : "text-emerald-400"}`}>
                        {selectedPatient.lactate} mmol/L
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                      <span className="text-slate-500 text-[10px] block">Urine Output</span>
                      <span className={`font-mono font-bold text-sm ${selectedPatient.urineOutput < 1.0 ? "text-rose-400" : "text-emerald-400"}`}>
                        {selectedPatient.urineOutput} mL/kg/h
                      </span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1.5">
                    <div className="flex justify-between text-slate-400">
                      <span>Maintenance Fluids:</span>
                      <span className="font-semibold text-slate-200">{selectedPatient.fluids}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Clinical Trajectory:</span>
                      <span className="font-bold text-rose-400 uppercase">{selectedPatient.riskCategory}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* CRITICAL CLINICAL ALERTS LEDGER */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl">
                <h3 className="text-sm font-bold text-slate-200 mb-3 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-500" />
                  Active Clinical Surveillance & Safety Warnings
                </h3>
                <div className="space-y-2">
                  {selectedPatient.alerts.map((alt, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-2.5 rounded-lg bg-rose-950/30 border border-rose-500/30 text-xs text-rose-200">
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>{alt}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB CONTENT: HFOV */}
          {activeTab === "hfov" && (
            <div className="space-y-4">
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Wind className="w-5 h-5 text-cyan-400" />
                      High-Frequency Oscillatory Ventilation (HFOV) Protocol Hub
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Continuous lung recruitment and CO2 elimination via active oscillatory piston displacement.
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-purple-950 border border-purple-500/40 text-purple-300">
                    {selectedPatient.ventMode}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 mb-5">
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-500 block">Frequency</span>
                    <span className="text-lg font-black text-cyan-300 font-mono">{selectedPatient.hfovFreqHz || 10.0} Hz</span>
                    <span className="text-[9px] text-slate-600 block">600 osc/min</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-500 block">Mean Airway (mPaw)</span>
                    <span className="text-lg font-black text-purple-300 font-mono">{selectedPatient.hfovMap || 20.0} cmH2O</span>
                    <span className="text-[9px] text-slate-600 block">Oxygenation driver</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-500 block">Delta-P (Amplitude)</span>
                    <span className="text-lg font-black text-amber-300 font-mono">{selectedPatient.hfovDeltaP || 38.0} cmH2O</span>
                    <span className="text-[9px] text-slate-600 block">CO2 clearance</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-500 block">FiO2 Delivered</span>
                    <span className="text-lg font-black text-rose-300 font-mono">{((selectedPatient.hfovFiO2 || 0.6) * 100).toFixed(0)}%</span>
                    <span className="text-[9px] text-slate-600 block">Target SpO2 88-92%</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-500 block">Bias Flow</span>
                    <span className="text-lg font-black text-emerald-300 font-mono">{selectedPatient.hfovBiasFlow || 20} L/min</span>
                    <span className="text-[9px] text-slate-600 block">Circuit wash</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-500 block">% Inspiratory Time</span>
                    <span className="text-lg font-black text-indigo-300 font-mono">{selectedPatient.hfovITime || 33}%</span>
                    <span className="text-[9px] text-slate-600 block">1:2 I:E Ratio</span>
                  </div>
                </div>

                {/* HFOV CLINICAL PROTOCOL MATRIX */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                    <h4 className="text-xs font-bold text-cyan-400 mb-2 flex items-center gap-2">
                      <Wind className="w-4 h-4" /> Oxygenation Optimization Strategy
                    </h4>
                    <ul className="text-xs text-slate-300 space-y-1.5 list-disc pl-4">
                      <li>Adjust <b>Mean Airway Pressure (mPaw)</b> by 1-2 cmH2O increments to achieve optimal lung inflation (8-9 rib expansion on CXR).</li>
                      <li>Wean FiO2 first below 0.60 once PaO2 &gt; 60 mmHg or SpO2 &gt; 90% is stabilized.</li>
                      <li>Avoid over-inflation (rib expansion &gt; 9) which causes hemodynamic compromise due to RV afterload and decreased venous return.</li>
                    </ul>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                    <h4 className="text-xs font-bold text-amber-400 mb-2 flex items-center gap-2">
                      <Flame className="w-4 h-4" /> Ventilation / Hypercapnia Strategy
                    </h4>
                    <ul className="text-xs text-slate-300 space-y-1.5 list-disc pl-4">
                      <li>To reduce PaCO2: Increase <b>Amplitude (Delta-P)</b> to ensure chest wiggle from clavicle to mid-thigh.</li>
                      <li>To reduce PaCO2 further: Decrease <b>Frequency (Hz)</b> to enlarge tidal volume displacement (DCO2 = Vt^2 * f).</li>
                      <li>Allow permissive hypercapnia (pH &ge; 7.20) to prevent barotrauma and volutrauma.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB CONTENT: RISK SCORES */}
          {activeTab === "scores" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
                <h3 className="text-sm font-bold text-slate-200 mb-3 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-cyan-400" />
                  PELOD-2 (Pediatric Logistic Organ Dysfunction-2)
                </h3>
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 mb-4">
                  <div>
                    <span className="text-xs text-slate-400 block">Total Calculated Score</span>
                    <span className="text-3xl font-black text-cyan-300 font-mono">{selectedPatient.pelod2} / 33</span>
                  </div>
                  <span className={`text-xs px-3 py-1 rounded-full font-bold uppercase ${
                    selectedPatient.pelod2 >= 10 ? "bg-rose-500/20 text-rose-400 border border-rose-500/40" : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                  }`}>
                    {selectedPatient.pelod2 >= 10 ? "Severe Organ Failure" : "Moderate Risk"}
                  </span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between p-2 rounded bg-slate-950/60 border border-slate-800 text-slate-300">
                    <span>Cardiovascular Dysfunction (MAP/Lactate):</span>
                    <span className="font-mono text-cyan-300 font-bold">Included</span>
                  </div>
                  <div className="flex justify-between p-2 rounded bg-slate-950/60 border border-slate-800 text-slate-300">
                    <span>Respiratory Failure (PaO2/FiO2 + PaCO2):</span>
                    <span className="font-mono text-purple-300 font-bold">Included</span>
                  </div>
                  <div className="flex justify-between p-2 rounded bg-slate-950/60 border border-slate-800 text-slate-300">
                    <span>Neurologic (GCS & Pupillary Reflex):</span>
                    <span className="font-mono text-amber-300 font-bold">Included</span>
                  </div>
                  <div className="flex justify-between p-2 rounded bg-slate-950/60 border border-slate-800 text-slate-300">
                    <span>Renal / Hematologic Subcomponents:</span>
                    <span className="font-mono text-emerald-300 font-bold">Included</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
                <h3 className="text-sm font-bold text-slate-200 mb-3 flex items-center gap-2">
                  <Award className="w-4 h-4 text-purple-400" />
                  PRISM-IV & PARDS Mortality Predictor
                </h3>
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 mb-4">
                  <div>
                    <span className="text-xs text-slate-400 block">Predicted PICU Mortality</span>
                    <span className="text-3xl font-black text-purple-300 font-mono">{selectedPatient.prism4}%</span>
                  </div>
                  <span className="text-xs px-3 py-1 rounded-full font-bold uppercase bg-purple-500/20 text-purple-300 border border-purple-500/40">
                    PRISM-IV Validated
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">PALICC-2 Severity:</span>
                    <span className="font-bold text-rose-400">{selectedPatient.pardsSeverity}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Oxygen Saturation Index (OSI):</span>
                    <span className="font-mono text-cyan-300">{selectedPatient.osi}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Admission Epoch:</span>
                    <span className="font-mono text-slate-400">{selectedPatient.admissionTime}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB CONTENT: CALCULATIONS WORKBENCH */}
          {activeTab === "calculations" && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-cyan-400" />
                  Real-Time Clinical Telemetry & Risk Workbench
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Interactive simulation and validation for pediatric drug dosing, Oxygenation Index, and Vasoactive Score.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* VENTILATOR & OXYGENATION INPUTS */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Ventilatory Inputs</h4>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Mean Airway Pressure (mPaw): {calcMeanPaw} cmH2O</label>
                    <input
                      type="range"
                      min="5"
                      max="40"
                      step="0.5"
                      value={calcMeanPaw}
                      onChange={(e) => setCalcMeanPaw(parseFloat(e.target.value))}
                      className="w-full accent-cyan-400"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">FiO2 Delivered: {calcFiO2}%</label>
                    <input
                      type="range"
                      min="21"
                      max="100"
                      step="1"
                      value={calcFiO2}
                      onChange={(e) => setCalcFiO2(parseFloat(e.target.value))}
                      className="w-full accent-cyan-400"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">PaO2 (Arterial): {calcPaO2} mmHg</label>
                    <input
                      type="range"
                      min="30"
                      max="200"
                      step="1"
                      value={calcPaO2}
                      onChange={(e) => setCalcPaO2(parseFloat(e.target.value))}
                      className="w-full accent-cyan-400"
                    />
                  </div>
                </div>

                {/* INOTROPE DOSING INPUTS */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">Inotrope Lines (mcg/kg/min)</h4>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Epinephrine: {calcEpiDose} mcg/kg/min</label>
                    <input
                      type="range"
                      min="0"
                      max="1.0"
                      step="0.01"
                      value={calcEpiDose}
                      onChange={(e) => setCalcEpiDose(parseFloat(e.target.value))}
                      className="w-full accent-amber-400"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Norepinephrine: {calcNorepiDose} mcg/kg/min</label>
                    <input
                      type="range"
                      min="0"
                      max="1.0"
                      step="0.01"
                      value={calcNorepiDose}
                      onChange={(e) => setCalcNorepiDose(parseFloat(e.target.value))}
                      className="w-full accent-amber-400"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Milrinone: {calcMilrinoneDose} mcg/kg/min</label>
                    <input
                      type="range"
                      min="0"
                      max="1.5"
                      step="0.05"
                      value={calcMilrinoneDose}
                      onChange={(e) => setCalcMilrinoneDose(parseFloat(e.target.value))}
                      className="w-full accent-amber-400"
                    />
                  </div>
                </div>

                {/* COMPUTED RESULTS */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-3">Computed Indices</h4>
                    <div className="space-y-2.5">
                      <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex justify-between items-center">
                        <span className="text-xs text-slate-400">Oxygenation Index (OI):</span>
                        <span className={`text-sm font-black font-mono ${computedOI >= 16 ? "text-rose-400" : "text-cyan-300"}`}>
                          {computedOI}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex justify-between items-center">
                        <span className="text-xs text-slate-400">VIS Score:</span>
                        <span className={`text-sm font-black font-mono ${computedVIS >= 20 ? "text-rose-400" : "text-amber-300"}`}>
                          {computedVIS}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex justify-between items-center">
                        <span className="text-xs text-slate-400">PARDS Severity:</span>
                        <span className="text-xs font-bold uppercase text-rose-300">
                          {computedOI >= 16 ? "Severe PARDS" : computedOI >= 8 ? "Moderate PARDS" : "Mild / Normal"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => toast.success("Simulated parameters successfully pushed to PICU audit telemetry store.")}
                    className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg text-xs transition-all shadow-md mt-4"
                  >
                    Commit Simulation Parameters
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB CONTENT: PROTOCOLS */}
          {activeTab === "protocols" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
                <h3 className="text-sm font-bold text-rose-400 mb-3 flex items-center gap-2">
                  <Siren className="w-4 h-4" />
                  Pediatric Resuscitation & Shock Escalation
                </h3>
                <div className="space-y-2.5 text-xs text-slate-300">
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="font-bold text-white block mb-1">1. Fluid Refractory Shock (40-60 mL/kg given):</span>
                    <span>Initiate Epinephrine (0.05-0.3 mcg/kg/min) for cold shock or Norepinephrine (0.05-0.3 mcg/kg/min) for warm vasoplegic shock.</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="font-bold text-white block mb-1">2. Inotrope Refractory Shock (VIS &gt; 20):</span>
                    <span>Add Vasopressin (0.0003-0.002 units/kg/min) or consider Hydrocortisone stress dosing (50-100 mg/m2/day).</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="font-bold text-white block mb-1">3. VA-ECMO Cannulation Threshold:</span>
                    <span>Refractory arrest or lactate failing to clear with VIS &gt; 35 and cardiac index &lt; 2.0 L/min/m2.</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
                <h3 className="text-sm font-bold text-cyan-400 mb-3 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" />
                  PALICC-2 ARDS Lung Protective Protocol
                </h3>
                <div className="space-y-2.5 text-xs text-slate-300">
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="font-bold text-white block mb-1">1. Low Tidal Volume (Lung Protective):</span>
                    <span>Target Vt 4-6 mL/kg predicted body weight; keep plateau pressure &lt; 28 cmH2O.</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="font-bold text-white block mb-1">2. Prone Positioning:</span>
                    <span>Indicated for Moderate-to-Severe PARDS (OI &ge; 8.0) for minimum 16-18 hours continuous daily.</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="font-bold text-white block mb-1">3. HFOV Rescue:</span>
                    <span>Switch to HFOV if peak airway pressures exceed 32 cmH2O or intractable hypoxemia occurs.</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* INSPECT MODAL */}
      {inspectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setInspectModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-cyan-400">
                <Baby className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Full Clinical Dossier: {selectedPatient.name}</h2>
                <p className="text-xs text-slate-400">Bed: {selectedPatient.bed} | ID: {selectedPatient.id}</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <Row label="Primary Diagnosis" value={selectedPatient.diagnosis} />
              <Row label="Current Status" value={selectedPatient.status} />
              <Row label="Ventilation Support" value={selectedPatient.ventMode} />
              <Row label="Oxygenation Index (OI)" value={selectedPatient.oi} />
              <Row label="Vasoactive-Inotropic Score (VIS)" value={selectedPatient.vis} />
              <Row label="PELOD-2 Score" value={selectedPatient.pelod2} />
              <Row label="PRISM-IV Mortality Estimate" value={`${selectedPatient.prism4}%`} />
              <Row label="Attending Intensivist" value={selectedPatient.attendingPhysician} />
              <Row label="Admission Timestamp" value={selectedPatient.admissionTime} />
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setInspectModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold transition-all"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PROTOCOL MODAL */}
      {protocolModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="bg-rose-950/90 border border-rose-500/60 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative text-rose-100">
            <button
              onClick={() => setProtocolModal(null)}
              className="absolute top-4 right-4 text-rose-300 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 mb-4">
              <Siren className="w-8 h-8 text-rose-400 animate-bounce" />
              <div>
                <h2 className="text-xl font-black text-white">{protocolModal}</h2>
                <p className="text-xs text-rose-200">Patient: {selectedPatient.name} ({selectedPatient.bed})</p>
              </div>
            </div>
            <p className="text-sm text-rose-100 mb-4">
              Emergency workflow broadcast dispatched to PICU charge nurse, respiratory therapy, and pharmacy satellite.
            </p>
            <div className="p-3 bg-black/40 rounded-xl border border-rose-500/30 text-xs space-y-2 mb-6">
              <div>• Pediatric Weight: <b>{selectedPatient.weightKg} kg</b> (Broselow Zone Active)</div>
              <div>• Push-dose Epinephrine (1:100,000): <b>{(selectedPatient.weightKg * 0.01).toFixed(2)} mg ({(selectedPatient.weightKg * 0.1).toFixed(1)} mL)</b></div>
              <div>• Defibrillation Initial Dose (2 J/kg): <b>{(selectedPatient.weightKg * 2).toFixed(0)} Joules</b></div>
            </div>
            <button
              onClick={() => {
                toast.success(`Protocol ${protocolModal} execution confirmed.`);
                setProtocolModal(null);
              }}
              className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-extrabold rounded-xl text-xs transition-all shadow-lg"
            >
              Acknowledge & Dismiss Protocol
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
