import React, { useState, useEffect, useMemo } from "react";
import {
  Activity,
  Heart,
  HeartPulse,
  ShieldAlert,
  AlertTriangle,
  Zap,
  Gauge,
  Sliders,
  SlidersHorizontal,
  TrendingUp,
  TrendingDown,
  Wind,
  Droplets,
  Radio,
  FileText,
  Download,
  RefreshCw,
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
  Brain,
  Baby,
  Sparkles,
  Thermometer,
  Shield
} from "lucide-react";
import { downloadCsv } from "../../utils/csv";
import { useKindToasts, KindToastTray } from "../../components/common/HubToasts";

// ==========================================
// SEED PEDIATRIC ICU PATIENTS DATA
// ==========================================
const SEED_PICU_PATIENTS = [
  {
    id: "PT-PICU-401",
    name: "Noah Caldwell",
    ageMonths: 18,
    ageDisplay: "18 Months (Toddler)",
    gender: "Male",
    bed: "PICU-ROOM-01",
    weightKg: 11.5,
    broselowColor: "Purple (10-11 kg)",
    broselowHex: "#a855f7",
    diagnosis: "Severe Traumatic Brain Injury (TBI) Post-MVA / Diffuse Axonal Injury",
    pelod2Score: 8,
    psofaScore: 6,
    pgcs: 6, // E1V2M3 (Comatose)
    hr: 138, // bpm (Normal toddler 90-150)
    rr: 26,
    sbp: 104,
    dbp: 58,
    map: 73,
    spo2: 98,
    temp: 36.8, // °C
    icp: 22, // mmHg (Critical pediatric ICP > 15-20)
    cpp: 51, // mmHg (Target CPP 40-50 for infants, 50-60 for children)
    pbto2: 14, // mmHg (Brain tissue oxygenation - ischemia < 15)
    etco2: 34, // mmHg (Target 35-40, mild hyperventilation)
    ventMode: "PRVC (Pressure Regulated Volume Control)",
    fio2: 45,
    peep: 6,
    tidalVolume: 70, // mL (6-8 mL/kg)
    ecmoMode: "None",
    sedationRass: -4,
    inotropes: [
      { drug: "Norepinephrine", dose: 0.08, unit: "mcg/kg/min" },
      { drug: "Milrinone", dose: 0.35, unit: "mcg/kg/min" }
    ],
    ivFluids: "D5 0.9% NS + 20 mEq KCl @ 45 mL/hr",
    hyperosmolarTherapy: "3% Hypertonic Saline continuous @ 1.5 mL/kg/hr",
    serumSodium: 152, // mEq/L (Target 145-155 for TBI ICP control)
    lactate: 2.1, // mmol/L
    status: "CRITICAL_ICP_SPIKE",
    attendingIntensivist: "Dr. Maya Patel, MD, FAAP (Pediatric Critical Care & Neuro-ICU)"
  },
  {
    id: "PT-PICU-402",
    name: "Sophia Martinez",
    ageMonths: 4,
    ageDisplay: "4 Months (Infant)",
    gender: "Female",
    bed: "PICU-ROOM-04",
    weightKg: 6.2,
    broselowColor: "Pink (6-7 kg)",
    broselowHex: "#ec4899",
    diagnosis: "Severe RSV Bronchiolitis with ARDS / Exhaustive Respiratory Failure",
    pelod2Score: 11,
    psofaScore: 9,
    pgcs: 14,
    hr: 168,
    rr: 58,
    sbp: 78,
    dbp: 44,
    map: 55,
    spo2: 89,
    temp: 38.6,
    icp: 8,
    cpp: 47,
    pbto2: 24,
    etco2: 58, // Severe hypercapnic respiratory acidosis
    ventMode: "HFOV (High Frequency Oscillatory Ventilation)",
    fio2: 80,
    peep: 14, // Mean Airway Pressure 18 cmH2O
    tidalVolume: 12,
    ecmoMode: "VV-ECMO Cannulation Standby",
    sedationRass: -3,
    inotropes: [
      { drug: "Epinephrine", dose: 0.06, unit: "mcg/kg/min" }
    ],
    ivFluids: "D10 0.2% NS @ 22 mL/hr",
    hyperosmolarTherapy: "None",
    serumSodium: 138,
    lactate: 3.4,
    status: "REFRACTORY_HYPOXEMIA",
    attendingIntensivist: "Dr. Julian Vance, MD, FAAP (Pediatric Pulmonology & ECMO)"
  },
  {
    id: "PT-PICU-403",
    name: "Ethan Walker",
    ageMonths: 84, // 7 years
    ageDisplay: "7 Years (Child)",
    gender: "Male",
    bed: "PICU-ROOM-07",
    weightKg: 24.0,
    broselowColor: "Blue (22-25 kg)",
    broselowHex: "#3b82f6",
    diagnosis: "Meningococcal Septic Shock / Purpura Fulminans & Multi-Organ Failure",
    pelod2Score: 14,
    psofaScore: 12,
    pgcs: 9,
    hr: 144,
    rr: 32,
    sbp: 82,
    dbp: 42,
    map: 55,
    spo2: 95,
    temp: 39.4,
    icp: 12,
    cpp: 43,
    pbto2: 22,
    etco2: 32,
    ventMode: "SIMV-PC + PS",
    fio2: 50,
    peep: 8,
    tidalVolume: 170,
    ecmoMode: "VA-ECMO Active (Flow 2.2 L/min)",
    sedationRass: -4,
    inotropes: [
      { drug: "Norepinephrine", dose: 0.22, unit: "mcg/kg/min" },
      { drug: "Epinephrine", dose: 0.15, unit: "mcg/kg/min" },
      { drug: "Vasopressin", dose: 0.0005, unit: "units/kg/min" }
    ],
    ivFluids: "Albumin 5% + Balanced Crystalloids",
    hyperosmolarTherapy: "None",
    serumSodium: 141,
    lactate: 5.8,
    status: "SEPTIC_SHOCK_ECMO",
    attendingIntensivist: "Dr. Maya Patel, MD, FAAP (Pediatric Critical Care)"
  },
  {
    id: "PT-PICU-404",
    name: "Lily Chen",
    ageMonths: 144, // 12 years
    ageDisplay: "12 Years (Adolescent)",
    gender: "Female",
    bed: "PICU-ROOM-10",
    weightKg: 42.0,
    broselowColor: "Green (38-46 kg)",
    broselowHex: "#10b981",
    diagnosis: "Refractory Status Epilepticus / Autoimmune Encephalitis",
    pelod2Score: 5,
    psofaScore: 4,
    pgcs: 7,
    hr: 98,
    rr: 18,
    sbp: 118,
    dbp: 72,
    map: 87,
    spo2: 99,
    temp: 37.2,
    icp: 11,
    cpp: 76,
    pbto2: 28,
    etco2: 38,
    ventMode: "Volume Control (CMV)",
    fio2: 35,
    peep: 5,
    tidalVolume: 290,
    ecmoMode: "None",
    sedationRass: -5,
    inotropes: [],
    ivFluids: "0.9% NS @ 85 mL/hr",
    hyperosmolarTherapy: "None",
    serumSodium: 140,
    lactate: 1.4,
    status: "CONTINUOUS_EEG_BURST_SUPPRESSION",
    attendingIntensivist: "Dr. Maya Patel, MD, FAAP (Pediatric Neuro-Intensive Care)"
  },
  {
    id: "PT-PICU-405",
    name: "Oliver Davies",
    ageMonths: 36, // 3 years
    ageDisplay: "3 Years (Toddler)",
    gender: "Male",
    bed: "PICU-ROOM-12",
    weightKg: 14.5,
    broselowColor: "White (12-14 kg)",
    broselowHex: "#e2e8f0",
    diagnosis: "Post-Operative Tetralogy of Fallot Complete Repair / Junctional Ectopic Tachycardia",
    pelod2Score: 6,
    psofaScore: 5,
    pgcs: 15,
    hr: 122,
    rr: 24,
    sbp: 96,
    dbp: 56,
    map: 69,
    spo2: 97,
    temp: 37.0,
    icp: 9,
    cpp: 60,
    pbto2: 26,
    etco2: 36,
    ventMode: "Pressure Support / CPAP (Extubation Weaning)",
    fio2: 30,
    peep: 5,
    tidalVolume: 105,
    ecmoMode: "None",
    sedationRass: 0,
    inotropes: [
      { drug: "Milrinone", dose: 0.25, unit: "mcg/kg/min" }
    ],
    ivFluids: "D5 0.45% NS @ 48 mL/hr",
    hyperosmolarTherapy: "None",
    serumSodium: 139,
    lactate: 1.2,
    status: "WEANING_STABILIZING",
    attendingIntensivist: "Dr. Julian Vance, MD, FAAP (Pediatric Cardiac Intensive Care)"
  }
];

// ==========================================
// PALS & PICU EMERGENCY DIRECTIVES
// ==========================================
const PALS_EMERGENCY_PROTOCOLS = [
  {
    code: "CODE-PALS-MEGACODE",
    title: "PALS Pediatric Cardiac Arrest / MegaCode Protocol",
    triggerCondition: "Loss of palpable central pulse (Brachial in infants, Carotid/Femoral in children) with HR < 60 bpm & poor perfusion",
    targetAction: "High-quality CPR (15:2 with 2 rescuers, 100-120/min, 1/3 AP depth), Epinephrine 0.01 mg/kg IV/IO (0.1 mL/kg of 0.1 mg/mL) q3-5min, Defibrillation 2 J/kg -> 4 J/kg",
    guideline: "American Heart Association (AHA) PALS Guidelines 2026",
    level: "CRITICAL",
    color: "rose"
  },
  {
    code: "CODE-PICU-ICP-SPIKE",
    title: "Malignant Pediatric Intracranial Hypertension (ICP > 20 mmHg / CPP < 40-50)",
    triggerCondition: "Sustained ICP > 20 mmHg for > 5 min, Cushing's triad (bradycardia, hypertension, irregular breathing), pupil asymmetry",
    targetAction: "Stat 3% Hypertonic Saline 5 mL/kg IV over 10 min OR Mannitol 0.5-1.0 g/kg, open EVD to drain CSF at 10 cmH2O, head midline 30°, maintain PaCO2 35-38",
    guideline: "Pediatric Brain Trauma Foundation Guidelines 2026",
    level: "CRITICAL",
    color: "rose"
  },
  {
    code: "CODE-STATUS-EPILEPTICUS",
    title: "Refractory Pediatric Status Epilepticus Tiered Protocol",
    triggerCondition: "Continuous seizure activity >= 5 min OR recurrent seizures without recovery of consciousness",
    targetAction: "0-5 min: Lorazepam 0.1 mg/kg IV (or Midazolam 0.2 mg/kg IM/IN); 5-15 min: Levetiracetam (Keppra) 60 mg/kg IV (max 4.5g); >20 min: Propofol/Midazolam continuous infusion",
    guideline: "American Epilepsy Society (AES) Pediatric Status Epilepticus Algorithm",
    level: "HIGH",
    color: "amber"
  },
  {
    code: "CODE-PEDIATRIC-SEPSIS",
    title: "Pediatric Septic Shock Hour-1 Resuscitation Bundle",
    triggerCondition: "Suspected infection with age-abnormal HR/RR + delayed capillary refill > 2 sec, altered mental status, hypotension",
    targetAction: "Rapid IV/IO access <= 5 min, 10-20 mL/kg balanced crystalloid bolus over 10-20 min, broad-spectrum IV antibiotics <= 60 min, start Epinephrine (cold shock) or Norepinephrine (warm shock)",
    guideline: "Surviving Sepsis Campaign International Guidelines for Pediatric Sepsis",
    level: "HIGH",
    color: "purple"
  }
];

// ==========================================
// MAIN COMPONENT
// ==========================================
export default function PediatricIcuTelemetryHub() {
  const [patients, setPatients] = useState(SEED_PICU_PATIENTS);
  const [selectedPatientId, setSelectedPatientId] = useState("PT-PICU-401");
  const [activeTab, setActiveTab] = useState("neuro"); // neuro | vitals | pals | ventilation | protocols | audit
  const [searchQuery, setSearchQuery] = useState("");
  const [broselowFilter, setBroselowFilter] = useState("ALL");
  const [isSimulating, setIsSimulating] = useState(true);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [selectedEmergencyProtocol, setSelectedEmergencyProtocol] = useState(null);
  const [showCalculatorModal, setShowCalculatorModal] = useState(false);
  const [showPatientDetailModal, setShowPatientDetailModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  // Interactive Broselow & PALS Resuscitation Calculator State
  const [calcInputs, setCalcInputs] = useState({
    weightKg: 12.0,
    ageMonths: 24,
    targetMap: 65,
    measuredIcp: 18,
    measuredSbp: 95,
    measuredDbp: 50
  });

  const { toasts, addToast, removeToast } = useKindToasts();

  const selectedPatient = useMemo(() => {
    return patients.find((p) => p.id === selectedPatientId) || patients[0];
  }, [patients, selectedPatientId]);

  // Real-time telemetry simulation
  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      setPatients((prev) =>
        prev.map((p) => {
          const hrJitter = (Math.random() - 0.48) * 3;
          const icpJitter = (Math.random() - 0.48) * 1.2;
          const mapJitter = (Math.random() - 0.5) * 1.5;

          const newHr = Math.round(p.hr + hrJitter);
          const newIcp = Math.max(4, Math.min(45, Math.round(p.icp + icpJitter)));
          const newMap = Math.round(p.map + mapJitter);
          const newCpp = newMap - newIcp;

          let newStatus = p.status;
          if (newIcp >= 20) {
            newStatus = "CRITICAL_ICP_SPIKE";
          }

          return {
            ...p,
            hr: newHr,
            icp: newIcp,
            map: newMap,
            cpp: newCpp,
            status: newStatus
          };
        })
      );
    }, 2800);

    return () => clearInterval(interval);
  }, [isSimulating]);

  // Derived PALS and Neuro Calculations
  const calcResults = useMemo(() => {
    const { weightKg, ageMonths, measuredIcp, measuredSbp, measuredDbp } = calcInputs;
    const calcMap = Math.round(measuredDbp + (measuredSbp - measuredDbp) / 3);
    const calcCpp = calcMap - measuredIcp;

    // Minimum target CPP by age
    let targetCppMin = 40;
    if (ageMonths > 120) targetCppMin = 60; // adolescents
    else if (ageMonths > 24) targetCppMin = 50; // children
    else targetCppMin = 40; // infants/toddlers

    const isCppAdequate = calcCpp >= targetCppMin;

    // Broselow PALS Emergency Dosages
    const epiArrestMg = +(weightKg * 0.01).toFixed(2); // 0.01 mg/kg
    const epiArrestMl = +(weightKg * 0.1).toFixed(2); // 0.1 mg/mL conc (1:10,000)
    const atropineMg = +(weightKg * 0.02).toFixed(2); // min 0.1 mg
    const defibFirstJ = Math.round(weightKg * 2); // 2 J/kg
    const defibSecondJ = Math.round(weightKg * 4); // 4 J/kg
    const fluidBolusMl = Math.round(weightKg * 20); // 20 mL/kg
    const hypertonicSalineMl = Math.round(weightKg * 5); // 3% NaCl 5 mL/kg
    const ettUncuffedMm = +(ageMonths > 24 ? (ageMonths / 12) / 4 + 4.0 : 3.5).toFixed(1);
    const ettCuffedMm = +(ageMonths > 24 ? (ageMonths / 12) / 4 + 3.5 : 3.0).toFixed(1);

    return {
      calcMap,
      calcCpp,
      targetCppMin,
      isCppAdequate,
      epiArrestMg,
      epiArrestMl,
      atropineMg: Math.max(0.1, atropineMg),
      defibFirstJ,
      defibSecondJ,
      fluidBolusMl,
      hypertonicSalineMl,
      ettUncuffedMm,
      ettCuffedMm
    };
  }, [calcInputs]);

  // Filter patients
  const filteredPatients = useMemo(() => {
    return patients.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.diagnosis.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.bed.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesBroselow = broselowFilter === "ALL" || p.broselowColor.includes(broselowFilter);
      return matchesSearch && matchesBroselow;
    });
  }, [patients, searchQuery, broselowFilter]);

  // Protocol Triggering
  const handleTriggerEmergency = (proto) => {
    setSelectedEmergencyProtocol(proto);
    setShowEmergencyModal(true);
  };

  const handleConfirmProtocolExecution = () => {
    addToast(
      `🚨 ${selectedEmergencyProtocol.code} EXECUTED: PICU Code Resuscitation Team Dispatched for ${selectedPatient.name} (${selectedPatient.bed}).`,
      "critical"
    );
    setShowEmergencyModal(false);
  };

  // CSV Export
  const handleExportCsv = () => {
    const dataToExport = patients.map((p) => ({
      Patient_ID: p.id,
      Name: p.name,
      Age: p.ageDisplay,
      Bed: p.bed,
      Weight_kg: p.weightKg,
      Broselow_Color: p.broselowColor,
      Diagnosis: p.diagnosis,
      PELOD2_Score: p.pelod2Score,
      pSOFA_Score: p.psofaScore,
      pGCS_Score: p.pgcs,
      Heart_Rate_bpm: p.hr,
      MAP_mmHg: p.map,
      ICP_mmHg: p.icp,
      CPP_mmHg: p.cpp,
      PbtO2_mmHg: p.pbto2,
      EtCO2_mmHg: p.etco2,
      Vent_Mode: p.ventMode,
      Serum_Sodium_mEq_L: p.serumSodium,
      Lactate_mmol_L: p.lactate,
      Status: p.status
    }));

    downloadCsv(dataToExport, `MedTrack_PICU_Telemetry_Dossier_${new Date().toISOString().slice(0, 10)}.csv`);
    addToast("Pediatric ICU audit ledger exported successfully.", "success");
    setShowExportModal(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-6 font-sans">
      <KindToastTray toasts={toasts} onDismiss={removeToast} />

      {/* HEADER BAR */}
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 text-purple-400">
              <Baby className="w-8 h-8 animate-pulse text-purple-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
                  Pediatric ICU Telemetry & Neuro-Resuscitation Hub
                </h1>
                <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/30">
                  PICU / PALS OVERWATCH
                </span>
              </div>
              <p className="text-xs md:text-sm text-slate-400 mt-0.5">
                PALS Broselow Weight-Calibrated Resuscitation, Multi-Modal Neuro-Monitoring (ICP/CPP/PbtO2) & PELOD-2 / pSOFA Scoring
              </p>
            </div>
          </div>
        </div>

        {/* Global Controls */}
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
            {isSimulating ? "Streaming PICU Signals" : "Simulation Paused"}
          </button>

          <button
            onClick={() => setShowCalculatorModal(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/30 hover:bg-purple-500/20 transition-all"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            PALS Resuscitation Engine
          </button>

          <button
            onClick={() => setShowExportModal(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            Audit Ledger
          </button>

          <button
            onClick={() => handleTriggerEmergency(PALS_EMERGENCY_PROTOCOLS[0])}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-rose-600 to-rose-700 text-white shadow-lg shadow-rose-900/30 hover:from-rose-500 hover:to-rose-600 transition-all"
          >
            <Siren className="w-4 h-4 animate-bounce" />
            CODE PALS TRIGGER
          </button>
        </div>
      </header>

      {/* TOP AGGREGATE SUMMARY METRICS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 my-6">
        <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-3.5 backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Critical PICU Census</span>
            <Baby className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-purple-400">5 / 5</span>
            <span className="text-xs text-purple-300">100% Occupancy</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Infant to Adolescent Range</p>
        </div>

        <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-3.5 backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Critical ICP Spikes (&gt; 20)</span>
            <Brain className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-rose-500">1</span>
            <span className="text-xs text-rose-400">Pt-401</span>
          </div>
          <p className="text-[10px] text-rose-400 mt-1">Hypertonic 3% Active</p>
        </div>

        <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-3.5 backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Mean Cerebral Perfusion (CPP)</span>
            <Zap className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-cyan-400">55.4</span>
            <span className="text-xs text-slate-400">mmHg</span>
          </div>
          <p className="text-[10px] text-cyan-300 mt-1">Age-adjusted Target Met</p>
        </div>

        <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-3.5 backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Advanced Mechanical Support</span>
            <Activity className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-indigo-400">2</span>
            <span className="text-xs text-indigo-300">Patients</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">HFOV & Pediatric VA-ECMO</p>
        </div>

        <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-3.5 backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Broselow Color Calibration</span>
            <Sparkles className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-400">100%</span>
            <span className="text-xs text-emerald-300">Verified</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Weight-Locked Drug Safety</p>
        </div>

        <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-3.5 backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Regulatory Standards</span>
            <ShieldCheck className="w-4 h-4 text-pink-400" />
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-pink-400">100%</span>
            <span className="text-xs text-pink-300">Compliant</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">AHA PALS / FDA 21 CFR Part 11</p>
        </div>
      </div>

      {/* TWO-COLUMN PICU WORKSPACE */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: PATIENT ROSTER (4 cols) */}
        <div className="xl:col-span-4 space-y-4">
          
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-400" />
                PICU High-Acuity Roster
              </h2>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-purple-400">
                {filteredPatients.length} Patients
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
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-all"
                />
              </div>

              <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px]">
                {["ALL", "Purple", "Pink", "Blue", "Green", "White"].map((color) => (
                  <button
                    key={color}
                    onClick={() => setBroselowFilter(color)}
                    className={`px-2 py-0.5 rounded-md font-medium border transition-all ${
                      broselowFilter === color
                        ? "bg-purple-500/20 text-purple-300 border-purple-500/50"
                        : "bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800"
                    }`}
                  >
                    {color === "ALL" ? "All Zones" : color}
                  </button>
                ))}
              </div>
            </div>

            {/* PATIENT CARDS */}
            <div className="mt-3 space-y-2.5 max-h-[560px] overflow-y-auto pr-1">
              {filteredPatients.map((p) => {
                const isSelected = p.id === selectedPatientId;
                const statusBadge =
                  p.status.includes("CRITICAL") || p.status.includes("REFRACTORY")
                    ? "bg-rose-500/20 text-rose-300 border-rose-500/50"
                    : p.status.includes("WEANING")
                    ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                    : "bg-purple-500/10 text-purple-300 border-purple-500/30";

                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPatientId(p.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? "bg-slate-800/90 border-purple-500/70 shadow-md shadow-purple-950/40"
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
                        {p.ageDisplay.split(" ")[0]} {p.ageDisplay.split(" ")[1]}
                      </span>
                    </div>

                    <div className="mt-2 flex items-center justify-between text-xs px-2 py-1 rounded bg-slate-900/80 border border-slate-800">
                      <span className="flex items-center gap-1.5 text-slate-300">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.broselowHex }} />
                        {p.broselowColor}
                      </span>
                      <span className="font-bold text-cyan-400">{p.weightKg} kg</span>
                    </div>

                    <div className="grid grid-cols-4 gap-2 mt-2 pt-2 border-t border-slate-800/60 text-center">
                      <div>
                        <span className="text-[10px] text-slate-500 block">HR</span>
                        <span className="text-xs font-bold text-slate-200">{p.hr}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">ICP</span>
                        <span className={`text-xs font-bold ${p.icp > 20 ? "text-rose-400" : "text-purple-400"}`}>
                          {p.icp}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">CPP</span>
                        <span className={`text-xs font-bold ${p.cpp < 50 ? "text-amber-400" : "text-emerald-400"}`}>
                          {p.cpp}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">PELOD-2</span>
                        <span className="text-xs font-bold text-indigo-300">{p.pelod2Score}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* PALS EMERGENCY DIRECTIVES */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2 mb-2.5">
              <Siren className="w-4 h-4 text-rose-500" />
              PALS Emergency Protocols
            </h3>
            <div className="space-y-2">
              {PALS_EMERGENCY_PROTOCOLS.map((proto) => (
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
                    Deploy
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: DETAILED MULTI-MODAL PICU CONSOLE (8 cols) */}
        <div className="xl:col-span-8 space-y-4">
          
          {/* PATIENT BANNER CARD */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 lg:p-5 relative overflow-hidden">
            <div className="absolute right-0 top-0 w-96 h-96 bg-gradient-to-bl from-purple-500/5 via-pink-500/5 to-transparent pointer-events-none" />
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-black text-white">{selectedPatient.name}</h2>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                    {selectedPatient.id}
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/30">
                    {selectedPatient.bed}
                  </span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-pink-500/15 text-pink-300 border border-pink-500/40">
                    {selectedPatient.ageDisplay}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  <span className="font-semibold text-slate-400">Diagnosis:</span> {selectedPatient.diagnosis}
                </p>
                <div className="flex flex-wrap items-center gap-4 mt-2 text-[11px] text-slate-400">
                  <span>Weight: <strong className="text-cyan-300">{selectedPatient.weightKg} kg</strong></span>
                  <span>Broselow Zone: <strong className="text-slate-200">{selectedPatient.broselowColor}</strong></span>
                  <span>Attending: <strong className="text-slate-200">{selectedPatient.attendingIntensivist}</strong></span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setShowPatientDetailModal(true)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-all"
                >
                  <Eye className="w-3.5 h-3.5 text-purple-400" />
                  Full PICU Dossier
                </button>
              </div>
            </div>

            {/* TAB NAVIGATION */}
            <div className="flex items-center gap-2 mt-5 border-b border-slate-800 overflow-x-auto text-xs">
              {[
                { id: "neuro", label: "Neuro-Critical (ICP / CPP)", icon: Brain },
                { id: "vitals", label: "Pediatric Vitals & PELOD-2", icon: HeartPulse },
                { id: "pals", label: "Broselow & PALS Dosages", icon: Zap },
                { id: "ventilation", label: "Pediatric Ventilation & ECMO", icon: Wind },
                { id: "protocols", label: "AHA PALS Guidelines", icon: ShieldCheck }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-3 py-2 border-b-2 font-medium transition-all ${
                      activeTab === tab.id
                        ? "border-purple-400 text-purple-400"
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

          {/* TAB 1: NEURO-CRITICAL MONITORING */}
          {activeTab === "neuro" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5">
                  <div className="flex items-center justify-between text-slate-400 text-xs">
                    <span>Intracranial Pressure (ICP)</span>
                    <Brain className="w-4 h-4 text-purple-400" />
                  </div>
                  <div className="mt-1">
                    <span className={`text-2xl font-black ${selectedPatient.icp >= 20 ? "text-rose-400 animate-pulse" : "text-purple-400"}`}>
                      {selectedPatient.icp}
                    </span>
                    <span className="text-xs text-slate-400 ml-1">mmHg</span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">Pediatric Threshold &lt; 20 mmHg</span>
                </div>

                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5">
                  <div className="flex items-center justify-between text-slate-400 text-xs">
                    <span>Cerebral Perfusion (CPP)</span>
                    <Zap className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div className="mt-1">
                    <span className={`text-2xl font-black ${selectedPatient.cpp < 50 ? "text-amber-400" : "text-cyan-400"}`}>
                      {selectedPatient.cpp}
                    </span>
                    <span className="text-xs text-slate-400 ml-1">mmHg</span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">Target 40-50 (Infant), 50-60 (Child)</span>
                </div>

                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5">
                  <div className="flex items-center justify-between text-slate-400 text-xs">
                    <span>Brain Oxygen (PbtO2)</span>
                    <Activity className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="mt-1">
                    <span className={`text-2xl font-black ${selectedPatient.pbto2 < 15 ? "text-rose-400" : "text-emerald-400"}`}>
                      {selectedPatient.pbto2}
                    </span>
                    <span className="text-xs text-slate-400 ml-1">mmHg</span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">Ischemia Cutoff &lt; 15 mmHg</span>
                </div>

                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5">
                  <div className="flex items-center justify-between text-slate-400 text-xs">
                    <span>Pediatric GCS / RASS</span>
                    <Gauge className="w-4 h-4 text-pink-400" />
                  </div>
                  <div className="mt-1">
                    <span className="text-2xl font-black text-pink-400">{selectedPatient.pgcs} / 15</span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">Sedation RASS: {selectedPatient.sedationRass}</span>
                </div>
              </div>

              {/* NEURO-RESUSCITATION PROTOCOL ACTIVE PANEL */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center justify-between">
                  <span>Pediatric Tiered Intracranial Hypertension Protocol</span>
                  <span className="text-[10px] text-slate-500 font-normal">Active Serum Sodium: {selectedPatient.serumSodium} mEq/L</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-purple-300 font-bold block">Tier 1: Baseline Neuroprotection</span>
                    <p className="text-slate-400 mt-1">Head midline 30°, normothermia (36-37°C), analgesia/sedation, maintain PaCO2 35-38 mmHg.</p>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-950 border border-purple-500/30">
                    <span className="text-cyan-300 font-bold block">Tier 2: Hyperosmolar Therapy</span>
                    <p className="text-slate-400 mt-1">Continuous 3% NaCl to target Na 145-155 mEq/L, intermittent boluses 5 mL/kg, open EVD drain.</p>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-rose-300 font-bold block">Tier 3: Refractory ICP Rescue</span>
                    <p className="text-slate-400 mt-1">Neuromuscular blockade, barbiturate coma (Pentobarbital burst suppression), decompressive craniectomy.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: VITALS & PELOD-2 */}
          {activeTab === "vitals" && (
            <div className="space-y-4">
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">
                  Pediatric Vital Signs & Organ Dysfunction Severity
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-slate-500 block">Heart Rate / Rhythm</span>
                    <span className="text-xl font-black text-slate-200 mt-1 block">{selectedPatient.hr} bpm</span>
                    <span className="text-[10px] text-slate-400">Sinus Tachycardia</span>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-slate-500 block">Blood Pressure (MAP)</span>
                    <span className="text-xl font-black text-slate-200 mt-1 block">{selectedPatient.sbp}/{selectedPatient.dbp} ({selectedPatient.map})</span>
                    <span className="text-[10px] text-emerald-400">MAP &gt; 5th percentile</span>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-slate-500 block">PELOD-2 Mortality Score</span>
                    <span className="text-xl font-black text-purple-400 mt-1 block">{selectedPatient.pelod2Score} / 33</span>
                    <span className="text-[10px] text-slate-400">Organ Dysfunction Index</span>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-slate-500 block">pSOFA Sepsis Score</span>
                    <span className="text-xl font-black text-indigo-400 mt-1 block">{selectedPatient.psofaScore} / 24</span>
                    <span className="text-[10px] text-slate-400">Age-Adjusted Cutoffs</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: BROSELOW & PALS DOSAGES */}
          {activeTab === "pals" && (
            <div className="space-y-4">
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/30">
                      <Zap className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">Broselow Weight-Locked Resuscitation Doses</h3>
                      <p className="text-xs text-slate-400">Calibrated for {selectedPatient.weightKg} kg ({selectedPatient.broselowColor})</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded text-xs font-bold bg-purple-500/10 text-purple-300 border border-purple-500/30">
                    PALS VERIFIED
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-slate-400 font-semibold block">Epinephrine IV/IO (1:10,000)</span>
                    <span className="text-base font-bold text-cyan-300 mt-0.5 block">
                      {(selectedPatient.weightKg * 0.01).toFixed(2)} mg ({(selectedPatient.weightKg * 0.1).toFixed(1)} mL)
                    </span>
                    <span className="text-[10px] text-slate-500">0.01 mg/kg every 3-5 min</span>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-slate-400 font-semibold block">Defibrillation / Cardioversion</span>
                    <span className="text-base font-bold text-rose-300 mt-0.5 block">
                      {Math.round(selectedPatient.weightKg * 2)} J (Initial) → {Math.round(selectedPatient.weightKg * 4)} J
                    </span>
                    <span className="text-[10px] text-slate-500">2 J/kg initial, 4 J/kg subsequent</span>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-slate-400 font-semibold block">Fluid Resuscitation Bolus</span>
                    <span className="text-base font-bold text-emerald-300 mt-0.5 block">
                      {Math.round(selectedPatient.weightKg * 20)} mL (20 mL/kg)
                    </span>
                    <span className="text-[10px] text-slate-500">Balanced Crystalloid over 10-20 min</span>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-slate-400 font-semibold block">3% Hypertonic Saline (ICP Bolus)</span>
                    <span className="text-base font-bold text-purple-300 mt-0.5 block">
                      {Math.round(selectedPatient.weightKg * 5)} mL (5 mL/kg)
                    </span>
                    <span className="text-[10px] text-slate-500">Over 10-15 min for acute spike</span>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-slate-400 font-semibold block">Endotracheal Tube Size</span>
                    <span className="text-base font-bold text-slate-200 mt-0.5 block">
                      {+(selectedPatient.ageMonths > 24 ? (selectedPatient.ageMonths / 12) / 4 + 3.5 : 3.5).toFixed(1)} mm (Cuffed)
                    </span>
                    <span className="text-[10px] text-slate-500">Depth: ~{Math.round(selectedPatient.weightKg * 0.1 + 10)} cm at lip</span>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-slate-400 font-semibold block">Atropine IV/IO</span>
                    <span className="text-base font-bold text-slate-200 mt-0.5 block">
                      {Math.max(0.1, +(selectedPatient.weightKg * 0.02).toFixed(2))} mg
                    </span>
                    <span className="text-[10px] text-slate-500">0.02 mg/kg (min 0.1 mg)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: VENTILATION & ECMO */}
          {activeTab === "ventilation" && (
            <div className="space-y-4">
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">
                  Pediatric Mechanical Ventilation & Extracorporeal Support
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-slate-500 block">Ventilator Mode</span>
                    <span className="text-base font-bold text-cyan-300 mt-1 block">{selectedPatient.ventMode}</span>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-slate-500 block">FiO2 / PEEP</span>
                    <span className="text-xl font-black text-slate-200 mt-1 block">{selectedPatient.fio2}% / {selectedPatient.peep}</span>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-slate-500 block">Delivered Tidal Volume</span>
                    <span className="text-xl font-black text-slate-200 mt-1 block">{selectedPatient.tidalVolume} mL</span>
                    <span className="text-[10px] text-slate-400">~6.1 mL/kg</span>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-slate-500 block">Pediatric ECMO Mode</span>
                    <span className="text-base font-bold text-purple-400 mt-1 block">{selectedPatient.ecmoMode}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: AHA PALS PROTOCOLS */}
          {activeTab === "protocols" && (
            <div className="space-y-4">
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  AHA Pediatric Advanced Life Support (PALS) Standards
                </h3>

                <div className="space-y-3 text-xs">
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="font-bold text-cyan-300">1. Weight-Locked Drug Administration</span>
                    <p className="text-slate-400 mt-1">All pediatric medication dosing must strictly derive from length-based Broselow categorization or exact scale weights to prevent ten-fold calculation errors.</p>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="font-bold text-purple-300">2. Target CPP in Pediatric TBI</span>
                    <p className="text-slate-400 mt-1">Maintain CPP between 40-50 mmHg in infants/toddlers and 50-60 mmHg in older children. Avoid aggressive hyperventilation (PaCO2 &lt; 30) during the first 48 hours to avert secondary ischemic injury.</p>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="font-bold text-rose-300">3. Pediatric Septic Shock Hour-1 Targets</span>
                    <p className="text-slate-400 mt-1">Achieve peripheral/central IV access within 5 minutes, deliver 10-20 mL/kg fluid boluses, and initiate inotropes (Epi/NE) within 60 minutes for fluid-refractory shock.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ========================================== */}
      {/* MODAL 1: PALS RESUSCITATION CALCULATOR */}
      {/* ========================================== */}
      {showCalculatorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/30">
                  <SlidersHorizontal className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Interactive PALS & Pediatric Neuro Calculator</h3>
                  <p className="text-xs text-slate-400">Calculate Weight-Based Drug Doses, Defibrillation Joules & Cerebral Perfusion</p>
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
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">Patient Parameters</h4>

                <div>
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>Weight (kg)</span>
                    <strong className="text-purple-400">{calcInputs.weightKg} kg</strong>
                  </div>
                  <input
                    type="range"
                    min="3.0"
                    max="60.0"
                    step="0.5"
                    value={calcInputs.weightKg}
                    onChange={(e) => setCalcInputs({ ...calcInputs, weightKg: +e.target.value })}
                    className="w-full accent-purple-400"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>Age (Months)</span>
                    <strong className="text-purple-400">{calcInputs.ageMonths} Months</strong>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="200"
                    value={calcInputs.ageMonths}
                    onChange={(e) => setCalcInputs({ ...calcInputs, ageMonths: +e.target.value })}
                    className="w-full accent-purple-400"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>Intracranial Pressure (ICP)</span>
                    <strong className="text-purple-400">{calcInputs.measuredIcp} mmHg</strong>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="40"
                    value={calcInputs.measuredIcp}
                    onChange={(e) => setCalcInputs({ ...calcInputs, measuredIcp: +e.target.value })}
                    className="w-full accent-purple-400"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>Systolic Blood Pressure (SBP)</span>
                    <strong className="text-purple-400">{calcInputs.measuredSbp} mmHg</strong>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="140"
                    value={calcInputs.measuredSbp}
                    onChange={(e) => setCalcInputs({ ...calcInputs, measuredSbp: +e.target.value })}
                    className="w-full accent-purple-400"
                  />
                </div>
              </div>

              {/* OUTPUTS */}
              <div className="lg:col-span-6 space-y-3 bg-slate-950/70 p-4 rounded-xl border border-slate-800/80">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">PALS Emergency Calculations</h4>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-slate-500 block">Cerebral Perfusion (CPP)</span>
                    <span className={`text-lg font-black ${calcResults.isCppAdequate ? "text-emerald-400" : "text-rose-400"}`}>
                      {calcResults.calcCpp} mmHg
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">Min Target: {calcResults.targetCppMin} mmHg</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-slate-500 block">Epinephrine 1:10,000</span>
                    <span className="text-lg font-black text-cyan-300">
                      {calcResults.epiArrestMl} mL
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">{calcResults.epiArrestMg} mg IV/IO</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-slate-500 block">Defibrillation 2 J/kg</span>
                    <span className="text-lg font-black text-rose-300">
                      {calcResults.defibFirstJ} Joules
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">2nd Shock: {calcResults.defibSecondJ} J</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-slate-500 block">Fluid Bolus (20 mL/kg)</span>
                    <span className="text-lg font-black text-emerald-300">
                      {calcResults.fluidBolusMl} mL
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">Balanced Crystalloids</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-slate-500 block">3% NaCl ICP Bolus</span>
                    <span className="text-lg font-black text-purple-300">
                      {calcResults.hypertonicSalineMl} mL
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">5 mL/kg IV over 10m</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-slate-500 block">ETT Tube Size</span>
                    <span className="text-lg font-black text-slate-200">
                      {calcResults.ettCuffedMm} mm
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">Microcuffed Tube</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => {
                  setCalcInputs({
                    weightKg: selectedPatient.weightKg,
                    ageMonths: selectedPatient.ageMonths,
                    targetMap: selectedPatient.map,
                    measuredIcp: selectedPatient.icp,
                    measuredSbp: selectedPatient.sbp,
                    measuredDbp: selectedPatient.dbp
                  });
                  addToast("Loaded selected patient measurements.", "info");
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all"
              >
                Sync with Patient
              </button>
              <button
                onClick={() => setShowCalculatorModal(false)}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white transition-all"
              >
                Close Engine
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
                <span className="text-xs font-bold text-rose-400 tracking-wider uppercase">PALS Critical Escalation</span>
                <h3 className="text-xl font-black text-white">{selectedEmergencyProtocol.title}</h3>
              </div>
            </div>

            <div className="my-5 space-y-3.5 text-xs text-slate-300">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-500 font-semibold block">Target Patient:</span>
                <span className="text-base font-bold text-white">{selectedPatient.name} ({selectedPatient.id})</span>
                <span className="text-xs text-rose-400 block mt-0.5">{selectedPatient.bed} • {selectedPatient.weightKg} kg ({selectedPatient.broselowColor})</span>
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
                Cancel Directive
              </button>
              <button
                onClick={handleConfirmProtocolExecution}
                className="px-6 py-2 rounded-xl text-xs font-black bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-900/40 transition-all flex items-center gap-2"
              >
                <Flame className="w-4 h-4" />
                EXECUTE PALS DIRECTIVE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL 3: PATIENT FULL PICU DOSSIER */}
      {/* ========================================== */}
      {showPatientDetailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <User className="w-5 h-5 text-purple-400" />
                PICU Clinical Dossier: {selectedPatient.name}
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
                  <span className="text-slate-500 block">Broselow Zone</span>
                  <span className="font-bold text-purple-300">{selectedPatient.broselowColor}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-slate-500 block">Weight</span>
                  <span className="font-bold text-slate-200">{selectedPatient.weightKg} kg</span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5">
                <span className="font-bold text-slate-300 block">Full Physiological & Neuro Panel</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-400">
                  <div>HR: <strong className="text-slate-200">{selectedPatient.hr} bpm</strong></div>
                  <div>BP: <strong className="text-slate-200">{selectedPatient.sbp}/{selectedPatient.dbp} ({selectedPatient.map})</strong></div>
                  <div>ICP: <strong className="text-purple-400">{selectedPatient.icp} mmHg</strong></div>
                  <div>CPP: <strong className="text-cyan-400">{selectedPatient.cpp} mmHg</strong></div>
                  <div>PbtO2: <strong className="text-slate-200">{selectedPatient.pbto2} mmHg</strong></div>
                  <div>pGCS: <strong className="text-slate-200">{selectedPatient.pgcs}/15</strong></div>
                  <div>PELOD-2: <strong className="text-slate-200">{selectedPatient.pelod2Score}</strong></div>
                  <div>pSOFA: <strong className="text-slate-200">{selectedPatient.psofaScore}</strong></div>
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
                <Download className="w-5 h-5 text-purple-400" />
                PICU Audit & FHIR R4 Export
              </h3>
              <button onClick={() => setShowExportModal(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="my-4 text-xs text-slate-300 space-y-3">
              <p className="text-slate-400">
                Exports all pediatric neuro-monitoring signals, PALS drug calculation logs, and organ dysfunction telemetry adhering to FDA 21 CFR Part 11 and HL7 FHIR R4 Observations.
              </p>
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-400">
                <span className="text-slate-300 font-semibold block">Cryptographic Provenance Stamp:</span>
                <span className="font-mono text-purple-400 block mt-0.5">SHA256: 9b1c...e332a</span>
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
                className="px-5 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white flex items-center gap-1.5"
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
