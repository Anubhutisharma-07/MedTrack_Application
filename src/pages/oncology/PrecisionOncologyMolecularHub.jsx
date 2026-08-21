import React, { useState, useEffect, useMemo } from "react";
import {
  Dna,
  Activity,
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
  Pill,
  Target,
  Sparkles,
  Microscope,
  FileSpreadsheet,
  Atom,
  RefreshCw
} from "lucide-react";
import { downloadCsv } from "../../utils/csv";
import { useKindToasts, KindToastTray } from "../../components/common/HubToasts";
import { DetailRow as Row, AlertStatCard as StatCard, MiniStat as Vital } from "../../components/common/HubCards";

// ==========================================
// SEED MOLECULAR TUMOR BOARD COHORT
// ==========================================
const SEED_ONCOLOGY_PATIENTS = [
  {
    id: "PT-ONC-701",
    name: "Dr. Catherine Sterling",
    age: 58,
    gender: "Female",
    bed: "ONC-GEN-01",
    primaryTumor: "Metastatic Non-Small Cell Lung Adenocarcinoma (Stage IVB)",
    sampleType: "Liquid Biopsy (ctDNA) + FFPE Core Biopsy",
    ngsPanel: "Illumina TruSight Oncology 500 (TSO500)",
    tmb: 18.4, // mut/Mb (TMB-High)
    msiStatus: "MSI-High (32.4% unstable loci)",
    hrdScore: 48, // HRD Positive
    pdl1Tps: "85%", // High expression >= 50%
    primaryDrivers: [
      { gene: "EGFR", alteration: "Exon 19 Deletion (p.E746_A750del)", vaf: 34.2, tier: "Tier I-A (ESCAT I-A)", therapy: "Osimertinib (Tagrisso) 80mg Daily" },
      { gene: "EGFR", alteration: "Exon 20 p.C797S (Secondary Resistance)", vaf: 8.6, tier: "Tier I-R (ESCAT I-R)", therapy: "Brigatinib + Cetuximab (Clinical Trial Protocol)" },
      { gene: "TP53", alteration: "p.R273H (Dominant Negative)", vaf: 41.5, tier: "Tier I-B", therapy: "Genomic Surveillance / Anti-p53 Trials" }
    ],
    nccnGuideline: "NCCN NSCLC Guidelines v4.2026 (Category 1 Targeted)",
    esmoTier: "ESCAT Tier I-A Target",
    currentTherapy: "Osimertinib 80mg PO QD + Pembrolizumab 200mg IV q3w",
    radiologicalResponse: "Partial Response (-44% RECIST 1.1 Target Lesions)",
    status: "STABLE",
    ctDnaTrend: "Declining (from 52.4 to 12.1 hf-molecules/mL)",
    attendingOncologist: "Dr. Evelyn Ross, MD, PhD (Thoracic Precision Oncology)",
    tumorBoardDate: "2026-08-19 15:30",
    boardConsensus: "Continue Osimertinib with close ctDNA monitoring for C797S clone expansion. Prepare fourth-generation allosteric EGFR inhibitor basket trial if VAF > 15%.",
    alerts: [
      "Secondary Resistance Clone Identified: EGFR p.C797S VAF increasing (8.6%)",
      "High PD-L1 (TPS 85%) & TMB-H (18.4 mut/Mb) confers exceptional dual-checkpoint sensitivity"
    ]
  },
  {
    id: "PT-ONC-702",
    name: "Jonathan Vance",
    age: 63,
    gender: "Male",
    bed: "ONC-GEN-02",
    primaryTumor: "Metastatic Colorectal Adenocarcinoma (KRAS G12C)",
    sampleType: "Surgical Resection Fresh Frozen + ctDNA",
    ngsPanel: "FoundationOne CDx Comprehensive Panel",
    tmb: 28.6, // TMB-High
    msiStatus: "dMMR / MSI-High",
    hrdScore: 18,
    pdl1Tps: "40%",
    primaryDrivers: [
      { gene: "KRAS", alteration: "p.G12C (Exon 2 Codon 12)", vaf: 48.9, tier: "Tier I-A (ESCAT I-A)", therapy: "Adagrasib + Cetuximab Combination" },
      { gene: "PIK3CA", alteration: "p.E545K (Helical Domain)", vaf: 22.1, tier: "Tier II", therapy: "Alpelisib (Trial Off-Label / NCCN Category 2A)" },
      { gene: "APC", alteration: "p.R1450*", vaf: 55.4, tier: "Tier I-B", therapy: "Canonical Wnt Pathway Inactivation" }
    ],
    nccnGuideline: "NCCN Colon Cancer Guidelines v2.2026 (KRAS G12C Pathway)",
    esmoTier: "ESCAT Tier I-A Target",
    currentTherapy: "Adagrasib 600mg BID + Cetuximab 500mg/m2 q2w",
    radiologicalResponse: "Complete Metabolic Response on FDG-PET/CT",
    status: "EXCELLENT",
    ctDnaTrend: "Undetectable ctDNA (<0.01% VAF)",
    attendingOncologist: "Dr. Marcus Thorne, MD (Gastrointestinal Oncology)",
    tumorBoardDate: "2026-08-18 11:00",
    boardConsensus: "Maintain Adagrasib + Cetuximab targeted blockade. Excellent clearance of ctDNA confirmed on ultra-deep 100,000x error-suppressed duplex sequencing.",
    alerts: [
      "dMMR / MSI-High phenotype provides secondary Nivolumab + Ipilimumab escalation line",
      "PIK3CA co-mutation monitored for potential bypass feedback activation"
    ]
  },
  {
    id: "PT-ONC-703",
    name: "Aria Montgomery",
    age: 44,
    gender: "Female",
    bed: "ONC-GEN-03",
    primaryTumor: "High-Grade Serous Ovarian Carcinoma (Stage IIIC)",
    sampleType: "Omental Core Biopsy + Germline Blood",
    ngsPanel: "Myriad myChoice CDx Plus",
    tmb: 6.2,
    msiStatus: "MSS (Microsatellite Stable)",
    hrdScore: 74, // High HRD Genomic Scarring
    pdl1Tps: "<1%",
    primaryDrivers: [
      { gene: "BRCA1", alteration: "Germline c.68_69delAG (p.Glu23fs)", vaf: 49.8, tier: "Tier I-A (ESCAT I-A)", therapy: "Olaparib (Lynparza) 300mg BID Maintenance" },
      { gene: "TP53", alteration: "p.Y220C (Structural Instability)", vaf: 68.2, tier: "Tier I-B", therapy: "Synthetic Lethality PARP Pathway" },
      { gene: "RAD51C", alteration: "Promoter Hypermethylation", vaf: 30.0, tier: "Tier II", therapy: "Sensitizes to Platinum & PARP Inhibition" }
    ],
    nccnGuideline: "NCCN Ovarian Cancer Guidelines v1.2026 (PARPi Maintenance)",
    esmoTier: "ESCAT Tier I-A Target",
    currentTherapy: "Olaparib 300mg BID + Bevacizumab 15mg/kg q3w",
    radiologicalResponse: "Stable Disease / CA-125 normalized (12 U/mL)",
    status: "STABLE",
    ctDnaTrend: "Stable low-copy burden",
    attendingOncologist: "Dr. Helena Sterling, MD (Gynecologic Precision Oncology)",
    tumorBoardDate: "2026-08-19 14:00",
    boardConsensus: "HRD Score 74 and Germline BRCA1 loss-of-function confirm profound homologous recombination synthetic lethality. Olaparib maintenance indicated.",
    alerts: [
      "HRD Score 74 indicates extreme genomic scar index - PARPi maintenance mandatory",
      "Genetic counselor referral completed for 1st-degree family cascade screening"
    ]
  },
  {
    id: "PT-ONC-704",
    name: "Robert Langdon",
    age: 71,
    gender: "Male",
    bed: "ONC-GEN-04",
    primaryTumor: "Castration-Resistant Prostate Cancer (mCRPC)",
    sampleType: "Bone Biopsy + Circulating Tumor Cells (CTC)",
    ngsPanel: "Tempus xT 648-Gene Somatic & Germline Assay",
    tmb: 4.8,
    msiStatus: "MSS",
    hrdScore: 22,
    pdl1Tps: "0%",
    primaryDrivers: [
      { gene: "AR", alteration: "p.L702H (Steroid Binding Domain)", vaf: 58.4, tier: "Tier I-R", therapy: "Enzalutamide Resistance / Switch to 177Lu-PSMA-617" },
      { gene: "PTEN", alteration: "Homozygous Deep Deletion (Exons 1-9)", vaf: 90.0, tier: "Tier I-B", therapy: "Ipatasertib + Abiraterone Trial" },
      { gene: "SPOP", alteration: "p.F133V (MATH Domain)", vaf: 33.1, tier: "Tier II", therapy: "Favorable Androgen Receptor Dependency" }
    ],
    nccnGuideline: "NCCN Prostate Guidelines v3.2026 (mCRPC Radioligand)",
    esmoTier: "ESCAT Tier I-B Target",
    currentTherapy: "177Lu-vipivotide tetraxetan (Pluvicto) 7.4 GBq IV q6w",
    radiologicalResponse: "Prostate-Specific Membrane Antigen (PSMA) SUVmax reduction by 68%",
    status: "GUARDED",
    ctDnaTrend: "PSMA CTC count reduced from 42 to 4 cells/7.5mL",
    attendingOncologist: "Dr. Alistair Finch, MD (Urologic Medical Oncology)",
    tumorBoardDate: "2026-08-17 09:30",
    boardConsensus: "Progression on AR-directed inhibitors with AR L702H glucocorticoid switch mutation. Completed Cycle 2 177Lu-PSMA-617 radioligand therapy.",
    alerts: [
      "AR L702H mutation confers agonist response to prednisone - discontinue systemic steroids",
      "PTEN homozygous loss drives PI3K-AKT hyperactivation - monitor glucose metabolism"
    ]
  }
];

export default function PrecisionOncologyMolecularHub() {
  const { toasts, toast } = useKindToasts();
  const [patients, setPatients] = useState(SEED_ONCOLOGY_PATIENTS);
  const [selectedPatientId, setSelectedPatientId] = useState(SEED_ONCOLOGY_PATIENTS[0].id);
  const [activeTab, setActiveTab] = useState("overview"); // overview, drivers, hrd, calculator, trials
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTier, setFilterTier] = useState("ALL");
  const [inspectModalOpen, setInspectModalOpen] = useState(false);
  const [trialModal, setTrialModal] = useState(null);

  // Dynamic calculation workbench
  const [calcGene, setCalcGene] = useState("BRAF");
  const [calcMutation, setCalcMutation] = useState("p.V600E");
  const [calcVaf, setCalcVaf] = useState(38.5);
  const [calcTmbInput, setCalcTmbInput] = useState(14.2);
  const [calcLohCount, setCalcLohCount] = useState(18);
  const [calcTaiCount, setCalcTaiCount] = useState(16);
  const [calcLstCount, setCalcLstCount] = useState(14);
  const [calcBrcaMutated, setCalcBrcaMutated] = useState(true);

  const selectedPatient = useMemo(() => {
    return patients.find((p) => p.id === selectedPatientId) || patients[0];
  }, [patients, selectedPatientId]);

  // Filtered patients
  const filteredPatients = useMemo(() => {
    return patients.filter((pt) => {
      const matchesSearch =
        pt.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pt.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pt.primaryTumor.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pt.primaryDrivers.some((d) => d.gene.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesTier =
        filterTier === "ALL" ||
        (filterTier === "TMB_H" && pt.tmb >= 10) ||
        (filterTier === "HRD_POS" && pt.hrdScore >= 42) ||
        (filterTier === "RESISTANCE" && pt.primaryDrivers.some((d) => d.tier.includes("Resistance") || d.tier.includes("I-R")));
      return matchesSearch && matchesTier;
    });
  }, [patients, searchQuery, filterTier]);

  // Computed HRD Score in Workbench
  const computedHrdScore = useMemo(() => {
    return Number(calcLohCount) + Number(calcTaiCount) + Number(calcLstCount);
  }, [calcLohCount, calcTaiCount, calcLstCount]);

  const handleExportCsv = () => {
    const headers = [
      "Patient ID",
      "Name",
      "Age",
      "Primary Tumor",
      "Sample Type",
      "TMB (mut/Mb)",
      "MSI Status",
      "HRD Score",
      "PD-L1 TPS",
      "Primary Driver Gene",
      "Driver Alteration",
      "Variant Allele Frequency (%)",
      "Targeted Therapy Regimen",
      "ESMO ESCAT Tier",
      "Tumor Board Consensus"
    ];
    const rows = patients.map((p) => [
      p.id,
      p.name,
      p.age,
      p.primaryTumor,
      p.sampleType,
      p.tmb,
      p.msiStatus,
      p.hrdScore,
      p.pdl1Tps,
      p.primaryDrivers[0]?.gene || "N/A",
      p.primaryDrivers[0]?.alteration || "N/A",
      p.primaryDrivers[0]?.vaf || 0,
      p.currentTherapy,
      p.esmoTier,
      p.boardConsensus
    ]);
    downloadCsv("precision_oncology_molecular_manifest.csv", headers, rows);
    toast.success("Molecular Tumor Board genomics manifest exported to CSV.");
  };

  const triggerTrialEnrollment = (trialCode) => {
    setTrialModal(trialCode);
    toast.info(`Trial matching engine evaluated candidate for ${trialCode}.`);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-6 font-sans">
      <KindToastTray toasts={toasts} />

      {/* HEADER COMMAND BAR */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-950/80 border border-purple-500/30 text-purple-400 shadow-lg shadow-purple-950/50">
              <Dna className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white flex items-center gap-2">
                Precision Oncology & Molecular Tumor Board Hub
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/40 text-purple-300 font-semibold tracking-normal uppercase">
                  ESCAT / AMP / NCCN / TMB-H
                </span>
              </h1>
              <p className="text-sm text-slate-400">
                Next-Generation Sequencing (NGS) somatic variant annotation, HRD genomic scar quantification, ctDNA liquid biopsy kinetics, and precision clinical trial matching.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-stretch md:self-auto justify-end">
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold bg-slate-900 border border-slate-700 text-slate-200 hover:bg-slate-800 transition-all"
          >
            <Download className="w-3.5 h-3.5 text-purple-400" />
            EXPORT GENOMIC CSV
          </button>

          <button
            onClick={() => triggerTrialEnrollment("NCI-MATCH / TAPUR Precision Basket Trial")}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-extrabold bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-950 transition-all"
          >
            <Target className="w-4 h-4" />
            MATCH BASKET TRIALS
          </button>
        </div>
      </div>

      {/* QUICK STATS HEADER */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
        <StatCard
          icon={Users}
          label="Active Cohort"
          value={`${patients.length} Cases`}
          subtext="100% Genomic Profiled"
          color="purple"
        />
        <StatCard
          icon={Sparkles}
          label="TMB-High (>=10 mut/Mb)"
          value={patients.filter((p) => p.tmb >= 10).length.toString()}
          subtext="FDA Pan-Tumor ICI"
          color="cyan"
        />
        <StatCard
          icon={Atom}
          label="HRD-Positive (Score>=42)"
          value={patients.filter((p) => p.hrdScore >= 42).length.toString()}
          subtext="PARP Synthetic Lethal"
          color="rose"
        />
        <StatCard
          icon={Target}
          label="ESCAT Tier I Actionable"
          value={patients.filter((p) => p.esmoTier.includes("Tier I")).length.toString()}
          subtext="NCCN Category 1"
          color="emerald"
        />
        <StatCard
          icon={AlertTriangle}
          label="Resistance Clones"
          value={patients.filter((p) => p.primaryDrivers.some((d) => d.tier.includes("Resistance") || d.tier.includes("I-R"))).length.toString()}
          subtext="ctDNA Emergence"
          color="amber"
        />
        <StatCard
          icon={ShieldCheck}
          label="NGS CAP/CLIA Quality"
          value="Q30 > 94%"
          subtext="ISO 15189 Validated"
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
                <Microscope className="w-4 h-4 text-purple-400" />
                Genomic Tumor Board Cohort ({filteredPatients.length})
              </h2>
              <span className="text-xs text-slate-500 font-mono">NGS TSO500</span>
            </div>

            {/* SEARCH & FILTERS */}
            <div className="space-y-2 mb-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search gene, tumor, patient..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                {["ALL", "TMB_H", "HRD_POS", "RESISTANCE"].map((flt) => (
                  <button
                    key={flt}
                    onClick={() => setFilterTier(flt)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                      filterTier === flt
                        ? "bg-purple-500/20 text-purple-300 border border-purple-500/50"
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
                        ? "bg-slate-800/90 border-purple-500/60 shadow-lg shadow-purple-950/30 ring-1 ring-purple-500/30"
                        : "bg-slate-950/60 border-slate-800/80 hover:bg-slate-800/40 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-100">{p.name}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-purple-300">
                            {p.id}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 line-clamp-1">{p.primaryTumor}</p>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-purple-500/20 text-purple-300 border border-purple-500/40">
                        {p.esmoTier.split(" ")[1] || "Tier I"}
                      </span>
                    </div>

                    <div className="grid grid-cols-4 gap-1 pt-2 border-t border-slate-800/80 text-center text-[10px]">
                      <div className="bg-slate-900/60 rounded p-1">
                        <span className="text-slate-500 block">TMB</span>
                        <span className={`font-bold ${p.tmb >= 10 ? "text-cyan-400" : "text-slate-300"}`}>{p.tmb}</span>
                      </div>
                      <div className="bg-slate-900/60 rounded p-1">
                        <span className="text-slate-500 block">HRD</span>
                        <span className={`font-bold ${p.hrdScore >= 42 ? "text-rose-400" : "text-slate-300"}`}>{p.hrdScore}</span>
                      </div>
                      <div className="bg-slate-900/60 rounded p-1">
                        <span className="text-slate-500 block">MSI</span>
                        <span className="font-bold text-amber-300">{p.msiStatus.includes("High") ? "MSI-H" : "MSS"}</span>
                      </div>
                      <div className="bg-slate-900/60 rounded p-1">
                        <span className="text-slate-500 block">PD-L1</span>
                        <span className="font-bold text-emerald-300">{p.pdl1Tps}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: DETAILED MOLECULAR DOSSIER */}
        <div className="xl:col-span-8 space-y-4">
          {/* PATIENT BANNER */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-5 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
              <div>
                <div className="flex items-center gap-3">
                  <span className="text-xl md:text-2xl font-black text-white">{selectedPatient.name}</span>
                  <span className="text-xs px-2.5 py-1 rounded-md bg-purple-950 border border-purple-500/40 text-purple-300 font-mono font-bold">
                    {selectedPatient.id}
                  </span>
                  <span className="text-xs px-2.5 py-1 rounded-md bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-bold">
                    {selectedPatient.primaryTumor.split(" (")[0]}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1 flex items-center gap-3 flex-wrap">
                  <span>Age: <b className="text-slate-200">{selectedPatient.age} yo</b></span>
                  <span>•</span>
                  <span>Assay: <b className="text-slate-200">{selectedPatient.ngsPanel}</b></span>
                  <span>•</span>
                  <span>Sample: <b className="text-slate-200">{selectedPatient.sampleType}</b></span>
                  <span>•</span>
                  <span>Oncologist: <b className="text-purple-400">{selectedPatient.attendingOncologist}</b></span>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setInspectModalOpen(true)}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-purple-950 hover:bg-purple-900 text-purple-300 border border-purple-500/40 flex items-center gap-1.5 transition-all shadow-lg"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Full Molecular Dossier
                </button>
              </div>
            </div>

            {/* GENOMIC BIOMARKER STRIP */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5 mt-5 pt-4 border-t border-slate-800/80">
              <Vital label="Tumor Mutational Burden" value={`${selectedPatient.tmb} mut/Mb`} status={selectedPatient.tmb >= 10 ? "critical" : "normal"} />
              <Vital label="Microsatellite Instability" value={selectedPatient.msiStatus.split(" ")[0]} status={selectedPatient.msiStatus.includes("High") ? "critical" : "normal"} />
              <Vital label="HRD Scar Index" value={selectedPatient.hrdScore.toString()} status={selectedPatient.hrdScore >= 42 ? "critical" : "normal"} />
              <Vital label="PD-L1 TPS Expression" value={selectedPatient.pdl1Tps} status="normal" />
              <Vital label="ESCAT Tier" value={selectedPatient.esmoTier.split(" ")[1] || "Tier I-A"} status="normal" />
              <Vital label="RECIST Response" value="Partial (-44%)" status="normal" />
            </div>
          </div>

          {/* TAB NAVIGATION */}
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
            {[
              { id: "overview", label: "Somatic Variant Landscape", icon: Dna },
              { id: "drivers", label: "Targeted Inhibitors & Pathways", icon: Target },
              { id: "hrd", label: "HRD & Immunotherapy Signatures", icon: Atom },
              { id: "calculator", label: "Genomic Risk & VAF Workbench", icon: Sliders },
              { id: "trials", label: "Clinical Trial Matching Engine", icon: Sparkles }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    isActive
                      ? "bg-purple-500/20 text-purple-300 border border-purple-500/50 shadow-md shadow-purple-950/40"
                      : "bg-slate-900/60 text-slate-400 border border-slate-800/80 hover:text-slate-200 hover:bg-slate-800/60"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* TAB CONTENT: SOMATIC VARIANT LANDSCAPE */}
          {activeTab === "overview" && (
            <div className="space-y-4">
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl">
                <h3 className="text-sm font-bold text-slate-200 mb-3 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Dna className="w-4 h-4 text-purple-400" />
                    Actionable Somatic Alterations & Resistance Clones
                  </span>
                  <span className="text-[11px] font-mono text-purple-400">AMP/ASCO/CAP Classified</span>
                </h3>

                <div className="space-y-2.5">
                  {selectedPatient.primaryDrivers.map((drv, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-purple-300 text-sm">{drv.gene}</span>
                          <span className="text-slate-300 font-semibold">{drv.alteration}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 border border-slate-700 font-mono text-cyan-400">
                            VAF: {drv.vaf}%
                          </span>
                        </div>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          drv.tier.includes("Resistance") || drv.tier.includes("I-R")
                            ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                            : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                        }`}>
                          {drv.tier}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1.5 border-t border-slate-800/80">
                        <span>Matched Therapeutic Strategy:</span>
                        <span className="font-semibold text-slate-200">{drv.therapy}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* MOLECULAR TUMOR BOARD CONSENSUS */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl">
                <h3 className="text-sm font-bold text-slate-200 mb-2 flex items-center gap-2">
                  <Award className="w-4 h-4 text-cyan-400" />
                  Multidisciplinary Molecular Tumor Board Consensus & Action Plan
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed p-3 rounded-xl bg-slate-950 border border-slate-800">
                  {selectedPatient.boardConsensus}
                </p>
                <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                  <span>Tumor Board Session Date: <b className="text-slate-200">{selectedPatient.tumorBoardDate}</b></span>
                  <span>Guideline: <b className="text-cyan-400">{selectedPatient.nccnGuideline}</b></span>
                </div>
              </div>
            </div>
          )}

          {/* TAB CONTENT: TARGETED INHIBITORS */}
          {activeTab === "drivers" && (
            <div className="space-y-4">
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
                <h3 className="text-sm font-bold text-slate-200 mb-3 flex items-center gap-2">
                  <Pill className="w-4 h-4 text-emerald-400" />
                  Current Targeted Precision Regimen & ctDNA Response
                </h3>
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-slate-400">Active Regimen:</span>
                    <span className="text-xs font-mono font-bold text-emerald-400">NCCN Category 1</span>
                  </div>
                  <span className="text-base font-bold text-white block">{selectedPatient.currentTherapy}</span>
                  <div className="mt-3 pt-3 border-t border-slate-800 grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 block">ctDNA Liquid Biopsy Trend:</span>
                      <span className="font-semibold text-cyan-300">{selectedPatient.ctDnaTrend}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Radiographic Response (RECIST 1.1):</span>
                      <span className="font-semibold text-emerald-300">{selectedPatient.radiologicalResponse}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB CONTENT: HRD & IMMUNOTHERAPY SIGNATURES */}
          {activeTab === "hrd" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
                <h3 className="text-sm font-bold text-slate-200 mb-3 flex items-center gap-2">
                  <Atom className="w-4 h-4 text-purple-400" />
                  Homologous Recombination Deficiency (HRD)
                </h3>
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 mb-3 text-center">
                  <span className="text-xs text-slate-400 block">Combined Genomic Scar Index</span>
                  <span className={`text-4xl font-black font-mono ${selectedPatient.hrdScore >= 42 ? "text-rose-400" : "text-slate-300"}`}>
                    {selectedPatient.hrdScore}
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-1">Threshold &ge; 42: Synthetic Lethal with PARPi</span>
                </div>
                <div className="text-xs text-slate-300 space-y-1.5">
                  <div className="flex justify-between p-2 rounded bg-slate-950/60 border border-slate-800">
                    <span>Loss of Heterozygosity (LOH):</span>
                    <span className="font-mono text-purple-300 font-bold">Positive</span>
                  </div>
                  <div className="flex justify-between p-2 rounded bg-slate-950/60 border border-slate-800">
                    <span>Telomeric Allelic Imbalance (TAI):</span>
                    <span className="font-mono text-purple-300 font-bold">Positive</span>
                  </div>
                  <div className="flex justify-between p-2 rounded bg-slate-950/60 border border-slate-800">
                    <span>Large-Scale State Transitions (LST):</span>
                    <span className="font-mono text-purple-300 font-bold">Positive</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
                <h3 className="text-sm font-bold text-slate-200 mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  Immune Checkpoint Predictive Biomarkers
                </h3>
                <div className="space-y-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="flex justify-between mb-1">
                      <span className="text-slate-400">Tumor Mutational Burden (TMB):</span>
                      <span className="font-mono font-bold text-cyan-300">{selectedPatient.tmb} mut/Mb</span>
                    </div>
                    <span className="text-[11px] text-emerald-400 block font-semibold">
                      {selectedPatient.tmb >= 10 ? "✓ Meets FDA Pan-Tumor Pembrolizumab Indication" : "Standard Line Therapy"}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="flex justify-between mb-1">
                      <span className="text-slate-400">Microsatellite Instability:</span>
                      <span className="font-mono font-bold text-amber-300">{selectedPatient.msiStatus}</span>
                    </div>
                    <span className="text-[11px] text-slate-300 block">
                      {selectedPatient.msiStatus.includes("High") ? "Deficient Mismatch Repair (dMMR) confirmed." : "Microsatellite Stable."}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB CONTENT: GENOMIC WORKBENCH */}
          {activeTab === "calculator" && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-purple-400" />
                  Somatic Genomic Risk & HRD Simulation Workbench
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Calculate combined HRD scar scores and evaluate TMB / VAF clonality thresholds.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider">HRD Scar Components</h4>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Loss of Heterozygosity (LOH): {calcLohCount}</label>
                    <input
                      type="range"
                      min="0"
                      max="30"
                      value={calcLohCount}
                      onChange={(e) => setCalcLohCount(parseInt(e.target.value))}
                      className="w-full accent-purple-400"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Telomeric Allelic Imbalance (TAI): {calcTaiCount}</label>
                    <input
                      type="range"
                      min="0"
                      max="30"
                      value={calcTaiCount}
                      onChange={(e) => setCalcTaiCount(parseInt(e.target.value))}
                      className="w-full accent-purple-400"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Large-Scale State Transitions (LST): {calcLstCount}</label>
                    <input
                      type="range"
                      min="0"
                      max="30"
                      value={calcLstCount}
                      onChange={(e) => setCalcLstCount(parseInt(e.target.value))}
                      className="w-full accent-purple-400"
                    />
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">TMB & Somatic VAF</h4>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">TMB (mut/Mb): {calcTmbInput}</label>
                    <input
                      type="range"
                      min="0"
                      max="50"
                      step="0.5"
                      value={calcTmbInput}
                      onChange={(e) => setCalcTmbInput(parseFloat(e.target.value))}
                      className="w-full accent-cyan-400"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Variant Allele Frequency (VAF): {calcVaf}%</label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="0.5"
                      value={calcVaf}
                      onChange={(e) => setCalcVaf(parseFloat(e.target.value))}
                      className="w-full accent-cyan-400"
                    />
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2">Simulated Outcome</h4>
                    <div className="space-y-2 text-xs">
                      <div className="p-2 rounded bg-slate-900 border border-slate-800 flex justify-between">
                        <span className="text-slate-400">Total HRD Score:</span>
                        <span className={`font-mono font-bold ${computedHrdScore >= 42 ? "text-rose-400" : "text-slate-200"}`}>
                          {computedHrdScore} / 90
                        </span>
                      </div>
                      <div className="p-2 rounded bg-slate-900 border border-slate-800 flex justify-between">
                        <span className="text-slate-400">PARPi Synthetic Lethal:</span>
                        <span className="font-bold text-emerald-400">
                          {computedHrdScore >= 42 ? "POSITIVE (Indicated)" : "NEGATIVE"}
                        </span>
                      </div>
                      <div className="p-2 rounded bg-slate-900 border border-slate-800 flex justify-between">
                        <span className="text-slate-400">ICI Immunotherapy:</span>
                        <span className="font-bold text-cyan-300">
                          {calcTmbInput >= 10 ? "TMB-High (Eligible)" : "TMB-Low"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => toast.success("Simulated genomic indices saved to Molecular Tumor Board registry.")}
                    className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg text-xs transition-all shadow-md mt-4"
                  >
                    Commit Simulated Biomarkers
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB CONTENT: TRIALS */}
          {activeTab === "trials" && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <Target className="w-4 h-4 text-purple-400" />
                Matched Precision Basket & Umbrella Oncology Trials
              </h3>
              <div className="space-y-2 text-xs">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-white block">TAPUR-2026-EGFR: Allosteric Fourth-Gen EGFR Inhibition</span>
                    <span className="text-slate-400">Matched to C797S resistance clone • Phase II • Recruiting</span>
                  </div>
                  <button
                    onClick={() => triggerTrialEnrollment("TAPUR-2026-EGFR")}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold"
                  >
                    Screen Patient
                  </button>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-white block">NCI-MATCH-Z1D: PARP Inhibitor + ATR Kinase Combination</span>
                    <span className="text-slate-400">Matched to HRD Score &ge; 42 • Phase II • Multi-Center</span>
                  </div>
                  <button
                    onClick={() => triggerTrialEnrollment("NCI-MATCH-Z1D")}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold"
                  >
                    Screen Patient
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
              <div className="p-2 bg-purple-500/10 border border-purple-500/30 rounded-lg text-purple-400">
                <Dna className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Full NGS Genomic Report: {selectedPatient.name}</h2>
                <p className="text-xs text-slate-400">ID: {selectedPatient.id} | Assay: {selectedPatient.ngsPanel}</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <Row label="Primary Malignancy" value={selectedPatient.primaryTumor} />
              <Row label="Tumor Mutational Burden (TMB)" value={`${selectedPatient.tmb} mut/Mb`} />
              <Row label="MSI Phenotype" value={selectedPatient.msiStatus} />
              <Row label="HRD Genomic Scar Score" value={selectedPatient.hrdScore} />
              <Row label="PD-L1 TPS Expression" value={selectedPatient.pdl1Tps} />
              <Row label="Active Targeted Regimen" value={selectedPatient.currentTherapy} />
              <Row label="Attending Oncologist" value={selectedPatient.attendingOncologist} />
              <Row label="Board Consensus Epoch" value={selectedPatient.tumorBoardDate} />
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

      {/* TRIAL MODAL */}
      {trialModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="bg-purple-950/90 border border-purple-500/60 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative text-purple-100">
            <button
              onClick={() => setTrialModal(null)}
              className="absolute top-4 right-4 text-purple-300 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 mb-4">
              <Target className="w-8 h-8 text-purple-400" />
              <div>
                <h2 className="text-xl font-black text-white">{trialModal}</h2>
                <p className="text-xs text-purple-200">Patient: {selectedPatient.name} ({selectedPatient.id})</p>
              </div>
            </div>
            <p className="text-sm text-purple-100 mb-4">
              Candidate genomic biomarker pre-screening verified. All inclusion/exclusion criteria for basket protocol match.
            </p>
            <div className="p-3 bg-black/40 rounded-xl border border-purple-500/30 text-xs space-y-2 mb-6">
              <div>• Biomarker Match: <b>{selectedPatient.primaryDrivers[0]?.gene} {selectedPatient.primaryDrivers[0]?.alteration}</b></div>
              <div>• TMB Status: <b>{selectedPatient.tmb} mut/Mb</b></div>
              <div>• Genomic Scarring: <b>HRD {selectedPatient.hrdScore}</b></div>
            </div>
            <button
              onClick={() => {
                toast.success(`Screening package dispatched for ${trialModal}.`);
                setTrialModal(null);
              }}
              className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-extrabold rounded-xl text-xs transition-all shadow-lg"
            >
              Submit Trial Referral Package
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
