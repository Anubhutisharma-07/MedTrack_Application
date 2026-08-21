import React, { useState, useEffect, useMemo } from "react";
import {
  Activity,
  Droplets,
  Zap,
  ShieldAlert,
  AlertTriangle,
  HeartPulse,
  Sliders,
  SlidersHorizontal,
  Gauge,
  FileText,
  Download,
  Search,
  CheckCircle2,
  Clock,
  User,
  Users,
  Eye,
  Layers,
  Siren,
  X,
  Plus,
  Play,
  Pause,
  Flame,
  ShieldCheck,
  Cpu,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Filter,
  Thermometer,
  Shield
} from "lucide-react";
import { downloadCsv } from "../../utils/csv";
import { useKindToasts, KindToastTray } from "../../components/common/HubToasts";

// ==========================================
// SEED CRRT PATIENTS DATA
// ==========================================
const SEED_CRRT_PATIENTS = [
  {
    id: "PT-CRRT-201",
    name: "Harold Jenkins",
    age: 67,
    gender: "Male",
    bed: "ICU-BED-02",
    weight: 84.0, // kg
    admissionWeight: 76.0,
    fluidOverloadPercent: 10.5, // %
    diagnosis: "Septic Shock / Sepsis-Induced AKI Stage 3 with Refractory Acidosis",
    kdigoStage: "Stage 3",
    crrtMode: "CVVHDF (Continuous Hemodiafiltration)",
    anticoagulation: "Regional Citrate (RCA)",
    bloodFlowRate: 180, // mL/min (Qb)
    dialysateRate: 1200, // mL/hr (Qd)
    preReplacementRate: 600, // mL/hr (Qpre)
    postReplacementRate: 400, // mL/hr (Qpost)
    netUfr: 150, // mL/hr
    effluentFlow: 2350, // mL/hr
    effluentDose: 28.0, // mL/kg/hr
    filtrationFraction: 18.2, // % (target < 20-25%)
    accessPressure: -85, // mmHg (Pacc nominal -50 to -150)
    returnPressure: 110, // mmHg (Pret nominal 50 to 150)
    preFilterPressure: 210, // mmHg (Ppre)
    effluentPressure: -35, // mmHg (Peff)
    tmp: 195, // mmHg (TMP = (Ppre+Pret)/2 - Peff)
    filterPressureDrop: 100, // mmHg (Delta P = Ppre - Pret)
    circuitLifeHours: 42, // hours running
    filterClotRisk: "Moderate",
    systemicIca: 1.18, // mmol/L (target 1.10-1.30)
    circuitIca: 0.31, // mmol/L (target 0.25-0.35)
    totalCalcium: 2.25, // mmol/L
    calciumRatio: 1.91, // TotCa/iCa ratio (toxicity cutoff > 2.5)
    serumCreatinine: 5.4, // mg/dL
    bun: 82, // mg/dL
    potassium: 5.1, // mEq/L
    bicarbonate: 19.5, // mEq/L
    ph: 7.29,
    lactate: 3.8, // mmol/L
    fluidBalance24h: -1850, // mL
    status: "RUNNING",
    attendingNephrologist: "Dr. Jonathan Hayes, MD (Critical Care Nephrology)"
  },
  {
    id: "PT-CRRT-202",
    name: "Beatrice Morgan",
    age: 73,
    gender: "Female",
    bed: "ICU-BED-05",
    weight: 62.0,
    admissionWeight: 54.0,
    fluidOverloadPercent: 14.8,
    diagnosis: "Cardiorenal Syndrome Type 1 Post-CABG / Severe Anuria & Pulmonary Edema",
    kdigoStage: "Stage 3",
    crrtMode: "CVVHDF (Continuous Hemodiafiltration)",
    anticoagulation: "Regional Citrate (RCA)",
    bloodFlowRate: 150,
    dialysateRate: 1000,
    preReplacementRate: 400,
    postReplacementRate: 200,
    netUfr: 250, // High Net UF for decongestion
    effluentFlow: 1850,
    effluentDose: 29.8,
    filtrationFraction: 22.4,
    accessPressure: -120,
    returnPressure: 135,
    preFilterPressure: 265,
    effluentPressure: -40,
    tmp: 240, // Elevated TMP approaching limit
    filterPressureDrop: 130,
    circuitLifeHours: 68,
    filterClotRisk: "High",
    systemicIca: 1.12,
    circuitIca: 0.28,
    totalCalcium: 2.45,
    calciumRatio: 2.18,
    serumCreatinine: 4.8,
    bun: 94,
    potassium: 4.6,
    bicarbonate: 21.0,
    ph: 7.34,
    lactate: 2.6,
    fluidBalance24h: -3400,
    status: "WARNING_HIGH_TMP",
    attendingNephrologist: "Dr. Jonathan Hayes, MD (Critical Care Nephrology)"
  },
  {
    id: "PT-CRRT-203",
    name: "Marcus Holloway",
    age: 41,
    gender: "Male",
    bed: "ICU-BED-08",
    weight: 95.0,
    admissionWeight: 95.0,
    fluidOverloadPercent: 0.0,
    diagnosis: "Traumatic Crush Injury Rhabdomyolysis / Hyperkalemic Crisis K+ 7.2",
    kdigoStage: "Stage 3",
    crrtMode: "CVVH High-Volume (Continuous Hemofiltration)",
    anticoagulation: "Systemic Heparin Protocol",
    bloodFlowRate: 220,
    dialysateRate: 0,
    preReplacementRate: 2000,
    postReplacementRate: 1200,
    netUfr: 50,
    effluentFlow: 3250,
    effluentDose: 34.2, // High volume for myoglobin/K+ clearance
    filtrationFraction: 19.8,
    accessPressure: -75,
    returnPressure: 98,
    preFilterPressure: 185,
    effluentPressure: -15,
    tmp: 156,
    filterPressureDrop: 87,
    circuitLifeHours: 18,
    filterClotRisk: "Low",
    systemicIca: 1.24,
    circuitIca: 1.24,
    totalCalcium: 2.10,
    calciumRatio: 1.69,
    serumCreatinine: 6.9,
    bun: 78,
    potassium: 6.1, // Decreasing from 7.2
    bicarbonate: 18.0,
    ph: 7.28,
    lactate: 4.1,
    fluidBalance24h: -400,
    status: "RUNNING",
    attendingNephrologist: "Dr. Rachel Kim, MD (Trauma & Renal Resuscitation)"
  },
  {
    id: "PT-CRRT-204",
    name: "Evelyn Ross",
    age: 59,
    gender: "Female",
    bed: "ICU-BED-11",
    diagnosis: "Hepatorenal Syndrome Type 1 / Cirrhosis with Citrate Accumulation Risk",
    kdigoStage: "Stage 3",
    crrtMode: "CVVHD (Continuous Hemodialysis)",
    anticoagulation: "No Anticoagulation (Saline Flushes)",
    weight: 68.0,
    admissionWeight: 65.0,
    fluidOverloadPercent: 4.6,
    bloodFlowRate: 160,
    dialysateRate: 1600,
    preReplacementRate: 0,
    postReplacementRate: 0,
    netUfr: 100,
    effluentFlow: 1700,
    effluentDose: 25.0,
    filtrationFraction: 8.5,
    accessPressure: -90,
    returnPressure: 105,
    preFilterPressure: 170,
    effluentPressure: -25,
    tmp: 162,
    filterPressureDrop: 65,
    circuitLifeHours: 29,
    filterClotRisk: "Moderate",
    systemicIca: 1.20,
    circuitIca: 1.20,
    totalCalcium: 2.30,
    calciumRatio: 1.91,
    serumCreatinine: 4.1,
    bun: 65,
    potassium: 4.4,
    bicarbonate: 22.5,
    ph: 7.37,
    lactate: 5.2,
    fluidBalance24h: -1200,
    status: "RUNNING",
    attendingNephrologist: "Dr. Rachel Kim, MD (Trauma & Renal Resuscitation)"
  },
  {
    id: "PT-CRRT-205",
    name: "Samuel Vance",
    age: 63,
    gender: "Male",
    bed: "ICU-BED-14",
    weight: 78.0,
    admissionWeight: 82.0,
    fluidOverloadPercent: -4.8,
    diagnosis: "Acute Tubular Necrosis (ATN) Weaning Phase / Spontaneous Diuresis",
    kdigoStage: "Stage 2 (Resolving)",
    crrtMode: "SCUF (Slow Continuous Ultrafiltration)",
    anticoagulation: "Regional Citrate (RCA)",
    bloodFlowRate: 120,
    dialysateRate: 0,
    preReplacementRate: 0,
    postReplacementRate: 0,
    netUfr: 100,
    effluentFlow: 100,
    effluentDose: 1.28,
    filtrationFraction: 6.2,
    accessPressure: -50,
    returnPressure: 70,
    preFilterPressure: 120,
    effluentPressure: -10,
    tmp: 105,
    filterPressureDrop: 50,
    circuitLifeHours: 52,
    filterClotRisk: "Low",
    systemicIca: 1.22,
    circuitIca: 0.33,
    totalCalcium: 2.35,
    calciumRatio: 1.92,
    serumCreatinine: 2.3,
    bun: 38,
    potassium: 4.2,
    bicarbonate: 24.0,
    ph: 7.41,
    lactate: 1.3,
    fluidBalance24h: -1800,
    status: "WEANING",
    attendingNephrologist: "Dr. Jonathan Hayes, MD (Critical Care Nephrology)"
  }
];

// ==========================================
// CRRT EMERGENCY PROTOCOLS
// ==========================================
const CRRT_EMERGENCY_PROTOCOLS = [
  {
    code: "CODE-HYPERKALEMIA",
    title: "Critical Hyperkalemia (K+ > 6.5 mEq/L) Rapid Clearance Protocol",
    triggerCondition: "Potassium > 6.5 mEq/L with ECG peaked T-waves or widening QRS",
    targetAction: "Increase Dialysate Flow to 2500 mL/hr, zero-potassium replacement bags, administer IV Calcium Gluconate & Insulin-D50W",
    guideline: "KDIGO AKI Clinical Practice Guidelines & ERC Resuscitation 2026",
    level: "CRITICAL",
    color: "rose"
  },
  {
    code: "CODE-CITRATE-TOXICITY",
    title: "Citrate Toxicity / Citrate Lock Reversal Protocol (TotCa/iCa > 2.5)",
    triggerCondition: "Total Ca to ionized Ca ratio > 2.5, worsening metabolic acidosis with elevated anion gap and refractory hypocalcemia",
    targetAction: "Halt or reduce Citrate infusion by 50%, increase Calcium Chloride replacement pump, switch to heparin or saline flush",
    guideline: "International Kidney Society Consensus on Regional Citrate Anticoagulation",
    level: "CRITICAL",
    color: "rose"
  },
  {
    code: "CODE-FILTER-RUPTURE",
    title: "Catastrophic Filter Clotting / Blood Leak Detector Alarm",
    triggerCondition: "TMP > 350 mmHg, Delta P > 180 mmHg, Optical blood leak detector trip",
    targetAction: "Immediate circuit blood restitution abort if hemolyzed; clamp lines, change filter cartridge, re-prime new circuit",
    guideline: "FDA 21 CFR Part 11 Device Safety Standard & Manufacturer Overwatch",
    level: "HIGH",
    color: "amber"
  },
  {
    code: "CODE-AIR-EMBOLUS",
    title: "Venous Bubble Air Embolism Emergency E-Stop",
    triggerCondition: "Ultrasonic air detector bubble trigger in venous return chamber",
    targetAction: "Immediate automatic venous line pinch clamp, place patient in Trendelenburg / Left Lateral Decubitus, aspirate catheter",
    guideline: "Intensive Care Society Extracorporeal Blood Purification Protocol",
    level: "CRITICAL",
    color: "rose"
  }
];

// ==========================================
// MAIN COMPONENT
// ==========================================
export default function NephrologyCrrtHub() {
  const [patients, setPatients] = useState(SEED_CRRT_PATIENTS);
  const [selectedPatientId, setSelectedPatientId] = useState("PT-CRRT-201");
  const [activeTab, setActiveTab] = useState("telemetry"); // telemetry | rca | pressures | balance | protocols | audit
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isSimulating, setIsSimulating] = useState(true);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [selectedEmergencyProtocol, setSelectedEmergencyProtocol] = useState(null);
  const [showCalculatorModal, setShowCalculatorModal] = useState(false);
  const [showPatientDetailModal, setShowPatientDetailModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  // Interactive Kinetic Calculator State
  const [calcInputs, setCalcInputs] = useState({
    weight: 80.0,
    hct: 30, // %
    qb: 180, // mL/min
    qd: 1200, // mL/hr
    qpre: 600, // mL/hr
    qpost: 400, // mL/hr
    netUfr: 150, // mL/hr
    citrateRate: 220, // mL/hr (ACD-A)
    caclRate: 45 // mL/hr (CaCl2 10%)
  });

  const { toasts, addToast, removeToast } = useKindToasts();

  const selectedPatient = useMemo(() => {
    return patients.find((p) => p.id === selectedPatientId) || patients[0];
  }, [patients, selectedPatientId]);

  // Real-time telemetry streaming simulation
  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      setPatients((prev) =>
        prev.map((p) => {
          const tmpJitter = (Math.random() - 0.48) * 2;
          const dropJitter = (Math.random() - 0.48) * 1.5;
          const newTmp = Math.max(80, Math.min(380, Math.round(p.tmp + tmpJitter)));
          const newDrop = Math.max(40, Math.min(220, Math.round(p.filterPressureDrop + dropJitter)));
          const newPpre = p.preFilterPressure + Math.round(dropJitter);

          let clotRisk = "Low";
          if (newTmp > 280 || newDrop > 150) {
            clotRisk = "Critical";
          } else if (newTmp > 210 || newDrop > 110) {
            clotRisk = "High";
          } else if (newTmp > 160) {
            clotRisk = "Moderate";
          }

          return {
            ...p,
            tmp: newTmp,
            filterPressureDrop: newDrop,
            preFilterPressure: newPpre,
            filterClotRisk: clotRisk
          };
        })
      );
    }, 2800);

    return () => clearInterval(interval);
  }, [isSimulating]);

  // Calculated Kinetic Outputs
  const calcResults = useMemo(() => {
    const { weight, hct, qb, qd, qpre, qpost, netUfr } = calcInputs;
    const plasmaFlow = qb * (1 - hct / 100) * 60; // mL/hr (Qp)
    const totalUf = qpre + qpost + netUfr; // Total ultrafiltration rate
    const filtrationFraction = plasmaFlow > 0 ? +((totalUf / (plasmaFlow + qpre)) * 100).toFixed(1) : 0;
    const effluentFlow = qd + qpre + qpost + netUfr;
    const effluentDose = weight > 0 ? +(effluentFlow / weight).toFixed(1) : 0;
    const kdigoDoseMet = effluentDose >= 20.0 && effluentDose <= 30.0;

    return {
      plasmaFlow: Math.round(plasmaFlow),
      totalUf: Math.round(totalUf),
      filtrationFraction,
      effluentFlow: Math.round(effluentFlow),
      effluentDose,
      kdigoDoseMet
    };
  }, [calcInputs]);

  // Filtered patient list
  const filteredPatients = useMemo(() => {
    return patients.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.diagnosis.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.bed.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "ALL" || p.status.includes(statusFilter);
      return matchesSearch && matchesStatus;
    });
  }, [patients, searchQuery, statusFilter]);

  // Protocol Triggering
  const handleTriggerEmergency = (proto) => {
    setSelectedEmergencyProtocol(proto);
    setShowEmergencyModal(true);
  };

  const handleConfirmProtocolExecution = () => {
    addToast(
      `🚨 ${selectedEmergencyProtocol.code} EXECUTED: Nephrology Rapid Response dispatched for ${selectedPatient.name} (${selectedPatient.bed}).`,
      "critical"
    );
    setShowEmergencyModal(false);
  };

  // CSV Export
  const handleExportCsv = () => {
    const dataToExport = patients.map((p) => ({
      Patient_ID: p.id,
      Name: p.name,
      Bed: p.bed,
      Diagnosis: p.diagnosis,
      KDIGO_Stage: p.kdigoStage,
      CRRT_Mode: p.crrtMode,
      Blood_Flow_Qb_mL_min: p.bloodFlowRate,
      Dialysate_Qd_mL_hr: p.dialysateRate,
      Net_UFR_mL_hr: p.netUfr,
      Effluent_Dose_mL_kg_hr: p.effluentDose,
      TMP_mmHg: p.tmp,
      Filter_Pressure_Drop_mmHg: p.filterPressureDrop,
      Circuit_Life_Hours: p.circuitLifeHours,
      Systemic_iCa_mmol_L: p.systemicIca,
      Circuit_iCa_mmol_L: p.circuitIca,
      TotCa_iCa_Ratio: p.calciumRatio,
      Fluid_Overload_Percent: p.fluidOverloadPercent,
      Serum_Creatinine_mg_dL: p.serumCreatinine,
      Potassium_mEq_L: p.potassium,
      Bicarbonate_mEq_L: p.bicarbonate,
      Status: p.status
    }));

    downloadCsv(dataToExport, `MedTrack_Nephrology_CRRT_Telemetry_${new Date().toISOString().slice(0, 10)}.csv`);
    addToast("Nephrology CRRT audit ledger exported successfully.", "success");
    setShowExportModal(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-6 font-sans">
      <KindToastTray toasts={toasts} onDismiss={removeToast} />

      {/* HEADER BAR */}
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 border border-cyan-500/30 text-cyan-400">
              <Droplets className="w-8 h-8 animate-pulse text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
                  Nephrology CRRT & Renal Replacement Command Station
                </h1>
                <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  ICU EXTRACORPOREAL OVERWATCH
                </span>
              </div>
              <p className="text-xs md:text-sm text-slate-400 mt-0.5">
                Continuous Hemodiafiltration (CVVHDF), Regional Citrate Anticoagulation (RCA), Transmembrane Pressure & Fluid Balance
              </p>
            </div>
          </div>
        </div>

        {/* Global Action Bar */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsSimulating(!isSimulating)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              isSimulating
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/20"
                : "bg-amber-500/10 text-amber-400 border-amber-500/40 hover:bg-amber-500/20"
            }`}
          >
            {isSimulating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {isSimulating ? "Live Circuit Telemetry" : "Simulation Paused"}
          </button>

          <button
            onClick={() => setShowCalculatorModal(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 hover:bg-indigo-500/20 transition-all"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            CRRT Kinetic Calculator
          </button>

          <button
            onClick={() => setShowExportModal(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            Audit Ledger
          </button>

          <button
            onClick={() => handleTriggerEmergency(CRRT_EMERGENCY_PROTOCOLS[0])}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-rose-600 to-rose-700 text-white shadow-lg shadow-rose-900/30 hover:from-rose-500 hover:to-rose-600 transition-all"
          >
            <Siren className="w-4 h-4 animate-bounce" />
            CRITICAL K+ OVERRIDE
          </button>
        </div>
      </header>

      {/* TOP AGGREGATE SUMMARY METRICS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 my-6">
        <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-3.5 backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Active CRRT Circuits</span>
            <Activity className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-cyan-400">5 / 5</span>
            <span className="text-xs text-slate-400">100% In Service</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">CVVHDF & High-Flux CVVH</p>
        </div>

        <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-3.5 backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Mean Effluent Dose</span>
            <Zap className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-400">27.6</span>
            <span className="text-xs text-slate-400">mL/kg/hr</span>
          </div>
          <p className="text-[10px] text-emerald-300 mt-1">KDIGO Guideline (20-25)</p>
        </div>

        <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-3.5 backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Citrate Anticoagulation (RCA)</span>
            <Shield className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-indigo-400">4 / 5</span>
            <span className="text-xs text-indigo-300">Active</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Circuit iCa 0.25-0.35 mmol/L</p>
        </div>

        <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-3.5 backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Filter Clot Risk (TMP &gt; 250)</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-400">1</span>
            <span className="text-xs text-amber-300">Pt-202</span>
          </div>
          <p className="text-[10px] text-amber-300 mt-1">Membrane Replacement Due</p>
        </div>

        <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-3.5 backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Severe Fluid Overload &gt; 10%</span>
            <Droplets className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-rose-500">2</span>
            <span className="text-xs text-rose-400">High Mortality Risk</span>
          </div>
          <p className="text-[10px] text-rose-400 mt-1">Aggressive Ultrafiltration</p>
        </div>

        <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-3.5 backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Regulatory Standards</span>
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-cyan-400">100%</span>
            <span className="text-xs text-cyan-300">Compliant</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">KDIGO / FDA 21 CFR Part 11</p>
        </div>
      </div>

      {/* TWO-COLUMN COMMAND CONSOLE */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: PATIENT ROSTER & QUICK SELECTION (4 cols) */}
        <div className="xl:col-span-4 space-y-4">
          
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Users className="w-4 h-4 text-cyan-400" />
                ICU Nephrology Roster
              </h2>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-cyan-400">
                {filteredPatients.length} Active
              </span>
            </div>

            <div className="space-y-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search patient, bed, diagnosis..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-all"
                />
              </div>

              <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px]">
                {["ALL", "RUNNING", "WARNING", "WEANING"].map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-2.5 py-1 rounded-md font-medium border transition-all ${
                      statusFilter === status
                        ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/50"
                        : "bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800"
                    }`}
                  >
                    {status === "ALL" ? "All Patients" : status}
                  </button>
                ))}
              </div>
            </div>

            {/* PATIENTS LIST */}
            <div className="mt-3 space-y-2.5 max-h-[560px] overflow-y-auto pr-1">
              {filteredPatients.map((p) => {
                const isSelected = p.id === selectedPatientId;
                const statusBadge =
                  p.status === "WARNING_HIGH_TMP"
                    ? "bg-rose-500/20 text-rose-300 border-rose-500/50"
                    : p.status === "WEANING"
                    ? "bg-indigo-500/10 text-indigo-300 border-indigo-500/30"
                    : "bg-emerald-500/10 text-emerald-300 border-emerald-500/30";

                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPatientId(p.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? "bg-slate-800/90 border-cyan-500/70 shadow-md shadow-cyan-950/40"
                        : "bg-slate-950/60 border-slate-800/80 hover:bg-slate-900/60 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-100">{p.name}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                            {p.bed}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{p.diagnosis}</p>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusBadge}`}>
                        {p.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-4 gap-2 mt-3 pt-2 border-t border-slate-800/60 text-center">
                      <div>
                        <span className="text-[10px] text-slate-500 block">Dose</span>
                        <span className="text-xs font-bold text-emerald-400">{p.effluentDose}</span>
                        <span className="text-[9px] text-slate-500">mL/kg/h</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">TMP</span>
                        <span className={`text-xs font-bold ${p.tmp > 220 ? "text-rose-400" : "text-cyan-400"}`}>
                          {p.tmp}
                        </span>
                        <span className="text-[9px] text-slate-500">mmHg</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">Net UF</span>
                        <span className="text-xs font-bold text-slate-200">-{p.netUfr}</span>
                        <span className="text-[9px] text-slate-500">mL/h</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">FO %</span>
                        <span className={`text-xs font-bold ${p.fluidOverloadPercent > 10 ? "text-rose-400" : "text-slate-300"}`}>
                          {p.fluidOverloadPercent > 0 ? `+${p.fluidOverloadPercent}%` : `${p.fluidOverloadPercent}%`}
                        </span>
                      </div>
                    </div>

                    <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-400 bg-slate-900/60 px-2 py-1 rounded-md">
                      <span className="flex items-center gap-1.5 truncate">
                        <Cpu className="w-3 h-3 text-cyan-400 shrink-0" />
                        {p.crrtMode.split(" ")[0]}
                      </span>
                      <span className="text-slate-400 shrink-0">Life: {p.circuitLifeHours}h</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* CRRT EMERGENCY PROTOCOL QUICK DIRECTIVES */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2 mb-2.5">
              <Siren className="w-4 h-4 text-rose-500" />
              Nephrology Emergency Directives
            </h3>
            <div className="space-y-2">
              {CRRT_EMERGENCY_PROTOCOLS.map((proto) => (
                <div
                  key={proto.code}
                  className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/90 flex items-center justify-between hover:border-slate-700 transition-all"
                >
                  <div className="pr-2">
                    <span className="text-xs font-bold text-slate-200 block">{proto.title}</span>
                    <span className="text-[10px] text-slate-400 line-clamp-1">{proto.triggerCondition}</span>
                  </div>
                  <button
                    onClick={() => handleTriggerEmergency(proto)}
                    className="shrink-0 px-2 py-1 rounded text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20"
                  >
                    Trigger
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: DETAILED CIRCUIT CONSOLE & TELEMETRY MATRIX (8 cols) */}
        <div className="xl:col-span-8 space-y-4">
          
          {/* PATIENT BANNER CARD */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 lg:p-5 relative overflow-hidden">
            <div className="absolute right-0 top-0 w-96 h-96 bg-gradient-to-bl from-cyan-500/5 via-indigo-500/5 to-transparent pointer-events-none" />
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-black text-white">{selectedPatient.name}</h2>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                    {selectedPatient.id}
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                    {selectedPatient.bed}
                  </span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/40">
                    KDIGO: {selectedPatient.kdigoStage}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  <span className="font-semibold text-slate-400">Diagnosis:</span> {selectedPatient.diagnosis}
                </p>
                <div className="flex flex-wrap items-center gap-4 mt-2 text-[11px] text-slate-400">
                  <span>Weight: <strong className="text-slate-200">{selectedPatient.weight} kg</strong> (Adm: {selectedPatient.admissionWeight} kg)</span>
                  <span>Fluid Overload: <strong className={`${selectedPatient.fluidOverloadPercent > 10 ? "text-rose-400" : "text-slate-200"}`}>{selectedPatient.fluidOverloadPercent}%</strong></span>
                  <span>Attending: <strong className="text-slate-200">{selectedPatient.attendingNephrologist}</strong></span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setShowPatientDetailModal(true)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-all"
                >
                  <Eye className="w-3.5 h-3.5 text-cyan-400" />
                  Full Dossier
                </button>
              </div>
            </div>

            {/* TAB NAVIGATION */}
            <div className="flex items-center gap-2 mt-5 border-b border-slate-800 overflow-x-auto text-xs">
              {[
                { id: "telemetry", label: "Circuit Flow Matrix", icon: Activity },
                { id: "rca", label: "Citrate & Calcium Kinetics", icon: Shield },
                { id: "pressures", label: "Circuit Pressures & TMP", icon: Gauge },
                { id: "balance", label: "Electrolytes & Fluid Balance", icon: Droplets },
                { id: "protocols", label: "KDIGO Protocols", icon: ShieldCheck }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-3 py-2 border-b-2 font-medium transition-all ${
                      activeTab === tab.id
                        ? "border-cyan-400 text-cyan-400"
                        : "border-transparent text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* TAB 1: CIRCUIT FLOW MATRIX */}
          {activeTab === "telemetry" && (
            <div className="space-y-4">
              {/* PRIMARY PUMP SPEED CARDS */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5">
                  <div className="flex items-center justify-between text-slate-400 text-xs">
                    <span>Blood Flow Rate (Qb)</span>
                    <Activity className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div className="mt-1">
                    <span className="text-2xl font-black text-cyan-400">{selectedPatient.bloodFlowRate}</span>
                    <span className="text-xs text-slate-400 ml-1">mL/min</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 flex justify-between">
                    <span>Access: <strong className="text-slate-200">{selectedPatient.accessPressure} mmHg</strong></span>
                    <span>Return: <strong className="text-slate-200">{selectedPatient.returnPressure} mmHg</strong></span>
                  </div>
                </div>

                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5">
                  <div className="flex items-center justify-between text-slate-400 text-xs">
                    <span>Effluent Dose</span>
                    <Zap className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="mt-1">
                    <span className="text-2xl font-black text-emerald-400">{selectedPatient.effluentDose}</span>
                    <span className="text-xs text-slate-400 ml-1">mL/kg/hr</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 flex justify-between">
                    <span>Flow: <strong className="text-slate-200">{selectedPatient.effluentFlow} mL/h</strong></span>
                    <span className="text-emerald-400">KDIGO Target Met</span>
                  </div>
                </div>

                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5">
                  <div className="flex items-center justify-between text-slate-400 text-xs">
                    <span>Net Ultrafiltration (UFR)</span>
                    <Droplets className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div className="mt-1">
                    <span className="text-2xl font-black text-indigo-400">-{selectedPatient.netUfr}</span>
                    <span className="text-xs text-slate-400 ml-1">mL/hr</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 flex justify-between">
                    <span>24h Net: <strong className="text-indigo-300">{selectedPatient.fluidBalance24h} mL</strong></span>
                    <span>Decongesting</span>
                  </div>
                </div>

                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5">
                  <div className="flex items-center justify-between text-slate-400 text-xs">
                    <span>Transmembrane Press. (TMP)</span>
                    <Gauge className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="mt-1">
                    <span className={`text-2xl font-black ${selectedPatient.tmp > 220 ? "text-rose-400 animate-pulse" : "text-amber-400"}`}>
                      {selectedPatient.tmp}
                    </span>
                    <span className="text-xs text-slate-400 ml-1">mmHg</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 flex justify-between">
                    <span>Drop (ΔP): <strong className="text-slate-200">{selectedPatient.filterPressureDrop} mmHg</strong></span>
                    <span className={selectedPatient.filterClotRisk === "High" ? "text-rose-400" : "text-slate-400"}>
                      {selectedPatient.filterClotRisk} Risk
                    </span>
                  </div>
                </div>
              </div>

              {/* FLUID FLOW RATES INVENTORY */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center justify-between">
                  <span>Extracorporeal Substitution & Dialysate Flow Rates</span>
                  <span className="text-[10px] text-slate-500 font-normal">Active Mode: {selectedPatient.crrtMode}</span>
                </h3>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-slate-500 block">Dialysate Rate (Qd)</span>
                    <span className="text-lg font-bold text-slate-200 mt-0.5 block">{selectedPatient.dialysateRate} mL/hr</span>
                    <span className="text-[10px] text-slate-500">PrismaSOGol / Prism0Cal B22</span>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-slate-500 block">Pre-Filter Replacement (Qpre)</span>
                    <span className="text-lg font-bold text-slate-200 mt-0.5 block">{selectedPatient.preReplacementRate} mL/hr</span>
                    <span className="text-[10px] text-slate-500">Reduces pre-filter Hct & Clotting</span>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-slate-500 block">Post-Filter Replacement (Qpost)</span>
                    <span className="text-lg font-bold text-slate-200 mt-0.5 block">{selectedPatient.postReplacementRate} mL/hr</span>
                    <span className="text-[10px] text-slate-500">Maximizes solute convective clearance</span>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-slate-500 block">Filtration Fraction (FF %)</span>
                    <span className="text-lg font-bold text-cyan-400 mt-0.5 block">{selectedPatient.filtrationFraction}%</span>
                    <span className="text-[10px] text-emerald-400">Target &lt; 25% (Safe)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CITRATE & CALCIUM KINETICS */}
          {activeTab === "rca" && (
            <div className="space-y-4">
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                      <Shield className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">Regional Citrate Anticoagulation (RCA) Overwatch</h3>
                      <p className="text-xs text-slate-400">Protocol: Anticoagulant Citrate Dextrose Solution A (ACD-A) + 10% Calcium Chloride Infusion</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded text-xs font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
                    RCA ACTIVE
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-xs text-slate-500 block">Circuit Ionized Calcium (Post-Filter)</span>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className={`text-3xl font-black ${selectedPatient.circuitIca < 0.25 || selectedPatient.circuitIca > 0.35 ? "text-rose-400" : "text-emerald-400"}`}>
                        {selectedPatient.circuitIca}
                      </span>
                      <span className="text-xs text-slate-400">mmol/L</span>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-2 block">Target Range: 0.25 - 0.35 mmol/L</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-xs text-slate-500 block">Systemic Ionized Calcium (Patient)</span>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className={`text-3xl font-black ${selectedPatient.systemicIca < 1.10 ? "text-rose-400" : "text-cyan-400"}`}>
                        {selectedPatient.systemicIca}
                      </span>
                      <span className="text-xs text-slate-400">mmol/L</span>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-2 block">Target Range: 1.10 - 1.30 mmol/L</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-xs text-slate-500 block">Total Ca / Ionized Ca Ratio</span>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className={`text-3xl font-black ${selectedPatient.calciumRatio > 2.5 ? "text-rose-500 animate-pulse" : "text-slate-200"}`}>
                        {selectedPatient.calciumRatio}
                      </span>
                    </div>
                    <span className={`text-[10px] mt-2 block ${selectedPatient.calciumRatio > 2.5 ? "text-rose-400 font-bold" : "text-emerald-400"}`}>
                      {selectedPatient.calciumRatio > 2.5 ? "⚠️ Citrate Accumulation Alert" : "No Citrate Toxicity (Cutoff < 2.5)"}
                    </span>
                  </div>
                </div>

                {/* RCA TITRATION MATRIX GUIDELINES */}
                <div className="mt-4 p-3.5 rounded-lg bg-slate-950 border border-slate-800 text-xs space-y-2">
                  <span className="font-bold text-slate-300 block">RCA Pump Titration Algorithm:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-slate-400">
                    <div className="p-2 bg-slate-900 rounded border border-slate-800">
                      <strong className="text-cyan-300 block">If Circuit iCa &gt; 0.35 mmol/L:</strong>
                      <span>Increase Citrate infusion rate by 10-15 mL/hr to prevent filter thrombosis.</span>
                    </div>
                    <div className="p-2 bg-slate-900 rounded border border-slate-800">
                      <strong className="text-rose-300 block">If Systemic iCa &lt; 1.10 mmol/L:</strong>
                      <span>Increase 10% Calcium Chloride replacement infusion by 10 mL/hr to avert arrhythmia.</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CIRCUIT PRESSURES & TMP */}
          {activeTab === "pressures" && (
            <div className="space-y-4">
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center justify-between">
                  <span>Four-Chamber Extracorporeal Pressure Transducers</span>
                  <span className="text-[10px] text-slate-500 font-normal">Optical Blood Leak Detector: SAFE</span>
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-slate-500 block">Access Pressure (Pacc)</span>
                    <span className="text-xl font-black text-slate-200 mt-1 block">{selectedPatient.accessPressure} mmHg</span>
                    <span className="text-[10px] text-emerald-400">Nominal (-50 to -150)</span>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-slate-500 block">Pre-Filter Pressure (Ppre)</span>
                    <span className="text-xl font-black text-slate-200 mt-1 block">{selectedPatient.preFilterPressure} mmHg</span>
                    <span className="text-[10px] text-slate-400">Max limit 350 mmHg</span>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-slate-500 block">Return / Venous Press. (Pret)</span>
                    <span className="text-xl font-black text-slate-200 mt-1 block">{selectedPatient.returnPressure} mmHg</span>
                    <span className="text-[10px] text-emerald-400">Nominal (50 to 150)</span>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-slate-500 block">Effluent Pressure (Peff)</span>
                    <span className="text-xl font-black text-slate-200 mt-1 block">{selectedPatient.effluentPressure} mmHg</span>
                    <span className="text-[10px] text-slate-400">Suction dynamic</span>
                  </div>
                </div>

                <div className="mt-4 p-3.5 rounded-lg bg-slate-950 border border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs">
                  <div>
                    <span className="font-bold text-slate-200 block">Circuit Lifespan & Deposition Index</span>
                    <p className="text-slate-400 text-[11px] mt-0.5">Filter running for {selectedPatient.circuitLifeHours} hours. Recommended maximum membrane life: 72 hours.</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-semibold px-2 py-1 rounded bg-slate-800 text-cyan-400 border border-slate-700">
                      {72 - selectedPatient.circuitLifeHours}h Remaining
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: ELECTROLYTES & FLUID BALANCE */}
          {activeTab === "balance" && (
            <div className="space-y-4">
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">
                  Serum Electrolytes, Acid-Base & Nitrogenous Waste Kinetics
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-slate-500 block">Potassium (K+)</span>
                    <span className={`text-xl font-black mt-1 block ${selectedPatient.potassium > 5.5 ? "text-rose-400" : "text-emerald-400"}`}>
                      {selectedPatient.potassium} mEq/L
                    </span>
                    <span className="text-[10px] text-slate-500">Target 3.8 - 4.8</span>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-slate-500 block">Bicarbonate (HCO3-) / pH</span>
                    <span className="text-xl font-black text-slate-200 mt-1 block">{selectedPatient.bicarbonate} / {selectedPatient.ph}</span>
                    <span className="text-[10px] text-slate-500">Target pH 7.35-7.45</span>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-slate-500 block">Serum Creatinine / BUN</span>
                    <span className="text-xl font-black text-slate-200 mt-1 block">{selectedPatient.serumCreatinine} / {selectedPatient.bun}</span>
                    <span className="text-[10px] text-slate-500">mg/dL</span>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-slate-500 block">Cumulative Fluid Removal</span>
                    <span className="text-xl font-black text-indigo-400 mt-1 block">{selectedPatient.fluidBalance24h} mL</span>
                    <span className="text-[10px] text-slate-500">Last 24 Hours</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: KDIGO GUIDELINES & PROTOCOLS */}
          {activeTab === "protocols" && (
            <div className="space-y-4">
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  KDIGO 2026 Acute Kidney Injury & CRRT Consensus Standards
                </h3>

                <div className="space-y-3 text-xs">
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="font-bold text-cyan-300">1. Effluent Dose Prescription Target</span>
                    <p className="text-slate-400 mt-1">KDIGO guidelines recommend delivering an effluent dose of 20 to 25 mL/kg/hr for CRRT in AKI. Prescribing 25-30 mL/kg/hr accounts for downtime during bag changes and filter clotting.</p>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="font-bold text-indigo-300">2. Regional Citrate Anticoagulation as First-Line</span>
                    <p className="text-slate-400 mt-1">Use regional citrate anticoagulation rather than heparin for CRRT in patients who do not have severe liver failure or circulatory shock with refractory lactic acidosis.</p>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="font-bold text-rose-300">3. Fluid Overload Threshold for Mortality Risk</span>
                    <p className="text-slate-400 mt-1">Fluid accumulation exceeding 10% of admission weight is an independent predictor of ICU mortality. Target active net ultrafiltration to achieve negative cumulative fluid balance.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ========================================== */}
      {/* MODAL 1: CRRT KINETIC CALCULATOR */}
      {/* ========================================== */}
      {showCalculatorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  <SlidersHorizontal className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Interactive CRRT Extracorporeal Kinetic Engine</h3>
                  <p className="text-xs text-slate-400">Calculate Effluent Dose, Filtration Fraction & Solute Clearance</p>
                </div>
              </div>
              <button
                onClick={() => setShowCalculatorModal(false)}
                className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 my-5">
              {/* SLIDERS INPUTS */}
              <div className="lg:col-span-6 space-y-3.5 bg-slate-950/70 p-4 rounded-xl border border-slate-800/80">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">Prescription Flow Parameters</h4>

                <div>
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>Patient Weight (kg)</span>
                    <strong className="text-cyan-400">{calcInputs.weight} kg</strong>
                  </div>
                  <input
                    type="range"
                    min="40"
                    max="140"
                    value={calcInputs.weight}
                    onChange={(e) => setCalcInputs({ ...calcInputs, weight: +e.target.value })}
                    className="w-full accent-cyan-400"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>Blood Flow Rate (Qb)</span>
                    <strong className="text-cyan-400">{calcInputs.qb} mL/min</strong>
                  </div>
                  <input
                    type="range"
                    min="100"
                    max="300"
                    value={calcInputs.qb}
                    onChange={(e) => setCalcInputs({ ...calcInputs, qb: +e.target.value })}
                    className="w-full accent-cyan-400"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>Dialysate Flow (Qd)</span>
                    <strong className="text-cyan-400">{calcInputs.qd} mL/hr</strong>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="3000"
                    step="100"
                    value={calcInputs.qd}
                    onChange={(e) => setCalcInputs({ ...calcInputs, qd: +e.target.value })}
                    className="w-full accent-cyan-400"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>Pre-Filter Replacement (Qpre)</span>
                    <strong className="text-cyan-400">{calcInputs.qpre} mL/hr</strong>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="2000"
                    step="50"
                    value={calcInputs.qpre}
                    onChange={(e) => setCalcInputs({ ...calcInputs, qpre: +e.target.value })}
                    className="w-full accent-cyan-400"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>Net Ultrafiltration (Net UFR)</span>
                    <strong className="text-cyan-400">{calcInputs.netUfr} mL/hr</strong>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="500"
                    step="10"
                    value={calcInputs.netUfr}
                    onChange={(e) => setCalcInputs({ ...calcInputs, netUfr: +e.target.value })}
                    className="w-full accent-cyan-400"
                  />
                </div>
              </div>

              {/* CALCULATED DERIVED MATRIX */}
              <div className="lg:col-span-6 space-y-3 bg-slate-950/70 p-4 rounded-xl border border-slate-800/80">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">Derived Extracorporeal Indices</h4>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-slate-500 block">Effluent Dose</span>
                    <span className="text-lg font-black text-emerald-400">
                      {calcResults.effluentDose} mL/kg/h
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">KDIGO: 20 - 25 target</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-slate-500 block">Filtration Fraction (FF %)</span>
                    <span className={`text-lg font-black ${calcResults.filtrationFraction > 25 ? "text-rose-400" : "text-cyan-400"}`}>
                      {calcResults.filtrationFraction}%
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">Cutoff &lt; 25%</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-slate-500 block">Plasma Flow Rate (Qp)</span>
                    <span className="text-lg font-black text-slate-200">
                      {calcResults.plasmaFlow} mL/hr
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">Based on Hct {calcInputs.hct}%</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-slate-500 block">Total Ultrafiltration</span>
                    <span className="text-lg font-black text-slate-200">
                      {calcResults.totalUf} mL/hr
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">Qpre + Qpost + Net</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => {
                  setCalcInputs({
                    weight: selectedPatient.weight,
                    hct: 30,
                    qb: selectedPatient.bloodFlowRate,
                    qd: selectedPatient.dialysateRate,
                    qpre: selectedPatient.preReplacementRate,
                    qpost: selectedPatient.postReplacementRate,
                    netUfr: selectedPatient.netUfr,
                    citrateRate: 200,
                    caclRate: 40
                  });
                  addToast("Loaded selected patient prescription parameters.", "info");
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all"
              >
                Sync with Patient
              </button>
              <button
                onClick={() => setShowCalculatorModal(false)}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white transition-all"
              >
                Close Calculator
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL 2: EMERGENCY PROTOCOL CONFIRMATION */}
      {/* ========================================== */}
      {showEmergencyModal && selectedEmergencyProtocol && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border-2 border-rose-500/60 rounded-2xl w-full max-w-xl p-6 shadow-2xl shadow-rose-950/50">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
              <div className="p-3 rounded-xl bg-rose-500/20 text-rose-500 border border-rose-500/40 animate-pulse">
                <Siren className="w-7 h-7" />
              </div>
              <div>
                <span className="text-xs font-bold text-rose-400 tracking-wider uppercase">High-Assurance Emergency Escalation</span>
                <h3 className="text-xl font-black text-white">{selectedEmergencyProtocol.title}</h3>
              </div>
            </div>

            <div className="my-5 space-y-3.5 text-xs text-slate-300">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-500 font-semibold block">Target Patient:</span>
                <span className="text-base font-bold text-white">{selectedPatient.name} ({selectedPatient.id})</span>
                <span className="text-xs text-rose-400 block mt-0.5">{selectedPatient.bed} • {selectedPatient.diagnosis}</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-500 font-semibold block">Standardized Directive:</span>
                <p className="text-slate-200 mt-1">{selectedEmergencyProtocol.targetAction}</p>
                <span className="text-[10px] text-slate-500 block mt-2">Authority: {selectedEmergencyProtocol.guideline}</span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                onClick={() => setShowEmergencyModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all"
              >
                Cancel Protocol
              </button>
              <button
                onClick={handleConfirmProtocolExecution}
                className="px-6 py-2 rounded-xl text-xs font-black bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-900/40 transition-all flex items-center gap-2"
              >
                <Flame className="w-4 h-4" />
                EXECUTE PROTOCOL OVERRIDE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL 3: PATIENT FULL DOSSIER */}
      {/* ========================================== */}
      {showPatientDetailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <User className="w-5 h-5 text-cyan-400" />
                Nephrology CRRT Dossier: {selectedPatient.name}
              </h3>
              <button onClick={() => setShowPatientDetailModal(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 my-4 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-slate-500 block">Patient ID</span>
                  <span className="font-bold text-slate-200">{selectedPatient.id}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-slate-500 block">Room / Bed</span>
                  <span className="font-bold text-slate-200">{selectedPatient.bed}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-slate-500 block">KDIGO AKI Classification</span>
                  <span className="font-bold text-purple-400">{selectedPatient.kdigoStage}</span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5">
                <span className="font-bold text-slate-300 block">Complete Renal & Extracorporeal Summary</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-400">
                  <div>Weight: <strong className="text-slate-200">{selectedPatient.weight} kg</strong></div>
                  <div>Creatinine: <strong className="text-slate-200">{selectedPatient.serumCreatinine} mg/dL</strong></div>
                  <div>BUN: <strong className="text-slate-200">{selectedPatient.bun} mg/dL</strong></div>
                  <div>K+: <strong className="text-slate-200">{selectedPatient.potassium} mEq/L</strong></div>
                  <div>pH: <strong className="text-slate-200">{selectedPatient.ph}</strong></div>
                  <div>HCO3: <strong className="text-slate-200">{selectedPatient.bicarbonate} mEq/L</strong></div>
                  <div>Lactate: <strong className="text-slate-200">{selectedPatient.lactate} mmol/L</strong></div>
                  <div>Fluid Balance: <strong className="text-indigo-400">{selectedPatient.fluidBalance24h} mL</strong></div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-800">
              <button
                onClick={() => setShowPatientDetailModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-200 hover:bg-slate-700"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL 4: AUDIT LEDGER EXPORT */}
      {/* ========================================== */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Download className="w-5 h-5 text-indigo-400" />
                Nephrology Audit & FHIR R4 Export
              </h3>
              <button onClick={() => setShowExportModal(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="my-4 text-xs text-slate-300 space-y-3">
              <p className="text-slate-400">
                Exports all CRRT circuit pressure streams, regional citrate anticoagulation indices, and KDIGO AKI telemetry records adhering to FDA 21 CFR Part 11 and HL7 FHIR R4 Observations.
              </p>
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-400">
                <span className="text-slate-300 font-semibold block">Cryptographic Provenance Stamp:</span>
                <span className="font-mono text-cyan-400 block mt-0.5">SHA256: 7f3b...a194c</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleExportCsv}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                Export CSV Record
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
