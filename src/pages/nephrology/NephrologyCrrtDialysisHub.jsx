import React, { useState, useEffect, useMemo } from "react";
import {
  Activity,
  Heart,
  ShieldAlert,
  AlertTriangle,
  Zap,
  Gauge,
  Sliders,
  FileText,
  Download,
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
  Droplets,
  Scale,
  Thermometer,
  Pill,
  Workflow,
  RefreshCw
} from "lucide-react";
import { downloadCsv } from "../../utils/csv";
import { useKindToasts, KindToastTray } from "../../components/common/HubToasts";
import { DetailRow as Row, AlertStatCard as StatCard, MiniStat as Vital } from "../../components/common/HubCards";

// ==========================================
// SEED NEPHROLOGY CRRT PATIENTS DATA
// ==========================================
const SEED_CRRT_PATIENTS = [
  {
    id: "PT-CRRT-501",
    name: "Harold Jenkins",
    age: 67,
    gender: "Male",
    weightKg: 82.5,
    bed: "ICU-RENAL-01",
    diagnosis: "Septic Shock / Acute Tubular Necrosis / Refractory Anuric AKI",
    crrtMode: "CVVHDF (Continuous Veno-Venous Hemodiafiltration)",
    machineModel: "Baxter Prismaflex v8.0 / ST150 Filter",
    anticoagulation: "Regional Citrate Anticoagulation (RCA - ACD-A)",
    bloodFlowRate: 200, // mL/min
    dialysateFlow: 1200, // mL/hr
    replacementPre: 600, // mL/hr
    replacementPost: 400, // mL/hr
    netUfRate: 150, // mL/hr
    totalEffluentRate: 2350, // mL/hr
    deliveredDose: 28.5, // mL/kg/hr (KDIGO target > 20-25)
    accessPressure: -95, // mmHg
    returnPressure: 110, // mmHg
    filterPressure: 185, // mmHg
    effluentPressure: 45, // mmHg
    tmp: 102.5, // Transmembrane Pressure mmHg
    filterDrop: 75, // Filter pressure drop mmHg
    filtrationFraction: 18.2, // % (Target < 20-25%)
    systemicCa: 1.18, // mmol/L (Target 1.10 - 1.25)
    circuitCa: 0.32, // mmol/L (Target 0.25 - 0.35)
    citrateRate: 220, // mL/hr
    calciumChlorideRate: 42, // mL/hr
    serumCreatinine: 5.8, // mg/dL
    baselineCreatinine: 1.1,
    bloodUreaNitrogen: 88, // mg/dL
    potassium: 5.2, // mmol/L
    bicarbonate: 22.4, // mEq/L
    urineOutput: 0.05, // mL/kg/hr (Anuric)
    kdigoStage: "KDIGO Stage 3 AKI",
    fluidBalance24h: -1850, // mL
    status: "CRITICAL",
    vascularAccess: "Right Internal Jugular 13.5 Fr x 20cm Dialysis Catheter",
    attendingNephrologist: "Dr. Gregory House, MD (Critical Care Nephrology)",
    connectionTime: "2026-08-19 06:00",
    circuitRunHours: 32.5,
    alerts: [
      "Transmembrane pressure stable (TMP 102.5 mmHg); minimal protein cake fouling",
      "Post-filter ionized calcium 0.32 mmol/L: optimal regional citrate anticoagulation",
      "Cumulative fluid removal on target (-1,850 mL/24h)"
    ]
  },
  {
    id: "PT-CRRT-502",
    name: "Elena Rostova",
    age: 54,
    gender: "Female",
    weightKg: 64.0,
    bed: "ICU-RENAL-02",
    diagnosis: "Severe Acute Pancreatitis / Abdominal Compartment Syndrome / AKI",
    crrtMode: "CVVH (Continuous Veno-Venous Hemofiltration)",
    machineModel: "Fresenius multiFiltratePRO / Ci-Ca Ultraflux AV1000S",
    anticoagulation: "Regional Citrate (Ci-Ca Protocol)",
    bloodFlowRate: 180,
    dialysateFlow: 0,
    replacementPre: 1200,
    replacementPost: 400,
    netUfRate: 100,
    totalEffluentRate: 1700,
    deliveredDose: 26.6,
    accessPressure: -135,
    returnPressure: 140,
    filterPressure: 245,
    effluentPressure: 30,
    tmp: 172.5,
    filterDrop: 105,
    filtrationFraction: 21.4,
    systemicCa: 1.08,
    circuitCa: 0.28,
    citrateRate: 185,
    calciumChlorideRate: 36,
    serumCreatinine: 4.4,
    baselineCreatinine: 0.9,
    bloodUreaNitrogen: 72,
    potassium: 4.6,
    bicarbonate: 20.8,
    urineOutput: 0.15,
    kdigoStage: "KDIGO Stage 3 AKI",
    fluidBalance24h: -1200,
    status: "CRITICAL",
    vascularAccess: "Left Femoral 14 Fr x 24cm Dialysis Catheter",
    attendingNephrologist: "Dr. Serena Patel, MD (Nephrology & CRRT Specialist)",
    connectionTime: "2026-08-18 20:00",
    circuitRunHours: 44.0,
    alerts: [
      "Access pressure dropping (-135 mmHg): inspect femoral catheter patency/kinking",
      "Systemic iCa 1.08 mmol/L: increase systemic calcium gluconate titration by 10%"
    ]
  },
  {
    id: "PT-CRRT-503",
    name: "Marcus Aurelius Thorne",
    age: 72,
    gender: "Male",
    weightKg: 78.0,
    bed: "ICU-RENAL-03",
    diagnosis: "Post-CABG Cardiorenal Syndrome Type 1 / Severe Hypervolemia",
    crrtMode: "SCUF (Slow Continuous Ultrafiltration) -> CVVHD",
    machineModel: "Baxter Prismaflex v8.0 / ST100 Filter",
    anticoagulation: "Systemic Heparin Protocol (Target aPTT 45-60s)",
    bloodFlowRate: 150,
    dialysateFlow: 1500,
    replacementPre: 0,
    replacementPost: 0,
    netUfRate: 200,
    totalEffluentRate: 1700,
    deliveredDose: 21.8,
    accessPressure: -75,
    returnPressure: 95,
    filterPressure: 150,
    effluentPressure: 50,
    tmp: 75.0,
    filterDrop: 55,
    filtrationFraction: 14.8,
    systemicCa: 1.22,
    circuitCa: 1.20,
    citrateRate: 0,
    calciumChlorideRate: 0,
    serumCreatinine: 3.6,
    baselineCreatinine: 1.4,
    bloodUreaNitrogen: 64,
    potassium: 4.8,
    bicarbonate: 24.0,
    urineOutput: 0.35,
    kdigoStage: "KDIGO Stage 3 AKI",
    fluidBalance24h: -2400,
    status: "GUARDED",
    vascularAccess: "Right Internal Jugular 13.5 Fr x 15cm Catheter",
    attendingNephrologist: "Dr. Gregory House, MD",
    connectionTime: "2026-08-19 14:00",
    circuitRunHours: 18.0,
    alerts: [
      "Aggressive ultrafiltration active: net removal 200 mL/hr (-2,400 mL/24h)",
      "Continuous cardiac output and lactate monitoring to prevent hypoperfusion"
    ]
  },
  {
    id: "PT-CRRT-504",
    name: "Hannah Abbott",
    age: 49,
    gender: "Female",
    weightKg: 58.0,
    bed: "ICU-RENAL-04",
    diagnosis: "Rhabdomyolysis / Myoglobinuria / High-Volume Hemofiltration",
    crrtMode: "CVVH (High Cut-Off Membrane)",
    machineModel: "Fresenius multiFiltratePRO / EMiC2 High Cut-Off",
    anticoagulation: "Regional Citrate Anticoagulation",
    bloodFlowRate: 220,
    dialysateFlow: 0,
    replacementPre: 1500,
    replacementPost: 500,
    netUfRate: 100,
    totalEffluentRate: 2100,
    deliveredDose: 36.2, // High volume for myoglobin clearance
    accessPressure: -80,
    returnPressure: 115,
    filterPressure: 210,
    effluentPressure: 40,
    tmp: 135.0,
    filterDrop: 95,
    filtrationFraction: 19.5,
    systemicCa: 1.15,
    circuitCa: 0.30,
    citrateRate: 240,
    calciumChlorideRate: 38,
    serumCreatinine: 6.2,
    baselineCreatinine: 0.8,
    bloodUreaNitrogen: 94,
    potassium: 5.6,
    bicarbonate: 18.5,
    urineOutput: 0.20,
    kdigoStage: "KDIGO Stage 3 AKI",
    fluidBalance24h: -800,
    status: "CRITICAL",
    vascularAccess: "Right Subclavian 13.5 Fr x 20cm Catheter",
    attendingNephrologist: "Dr. Serena Patel, MD",
    connectionTime: "2026-08-19 02:00",
    circuitRunHours: 36.5,
    alerts: [
      "Serum Creatine Kinase (CK) > 85,000 U/L: High-volume convective clearance active",
      "Bicarbonate 18.5 mEq/L: Pre-filter replacement solution titrated with 150 mEq NaHCO3"
    ]
  }
];

export default function NephrologyCrrtDialysisHub() {
  const { toasts, toast } = useKindToasts();
  const [patients, setPatients] = useState(SEED_CRRT_PATIENTS);
  const [selectedPatientId, setSelectedPatientId] = useState(SEED_CRRT_PATIENTS[0].id);
  const [activeTab, setActiveTab] = useState("overview"); // overview, circuit, anticoagulation, calculator, protocols
  const [isLiveStreaming, setIsLiveStreaming] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState("ALL");
  const [inspectModalOpen, setInspectModalOpen] = useState(false);
  const [protocolModal, setProtocolModal] = useState(null);

  // Workbench simulation state
  const [calcWeightKg, setCalcWeightKg] = useState(75.0);
  const [calcBfr, setCalcBfr] = useState(200); // mL/min
  const [calcHct, setCalcHct] = useState(30); // %
  const [calcDialysateFlow, setCalcDialysateFlow] = useState(1200); // mL/hr
  const [calcReplacementFlow, setCalcReplacementFlow] = useState(800); // mL/hr
  const [calcNetUf, setCalcNetUf] = useState(150); // mL/hr
  const [calcCurrentCreat, setCalcCurrentCreat] = useState(4.8);
  const [calcBaselineCreat, setCalcBaselineCreat] = useState(1.0);

  const selectedPatient = useMemo(() => {
    return patients.find((p) => p.id === selectedPatientId) || patients[0];
  }, [patients, selectedPatientId]);

  // Live telemetry stream simulator
  useEffect(() => {
    if (!isLiveStreaming) return;
    const interval = setInterval(() => {
      setPatients((prev) =>
        prev.map((pt) => {
          const accessDelta = Math.floor(Math.random() * 5) - 2;
          const returnDelta = Math.floor(Math.random() * 5) - 2;
          const tmpDelta = (Math.random() * 2 - 1);
          return {
            ...pt,
            accessPressure: Math.min(-40, Math.max(-200, pt.accessPressure + accessDelta)),
            returnPressure: Math.min(250, Math.max(50, pt.returnPressure + returnDelta)),
            tmp: Number(Math.max(40, Math.min(300, pt.tmp + tmpDelta)).toFixed(1))
          };
        })
      );
    }, 3000);
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
      const matchesMode =
        filterMode === "ALL" ||
        (filterMode === "CVVHDF" && pt.crrtMode.includes("CVVHDF")) ||
        (filterMode === "CVVH" && pt.crrtMode.includes("CVVH") && !pt.crrtMode.includes("CVVHDF")) ||
        (filterMode === "CITRATE" && pt.anticoagulation.includes("Citrate"));
      return matchesSearch && matchesMode;
    });
  }, [patients, searchQuery, filterMode]);

  // Dynamic calculations in workbench
  const computedEffluentDose = useMemo(() => {
    if (!calcWeightKg || calcWeightKg <= 0) return 0;
    const totalEffluent = Number(calcDialysateFlow) + Number(calcReplacementFlow) + Number(calcNetUf);
    return Number((totalEffluent / calcWeightKg).toFixed(2));
  }, [calcDialysateFlow, calcReplacementFlow, calcNetUf, calcWeightKg]);

  const computedFiltrationFraction = useMemo(() => {
    const plasmaFlow = (Number(calcBfr) * (1 - Number(calcHct) / 100)) * 60;
    if (plasmaFlow <= 0) return 0;
    const totalUf = Number(calcReplacementFlow) + Number(calcNetUf);
    return Number(((totalUf / plasmaFlow) * 100).toFixed(2));
  }, [calcBfr, calcHct, calcReplacementFlow, calcNetUf]);

  const handleExportCsv = () => {
    const headers = [
      "Patient ID",
      "Name",
      "Age",
      "Bed",
      "Diagnosis",
      "CRRT Modality",
      "Machine Model",
      "Anticoagulation",
      "Delivered Dose (mL/kg/h)",
      "Blood Flow (mL/min)",
      "Net UF (mL/h)",
      "TMP (mmHg)",
      "Filtration Fraction (%)",
      "Systemic iCa (mmol/L)",
      "Circuit iCa (mmol/L)",
      "Serum Creatinine (mg/dL)",
      "KDIGO Stage"
    ];
    const rows = patients.map((p) => [
      p.id,
      p.name,
      p.age,
      p.bed,
      p.diagnosis,
      p.crrtMode,
      p.machineModel,
      p.anticoagulation,
      p.deliveredDose,
      p.bloodFlowRate,
      p.netUfRate,
      p.tmp,
      p.filtrationFraction,
      p.systemicCa,
      p.circuitCa,
      p.serumCreatinine,
      p.kdigoStage
    ]);
    downloadCsv("nephrology_crrt_dialysis_manifest.csv", headers, rows);
    toast.success("CRRT Dialysis & Hemodynamic Manifest exported to CSV.");
  };

  const triggerEmergencyProtocol = (protocolName) => {
    setProtocolModal(protocolName);
    toast.error(`CRRT ALARM: ${protocolName} initiated for ${selectedPatient.name} (${selectedPatient.bed})`);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-6 font-sans">
      <KindToastTray toasts={toasts} />

      {/* HEADER COMMAND BAR */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-950/80 border border-cyan-500/30 text-cyan-400 shadow-lg shadow-cyan-950/50">
              <Droplets className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white flex items-center gap-2">
                Nephrology CRRT & Dialysis Command Station
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/40 text-cyan-300 font-semibold tracking-normal uppercase">
                  KDIGO AKI / RCA / CVVHDF
                </span>
              </h1>
              <p className="text-sm text-slate-400">
                Continuous renal replacement therapy tele-monitoring, regional citrate anticoagulation surveillance, transmembrane pressure kinetics, and effluent dosing adherence.
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
            {isLiveStreaming ? "CRRT TELEMETRY LIVE" : "TELEMETRY PAUSED"}
          </button>

          <button
            onClick={handleExportCsv}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold bg-slate-900 border border-slate-700 text-slate-200 hover:bg-slate-800 transition-all"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            EXPORT CSV
          </button>

          <button
            onClick={() => triggerEmergencyProtocol("CIRCUIT EMERGENCY / AIR IN LINE DETECTED")}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-extrabold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-950 transition-all"
          >
            <Siren className="w-4 h-4 animate-bounce" />
            CRRT CLAMP ALARM
          </button>
        </div>
      </div>

      {/* QUICK STATS HEADER */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
        <StatCard
          icon={Users}
          label="Active CRRT Circuits"
          value={`${patients.length} Units`}
          subtext="100% Online"
          color="cyan"
        />
        <StatCard
          icon={Gauge}
          label="Mean Effluent Dose"
          value="28.3 mL/kg/h"
          subtext="KDIGO Compliant (>25)"
          color="emerald"
        />
        <StatCard
          icon={Droplets}
          label="Regional Citrate (RCA)"
          value={patients.filter((p) => p.anticoagulation.includes("Citrate")).length.toString()}
          subtext="Ci-Ca Protocol"
          color="purple"
        />
        <StatCard
          icon={AlertTriangle}
          label="TMP Warning (>180 mmHg)"
          value={patients.filter((p) => p.tmp >= 180).length.toString()}
          subtext="Membrane Fouling"
          color="amber"
        />
        <StatCard
          icon={Activity}
          label="KDIGO Stage 3 AKI"
          value={patients.filter((p) => p.kdigoStage.includes("Stage 3")).length.toString()}
          subtext="Severe Renal Failure"
          color="rose"
        />
        <StatCard
          icon={ShieldCheck}
          label="Circuit Patency Guard"
          value="98.8% Uptime"
          subtext="FDA 21 CFR Pt 11"
          color="indigo"
        />
      </div>

      {/* MAIN WORKSPACE GRID */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* LEFT COLUMN: PATIENT SELECTION */}
        <div className="xl:col-span-4 space-y-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl">
            <div className="flex items-center justify-between gap-2 mb-3">
              <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Workflow className="w-4 h-4 text-cyan-400" />
                Active CRRT Cohort ({filteredPatients.length})
              </h2>
              <span className="text-xs text-slate-500 font-mono">Live Circuit Sync</span>
            </div>

            {/* SEARCH & FILTERS */}
            <div className="space-y-2 mb-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search name, bed, mode..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                {["ALL", "CVVHDF", "CVVH", "CITRATE"].map((flt) => (
                  <button
                    key={flt}
                    onClick={() => setFilterMode(flt)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                      filterMode === flt
                        ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/50"
                        : "bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200"
                    }`}
                  >
                    {flt}
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
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                        {p.crrtMode.split(" ")[0]}
                      </span>
                    </div>

                    <div className="grid grid-cols-4 gap-1 pt-2 border-t border-slate-800/80 text-center text-[10px]">
                      <div className="bg-slate-900/60 rounded p-1">
                        <span className="text-slate-500 block">Dose</span>
                        <span className="font-bold text-emerald-400">{p.deliveredDose}</span>
                      </div>
                      <div className="bg-slate-900/60 rounded p-1">
                        <span className="text-slate-500 block">TMP</span>
                        <span className={`font-bold ${p.tmp >= 180 ? "text-rose-400" : "text-cyan-300"}`}>{p.tmp}</span>
                      </div>
                      <div className="bg-slate-900/60 rounded p-1">
                        <span className="text-slate-500 block">Net UF</span>
                        <span className="font-bold text-purple-300">{p.netUfRate} mL/h</span>
                      </div>
                      <div className="bg-slate-900/60 rounded p-1">
                        <span className="text-slate-500 block">Creat</span>
                        <span className="font-bold text-amber-300">{p.serumCreatinine}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: DETAILED CRRT CONSOLE */}
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
                  <span className="text-xs px-2.5 py-1 rounded-md bg-purple-950 border border-purple-500/40 text-purple-300 font-bold">
                    {selectedPatient.crrtMode}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1 flex items-center gap-3 flex-wrap">
                  <span>Age: <b className="text-slate-200">{selectedPatient.age} yo</b></span>
                  <span>•</span>
                  <span>Weight: <b className="text-slate-200">{selectedPatient.weightKg} kg</b></span>
                  <span>•</span>
                  <span>Machine: <b className="text-slate-200">{selectedPatient.machineModel}</b></span>
                  <span>•</span>
                  <span>Nephrologist: <b className="text-cyan-400">{selectedPatient.attendingNephrologist}</b></span>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setInspectModalOpen(true)}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/40 flex items-center gap-1.5 transition-all shadow-lg"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Full CRRT Dossier
                </button>
              </div>
            </div>

            {/* LIVE CRRT STRIP */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5 mt-5 pt-4 border-t border-slate-800/80">
              <Vital label="Delivered Dose" value={`${selectedPatient.deliveredDose} mL/kg/h`} status="normal" />
              <Vital label="TMP Pressure" value={`${selectedPatient.tmp} mmHg`} status={selectedPatient.tmp > 180 ? "warning" : "normal"} />
              <Vital label="Filtration Fraction" value={`${selectedPatient.filtrationFraction}%`} status={selectedPatient.filtrationFraction > 20 ? "warning" : "normal"} />
              <Vital label="Blood Flow Rate" value={`${selectedPatient.bloodFlowRate} mL/min`} status="normal" />
              <Vital label="Systemic iCa" value={`${selectedPatient.systemicCa} mmol/L`} status={selectedPatient.systemicCa < 1.10 ? "warning" : "normal"} />
              <Vital label="Circuit iCa" value={`${selectedPatient.circuitCa} mmol/L`} status="normal" />
            </div>
          </div>

          {/* TAB NAVIGATION */}
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
            {[
              { id: "overview", label: "Circuit Pressure & Flow Metrics", icon: Gauge },
              { id: "anticoagulation", label: "Citrate Anticoagulation (RCA)", icon: Droplets },
              { id: "biochemistry", label: "Renal Labs & Fluid Balance", icon: Activity },
              { id: "calculator", label: "CRRT Dosing & FF% Workbench", icon: Sliders },
              { id: "protocols", label: "Nephrology Emergency Protocols", icon: Siren }
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
                {/* PRESSURE PROFILES */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl">
                  <h3 className="text-sm font-bold text-slate-200 mb-3 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Gauge className="w-4 h-4 text-cyan-400" />
                      Hydraulic Pressure Profile (Circuit Patency)
                    </span>
                    <span className="text-[11px] font-mono text-cyan-400 font-semibold">{selectedPatient.circuitRunHours}h on filter</span>
                  </h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                      <span className="text-slate-400">Access (Arterial) Pressure:</span>
                      <span className={`font-mono font-bold ${selectedPatient.accessPressure < -150 ? "text-rose-400" : "text-cyan-300"}`}>
                        {selectedPatient.accessPressure} mmHg
                      </span>
                    </div>
                    <div className="flex justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                      <span className="text-slate-400">Return (Venous) Pressure:</span>
                      <span className="font-mono font-bold text-emerald-400">{selectedPatient.returnPressure} mmHg</span>
                    </div>
                    <div className="flex justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                      <span className="text-slate-400">Pre-Filter Pressure:</span>
                      <span className="font-mono font-bold text-purple-300">{selectedPatient.filterPressure} mmHg</span>
                    </div>
                    <div className="flex justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                      <span className="text-slate-400">Transmembrane Pressure (TMP):</span>
                      <span className={`font-mono font-bold ${selectedPatient.tmp > 180 ? "text-rose-400" : "text-cyan-300"}`}>
                        {selectedPatient.tmp} mmHg
                      </span>
                    </div>
                    <div className="flex justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                      <span className="text-slate-400">Filter Pressure Drop (&Delta;P):</span>
                      <span className="font-mono font-bold text-amber-300">{selectedPatient.filterDrop} mmHg</span>
                    </div>
                  </div>
                </div>

                {/* FLOW PROFILES */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl">
                  <h3 className="text-sm font-bold text-slate-200 mb-3 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Droplets className="w-4 h-4 text-purple-400" />
                      Dialysate & Replacement Fluid Mechanics
                    </span>
                    <span className="text-[11px] font-mono text-purple-400 font-semibold">{selectedPatient.crrtMode.split(" ")[0]}</span>
                  </h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                      <span className="text-slate-400">Blood Flow Rate (Qb):</span>
                      <span className="font-mono font-bold text-white">{selectedPatient.bloodFlowRate} mL/min</span>
                    </div>
                    <div className="flex justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                      <span className="text-slate-400">Dialysate Flow (Qd):</span>
                      <span className="font-mono font-bold text-cyan-300">{selectedPatient.dialysateFlow} mL/hr</span>
                    </div>
                    <div className="flex justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                      <span className="text-slate-400">Pre-Filter Replacement:</span>
                      <span className="font-mono font-bold text-purple-300">{selectedPatient.replacementPre} mL/hr</span>
                    </div>
                    <div className="flex justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                      <span className="text-slate-400">Post-Filter Replacement:</span>
                      <span className="font-mono font-bold text-indigo-300">{selectedPatient.replacementPost} mL/hr</span>
                    </div>
                    <div className="flex justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                      <span className="text-slate-400">Net Ultrafiltration Rate (Quf):</span>
                      <span className="font-mono font-bold text-emerald-400">{selectedPatient.netUfRate} mL/hr</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* CLINICAL ALERTS */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl">
                <h3 className="text-sm font-bold text-slate-200 mb-3 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-cyan-400" />
                  Active CRRT Telemetry & Safety Surveillance
                </h3>
                <div className="space-y-2">
                  {selectedPatient.alerts.map((alt, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-2.5 rounded-lg bg-cyan-950/30 border border-cyan-500/30 text-xs text-cyan-200">
                      <AlertTriangle className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span>{alt}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB CONTENT: ANTICOAGULATION */}
          {activeTab === "anticoagulation" && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Droplets className="w-5 h-5 text-purple-400" />
                Regional Citrate Anticoagulation (RCA) Overwatch
              </h3>
              <p className="text-xs text-slate-400">
                Chelaion of calcium in circuit (target post-filter iCa 0.25 - 0.35 mmol/L) with systemic calcium compensation (target systemic iCa 1.10 - 1.25 mmol/L).
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
                  <h4 className="font-bold text-purple-400">Circuit Anticoagulation (Post-Filter)</h4>
                  <div className="flex justify-between p-2.5 rounded bg-slate-900">
                    <span className="text-slate-400">Circuit Ionized Calcium:</span>
                    <span className="font-mono font-bold text-purple-300">{selectedPatient.circuitCa} mmol/L</span>
                  </div>
                  <div className="flex justify-between p-2.5 rounded bg-slate-900">
                    <span className="text-slate-400">Citrate (ACD-A) Infusion:</span>
                    <span className="font-mono font-bold text-cyan-300">{selectedPatient.citrateRate} mL/hr</span>
                  </div>
                  <div className="p-2.5 rounded bg-purple-950/40 border border-purple-500/30 text-[11px] text-purple-200">
                    Target range: 0.25 - 0.35 mmol/L. Prevents filter clotting while avoiding systemic bleeding.
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
                  <h4 className="font-bold text-emerald-400">Systemic Calcium Compensation</h4>
                  <div className="flex justify-between p-2.5 rounded bg-slate-900">
                    <span className="text-slate-400">Systemic Ionized Calcium:</span>
                    <span className="font-mono font-bold text-emerald-300">{selectedPatient.systemicCa} mmol/L</span>
                  </div>
                  <div className="flex justify-between p-2.5 rounded bg-slate-900">
                    <span className="text-slate-400">Calcium Chloride Infusion:</span>
                    <span className="font-mono font-bold text-amber-300">{selectedPatient.calciumChlorideRate} mL/hr</span>
                  </div>
                  <div className="p-2.5 rounded bg-emerald-950/40 border border-emerald-500/30 text-[11px] text-emerald-200">
                    Target range: 1.10 - 1.25 mmol/L. Prevents citrate toxicity and systemic hypocalcemia.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB CONTENT: BIOCHEMISTRY & FLUID BALANCE */}
          {activeTab === "biochemistry" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
                <h3 className="text-sm font-bold text-slate-200 mb-3 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  Renal Biomarkers & Acid-Base Status
                </h3>
                <div className="grid grid-cols-2 gap-2.5 text-xs">
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                    <span className="text-slate-500 text-[10px] block">Serum Creatinine</span>
                    <span className="text-lg font-black text-amber-300 font-mono">{selectedPatient.serumCreatinine} mg/dL</span>
                    <span className="text-[9px] text-slate-600 block">Baseline {selectedPatient.baselineCreatinine}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                    <span className="text-slate-500 text-[10px] block">Blood Urea Nitrogen</span>
                    <span className="text-lg font-black text-rose-300 font-mono">{selectedPatient.bloodUreaNitrogen} mg/dL</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                    <span className="text-slate-500 text-[10px] block">Serum Potassium</span>
                    <span className="text-lg font-black text-cyan-300 font-mono">{selectedPatient.potassium} mmol/L</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                    <span className="text-slate-500 text-[10px] block">Serum Bicarbonate</span>
                    <span className="text-lg font-black text-emerald-300 font-mono">{selectedPatient.bicarbonate} mEq/L</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
                <h3 className="text-sm font-bold text-slate-200 mb-3 flex items-center gap-2">
                  <Scale className="w-4 h-4 text-purple-400" />
                  Cumulative 24h Fluid Removal
                </h3>
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center mb-3">
                  <span className="text-xs text-slate-400 block">Net Cumulative Fluid Balance</span>
                  <span className="text-3xl font-black text-purple-300 font-mono">{selectedPatient.fluidBalance24h} mL</span>
                  <span className="text-[10px] text-slate-500 block mt-1">Goal: Targeted negative balance for lung decongestion</span>
                </div>
                <div className="text-xs text-slate-300 space-y-1.5">
                  <div className="flex justify-between p-2 rounded bg-slate-950/60 border border-slate-800">
                    <span>Vascular Access Site:</span>
                    <span className="font-semibold text-slate-200">{selectedPatient.vascularAccess}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded bg-slate-950/60 border border-slate-800">
                    <span>KDIGO Classification:</span>
                    <span className="font-bold text-rose-400">{selectedPatient.kdigoStage}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB CONTENT: WORKBENCH */}
          {activeTab === "calculator" && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-cyan-400" />
                  Real-Time CRRT Dosing & Filtration Fraction Workbench
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Interactive simulation for KDIGO effluent dose compliance (target 20-25 mL/kg/h) and circuit clotting avoidance (FF &lt; 20%).
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Flow Rates (mL/hr)</h4>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Dialysate Flow (Qd): {calcDialysateFlow} mL/h</label>
                    <input
                      type="range"
                      min="0"
                      max="3000"
                      step="50"
                      value={calcDialysateFlow}
                      onChange={(e) => setCalcDialysateFlow(parseFloat(e.target.value))}
                      className="w-full accent-cyan-400"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Replacement Flow (Qrep): {calcReplacementFlow} mL/h</label>
                    <input
                      type="range"
                      min="0"
                      max="3000"
                      step="50"
                      value={calcReplacementFlow}
                      onChange={(e) => setCalcReplacementFlow(parseFloat(e.target.value))}
                      className="w-full accent-cyan-400"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Net UF Rate: {calcNetUf} mL/h</label>
                    <input
                      type="range"
                      min="0"
                      max="500"
                      step="10"
                      value={calcNetUf}
                      onChange={(e) => setCalcNetUf(parseFloat(e.target.value))}
                      className="w-full accent-cyan-400"
                    />
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider">Patient Parameters</h4>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Patient Weight: {calcWeightKg} kg</label>
                    <input
                      type="range"
                      min="40"
                      max="140"
                      step="0.5"
                      value={calcWeightKg}
                      onChange={(e) => setCalcWeightKg(parseFloat(e.target.value))}
                      className="w-full accent-purple-400"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Blood Flow Rate (Qb): {calcBfr} mL/min</label>
                    <input
                      type="range"
                      min="100"
                      max="350"
                      step="10"
                      value={calcBfr}
                      onChange={(e) => setCalcBfr(parseFloat(e.target.value))}
                      className="w-full accent-purple-400"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Hematocrit (Hct): {calcHct}%</label>
                    <input
                      type="range"
                      min="18"
                      max="45"
                      step="1"
                      value={calcHct}
                      onChange={(e) => setCalcHct(parseFloat(e.target.value))}
                      className="w-full accent-purple-400"
                    />
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2">Simulated Outcome</h4>
                    <div className="space-y-2 text-xs">
                      <div className="p-2 rounded bg-slate-900 border border-slate-800 flex justify-between">
                        <span className="text-slate-400">Delivered Effluent Dose:</span>
                        <span className={`font-mono font-bold ${computedEffluentDose >= 20 ? "text-emerald-400" : "text-rose-400"}`}>
                          {computedEffluentDose} mL/kg/h
                        </span>
                      </div>
                      <div className="p-2 rounded bg-slate-900 border border-slate-800 flex justify-between">
                        <span className="text-slate-400">Filtration Fraction (FF):</span>
                        <span className={`font-mono font-bold ${computedFiltrationFraction <= 20 ? "text-cyan-300" : "text-rose-400"}`}>
                          {computedFiltrationFraction}%
                        </span>
                      </div>
                      <div className="p-2 rounded bg-slate-900 border border-slate-800 flex justify-between">
                        <span className="text-slate-400">KDIGO Compliance:</span>
                        <span className="font-bold text-emerald-400">
                          {computedEffluentDose >= 20 && computedEffluentDose <= 30 ? "OPTIMAL TARGET" : "REQUIRES ADJUSTMENT"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => toast.success("Simulated CRRT prescription pushed to electronic prescribing record.")}
                    className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg text-xs transition-all shadow-md mt-4"
                  >
                    Commit CRRT Prescription
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB CONTENT: PROTOCOLS */}
          {activeTab === "protocols" && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
              <h3 className="text-sm font-bold text-rose-400 flex items-center gap-2">
                <Siren className="w-4 h-4" />
                CRRT Circuit Emergency Protocols
              </h3>
              <div className="space-y-2 text-xs">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-white block">Acute Filter Clotting / High TMP Protocol</span>
                    <span className="text-slate-400">Emergency saline flush, blood return assessment, circuit replacement preparation.</span>
                  </div>
                  <button
                    onClick={() => triggerEmergencyProtocol("FILTER CLOTTING / EMERGENCY CIRCUIT CHANGE")}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold"
                  >
                    Trigger Alarm
                  </button>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-white block">Citrate Accumulation / Toxicity Protocol (Total Ca / iCa &gt; 2.5)</span>
                    <span className="text-slate-400">Reduce/stop citrate infusion, increase dialysate flow to wash out citrate complexes.</span>
                  </div>
                  <button
                    onClick={() => triggerEmergencyProtocol("CITRATE ACCUMULATION PROTOCOL")}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold"
                  >
                    Trigger Alarm
                  </button>
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
                <Droplets className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Full CRRT Circuit Dossier: {selectedPatient.name}</h2>
                <p className="text-xs text-slate-400">ID: {selectedPatient.id} | Machine: {selectedPatient.machineModel}</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <Row label="Primary Diagnosis" value={selectedPatient.diagnosis} />
              <Row label="Prescribed CRRT Modality" value={selectedPatient.crrtMode} />
              <Row label="Delivered Effluent Dose" value={`${selectedPatient.deliveredDose} mL/kg/h`} />
              <Row label="Anticoagulation Regimen" value={selectedPatient.anticoagulation} />
              <Row label="Transmembrane Pressure (TMP)" value={`${selectedPatient.tmp} mmHg`} />
              <Row label="Vascular Access Device" value={selectedPatient.vascularAccess} />
              <Row label="Attending Nephrologist" value={selectedPatient.attendingNephrologist} />
              <Row label="Connection Epoch" value={selectedPatient.connectionTime} />
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setInspectModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold transition-all"
              >
                Close Dossier
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
              Emergency safety interlock activated. Blood pump halted and vascular clamps engaged to safeguard patient safety.
            </p>
            <div className="p-3 bg-black/40 rounded-xl border border-rose-500/30 text-xs space-y-2 mb-6">
              <div>• Patient Weight: <b>{selectedPatient.weightKg} kg</b></div>
              <div>• Transmembrane Pressure: <b>{selectedPatient.tmp} mmHg</b></div>
              <div>• Catheter Access: <b>{selectedPatient.vascularAccess}</b></div>
            </div>
            <button
              onClick={() => {
                toast.success(`Protocol ${protocolModal} acknowledged by clinical team.`);
                setProtocolModal(null);
              }}
              className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-extrabold rounded-xl text-xs transition-all shadow-lg"
            >
              Acknowledge & Dismiss Alarm
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
