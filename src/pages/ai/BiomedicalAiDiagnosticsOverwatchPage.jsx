import React, { useState, useEffect, useMemo } from "react";
import {
  Brain,
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
  Sparkles,
  Network,
  Binary,
  Microscope,
  Radar,
  Radio,
  RefreshCw
} from "lucide-react";
import { downloadCsv } from "../../utils/csv";
import { useKindToasts, KindToastTray } from "../../components/common/HubToasts";
import { DetailRow as Row, AlertStatCard as StatCard, MiniStat as Vital } from "../../components/common/HubCards";

const SEED_BIOAI_CASES = [
  {
    id: "AI-DIAG-901",
    name: "Eleanor Whitmore",
    age: 62,
    gender: "Female",
    bed: "ICU-STEP-01",
    primaryComplaint: "Post-Operative Acute Sepsis / Early Septic Shock Prediction",
    aiModel: "Bio-MedCLIP Transformer Ensemble v4.2",
    compositeRiskScore: 0.88,
    predictedOnsetHours: 1.5,
    confidenceInterval: "95% CI 0.82 - 0.94",
    brierScore: 0.042,
    preTestProb: 0.15,
    postTestProb: 0.89,
    news2Score: 8,
    lactate: 3.4,
    hr: 124,
    map: 62,
    rr: 26,
    spo2: 92,
    wbc: 18.5,
    crp: 145,
    shapValues: [
      { feature: "Heart Rate Variability (HRV Entropy Decay)", impact: "+0.34", direction: "Risk Escalation" },
      { feature: "Microvascular Perfusion Index & Serum Lactate", impact: "+0.28", direction: "Hypoperfusion" },
      { feature: "Respiratory Rate vs. EtCO2 Gradient", impact: "+0.18", direction: "Compensatory Tachypnea" },
      { feature: "Urine Output Rate Slump", impact: "+0.08", direction: "Renal Stun" }
    ],
    fdaClassification: "FDA De Novo Class II SaMD (DEN220045)",
    clinicalDecisionSupport: "Sepsis Early Intervention Trigger: Dispatched 1-Hour Sepsis Bundle (Blood Cultures x2, Lactate, IV Plasmalyte 30 mL/kg, Cefepime 2g IV).",
    status: "CRITICAL_ALERT",
    attendingPhysician: "Dr. Evelyn Ross, MD (Intensive Care & Clinical AI)",
    timestamp: "2026-08-20 02:45",
    alerts: [
      "AI Predictive Horizon: 88% probability of septic shock collapse within 90 minutes",
      "Model Uncertainty Guard: Low epistemic variance across 10-fold Monte Carlo ensemble"
    ]
  },
  {
    id: "AI-DIAG-902",
    name: "Arthur Pendelton",
    age: 74,
    gender: "Male",
    bed: "ICU-CCU-03",
    primaryComplaint: "Subclinical Malignant Ventricular Arrhythmia (VT/VF) Forecast",
    aiModel: "NeuroCardio ECG-WaveNet v3.0",
    compositeRiskScore: 0.79,
    predictedOnsetHours: 0.8,
    confidenceInterval: "95% CI 0.73 - 0.85",
    brierScore: 0.038,
    preTestProb: 0.10,
    postTestProb: 0.81,
    news2Score: 6,
    lactate: 1.8,
    hr: 98,
    map: 74,
    rr: 20,
    spo2: 96,
    wbc: 9.2,
    crp: 22,
    shapValues: [
      { feature: "QTc Dispersion & T-Wave Alternans Micro-Voltage", impact: "+0.41", direction: "Repolarization Instability" },
      { feature: "Early Ejection Fraction Strain Decay", impact: "+0.22", direction: "Ischemic Substrate" },
      { feature: "Serum Potassium Gradient", impact: "+0.16", direction: "Electrolyte Trigger" }
    ],
    fdaClassification: "FDA 510(k) Cleared (K213490)",
    clinicalDecisionSupport: "Automated Defibrillator Pad Check Recommended. Dispatched IV Magnesium Sulfate 2g + Amiodarone bolus standby.",
    status: "CRITICAL_ALERT",
    attendingPhysician: "Dr. Marcus Vance, MD (Cardiology & Electrophysiology)",
    timestamp: "2026-08-20 03:10",
    alerts: [
      "Micro-T-wave alternans detected on continuous vectorcardiography",
      "Corrected QT interval prolonged to 512 ms: high torsadogenic liability"
    ]
  },
  {
    id: "AI-DIAG-903",
    name: "Chloe Zhao",
    age: 48,
    gender: "Female",
    bed: "ICU-NEURO-02",
    primaryComplaint: "Intracranial Pressure (ICP) Surge & Brain Herniation Warning",
    aiModel: "DeepNeuro Pupillometry & Transcranial Doppler AI v2.5",
    compositeRiskScore: 0.64,
    predictedOnsetHours: 3.2,
    confidenceInterval: "95% CI 0.55 - 0.72",
    brierScore: 0.055,
    preTestProb: 0.20,
    postTestProb: 0.67,
    news2Score: 5,
    lactate: 1.4,
    hr: 58,
    map: 108,
    rr: 14,
    spo2: 99,
    wbc: 11.0,
    crp: 35,
    shapValues: [
      { feature: "Neurological Pupil Index Velocity Decay", impact: "+0.35", direction: "Brainstem Compression" },
      { feature: "Transcranial Pulsatility Index", impact: "+0.25", direction: "Cerebral Vasospasm" },
      { feature: "MAP vs. ICP Waveform Compliance Coupling", impact: "+0.04", direction: "Loss of Autoregulation" }
    ],
    fdaClassification: "FDA Breakthrough Device Designation",
    clinicalDecisionSupport: "Elevate head of bed 30 degrees, initiate 3% Hypertonic Saline 250 mL bolus, prepare urgent STAT CT Head.",
    status: "MODERATE_WARNING",
    attendingPhysician: "Dr. Maya Lin, MD (Neurocritical Care)",
    timestamp: "2026-08-20 01:20",
    alerts: [
      "Incipient Cushing reflex pattern identified by autonomous Bayesian watcher",
      "NPi pupil index reduced to 2.8 in right eye: uncal herniation risk"
    ]
  },
  {
    id: "AI-DIAG-904",
    name: "Samuel O Connor",
    age: 55,
    gender: "Male",
    bed: "ICU-RESP-04",
    primaryComplaint: "Acute Respiratory Distress Syndrome (ARDS) Extubation Readiness",
    aiModel: "DeepVent Lung Protective & Weaning Neural Engine v5.0",
    compositeRiskScore: 0.12,
    predictedOnsetHours: 0,
    confidenceInterval: "95% CI 0.08 - 0.18",
    brierScore: 0.021,
    preTestProb: 0.50,
    postTestProb: 0.08,
    news2Score: 2,
    lactate: 1.0,
    hr: 76,
    map: 84,
    rr: 16,
    spo2: 98,
    wbc: 7.4,
    crp: 12,
    shapValues: [
      { feature: "Rapid Shallow Breathing Index", impact: "-0.45", direction: "Optimal Lung Mechanics" },
      { feature: "Work of Breathing & Diaphragmatic Excursion", impact: "-0.28", direction: "Muscle Recovery" },
      { feature: "PaO2/FiO2 Ratio", impact: "-0.15", direction: "Excellent Gas Exchange" }
    ],
    fdaClassification: "FDA 510(k) Cleared Class II SaMD",
    clinicalDecisionSupport: "Patient cleared for Spontaneous Breathing Trial (SBT) and planned extubation within the current nursing shift.",
    status: "STABLE",
    attendingPhysician: "Dr. Alistair Finch, MD (Pulmonary & Critical Care)",
    timestamp: "2026-08-19 23:00",
    alerts: [
      "RSBI 38 breaths/min/L confirms 94% probability of successful extubation",
      "Cough peak flow > 60 L/min: airway protective reflexes intact"
    ]
  }
];

export default function BiomedicalAiDiagnosticsOverwatchPage() {
  const { toasts, toast } = useKindToasts();
  const [cases, setCases] = useState(SEED_BIOAI_CASES);
  const [selectedCaseId, setSelectedCaseId] = useState(SEED_BIOAI_CASES[0].id);
  const [activeTab, setActiveTab] = useState("overview");
  const [isRealTimeInference, setIsRealTimeInference] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRisk, setFilterRisk] = useState("ALL");
  const [inspectModalOpen, setInspectModalOpen] = useState(false);
  const [emergencyModal, setEmergencyModal] = useState(null);

  const [simVitalsScore, setSimVitalsScore] = useState(0.85);
  const [simBiomarkerScore, setSimBiomarkerScore] = useState(0.78);
  const [simEhrScore, setSimEhrScore] = useState(0.65);
  const [simPreTestProb, setSimPreTestProb] = useState(0.20);
  const [simLikelihoodRatio, setSimLikelihoodRatio] = useState(12.5);

  const selectedCase = useMemo(() => {
    return cases.find((c) => c.id === selectedCaseId) || cases[0];
  }, [cases, selectedCaseId]);

  useEffect(() => {
    if (!isRealTimeInference) return;
    const interval = setInterval(() => {
      setCases((prev) =>
        prev.map((cs) => {
          const delta = (Math.random() * 0.04 - 0.02);
          const newScore = Math.max(0.01, Math.min(0.99, cs.compositeRiskScore + delta));
          return {
            ...cs,
            compositeRiskScore: Number(newScore.toFixed(3)),
            hr: cs.hr + (Math.random() > 0.7 ? (Math.random() > 0.5 ? 1 : -1) : 0)
          };
        })
      );
    }, 2800);
    return () => clearInterval(interval);
  }, [isRealTimeInference]);

  const filteredCases = useMemo(() => {
    return cases.filter((cs) => {
      const matchesSearch =
        cs.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cs.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cs.bed.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cs.primaryComplaint.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRisk =
        filterRisk === "ALL" ||
        (filterRisk === "CRITICAL" && cs.compositeRiskScore >= 0.70) ||
        (filterRisk === "WARNING" && cs.compositeRiskScore >= 0.40 && cs.compositeRiskScore < 0.70) ||
        (filterRisk === "STABLE" && cs.compositeRiskScore < 0.40);
      return matchesSearch && matchesRisk;
    });
  }, [cases, searchQuery, filterRisk]);

  const computedCompositeScore = useMemo(() => {
    const total = simVitalsScore * 0.35 + simBiomarkerScore * 0.35 + simEhrScore * 0.30;
    return Number(total.toFixed(3));
  }, [simVitalsScore, simBiomarkerScore, simEhrScore]);

  const computedPostTest = useMemo(() => {
    const preOdds = simPreTestProb / (1 - simPreTestProb);
    const postOdds = preOdds * simLikelihoodRatio;
    const postProb = (postOdds / (1 + postOdds)) * 100;
    return Number(postProb.toFixed(2));
  }, [simPreTestProb, simLikelihoodRatio]);

  const handleExportCsv = () => {
    const headers = [
      "Inference ID",
      "Patient Name",
      "Bed",
      "Clinical Prediction Task",
      "Deep Learning Model",
      "AI Composite Risk Score",
      "Predicted Lead Time (Hours)",
      "Brier Score Calibration",
      "Pre-Test Probability",
      "Post-Test Probability (%)",
      "NEWS2 Score",
      "Serum Lactate",
      "FDA SaMD Status",
      "Clinical Decision Support Action"
    ];
    const rows = cases.map((c) => [
      c.id,
      c.name,
      c.bed,
      c.primaryComplaint,
      c.aiModel,
      c.compositeRiskScore,
      c.predictedOnsetHours,
      c.brierScore,
      c.preTestProb,
      c.postTestProb * 100,
      c.news2Score,
      c.lactate,
      c.fdaClassification,
      c.clinicalDecisionSupport
    ]);
    downloadCsv("bioai_diagnostics_telemetry_manifest.csv", headers, rows);
    toast.success("Bio-AI Clinical Diagnostics Telemetry manifest exported to CSV.");
  };

  const triggerRapidIntervention = (protocolName) => {
    setEmergencyModal(protocolName);
    toast.error(`RAPID INTERVENTION TRIGGERED: ${protocolName} for ${selectedCase.name} (${selectedCase.bed})`);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-6 font-sans">
      <KindToastTray toasts={toasts} />

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-950/80 border border-cyan-500/30 text-cyan-400 shadow-lg shadow-cyan-950/50">
              <Brain className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white flex items-center gap-2">
                Bio-AI Diagnostics & Clinical Inference Overwatch
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/40 text-cyan-300 font-semibold tracking-normal uppercase">
                  FDA SaMD / GMLP / SHAP Explainability
                </span>
              </h1>
              <p className="text-sm text-slate-400">
                Continuous deep neural ensemble predictive inference, probabilistic uncertainty quantification, SHAP feature attribution, and closed-loop clinical decision support.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-stretch md:self-auto justify-end">
          <button
            onClick={() => setIsRealTimeInference(!isRealTimeInference)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all border ${
              isRealTimeInference
                ? "bg-rose-950/60 border-rose-500/40 text-rose-300 hover:bg-rose-900/60"
                : "bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800"
            }`}
          >
            {isRealTimeInference ? <Pause className="w-3.5 h-3.5 animate-pulse" /> : <Play className="w-3.5 h-3.5" />}
            {isRealTimeInference ? "INFERENCE STREAM LIVE" : "INFERENCE PAUSED"}
          </button>

          <button
            onClick={handleExportCsv}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold bg-slate-900 border border-slate-700 text-slate-200 hover:bg-slate-800 transition-all"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            EXPORT CSV
          </button>

          <button
            onClick={() => triggerRapidIntervention("CODE SEPSIS / STAT 1-HOUR BUNDLE")}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-extrabold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-950 transition-all"
          >
            <Siren className="w-4 h-4 animate-bounce" />
            CODE SEPSIS
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
        <StatCard icon={Users} label="Active AI Surveillance" value={`${cases.length} Beds`} subtext="100% Inferred" color="cyan" />
        <StatCard icon={ShieldAlert} label="Critical Deterioration" value={cases.filter((c) => c.compositeRiskScore >= 0.70).length.toString()} subtext="Lead Time > 1.5h" color="rose" />
        <StatCard icon={Radar} label="Mean Brier Score" value="0.039" subtext="High Calibration" color="emerald" />
        <StatCard icon={Zap} label="Inference Latency" value="42 ms" subtext="Edge TensorRT" color="amber" />
        <StatCard icon={Activity} label="NEWS2 > 5 Warning" value={cases.filter((c) => c.news2Score >= 5).length.toString()} subtext="Multi-Parameter" color="purple" />
        <StatCard icon={ShieldCheck} label="FDA GMLP Quality" value="Class II SaMD" subtext="ISO 13485 / 21 CFR" color="indigo" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-4 space-y-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl">
            <div className="flex items-center justify-between gap-2 mb-3">
              <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Network className="w-4 h-4 text-cyan-400" />
                Live Inference Stream ({filteredCases.length})
              </h2>
              <span className="text-xs text-slate-500 font-mono">Edge Neural Core</span>
            </div>

            <div className="space-y-2 mb-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search patient, complaint, bed..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                {["ALL", "CRITICAL", "WARNING", "STABLE"].map((flt) => (
                  <button
                    key={flt}
                    onClick={() => setFilterRisk(flt)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                      filterRisk === flt
                        ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/50"
                        : "bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200"
                    }`}
                  >
                    {flt}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {filteredCases.map((c) => {
                const isSelected = c.id === selectedCase.id;
                const isCrit = c.compositeRiskScore >= 0.70;
                return (
                  <div
                    key={c.id}
                    onClick={() => setSelectedCaseId(c.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? "bg-slate-800/90 border-cyan-500/60 shadow-lg shadow-cyan-950/30 ring-1 ring-cyan-500/30"
                        : "bg-slate-950/60 border-slate-800/80 hover:bg-slate-800/40 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-100">{c.name}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-cyan-400">
                            {c.bed}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 line-clamp-1">{c.primaryComplaint}</p>
                      </div>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          isCrit
                            ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                            : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                        }`}
                      >
                        {(c.compositeRiskScore * 100).toFixed(0)}% Risk
                      </span>
                    </div>

                    <div className="grid grid-cols-4 gap-1 pt-2 border-t border-slate-800/80 text-center text-[10px]">
                      <div className="bg-slate-900/60 rounded p-1">
                        <span className="text-slate-500 block">Lead Time</span>
                        <span className="font-bold text-cyan-300">{c.predictedOnsetHours}h</span>
                      </div>
                      <div className="bg-slate-900/60 rounded p-1">
                        <span className="text-slate-500 block">NEWS2</span>
                        <span className={`font-bold ${c.news2Score >= 7 ? "text-rose-400" : "text-slate-200"}`}>{c.news2Score}</span>
                      </div>
                      <div className="bg-slate-900/60 rounded p-1">
                        <span className="text-slate-500 block">Lactate</span>
                        <span className={`font-bold ${c.lactate > 2.0 ? "text-amber-400" : "text-emerald-400"}`}>{c.lactate}</span>
                      </div>
                      <div className="bg-slate-900/60 rounded p-1">
                        <span className="text-slate-500 block">Brier</span>
                        <span className="font-bold text-slate-300">{c.brierScore}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="xl:col-span-8 space-y-4">
          <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-5 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
              <div>
                <div className="flex items-center gap-3">
                  <span className="text-xl md:text-2xl font-black text-white">{selectedCase.name}</span>
                  <span className="text-xs px-2.5 py-1 rounded-md bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-mono font-bold">
                    {selectedCase.id}
                  </span>
                  <span className="text-xs px-2.5 py-1 rounded-md bg-purple-950 border border-purple-500/40 text-purple-300 font-bold">
                    {selectedCase.bed}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1 flex items-center gap-3 flex-wrap">
                  <span>Model: <b className="text-slate-200">{selectedCase.aiModel}</b></span>
                  <span>•</span>
                  <span>Predicted Horizon: <b className="text-rose-400">{selectedCase.predictedOnsetHours} Hours Ahead</b></span>
                  <span>•</span>
                  <span>Attending: <b className="text-cyan-400">{selectedCase.attendingPhysician}</b></span>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setInspectModalOpen(true)}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/40 flex items-center gap-1.5 transition-all shadow-lg"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Full Neural Dossier
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5 mt-5 pt-4 border-t border-slate-800/80">
              <Vital label="Composite AI Risk" value={`${(selectedCase.compositeRiskScore * 100).toFixed(1)}%`} status={selectedCase.compositeRiskScore >= 0.70 ? "critical" : "normal"} />
              <Vital label="Confidence Band" value="[0.82-0.94]" status="normal" />
              <Vital label="Post-Test Prob" value={`${(selectedCase.postTestProb * 100).toFixed(0)}%`} status="critical" />
              <Vital label="NEWS2 Score" value={selectedCase.news2Score.toString()} status={selectedCase.news2Score >= 7 ? "critical" : "normal"} />
              <Vital label="Heart Rate" value={`${selectedCase.hr} bpm`} status="normal" />
              <Vital label="Mean BP (MAP)" value={`${selectedCase.map} mmHg`} status={selectedCase.map < 65 ? "warning" : "normal"} />
            </div>
          </div>

          <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
            {[
              { id: "overview", label: "SHAP Explainability & Risk Drivers", icon: Sparkles },
              { id: "ensemble", label: "Neural Model Architecture & Confidence", icon: Binary },
              { id: "workbench", label: "Bayesian Fagan & Gradient Workbench", icon: Sliders },
              { id: "protocols", label: "Autonomous Intervention Protocols", icon: Siren }
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

          {activeTab === "overview" && (
            <div className="space-y-4">
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl">
                <h3 className="text-sm font-bold text-slate-200 mb-3 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    SHAP (Shapley Additive Explanations) Feature Attribution
                  </span>
                  <span className="text-[11px] font-mono text-cyan-400 font-semibold">Local Game-Theoretic Weights</span>
                </h3>

                <div className="space-y-2.5">
                  {selectedCase.shapValues.map((shp, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-semibold text-slate-200">{shp.feature}</span>
                        <span className="font-mono font-bold text-cyan-300 text-sm">{shp.impact}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
                        <span>Clinical Physiological Impact:</span>
                        <span className="font-semibold text-rose-300">{shp.direction}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl">
                <h3 className="text-sm font-bold text-slate-200 mb-2 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  Autonomous Closed-Loop Clinical Recommendation
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed p-3 rounded-xl bg-slate-950 border border-slate-800">
                  {selectedCase.clinicalDecisionSupport}
                </p>
                <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                  <span>Regulatory Status: <b className="text-cyan-400">{selectedCase.fdaClassification}</b></span>
                  <span>Inference Timestamp: <b className="text-slate-200">{selectedCase.timestamp}</b></span>
                </div>
              </div>
            </div>
          )}

          {activeTab === "ensemble" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
                <h3 className="text-sm font-bold text-slate-200 mb-3 flex items-center gap-2">
                  <Binary className="w-4 h-4 text-purple-400" />
                  Deep Learning Ensemble Architecture
                </h3>
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 mb-3 text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Model Family:</span>
                    <span className="font-bold text-white">Transformer + Temporal CNN</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Ensemble Members:</span>
                    <span className="font-mono text-cyan-300">10 Sub-Networks (Bootstrap)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Quantization:</span>
                    <span className="font-mono text-emerald-300">FP16 TensorRT</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">FDA SaMD Classification:</span>
                    <span className="font-bold text-purple-300">{selectedCase.fdaClassification}</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
                <h3 className="text-sm font-bold text-slate-200 mb-3 flex items-center gap-2">
                  <Radar className="w-4 h-4 text-cyan-400" />
                  Probabilistic Uncertainty & Calibration
                </h3>
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center mb-3">
                  <span className="text-xs text-slate-400 block">Brier Calibration Score</span>
                  <span className="text-3xl font-black text-emerald-400 font-mono">{selectedCase.brierScore}</span>
                  <span className="text-[10px] text-slate-500 block mt-1">Target &lt; 0.05 indicates superior probability calibration</span>
                </div>
                <div className="text-xs text-slate-300 space-y-1">
                  <div className="flex justify-between p-2 rounded bg-slate-950/60 border border-slate-800">
                    <span>Epistemic Uncertainty:</span>
                    <span className="font-mono text-cyan-300">Low (0.024)</span>
                  </div>
                  <div className="flex justify-between p-2 rounded bg-slate-950/60 border border-slate-800">
                    <span>Aleatoric Data Noise:</span>
                    <span className="font-mono text-slate-400">Nominal (0.018)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "workbench" && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-cyan-400" />
                  Bayesian Fagan Nomogram & Multi-Modal Gradient Workbench
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Interactive simulation for post-test probability calculations and composite deterioration gradients.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Multi-Modal Inputs</h4>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Vitals Anomaly Gradient: {(simVitalsScore * 100).toFixed(0)}%</label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={simVitalsScore}
                      onChange={(e) => setSimVitalsScore(parseFloat(e.target.value))}
                      className="w-full accent-cyan-400"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Lab Biomarker Shift: {(simBiomarkerScore * 100).toFixed(0)}%</label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={simBiomarkerScore}
                      onChange={(e) => setSimBiomarkerScore(parseFloat(e.target.value))}
                      className="w-full accent-cyan-400"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">EHR Clinical Trajectory: {(simEhrScore * 100).toFixed(0)}%</label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={simEhrScore}
                      onChange={(e) => setSimEhrScore(parseFloat(e.target.value))}
                      className="w-full accent-cyan-400"
                    />
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider">Bayesian Parameters</h4>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Pre-Test Probability: {(simPreTestProb * 100).toFixed(0)}%</label>
                    <input
                      type="range"
                      min="0.01"
                      max="0.90"
                      step="0.01"
                      value={simPreTestProb}
                      onChange={(e) => setSimPreTestProb(parseFloat(e.target.value))}
                      className="w-full accent-purple-400"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Likelihood Ratio (LR+): {simLikelihoodRatio}x</label>
                    <input
                      type="range"
                      min="1"
                      max="30"
                      step="0.5"
                      value={simLikelihoodRatio}
                      onChange={(e) => setSimLikelihoodRatio(parseFloat(e.target.value))}
                      className="w-full accent-purple-400"
                    />
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2">Inference Output</h4>
                    <div className="space-y-2 text-xs">
                      <div className="p-2 rounded bg-slate-900 border border-slate-800 flex justify-between">
                        <span className="text-slate-400">Composite Risk Gradient:</span>
                        <span className={`font-mono font-bold ${computedCompositeScore >= 0.70 ? "text-rose-400" : "text-cyan-300"}`}>
                          {(computedCompositeScore * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="p-2 rounded bg-slate-900 border border-slate-800 flex justify-between">
                        <span className="text-slate-400">Bayesian Post-Test Prob:</span>
                        <span className="font-mono font-bold text-purple-300">{computedPostTest}%</span>
                      </div>
                      <div className="p-2 rounded bg-slate-900 border border-slate-800 flex justify-between">
                        <span className="text-slate-400">Clinical Alert Tier:</span>
                        <span className="font-bold text-rose-300">
                          {computedCompositeScore >= 0.70 ? "CRITICAL (Immediate Action)" : "MODERATE"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => toast.success("Simulated inference gradient saved to Clinical AI Audit Store.")}
                    className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg text-xs transition-all shadow-md mt-4"
                  >
                    Commit Inferred Gradient
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "protocols" && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
              <h3 className="text-sm font-bold text-rose-400 flex items-center gap-2">
                <Siren className="w-4 h-4" />
                Rapid Clinical AI Escalation Protocols
              </h3>
              <div className="space-y-2 text-xs">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-white block">Surviving Sepsis Campaign 1-Hour Bundle</span>
                    <span className="text-slate-400">Automatic blood culture orders, broad-spectrum antibiotic prep, and 30 mL/kg crystalloid fluid bolus.</span>
                  </div>
                  <button
                    onClick={() => triggerRapidIntervention("SEPSIS 1-HOUR BUNDLE")}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold"
                  >
                    Dispatch Bundle
                  </button>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-white block">Neurological Emergency Code (Target ICP &lt; 20 mmHg)</span>
                    <span className="text-slate-400">Hyperosmolar therapy (Mannitol / 3% NaCl), hyperventilation standby, urgent neurosurgical consult.</span>
                  </div>
                  <button
                    onClick={() => triggerRapidIntervention("CODE NEURO / ICP SPIKE")}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold"
                  >
                    Dispatch Code
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

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
                <Brain className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Full Neural Inference Dossier: {selectedCase.name}</h2>
                <p className="text-xs text-slate-400">ID: {selectedCase.id} | Model: {selectedCase.aiModel}</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <Row label="Primary Clinical Indication" value={selectedCase.primaryComplaint} />
              <Row label="AI Composite Risk Score" value={`${(selectedCase.compositeRiskScore * 100).toFixed(1)}%`} />
              <Row label="Estimated Lead Time" value={`${selectedCase.predictedOnsetHours} Hours`} />
              <Row label="Brier Calibration Score" value={selectedCase.brierScore} />
              <Row label="Post-Test Probability" value={`${(selectedCase.postTestProb * 100).toFixed(0)}%`} />
              <Row label="FDA SaMD Classification" value={selectedCase.fdaClassification} />
              <Row label="Attending Physician" value={selectedCase.attendingPhysician} />
              <Row label="Inference Timestamp" value={selectedCase.timestamp} />
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

      {emergencyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="bg-rose-950/90 border border-rose-500/60 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative text-rose-100">
            <button
              onClick={() => setEmergencyModal(null)}
              className="absolute top-4 right-4 text-rose-300 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 mb-4">
              <Siren className="w-8 h-8 text-rose-400 animate-bounce" />
              <div>
                <h2 className="text-xl font-black text-white">{emergencyModal}</h2>
                <p className="text-xs text-rose-200">Patient: {selectedCase.name} ({selectedCase.bed})</p>
              </div>
            </div>
            <p className="text-sm text-rose-100 mb-4">
              Clinical decision support intervention triggered. ICU Rapid Response and pharmacy satellites notified immediately.
            </p>
            <div className="p-3 bg-black/40 rounded-xl border border-rose-500/30 text-xs space-y-2 mb-6">
              <div>• Composite Risk: <b>{(selectedCase.compositeRiskScore * 100).toFixed(0)}%</b></div>
              <div>• Serum Lactate: <b>{selectedCase.lactate} mmol/L</b></div>
              <div>• NEWS2 Index: <b>{selectedCase.news2Score}</b></div>
            </div>
            <button
              onClick={() => {
                toast.success(`Protocol ${emergencyModal} execution confirmed.`);
                setEmergencyModal(null);
              }}
              className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-extrabold rounded-xl text-xs transition-all shadow-lg"
            >
              Acknowledge & Confirm Protocol
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
