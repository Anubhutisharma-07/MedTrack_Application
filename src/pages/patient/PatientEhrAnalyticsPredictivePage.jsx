import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Activity,
  Heart,
  Brain,
  Thermometer,
  ShieldCheck,
  CheckCircle2,
  X,
  Search,
  RefreshCw,
  Zap,
  AlertTriangle,
  FileText,
  TrendingUp,
  BarChart3,
  Sliders,
  Sparkles,
  Layers,
  Database,
  Crosshair,
  Maximize2,
  Clock,
  Terminal,
  Share2,
  Award,
  BookOpen,
  ChevronRight,
  ShieldAlert,
  UserCheck,
  Stethoscope,
  Pill,
  Radio,
  FileCheck,
  Globe,
  Flame,
  Dna
} from "lucide-react";

/**
 * PatientEhrAnalyticsPredictivePage Component
 *
 * High-Assurance Enterprise Patient EHR Telemetry Analytics & Chronic Disease Predictive Engine.
 * Architected with 13 Advanced EHR & Telemetry Subsystems:
 * 1. Longitudinal Vital Sign Telemetry Stream
 * 2. 30-Day Hospital Readmission Predictive Engine (LACE / HOSPITAL Score)
 * 3. Sepsis Early Warning System (qSOFA / NEWS2 Engine)
 * 4. Diabetic Glycemic Kinetic Simulator (CGM / HbA1c Trajectory)
 * 5. Cardiovascular Heart Failure (NYHA / LVEF) Monitor
 * 6. Renal Function & Chronic Kidney Disease (CKD) Staging Engine
 * 7. Pulmonary COPD & Asthma Airway Dynamic Monitor
 * 8. Oncology Treatment Toxicity & Efficacy Index (CTCAE)
 * 9. Polypharmacy Adverse Drug Event (ADE) Matrix
 * 10. Social Determinants of Health (SDOH) Risk Profile
 * 11. HL7 FHIR R4 Interoperability Synchronizer
 * 12. Remote Patient Monitoring (RPM) IoT Sensor Mesh
 * 13. Clinical Trial Eligibility & Protocol Matching Engine
 */
export default function PatientEhrAnalyticsPredictivePage() {
  const [activeTab, setActiveTab] = useState("VITAL_TELEMETRY");
  const [searchTerm, setSearchTerm] = useState("");
  const [riskFilter, setRiskFilter] = useState("ALL");
  const [notification, setNotification] = useState({ type: "", message: "" });

  // Modal States
  const [readmissionModal, setReadmissionModal] = useState(null);
  const [sepsisModal, setSepsisModal] = useState(null);
  const [cgmModal, setCgmModal] = useState(null);
  const [cardioModal, setCardioModal] = useState(null);
  const [renalModal, setRenalModal] = useState(null);
  const [copdModal, setCopdModal] = useState(null);
  const [oncoModal, setOncoModal] = useState(null);
  const [polypharmModal, setPolypharmModal] = useState(null);
  const [sdohModal, setSdohModal] = useState(null);
  const [fhirSyncModal, setFhirSyncModal] = useState(false);
  const [rpmIotModal, setRpmIotModal] = useState(null);
  const [trialMatchModal, setTrialMatchModal] = useState(null);

  // =========================================================================
  // 1. LONGITUDINAL VITAL SIGN TELEMETRY STATE
  // =========================================================================
  const [patientVitals, setPatientVitals] = useState([
    {
      patientId: "PAT-EHR-901",
      patientName: "Eleanor Vance (Age 68)",
      primaryDiagnosis: "Type II Diabetes & Congestive Heart Failure (NYHA Class III)",
      bpTrend: "148/92 mmHg (Elevated)",
      heartRate: "94 bpm (Sinus Tachycardia)",
      spO2: "93% (Ambient Air)",
      temp: "37.4 °C",
      hrvMs: "28 ms (Suppressed)",
      triageRisk: "HIGH_READMISSION_RISK",
      lastUpdated: "2026-08-16 11:35:00"
    },
    {
      patientId: "PAT-EHR-902",
      patientName: "Marcus Aurelius (Age 74)",
      primaryDiagnosis: "Hypertension & Chronic Kidney Disease (CKD Stage IIIb)",
      bpTrend: "135/84 mmHg (Controlled)",
      heartRate: "72 bpm (Normal)",
      spO2: "97% (Ambient Air)",
      temp: "36.8 °C",
      hrvMs: "45 ms (Normal)",
      triageRisk: "MODERATE_RISK",
      lastUpdated: "2026-08-16 11:20:00"
    },
    {
      patientId: "PAT-EHR-903",
      patientName: "Sophia Martinez (Age 52)",
      primaryDiagnosis: "Severe COPD Exacerbation & Nocturnal Hypoxia",
      bpTrend: "128/78 mmHg (Normal)",
      heartRate: "88 bpm (Normal)",
      spO2: "89% (Nasal Cannula 2L)",
      temp: "38.1 °C (Low Grade Fever)",
      hrvMs: "32 ms (Slight Suppression)",
      triageRisk: "HIGH_READMISSION_RISK",
      lastUpdated: "2026-08-16 10:50:00"
    },
    {
      patientId: "PAT-EHR-904",
      patientName: "Arthur Pendelton (Age 81)",
      primaryDiagnosis: "Post-Operative Hip Arthroplasty & Atrial Fibrillation",
      bpTrend: "118/74 mmHg (Normal)",
      heartRate: "102 bpm (Atrial Fib RVR)",
      spO2: "96% (Ambient Air)",
      temp: "36.9 °C",
      hrvMs: "22 ms (Suppressed)",
      triageRisk: "CRITICAL_SEPSIS_WATCH",
      lastUpdated: "2026-08-16 09:40:00"
    },
    {
      patientId: "PAT-EHR-905",
      patientName: "Gwendolyn Croft (Age 61)",
      primaryDiagnosis: "Metastatic Non-Small Cell Lung Cancer (Stage IV)",
      bpTrend: "110/70 mmHg",
      heartRate: "82 bpm",
      spO2: "95%",
      temp: "37.1 °C",
      hrvMs: "38 ms",
      triageRisk: "MODERATE_RISK",
      lastUpdated: "2026-08-16 08:30:00"
    }
  ]);

  // =========================================================================
  // 2. READMISSION PREDICTIVE ENGINE STATE
  // =========================================================================
  const [readmissionScores, setReadmissionScores] = useState([
    {
      patientId: "PAT-EHR-901",
      laceIndex: "13 / 19 (High Risk >10)",
      hospitalScore: "8 / 10 (Critical Readmission Trajectory)",
      probability: "78.4% 30-Day Probability",
      topDrivers: "Previous 3 Admissions, High Polypharmacy Index, CHF Exacerbation"
    },
    {
      patientId: "PAT-EHR-903",
      laceIndex: "11 / 19 (High Risk)",
      hospitalScore: "7 / 10 (Elevated)",
      probability: "64.2% 30-Day Probability",
      topDrivers: "Nocturnal Desaturation, Frequent ER Visits"
    }
  ]);

  // Handlers
  const handleTriggerFhirSync = () => {
    setNotification({
      type: "success",
      message: "HL7 FHIR R4 Bundle synchronized across 12 regional EHR provider nodes."
    });
  };

  const handleApplyIntervention = (patientId) => {
    setPatientVitals((prev) =>
      prev.map((p) =>
        p.patientId === patientId ? { ...p, triageRisk: "STABILIZED_CLINICAL_PLAN" } : p
      )
    );
    setNotification({
      type: "success",
      message: `Clinical care team dispatched & intervention plan committed for ${patientId}.`
    });
  };

  const filteredVitals = useMemo(() => {
    return patientVitals.filter((p) => {
      const matchSearch =
        p.patientId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.primaryDiagnosis.toLowerCase().includes(searchTerm.toLowerCase());

      const matchRisk =
        riskFilter === "ALL" ||
        (riskFilter === "HIGH" && p.triageRisk.includes("HIGH")) ||
        (riskFilter === "STABILIZED" && p.triageRisk.includes("STABILIZED"));

      return matchSearch && matchRisk;
    });
  }, [patientVitals, searchTerm, riskFilter]);

  return (
    <div className="w-full min-h-screen bg-slate-950 text-slate-100 font-sans p-4 md:p-8 space-y-6">
      
      {/* 1. Page Header */}
      <div className="max-w-7xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 rounded-full flex items-center gap-1.5 font-mono">
                <Activity size={13} className="animate-pulse" /> PATIENT EHR TELEMETRY & PREDICTIVE ANALYTICS
              </span>
              <span className="px-3 py-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-1">
                <ShieldCheck size={13} /> HL7 FHIR R4 COMPLIANT
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Patient EHR Telemetry & Chronic Disease Risk Command Hub
            </h1>
            <p className="text-slate-400 text-sm max-w-3xl leading-relaxed">
              Longitudinal patient telemetry streams, 30-day hospital readmission predictors, qSOFA sepsis early warning scores, continuous CGM glycemic kinetics, and polypharmacy adverse event matrix.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full lg:w-auto">
            <button
              type="button"
              onClick={() => setFhirSyncModal(true)}
              className="w-full lg:w-auto px-5 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-2xl transition shadow-lg shadow-cyan-600/25 flex items-center justify-center gap-2"
            >
              <RefreshCw size={16} /> Sync HL7 FHIR R4 Bundle
            </button>
          </div>
        </div>

        {/* Global Notifications */}
        {notification.message && (
          <div className="mt-6 p-4 rounded-2xl text-xs font-bold flex items-center justify-between bg-cyan-500/10 border border-cyan-500/30 text-cyan-300">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} />
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
            { id: "VITAL_TELEMETRY", label: "Longitudinal Vitals", icon: Activity },
            { id: "READMISSION_ENGINE", label: "30-Day Readmission Risk", icon: TrendingUp },
            { id: "SEPSIS_WARNING", label: "qSOFA / NEWS2 Sepsis", icon: AlertTriangle },
            { id: "GLYCEMIC_CGM", label: "CGM Diabetic Kinetics", icon: Flame },
            { id: "CARDIO_FAILURE", label: "NYHA Heart Failure", icon: Heart },
            { id: "RENAL_CKD", label: "Renal eGFR / CKD", icon: Stethoscope },
            { id: "COPD_AIRWAY", label: "COPD Airway Monitor", icon: WindIcon },
            { id: "ONCOLOGY_TOXICITY", label: "Oncology CTCAE Index", icon: Dna },
            { id: "POLYPHARMACY_ADE", label: "Polypharmacy ADE", icon: Pill },
            { id: "SDOH_PROFILE", label: "SDOH Social Index", icon: Globe },
            { id: "FHIR_SYNC", label: "FHIR R4 Interop", icon: Database },
            { id: "RPM_IOT_MESH", label: "RPM IoT Telemetry", icon: Radio },
            { id: "CLINICAL_TRIALS", label: "Trial Eligibility AI", icon: UserCheck }
          ].map((tab) => {
            const IconComp = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
                  activeTab === tab.id
                    ? "bg-cyan-600 text-white shadow-lg shadow-cyan-600/20"
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
          MODULE 1: VITAL TELEMETRY STREAM
          ========================================================================= */}
      {activeTab === "VITAL_TELEMETRY" && (
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-2xl text-xs">
            <div className="relative w-full sm:w-80">
              <Search size={14} className="absolute left-3 top-3 text-slate-500" />
              <input
                type="text"
                placeholder="Search patient ID, name, diagnosis..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-bold uppercase text-[10px]">Risk Tier:</span>
              <select
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value)}
                className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="ALL">ALL PATIENTS</option>
                <option value="HIGH">HIGH READMISSION RISK</option>
                <option value="STABILIZED">STABILIZED</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredVitals.map((p) => (
              <div
                key={p.patientId}
                className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl hover:border-cyan-500/40 transition flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 text-[11px] font-bold font-mono text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 rounded-lg">
                      {p.patientId}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full border ${
                        p.triageRisk.includes("HIGH") || p.triageRisk.includes("CRITICAL")
                          ? "bg-rose-500/20 text-rose-400 border-rose-500/30 animate-pulse"
                          : "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                      }`}
                    >
                      {p.triageRisk}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-white font-mono leading-snug">{p.patientName}</h3>
                    <p className="text-[11px] text-slate-400 font-sans mt-0.5">{p.primaryDiagnosis}</p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-slate-950 border border-slate-800 rounded-2xl text-xs font-mono">
                    <div>
                      <span className="text-slate-500 text-[10px] block">BP Trend</span>
                      <span className="text-amber-300 font-bold">{p.bpTrend}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block">Heart Rate</span>
                      <span className="text-rose-400 font-bold">{p.heartRate}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block">SpO2 Level</span>
                      <span className="text-cyan-300 font-bold">{p.spO2}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block">HRV</span>
                      <span className="text-purple-300 font-bold">{p.hrvMs}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setReadmissionModal(p)}
                    className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs flex items-center gap-1 transition"
                  >
                    <TrendingUp size={13} /> View Risk Model
                  </button>
                  {p.triageRisk.includes("HIGH") && (
                    <button
                      type="button"
                      onClick={() => handleApplyIntervention(p.patientId)}
                      className="py-2 px-3 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-xl font-bold text-xs flex items-center gap-1 transition"
                    >
                      <CheckCircle2 size={13} /> Commit Care Plan
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          MODULE 2: READMISSION PREDICTIVE ENGINE
          ========================================================================= */}
      {activeTab === "READMISSION_ENGINE" && (
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 font-mono text-xs">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-white flex items-center gap-2 font-sans">
                <TrendingUp size={18} className="text-cyan-400" /> 30-Day Hospital Readmission Predictive Engine (LACE / HOSPITAL Score)
              </h3>
              <button
                type="button"
                onClick={() => setReadmissionModal({ patientName: "Eleanor Vance", primaryDiagnosis: "CHF Class III", triageRisk: "HIGH_READMISSION_RISK" })}
                className="px-3 py-1.5 bg-cyan-600/20 text-cyan-300 border border-cyan-500/30 rounded-xl font-bold font-sans text-xs"
              >
                Inspect Readmission Driver Weights
              </button>
            </div>

            <div className="space-y-3">
              {readmissionScores.map((r) => (
                <div key={r.patientId} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex justify-between items-center">
                  <div>
                    <span className="text-cyan-300 font-bold">{r.patientId}</span>
                    <p className="text-slate-300 text-[11px] font-sans mt-0.5">Drivers: {r.topDrivers}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-rose-400 font-bold block">{r.probability}</span>
                    <span className="text-slate-400 text-[10px]">LACE: {r.laceIndex}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODULE 3: SEPSIS EARLY WARNING
          ========================================================================= */}
      {activeTab === "SEPSIS_WARNING" && (
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 font-mono text-xs">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-white flex items-center gap-2 font-sans">
                <AlertTriangle size={18} className="text-rose-400" /> Sepsis Early Warning System (qSOFA / NEWS2 Engine)
              </h3>
              <button
                type="button"
                onClick={() => setSepsisModal({ sepsisId: "SEP-WARN-901" })}
                className="px-3 py-1.5 bg-rose-600/20 text-rose-300 border border-rose-500/30 rounded-xl font-bold font-sans text-xs"
              >
                Inspect qSOFA Sepsis Criteria
              </button>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
              <div className="flex justify-between"><span>NEWS2 Score:</span><strong className="text-rose-400">8 (HIGH SEPSIS WARNING)</strong></div>
              <div className="flex justify-between"><span>Serum Lactate:</span><strong className="text-amber-300">3.4 mmol/L (Elevated)</strong></div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODULE 4: GLYCEMIC CGM KINETICS
          ========================================================================= */}
      {activeTab === "GLYCEMIC_CGM" && (
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 font-mono text-xs">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-white flex items-center gap-2 font-sans">
                <Flame size={18} className="text-amber-400" /> Diabetic Glycemic Kinetic Simulator (CGM / HbA1c Trajectory)
              </h3>
              <button
                type="button"
                onClick={() => setCgmModal({ cgmId: "CGM-KINETICS-01" })}
                className="px-3 py-1.5 bg-amber-600/20 text-amber-300 border border-amber-500/30 rounded-xl font-bold font-sans text-xs"
              >
                Simulate Insulin Bolus Impact
              </button>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
              <div className="flex justify-between"><span>Current Glucose (CGM):</span><strong className="text-amber-400">214 mg/dL (Postprandial Spike)</strong></div>
              <div className="flex justify-between"><span>Time-In-Range (TIR 70-180 mg/dL):</span><strong className="text-cyan-300">62.4% (Target &gt;70%)</strong></div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODULE 5: CARDIO HEART FAILURE
          ========================================================================= */}
      {activeTab === "CARDIO_FAILURE" && (
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 font-mono text-xs">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-white flex items-center gap-2 font-sans">
                <Heart size={18} className="text-rose-400" /> Cardiovascular Heart Failure (NYHA / LVEF) Monitor
              </h3>
              <button
                type="button"
                onClick={() => setCardioModal({ cardioId: "CARDIO-NYHA-01" })}
                className="px-3 py-1.5 bg-rose-600/20 text-rose-300 border border-rose-500/30 rounded-xl font-bold font-sans text-xs"
              >
                Inspect Ejection Fraction History
              </button>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
              <div className="flex justify-between"><span>LVEF (Ejection Fraction):</span><strong className="text-rose-400">32% (HFrEF Severe)</strong></div>
              <div className="flex justify-between"><span>NT-proBNP Biomarker:</span><strong className="text-amber-300">4,200 pg/mL (Decompensation Alert)</strong></div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODULE 6: RENAL CKD
          ========================================================================= */}
      {activeTab === "RENAL_CKD" && (
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 font-mono text-xs">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-white flex items-center gap-2 font-sans">
                <Stethoscope size={18} className="text-emerald-400" /> Renal Function & Chronic Kidney Disease (CKD) Staging Engine
              </h3>
              <button
                type="button"
                onClick={() => setRenalModal({ renalId: "RENAL-EGFR-01" })}
                className="px-3 py-1.5 bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 rounded-xl font-bold font-sans text-xs"
              >
                Inspect eGFR Slope Decline
              </button>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
              <div className="flex justify-between"><span>eGFR Rate:</span><strong className="text-amber-300">42 mL/min/1.73m² (CKD Stage IIIb)</strong></div>
              <div className="flex justify-between"><span>Serum Creatinine:</span><strong className="text-cyan-300">1.9 mg/dL</strong></div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODULE 7: COPD AIRWAY
          ========================================================================= */}
      {activeTab === "COPD_AIRWAY" && (
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 font-mono text-xs">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-white flex items-center gap-2 font-sans">
                <Activity size={18} className="text-purple-400" /> Pulmonary COPD & Asthma Airway Dynamic Monitor
              </h3>
              <button
                type="button"
                onClick={() => setCopdModal({ copdId: "COPD-AIRWAY-01" })}
                className="px-3 py-1.5 bg-purple-600/20 text-purple-300 border border-purple-500/30 rounded-xl font-bold font-sans text-xs"
              >
                Inspect Nocturnal Oximetry
              </button>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
              <div className="flex justify-between"><span>FEV1/FVC Ratio:</span><strong className="text-purple-300">54% (GOLD Stage III Severe Obstruction)</strong></div>
              <div className="flex justify-between"><span>Nocturnal SpO2 Dips:</span><strong className="text-rose-400">14 episodes &lt;88%</strong></div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODULE 8: ONCOLOGY TOXICITY
          ========================================================================= */}
      {activeTab === "ONCOLOGY_TOXICITY" && (
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 font-mono text-xs">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-white flex items-center gap-2 font-sans">
                <Dna size={18} className="text-emerald-400" /> Oncology Treatment Toxicity & Efficacy Index (CTCAE)
              </h3>
              <button
                type="button"
                onClick={() => setOncoModal({ oncoId: "ONCO-CTCAE-01" })}
                className="px-3 py-1.5 bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 rounded-xl font-bold font-sans text-xs"
              >
                Inspect ANC Nadir Curve
              </button>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
              <div className="flex justify-between"><span>Absolute Neutrophil Count (ANC):</span><strong className="text-rose-400">0.8 x 10⁹/L (Grade 3 Neutropenia)</strong></div>
              <div className="flex justify-between"><span>Immunotherapy Toxicity:</span><strong className="text-amber-300">Grade 1 Immune-Mediated Thyroiditis</strong></div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODULE 9: POLYPHARMACY ADE
          ========================================================================= */}
      {activeTab === "POLYPHARMACY_ADE" && (
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 font-mono text-xs">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-white flex items-center gap-2 font-sans">
                <Pill size={18} className="text-rose-400" /> Polypharmacy Adverse Drug Event (ADE) Matrix
              </h3>
              <button
                type="button"
                onClick={() => setPolypharmModal({ adeId: "ADE-MATRIX-01" })}
                className="px-3 py-1.5 bg-rose-600/20 text-rose-300 border border-rose-500/30 rounded-xl font-bold font-sans text-xs"
              >
                Inspect Drug Interaction Matrix
              </button>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
              <div className="flex justify-between"><span>Anticholinergic Risk Scale (ARS):</span><strong className="text-amber-300">Score 4 (High Cognitive Burden)</strong></div>
              <div className="flex justify-between"><span>BEERS Criteria Warning:</span><strong className="text-rose-400">Benzodiazepine + Opioid Co-Prescription Alert</strong></div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODULE 10: SDOH SOCIAL INDEX
          ========================================================================= */}
      {activeTab === "SDOH_PROFILE" && (
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 font-mono text-xs">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-white flex items-center gap-2 font-sans">
                <Globe size={18} className="text-cyan-400" /> Social Determinants of Health (SDOH) Risk Profile
              </h3>
              <button
                type="button"
                onClick={() => setSdohModal({ sdohId: "SDOH-BARRIER-01" })}
                className="px-3 py-1.5 bg-cyan-600/20 text-cyan-300 border border-cyan-500/30 rounded-xl font-bold font-sans text-xs"
              >
                Inspect Community Resource Links
              </button>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
              <div className="flex justify-between"><span>Transportation Barrier Index:</span><strong className="text-amber-300">HIGH (No personal vehicle, rural transit)</strong></div>
              <div className="flex justify-between"><span>Food Insecurity Metric:</span><strong className="text-emerald-400">Low Risk (Community Supported)</strong></div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODULE 11: FHIR SYNC
          ========================================================================= */}
      {activeTab === "FHIR_SYNC" && (
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 font-mono text-xs">
            <h3 className="text-base font-bold text-white flex items-center gap-2 font-sans">
              <Database size={18} className="text-purple-400" /> HL7 FHIR R4 Interoperability Synchronizer
            </h3>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
              <div className="flex justify-between"><span>FHIR R4 Observation Bundle:</span><strong className="text-emerald-400">SYNCHRONIZED (2,410 Resources)</strong></div>
              <div className="flex justify-between"><span>CDA Architecture Compliance:</span><strong className="text-cyan-300">VALIDATED</strong></div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODULE 12: RPM IOT MESH
          ========================================================================= */}
      {activeTab === "RPM_IOT_MESH" && (
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 font-mono text-xs">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-white flex items-center gap-2 font-sans">
                <Radio size={18} className="text-cyan-400" /> Remote Patient Monitoring (RPM) IoT Sensor Mesh
              </h3>
              <button
                type="button"
                onClick={() => setRpmIotModal({ sensorId: "RPM-PATCH-142" })}
                className="px-3 py-1.5 bg-cyan-600/20 text-cyan-300 border border-cyan-500/30 rounded-xl font-bold font-sans text-xs"
              >
                Inspect Wearable Battery & Link
              </button>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
              <div className="flex justify-between"><span>Connected Patch Sensors:</span><strong className="text-cyan-300">142 Active Wearables</strong></div>
              <div className="flex justify-between"><span>Fall Detection Radar:</span><strong className="text-emerald-400">ARMED & ONLINE</strong></div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODULE 13: CLINICAL TRIALS
          ========================================================================= */}
      {activeTab === "CLINICAL_TRIALS" && (
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 font-mono text-xs">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-white flex items-center gap-2 font-sans">
                <UserCheck size={18} className="text-emerald-400" /> Clinical Trial Eligibility & Protocol Matching Engine
              </h3>
              <button
                type="button"
                onClick={() => setTrialMatchModal({ trialId: "NCT0488102" })}
                className="px-3 py-1.5 bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 rounded-xl font-bold font-sans text-xs"
              >
                Inspect Patient Consent Workflow
              </button>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
              <div className="flex justify-between"><span>Matched Protocol:</span><strong className="text-emerald-300">NCT0488102 - Phase III SGLT2i in CKD Stage III</strong></div>
              <div className="flex justify-between"><span>Inclusion Criteria:</span><strong className="text-cyan-300">100% Match Score</strong></div>
            </div>
          </div>
        </div>
      )}

      {/* Readmission Risk Modal */}
      {readmissionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full text-slate-100 space-y-4 shadow-2xl font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-cyan-400 font-sans">30-Day Readmission Risk Breakdown</h3>
              <button type="button" onClick={() => setReadmissionModal(null)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
              <div>Patient: <strong className="text-white">{readmissionModal.patientName}</strong></div>
              <div>Primary Diagnosis: <span className="text-slate-300">{readmissionModal.primaryDiagnosis}</span></div>
              <div>Risk Tier: <span className="text-rose-400 font-bold">{readmissionModal.triageRisk}</span></div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setReadmissionModal(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-xs font-sans"
              >
                Close Model
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sepsis Warning Modal */}
      {sepsisModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full text-slate-100 space-y-4 shadow-2xl font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-rose-400 font-sans">qSOFA Sepsis Early Warning Protocol</h3>
              <button type="button" onClick={() => setSepsisModal(null)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
              <div>Sepsis Record: <strong className="text-white">{sepsisModal.sepsisId}</strong></div>
              <div>Intervention: <span className="text-rose-400 font-bold">INITIATE 3-HOUR SEPSIS BUNDLE</span></div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSepsisModal(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-xs font-sans"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CGM Modal */}
      {cgmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full text-slate-100 space-y-4 shadow-2xl font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-amber-400 font-sans">Continuous Glucose Kinetic Simulator</h3>
              <button type="button" onClick={() => setCgmModal(null)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
              <div>Sensor ID: <strong className="text-white">{cgmModal.cgmId}</strong></div>
              <div>Estimated HbA1c: <span className="text-amber-300 font-bold">7.4% (Sub-optimal)</span></div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setCgmModal(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-xs font-sans"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FHIR Sync Modal */}
      {fhirSyncModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full text-slate-100 space-y-4 shadow-2xl font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-cyan-400 font-sans">Sync HL7 FHIR R4 Bundle</h3>
              <button type="button" onClick={() => setFhirSyncModal(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
              <div>Target Endpoint: <strong className="text-white">https://fhir.medtrack.org/r4/Bundle</strong></div>
              <div>Resources to Sync: <span className="text-cyan-300 font-bold">2,410 Clinical Observations</span></div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => {
                  setFhirSyncModal(false);
                  handleTriggerFhirSync();
                }}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold text-xs font-sans shadow-lg shadow-cyan-600/20"
              >
                Execute Sync
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

function WindIcon(props) {
  return <Activity {...props} />;
}
