import React, { useState, useEffect, useMemo } from 'react';
import {
  Dna,
  Activity,
  ShieldAlert,
  Microscope,
  FileText,
  Search,
  Filter,
  RefreshCw,
  PlusCircle,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  TrendingUp,
  TrendingDown,
  Layers,
  Sparkles,
  Zap,
  Target,
  FlaskConical,
  HeartPulse,
  Syringe,
  BarChart3,
  Calendar,
  Clock,
  UserCheck,
  Award,
  ChevronRight,
  ExternalLink,
  Download,
  Share2,
  Sliders,
  Settings,
  Eye,
  FileSpreadsheet,
  PieChart,
  BrainCircuit,
  Database,
  Lock,
  Terminal,
  Cpu
} from 'lucide-react';

// ============================================================================
// PRECISION GENOMIC ONCOLOGY & CLINICAL TRIAL OVERWATCH COMMAND CENTER
// Enterprise Precision Medicine Subsystem for MedTrack Ecosystem
// Standards: NCCN, ESMO, RECIST 1.1, CTCAE v5.0, FDA-PGx, HL7 FHIR R4 Genomic Study
// ============================================================================

export default function PrecisionGenomicOncologyOverwatchPage() {
  // --------------------------------------------------------------------------
  // TOP-LEVEL STATE MANAGEMENT
  // --------------------------------------------------------------------------
  const [activeTab, setActiveTab] = useState('genomic-variants');
  const [selectedPatientId, setSelectedPatientId] = useState('PT-ONC-8842');
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState('ALL');
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedTrial, setSelectedTrial] = useState(null);
  const [selectedToxicity, setSelectedToxicity] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [notification, setNotification] = useState(null);
  const [tumorBoardVote, setTumorBoardVote] = useState({});

  // --------------------------------------------------------------------------
  // PATIENT COHORT TELEMETRY MOCK DATA
  // --------------------------------------------------------------------------
  const patientCohort = [
    {
      id: 'PT-ONC-8842',
      name: 'Eleanor Vance',
      age: 58,
      gender: 'Female',
      diagnosis: 'Non-Small Cell Lung Cancer (NSCLC) - Adenocarcinoma',
      stage: 'Stage IVB (Metastatic to Bone & Brain)',
      tmb: '14.2 mut/Mb (High)',
      msi: 'MSI-High (Instable)',
      hrd: 'Positive (Score: 54)',
      pdl1: 'PD-L1 TPS 75%',
      recistStatus: 'Partial Response (-42% tumor reduction)',
      activeTrial: 'NCT04823112 - TKI + IO Combination',
      primaryOncologist: 'Dr. Sarah Jenkins, MD',
      lastBiopsyDate: '2026-07-28'
    },
    {
      id: 'PT-ONC-9104',
      name: 'Marcus Thorne',
      age: 64,
      gender: 'Male',
      diagnosis: 'Metastatic Colorectal Cancer (mCRC)',
      stage: 'Stage IVA',
      tmb: '4.8 mut/Mb (Low)',
      msi: 'MSS (Stable)',
      hrd: 'Negative',
      pdl1: 'PD-L1 TPS < 1%',
      recistStatus: 'Stable Disease (-5%)',
      activeTrial: 'NCT05192840 - KRAS G12C Inhibitor Study',
      primaryOncologist: 'Dr. Robert Vance, MD',
      lastBiopsyDate: '2026-08-02'
    },
    {
      id: 'PT-ONC-7731',
      name: 'Sophia Rodriguez',
      age: 49,
      gender: 'Female',
      diagnosis: 'High-Grade Serous Ovarian Carcinoma',
      stage: 'Stage IIIC',
      tmb: '8.1 mut/Mb (Moderate)',
      msi: 'MSS',
      hrd: 'Positive (Score: 68)',
      pdl1: 'PD-L1 TPS 10%',
      recistStatus: 'Complete Response (No target lesions)',
      activeTrial: 'NCT03948512 - PARP Maintenance Maintenance',
      primaryOncologist: 'Dr. Elena Rostova, MD',
      lastBiopsyDate: '2026-06-15'
    }
  ];

  const currentPatient = useMemo(
    () => patientCohort.find((p) => p.id === selectedPatientId) || patientCohort[0],
    [selectedPatientId]
  );

  // --------------------------------------------------------------------------
  // SOMATIC & GERMLINE GENOMIC VARIANTS DATASET
  // --------------------------------------------------------------------------
  const genomicVariants = [
    {
      id: 'VAR-EGFR-L858R',
      gene: 'EGFR',
      alteration: 'p.Leu858Arg (L858R)',
      cDNA: 'c.2573T>G',
      exon: 'Exon 21',
      type: 'Missense Mutation',
      vaf: 34.2,
      vafTrend: 'decreasing',
      tier: 'Tier I (Strong Clinical Significance)',
      fdaApprovedTherapies: ['Osimertinib', 'Erlotinib', 'Afatinib'],
      clinicalTrials: ['NCT04823112', 'NCT05214433'],
      resistanceMechanism: 'Acquired C797S / MET Amplification Risk',
      evidenceLevel: 'Level A (FDA Approved Diagnostic Indicator)',
      somaticOrGermline: 'Somatic'
    },
    {
      id: 'VAR-TP53-R273H',
      gene: 'TP53',
      alteration: 'p.Arg273His (R273H)',
      cDNA: 'c.818G>A',
      exon: 'Exon 8',
      type: 'Missense Mutation',
      vaf: 48.9,
      vafTrend: 'stable',
      tier: 'Tier I (Strong Clinical Significance)',
      fdaApprovedTherapies: ['Investigational APR-246 (Eprenetapopt)'],
      clinicalTrials: ['NCT04383938'],
      resistanceMechanism: 'Loss of P53 Tumor Suppressor Function',
      evidenceLevel: 'Level B (Clinical Consensus)',
      somaticOrGermline: 'Somatic'
    },
    {
      id: 'VAR-BRCA1-185DELAG',
      gene: 'BRCA1',
      alteration: 'c.68_69delAG (p.Glu23Valfs*17)',
      cDNA: 'c.68_69delAG',
      exon: 'Exon 2',
      type: 'Frameshift Deletion',
      vaf: 50.1,
      vafTrend: 'stable',
      tier: 'Tier I (Germline Pathogenic)',
      fdaApprovedTherapies: ['Olaparib', 'Rucaparib', 'Niraparib', 'Talazoparib'],
      clinicalTrials: ['NCT03948512'],
      resistanceMechanism: 'Reversion Mutations in BRCA1/2',
      evidenceLevel: 'Level A (FDA Approved Germline Indicator)',
      somaticOrGermline: 'Germline'
    },
    {
      id: 'VAR-KRAS-G12C',
      gene: 'KRAS',
      alteration: 'p.Gly12Cys (G12C)',
      cDNA: 'c.34G>T',
      exon: 'Exon 2',
      type: 'Missense Mutation',
      vaf: 22.8,
      vafTrend: 'increasing',
      tier: 'Tier I (Actionable Oncogenic Driver)',
      fdaApprovedTherapies: ['Sotorasib', 'Adagrasib'],
      clinicalTrials: ['NCT05192840'],
      resistanceMechanism: 'RTK Re-activation / Secondary KRAS Y96D',
      evidenceLevel: 'Level A (FDA Approved)',
      somaticOrGermline: 'Somatic'
    },
    {
      id: 'VAR-MET-AMP',
      gene: 'MET',
      alteration: 'Amplification (Copy Number: 12.4)',
      cDNA: 'N/A (CNV)',
      exon: 'Genome Region 7q31.2',
      type: 'Copy Number Gain (CNV)',
      vaf: 12.4,
      vafTrend: 'increasing',
      tier: 'Tier II (Potential Clinical Significance)',
      fdaApprovedTherapies: ['Capmatinib', 'Tepotinib', 'Crizotinib'],
      clinicalTrials: ['NCT04823112'],
      resistanceMechanism: 'Bypasses EGFR Inhibition',
      evidenceLevel: 'Level B (Preclinical & Clinical Biomarker)',
      somaticOrGermline: 'Somatic'
    },
    {
      id: 'VAR-PIK3CA-E545K',
      gene: 'PIK3CA',
      alteration: 'p.Glu545Lys (E545K)',
      cDNA: 'c.1633G>A',
      exon: 'Exon 10 (Helical Domain)',
      type: 'Missense Mutation',
      vaf: 8.5,
      vafTrend: 'decreasing',
      tier: 'Tier II (Actionable Target)',
      fdaApprovedTherapies: ['Alpelisib (in HR+/HER2- Breast Cancer)'],
      clinicalTrials: ['NCT04732910'],
      resistanceMechanism: 'PTEN Loss / PDK1 Upregulation',
      evidenceLevel: 'Level B (Clinical Consensus)',
      somaticOrGermline: 'Somatic'
    }
  ];

  // --------------------------------------------------------------------------
  // LIQUID BIOPSY ctDNA KINETICS TELEMETRY DATA
  // --------------------------------------------------------------------------
  const liquidBiopsyHistory = [
    { date: '2026-03-01', ctDnaCopies: 1450, mrdStatus: 'POSITIVE', cfDnaConc: 45.2, responseTag: 'Baseline Pre-Tx' },
    { date: '2026-04-15', ctDnaCopies: 820, mrdStatus: 'POSITIVE', cfDnaConc: 31.8, responseTag: 'Cycle 2 Post-TKI' },
    { date: '2026-05-30', ctDnaCopies: 310, mrdStatus: 'POSITIVE', cfDnaConc: 19.4, responseTag: 'Cycle 4 Combo' },
    { date: '2026-07-15', ctDnaCopies: 45, mrdStatus: 'LOW-POSITIVE', cfDnaConc: 11.2, responseTag: 'Cycle 6 Partial Response' },
    { date: '2026-08-10', ctDnaCopies: 12, mrdStatus: 'NEGATIVE (Below LoD)', cfDnaConc: 8.4, responseTag: 'Recent Clearance' }
  ];

  // --------------------------------------------------------------------------
  // CLINICAL TRIALS & PRECISION ONCOLOGY PROTOCOLS
  // --------------------------------------------------------------------------
  const clinicalTrials = [
    {
      id: 'NCT04823112',
      title: 'Phase II Study of 3rd Generation TKI Combined with PD-1 Blockade in EGFR Mutated NSCLC',
      sponsor: 'MedTrack Precision Oncology Clinical Consortium',
      phase: 'Phase II',
      status: 'Active, Recruiting',
      eligibilityScore: 96,
      inclusionMatched: ['EGFR L858R Positive', 'TMB > 10 mut/Mb', 'ECOG PS 0-1', 'Adequate Organ Function'],
      exclusionPassed: ['No Active Brain Metastases (Treated & Stable)', 'No Prior Autoimmune Colitis'],
      experimentalArm: 'Osimertinib 80mg PO QD + Pembrolizumab 200mg IV Q3W',
      primaryEndpoint: 'Progression-Free Survival (PFS) at 18 Months',
      enrolledCount: 142,
      targetEnrollment: 200
    },
    {
      id: 'NCT05192840',
      title: 'Targeted Inhibitor Monotherapy vs Standard Chemotherapy in KRAS G12C Advanced Solid Tumors',
      sponsor: 'Global BioGenetics Oncology Group',
      phase: 'Phase III',
      status: 'Active, Enrolling by Invitation',
      eligibilityScore: 88,
      inclusionMatched: ['KRAS G12C Somatic Mutation', 'Prior Fluoropyrimidine Failure', 'Measurable Disease RECIST 1.1'],
      exclusionPassed: ['No Severe QTc Prolongation (>470ms)', 'No Hepatic Impairment (Child-Pugh B/C)'],
      experimentalArm: 'Sotorasib 960mg PO Daily Continuous',
      primaryEndpoint: 'Overall Survival (OS) & Objective Response Rate (ORR)',
      enrolledCount: 380,
      targetEnrollment: 450
    },
    {
      id: 'NCT03948512',
      title: 'PARP Inhibitor Maintenance in BRCA-Mutated or HRD-Positive Recurrent Ovarian Cancer',
      sponsor: 'National Cancer Precision Institute',
      phase: 'Phase III',
      status: 'Active, Maintenance Phase',
      eligibilityScore: 94,
      inclusionMatched: ['Germline/Somatic BRCA1/2 Mutation', 'HRD Score >= 42', 'Platinum-Sensitive Relapse'],
      exclusionPassed: ['No Prior Myelodysplastic Syndrome (MDS)', 'Normal Platelet Count >= 100k'],
      experimentalArm: 'Olaparib 300mg PO BID Maintenance',
      primaryEndpoint: '2-Year Disease-Free Survival',
      enrolledCount: 520,
      targetEnrollment: 520
    }
  ];

  // --------------------------------------------------------------------------
  // CTCAE v5.0 TOXICITY & IMMUNE-RELATED ADVERSE EVENTS (irAE)
  // --------------------------------------------------------------------------
  const toxicityLog = [
    {
      id: 'TOX-101',
      system: 'Hematologic',
      adverseEvent: 'Absolute Neutrophil Count (ANC) Nadir',
      currentGrade: 'Grade 2 (Moderate)',
      value: '1.2 x 10^9 / L',
      ctcaeDefinition: 'ANC 1.0 - 1.5 x 10^9/L; non-febrile',
      onsetDays: 14,
      actionTaken: 'Dose Interruption of Chemotherapy / G-CSF Support Evaluation',
      status: 'Resolving',
      riskCategory: 'High (Febrile Risk)'
    },
    {
      id: 'TOX-102',
      system: 'Immunological (irAE)',
      adverseEvent: 'Immune-Mediated Pneumonitis',
      currentGrade: 'Grade 1 (Mild / Asymptomatic)',
      value: 'Subpleural ground-glass opacities on chest CT',
      ctcaeDefinition: 'Asymptomatic; clinical or diagnostic observations only; intervention not indicated',
      onsetDays: 42,
      actionTaken: 'Close Telemetry Monitoring / Bi-Weekly HRCT Scanning',
      status: 'Stable',
      riskCategory: 'Critical Sentinel Event'
    },
    {
      id: 'TOX-103',
      system: 'Hepatic / PGx',
      adverseEvent: 'ALT / AST Transaminitis',
      currentGrade: 'Grade 1 (Mild)',
      value: 'ALT: 68 U/L (ULN 35), AST: 52 U/L',
      ctcaeDefinition: '> 1.5 - 3.0 x ULN if baseline was normal',
      onsetDays: 28,
      actionTaken: 'Continued Therapy with Weekly LFT Monitoring',
      status: 'Active Surveillance',
      riskCategory: 'Low Risk'
    },
    {
      id: 'TOX-104',
      system: 'Dermatologic',
      adverseEvent: 'EGFR-Inhibitor Rash (Acneiform Eruption)',
      currentGrade: 'Grade 2 (Moderate)',
      value: 'Maculopapular rash covering 22% BSA',
      ctcaeDefinition: 'Papules and/or pustules covering 10-30% BSA; psychosocial impact',
      onsetDays: 10,
      actionTaken: 'Topical Doxycycline 100mg BID + Hydrocortisone 1% Cream',
      status: 'Improving',
      riskCategory: 'Moderate Quality of Life Impact'
    }
  ];

  // --------------------------------------------------------------------------
  // PHARMACOGENOMIC (PGX) GENOTYPING MATRIX
  // --------------------------------------------------------------------------
  const pgxGenotypes = [
    { gene: 'DPYD', variantTested: '*2A, *13, c.2846A>G', genotype: '*1/*1 (Wild Type)', pheno: 'Normal Metabolizer', risk: 'Low 5-FU Toxicity Risk' },
    { gene: 'UGT1A1', variantTested: '*28 Repeat (TA7)', genotype: '*1/*28 (Heterozygous)', pheno: 'Intermediate Metabolizer', risk: 'Moderate Irinotecan Neutropenia Risk (Reduce Dose 20%)' },
    { gene: 'TPMT', variantTested: '*2, *3A, *3C', genotype: '*1/*1 (Wild Type)', pheno: 'Normal Metabolizer', risk: 'Standard Thiopurine Dosing Safe' },
    { gene: 'CYP2D6', variantTested: 'Full Gene Panel', genotype: '*4/*4 (Poor Metabolizer)', pheno: 'Poor Metabolizer', risk: 'Tamoxifen Inefficacy Risk (Switch to Aromatase Inhibitor)' }
  ];

  // --------------------------------------------------------------------------
  // FILTERED VARIANTS COMPUTED MEMO
  // --------------------------------------------------------------------------
  const filteredVariants = useMemo(() => {
    return genomicVariants.filter((v) => {
      const matchesSearch =
        v.gene.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.alteration.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.tier.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTier = tierFilter === 'ALL' || v.tier.includes(tierFilter);
      return matchesSearch && matchesTier;
    });
  }, [searchQuery, tierFilter]);

  // --------------------------------------------------------------------------
  // USER ACTION HANDLERS
  // --------------------------------------------------------------------------
  const handleRefreshData = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      triggerNotification('Genomic Telemetry & Liquid Biopsy Streams Synchronized from NGS Sequencer.');
    }, 900);
  };

  const handleExportReport = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      triggerNotification('Precision Oncology Clinical Summary PDF & HL7 FHIR DiagnosticReport exported.');
    }, 1200);
  };

  const triggerNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const handleCastTumorBoardVote = (variantId, vote) => {
    setTumorBoardVote((prev) => ({ ...prev, [variantId]: vote }));
    triggerNotification(`Multidisciplinary Tumor Board Vote [${vote}] logged for variant ${variantId}.`);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 md:p-8 space-y-6">
      {/* -------------------------------------------------------------------- */}
      {/* SYSTEM HEADER & PATIENT SELECTOR CONTROL BAR                         */}
      {/* -------------------------------------------------------------------- */}
      <header className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center space-x-4">
            <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
              <Dna className="w-9 h-9 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
                  Precision Genomic Oncology Overwatch
                </h1>
                <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-mono rounded-full font-semibold">
                  NGS TELEMETRY LIVE
                </span>
              </div>
              <p className="text-slate-400 text-sm mt-1">
                Clinical Trial Matching, Liquid Biopsy ctDNA Monitoring, Pharmacogenomics & CTCAE Toxicity Subsystem
              </p>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleRefreshData}
              disabled={isRefreshing}
              className="flex items-center space-x-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl font-medium text-sm transition-all duration-200 text-slate-200 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
              <span>{isRefreshing ? 'Syncing...' : 'Sync NGS Feed'}</span>
            </button>

            <button
              onClick={handleExportReport}
              disabled={isExporting}
              className="flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-emerald-900/30 transition-all duration-200"
            >
              <Download className="w-4 h-4" />
              <span>{isExporting ? 'Generating FHIR...' : 'Export Genomic Report'}</span>
            </button>
          </div>
        </div>

        {/* Patient Selection & Quick Telemetry Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-slate-800">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Active Oncology Patient
            </label>
            <select
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm font-semibold text-emerald-300 focus:outline-none focus:border-emerald-500"
            >
              {patientCohort.map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {patient.name} ({patient.id}) - {patient.diagnosis.substring(0, 24)}...
                </option>
              ))}
            </select>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 flex flex-col justify-between">
            <span className="text-xs font-medium text-slate-400">Diagnosis & Stage</span>
            <span className="text-xs font-bold text-white truncate">{currentPatient.diagnosis}</span>
            <span className="text-[11px] font-mono text-emerald-400">{currentPatient.stage}</span>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 flex flex-col justify-between">
            <span className="text-xs font-medium text-slate-400">Tumor Biomarkers</span>
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-200">
              <span className="text-cyan-400 font-mono">TMB: {currentPatient.tmb}</span>
              <span className="text-slate-600">|</span>
              <span className="text-purple-400 font-mono">{currentPatient.msi}</span>
            </div>
            <span className="text-[11px] font-mono text-teal-300">{currentPatient.pdl1}</span>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 flex flex-col justify-between">
            <span className="text-xs font-medium text-slate-400">RECIST 1.1 Treatment Response</span>
            <span className="text-xs font-bold text-emerald-400">{currentPatient.recistStatus}</span>
            <span className="text-[11px] font-mono text-slate-400 truncate">{currentPatient.activeTrial}</span>
          </div>
        </div>
      </header>

      {/* -------------------------------------------------------------------- */}
      {/* SYSTEM TOAST NOTIFICATION                                             */}
      {/* -------------------------------------------------------------------- */}
      {notification && (
        <div className="bg-emerald-950/80 border border-emerald-500/50 rounded-xl p-4 flex items-center justify-between text-emerald-200 shadow-xl animate-fade-in">
          <div className="flex items-center space-x-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <span className="text-sm font-medium">{notification}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-emerald-400 hover:text-white">
            &times;
          </button>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* NAVIGATION TABS BAR                                                  */}
      {/* -------------------------------------------------------------------- */}
      <nav className="flex flex-wrap items-center gap-2 bg-slate-900/60 border border-slate-800/80 rounded-xl p-1.5">
        {[
          { id: 'genomic-variants', label: 'Somatic & Germline Variants', icon: Dna },
          { id: 'liquid-biopsy', label: 'Liquid Biopsy ctDNA Stream', icon: Activity },
          { id: 'clinical-trials', label: 'Trial Protocol Matching', icon: Microscope },
          { id: 'ctcae-toxicity', label: 'CTCAE v5.0 Toxicity & irAE', icon: ShieldAlert },
          { id: 'pharmacogenomics', label: 'Pharmacogenomics (PGx)', icon: FlaskConical },
          { id: 'tumor-board', label: 'Tumor Board Workbench', icon: BrainCircuit }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-r from-emerald-600/30 to-teal-600/30 text-emerald-300 border border-emerald-500/40 shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* -------------------------------------------------------------------- */}
      {/* TAB 1: SOMATIC & GERMLINE GENOMIC VARIANTS                           */}
      {/* -------------------------------------------------------------------- */}
      {activeTab === 'genomic-variants' && (
        <div className="space-y-6">
          {/* Filter & Search Bar */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:w-96">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
              <input
                type="text"
                placeholder="Search by gene (e.g. EGFR, KRAS, BRCA1) or variant..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center space-x-3 w-full md:w-auto">
              <Filter className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-semibold text-slate-400 uppercase">Tier Classification:</span>
              <select
                value={tierFilter}
                onChange={(e) => setTierFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-emerald-300 focus:outline-none focus:border-emerald-500"
              >
                <option value="ALL">All Clinical Tiers</option>
                <option value="Tier I">Tier I (Strong Clinical Significance)</option>
                <option value="Tier II">Tier II (Potential Significance)</option>
                <option value="Germline">Germline Pathogenic</option>
              </select>
            </div>
          </div>

          {/* Genomic Variant Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVariants.map((variant) => (
              <div
                key={variant.id}
                onClick={() => setSelectedVariant(variant)}
                className="bg-slate-900/70 border border-slate-800 hover:border-emerald-500/50 rounded-2xl p-5 shadow-xl hover:shadow-2xl transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-4 group"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-xl font-black font-mono text-emerald-400">{variant.gene}</span>
                      <span className="px-2 py-0.5 bg-slate-800 text-slate-300 text-[10px] font-mono rounded">
                        {variant.somaticOrGermline}
                      </span>
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-400">VAF: {variant.vaf}%</span>
                  </div>

                  <h3 className="text-sm font-bold text-white mt-1 group-hover:text-emerald-300 transition-colors">
                    {variant.alteration}
                  </h3>
                  <p className="text-xs font-mono text-slate-400 mt-0.5">{variant.cDNA} ({variant.exon})</p>

                  <div className="mt-3">
                    <span className="inline-block px-2.5 py-1 bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-[11px] font-medium rounded-lg">
                      {variant.tier}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 pt-3 border-t border-slate-800/80">
                  <div className="text-xs font-medium text-slate-400">
                    <span className="text-slate-500">FDA Therapies:</span>{' '}
                    <span className="text-cyan-300 font-medium">
                      {variant.fdaApprovedTherapies.slice(0, 2).join(', ')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Evidence: {variant.evidenceLevel.substring(0, 8)}</span>
                    <span className="text-emerald-400 font-medium flex items-center space-x-1 group-hover:translate-x-1 transition-transform">
                      <span>Inspect Variant</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* TAB 2: LIQUID BIOPSY ctDNA STREAM                                     */}
      {/* -------------------------------------------------------------------- */}
      {activeTab === 'liquid-biopsy' && (
        <div className="space-y-6">
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Activity className="w-6 h-6 text-teal-400" />
                <div>
                  <h2 className="text-lg font-bold text-white">
                    Circulating Tumor DNA (ctDNA) & Minimal Residual Disease (MRD) Kinetics
                  </h2>
                  <p className="text-xs text-slate-400">
                    Longitudinal Cell-Free DNA (cfDNA) Telemetry & Early Relapse Detection Protocol
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-mono rounded-full font-bold">
                ctDNA Clearance: 99.1% Reduction
              </span>
            </div>

            {/* Simulated ctDNA Kinetics Visual Bars */}
            <div className="space-y-4 pt-2">
              {liquidBiopsyHistory.map((sample, idx) => (
                <div key={idx} className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-emerald-400 font-bold">{sample.date}</span>
                    <span className="text-slate-300 font-bold">{sample.responseTag}</span>
                    <span className={`px-2 py-0.5 rounded font-semibold ${
                      sample.mrdStatus.includes('NEGATIVE')
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                        : 'bg-amber-950 text-amber-300 border border-amber-500/30'
                    }`}>
                      MRD: {sample.mrdStatus}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs pt-1">
                    <div>
                      <span className="text-slate-500">ctDNA Concentration:</span>{' '}
                      <span className="text-cyan-300 font-mono font-bold">{sample.ctDnaCopies} copies / mL</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Total cfDNA Yield:</span>{' '}
                      <span className="text-purple-300 font-mono font-bold">{sample.cfDnaConc} ng / mL</span>
                    </div>
                    <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden self-center">
                      <div
                        className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, (sample.ctDnaCopies / 1500) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* TAB 3: CLINICAL TRIAL MATCHING ENGINE                                */}
      {/* -------------------------------------------------------------------- */}
      {activeTab === 'clinical-trials' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            {clinicalTrials.map((trial) => (
              <div
                key={trial.id}
                className="bg-slate-900/70 border border-slate-800 hover:border-emerald-500/40 rounded-2xl p-6 shadow-xl space-y-4"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-3">
                      <span className="text-base font-black font-mono text-emerald-400">{trial.id}</span>
                      <span className="px-2.5 py-0.5 bg-blue-950 text-blue-300 border border-blue-500/30 text-xs font-semibold rounded-full">
                        {trial.phase}
                      </span>
                      <span className="px-2.5 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-500/30 text-xs font-semibold rounded-full">
                        {trial.status}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-white">{trial.title}</h3>
                    <p className="text-xs text-slate-400">Sponsor: {trial.sponsor}</p>
                  </div>

                  <div className="flex items-center space-x-4 bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3 text-center flex-shrink-0">
                    <div>
                      <span className="text-2xl font-black text-emerald-400 font-mono">{trial.eligibilityScore}%</span>
                      <p className="text-[10px] font-semibold text-slate-400 uppercase">Match Score</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                  <div className="space-y-2">
                    <span className="font-semibold text-emerald-400 flex items-center space-x-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Inclusion Criteria Matched ({trial.inclusionMatched.length})</span>
                    </span>
                    <ul className="space-y-1 text-slate-300 pl-5 list-disc">
                      {trial.inclusionMatched.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <span className="font-semibold text-cyan-400 flex items-center space-x-1.5">
                      <Syringe className="w-4 h-4" />
                      <span>Experimental Protocol Arm</span>
                    </span>
                    <p className="text-slate-200 bg-slate-950 p-2.5 rounded-lg border border-slate-800 font-mono">
                      {trial.experimentalArm}
                    </p>
                    <p className="text-[11px] text-slate-400">Primary Endpoint: {trial.primaryEndpoint}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* TAB 4: CTCAE v5.0 TOXICITY & irAE MONITOR                             */}
      {/* -------------------------------------------------------------------- */}
      {activeTab === 'ctcae-toxicity' && (
        <div className="space-y-6">
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center space-x-3 mb-2">
              <ShieldAlert className="w-6 h-6 text-amber-400" />
              <div>
                <h2 className="text-lg font-bold text-white">CTCAE v5.0 Toxicity & Immune-Related Adverse Events (irAE)</h2>
                <p className="text-xs text-slate-400">Real-Time Organ System Toxicity Grading & Clinical Mitigation Matrix</p>
              </div>
            </div>

            <div className="divide-y divide-slate-800">
              {toxicityLog.map((tox) => (
                <div key={tox.id} className="py-4 space-y-2 first:pt-0 last:pb-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="px-2.5 py-1 bg-amber-950 text-amber-300 border border-amber-500/30 text-xs font-bold rounded-lg font-mono">
                        {tox.currentGrade}
                      </span>
                      <span className="text-sm font-bold text-white">{tox.adverseEvent}</span>
                      <span className="text-xs text-slate-400 font-mono">({tox.system})</span>
                    </div>
                    <span className="text-xs text-rose-400 font-medium">{tox.riskCategory}</span>
                  </div>

                  <p className="text-xs text-slate-300 font-mono bg-slate-950/60 p-2 rounded border border-slate-800">
                    Clinical Finding: {tox.value} | Standard CTCAE Definition: {tox.ctcaeDefinition}
                  </p>

                  <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                    <span>Action Protocol: <strong className="text-emerald-300">{tox.actionTaken}</strong></span>
                    <span>Onset: Day {tox.onsetDays} Post-Cycle</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* TAB 5: PHARMACOGENOMICS (PGx) DOSING SAFETY                           */}
      {/* -------------------------------------------------------------------- */}
      {activeTab === 'pharmacogenomics' && (
        <div className="space-y-6">
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center space-x-3">
              <FlaskConical className="w-6 h-6 text-purple-400" />
              <div>
                <h2 className="text-lg font-bold text-white">FDA Pharmacogenomic (PGx) Safety & Dosing Profile</h2>
                <p className="text-xs text-slate-400">Germline Drug Metabolism Genotyping & Toxicity Avoidance Matrix</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 font-semibold uppercase font-mono border-b border-slate-800">
                  <tr>
                    <th className="p-3">Gene</th>
                    <th className="p-3">Tested Variants</th>
                    <th className="p-3">Genotype</th>
                    <th className="p-3">Phenotype</th>
                    <th className="p-3">Clinical PGx Recommendation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-mono">
                  {pgxGenotypes.map((pgx, i) => (
                    <tr key={i} className="hover:bg-slate-800/40">
                      <td className="p-3 font-bold text-purple-400">{pgx.gene}</td>
                      <td className="p-3 text-slate-400">{pgx.variantTested}</td>
                      <td className="p-3 text-white font-bold">{pgx.genotype}</td>
                      <td className="p-3 text-cyan-300">{pgx.pheno}</td>
                      <td className="p-3 text-emerald-300 font-sans font-medium">{pgx.risk}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* TAB 6: MULTIDISCIPLINARY TUMOR BOARD WORKBENCH                       */}
      {/* -------------------------------------------------------------------- */}
      {activeTab === 'tumor-board' && (
        <div className="space-y-6">
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <BrainCircuit className="w-6 h-6 text-emerald-400" />
                <div>
                  <h2 className="text-lg font-bold text-white">Multidisciplinary Tumor Board Consensus Voting</h2>
                  <p className="text-xs text-slate-400">Variant of Unknown Significance (VUS) Re-Classification & Actionable Plan Signing</p>
                </div>
              </div>
              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-mono rounded-full font-bold">
                Panel Session: Active
              </span>
            </div>

            <div className="space-y-4">
              {genomicVariants.slice(0, 3).map((v) => (
                <div key={v.id} className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-emerald-400 font-mono">{v.gene} {v.alteration}</span>
                      <span className="text-xs text-slate-500">({v.somaticOrGermline})</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">Recommended Strategy: {v.fdaApprovedTherapies.join(', ')}</p>
                  </div>

                  <div className="flex items-center space-x-2">
                    {['Approve Protocol', 'Request Biomarker Repeat', 'Defer to Trial'].map((option) => (
                      <button
                        key={option}
                        onClick={() => handleCastTumorBoardVote(v.id, option)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                          tumorBoardVote[v.id] === option
                            ? 'bg-emerald-600 text-white border-emerald-400 shadow-md'
                            : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700'
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* DETAILED VARIANT MODAL INSPECTOR                                     */}
      {/* -------------------------------------------------------------------- */}
      {selectedVariant && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs font-mono font-bold text-emerald-400">{selectedVariant.id}</span>
                <h2 className="text-xl font-black text-white">{selectedVariant.gene} {selectedVariant.alteration}</h2>
              </div>
              <button
                onClick={() => setSelectedVariant(null)}
                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                &times;
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div><span className="text-slate-500">cDNA Change:</span> <strong className="text-white font-mono">{selectedVariant.cDNA}</strong></div>
                <div><span className="text-slate-500">Variant Allele Frequency:</span> <strong className="text-emerald-400 font-mono">{selectedVariant.vaf}%</strong></div>
                <div><span className="text-slate-500">Evidence Grade:</span> <strong className="text-cyan-300 font-mono">{selectedVariant.evidenceLevel}</strong></div>
                <div><span className="text-slate-500">Tier Status:</span> <strong className="text-purple-300 font-mono">{selectedVariant.tier}</strong></div>
              </div>

              <div>
                <h4 className="font-bold text-slate-200 mb-1">FDA Approved Targeted Therapies:</h4>
                <p className="text-emerald-300 font-mono bg-emerald-950/40 p-2.5 rounded border border-emerald-500/30">
                  {selectedVariant.fdaApprovedTherapies.join(', ')}
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-200 mb-1">Acquired Resistance Mechanisms:</h4>
                <p className="text-amber-300 font-mono bg-amber-950/40 p-2.5 rounded border border-amber-500/30">
                  {selectedVariant.resistanceMechanism}
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-800">
              <button
                onClick={() => setSelectedVariant(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-xl"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
