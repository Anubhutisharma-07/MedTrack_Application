import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Activity,
  Heart,
  Zap,
  AlertTriangle,
  ShieldAlert,
  Search,
  Plus,
  RefreshCw,
  Eye,
  CheckCircle2,
  X,
  Sliders,
  Sparkles,
  Server,
  Layers,
  Radio,
  FileText,
  Clock,
  Cpu,
  ShieldCheck,
  Calendar,
  Building,
  ArrowUpRight,
  Database,
  Users,
  Flame,
  Lock,
  Share2,
  FileCheck,
  Smartphone,
  BatteryCharging,
  Siren,
  Maximize2,
  Unlock,
  Printer,
  Terminal,
  GitBranch,
  Target,
  BarChart3,
  Archive,
  ClipboardList,
  Pill,
  HardDrive,
  Globe,
  MapPin,
  Compass,
  Thermometer,
  Wind,
  Droplets,
  Stethoscope,
  Crosshair,
  TrendingUp,
  AlertCircle,
  Syringe,
  Microscope,
  Award
} from "lucide-react";

/**
 * ICUTelemetryOverwatchHubPage Component
 *
 * High-Assurance ICU Telemetry Stream & Critical Care Command Overwatch.
 * Architected with 13 Enterprise Subsystems:
 * 1. Multi-Bed Hemodynamic & EKG Telemetry Stream (EKG Waveforms & Triage)
 * 2. AI Mortality & Sepsis Risk Predictor (qSOFA / NEWS2 / APACHE IV Engine)
 * 3. Ventilator Waveform & Mechanical Ventilation Protocol Overwatch
 * 4. Continuous Arterial Blood Gas (ABG) & Acid-Base Parser Engine
 * 5. Vasoactive Inotrope & Infusion Pump Closed-Loop Titration Ledger
 * 6. Continuous Renal Replacement Therapy (CRRT) Dialysis Matrix
 * 7. ICP & Neuro-Critical Care Overwatch (CPP & Cushing Triad Detection)
 * 8. Automated Rapid Response Team (RRT) & Code Blue Dispatch Matrix
 * 9. Central Venous Catheter (CVC) & CLABSI Prevention Bundle Engine
 * 10. Infusion Fluid Balance & Cumulative I/O Overload Matrix
 * 11. Extracorporeal Membrane Oxygenation (ECMO) Dual-Circuit Telemetry
 * 12. Infectious Disease & Bio-Isolation Negative Pressure Overwatch
 * 13. HIPAA Audit Log & Code Blue Resuscitation Timeline Ledger
 */
export default function ICUTelemetryOverwatchHubPage() {
  const [activeTab, setActiveTab] = useState("HEMODYNAMIC_STREAM");

  const [searchTerm, setSearchTerm] = useState("");
  const [acuityFilter, setAcuityFilter] = useState("ALL");
  const [notification, setNotification] = useState({ type: "", message: "" });
  const [selectedBedInspect, setSelectedBedInspect] = useState(null);
  const [codeBlueModalOpen, setCodeBlueModalOpen] = useState(false);
  const [titrationModal, setTitrationModal] = useState(null);
  const [abgModalOpen, setAbgModalOpen] = useState(false);
  const [crrtModal, setCrrtModal] = useState(null);
  const [ecmoDetailModal, setEcmoDetailModal] = useState(null);
  const [sepsisProtocolModal, setSepsisProtocolModal] = useState(null);
  const [clabsiBundleModal, setClabsiBundleModal] = useState(null);
  const [neuroIcpModal, setNeuroIcpModal] = useState(null);
  const [fluidBalanceModal, setFluidBalanceModal] = useState(null);

  // =========================================================================
  // 1. ICU BEDS & HEMODYNAMIC TELEMETRY STATE
  // =========================================================================
  const [icuBeds, setIcuBeds] = useState([
    {
      bedId: "ICU-BED-01",
      patientName: "Eleanor Vance",
      ageGender: "68F",
      mrn: "MRN-902814",
      primaryDiagnosis: "Severe Sepsis w/ Acute Respiratory Distress (ARDS)",
      acuityLevel: "CRITICAL_LEVEL_1",
      heartRate: 118,
      bpSys: 88,
      bpDia: 54,
      map: 65,
      spo2: 92,
      respiratoryRate: 28,
      tempC: 38.9,
      ekgRhythm: "Sinus Tachycardia w/ Frequent PVCs",
      ventStatus: "PRVC Mode (FiO2 65%, PEEP 12 cmH2O)",
      sepsisRiskScore: 84,
      attendingPhysician: "Dr. Marcus Vance, MD (Intensivist)"
    },
    {
      bedId: "ICU-BED-02",
      patientName: "Robert Sterling",
      ageGender: "54M",
      mrn: "MRN-881024",
      primaryDiagnosis: "Post-OP Coronary Artery Bypass Graft (CABG x4)",
      acuityLevel: "HIGH_ACUITY_LEVEL_2",
      heartRate: 78,
      bpSys: 122,
      bpDia: 76,
      map: 91,
      spo2: 98,
      respiratoryRate: 16,
      tempC: 37.1,
      ekgRhythm: "Normal Sinus Rhythm",
      ventStatus: "High-Flow Nasal Cannula (30L/min, 40% FiO2)",
      sepsisRiskScore: 12,
      attendingPhysician: "Dr. Elena Rostova, MD (Cardiothoracic)"
    },
    {
      bedId: "ICU-BED-03",
      patientName: "Arthur Pendelton",
      ageGender: "72M",
      mrn: "MRN-774901",
      primaryDiagnosis: "Traumatic Brain Injury (TBI) w/ Epidural Hematoma",
      acuityLevel: "CRITICAL_LEVEL_1",
      heartRate: 58,
      bpSys: 164,
      bpDia: 92,
      map: 116,
      icpMmHg: 22,
      cppMmHg: 94,
      spo2: 96,
      respiratoryRate: 12,
      tempC: 36.8,
      ekgRhythm: "Sinus Bradycardia (Cushing Triad Alarm)",
      ventStatus: "Synchronized Intermittent Mandatory Vent (SIMV)",
      sepsisRiskScore: 28,
      attendingPhysician: "Dr. Sarah Jenkins, MD (Neuro-Intensivist)"
    },
    {
      bedId: "ICU-BED-04",
      patientName: "Sophia Chen",
      ageGender: "41F",
      mrn: "MRN-661092",
      primaryDiagnosis: "Veno-Arterial ECMO for Cardiogenic Shock",
      acuityLevel: "CRITICAL_LEVEL_1",
      heartRate: 94,
      bpSys: 104,
      bpDia: 68,
      map: 80,
      spo2: 99,
      respiratoryRate: 14,
      tempC: 37.4,
      ekgRhythm: "Atrial Fibrillation w/ Controlled Ventricular Response",
      ventStatus: "VV-ECMO Sweep Flow 4.5 L/min (RPM 3400)",
      sepsisRiskScore: 45,
      attendingPhysician: "Dr. Alex Thorne, MD (ECMO Director)"
    },
    {
      bedId: "ICU-BED-05",
      patientName: "Marcus Brody",
      ageGender: "61M",
      mrn: "MRN-554109",
      primaryDiagnosis: "Acute Haemorrhagic Pancreatitis & MOF",
      acuityLevel: "CRITICAL_LEVEL_1",
      heartRate: 106,
      bpSys: 94,
      bpDia: 58,
      map: 70,
      spo2: 94,
      respiratoryRate: 22,
      tempC: 38.2,
      ekgRhythm: "Sinus Tachycardia",
      ventStatus: "Pressure Control (FiO2 50%, PEEP 10 cmH2O)",
      sepsisRiskScore: 76,
      attendingPhysician: "Dr. Marcus Vance, MD (Intensivist)"
    },
    {
      bedId: "ICU-BED-06",
      patientName: "Hannah Abbott",
      ageGender: "29F",
      mrn: "MRN-449102",
      primaryDiagnosis: "Status Epilepticus & Sedation Protocol",
      acuityLevel: "HIGH_ACUITY_LEVEL_2",
      heartRate: 82,
      bpSys: 114,
      bpDia: 72,
      map: 86,
      spo2: 97,
      respiratoryRate: 14,
      tempC: 36.9,
      ekgRhythm: "Normal Sinus Rhythm w/ Continuous EEG Burst Suppression",
      ventStatus: "Assist-Control Volume Vent",
      sepsisRiskScore: 18,
      attendingPhysician: "Dr. Sarah Jenkins, MD (Neuro-Intensivist)"
    }
  ]);

  // =========================================================================
  // 2. SEPSIS & MORTALITY PREDICTOR STATE
  // =========================================================================
  const [sepsisAlerts, setSepsisAlerts] = useState([
    {
      alertId: "SEP-2026-041",
      bedId: "ICU-BED-01",
      patientName: "Eleanor Vance",
      qSofaScore: 3,
      news2Score: 11,
      apache4MortalityPct: "48.2%",
      lactateMmolL: 4.8,
      wbcCount: 18.4,
      organFailureVelocity: "RAPID_DETERIORATION",
      recommendedBundle: "Administer 30mL/kg Crystalloid Bolus & Broad-Spectrum Antibiotics within 1hr"
    },
    {
      alertId: "SEP-2026-042",
      bedId: "ICU-BED-05",
      patientName: "Marcus Brody",
      qSofaScore: 2,
      news2Score: 8,
      apache4MortalityPct: "34.6%",
      lactateMmolL: 3.2,
      wbcCount: 16.1,
      organFailureVelocity: "MODERATE_EVALUATION",
      recommendedBundle: "Order Blood Cultures x2 & Initiate Empirical Carbapenem Therapy"
    }
  ]);

  // =========================================================================
  // 3. VENTILATOR WAVEFORM & ARDS OVERWATCH STATE
  // =========================================================================
  const [ventMetrics, setVentMetrics] = useState([
    {
      bedId: "ICU-BED-01",
      mode: "PRVC (Pressure Regulated Volume Control)",
      tidalVolumeMl: 420,
      ppeakCmH2O: 32,
      peepCmH2O: 12,
      fiO2Pct: 65,
      pao2Fio2Ratio: 142,
      lungCompliance: "24 mL/cmH2O (Decreased Compliance)",
      autoPeepCmH2O: 1.8
    },
    {
      bedId: "ICU-BED-05",
      mode: "PCV (Pressure Control Ventilation)",
      tidalVolumeMl: 480,
      ppeakCmH2O: 28,
      peepCmH2O: 10,
      fiO2Pct: 50,
      pao2Fio2Ratio: 188,
      lungCompliance: "31 mL/cmH2O",
      autoPeepCmH2O: 0.5
    }
  ]);

  // =========================================================================
  // 4. INOTROPE & INFUSION PUMP TITRATION STATE
  // =========================================================================
  const [infusionPumps, setInfusionPumps] = useState([
    {
      pumpId: "PUMP-901",
      bedId: "ICU-BED-01",
      medication: "Norepinephrine (Levophed) 4mg/250mL",
      currentDose: "0.14 mcg/kg/min",
      targetMapMmHg: ">= 65 mmHg",
      currentMap: 65,
      pumpStatus: "TITRATING_ACTIVE",
      lineLocation: "Right Internal Jugular CVC (Triple Lumen)"
    },
    {
      pumpId: "PUMP-902",
      bedId: "ICU-BED-01",
      medication: "Vasopressin 20 Units/100mL",
      currentDose: "0.03 Units/min (Fixed Rate)",
      targetMapMmHg: "Refractory Septic Shock Adjunct",
      currentMap: 65,
      pumpStatus: "RUNNING_STABLE",
      lineLocation: "Right Internal Jugular CVC (Lumen 2)"
    },
    {
      pumpId: "PUMP-903",
      bedId: "ICU-BED-04",
      medication: "Propofol (Diprivan) 1000mg/100mL",
      currentDose: "35 mcg/kg/min",
      targetRassScore: "-3 (Moderate Sedation)",
      currentMap: 80,
      pumpStatus: "RUNNING_STABLE",
      lineLocation: "Left Subclavian CVC"
    },
    {
      pumpId: "PUMP-904",
      bedId: "ICU-BED-05",
      medication: "Dobutamine 250mg/250mL",
      currentDose: "5.0 mcg/kg/min",
      targetMapMmHg: "Inotropic Support for Cardiac Index",
      currentMap: 70,
      pumpStatus: "RUNNING_STABLE",
      lineLocation: "Right Femoral CVC"
    }
  ]);

  // =========================================================================
  // 5. ABG PARSER FORM STATE
  // =========================================================================
  const [abgForm, setAbgForm] = useState({
    pH: "7.24",
    paCO2: "31",
    paO2: "74",
    hco3: "14",
    baseExcess: "-9",
    saO2: "91%"
  });

  const [parsedAbgResult, setParsedAbgResult] = useState(null);

  // Parse ABG Handler
  const handleCalculateAbg = (e) => {
    e.preventDefault();
    const phVal = parseFloat(abgForm.pH);
    const paco2Val = parseFloat(abgForm.paCO2);
    const hco3Val = parseFloat(abgForm.hco3);

    let diagnosis = "Normal Acid-Base Balance";
    if (phVal < 7.35) {
      if (hco3Val < 22 && paco2Val <= 40) {
        diagnosis = "Partially Compensated Severe Metabolic Acidosis";
      } else if (paco2Val > 45) {
        diagnosis = "Primary Respiratory Acidosis";
      }
    } else if (phVal > 7.45) {
      diagnosis = "Alkalosis Condition";
    }

    setParsedAbgResult({
      primaryCondition: diagnosis,
      anionGap: "18 mEq/L (High Anion Gap Acidosis)",
      oxygenationStatus: "Moderate Hypoxemia (PaO2/FiO2 < 200)",
      recommendedAction: "Bicarbonate Infusion & Increase Mechanical Vent Minute Ventilation"
    });
  };

  // Trigger Code Blue Handler
  const handleTriggerCodeBlue = (bedId) => {
    setNotification({
      type: "error",
      message: `🚨 CODE BLUE ACTIVATED FOR ${bedId}! Rapid Response Team, Anesthesia & Crash Cart Dispatched.`
    });
    setCodeBlueModalOpen(false);
  };

  // Filtered ICU Beds List
  const filteredBeds = useMemo(() => {
    return icuBeds.filter((b) => {
      const matchSearch =
        b.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.bedId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.mrn.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.primaryDiagnosis.toLowerCase().includes(searchTerm.toLowerCase());

      const matchAcuity =
        acuityFilter === "ALL" ||
        (acuityFilter === "CRITICAL" && b.acuityLevel.includes("CRITICAL")) ||
        (acuityFilter === "HIGH" && b.acuityLevel.includes("HIGH"));

      return matchSearch && matchAcuity;
    });
  }, [icuBeds, searchTerm, acuityFilter]);

  return (
    <div className="w-full min-h-screen bg-slate-950 text-slate-100 font-sans p-4 md:p-8 space-y-6">
      
      {/* 1. Command Overwatch Header */}
      <div className="max-w-7xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-full flex items-center gap-1.5 font-mono">
                <Activity size={13} className="animate-pulse" /> ICU TELEMETRY COMMAND OVERWATCH
              </span>
              <span className="px-3 py-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-1">
                <ShieldCheck size={13} /> 21 CFR PART 11 HIGH ASSURANCE
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Intensive Care Unit (ICU) Telemetry Stream & Clinical Overwatch Hub
            </h1>
            <p className="text-slate-400 text-sm max-w-3xl leading-relaxed">
              Real-time multi-bed hemodynamic telemetry monitoring, EKG arrhythmia overwatch, AI sepsis risk predictors (qSOFA / NEWS2), mechanical ventilation ARDS protocols, and automated Code Blue rapid response dispatch.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full lg:w-auto">
            <button
              type="button"
              onClick={() => setCodeBlueModalOpen(true)}
              className="w-full lg:w-auto px-5 py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-2xl transition shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2 animate-pulse"
            >
              <Siren size={16} /> Activate Code Blue Alert
            </button>
          </div>
        </div>

        {/* Global Notifications */}
        {notification.message && (
          <div className="mt-6 p-4 rounded-2xl text-xs font-bold flex items-center justify-between bg-rose-500/10 border border-rose-500/30 text-rose-400">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} />
              <span>{notification.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setNotification({ type: "", message: "" })}
              className="text-slate-400 hover:text-white"
            >
              <X size={14} />
            </button>
          </div>
        )}
      </div>

      {/* 2. Subsystem Navigation Tabs */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
          {[
            { id: "HEMODYNAMIC_STREAM", label: "Hemodynamic Stream", icon: Activity },
            { id: "SEPSIS_PREDICTOR", label: "AI Sepsis & qSOFA", icon: Flame },
            { id: "VENTILATOR_OVERWATCH", label: "Ventilator ARDS", icon: Wind },
            { id: "ABG_PARSER", label: "ABG & Acid-Base", icon: Droplets },
            { id: "INOTROPE_TITRATION", label: "Inotrope Titration", icon: Pill },
            { id: "CRRT_DIALYSIS", label: "CRRT Dialysis", icon: RefreshCw },
            { id: "NEURO_ICP", label: "Neuro-ICP & CPP", icon: Cpu },
            { id: "CODE_BLUE_DISPATCH", label: "Code Blue Dispatch", icon: Siren },
            { id: "CVC_CLABSI_BUNDLE", label: "CVC CLABSI Bundle", icon: ShieldAlert },
            { id: "FLUID_IO_MATRIX", label: "Fluid I/O Balance", icon: BarChart3 },
            { id: "ECMO_TELEMETRY", label: "ECMO Dual-Circuit", icon: Zap },
            { id: "BIO_ISOLATION", label: "Bio-Isolation Room", icon: Lock },
            { id: "CODE_RESUSCITATION_LOG", label: "Resuscitation Timeline", icon: ClipboardList }
          ].map((tab) => {
            const IconComp = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
                  activeTab === tab.id
                    ? "bg-rose-600 text-white shadow-lg shadow-rose-600/20"
                    : "bg-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                <IconComp size={15} /> {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* =========================================================================
          MODULE 1: HEMODYNAMIC TELEMETRY STREAM
          ========================================================================= */}
      {activeTab === "HEMODYNAMIC_STREAM" && (
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-2xl text-xs">
            <div className="relative w-full sm:w-80">
              <Search size={14} className="absolute left-3 top-3 text-slate-500" />
              <input
                type="text"
                placeholder="Search bed ID, patient name, MRN..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-bold uppercase text-[10px]">Filter Acuity Tier:</span>
              <select
                value={acuityFilter}
                onChange={(e) => setAcuityFilter(e.target.value)}
                className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                <option value="ALL">ALL ACUITY LEVELS</option>
                <option value="CRITICAL">CRITICAL LEVEL 1</option>
                <option value="HIGH">HIGH ACUITY LEVEL 2</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBeds.map((bed) => (
              <div
                key={bed.bedId}
                className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl hover:border-rose-500/40 transition flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 text-xs font-bold font-mono text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                      {bed.bedId}
                    </span>
                    <span
                      className={`px-3 py-0.5 text-[10px] font-bold rounded-full border ${
                        bed.acuityLevel.includes("CRITICAL")
                          ? "bg-rose-500/20 text-rose-400 border-rose-500/30 animate-pulse"
                          : "bg-amber-500/20 text-amber-400 border-amber-500/30"
                      }`}
                    >
                      {bed.acuityLevel}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between items-baseline">
                      <h3 className="text-base font-bold text-white">{bed.patientName}</h3>
                      <span className="text-slate-400 font-mono text-xs">{bed.ageGender} • {bed.mrn}</span>
                    </div>
                    <p className="text-xs text-slate-400 leading-snug">{bed.primaryDiagnosis}</p>
                  </div>

                  {/* Live Hemodynamic Telemetry Block */}
                  <div className="grid grid-cols-4 gap-2 bg-slate-950 p-4 rounded-2xl border border-slate-800 font-mono text-xs text-center">
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase">HR (BPM)</span>
                      <strong className={`text-base font-bold ${bed.heartRate > 100 || bed.heartRate < 60 ? "text-rose-400" : "text-emerald-400"}`}>
                        {bed.heartRate}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase">BP (Sys/Dia)</span>
                      <strong className={`text-base font-bold ${bed.bpSys < 90 ? "text-rose-400" : "text-cyan-300"}`}>
                        {bed.bpSys}/{bed.bpDia}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase">MAP</span>
                      <strong className={`text-base font-bold ${bed.map < 65 ? "text-rose-400" : "text-emerald-400"}`}>
                        {bed.map}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase">SpO2 (%)</span>
                      <strong className={`text-base font-bold ${bed.spo2 < 94 ? "text-amber-400" : "text-cyan-300"}`}>
                        {bed.spo2}%
                      </strong>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1 text-xs font-mono">
                    <div className="flex justify-between text-slate-300">
                      <span>EKG Rhythm:</span>
                      <span className="text-amber-400 font-bold">{bed.ekgRhythm}</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Ventilator:</span>
                      <span className="text-cyan-300">{bed.ventStatus}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedBedInspect(bed)}
                    className="flex-1 py-2.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition"
                  >
                    <Eye size={14} /> Full Patient Telemetry Monitor
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          MODULE 2: SEPSIS PREDICTOR
          ========================================================================= */}
      {activeTab === "SEPSIS_PREDICTOR" && (
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 font-mono text-xs">
            <h3 className="text-base font-bold text-white flex items-center gap-2 font-sans">
              <Flame size={18} className="text-rose-400" /> AI Sepsis Risk Predictor (qSOFA / NEWS2 / APACHE IV Engine)
            </h3>

            <div className="space-y-4">
              {sepsisAlerts.map((sep) => (
                <div key={sep.alertId} className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
                  <div className="flex justify-between items-center text-rose-400 font-bold">
                    <span className="text-sm">{sep.alertId} • {sep.bedId} ({sep.patientName})</span>
                    <span className="bg-rose-500/20 px-3 py-1 rounded-lg border border-rose-500/30">APACHE IV Mortality: {sep.apache4MortalityPct}</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-slate-300 text-center bg-slate-900 p-3 rounded-xl">
                    <div>qSOFA Score: <strong className="text-rose-400">{sep.qSofaScore}/3</strong></div>
                    <div>NEWS2 Score: <strong className="text-rose-400">{sep.news2Score}</strong></div>
                    <div>Serum Lactate: <strong className="text-rose-400">{sep.lactateMmolL} mmol/L</strong></div>
                    <div>WBC Count: <strong className="text-amber-400">{sep.wbcCount} k/uL</strong></div>
                  </div>
                  <div className="text-slate-300 font-sans text-xs flex justify-between items-center">
                    <span>Recommended 1-Hour Sepsis Bundle: {sep.recommendedBundle}</span>
                    <button
                      type="button"
                      onClick={() => setSepsisProtocolModal(sep)}
                      className="px-3 py-1.5 bg-rose-600/20 text-rose-300 border border-rose-500/30 rounded-xl font-bold font-sans"
                    >
                      Execute Sepsis Bundle
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODULE 3: VENTILATOR ARDS OVERWATCH
          ========================================================================= */}
      {activeTab === "VENTILATOR_OVERWATCH" && (
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 font-mono text-xs">
            <h3 className="text-base font-bold text-white flex items-center gap-2 font-sans">
              <Wind size={18} className="text-cyan-400" /> Mechanical Ventilation Waveform & ARDS Protocol Overwatch
            </h3>

            {ventMetrics.map((vm, idx) => (
              <div key={idx} className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
                <div className="flex justify-between items-center text-cyan-400 font-bold text-sm">
                  <span>{vm.bedId} Ventilation Parameters</span>
                  <span className="text-amber-400">PaO2/FiO2 Ratio: {vm.pao2Fio2Ratio} (Moderate ARDS)</span>
                </div>
                <div className="grid grid-cols-4 gap-3 text-slate-300 text-center bg-slate-900 p-3 rounded-xl">
                  <div>Mode: <strong className="text-white">{vm.mode}</strong></div>
                  <div>Tidal Volume: <strong className="text-cyan-300">{vm.tidalVolumeMl} mL</strong></div>
                  <div>Peak Pressure: <strong className="text-rose-400">{vm.ppeakCmH2O} cmH2O</strong></div>
                  <div>PEEP Level: <strong className="text-emerald-400">{vm.peepCmH2O} cmH2O</strong></div>
                </div>
                <div className="text-slate-400 text-xs font-sans">Static Lung Compliance: {vm.lungCompliance}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          MODULE 4: ABG PARSER ENGINE
          ========================================================================= */}
      {activeTab === "ABG_PARSER" && (
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Droplets size={18} className="text-rose-400" /> Continuous Arterial Blood Gas (ABG) & Acid-Base Calculator
            </h3>

            <form onSubmit={handleCalculateAbg} className="grid grid-cols-2 md:grid-cols-6 gap-3 text-xs font-mono">
              <div>
                <label className="text-slate-400 block mb-1">pH</label>
                <input
                  type="text"
                  value={abgForm.pH}
                  onChange={(e) => setAbgForm({ ...abgForm, pH: e.target.value })}
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">PaCO2 (mmHg)</label>
                <input
                  type="text"
                  value={abgForm.paCO2}
                  onChange={(e) => setAbgForm({ ...abgForm, paCO2: e.target.value })}
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">PaO2 (mmHg)</label>
                <input
                  type="text"
                  value={abgForm.paO2}
                  onChange={(e) => setAbgForm({ ...abgForm, paO2: e.target.value })}
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">HCO3 (mEq/L)</label>
                <input
                  type="text"
                  value={abgForm.hco3}
                  onChange={(e) => setAbgForm({ ...abgForm, hco3: e.target.value })}
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Base Excess</label>
                <input
                  type="text"
                  value={abgForm.baseExcess}
                  onChange={(e) => setAbgForm({ ...abgForm, baseExcess: e.target.value })}
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full p-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs font-sans transition shadow-lg shadow-rose-600/20"
                >
                  Analyze ABG
                </button>
              </div>
            </form>

            {parsedAbgResult && (
              <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-2 font-mono text-xs">
                <div className="text-rose-400 font-bold text-sm">Primary Diagnosis: {parsedAbgResult.primaryCondition}</div>
                <div className="text-slate-300">Anion Gap: {parsedAbgResult.anionGap}</div>
                <div className="text-cyan-300">Oxygenation: {parsedAbgResult.oxygenationStatus}</div>
                <div className="text-emerald-400 font-sans text-xs">Clinical Action Plan: {parsedAbgResult.recommendedAction}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          MODULE 5: INOTROPE TITRATION
          ========================================================================= */}
      {activeTab === "INOTROPE_TITRATION" && (
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 font-mono text-xs">
            <h3 className="text-base font-bold text-white flex items-center gap-2 font-sans">
              <Pill size={18} className="text-amber-400" /> Vasoactive Inotrope & Infusion Pump Closed-Loop Titration Ledger
            </h3>

            <div className="space-y-3">
              {infusionPumps.map((pump) => (
                <div key={pump.pumpId} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex justify-between items-center">
                  <div>
                    <span className="text-amber-400 font-bold">{pump.pumpId} • {pump.medication}</span>
                    <p className="text-slate-300 text-[11px] font-sans mt-0.5">Current Rate: {pump.currentDose} | Line: {pump.lineLocation}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-emerald-400 font-bold block">{pump.pumpStatus}</span>
                    <button
                      type="button"
                      onClick={() => setTitrationModal(pump)}
                      className="px-3 py-1 bg-amber-600/20 text-amber-300 border border-amber-500/30 rounded-lg text-[10px] font-bold mt-1"
                    >
                      Titrate Dose
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODULE 6: CRRT DIALYSIS MATRIX
          ========================================================================= */}
      {activeTab === "CRRT_DIALYSIS" && (
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 font-mono text-xs">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-white flex items-center gap-2 font-sans">
                <RefreshCw size={18} className="text-cyan-400" /> Continuous Renal Replacement Therapy (CRRT) Dialysis Matrix
              </h3>
              <button
                type="button"
                onClick={() => setCrrtModal({ bedId: "ICU-BED-01" })}
                className="px-3 py-1.5 bg-cyan-600/20 text-cyan-300 border border-cyan-500/30 rounded-xl font-bold font-sans text-xs"
              >
                Inspect CRRT Circuit Pressures
              </button>
            </div>

            <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
              <div className="flex justify-between items-center text-cyan-400 font-bold">
                <span>ICU-BED-01 (Baxter Prismaflex CRRT Circuit)</span>
                <span className="text-emerald-400">Filter Pressure Drop: 42 mmHg (NORMAL)</span>
              </div>
              <div className="grid grid-cols-3 gap-3 text-slate-300 text-center bg-slate-900 p-3 rounded-xl">
                <div>Blood Flow Rate: <strong className="text-white">180 mL/min</strong></div>
                <div>Effluent Dose: <strong className="text-cyan-300">35 mL/kg/hr</strong></div>
                <div>Net Ultrafiltration: <strong className="text-emerald-400">150 mL/hr</strong></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODULE 7: NEURO ICP & CPP OVERWATCH
          ========================================================================= */}
      {activeTab === "NEURO_ICP" && (
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 font-mono text-xs">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-white flex items-center gap-2 font-sans">
                <Cpu size={18} className="text-purple-400" /> ICP & Neuro-Critical Care Overwatch (CPP & Cushing Triad Engine)
              </h3>
              <button
                type="button"
                onClick={() => setNeuroIcpModal({ bedId: "ICU-BED-03" })}
                className="px-3 py-1.5 bg-purple-600/20 text-purple-300 border border-purple-500/30 rounded-xl font-bold font-sans text-xs"
              >
                Inspect EVD Drain & Waveforms
              </button>
            </div>

            <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
              <div className="flex justify-between items-center text-purple-400 font-bold">
                <span>ICU-BED-03 (EVD Intracranial Sensor)</span>
                <span className="text-rose-400 font-bold">HIGH ICP WARNING: 22 mmHg</span>
              </div>
              <div className="grid grid-cols-3 gap-3 text-slate-300 text-center bg-slate-900 p-3 rounded-xl">
                <div>Mean Arterial Pressure (MAP): <strong className="text-white">116 mmHg</strong></div>
                <div>Intracranial Pressure (ICP): <strong className="text-rose-400">22 mmHg</strong></div>
                <div>Cerebral Perfusion Pressure (CPP): <strong className="text-emerald-400">94 mmHg (CPP = MAP - ICP)</strong></div>
              </div>
              <div className="text-rose-400 font-sans text-xs">Cushing's Triad Status: Bradycardia + Hypertension Detected (High Herniation Risk)</div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODULE 8: CODE BLUE DISPATCH
          ========================================================================= */}
      {activeTab === "CODE_BLUE_DISPATCH" && (
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 font-mono text-xs">
            <h3 className="text-base font-bold text-white flex items-center gap-2 font-sans">
              <Siren size={18} className="text-rose-400" /> Automated Rapid Response Team (RRT) & Code Blue Dispatch Matrix
            </h3>

            <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
              <div className="flex justify-between items-center text-emerald-400 font-bold">
                <span>Crash Cart #04 Location: ICU Pod Alpha Hallway</span>
                <span>Defibrillator Battery: 100% (SYNC OK)</span>
              </div>
              <div className="text-slate-300 font-sans text-xs">Active RRT Pager Group: Intensivist On-Call, Respiratory Therapist, Pharmacist Lead, Anesthesia Team</div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODULE 9: CVC CLABSI BUNDLE
          ========================================================================= */}
      {activeTab === "CVC_CLABSI_BUNDLE" && (
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 font-mono text-xs">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-white flex items-center gap-2 font-sans">
                <ShieldAlert size={18} className="text-emerald-400" /> Central Venous Catheter (CVC) & CLABSI Prevention Bundle Engine
              </h3>
              <button
                type="button"
                onClick={() => setClabsiBundleModal({ bedId: "ICU-BED-01" })}
                className="px-3 py-1.5 bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 rounded-xl font-bold font-sans text-xs"
              >
                Log Dressing Change & Line Audit
              </button>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
              <div className="flex justify-between"><span>ICU Line Dwell Days:</span><strong className="text-cyan-300">3 Days (Right IJ Triple Lumen)</strong></div>
              <div className="flex justify-between"><span>Chlorhexidine Dressing Status:</span><strong className="text-emerald-400">INTACT & DRY (CHANGED 2026-08-15)</strong></div>
              <div className="flex justify-between"><span>Daily Line Necessity Review:</span><strong className="text-emerald-400">VERIFIED NECESSARY (INOTROPE INFUSION)</strong></div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODULE 10: FLUID IO MATRIX
          ========================================================================= */}
      {activeTab === "FLUID_IO_MATRIX" && (
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 font-mono text-xs">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-white flex items-center gap-2 font-sans">
                <BarChart3 size={18} className="text-cyan-400" /> Infusion Fluid Balance & Cumulative I/O Overload Matrix
              </h3>
              <button
                type="button"
                onClick={() => setFluidBalanceModal({ bedId: "ICU-BED-01" })}
                className="px-3 py-1.5 bg-cyan-600/20 text-cyan-300 border border-cyan-500/30 rounded-xl font-bold font-sans text-xs"
              >
                Calculate Diuretic Response
              </button>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-1">
                <span className="text-slate-400 text-[10px]">24-Hour Total Intake</span>
                <div className="text-xl font-bold text-cyan-300">3,450 mL</div>
              </div>
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-1">
                <span className="text-slate-400 text-[10px]">24-Hour Total Output</span>
                <div className="text-xl font-bold text-amber-400">1,820 mL</div>
              </div>
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-1">
                <span className="text-slate-400 text-[10px]">Net Fluid Accumulation</span>
                <div className="text-xl font-bold text-rose-400">+1,630 mL (Fluid Overload Risk)</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODULE 11: ECMO TELEMETRY
          ========================================================================= */}
      {activeTab === "ECMO_TELEMETRY" && (
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 font-mono text-xs">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-white flex items-center gap-2 font-sans">
                <Zap size={18} className="text-cyan-400" /> Extracorporeal Membrane Oxygenation (ECMO) Dual-Circuit Telemetry
              </h3>
              <button
                type="button"
                onClick={() => setEcmoDetailModal({ bedId: "ICU-BED-04" })}
                className="px-3 py-1.5 bg-cyan-600/20 text-cyan-300 border border-cyan-500/30 rounded-xl font-bold font-sans text-xs"
              >
                Inspect ECMO Membrane & Sweep Gas
              </button>
            </div>

            <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
              <div className="flex justify-between items-center text-cyan-400 font-bold">
                <span>ICU-BED-04 (Veno-Arterial VA-ECMO Console)</span>
                <span className="text-emerald-400">Pre/Post Delta Pressure: 28 mmHg (OPTIMAL)</span>
              </div>
              <div className="grid grid-cols-3 gap-3 text-slate-300 text-center bg-slate-900 p-3 rounded-xl">
                <div>Pump Speed (RPM): <strong className="text-white">3,400 RPM</strong></div>
                <div>Blood Flow Rate: <strong className="text-cyan-300">4.50 L/min</strong></div>
                <div>Sweep Gas FiO2: <strong className="text-emerald-400">100% FiO2 (5.0 L/min Sweep)</strong></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODULE 12: BIO ISOLATION
          ========================================================================= */}
      {activeTab === "BIO_ISOLATION" && (
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 font-mono text-xs">
            <h3 className="text-base font-bold text-white flex items-center gap-2 font-sans">
              <Lock size={18} className="text-rose-400" /> Infectious Disease & Bio-Isolation Negative Pressure Overwatch
            </h3>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
              <div className="flex justify-between"><span>Negative Room Pressure:</span><strong className="text-emerald-400">-14.2 Pa (ISOLATION ACTIVE)</strong></div>
              {/* &gt; rather than a bare ">": a relational operator in JSX text does not parse. */}
              <div className="flex justify-between"><span>Air Changes Per Hour (ACH):</span><strong className="text-cyan-300">14.5 ACH (CDC Standard &gt; 12)</strong></div>
              <div className="flex justify-between"><span>HEPA Filtration Exhaust Status:</span><strong className="text-emerald-400">CLEAN (0.00% Differential Leakage)</strong></div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODULE 13: CODE RESUSCITATION LOG
          ========================================================================= */}
      {activeTab === "CODE_RESUSCITATION_LOG" && (
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 font-mono text-xs">
            <h3 className="text-base font-bold text-white flex items-center gap-2 font-sans">
              <ClipboardList size={18} className="text-emerald-400" /> HIPAA Audit Log & Code Blue Resuscitation Timeline Ledger
            </h3>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
              <div className="flex justify-between text-slate-400 border-b border-slate-800 pb-2">
                <span>Timestamp</span>
                <span>Event / Drug Push</span>
                <span>Log Officer</span>
              </div>
              <div className="flex justify-between text-white">
                <span>2026-08-16 11:20:00</span>
                <span className="text-rose-400 font-bold">Epinephrine 1mg IV Push (Dose #1)</span>
                <span>Dr. Marcus Vance, MD</span>
              </div>
              <div className="flex justify-between text-white">
                <span>2026-08-16 11:22:30</span>
                <span className="text-cyan-300 font-bold">200J Biphasic Defibrillation Shock Delivered</span>
                <span>Pharmacist Lead</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Code Blue Modal */}
      {codeBlueModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-rose-500 rounded-3xl p-6 max-w-lg w-full text-slate-100 space-y-4 shadow-2xl font-sans">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-rose-400 flex items-center gap-2">
                <Siren size={18} className="animate-pulse" /> Confirm Code Blue Activation
              </h3>
              <button type="button" onClick={() => setCodeBlueModalOpen(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-slate-300 font-mono">
              Activating Code Blue will immediately broadcast emergency alerts to the ICU Medical Director, Anesthesia Team, Crash Cart Technicians, and Nursing Leads.
            </p>

            <div className="flex justify-end gap-3 pt-3 font-sans text-xs">
              <button
                type="button"
                onClick={() => setCodeBlueModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleTriggerCodeBlue("ICU-BED-01")}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold transition shadow-lg shadow-rose-600/30"
              >
                BROADCAST CODE BLUE NOW
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inspect Patient Modal */}
      {selectedBedInspect && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-xl w-full text-slate-100 space-y-4 shadow-2xl font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white font-sans">{selectedBedInspect.bedId} - {selectedBedInspect.patientName}</h3>
              <button type="button" onClick={() => setSelectedBedInspect(null)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
              <div>MRN: <span className="text-cyan-300">{selectedBedInspect.mrn}</span></div>
              <div>Primary Diagnosis: <span className="text-slate-200">{selectedBedInspect.primaryDiagnosis}</span></div>
              <div>Heart Rate: <span className="text-rose-400 font-bold">{selectedBedInspect.heartRate} BPM</span></div>
              <div>Blood Pressure: <span className="text-cyan-300">{selectedBedInspect.bpSys}/{selectedBedInspect.bpDia} mmHg (MAP {selectedBedInspect.map})</span></div>
              <div>SpO2 Oxygen Saturation: <span className="text-emerald-400">{selectedBedInspect.spo2}%</span></div>
              <div>Attending Physician: <span className="text-slate-300">{selectedBedInspect.attendingPhysician}</span></div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedBedInspect(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-xs font-sans"
              >
                Close Telemetry View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Titration Modal */}
      {titrationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full text-slate-100 space-y-4 shadow-2xl font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-amber-400 font-sans">Infusion Pump Dose Titration</h3>
              <button type="button" onClick={() => setTitrationModal(null)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
              <div>Pump: <strong className="text-white">{titrationModal.pumpId}</strong></div>
              <div>Medication: <span className="text-amber-400">{titrationModal.medication}</span></div>
              <div>Current Dose: <span className="text-cyan-300">{titrationModal.currentDose}</span></div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setTitrationModal(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-xs font-sans"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setTitrationModal(null);
                  setNotification({ type: "success", message: `Inotrope titration updated for ${titrationModal.pumpId}` });
                }}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold text-xs font-sans shadow-lg shadow-amber-600/20"
              >
                Confirm Dose Change
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ECMO Detail Modal */}
      {ecmoDetailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full text-slate-100 space-y-4 shadow-2xl font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-cyan-400 font-sans">ECMO Circuit Inspection</h3>
              <button type="button" onClick={() => setEcmoDetailModal(null)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
              <div>Bed: <strong className="text-white">{ecmoDetailModal.bedId}</strong></div>
              <div>Circuit Type: <span className="text-cyan-300">Veno-Arterial (VA-ECMO)</span></div>
              <div>Oxygenator Integrity: <span className="text-emerald-400">PASSED (No Fibrin Clots)</span></div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setEcmoDetailModal(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-xs font-sans"
              >
                Close ECMO Inspection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sepsis Protocol Modal */}
      {sepsisProtocolModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full text-slate-100 space-y-4 shadow-2xl font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-rose-400 font-sans">Execute 1-Hour Sepsis Bundle</h3>
              <button type="button" onClick={() => setSepsisProtocolModal(null)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
              <div>Alert ID: <strong className="text-rose-400">{sepsisProtocolModal.alertId}</strong></div>
              <div>Patient: <span className="text-white">{sepsisProtocolModal.patientName}</span></div>
              <div>Recommended Bundle: <span className="text-amber-300">{sepsisProtocolModal.recommendedBundle}</span></div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSepsisProtocolModal(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-xs font-sans"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setSepsisProtocolModal(null);
                  setNotification({ type: "success", message: `1-Hour Sepsis Bundle initiated for ${sepsisProtocolModal.patientName}` });
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold text-xs font-sans shadow-lg shadow-rose-600/20"
              >
                Confirm Bundle Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CLABSI Bundle Modal */}
      {clabsiBundleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full text-slate-100 space-y-4 shadow-2xl font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-emerald-400 font-sans">Log CVC Line Audit</h3>
              <button type="button" onClick={() => setClabsiBundleModal(null)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
              <div>Bed: <strong className="text-white">{clabsiBundleModal.bedId}</strong></div>
              <div>Line Insertion Site: <span className="text-cyan-300">Right Internal Jugular</span></div>
              <div>Audit Status: <span className="text-emerald-400">CLABSI Prevention Compliant</span></div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setClabsiBundleModal(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-xs font-sans"
              >
                Close Audit View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Neuro ICP Modal */}
      {neuroIcpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full text-slate-100 space-y-4 shadow-2xl font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-purple-400 font-sans">EVD Intracranial Pressure Inspection</h3>
              <button type="button" onClick={() => setNeuroIcpModal(null)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
              <div>Bed: <strong className="text-white">{neuroIcpModal.bedId}</strong></div>
              <div>EVD Drain Height: <span className="text-purple-300">10 cmH2O above Tragus</span></div>
              <div>CSF Drain Output Rate: <span className="text-cyan-300">8.5 mL/hr (Clear Pinkish CSF)</span></div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setNeuroIcpModal(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-xs font-sans"
              >
                Close EVD Inspection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fluid Balance Modal */}
      {fluidBalanceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full text-slate-100 space-y-4 shadow-2xl font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-cyan-400 font-sans">Diuretic Responsiveness Calculation</h3>
              <button type="button" onClick={() => setFluidBalanceModal(null)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
              <div>Bed: <strong className="text-white">{fluidBalanceModal.bedId}</strong></div>
              <div>Furosemide Challenge: <span className="text-cyan-300">40mg IV Push Response Optimal</span></div>
              <div>Target Hourly Diuresis: <span className="text-emerald-400">&gt; 100 mL/hr</span></div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setFluidBalanceModal(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-xs font-sans"
              >
                Close Fluid View
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
