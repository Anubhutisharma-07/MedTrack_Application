import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Brain,
  Activity,
  Cpu,
  Eye,
  FileText,
  Search,
  RefreshCw,
  Zap,
  ShieldCheck,
  CheckCircle2,
  X,
  Sliders,
  Sparkles,
  BarChart3,
  Layers,
  Server,
  AlertTriangle,
  Microscope,
  Stethoscope,
  HeartPulse,
  Dna,
  FileCheck,
  Globe,
  Radio,
  Flame,
  Maximize2,
  Clock,
  Terminal,
  Share2,
  Award,
  BookOpen,
  SlidersHorizontal,
  ChevronRight,
  ShieldAlert,
  Database,
  Crosshair
} from "lucide-react";

/**
 * BiomedicalAiDiagnosticsOverwatchPage Component
 *
 * High-Assurance Enterprise Biomedical AI Diagnostics & Clinical Overwatch Command Center.
 * Architected with 13 Advanced Clinical AI Subsystems:
 * 1. Radiological DICOM 3D Neural Inference Matrix
 * 2. Histopathology Digital Whole-Slide Imaging (WSI) Classifier
 * 3. Genomic Sequencing & Precision Oncology Workbench
 * 4. Cardiovascular 12-Lead ECG Deep Learning Engine
 * 5. Neurological Continuous EEG & Ischemia Overwatch
 * 6. Ophthalmic OCT Retinal Layer AI Scanner
 * 7. Dermatological Melanoma Multispectral Classifier
 * 8. Pharmacogenomic CYP450 Drug Response Simulator
 * 9. Clinical Natural Language Processing (NLP) Entity Extractor
 * 10. Explainable AI (XAI) Grad-CAM Feature Attribution Engine
 * 11. Federated Learning Privacy-Preserving Mesh Node
 * 12. FDA SaMD Model Drift & Bias Audit Ledger
 * 13. Real-Time Clinical Decision Support System (CDSS) Advisory
 */
export default function BiomedicalAiDiagnosticsOverwatchPage() {
  const [activeTab, setActiveTab] = useState("RADIOLOGY_3D");
  const [searchTerm, setSearchTerm] = useState("");
  const [severityFilter, setSeverityFilter] = useState("ALL");
  const [notification, setNotification] = useState({ type: "", message: "" });

  // Modal States
  const [dicomInspectModal, setDicomInspectModal] = useState(null);
  const [wsiInspectModal, setWsiInspectModal] = useState(null);
  const [genomicInspectModal, setGenomicInspectModal] = useState(null);
  const [ecgInspectModal, setEcgInspectModal] = useState(null);
  const [eegInspectModal, setEegInspectModal] = useState(null);
  const [octInspectModal, setOctInspectModal] = useState(null);
  const [dermaInspectModal, setDermaInspectModal] = useState(null);
  const [pharmaInspectModal, setPharmaInspectModal] = useState(null);
  const [nlpInspectModal, setNlpInspectModal] = useState(null);
  const [xaiInspectModal, setXaiInspectModal] = useState(null);
  const [federatedModal, setFederatedModal] = useState(false);
  const [samdAuditModal, setSamdAuditModal] = useState(null);
  const [cdssAdvisoryModal, setCdssAdvisoryModal] = useState(null);

  // =========================================================================
  // 1. RADIOLOGICAL DICOM 3D INFERENCE STATE
  // =========================================================================
  const [dicomScans, setDicomScans] = useState([
    {
      scanId: "DICOM-CT-9014",
      patientId: "PAT-88102-VANCE",
      modality: "Chest CT 3D Contrast",
      aiModel: "MedTrack-BioLLM-v4.2-ResNet3D",
      pathologyFinding: "Acute Pulmonary Embolism & Right Ventricular Strain",
      confidence: 0.992,
      hounsfieldUnits: "+65 HU (High Density Thrombus)",
      severity: "CRITICAL_TRIAGE",
      timestamp: "2026-08-16 11:30:00"
    },
    {
      scanId: "DICOM-MRI-8812",
      patientId: "PAT-77401-ROSTOVA",
      modality: "Brain MRI FLAIR T2",
      aiModel: "NeuroNet-Segmenter-v2.1",
      pathologyFinding: "Acute Ischemic Lesion (Left Middle Cerebral Artery Territory)",
      confidence: 0.984,
      hounsfieldUnits: "Volume: 14.2 cm³ Penumbra Tissue",
      severity: "HIGH_URGENCY",
      timestamp: "2026-08-16 11:15:00"
    },
    {
      scanId: "DICOM-XRAY-5510",
      patientId: "PAT-66109-MILLER",
      modality: "Chest Radiograph AP View",
      aiModel: "PneumoDet-VGG19",
      pathologyFinding: "Right Lower Lobe Consolidation (Bacterial Pneumonia)",
      confidence: 0.941,
      hounsfieldUnits: "Opacity Density: Moderate",
      severity: "MEDIUM_ADVISORY",
      timestamp: "2026-08-16 10:45:00"
    },
    {
      scanId: "DICOM-CT-4412",
      patientId: "PAT-55201-THORNE",
      modality: "Abdominal Pelvic CT Triple Phase",
      aiModel: "OncoSegment-3D-v3.0",
      pathologyFinding: "Hepatic Lesion (Lesion 2.4cm - Suspicious for HCC)",
      confidence: 0.978,
      hounsfieldUnits: "+45 HU Arterial Phase Washout",
      severity: "HIGH_URGENCY",
      timestamp: "2026-08-16 09:30:00"
    },
    {
      scanId: "DICOM-MRI-3301",
      patientId: "PAT-44109-JENKINS",
      modality: "Lumbar Spine MRI T1/T2",
      aiModel: "SpineScan-ML-v1.8",
      pathologyFinding: "L4-L5 Disc Herniation with Nerve Root Compression",
      confidence: 0.965,
      hounsfieldUnits: "Sub-millimeter Canal Stenosis",
      severity: "MEDIUM_ADVISORY",
      timestamp: "2026-08-16 08:20:00"
    }
  ]);

  // =========================================================================
  // 2. HISTOPATHOLOGY DIGITAL SLIDE CLASSIFIER STATE
  // =========================================================================
  const [wsiSlides, setWsiSlides] = useState([
    {
      slideId: "WSI-PATH-401",
      specimenType: "Breast Core Needle Biopsy",
      stainType: "Hematoxylin & Eosin (H&E) + Ki-67",
      tumorType: "Invasive Ductal Carcinoma (Grade III)",
      mitosisCount: "24 mitoses per 10 HPF",
      ki67Index: "42.5% Proliferation High",
      aiConfidence: 0.989,
      status: "PATHOLOGIST_REVIEW_REQUIRED"
    },
    {
      slideId: "WSI-PATH-402",
      specimenType: "Prostate Radical Resection",
      stainType: "H&E Stain Digital 40x Scan",
      tumorType: "Prostate Adenocarcinoma (Gleason 4+3=7)",
      mitosisCount: "12 mitoses per 10 HPF",
      ki67Index: "18.2% Moderate",
      aiConfidence: 0.976,
      status: "CONFIRMED_BY_AI"
    }
  ]);

  // =========================================================================
  // 3. GENOMIC SEQUENCING & PRECISION ONCOLOGY STATE
  // =========================================================================
  const [genomicVariants, setGenomicVariants] = useState([
    {
      sampleId: "GEN-SEQ-901",
      geneTarget: "EGFR exon 19 deletion (p.E746_A750del)",
      variantType: "Somatic Pathogenic Driver Mutation",
      variantAlleleFreq: "34.8% VAF",
      matchedTherapy: "Osimertinib (Tagrisso) 3rd Gen TKI",
      fdaTier: "Tier 1A Companion Diagnostic",
      crisprOffTargetRisk: "LOW (<0.01%)"
    },
    {
      sampleId: "GEN-SEQ-902",
      geneTarget: "BRAF V600E (p.Val600Glu)",
      variantType: "Oncogenic Kinase Activation",
      variantAlleleFreq: "48.2% VAF",
      matchedTherapy: "Dabrafenib + Trametinib Dual Combination",
      fdaTier: "Tier 1A Precision Oncology",
      crisprOffTargetRisk: "LOW (<0.02%)"
    }
  ]);

  // =========================================================================
  // 4. CARDIOVASCULAR ECG DEEP LEARNING STATE
  // =========================================================================
  const [ecgReadings, setEcgReadings] = useState([
    {
      ecgId: "ECG-12LEAD-901",
      patientName: "Robert Hayes (Bed 12 ICU)",
      classification: "Acute ST-Elevation Myocardial Infarction (STEMI - Anterolateral)",
      qtcInterval: "482 ms (Prolonged)",
      arrhythmiaFlags: "Frequent Ventricular Premature Complexes (VPCs)",
      aiAlertLevel: "CRITICAL_CODE_STEMI",
      timestamp: "2026-08-16 11:32:00"
    },
    {
      ecgId: "ECG-12LEAD-902",
      patientName: "Clara Oswald (Bed 04 Cardiac)",
      classification: "Atrial Fibrillation with Rapid Ventricular Response (RVR)",
      qtcInterval: "440 ms (Normal)",
      arrhythmiaFlags: "Irregularly Irregular R-R Interval",
      aiAlertLevel: "HIGH_URGENCY",
      timestamp: "2026-08-16 11:28:00"
    }
  ]);

  // =========================================================================
  // 5. NEUROLOGICAL CONTINUOUS EEG & STROKE STATE
  // =========================================================================
  const [eegStreams, setEegStreams] = useState([
    {
      streamId: "EEG-CHANNEL-64-A",
      patient: "Eleanor Vance (ICU Bed 01)",
      status: "Non-Convulsive Status Epilepticus (NCSE)",
      spikeFrequency: "4.5 Hz Periodic Discharges",
      aspectScore: "ASPECTS 8/10 Ischemia",
      aiConfidence: 0.995,
      alert: "IMMEDIATE_ANTIEPILEPTIC_STEPUP"
    }
  ]);

  // Handlers
  const handleTriggerInferencePipeline = (scanId) => {
    setNotification({
      type: "success",
      message: `Re-ran 3D Neural Inference on ${scanId}. Confidence updated to 0.996 with Grad-CAM saliency alignment.`
    });
  };

  const handleSignOffAiAdvisory = (scanId) => {
    setDicomScans((prev) =>
      prev.map((s) =>
        s.scanId === scanId ? { ...s, severity: "PHYSICIAN_APPROVED" } : s
      )
    );
    setNotification({
      type: "success",
      message: `Physician electronic signature applied to AI diagnostic recommendation for ${scanId}. EHR synced.`
    });
  };

  // Filtered Scans List
  const filteredDicomScans = useMemo(() => {
    return dicomScans.filter((s) => {
      const matchSearch =
        s.scanId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.patientId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.modality.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.pathologyFinding.toLowerCase().includes(searchTerm.toLowerCase());

      const matchSeverity =
        severityFilter === "ALL" ||
        (severityFilter === "CRITICAL" && s.severity.includes("CRITICAL")) ||
        (severityFilter === "APPROVED" && s.severity.includes("APPROVED"));

      return matchSearch && matchSeverity;
    });
  }, [dicomScans, searchTerm, severityFilter]);

  return (
    <div className="w-full min-h-screen bg-slate-950 text-slate-100 font-sans p-4 md:p-8 space-y-6">
      
      {/* 1. Page Header */}
      <div className="max-w-7xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-purple-400 bg-purple-500/10 border border-purple-500/20 rounded-full flex items-center gap-1.5 font-mono">
                <Brain size={13} className="animate-pulse" /> BIOMEDICAL AI DIAGNOSTICS & OVERWATCH
              </span>
              <span className="px-3 py-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-1">
                <ShieldCheck size={13} /> FDA 510(k) SaMD AUDITED
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Biomedical AI Diagnostics & Clinical Decision Command Station
            </h1>
            <p className="text-slate-400 text-sm max-w-3xl leading-relaxed">
              Real-time deep learning inference for 3D DICOM radiology, histopathology whole-slide imaging, genomic variant interpretation, 12-lead ECG arrhythmia classification, and continuous EEG stroke overwatch.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full lg:w-auto">
            <button
              type="button"
              onClick={() => setFederatedModal(true)}
              className="w-full lg:w-auto px-5 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-2xl transition shadow-lg shadow-purple-600/25 flex items-center justify-center gap-2"
            >
              <RefreshCw size={16} /> Sync Federated AI Mesh
            </button>
          </div>
        </div>

        {/* Global Notifications */}
        {notification.message && (
          <div className="mt-6 p-4 rounded-2xl text-xs font-bold flex items-center justify-between bg-purple-500/10 border border-purple-500/30 text-purple-300">
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
            { id: "RADIOLOGY_3D", label: "3D DICOM Radiology AI", icon: Brain },
            { id: "HISTOPATHOLOGY_WSI", label: "Histopathology WSI", icon: Microscope },
            { id: "GENOMIC_PRECISION", label: "Genomic Oncology AI", icon: Dna },
            { id: "CARDIO_ECG", label: "12-Lead ECG AI", icon: HeartPulse },
            { id: "NEURO_EEG", label: "EEG Stroke Overwatch", icon: Activity },
            { id: "OPHTHALMIC_OCT", label: "Ophthalmic OCT Scanner", icon: Eye },
            { id: "DERMA_MELANOMA", label: "Dermatological AI", icon: Flame },
            { id: "PHARMACOGENOMICS", label: "CYP450 Pharmacogenomics", icon: Stethoscope },
            { id: "CLINICAL_NLP", label: "Clinical EHR NLP", icon: FileText },
            { id: "EXPLAINABLE_XAI", label: "Grad-CAM XAI Saliency", icon: Sparkles },
            { id: "FEDERATED_MESH", label: "Federated Privacy Mesh", icon: Globe },
            { id: "FDA_SAMD_AUDIT", label: "FDA SaMD Compliance", icon: FileCheck },
            { id: "CDSS_ADVISORY", label: "CDSS Real-Time Alerts", icon: ShieldAlert }
          ].map((tab) => {
            const IconComp = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
                  activeTab === tab.id
                    ? "bg-purple-600 text-white shadow-lg shadow-purple-600/20"
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
          MODULE 1: RADIOLOGY 3D DICOM AI
          ========================================================================= */}
      {activeTab === "RADIOLOGY_3D" && (
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-2xl text-xs">
            <div className="relative w-full sm:w-80">
              <Search size={14} className="absolute left-3 top-3 text-slate-500" />
              <input
                type="text"
                placeholder="Search DICOM ID, patient, pathology..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-bold uppercase text-[10px]">Filter Triage:</span>
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="ALL">ALL SCANS</option>
                <option value="CRITICAL">CRITICAL TRIAGE</option>
                <option value="APPROVED">PHYSICIAN APPROVED</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDicomScans.map((s) => (
              <div
                key={s.scanId}
                className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl hover:border-purple-500/40 transition flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 text-[11px] font-bold font-mono text-purple-400 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                      {s.scanId}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full border ${
                        s.severity.includes("CRITICAL")
                          ? "bg-rose-500/20 text-rose-400 border-rose-500/30 animate-pulse"
                          : "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                      }`}
                    >
                      {s.severity}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-white font-mono leading-snug">{s.patientId}</h3>
                    <p className="text-[11px] text-slate-400 font-sans mt-0.5">{s.modality}</p>
                  </div>

                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl space-y-1 text-xs font-mono">
                    <div className="text-purple-300 font-bold leading-tight">{s.pathologyFinding}</div>
                    <div className="flex justify-between text-slate-400 text-[10px] pt-1">
                      <span>Density Profile:</span>
                      <span className="text-amber-300">{s.hounsfieldUnits}</span>
                    </div>
                  </div>

                  <div className="space-y-1 text-xs font-mono">
                    <div className="flex justify-between text-slate-400">
                      <span>AI Model:</span>
                      <span className="text-slate-300">{s.aiModel}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Confidence:</span>
                      <span className="text-emerald-400 font-bold">{(s.confidence * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setDicomInspectModal(s)}
                    className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs flex items-center gap-1 transition"
                  >
                    <Eye size={13} /> View 3D Heatmap
                  </button>
                  {s.severity.includes("CRITICAL") && (
                    <button
                      type="button"
                      onClick={() => handleSignOffAiAdvisory(s.scanId)}
                      className="py-2 px-3 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-xl font-bold text-xs flex items-center gap-1 transition"
                    >
                      <CheckCircle2 size={13} /> MD Sign-Off
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          MODULE 2: HISTOPATHOLOGY WSI
          ========================================================================= */}
      {activeTab === "HISTOPATHOLOGY_WSI" && (
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 font-mono text-xs">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-white flex items-center gap-2 font-sans">
                <Microscope size={18} className="text-purple-400" /> Histopathology Digital Whole-Slide Imaging (WSI) Classifier
              </h3>
              <button
                type="button"
                onClick={() => setWsiInspectModal({ slideId: "WSI-PATH-401" })}
                className="px-3 py-1.5 bg-purple-600/20 text-purple-300 border border-purple-500/30 rounded-xl font-bold font-sans text-xs"
              >
                Inspect Digital Slide Heatmap
              </button>
            </div>

            <div className="space-y-3">
              {wsiSlides.map((w) => (
                <div key={w.slideId} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex justify-between items-center">
                  <div>
                    <span className="text-purple-300 font-bold text-sm">{w.slideId} • {w.specimenType}</span>
                    <p className="text-slate-300 text-[11px] font-sans mt-0.5">Tumor: {w.tumorType} | Ki-67: {w.ki67Index}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-emerald-400 font-bold block">{w.status}</span>
                    <span className="text-slate-400 text-[10px]">Confidence: {(w.aiConfidence * 100).toFixed(1)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODULE 3: GENOMIC PRECISION ONCOLOGY
          ========================================================================= */}
      {activeTab === "GENOMIC_PRECISION" && (
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 font-mono text-xs">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-white flex items-center gap-2 font-sans">
                <Dna size={18} className="text-emerald-400" /> Genomic Sequencing & Precision Oncology Workbench
              </h3>
              <button
                type="button"
                onClick={() => setGenomicInspectModal({ sampleId: "GEN-SEQ-901" })}
                className="px-3 py-1.5 bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 rounded-xl font-bold font-sans text-xs"
              >
                Inspect Somatic Driver Variants
              </button>
            </div>

            <div className="space-y-3">
              {genomicVariants.map((g) => (
                <div key={g.sampleId} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
                  <div className="flex justify-between items-center text-emerald-400 font-bold">
                    <span>{g.sampleId} • {g.geneTarget}</span>
                    <span className="bg-emerald-500/20 px-2.5 py-0.5 rounded-lg border border-emerald-500/30 text-[10px]">{g.fdaTier}</span>
                  </div>
                  <div className="text-slate-300 text-xs font-sans">Matched Therapy: {g.matchedTherapy}</div>
                  <div className="text-purple-300 text-[11px]">Variant Allele Frequency: {g.variantAlleleFreq} | CRISPR Off-Target: {g.crisprOffTargetRisk}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODULE 4: CARDIO ECG
          ========================================================================= */}
      {activeTab === "CARDIO_ECG" && (
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 font-mono text-xs">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-white flex items-center gap-2 font-sans">
                <HeartPulse size={18} className="text-rose-400" /> Cardiovascular 12-Lead ECG Deep Learning Engine
              </h3>
              <button
                type="button"
                onClick={() => setEcgInspectModal({ ecgId: "ECG-12LEAD-901" })}
                className="px-3 py-1.5 bg-rose-600/20 text-rose-300 border border-rose-500/30 rounded-xl font-bold font-sans text-xs"
              >
                Inspect 12-Lead Waveform ST-Elevation
              </button>
            </div>

            <div className="space-y-3">
              {ecgReadings.map((e) => (
                <div key={e.ecgId} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex justify-between items-center">
                  <div>
                    <span className="text-rose-400 font-bold">{e.ecgId} • {e.patientName}</span>
                    <p className="text-slate-300 text-[11px] font-sans mt-0.5">Classification: {e.classification}</p>
                    <p className="text-slate-500 text-[10px]">Flags: {e.arrhythmiaFlags}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-rose-400 font-bold block">{e.aiAlertLevel}</span>
                    <span className="text-slate-400 text-[10px]">QTc: {e.qtcInterval}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODULE 5: NEURO EEG STROKE
          ========================================================================= */}
      {activeTab === "NEURO_EEG" && (
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 font-mono text-xs">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-white flex items-center gap-2 font-sans">
                <Activity size={18} className="text-purple-400" /> Neurological Continuous EEG & Stroke Ischemia Overwatch
              </h3>
              <button
                type="button"
                onClick={() => setEegInspectModal({ streamId: "EEG-CHANNEL-64-A" })}
                className="px-3 py-1.5 bg-purple-600/20 text-purple-300 border border-purple-500/30 rounded-xl font-bold font-sans text-xs"
              >
                Inspect 64-Channel EEG Spectral Density
              </button>
            </div>

            <div className="space-y-3">
              {eegStreams.map((eg) => (
                <div key={eg.streamId} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex justify-between items-center">
                  <div>
                    <span className="text-purple-300 font-bold">{eg.streamId} • {eg.patient}</span>
                    <p className="text-slate-300 text-[11px] font-sans mt-0.5">Status: {eg.status}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-rose-400 font-bold block">{eg.alert}</span>
                    <span className="text-slate-400 text-[10px]">{eg.aspectScore}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODULE 6: OPHTHALMIC OCT
          ========================================================================= */}
      {activeTab === "OPHTHALMIC_OCT" && (
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 font-mono text-xs">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-white flex items-center gap-2 font-sans">
                <Eye size={18} className="text-cyan-400" /> Ophthalmic OCT Retinal Layer AI Scanner
              </h3>
              <button
                type="button"
                onClick={() => setOctInspectModal({ octId: "OCT-RETINA-01" })}
                className="px-3 py-1.5 bg-cyan-600/20 text-cyan-300 border border-cyan-500/30 rounded-xl font-bold font-sans text-xs"
              >
                Inspect Macular Thickness Scan
              </button>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
              <div className="flex justify-between"><span>Retinal Thickness Index:</span><strong className="text-cyan-300">342 µm (Macular Edema Stage II)</strong></div>
              <div className="flex justify-between"><span>Diabetic Retinopathy Grading:</span><strong className="text-amber-400">Severe Non-Proliferative (NPDR)</strong></div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODULE 7: DERMATOLOGICAL AI
          ========================================================================= */}
      {activeTab === "DERMA_MELANOMA" && (
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 font-mono text-xs">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-white flex items-center gap-2 font-sans">
                <Flame size={18} className="text-amber-400" /> Dermatological Melanoma Multispectral Classifier
              </h3>
              <button
                type="button"
                onClick={() => setDermaInspectModal({ dermaId: "DERM-LESION-901" })}
                className="px-3 py-1.5 bg-amber-600/20 text-amber-300 border border-amber-500/30 rounded-xl font-bold font-sans text-xs"
              >
                Inspect ABCD Lesion Boundary
              </button>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
              <div className="flex justify-between"><span>Dermoscopy ABCD Score:</span><strong className="text-rose-400">7.8 / 10.0 (High Malignancy Risk)</strong></div>
              <div className="flex justify-between"><span>Clark Level Staging:</span><strong className="text-amber-300">Level IV Invasion Depth (1.8mm)</strong></div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODULE 8: PHARMACOGENOMICS
          ========================================================================= */}
      {activeTab === "PHARMACOGENOMICS" && (
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 font-mono text-xs">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-white flex items-center gap-2 font-sans">
                <Stethoscope size={18} className="text-emerald-400" /> Pharmacogenomic CYP450 Drug Response Simulator
              </h3>
              <button
                type="button"
                onClick={() => setPharmaInspectModal({ pharmaId: "PGX-CYP2D6-01" })}
                className="px-3 py-1.5 bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 rounded-xl font-bold font-sans text-xs"
              >
                Simulate Dose Kinetics
              </button>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
              <div className="flex justify-between"><span>CYP2D6 Genotype:</span><strong className="text-emerald-300">*4/*4 Poor Metabolizer (PM)</strong></div>
              <div className="flex justify-between"><span>Warfarin / Clopidogrel Sensitivity:</span><strong className="text-rose-400">HIGH BLEEDING RISK - DOSE REDUCTION 50%</strong></div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODULE 9: CLINICAL NLP
          ========================================================================= */}
      {activeTab === "CLINICAL_NLP" && (
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 font-mono text-xs">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-white flex items-center gap-2 font-sans">
                <FileText size={18} className="text-purple-400" /> Clinical Natural Language Processing (NLP) Entity Extractor
              </h3>
              <button
                type="button"
                onClick={() => setNlpInspectModal({ nlpId: "NLP-SNOMED-901" })}
                className="px-3 py-1.5 bg-purple-600/20 text-purple-300 border border-purple-500/30 rounded-xl font-bold font-sans text-xs"
              >
                Inspect EHR Ontological Mapping
              </button>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
              <div className="flex justify-between"><span>Parsed EHR Note SNOMED-CT Code:</span><strong className="text-purple-300">SNOMED-CT 22298006 (Myocardial Infarction)</strong></div>
              <div className="flex justify-between"><span>ICD-11 Binding Accuracy:</span><strong className="text-emerald-400">99.4% Ontological Mapping</strong></div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODULE 10: EXPLAINABLE XAI
          ========================================================================= */}
      {activeTab === "EXPLAINABLE_XAI" && (
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 font-mono text-xs">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-white flex items-center gap-2 font-sans">
                <Sparkles size={18} className="text-amber-400" /> Explainable AI (XAI) Grad-CAM Feature Attribution Engine
              </h3>
              <button
                type="button"
                onClick={() => setXaiInspectModal({ xaiId: "XAI-SHAP-901" })}
                className="px-3 py-1.5 bg-amber-600/20 text-amber-300 border border-amber-500/30 rounded-xl font-bold font-sans text-xs"
              >
                View Feature Weight Breakdown
              </button>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
              <div className="flex justify-between"><span>Saliency Map Alignment Score:</span><strong className="text-amber-300">0.982 Grad-CAM Pixel Overlap</strong></div>
              <div className="flex justify-between"><span>SHAP Feature Attribution:</span><strong className="text-emerald-400">Radiological Margin Sharpness (42% Weight)</strong></div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODULE 11: FEDERATED MESH
          ========================================================================= */}
      {activeTab === "FEDERATED_MESH" && (
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 font-mono text-xs">
            <h3 className="text-base font-bold text-white flex items-center gap-2 font-sans">
              <Globe size={18} className="text-purple-400" /> Federated Learning Privacy-Preserving Mesh Node
            </h3>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
              <div className="flex justify-between"><span>Differential Privacy Noise (ε):</span><strong className="text-purple-300">ε = 0.5 (Strict Privacy Guaranteed)</strong></div>
              <div className="flex justify-between"><span>Active Mesh Nodes:</span><strong className="text-emerald-400">14 Partner Academic Medical Centers</strong></div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODULE 12: FDA SAMD AUDIT
          ========================================================================= */}
      {activeTab === "FDA_SAMD_AUDIT" && (
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 font-mono text-xs">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-white flex items-center gap-2 font-sans">
                <FileCheck size={18} className="text-emerald-400" /> FDA SaMD Model Drift & Bias Audit Ledger
              </h3>
              <button
                type="button"
                onClick={() => setSamdAuditModal({ auditId: "SAMD-510K-901" })}
                className="px-3 py-1.5 bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 rounded-xl font-bold font-sans text-xs"
              >
                Generate 510(k) Compliance Report
              </button>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
              <div className="flex justify-between"><span>Model Drift Metric (PSI):</span><strong className="text-emerald-400">PSI = 0.02 (Stable Model Distribution)</strong></div>
              <div className="flex justify-between"><span>510(k) Clearance ID:</span><strong className="text-cyan-300">K260816-SaMD-AI-01</strong></div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODULE 13: CDSS ADVISORY
          ========================================================================= */}
      {activeTab === "CDSS_ADVISORY" && (
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 font-mono text-xs">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-white flex items-center gap-2 font-sans">
                <ShieldAlert size={18} className="text-rose-400" /> Real-Time Clinical Decision Support System (CDSS) Advisory
              </h3>
              <button
                type="button"
                onClick={() => setCdssAdvisoryModal({ advisoryId: "CDSS-ADV-901" })}
                className="px-3 py-1.5 bg-rose-600/20 text-rose-300 border border-rose-500/30 rounded-xl font-bold font-sans text-xs"
              >
                Inspect Critical Alert Protocol
              </button>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
              <div className="flex justify-between"><span>Active Advisory #01:</span><strong className="text-rose-400">High-Risk Acute Ischemia Step-Up (ENFORCING)</strong></div>
              <div className="flex justify-between"><span>HL7 FHIR Sync:</span><strong className="text-emerald-400">FHIR R4 DiagnosticReport Resource Synced</strong></div>
            </div>
          </div>
        </div>
      )}

      {/* DICOM Inspect Modal */}
      {dicomInspectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full text-slate-100 space-y-4 shadow-2xl font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-purple-400 font-sans">3D DICOM AI Saliency Heatmap</h3>
              <button type="button" onClick={() => setDicomInspectModal(null)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
              <div>Scan Identifier: <strong className="text-white">{dicomInspectModal.scanId}</strong></div>
              <div>Finding: <span className="text-purple-300">{dicomInspectModal.pathologyFinding}</span></div>
              <div>Confidence: <span className="text-emerald-400 font-bold">{(dicomInspectModal.confidence * 100).toFixed(1)}%</span></div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setDicomInspectModal(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-xs font-sans"
              >
                Close Heatmap
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WSI Inspect Modal */}
      {wsiInspectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full text-slate-100 space-y-4 shadow-2xl font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-purple-400 font-sans">Histopathology WSI Slide Heatmap</h3>
              <button type="button" onClick={() => setWsiInspectModal(null)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
              <div>Slide Identifier: <strong className="text-white">{wsiInspectModal.slideId}</strong></div>
              <div>Classification: <span className="text-purple-300 font-bold">INVASIVE DUCTAL CARCINOMA GRADE III</span></div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setWsiInspectModal(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-xs font-sans"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Genomic Inspect Modal */}
      {genomicInspectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full text-slate-100 space-y-4 shadow-2xl font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-emerald-400 font-sans">Somatic Mutation Variant Inspection</h3>
              <button type="button" onClick={() => setGenomicInspectModal(null)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
              <div>Sample ID: <strong className="text-white">{genomicInspectModal.sampleId}</strong></div>
              <div>Gene Target: <span className="text-emerald-300 font-bold">EGFR EXON 19 DELETION</span></div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setGenomicInspectModal(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-xs font-sans"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ECG Inspect Modal */}
      {ecgInspectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full text-slate-100 space-y-4 shadow-2xl font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-rose-400 font-sans">12-Lead ECG Waveform Saliency</h3>
              <button type="button" onClick={() => setEcgInspectModal(null)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
              <div>ECG Reading: <strong className="text-white">{ecgInspectModal.ecgId}</strong></div>
              <div>ST Elevation: <span className="text-rose-400 font-bold">ANTEROLATERAL STEMI DETECTED</span></div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setEcgInspectModal(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-xs font-sans"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Federated Modal */}
      {federatedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full text-slate-100 space-y-4 shadow-2xl font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-purple-400 font-sans">Sync Federated AI Mesh</h3>
              <button type="button" onClick={() => setFederatedModal(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
              <div>Federated Round: <strong className="text-white">ROUND-884-GLOBAL</strong></div>
              <div>Privacy Noise: <span className="text-emerald-400 font-bold">DIFFERENTIAL_PRIVACY_ENFORCED</span></div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => {
                  setFederatedModal(false);
                  setNotification({ type: "success", message: "Federated weights synchronized with 14 Academic Medical Centers!" });
                }}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold text-xs font-sans shadow-lg shadow-purple-600/20"
              >
                Execute Weights Exchange
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FDA SaMD Audit Modal */}
      {samdAuditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full text-slate-100 space-y-4 shadow-2xl font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-emerald-400 font-sans">FDA 510(k) SaMD Model Drift Audit</h3>
              <button type="button" onClick={() => setSamdAuditModal(null)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
              <div>Audit Record: <strong className="text-white">{samdAuditModal.auditId}</strong></div>
              <div>Population Stability Index (PSI): <span className="text-emerald-400 font-bold">PSI = 0.02 (COMPLIANT)</span></div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSamdAuditModal(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-xs font-sans"
              >
                Close Audit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CDSS Advisory Modal */}
      {cdssAdvisoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full text-slate-100 space-y-4 shadow-2xl font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-rose-400 font-sans">Real-Time CDSS Advisory Rule</h3>
              <button type="button" onClick={() => setCdssAdvisoryModal(null)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
              <div>Advisory ID: <strong className="text-white">{cdssAdvisoryModal.advisoryId}</strong></div>
              <div>Action: <span className="text-rose-400 font-bold">DISPATCH CRITICAL CARE TEAM</span></div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setCdssAdvisoryModal(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-xs font-sans"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
