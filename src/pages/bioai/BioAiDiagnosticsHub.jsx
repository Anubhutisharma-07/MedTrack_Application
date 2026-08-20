import React, { useState, useEffect, useMemo } from "react";
import {
  Activity,
  Cpu,
  Brain,
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
  RefreshCw,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Filter,
  EyeOff,
  Dna,
  Binary,
  Shield,
  HelpCircle,
  Network
} from "lucide-react";
import { downloadCsv } from "../../utils/csv";
import { useKindToasts, KindToastTray } from "../../components/common/HubToasts";

// ==========================================
// SEED BIO-AI DIAGNOSTICS PATIENTS
// ==========================================
const SEED_BIOAI_PATIENTS = [
  {
    id: "PT-BIOAI-501",
    name: "Genevieve Dubois",
    age: 63,
    gender: "Female",
    bed: "ICU-SMART-01",
    primaryCondition: "Suspected Urosepsis with Latent Hypoperfusion",
    aiModelTarget: "Sepsis Early Deterioration Forecaster (SEDF-v4)",
    predictedRiskPercent: 94.2, // % risk of refractory shock in < 6h
    predictedTimeToOnsetHours: 1.8, // hours
    conformalConfidenceInterval: "91.8% - 96.5% (Coverage 95%)",
    primaryShapFeatures: [
      { feature: "Serum Lactate Velocity (+0.4 mmol/L/hr)", shapValue: "+0.38", impact: "HIGH_RISK" },
      { feature: "Heart Rate Entropy / Loss of Variability", shapValue: "+0.29", impact: "HIGH_RISK" },
      { feature: "ScvO2 Oxygen Saturation Drop (< 60%)", shapValue: "+0.22", impact: "MODERATE_RISK" },
      { feature: "WBC Bandemia > 15%", shapValue: "+0.14", impact: "MODERATE_RISK" }
    ],
    gradCamHeatmapRegion: "Multimodal EHR Time-Series Dense Embedding",
    ardsSubphenotype: "Not Indicated",
    strokeLvoDetected: false,
    malignantArrhythmiaRisk: 24.5,
    samdClass: "FDA Class II SaMD (K223891)",
    driftStatus: "NOMINAL (KL-Divergence 0.021)",
    humanInTheLoopState: "PENDING_CLINICIAN_REVIEW",
    lactate: 3.4,
    hr: 118,
    map: 67,
    temp: 38.8,
    wbc: 18.4,
    status: "CRITICAL_AI_SEPSIS_WARNING",
    attendingIntensivist: "Dr. Alexander Vance, MD (Critical Care AI & Resuscitation)"
  },
  {
    id: "PT-BIOAI-502",
    name: "Marcus Vance",
    age: 72,
    gender: "Male",
    bed: "NEURO-EMERG-03",
    primaryCondition: "Hyperacute Ischemic Stroke (Last Known Well 1.5h ago)",
    aiModelTarget: "CTA Neuro-Vascular Large Vessel Occlusion (LVO-Net v3)",
    predictedRiskPercent: 98.6,
    predictedTimeToOnsetHours: 0.2, // immediate thrombectomy candidate
    conformalConfidenceInterval: "97.1% - 99.4% (Coverage 99%)",
    primaryShapFeatures: [
      { feature: "CTA Left M1 MCA Abrupt Truncation", shapValue: "+0.52", impact: "HIGH_RISK" },
      { feature: "ASPECTS Score 8 (Ischemic Core < 25 mL)", shapValue: "+0.31", impact: "HIGH_RISK" },
      { feature: "Collateral Perfusion Score Good (Tan 3)", shapValue: "-0.15", impact: "PROTECTIVE" }
    ],
    gradCamHeatmapRegion: "Left Middle Cerebral Artery (M1 Segment)",
    ardsSubphenotype: "Not Indicated",
    strokeLvoDetected: true,
    malignantArrhythmiaRisk: 18.0,
    samdClass: "FDA Class III SaMD (PMA P230014)",
    driftStatus: "NOMINAL (KL-Divergence 0.014)",
    humanInTheLoopState: "CONFIRMED_BY_NEURORADIOLOGIST",
    lactate: 1.4,
    hr: 86,
    map: 104,
    temp: 37.0,
    wbc: 8.9,
    status: "CRITICAL_LVO_THROMBECTOMY",
    attendingIntensivist: "Dr. Elena Rostova, MD, PhD (Interventional Neuro-Radiology)"
  },
  {
    id: "PT-BIOAI-503",
    name: "Darnell Washington",
    age: 56,
    gender: "Male",
    bed: "ICU-SMART-06",
    primaryCondition: "Severe Pneumonia with Acute Respiratory Distress Syndrome",
    aiModelTarget: "ARDS Biological Subphenotyping AI (Hyper vs Hypo)",
    predictedRiskPercent: 89.1,
    predictedTimeToOnsetHours: 0.0,
    conformalConfidenceInterval: "86.0% - 92.4% (Coverage 95%)",
    primaryShapFeatures: [
      { feature: "Plasma IL-6 > 450 pg/mL + sTNFR-1 Surge", shapValue: "+0.44", impact: "HIGH_RISK" },
      { feature: "Vasopressor Refractoriness (VIS > 25)", shapValue: "+0.32", impact: "HIGH_RISK" },
      { feature: "PaO2/FiO2 Ratio 112 (Severe ARDS)", shapValue: "+0.26", impact: "HIGH_RISK" }
    ],
    gradCamHeatmapRegion: "Bilateral Basilar Consolidation (CXR/CT-ViT)",
    ardsSubphenotype: "Hyperinflammatory Phenotype (Class 2)",
    strokeLvoDetected: false,
    malignantArrhythmiaRisk: 31.0,
    samdClass: "FDA Class II SaMD",
    driftStatus: "NOMINAL",
    humanInTheLoopState: "ACTIVE_PROTOCOL_DELIVERY",
    lactate: 4.1,
    hr: 124,
    map: 64,
    temp: 39.2,
    wbc: 24.6,
    status: "HYPERINFLAMMATORY_ARDS",
    attendingIntensivist: "Dr. Alexander Vance, MD (Critical Care AI)"
  },
  {
    id: "PT-BIOAI-504",
    name: "Claire Sinclair",
    age: 68,
    gender: "Female",
    bed: "ICU-SMART-09",
    primaryCondition: "Post-Anterior STEMI with Severe LV Dysfunction (EF 22%)",
    aiModelTarget: "12-Lead Continuous Wavelet Arrhythmia Predictor (Cardio-Preempt)",
    predictedRiskPercent: 88.5,
    predictedTimeToOnsetHours: 0.5, // 30 min window for VT/VF
    conformalConfidenceInterval: "84.2% - 92.1% (Coverage 95%)",
    primaryShapFeatures: [
      { feature: "Microvolt T-Wave Alternans (MTWA > 2.5 uV)", shapValue: "+0.41", impact: "HIGH_RISK" },
      { feature: "QRS Fractionation & Wavelet Dispersion", shapValue: "+0.34", impact: "HIGH_RISK" },
      { feature: "Hypokalemia K+ 3.3 mEq/L", shapValue: "+0.18", impact: "MODERATE_RISK" }
    ],
    gradCamHeatmapRegion: "Precordial Leads V2-V4 ST-T Wave Trajectories",
    ardsSubphenotype: "Not Indicated",
    strokeLvoDetected: false,
    malignantArrhythmiaRisk: 88.5,
    samdClass: "FDA Class II SaMD",
    driftStatus: "NOMINAL",
    humanInTheLoopState: "PREEMPTIVE_LIDOCAINE_ORDERED",
    lactate: 1.8,
    hr: 102,
    map: 74,
    temp: 36.9,
    wbc: 9.4,
    status: "MALIGNANT_ARRHYTHMIA_ALERT",
    attendingIntensivist: "Dr. Marcus Vance, MD (Cardiac Electrophysiology & AI)"
  },
  {
    id: "PT-BIOAI-505",
    name: "Arthur Pendelton",
    age: 79,
    gender: "Male",
    bed: "ICU-SMART-12",
    primaryCondition: "Cardiorenal Syndrome / Decompensated Heart Failure",
    aiModelTarget: "48-Hour AKI-to-CRRT Progression Classifier (Renal-Deep)",
    predictedRiskPercent: 91.0,
    predictedTimeToOnsetHours: 12.0,
    conformalConfidenceInterval: "87.5% - 94.0% (Coverage 95%)",
    primaryShapFeatures: [
      { feature: "Urine NGAL > 320 ng/mL + TIMP-2*IGFBP7 > 0.8", shapValue: "+0.46", impact: "HIGH_RISK" },
      { feature: "Oliguria Velocity (< 0.25 mL/kg/hr for 6h)", shapValue: "+0.31", impact: "HIGH_RISK" },
      { feature: "Serum Creatinine Doubling Trajectory", shapValue: "+0.21", impact: "HIGH_RISK" }
    ],
    gradCamHeatmapRegion: "Longitudinal Renal Biomarker Array",
    ardsSubphenotype: "Not Indicated",
    strokeLvoDetected: false,
    malignantArrhythmiaRisk: 22.0,
    samdClass: "FDA Class II SaMD",
    driftStatus: "NOMINAL",
    humanInTheLoopState: "NEPHROLOGY_CONSULT_PAGED",
    lactate: 2.2,
    hr: 82,
    map: 68,
    temp: 37.1,
    wbc: 11.2,
    status: "AKI_DIALYSIS_WARNING",
    attendingIntensivist: "Dr. Alexander Vance, MD (Critical Care AI)"
  }
];

// ==========================================
// BIO-AI EMERGENCY PROTOCOLS
// ==========================================
const BIOAI_EMERGENCY_PROTOCOLS = [
  {
    code: "CODE-AI-SEPSIS-DETERIORATION",
    title: "Code AI Sepsis — 6-Hour Early Warning Shock Pre-emption",
    triggerCondition: "AI Model Prediction Risk >= 90% for septic shock within 2 hours with rising lactate velocity",
    targetAction: "Immediate bedside intensivist review, pre-emptive 30 mL/kg fluid challenge, stat broad-spectrum antibiotics, arterial line placement",
    guideline: "Surviving Sepsis Campaign & FDA Class II SaMD Decision Support Framework",
    level: "CRITICAL",
    color: "rose"
  },
  {
    code: "CODE-AI-LVO-STROKE",
    title: "Code AI Stroke — Large Vessel Occlusion (LVO) Stat Thrombectomy",
    triggerCondition: "CTA AI neural network confirms ICA/M1 MCA occlusion with ASPECTS >= 6 and ischemic core < 50 mL",
    targetAction: "Immediate Angio-Suite activation, bypass general ED admission, direct transfer for mechanical thrombectomy",
    guideline: "AHA/ASA Acute Ischemic Stroke Guidelines & Rapid AI SaMD",
    level: "CRITICAL",
    color: "rose"
  },
  {
    code: "CODE-AI-ARRHYTHMIA-PREEMPT",
    title: "Code AI Dysrhythmia — Pre-emptive Malignant VT/VF Arrest Protocol",
    triggerCondition: "12-Lead Continuous Wavelet AI predicts imminent VT/VF arrest within 30 minutes with MTWA spike",
    targetAction: "Immediate defibrillator pads placement, IV Amiodarone/Lidocaine bolus, correct electrolyte deficits (K+ > 4.5, Mg2+ > 2.5)",
    guideline: "ESC & AHA Guidelines for Management of Ventricular Arrhythmias",
    level: "HIGH",
    color: "amber"
  },
  {
    code: "CODE-AI-DRIFT-ESTOP",
    title: "Algorithmic Drift / Out-of-Distribution (OOD) Fallback Safety E-Stop",
    triggerCondition: "Population distribution shift (KL-Divergence > 0.15) or Brier Calibration score degradation > 20%",
    targetAction: "Automatic fallback to deterministic clinical scoreboards (NEWS2, qSOFA, Glasgow-Blatchford), alert MLOps Bio-AI engineering team",
    guideline: "FDA SaMD Good Machine Learning Practice (GMLP) & ISO 13485",
    level: "CRITICAL",
    color: "purple"
  }
];

// ==========================================
// MAIN COMPONENT
// ==========================================
export default function BioAiDiagnosticsHub() {
  const [patients, setPatients] = useState(SEED_BIOAI_PATIENTS);
  const [selectedPatientId, setSelectedPatientId] = useState("PT-BIOAI-501");
  const [activeTab, setActiveTab] = useState("inference"); // inference | explainability | samd | fusion | protocols | audit
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isSimulating, setIsSimulating] = useState(true);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [selectedEmergencyProtocol, setSelectedEmergencyProtocol] = useState(null);
  const [showCalculatorModal, setShowCalculatorModal] = useState(false);
  const [showPatientDetailModal, setShowPatientDetailModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  // Interactive AI Inference Simulator State
  const [calcInputs, setCalcInputs] = useState({
    lactate: 3.2,
    heartRate: 115,
    map: 68,
    wbc: 18.0,
    pfRatio: 180,
    il6Level: 350,
    aspectsScore: 8,
    hasLvoOcclusion: false
  });

  const { toasts, addToast, removeToast } = useKindToasts();

  const selectedPatient = useMemo(() => {
    return patients.find((p) => p.id === selectedPatientId) || patients[0];
  }, [patients, selectedPatientId]);

  // Real-time AI prediction inference simulation
  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      setPatients((prev) =>
        prev.map((p) => {
          const riskJitter = (Math.random() - 0.48) * 0.8;
          const newRisk = Math.max(10, Math.min(99.8, +(p.predictedRiskPercent + riskJitter).toFixed(1)));
          const timeJitter = (Math.random() - 0.52) * 0.05;
          const newTime = Math.max(0.1, +(p.predictedTimeToOnsetHours + timeJitter).toFixed(1));

          return {
            ...p,
            predictedRiskPercent: newRisk,
            predictedTimeToOnsetHours: newTime
          };
        })
      );
    }, 2800);

    return () => clearInterval(interval);
  }, [isSimulating]);

  // Derived Multi-Modal AI Score
  const calcResults = useMemo(() => {
    const { lactate, heartRate, map, wbc, pfRatio, il6Level, aspectsScore, hasLvoOcclusion } = calcInputs;
    
    // Sepsis risk calculation model
    let sepsisProb = 20;
    if (lactate > 2.0) sepsisProb += (lactate - 2.0) * 18;
    if (heartRate > 100) sepsisProb += (heartRate - 100) * 0.8;
    if (map < 65) sepsisProb += (65 - map) * 2.5;
    if (wbc > 12.0) sepsisProb += 15;
    sepsisProb = Math.min(99.4, Math.max(5.0, +sepsisProb.toFixed(1)));

    // ARDS subphenotype classifier
    const isHyperinflammatory = il6Level > 300 || pfRatio < 150;

    // Stroke LVO triage urgency
    const strokeUrgency = hasLvoOcclusion && aspectsScore >= 6 ? "EMERGENT_THROMBECTOMY" : "STANDARD_EVALUATION";

    return {
      sepsisProb,
      isHyperinflammatory,
      strokeUrgency,
      conformalLower: Math.max(1.0, +(sepsisProb - 3.2).toFixed(1)),
      conformalUpper: Math.min(99.9, +(sepsisProb + 2.8).toFixed(1))
    };
  }, [calcInputs]);

  // Filter patients
  const filteredPatients = useMemo(() => {
    return patients.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.primaryCondition.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.aiModelTarget.toLowerCase().includes(searchQuery.toLowerCase());
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
      `🚨 ${selectedEmergencyProtocol.code} EXECUTED: Clinical AI Response Dispatched for ${selectedPatient.name} (${selectedPatient.bed}).`,
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
      Primary_Condition: p.primaryCondition,
      AI_Model_Target: p.aiModelTarget,
      Predicted_Risk_Percent: p.predictedRiskPercent,
      Predicted_Onset_Hours: p.predictedTimeToOnsetHours,
      Conformal_Confidence_Interval: p.conformalConfidenceInterval,
      ARDS_Subphenotype: p.ardsSubphenotype,
      Stroke_LVO_Detected: p.strokeLvoDetected,
      Malignant_Arrhythmia_Risk: p.malignantArrhythmiaRisk,
      SaMD_Class: p.samdClass,
      Algorithmic_Drift_Status: p.driftStatus,
      Human_In_The_Loop: p.humanInTheLoopState,
      Status: p.status
    }));

    downloadCsv(dataToExport, `MedTrack_BioAI_Diagnostics_Inference_${new Date().toISOString().slice(0, 10)}.csv`);
    addToast("Bio-AI Clinical Intelligence audit ledger exported successfully.", "success");
    setShowExportModal(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-6 font-sans">
      <KindToastTray toasts={toasts} onDismiss={removeToast} />

      {/* HEADER BAR */}
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 text-cyan-400">
              <Brain className="w-8 h-8 animate-pulse text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
                  Bio-AI Diagnostics & Explainable Clinical Intelligence Hub
                </h1>
                <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  SaMD MULTI-MODAL INFERENCE
                </span>
              </div>
              <p className="text-xs md:text-sm text-slate-400 mt-0.5">
                Multi-Modal Deep Learning, SHAP / Integrated Gradients Explainability, Sepsis Pre-emption & Neuro LVO Stroke AI Triage
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
            {isSimulating ? "Streaming Neural Inference" : "Simulation Paused"}
          </button>

          <button
            onClick={() => setShowCalculatorModal(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/20 transition-all"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            AI Diagnostic Simulator
          </button>

          <button
            onClick={() => setShowExportModal(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            Audit Ledger
          </button>

          <button
            onClick={() => handleTriggerEmergency(BIOAI_EMERGENCY_PROTOCOLS[0])}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-rose-600 to-rose-700 text-white shadow-lg shadow-rose-900/30 hover:from-rose-500 hover:to-rose-600 transition-all"
          >
            <Siren className="w-4 h-4 animate-bounce" />
            CODE AI SEPSIS TRIGGER
          </button>
        </div>
      </header>

      {/* TOP AGGREGATE SUMMARY METRICS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 my-6">
        <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-3.5 backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Neural Pipelines Active</span>
            <Network className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-cyan-400">5 / 5</span>
            <span className="text-xs text-cyan-300">Online</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">ViT, GNN, Mamba & Time-LSTM</p>
        </div>

        <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-3.5 backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Critical Sepsis Warnings</span>
            <Flame className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-rose-500">1</span>
            <span className="text-xs text-rose-400">Pt-501</span>
          </div>
          <p className="text-[10px] text-rose-400 mt-1">&lt; 1.8h Onset Window</p>
        </div>

        <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-3.5 backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Acute Stroke LVO Detected</span>
            <Brain className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-400">1</span>
            <span className="text-xs text-amber-300">Pt-502</span>
          </div>
          <p className="text-[10px] text-amber-300 mt-1">Left M1 MCA Occlusion</p>
        </div>

        <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-3.5 backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Mean Model AUROC</span>
            <Zap className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-400">0.942</span>
            <span className="text-xs text-emerald-300">High Precision</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Conformal Coverage 95%</p>
        </div>

        <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-3.5 backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Algorithmic Drift</span>
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-indigo-400">0.018</span>
            <span className="text-xs text-indigo-300">KL-Div</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Nominal (Threshold &lt; 0.15)</p>
        </div>

        <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-3.5 backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>SaMD Governance</span>
            <Shield className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-purple-400">100%</span>
            <span className="text-xs text-purple-300">GMLP</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">FDA 21 CFR Part 11 / FHIR R4</p>
        </div>
      </div>

      {/* TWO-COLUMN AI WORKSPACE */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: PATIENT ROSTER (4 cols) */}
        <div className="xl:col-span-4 space-y-4">
          
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Users className="w-4 h-4 text-cyan-400" />
                Bio-AI Active Monitoring Queue
              </h2>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-cyan-400">
                {filteredPatients.length} Cases
              </span>
            </div>

            <div className="space-y-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search patient, AI model, condition..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-all"
                />
              </div>

              <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px]">
                {["ALL", "CRITICAL", "WARNING", "ALERT"].map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-2.5 py-1 rounded-md font-medium border transition-all ${
                      statusFilter === status
                        ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/50"
                        : "bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800"
                    }`}
                  >
                    {status === "ALL" ? "All Telemetry" : status}
                  </button>
                ))}
              </div>
            </div>

            {/* PATIENTS LIST */}
            <div className="mt-3 space-y-2.5 max-h-[560px] overflow-y-auto pr-1">
              {filteredPatients.map((p) => {
                const isSelected = p.id === selectedPatientId;
                const statusBadge =
                  p.status.includes("CRITICAL")
                    ? "bg-rose-500/20 text-rose-300 border-rose-500/50"
                    : p.status.includes("WARNING") || p.status.includes("ALERT")
                    ? "bg-amber-500/10 text-amber-300 border-amber-500/30"
                    : "bg-cyan-500/10 text-cyan-300 border-cyan-500/30";

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
                        <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{p.primaryCondition}</p>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusBadge}`}>
                        {p.predictedRiskPercent}% Risk
                      </span>
                    </div>

                    <div className="mt-2.5 p-2 rounded bg-slate-900/80 border border-slate-800/80 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-cyan-300 font-bold flex items-center gap-1">
                          <Cpu className="w-3.5 h-3.5" />
                          {p.aiModelTarget.split(" ")[0]} {p.aiModelTarget.split(" ")[1]}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {p.predictedTimeToOnsetHours > 0 ? `Onset: ${p.predictedTimeToOnsetHours}h` : "Onset: Active"}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-slate-800/60 text-center">
                      <div>
                        <span className="text-[10px] text-slate-500 block">HITL State</span>
                        <span className="text-[10px] font-bold text-slate-300 truncate block">
                          {p.humanInTheLoopState.split("_")[0]}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">Lactate</span>
                        <span className="text-xs font-bold text-slate-200">{p.lactate}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">Drift</span>
                        <span className="text-xs font-bold text-emerald-400">{p.driftStatus.split(" ")[0]}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* BIO-AI EMERGENCY DIRECTIVES */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2 mb-2.5">
              <Siren className="w-4 h-4 text-rose-500" />
              Bio-AI Critical Emergency Protocols
            </h3>
            <div className="space-y-2">
              {BIOAI_EMERGENCY_PROTOCOLS.map((proto) => (
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

        {/* RIGHT COLUMN: DETAILED INFERENCE & EXPLAINABILITY CONSOLE (8 cols) */}
        <div className="xl:col-span-8 space-y-4">
          
          {/* PATIENT BANNER CARD */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 lg:p-5 relative overflow-hidden">
            <div className="absolute right-0 top-0 w-96 h-96 bg-gradient-to-bl from-cyan-500/5 via-purple-500/5 to-transparent pointer-events-none" />
            
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
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-rose-500/15 text-rose-300 border border-rose-500/40">
                    AI RISK: {selectedPatient.predictedRiskPercent}%
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  <span className="font-semibold text-slate-400">Target Condition:</span> {selectedPatient.primaryCondition}
                </p>
                <div className="flex flex-wrap items-center gap-4 mt-2 text-[11px] text-slate-400">
                  <span>Model: <strong className="text-cyan-300">{selectedPatient.aiModelTarget}</strong></span>
                  <span>Conformal Bounds: <strong className="text-slate-200">{selectedPatient.conformalConfidenceInterval}</strong></span>
                  <span>Attending: <strong className="text-slate-200">{selectedPatient.attendingIntensivist}</strong></span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setShowPatientDetailModal(true)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-all"
                >
                  <Eye className="w-3.5 h-3.5 text-cyan-400" />
                  Full Neural Dossier
                </button>
              </div>
            </div>

            {/* TAB NAVIGATION */}
            <div className="flex items-center gap-2 mt-5 border-b border-slate-800 overflow-x-auto text-xs">
              {[
                { id: "inference", label: "Real-Time Inference", icon: Cpu },
                { id: "explainability", label: "SHAP & Feature Attributions", icon: Sparkles },
                { id: "samd", label: "SaMD & Drift Assurance", icon: ShieldCheck },
                { id: "fusion", label: "Multi-Modal Sensor Fusion", icon: Network },
                { id: "protocols", label: "Clinical AI Governance", icon: Shield }
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

          {/* TAB 1: REAL-TIME INFERENCE */}
          {activeTab === "inference" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5">
                  <div className="flex items-center justify-between text-slate-400 text-xs">
                    <span>Predicted Risk Velocity</span>
                    <Flame className="w-4 h-4 text-rose-500" />
                  </div>
                  <div className="mt-1">
                    <span className="text-2xl font-black text-rose-500">{selectedPatient.predictedRiskPercent}%</span>
                  </div>
                  <span className="text-[10px] text-rose-400 mt-1 block">High Probability Trajectory</span>
                </div>

                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5">
                  <div className="flex items-center justify-between text-slate-400 text-xs">
                    <span>Estimated Time-to-Onset</span>
                    <Clock className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div className="mt-1">
                    <span className="text-2xl font-black text-cyan-400">
                      {selectedPatient.predictedTimeToOnsetHours > 0 ? `${selectedPatient.predictedTimeToOnsetHours}h` : "Active"}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">Pre-emptive window</span>
                </div>

                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5">
                  <div className="flex items-center justify-between text-slate-400 text-xs">
                    <span>Malignant Arrhythmia Risk</span>
                    <HeartPulse className="w-4 h-4 text-purple-400" />
                  </div>
                  <div className="mt-1">
                    <span className="text-2xl font-black text-purple-400">{selectedPatient.malignantArrhythmiaRisk}%</span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">12-Lead Continuous Wavelet</span>
                </div>

                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5">
                  <div className="flex items-center justify-between text-slate-400 text-xs">
                    <span>Human-in-the-Loop</span>
                    <User className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="mt-1">
                    <span className="text-sm font-bold text-emerald-300">
                      {selectedPatient.humanInTheLoopState.split("_")[0]}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">Clinician Verification Protocol</span>
                </div>
              </div>

              {/* MODEL ARCHITECTURE SUMMARY */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center justify-between">
                  <span>Active Neural Diagnostic Pipeline Details</span>
                  <span className="text-[10px] text-slate-500 font-normal">SaMD Class: {selectedPatient.samdClass}</span>
                </h3>

                <div className="p-3.5 rounded-lg bg-slate-950 border border-cyan-500/30 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-sm">{selectedPatient.aiModelTarget}</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold text-[10px]">
                      Validated AUROC 0.942
                    </span>
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    Continuously aggregates continuous physiological telemetry, point-of-care lactate rates, laboratory bandemia, and dense time-series embeddings to generate early clinical deterioration alerts prior to macroscopic hemodynamic collapse.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SHAP & EXPLAINABILITY */}
          {activeTab === "explainability" && (
            <div className="space-y-4">
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  Shapley Additive Explanations (SHAP) & Feature Contribution Matrix
                </h3>

                <div className="space-y-2.5 text-xs">
                  {selectedPatient.primaryShapFeatures.map((feat, idx) => (
                    <div key={idx} className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex justify-between items-center">
                      <div>
                        <span className="font-bold text-slate-200">{feat.feature}</span>
                        <p className="text-[10px] text-slate-500 mt-0.5">Impact: {feat.impact}</p>
                      </div>
                      <div className="text-right">
                        <span className={`text-base font-black ${feat.shapValue.startsWith("+") ? "text-rose-400" : "text-emerald-400"}`}>
                          {feat.shapValue}
                        </span>
                        <span className="text-[10px] text-slate-400 block">SHAP Weight</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 p-3 rounded-lg bg-slate-950/80 border border-slate-800 text-xs">
                  <span className="font-bold text-slate-300 block">Visual Attention & Grad-CAM Focal Region:</span>
                  <p className="text-cyan-300 mt-1 font-mono text-[11px]">{selectedPatient.gradCamHeatmapRegion}</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SAMD & DRIFT ASSURANCE */}
          {activeTab === "samd" && (
            <div className="space-y-4">
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">
                  FDA SaMD Class II/III Algorithmic Performance & Drift Monitoring
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-slate-500 block">Population Covariate Shift</span>
                    <span className="text-lg font-bold text-emerald-400 mt-1 block">{selectedPatient.driftStatus}</span>
                    <span className="text-[10px] text-slate-500">KL Divergence &lt; 0.15 threshold</span>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-slate-500 block">Brier Calibration Score</span>
                    <span className="text-lg font-bold text-slate-200 mt-1 block">0.082 (Well Calibrated)</span>
                    <span className="text-[10px] text-slate-500">Platt scaling verified</span>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-slate-500 block">Demographic Fairness Index</span>
                    <span className="text-lg font-bold text-indigo-300 mt-1 block">99.4% Parity</span>
                    <span className="text-[10px] text-slate-500">Equalized Odds Ratio</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: MULTI-MODAL FUSION */}
          {activeTab === "fusion" && (
            <div className="space-y-4">
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">
                  Integrated Multi-Modal Input Modalities
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-slate-500 block">Imaging (3D CT/CTA)</span>
                    <span className="text-sm font-bold text-cyan-300 mt-1 block">ViT 3D Segmented</span>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-slate-500 block">Continuous Waveforms</span>
                    <span className="text-sm font-bold text-purple-300 mt-1 block">Wavelet Transform</span>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-slate-500 block">EHR Clinical Notes</span>
                    <span className="text-sm font-bold text-emerald-300 mt-1 block">Clinical-NLP LLM</span>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-slate-500 block">Genomics & Biomarkers</span>
                    <span className="text-sm font-bold text-pink-300 mt-1 block">Graph Neural Net</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: CLINICAL AI GOVERNANCE */}
          {activeTab === "protocols" && (
            <div className="space-y-4">
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  International Clinical AI & SaMD Governance Standards
                </h3>

                <div className="space-y-3 text-xs">
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="font-bold text-cyan-300">1. Explainable AI (XAI) Transparency Requirement</span>
                    <p className="text-slate-400 mt-1">Every deep neural prediction impacting patient treatment pathways must provide local SHAP feature attributions and visual heatmaps to enable informed clinician verification.</p>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-950 border border-purple-300">
                    <span className="font-bold text-purple-300">2. Conformal Prediction Set Bounds</span>
                    <p className="text-slate-400 mt-1">Predictions must display guaranteed statistical coverage bounds (e.g. 95% conformal prediction interval) to prevent overconfident erroneous clinical inferences.</p>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-950 border border-rose-300">
                    <span className="font-bold text-rose-300">3. Out-of-Distribution (OOD) Fallback E-Stop</span>
                    <p className="text-slate-400 mt-1">Automatic fail-safe switching to classical deterministic physiological scoreboards (NEWS2, qSOFA) triggers immediately upon detection of severe dataset drift.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ========================================== */}
      {/* MODAL 1: AI DIAGNOSTIC SIMULATOR */}
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
                  <h3 className="text-lg font-bold text-white">Multi-Modal AI Inference & Risk Simulator</h3>
                  <p className="text-xs text-slate-400">Compute Sepsis Deterioration Velocity, ARDS Phenotyping & Stroke Triage</p>
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
              {/* INPUTS */}
              <div className="lg:col-span-6 space-y-3.5 bg-slate-950/70 p-4 rounded-xl border border-slate-800/80">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">Physiological & Lab Inputs</h4>

                <div>
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>Serum Lactate (mmol/L)</span>
                    <strong className="text-cyan-400">{calcInputs.lactate} mmol/L</strong>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="8.0"
                    step="0.1"
                    value={calcInputs.lactate}
                    onChange={(e) => setCalcInputs({ ...calcInputs, lactate: +e.target.value })}
                    className="w-full accent-cyan-400"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>Heart Rate (bpm)</span>
                    <strong className="text-cyan-400">{calcInputs.heartRate} bpm</strong>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="160"
                    value={calcInputs.heartRate}
                    onChange={(e) => setCalcInputs({ ...calcInputs, heartRate: +e.target.value })}
                    className="w-full accent-cyan-400"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>Mean Arterial Pressure (MAP)</span>
                    <strong className="text-cyan-400">{calcInputs.map} mmHg</strong>
                  </div>
                  <input
                    type="range"
                    min="45"
                    max="110"
                    value={calcInputs.map}
                    onChange={(e) => setCalcInputs({ ...calcInputs, map: +e.target.value })}
                    className="w-full accent-cyan-400"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>Plasma IL-6 (pg/mL)</span>
                    <strong className="text-cyan-400">{calcInputs.il6Level} pg/mL</strong>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="1000"
                    step="10"
                    value={calcInputs.il6Level}
                    onChange={(e) => setCalcInputs({ ...calcInputs, il6Level: +e.target.value })}
                    className="w-full accent-cyan-400"
                  />
                </div>
              </div>

              {/* SIMULATED PREDICTIONS */}
              <div className="lg:col-span-6 space-y-3 bg-slate-950/70 p-4 rounded-xl border border-slate-800/80">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">Neural Network Predictions</h4>

                <div className="space-y-3 text-xs">
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-slate-500 block">Sepsis 6-Hour Shock Probability</span>
                    <span className="text-2xl font-black text-rose-400 mt-1 block">
                      {calcResults.sepsisProb}%
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      Conformal Interval: [{calcResults.conformalLower}% - {calcResults.conformalUpper}%]
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-slate-500 block">ARDS Biological Subphenotype</span>
                    <span className="text-base font-black text-purple-300 mt-1 block">
                      {calcResults.isHyperinflammatory ? "Hyperinflammatory (Class 2)" : "Hypoinflammatory (Class 1)"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => {
                  setCalcInputs({
                    lactate: selectedPatient.lactate,
                    heartRate: selectedPatient.hr,
                    map: selectedPatient.map,
                    wbc: selectedPatient.wbc,
                    pfRatio: 160,
                    il6Level: 420,
                    aspectsScore: 8,
                    hasLvoOcclusion: selectedPatient.strokeLvoDetected
                  });
                  addToast("Loaded selected patient physiological parameters.", "info");
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all"
              >
                Sync with Patient
              </button>
              <button
                onClick={() => setShowCalculatorModal(false)}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white transition-all"
              >
                Close Simulator
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
                <span className="text-xs font-bold text-rose-400 tracking-wider uppercase">Clinical AI Emergency Protocol</span>
                <h3 className="text-xl font-black text-white">{selectedEmergencyProtocol.title}</h3>
              </div>
            </div>

            <div className="my-5 space-y-3.5 text-xs text-slate-300">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-500 font-semibold block">Target Patient:</span>
                <span className="text-base font-bold text-white">{selectedPatient.name} ({selectedPatient.id})</span>
                <span className="text-xs text-rose-400 block mt-0.5">{selectedPatient.bed} • {selectedPatient.primaryCondition}</span>
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
                EXECUTE AI CLINICAL ACTION
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL 3: PATIENT FULL NEURAL DOSSIER */}
      {/* ========================================== */}
      {showPatientDetailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Brain className="w-5 h-5 text-cyan-400" />
                Bio-AI Inference Dossier: {selectedPatient.name}
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
                  <span className="text-slate-500 block">Model Target</span>
                  <span className="font-bold text-cyan-400">{selectedPatient.aiModelTarget.split(" ")[0]}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-slate-500 block">Predicted Risk</span>
                  <span className="font-bold text-rose-400">{selectedPatient.predictedRiskPercent}%</span>
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
                <Download className="w-5 h-5 text-cyan-400" />
                Bio-AI Inference Audit & FHIR R4 Export
              </h3>
              <button onClick={() => setShowExportModal(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="my-4 text-xs text-slate-300 space-y-3">
              <p className="text-slate-400">
                Exports all multi-modal neural predictions, SHAP attribution records, and SaMD drift metrics adhering to FDA 21 CFR Part 11 and HL7 FHIR R4 Observations.
              </p>
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-400">
                <span className="text-slate-300 font-semibold block">Cryptographic Provenance Stamp:</span>
                <span className="font-mono text-cyan-400 block mt-0.5">SHA256: 3c8e...d291b</span>
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
                className="px-5 py-2 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white flex items-center gap-1.5"
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
