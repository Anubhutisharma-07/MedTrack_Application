import React, { useState, useEffect, useMemo } from "react";
import {
  Activity,
  Dna,
  ShieldAlert,
  AlertTriangle,
  Zap,
  Gauge,
  Sliders,
  SlidersHorizontal,
  TrendingUp,
  TrendingDown,
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
  Award,
  Sparkles,
  Droplets,
  HeartPulse,
  Shield,
  HelpCircle
} from "lucide-react";
import { downloadCsv } from "../../utils/csv";
import { useKindToasts, KindToastTray } from "../../components/common/HubToasts";

// ==========================================
// SEED PRECISION ONCOLOGY PATIENTS
// ==========================================
const SEED_ONCOLOGY_PATIENTS = [
  {
    id: "PT-ONCO-301",
    name: "Eleanor Whitmore",
    age: 61,
    gender: "Female",
    bed: "ONCO-CLINIC-A1",
    tumorType: "Non-Small Cell Lung Cancer (Adenocarcinoma)",
    stage: "Stage IVB (Brain & Bone Metastases)",
    primaryGenomicDriver: "EGFR Exon 19 del (E746_A750del)",
    secondaryResistance: "EGFR T790M (VAF 28.4%) + MET Amplification (CNV 6.2)",
    tmbScore: 14.2, // mut/Mb (High >= 10)
    tmbCategory: "TMB-High",
    msiStatus: "MSS (Microsatellite Stable)",
    pdl1Tps: 65, // % Tumor Proportion Score
    pdl1Category: "High Expressor (TPS >= 50%)",
    ctDnaMaf: 4.2, // % Mutant Allele Fraction in plasma
    mrdStatus: "POSITIVE",
    hrdScore: 22, // Homologous Recombination Deficiency
    dpydStatus: "Normal Metabolizer (*1/*1)",
    ugt1a1Status: "Normal (*1/*1)",
    targetedTherapy: "Osimertinib 80mg Daily + Savolitinib 300mg",
    nccnRecommendation: "NCCN Level 1A / ESMO ESCAT Tier I-A",
    trialEligibilityCount: 4,
    anc: 2400, // /mcL (Absolute Neutrophil Count)
    platelets: 185000,
    uricAcid: 5.8, // mg/dL
    potassium: 4.3, // mEq/L
    phosphorus: 3.6, // mg/dL
    status: "ON_THERAPY_RESPONSE",
    attendingOncologist: "Dr. Helena Sterling, MD, PhD (Thoracic Precision Oncology)"
  },
  {
    id: "PT-ONCO-302",
    name: "Carlos Mendoza",
    age: 54,
    gender: "Male",
    bed: "ONCO-CLINIC-B4",
    tumorType: "Colorectal Adenocarcinoma (Right Colon)",
    stage: "Stage IV (Liver Oligometastases)",
    primaryGenomicDriver: "KRAS p.G12C (c.34G>T, VAF 42.1%)",
    secondaryResistance: "PIK3CA p.E545K (VAF 12.0%)",
    tmbScore: 48.6, // mut/Mb (Ultra-High)
    tmbCategory: "TMB-Ultra-High",
    msiStatus: "MSI-H / dMMR (MLH1/PMS2 Loss)",
    pdl1Tps: 85,
    pdl1Category: "Combined Positive Score (CPS) 55",
    ctDnaMaf: 8.9,
    mrdStatus: "POSITIVE",
    hrdScore: 18,
    dpydStatus: "Intermediate Metabolizer (*1/*2A) - 50% Fluoropyrimidine Dose Reduction",
    ugt1a1Status: "Poor Metabolizer (*28/*28)",
    targetedTherapy: "Sotorasib + Panitumumab + Pembrolizumab",
    nccnRecommendation: "NCCN Level 1A / ESMO ESCAT Tier I-A",
    trialEligibilityCount: 7,
    anc: 1900,
    platelets: 142000,
    uricAcid: 7.1,
    potassium: 4.8,
    phosphorus: 4.2,
    status: "IMMUNOTHERAPY_ACTIVE",
    attendingOncologist: "Dr. Alexander Vance, MD (Gastrointestinal Oncology)"
  },
  {
    id: "PT-ONCO-303",
    name: "Siobhan Kelly",
    age: 49,
    gender: "Female",
    bed: "ONCO-CLINIC-C2",
    tumorType: "High-Grade Serous Ovarian Carcinoma",
    stage: "Stage IIIC (Peritoneal Carcinomatosis)",
    primaryGenomicDriver: "Germline BRCA1 c.5266dupC (p.Gln1756Profs*74)",
    secondaryResistance: "No Reversion Mutations Detected",
    tmbScore: 6.4,
    tmbCategory: "TMB-Low",
    msiStatus: "MSS",
    pdl1Tps: 5,
    pdl1Category: "Low Expressor",
    ctDnaMaf: 1.1,
    mrdStatus: "MINIMAL_DETECTABLE",
    hrdScore: 64, // High HRD >= 42
    dpydStatus: "Normal Metabolizer",
    ugt1a1Status: "Normal",
    targetedTherapy: "Olaparib 300mg BID Maintenance + Bevacizumab",
    nccnRecommendation: "NCCN Level 1A (PARP Inhibitor Synthetic Lethality)",
    trialEligibilityCount: 3,
    anc: 3100,
    platelets: 210000,
    uricAcid: 4.4,
    potassium: 4.1,
    phosphorus: 3.2,
    status: "COMPLETE_REMISSION_MAINTENANCE",
    attendingOncologist: "Dr. Helena Sterling, MD, PhD (Gynecologic Oncology)"
  },
  {
    id: "PT-ONCO-304",
    name: "Dmitri Volkov",
    age: 58,
    gender: "Male",
    bed: "ONCO-CLINIC-D5",
    tumorType: "Metastatic Cutaneous Melanoma",
    stage: "Stage IV M1d (CNS Metastases)",
    primaryGenomicDriver: "BRAF p.V600E (c.1799T>A, VAF 58.2%)",
    secondaryResistance: "NRAS Q61K Co-mutation (Emerging Clone VAF 4.8%)",
    tmbScore: 32.5,
    tmbCategory: "TMB-High",
    msiStatus: "MSS",
    pdl1Tps: 90,
    pdl1Category: "High Expressor",
    ctDnaMaf: 12.4,
    mrdStatus: "POSITIVE",
    hrdScore: 14,
    dpydStatus: "Normal Metabolizer",
    ugt1a1Status: "Normal",
    targetedTherapy: "Encorafenib + Binimetinib followed by Nivolumab + Ipilimumab",
    nccnRecommendation: "NCCN Level 1A / ESMO ESCAT Tier I-A",
    trialEligibilityCount: 5,
    anc: 850, // Mild Neutropenia Alert
    platelets: 88000,
    uricAcid: 8.9, // Elevated TLS Risk
    potassium: 5.4,
    phosphorus: 5.1,
    status: "WARNING_TLS_RISK",
    attendingOncologist: "Dr. Alexander Vance, MD (Melanoma & Immunotherapy)"
  },
  {
    id: "PT-ONCO-305",
    name: "Aria Thorne",
    age: 36,
    gender: "Female",
    bed: "ONCO-CLINIC-E1",
    tumorType: "Secretory Carcinoma / Triple Negative Breast Carcinoma",
    stage: "Stage IIIA",
    primaryGenomicDriver: "NTRK3-ETV6 Gene Fusion (t(12;15)(p13;q25))",
    secondaryResistance: "NTRK3 G623R Solvent-Front Mutation (Negative)",
    tmbScore: 4.8,
    tmbCategory: "TMB-Low",
    msiStatus: "MSS",
    pdl1Tps: 0,
    pdl1Category: "Negative",
    ctDnaMaf: 0.05,
    mrdStatus: "NEGATIVE",
    hrdScore: 12,
    dpydStatus: "Normal Metabolizer",
    ugt1a1Status: "Normal",
    targetedTherapy: "Larotrectinib 100mg BID (TRK Inhibitor)",
    nccnRecommendation: "FDA Tumor-Agnostic Approval / NCCN Level 1A",
    trialEligibilityCount: 2,
    anc: 4200,
    platelets: 265000,
    uricAcid: 4.1,
    potassium: 4.0,
    phosphorus: 3.5,
    status: "DEEP_MOLECULAR_RESPONSE",
    attendingOncologist: "Dr. Helena Sterling, MD, PhD (Breast & Molecular Oncology)"
  }
];

// ==========================================
// ONCOLOGY EMERGENCY PROTOCOLS
// ==========================================
const ONCOLOGY_EMERGENCY_PROTOCOLS = [
  {
    code: "CODE-TLS-RASBURICASE",
    title: "Code TLS — Acute Tumor Lysis Syndrome Rescue Protocol",
    triggerCondition: "Uric Acid > 8.0 mg/dL, Potassium > 6.0 mEq/L, Phosphorus > 4.5 mg/dL, Calcium < 7.0 mg/dL (Cairo-Bishop Criteria)",
    targetAction: "Immediate Rasburicase 0.2 mg/kg IV stat, hyperhydration 3 L/m²/day without potassium, telemetry monitoring, ICU transfer",
    guideline: "ASCO & NCCN Guidelines for Tumor Lysis Syndrome Management 2026",
    level: "CRITICAL",
    color: "rose"
  },
  {
    code: "CODE-FEBRILE-NEUTROPENIA",
    title: "Code Febrile Neutropenia Stat Sepsis Protocol",
    triggerCondition: "Single temp >= 38.3°C (101°F) or >= 38.0°C over 1hr with Absolute Neutrophil Count (ANC) < 500 /mcL",
    targetAction: "Door-to-Antibiotic <= 60 min: IV Cefepime 2g or Piperacillin-Tazobactam 4.5g, blood cultures x 2 sets, G-CSF support",
    guideline: "IDSA & ESMO Clinical Practice Guidelines on Febrile Neutropenia",
    level: "CRITICAL",
    color: "rose"
  },
  {
    code: "CODE-IRAE-CRS-STEROIDS",
    title: "Immune-Related Adverse Event (irAE) / High-Grade Cytokine Release Syndrome (CRS)",
    triggerCondition: "Grade 3/4 Immune Colitis / Pneumonitis / Myocarditis or CAR-T/Bispecific CRS with Ferritin > 5000 ng/mL",
    targetAction: "High-dose Methylprednisolone 1-2 mg/kg/day IV, Tocilizumab 8 mg/kg IV (max 800mg), suspend checkpoint inhibitor",
    guideline: "SITC & NCCN Management of Immunotherapy-Related Toxicities",
    level: "HIGH",
    color: "purple"
  },
  {
    code: "CODE-SPINAL-COMPRESSION",
    title: "Malignant Epidural Spinal Cord Compression (MSCC) Emergency",
    triggerCondition: "New back pain with motor weakness, sensory level, or bowel/bladder autonomic dysfunction in metastatic cancer",
    targetAction: "Stat IV Dexamethasone 16mg bolus, emergent Whole-Spine MRI within 4 hours, Urgent Neurosurgery / Radiation Oncology consult",
    guideline: "NCCN Central Nervous System Cancers & Emergency Guidelines",
    level: "CRITICAL",
    color: "rose"
  }
];

// ==========================================
// MAIN COMPONENT
// ==========================================
export default function PrecisionOncologyHub() {
  const [patients, setPatients] = useState(SEED_ONCOLOGY_PATIENTS);
  const [selectedPatientId, setSelectedPatientId] = useState("PT-ONCO-301");
  const [activeTab, setActiveTab] = useState("genomics"); // genomics | liquid_biopsy | trials | pharmacogenomics | protocols | audit
  const [searchQuery, setSearchQuery] = useState("");
  const [stageFilter, setStageFilter] = useState("ALL");
  const [isSimulating, setIsSimulating] = useState(true);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [selectedEmergencyProtocol, setSelectedEmergencyProtocol] = useState(null);
  const [showCalculatorModal, setShowCalculatorModal] = useState(false);
  const [showPatientDetailModal, setShowPatientDetailModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  // Custom Molecular Calculator State
  const [calcInputs, setCalcInputs] = useState({
    tmbScore: 16.5,
    pdl1Tps: 70,
    ctDnaMaf: 3.8,
    hrdScore: 48,
    msiHigh: false,
    egfrDriver: true,
    krasDriver: false,
    brafDriver: false,
    ntrkFusion: false
  });

  const { toasts, addToast, removeToast } = useKindToasts();

  const selectedPatient = useMemo(() => {
    return patients.find((p) => p.id === selectedPatientId) || patients[0];
  }, [patients, selectedPatientId]);

  // Real-time telemetry simulation (ctDNA dynamics & laboratory monitoring)
  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      setPatients((prev) =>
        prev.map((p) => {
          const mafJitter = (Math.random() - 0.52) * 0.1;
          const newMaf = Math.max(0.01, +(p.ctDnaMaf + mafJitter).toFixed(2));
          const uricJitter = (Math.random() - 0.48) * 0.1;
          const newUric = Math.max(2.0, +(p.uricAcid + uricJitter).toFixed(1));

          let newStatus = p.status;
          if (newUric >= 8.5) {
            newStatus = "WARNING_TLS_RISK";
          } else if (p.anc < 1000) {
            newStatus = "WARNING_NEUTROPENIA";
          }

          return {
            ...p,
            ctDnaMaf: newMaf,
            uricAcid: newUric,
            status: newStatus
          };
        })
      );
    }, 3000);

    return () => clearInterval(interval);
  }, [isSimulating]);

  // Derived Molecular Modeling Results
  const calcResults = useMemo(() => {
    const { tmbScore, pdl1Tps, ctDnaMaf, hrdScore, msiHigh, egfrDriver, krasDriver, brafDriver, ntrkFusion } = calcInputs;
    
    // Immunotherapy response likelihood score (0 - 100)
    let ioScore = 0;
    if (msiHigh) ioScore += 45;
    if (tmbScore >= 20) ioScore += 35;
    else if (tmbScore >= 10) ioScore += 20;
    if (pdl1Tps >= 50) ioScore += 20;
    else if (pdl1Tps >= 1) ioScore += 10;
    ioScore = Math.min(99, ioScore);

    // Targeted therapy recommendation
    let targetClass = "Standard of Care / Chemotherapy";
    let tierNccn = "NCCN Tier 3";
    if (ntrkFusion) {
      targetClass = "TRK Inhibitor (Larotrectinib / Entrectinib)";
      tierNccn = "NCCN Level 1A (Tumor Agnostic)";
    } else if (egfrDriver) {
      targetClass = "3rd Gen EGFR TKI (Osimertinib ± MET Inhibitor)";
      tierNccn = "NCCN Level 1A";
    } else if (krasDriver) {
      targetClass = "KRAS G12C Inhibitor (Sotorasib / Adagrasib)";
      tierNccn = "NCCN Level 1A";
    } else if (brafDriver) {
      targetClass = "BRAF + MEK Doublet (Dabrafenib + Trametinib / Encorafenib + Binimetinib)";
      tierNccn = "NCCN Level 1A";
    } else if (hrdScore >= 42) {
      targetClass = "PARP Inhibitor (Olaparib / Niraparib / Rucaparib)";
      tierNccn = "NCCN Level 1A (HRD Synthetic Lethality)";
    }

    const mrdRisk = ctDnaMaf > 1.0 ? "High Clonal Recurrence Risk" : "Minimal Molecular Disease";

    return {
      ioScore,
      targetClass,
      tierNccn,
      mrdRisk
    };
  }, [calcInputs]);

  // Filter patients
  const filteredPatients = useMemo(() => {
    return patients.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.tumorType.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.primaryGenomicDriver.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStage = stageFilter === "ALL" || p.stage.includes(stageFilter);
      return matchesSearch && matchesStage;
    });
  }, [patients, searchQuery, stageFilter]);

  // Handle Protocol Triggers
  const handleTriggerEmergency = (proto) => {
    setSelectedEmergencyProtocol(proto);
    setShowEmergencyModal(true);
  };

  const handleConfirmProtocolExecution = () => {
    addToast(
      `🚨 ${selectedEmergencyProtocol.code} EXECUTED: Oncology Emergency Rapid Team Mobilized for ${selectedPatient.name} (${selectedPatient.bed}).`,
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
      Tumor_Type: p.tumorType,
      Stage: p.stage,
      Primary_Genomic_Driver: p.primaryGenomicDriver,
      Secondary_Resistance: p.secondaryResistance,
      TMB_mut_Mb: p.tmbScore,
      MSI_Status: p.msiStatus,
      PD_L1_TPS_Percent: p.pdl1Tps,
      ctDNA_MAF_Percent: p.ctDnaMaf,
      MRD_Status: p.mrdStatus,
      HRD_Score: p.hrdScore,
      DPYD_Metabolizer: p.dpydStatus,
      Targeted_Therapy: p.targetedTherapy,
      NCCN_Guideline_Tier: p.nccnRecommendation,
      ANC_per_mcL: p.anc,
      Uric_Acid_mg_dL: p.uricAcid,
      Status: p.status
    }));

    downloadCsv(dataToExport, `MedTrack_Precision_Oncology_Genomics_${new Date().toISOString().slice(0, 10)}.csv`);
    addToast("Precision Oncology genomic dossier exported successfully.", "success");
    setShowExportModal(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-6 font-sans">
      <KindToastTray toasts={toasts} onDismiss={removeToast} />

      {/* HEADER BAR */}
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border border-purple-500/30 text-purple-400">
              <Dna className="w-8 h-8 animate-pulse text-purple-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
                  Precision Oncology & Molecular Tumor Board Hub
                </h1>
                <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/30">
                  NGS MULTI-OMICS OVERWATCH
                </span>
              </div>
              <p className="text-xs md:text-sm text-slate-400 mt-0.5">
                Next-Gen Sequencing (NGS), Actionable Driver Alterations, ctDNA Liquid Biopsy MRD & NCCN/ESMO Targeted Therapy Matching
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
            {isSimulating ? "Streaming ctDNA Telemetry" : "Simulation Paused"}
          </button>

          <button
            onClick={() => setShowCalculatorModal(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/30 hover:bg-purple-500/20 transition-all"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Molecular Matcher
          </button>

          <button
            onClick={() => setShowExportModal(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            Audit Ledger
          </button>

          <button
            onClick={() => handleTriggerEmergency(ONCOLOGY_EMERGENCY_PROTOCOLS[0])}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-rose-600 to-rose-700 text-white shadow-lg shadow-rose-900/30 hover:from-rose-500 hover:to-rose-600 transition-all"
          >
            <Siren className="w-4 h-4 animate-bounce" />
            CODE TLS TRIGGER
          </button>
        </div>
      </header>

      {/* TOP AGGREGATE SUMMARY METRICS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 my-6">
        <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-3.5 backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Actionable Driver Found</span>
            <Dna className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-purple-400">100%</span>
            <span className="text-xs text-purple-300">5 / 5 Patients</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">EGFR, KRAS, BRAF, BRCA, NTRK</p>
        </div>

        <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-3.5 backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Mean TMB</span>
            <Zap className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-cyan-400">21.3</span>
            <span className="text-xs text-slate-400">mut/Mb</span>
          </div>
          <p className="text-[10px] text-cyan-300 mt-1">High Immunogenic Burden</p>
        </div>

        <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-3.5 backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>ctDNA MRD Positivity</span>
            <Activity className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-400">3 / 5</span>
            <span className="text-xs text-amber-300">Active Clones</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Liquid Biopsy Surveillance</p>
        </div>

        <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-3.5 backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Oncology Emergencies</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-rose-500">1</span>
            <span className="text-xs text-rose-400">Pt-304</span>
          </div>
          <p className="text-[10px] text-rose-400 mt-1">Elevated Uric Acid 8.9 (TLS)</p>
        </div>

        <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-3.5 backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Clinical Trial Matches</span>
            <Sparkles className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-400">21</span>
            <span className="text-xs text-emerald-300">Open Protocols</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Phase I/II Biomarker Trials</p>
        </div>

        <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-3.5 backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>NCCN / ESMO Tier 1A</span>
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-indigo-400">100%</span>
            <span className="text-xs text-indigo-300">Matched</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">FDA 21 CFR Part 11 / FHIR R4</p>
        </div>
      </div>

      {/* TWO-COLUMN MOLECULAR WORKSPACE */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: PATIENT ROSTER (4 cols) */}
        <div className="xl:col-span-4 space-y-4">
          
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-400" />
                Molecular Tumor Board Queue
              </h2>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-purple-400">
                {filteredPatients.length} Cases
              </span>
            </div>

            <div className="space-y-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search tumor type, gene mutation, patient..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-all"
                />
              </div>

              <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px]">
                {["ALL", "Stage IV", "Stage III", "Stage II"].map((stage) => (
                  <button
                    key={stage}
                    onClick={() => setStageFilter(stage)}
                    className={`px-2.5 py-1 rounded-md font-medium border transition-all ${
                      stageFilter === stage
                        ? "bg-purple-500/20 text-purple-300 border-purple-500/50"
                        : "bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800"
                    }`}
                  >
                    {stage}
                  </button>
                ))}
              </div>
            </div>

            {/* PATIENTS LIST */}
            <div className="mt-3 space-y-2.5 max-h-[560px] overflow-y-auto pr-1">
              {filteredPatients.map((p) => {
                const isSelected = p.id === selectedPatientId;
                const statusBadge =
                  p.status.includes("WARNING")
                    ? "bg-rose-500/20 text-rose-300 border-rose-500/50"
                    : p.status.includes("COMPLETE") || p.status.includes("DEEP")
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
                        <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{p.tumorType}</p>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusBadge}`}>
                        {p.stage.split(" ")[0]} {p.stage.split(" ")[1]}
                      </span>
                    </div>

                    <div className="mt-2.5 p-2 rounded bg-slate-900/80 border border-slate-800/80 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-purple-300 font-bold flex items-center gap-1">
                          <Dna className="w-3.5 h-3.5" />
                          {p.primaryGenomicDriver.split(" ")[0]} {p.primaryGenomicDriver.split(" ")[1]}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">TMB: {p.tmbScore}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-slate-800/60 text-center">
                      <div>
                        <span className="text-[10px] text-slate-500 block">ctDNA MAF</span>
                        <span className={`text-xs font-bold ${p.ctDnaMaf > 2.0 ? "text-amber-400" : "text-emerald-400"}`}>
                          {p.ctDnaMaf}%
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">PD-L1 TPS</span>
                        <span className="text-xs font-bold text-cyan-400">{p.pdl1Tps}%</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">Trials</span>
                        <span className="text-xs font-bold text-indigo-300">{p.trialEligibilityCount} Active</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* EMERGENCY PROTOCOLS QUICK ACCESS */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2 mb-2.5">
              <Siren className="w-4 h-4 text-rose-500" />
              Oncology Critical Directives
            </h3>
            <div className="space-y-2">
              {ONCOLOGY_EMERGENCY_PROTOCOLS.map((proto) => (
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

        {/* RIGHT COLUMN: DETAILED MOLECULAR PROFILE & TARGETED THERAPY (8 cols) */}
        <div className="xl:col-span-8 space-y-4">
          
          {/* PATIENT BANNER CARD */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 lg:p-5 relative overflow-hidden">
            <div className="absolute right-0 top-0 w-96 h-96 bg-gradient-to-bl from-purple-500/5 via-cyan-500/5 to-transparent pointer-events-none" />
            
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
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-rose-500/15 text-rose-300 border border-rose-500/40">
                    {selectedPatient.stage}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  <span className="font-semibold text-slate-400">Pathology:</span> {selectedPatient.tumorType}
                </p>
                <div className="flex flex-wrap items-center gap-4 mt-2 text-[11px] text-slate-400">
                  <span>Primary Driver: <strong className="text-purple-300">{selectedPatient.primaryGenomicDriver}</strong></span>
                  <span>MSI: <strong className="text-slate-200">{selectedPatient.msiStatus}</strong></span>
                  <span>Attending: <strong className="text-slate-200">{selectedPatient.attendingOncologist}</strong></span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setShowPatientDetailModal(true)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-all"
                >
                  <Eye className="w-3.5 h-3.5 text-purple-400" />
                  Full Genomic Dossier
                </button>
              </div>
            </div>

            {/* TAB NAVIGATION */}
            <div className="flex items-center gap-2 mt-5 border-b border-slate-800 overflow-x-auto text-xs">
              {[
                { id: "genomics", label: "Genomic Drivers & Biomarkers", icon: Dna },
                { id: "liquid_biopsy", label: "ctDNA Liquid Biopsy & MRD", icon: Activity },
                { id: "trials", label: "Matched Targeted Therapies", icon: Sparkles },
                { id: "pharmacogenomics", label: "Pharmacogenomics (PGx)", icon: Shield },
                { id: "protocols", label: "NCCN / ESMO Guidelines", icon: ShieldCheck }
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

          {/* TAB 1: GENOMIC DRIVERS & BIOMARKERS */}
          {activeTab === "genomics" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5">
                  <div className="flex items-center justify-between text-slate-400 text-xs">
                    <span>Tumor Mutational Burden</span>
                    <Zap className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div className="mt-1">
                    <span className="text-2xl font-black text-cyan-400">{selectedPatient.tmbScore}</span>
                    <span className="text-xs text-slate-400 ml-1">mut/Mb</span>
                  </div>
                  <span className="text-[10px] text-cyan-300 mt-1 block">{selectedPatient.tmbCategory}</span>
                </div>

                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5">
                  <div className="flex items-center justify-between text-slate-400 text-xs">
                    <span>PD-L1 Expression</span>
                    <Activity className="w-4 h-4 text-purple-400" />
                  </div>
                  <div className="mt-1">
                    <span className="text-2xl font-black text-purple-400">{selectedPatient.pdl1Tps}%</span>
                    <span className="text-xs text-slate-400 ml-1">TPS</span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">{selectedPatient.pdl1Category}</span>
                </div>

                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5">
                  <div className="flex items-center justify-between text-slate-400 text-xs">
                    <span>HRD Genomic Instability</span>
                    <Gauge className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div className="mt-1">
                    <span className={`text-2xl font-black ${selectedPatient.hrdScore >= 42 ? "text-emerald-400" : "text-slate-200"}`}>
                      {selectedPatient.hrdScore}
                    </span>
                    <span className="text-xs text-slate-400 ml-1">/ 100</span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    {selectedPatient.hrdScore >= 42 ? "HRD-Positive (PARPi Sensitive)" : "HRD-Negative"}
                  </span>
                </div>

                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5">
                  <div className="flex items-center justify-between text-slate-400 text-xs">
                    <span>Microsatellite Status</span>
                    <Shield className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="mt-1">
                    <span className={`text-lg font-black ${selectedPatient.msiStatus.includes("MSI-H") ? "text-emerald-400" : "text-slate-200"}`}>
                      {selectedPatient.msiStatus.split(" ")[0]}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">{selectedPatient.msiStatus}</span>
                </div>
              </div>

              {/* ACTIONABLE VARIANT PROFILE */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center justify-between">
                  <span>Comprehensive Somatic Variant Architecture (500+ Gene NGS Panel)</span>
                  <span className="text-[10px] text-slate-500">Coverage Depth: 1500x • Illumina NovaSeq 6000</span>
                </h3>

                <div className="space-y-3 text-xs">
                  <div className="p-3.5 rounded-lg bg-slate-950 border border-purple-500/30">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-purple-300 text-sm flex items-center gap-2">
                        <Dna className="w-4 h-4 text-purple-400" />
                        Primary Driver: {selectedPatient.primaryGenomicDriver}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 font-semibold border border-purple-500/30 text-[11px]">
                        Pathogenic / Actionable
                      </span>
                    </div>
                    <p className="text-slate-400 text-[11px] mt-1.5">
                      Sensitivity to biomarker-guided tyrosine kinase inhibitors / targeted monoclonal therapies confirmed by NCCN/ESMO Level 1A evidence.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-200 text-sm">
                        Secondary Resistance & Bypass Alterations: {selectedPatient.secondaryResistance}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[11px]">
                        Clonal Surveillance
                      </span>
                    </div>
                    <p className="text-slate-400 text-[11px] mt-1.5">
                      Serial ctDNA liquid biopsy monitoring recommended every 8 weeks to identify emerging subclonal resistance mechanisms.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LIQUID BIOPSY & MRD */}
          {activeTab === "liquid_biopsy" && (
            <div className="space-y-4">
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Activity className="w-5 h-5 text-cyan-400" />
                      Circulating Tumor DNA (ctDNA) & Minimal Residual Disease (MRD)
                    </h3>
                    <p className="text-xs text-slate-400">Digital Droplet PCR (ddPCR) & Ultra-Deep Targeted Capture</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded text-xs font-bold border ${selectedPatient.mrdStatus === "POSITIVE" ? "bg-rose-500/10 text-rose-400 border-rose-500/30" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"}`}>
                    MRD {selectedPatient.mrdStatus}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-xs text-slate-500 block">Plasma Mutant Allele Fraction (MAF)</span>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-3xl font-black text-cyan-400">{selectedPatient.ctDnaMaf}%</span>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-2 block">Detection Limit: 0.01% MAF</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-xs text-slate-500 block">Molecular Clearance Trajectory</span>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-3xl font-black text-emerald-400">-78%</span>
                    </div>
                    <span className="text-[10px] text-emerald-300 mt-2 block">ctDNA decline from baseline</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-xs text-slate-500 block">Next Surveillance Draw</span>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-xl font-bold text-slate-200">In 3 Weeks</span>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-2 block">Protocol: Guardant360 / Signatera</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: TARGETED THERAPIES & CLINICAL TRIALS */}
          {activeTab === "trials" && (
            <div className="space-y-4">
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
                <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                  Prescribed Targeted Therapy & Multi-Center Trial Matches
                </h3>

                <div className="p-4 rounded-xl bg-slate-950 border border-purple-500/30 mb-4">
                  <span className="text-xs text-purple-400 font-bold uppercase tracking-wider block">First-Line Molecular Prescription</span>
                  <span className="text-base font-black text-white mt-1 block">{selectedPatient.targetedTherapy}</span>
                  <span className="text-xs text-emerald-400 mt-1 block">Level: {selectedPatient.nccnRecommendation}</span>
                </div>

                <div className="space-y-2.5">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">Active Clinical Trial Enrollments:</span>
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex justify-between items-center text-xs">
                    <div>
                      <strong className="text-cyan-300 block">NCT05428911 — Phase II Dual TKI + MET Inhibition</strong>
                      <span className="text-slate-400 text-[11px]">Evaluating 4th-gen allosteric EGFR inhibitors in T790M/C797S resistance.</span>
                    </div>
                    <span className="px-2 py-1 rounded bg-slate-800 text-emerald-400 font-bold shrink-0">Eligible</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PHARMACOGENOMICS */}
          {activeTab === "pharmacogenomics" && (
            <div className="space-y-4">
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
                <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-indigo-400" />
                  Pharmacogenomic (PGx) Chemotherapy Safety Matrix
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-slate-400 font-semibold block">DPYD (Dihydropyrimidine Dehydrogenase)</span>
                    <span className="text-sm font-bold text-white mt-1 block">{selectedPatient.dpydStatus}</span>
                    <p className="text-[11px] text-slate-400 mt-1">Guides fluoropyrimidine (5-FU, Capecitabine) toxicity avoidance.</p>
                  </div>

                  <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-slate-400 font-semibold block">UGT1A1 (UDP-Glucuronosyltransferase)</span>
                    <span className="text-sm font-bold text-white mt-1 block">{selectedPatient.ugt1a1Status}</span>
                    <p className="text-[11px] text-slate-400 mt-1">Irinotecan hyperbilirubinemia & severe neutropenia risk mitigation.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: NCCN / ESMO GUIDELINES */}
          {activeTab === "protocols" && (
            <div className="space-y-4">
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  International Molecular Precision Oncology Standards
                </h3>

                <div className="space-y-3 text-xs">
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="font-bold text-cyan-300">1. Comprehensive Genomic Profiling (CGP) Standard</span>
                    <p className="text-slate-400 mt-1">NCCN & ESMO guidelines mandate upfront broad-panel NGS for all advanced non-squamous NSCLC, metastatic colorectal, high-grade ovarian, and metastatic melanoma to identify actionable Tier 1 alterations.</p>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="font-bold text-purple-300">2. Tissue-Agnostic Biomarker Indications</span>
                    <p className="text-slate-400 mt-1">NTRK fusions, MSI-High / dMMR, TMB &gt;= 10 mut/Mb, and RET/BRAF fusions possess FDA tissue-agnostic approvals for targeted/immunotherapy irrespective of anatomical histology.</p>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="font-bold text-amber-300">3. Liquid Biopsy ctDNA Longitudinal Monitoring</span>
                    <p className="text-slate-400 mt-1">Serial ctDNA monitoring detects molecular progression an average of 4.3 months prior to radiographic CT/PET progression, enabling preemptive treatment switching.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ========================================== */}
      {/* MODAL 1: MOLECULAR MATCHER & CALCULATOR */}
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
                  <h3 className="text-lg font-bold text-white">Molecular Tumor Board Genomic Matcher</h3>
                  <p className="text-xs text-slate-400">Compute Immunotherapy Likelihood, HRD Synthetic Lethality & Targeted Matches</p>
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
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">Biomarker Inputs</h4>

                <div>
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>Tumor Mutational Burden (TMB)</span>
                    <strong className="text-purple-400">{calcInputs.tmbScore} mut/Mb</strong>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="60"
                    step="0.5"
                    value={calcInputs.tmbScore}
                    onChange={(e) => setCalcInputs({ ...calcInputs, tmbScore: +e.target.value })}
                    className="w-full accent-purple-400"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>PD-L1 TPS (%)</span>
                    <strong className="text-purple-400">{calcInputs.pdl1Tps}%</strong>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={calcInputs.pdl1Tps}
                    onChange={(e) => setCalcInputs({ ...calcInputs, pdl1Tps: +e.target.value })}
                    className="w-full accent-purple-400"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>HRD Genomic Instability Score</span>
                    <strong className="text-purple-400">{calcInputs.hrdScore} / 100</strong>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={calcInputs.hrdScore}
                    onChange={(e) => setCalcInputs({ ...calcInputs, hrdScore: +e.target.value })}
                    className="w-full accent-purple-400"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>ctDNA Mutant Allele Fraction (MAF)</span>
                    <strong className="text-purple-400">{calcInputs.ctDnaMaf}%</strong>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="25"
                    step="0.1"
                    value={calcInputs.ctDnaMaf}
                    onChange={(e) => setCalcInputs({ ...calcInputs, ctDnaMaf: +e.target.value })}
                    className="w-full accent-purple-400"
                  />
                </div>

                <div className="pt-2 border-t border-slate-800/80">
                  <span className="text-xs font-semibold text-slate-300 block mb-2">Driver Alterations</span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <label className="flex items-center gap-2 text-slate-300">
                      <input
                        type="checkbox"
                        checked={calcInputs.egfrDriver}
                        onChange={(e) => setCalcInputs({ ...calcInputs, egfrDriver: e.target.checked })}
                        className="accent-purple-400"
                      />
                      EGFR Sensitizing
                    </label>
                    <label className="flex items-center gap-2 text-slate-300">
                      <input
                        type="checkbox"
                        checked={calcInputs.krasDriver}
                        onChange={(e) => setCalcInputs({ ...calcInputs, krasDriver: e.target.checked })}
                        className="accent-purple-400"
                      />
                      KRAS G12C
                    </label>
                    <label className="flex items-center gap-2 text-slate-300">
                      <input
                        type="checkbox"
                        checked={calcInputs.brafDriver}
                        onChange={(e) => setCalcInputs({ ...calcInputs, brafDriver: e.target.checked })}
                        className="accent-purple-400"
                      />
                      BRAF V600E
                    </label>
                    <label className="flex items-center gap-2 text-slate-300">
                      <input
                        type="checkbox"
                        checked={calcInputs.ntrkFusion}
                        onChange={(e) => setCalcInputs({ ...calcInputs, ntrkFusion: e.target.checked })}
                        className="accent-purple-400"
                      />
                      NTRK Fusion
                    </label>
                  </div>
                </div>
              </div>

              {/* PREDICTION RESULTS */}
              <div className="lg:col-span-6 space-y-3 bg-slate-950/70 p-4 rounded-xl border border-slate-800/80">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">Targeted Matching Results</h4>

                <div className="space-y-3 text-xs">
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-slate-500 block">Recommended Targeted Therapy</span>
                    <span className="text-base font-black text-purple-300 mt-1 block">
                      {calcResults.targetClass}
                    </span>
                    <span className="text-[10px] text-emerald-400 block mt-0.5">{calcResults.tierNccn}</span>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-slate-500 block">Immunotherapy Response Likelihood Score</span>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-2xl font-black text-cyan-400">{calcResults.ioScore}%</span>
                      <span className="text-xs text-slate-400">
                        {calcResults.ioScore > 60 ? "High Benefit (Checkpoint Inhibitor)" : "Moderate/Low Benefit"}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-slate-500 block">Molecular Residual Disease (MRD) Risk</span>
                    <span className="text-sm font-bold text-amber-400 mt-1 block">{calcResults.mrdRisk}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => {
                  setCalcInputs({
                    tmbScore: selectedPatient.tmbScore,
                    pdl1Tps: selectedPatient.pdl1Tps,
                    ctDnaMaf: selectedPatient.ctDnaMaf,
                    hrdScore: selectedPatient.hrdScore,
                    msiHigh: selectedPatient.msiStatus.includes("MSI-H"),
                    egfrDriver: selectedPatient.primaryGenomicDriver.includes("EGFR"),
                    krasDriver: selectedPatient.primaryGenomicDriver.includes("KRAS"),
                    brafDriver: selectedPatient.primaryGenomicDriver.includes("BRAF"),
                    ntrkFusion: selectedPatient.primaryGenomicDriver.includes("NTRK")
                  });
                  addToast("Loaded selected patient genomic profile.", "info");
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all"
              >
                Sync with Patient
              </button>
              <button
                onClick={() => setShowCalculatorModal(false)}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white transition-all"
              >
                Close Matcher
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL 2: EMERGENCY PROTOCOL TRIGGER */}
      {/* ========================================== */}
      {showEmergencyModal && selectedEmergencyProtocol && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border-2 border-rose-500/60 rounded-2xl w-full max-w-xl p-6 shadow-2xl shadow-rose-950/50">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
              <div className="p-3 rounded-xl bg-rose-500/20 text-rose-500 border border-rose-500/40 animate-pulse">
                <Siren className="w-7 h-7" />
              </div>
              <div>
                <span className="text-xs font-bold text-rose-400 tracking-wider uppercase">Oncologic Emergency Protocol</span>
                <h3 className="text-xl font-black text-white">{selectedEmergencyProtocol.title}</h3>
              </div>
            </div>

            <div className="my-5 space-y-3.5 text-xs text-slate-300">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-500 font-semibold block">Target Patient:</span>
                <span className="text-base font-bold text-white">{selectedPatient.name} ({selectedPatient.id})</span>
                <span className="text-xs text-rose-400 block mt-0.5">{selectedPatient.bed} • {selectedPatient.tumorType}</span>
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
                EXECUTE ONCOLOGY OVERRIDE
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
                <User className="w-5 h-5 text-purple-400" />
                Genomic Dossier: {selectedPatient.name}
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
                  <span className="text-slate-500 block">Pathologic Stage</span>
                  <span className="font-bold text-slate-200">{selectedPatient.stage}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-slate-500 block">Primary Driver</span>
                  <span className="font-bold text-purple-400">{selectedPatient.primaryGenomicDriver}</span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5">
                <span className="font-bold text-slate-300 block">Complete Molecular & Lab Panel</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-400">
                  <div>TMB: <strong className="text-slate-200">{selectedPatient.tmbScore} mut/Mb</strong></div>
                  <div>PD-L1: <strong className="text-slate-200">{selectedPatient.pdl1Tps}%</strong></div>
                  <div>ctDNA MAF: <strong className="text-slate-200">{selectedPatient.ctDnaMaf}%</strong></div>
                  <div>ANC: <strong className="text-slate-200">{selectedPatient.anc} /mcL</strong></div>
                  <div>Platelets: <strong className="text-slate-200">{selectedPatient.platelets}</strong></div>
                  <div>Uric Acid: <strong className="text-slate-200">{selectedPatient.uricAcid} mg/dL</strong></div>
                  <div>K+: <strong className="text-slate-200">{selectedPatient.potassium} mEq/L</strong></div>
                  <div>Phosphorus: <strong className="text-slate-200">{selectedPatient.phosphorus} mg/dL</strong></div>
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
                Precision Oncology Audit & FHIR R4 Export
              </h3>
              <button onClick={() => setShowExportModal(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="my-4 text-xs text-slate-300 space-y-3">
              <p className="text-slate-400">
                Exports all NGS genomic variant calls, ctDNA liquid biopsy streams, and pharmacogenomic safety profiles adhering to FDA 21 CFR Part 11 and HL7 FHIR R4 MolecularSequence Observations.
              </p>
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-400">
                <span className="text-slate-300 font-semibold block">Cryptographic Provenance Stamp:</span>
                <span className="font-mono text-purple-400 block mt-0.5">SHA256: 4a2d...f890e</span>
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
