import React, { useState, useEffect } from 'react';
import { 
  Dna, 
  Activity, 
  ShieldAlert, 
  Zap, 
  UserCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  FileText, 
  Cpu, 
  Microscope,
  Sparkles,
  Database
} from 'lucide-react';

const BioAiDiagnosticsGenomicHub = () => {
  const [selectedSpecimen, setSelectedSpecimen] = useState('SPEC-GEN-902');
  const [showModal, setShowModal] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [protocolStatus, setProtocolStatus] = useState({
    ngsPipeline: false,
    crisprValidation: false,
    pathogenicityScan: false,
    targetedTherapy: false
  });

  // Genomic Sequencing Stream State
  const [genomicMetrics, setGenomicMetrics] = useState({
    meanCoverage: 145, // 145x NGS depth
    variantCalls: 1248,
    actionableOncoVariants: 4,
    aiConfidenceScore: 98.6,
    tumorMutationalBurden: 12.4, // TMB mut/Mb
    msiStatus: 'MSI-HIGH'
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setGenomicMetrics(prev => ({
        ...prev,
        meanCoverage: Math.floor(142 + Math.random() * 8),
        aiConfidenceScore: Math.round((98.2 + Math.random() * 0.7) * 10) / 10
      }));
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  const specimenList = [
    { id: 'SPEC-GEN-902', patient: 'Eleanor Vance', age: '52 yrs', tumorType: 'Non-Small Cell Lung Cancer (NSCLC)', variant: 'EGFR L858R / T790M', tmb: '12.4 mut/Mb', risk: 'HIGH_ACTIONABLE' },
    { id: 'SPEC-GEN-714', patient: 'Arthur Pendelton', age: '64 yrs', tumorType: 'Metastatic Melanoma', variant: 'BRAF V600E', tmb: '18.1 mut/Mb', risk: 'HIGH_ACTIONABLE' },
    { id: 'SPEC-GEN-883', patient: 'Clara Oswald', age: '41 yrs', tumorType: 'Triple-Negative Breast Cancer', variant: 'BRCA1 c.5266dupC', tmb: '8.2 mut/Mb', risk: 'HEREDITARY_RISK' },
    { id: 'SPEC-GEN-501', patient: 'Victor Stone', age: '59 yrs', tumorType: 'Colorectal Adenocarcinoma', variant: 'KRAS G12D', tmb: '4.5 mut/Mb', risk: 'RESISTANCE_MUTATION' }
  ];

  const genomicAlerts = [
    { id: 'ALT-GEN01', time: '15:02:12', type: 'CRITICAL', title: 'Acquired Resistance Variant Identified (EGFR T790M)', desc: 'Bio-AI DeepVariant pipeline detected subclonal EGFR T790M resistance mutation (Allele Frequency 8.4%). Osimertinib escalation recommended.', standard: 'NCCN / ESMO Biomarker Guidelines' },
    { id: 'ALT-GEN02', time: '14:38:00', type: 'WARNING', title: 'High Tumor Mutational Burden (TMB-High >10)', desc: 'TMB quantified at 12.4 mut/Mb. Patient meets eligibility criteria for Immune Checkpoint Inhibitor (Pembrolizumab).', standard: 'FDA Biomarker Approval Standard' },
    { id: 'ALT-GEN03', time: '13:50:20', type: 'INFO', title: 'Whole Exome NGS Alignment Complete', desc: 'Illumina NovaSeq 6000 run completed. 145x coverage depth achieved across 22,000 coding genes.', standard: 'HL7 FHIR R4 Genomics Implementation Guide' }
  ];

  const toggleProtocol = (proto) => {
    setProtocolStatus(prev => ({
      ...prev,
      [proto]: !prev[proto]
    }));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 font-sans">
      {/* Header Bar */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center pb-6 mb-6 border-b border-slate-800 gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-purple-500/10 border border-purple-500/30 rounded-xl text-purple-400">
              <Dna className="w-8 h-8 animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-purple-400 via-cyan-400 to-rose-400 bg-clip-text text-transparent">
                Bio-AI Diagnostics & Precision Genomic Overwatch
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Deep Learning Genomic Variant Calling, Oncogenic Driver Annotation & NCCN Targeted Therapy Engine
              </p>
            </div>
          </div>
        </div>

        {/* Action Triggers */}
        <div className="flex flex-wrap items-center gap-2">
          <button 
            onClick={() => toggleProtocol('targetedTherapy')}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition-all duration-200 border flex items-center gap-1.5 ${
              protocolStatus.targetedTherapy 
                ? 'bg-purple-600 text-white border-purple-500 shadow-lg shadow-purple-600/50 animate-bounce' 
                : 'bg-purple-950/40 text-purple-300 border-purple-800/60 hover:bg-purple-900/40'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            NCCN TARGETED THERAPY MATCH
          </button>

          <button 
            onClick={() => toggleProtocol('ngsPipeline')}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition-all duration-200 border flex items-center gap-1.5 ${
              protocolStatus.ngsPipeline 
                ? 'bg-cyan-600 text-white border-cyan-500 shadow-lg shadow-cyan-600/50' 
                : 'bg-cyan-950/40 text-cyan-300 border-cyan-800/60 hover:bg-cyan-900/40'
            }`}
          >
            <Cpu className="w-4 h-4" />
            RE-RUN DEEPVARIANT PIPELINE
          </button>

          <button 
            onClick={() => toggleProtocol('crisprValidation')}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition-all duration-200 border flex items-center gap-1.5 ${
              protocolStatus.crisprValidation 
                ? 'bg-rose-600 text-white border-rose-500 shadow-lg shadow-rose-600/50' 
                : 'bg-rose-950/40 text-rose-300 border-rose-800/60 hover:bg-rose-900/40'
            }`}
          >
            <Microscope className="w-4 h-4" />
            VALIDATE SOMATIC VARIANTS
          </button>
        </div>
      </header>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Specimen Roster */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-md">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-slate-300 flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-purple-400" />
                Genomic Specimen Roster
              </h2>
              <span className="px-2 py-0.5 text-[10px] bg-purple-950 text-purple-400 border border-purple-800 rounded-full font-mono">
                4 Active NGS
              </span>
            </div>

            <div className="space-y-2">
              {specimenList.map(sp => (
                <div 
                  key={sp.id}
                  onClick={() => setSelectedSpecimen(sp.id)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    selectedSpecimen === sp.id ? 'bg-slate-800/90 border-purple-500/60 shadow-lg shadow-purple-500/10' : 'bg-slate-950/60 border-slate-800/60 hover:border-slate-700'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-semibold text-slate-100">{sp.patient}</p>
                      <p className="text-xs text-slate-400 font-mono">{sp.id}</p>
                    </div>
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-purple-950 text-purple-400 border border-purple-800">
                      {sp.tmb}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-2"><strong className="text-slate-400">Diagnosis:</strong> {sp.tumorType}</p>
                  <p className="text-[11px] text-cyan-400 mt-1 font-mono">Driver: {sp.variant}</p>
                </div>
              ))}
            </div>
          </div>

          {/* AI Model Performance Metrics */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl">
            <h3 className="text-xs font-bold text-slate-300 flex items-center gap-2 mb-3">
              <Cpu className="w-4 h-4 text-cyan-400" />
              Bio-AI Model Inference Diagnostics
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800 text-slate-300">
                <span>Model Architecture:</span>
                <span className="font-mono text-cyan-400">BioTransformer-Genomics v4</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800 text-slate-300">
                <span>AI Confidence Score:</span>
                <span className="font-mono text-emerald-400">{genomicMetrics.aiConfidenceScore}%</span>
              </div>
              <div className="flex justify-between py-1 text-slate-300">
                <span>NGS Mean Depth:</span>
                <span className="font-mono text-purple-400">{genomicMetrics.meanCoverage}x Coverage</span>
              </div>
            </div>
          </div>
        </div>

        {/* Center Column: Genomic Variant Workbench */}
        <div className="lg:col-span-6 space-y-6">
          {/* Specimen Header Banner */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-wrap justify-between items-center gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold text-slate-100">Eleanor Vance</h2>
                <span className="px-2.5 py-0.5 text-xs bg-purple-950 text-purple-400 border border-purple-800 rounded-full font-semibold">
                  TMB-HIGH (12.4 mut/Mb)
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Specimen: Liquid Biopsy ctDNA | Stage IV NSCLC | Pathologist: Dr. R. Thorne, MD PhD
              </p>
            </div>
            <div className="flex gap-2">
              <span className="px-3 py-1 bg-slate-800 text-slate-300 rounded-lg text-xs font-mono border border-slate-700">
                HL7 FHIR R4 Genomics
              </span>
            </div>
          </div>

          {/* Key Biomarkers Dashboard */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-900/90 border border-purple-500/30 rounded-2xl p-4">
              <div className="text-xs font-bold text-purple-400 mb-1">DRIVER MUTATION</div>
              <div className="text-xl font-black font-mono text-purple-300">EGFR L858R</div>
              <div className="text-[10px] text-slate-400 mt-1">Exon 21 Substitution</div>
            </div>

            <div className="bg-slate-900/90 border border-rose-500/30 rounded-2xl p-4">
              <div className="text-xs font-bold text-rose-400 mb-1">RESISTANCE MUTATION</div>
              <div className="text-xl font-black font-mono text-rose-300">EGFR T790M</div>
              <div className="text-[10px] text-slate-400 mt-1">AF: 8.4% (Acquired)</div>
            </div>

            <div className="bg-slate-900/90 border border-cyan-500/30 rounded-2xl p-4">
              <div className="text-xs font-bold text-cyan-400 mb-1">MSI STATUS</div>
              <div className="text-xl font-black font-mono text-cyan-300">MSI-HIGH</div>
              <div className="text-[10px] text-slate-400 mt-1">Hypermutated Phenotype</div>
            </div>

            <div className="bg-slate-900/90 border border-emerald-500/30 rounded-2xl p-4">
              <div className="text-xs font-bold text-emerald-400 mb-1">MATCHED THERAPY</div>
              <div className="text-xl font-black font-mono text-emerald-300">Osimertinib</div>
              <div className="text-[10px] text-slate-400 mt-1">NCCN Category 1</div>
            </div>
          </div>

          {/* DNA Sequence & Alignment Display */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs font-bold text-slate-300 tracking-wider flex items-center gap-2">
                <Dna className="w-4 h-4 text-purple-400" />
                BIO-AI DNA SEQUENCING ALIGNMENT STREAM (chr7:55,249,000-55,249,100)
              </h3>
              <div className="flex items-center space-x-2 text-[10px] font-mono text-slate-400">
                <span className="inline-block w-2 h-2 rounded-full bg-purple-500 animate-ping"></span>
                <span>REAL-TIME ALIGNMENT</span>
              </div>
            </div>
            
            <div className="h-28 bg-slate-950 border border-slate-800/80 rounded-xl flex items-center justify-center p-4 font-mono text-xs text-slate-300 overflow-hidden">
              <div className="space-y-1 w-full text-center">
                <p className="text-slate-500">REF: ATGCGATCGA<span className="text-rose-400 font-bold bg-rose-950/60 px-1">C</span>TGACTAGCTAGCTAGCTA<span className="text-cyan-400 font-bold bg-cyan-950/60 px-1">T</span>GCTAGCTAGCTA</p>
                <p className="text-purple-300">ALT: ATGCGATCGA<span className="text-rose-400 font-bold bg-rose-950/90 px-1 animate-pulse">T</span>TGACTAGCTAGCTAGCTA<span className="text-cyan-400 font-bold bg-cyan-950/90 px-1">C</span>GCTAGCTAGCTA</p>
                <p className="text-[10px] text-slate-500">Confidence Score: 0.9984 | DeepVariant Call Quality: PASS Q50</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Bio-AI Recommendations & Alerts */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-sm font-bold text-slate-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                Genomic Insight Bulletins
              </h2>
              <span className="px-2 py-0.5 text-[10px] bg-purple-950 text-purple-400 border border-purple-800 rounded-full font-mono">
                {genomicAlerts.length} Actionable
              </span>
            </div>

            <div className="space-y-3">
              {genomicAlerts.map(alt => (
                <div 
                  key={alt.id}
                  onClick={() => { setSelectedAlert(alt); setShowModal(true); }}
                  className={`p-3 rounded-xl border cursor-pointer transition-all hover:scale-[1.02] ${
                    alt.type === 'CRITICAL' ? 'bg-rose-950/40 border-rose-800/80' :
                    alt.type === 'WARNING' ? 'bg-amber-950/40 border-amber-800/80' :
                    'bg-slate-950/60 border-slate-800'
                  }`}
                >
                  <div className="flex justify-between items-center text-[10px] text-slate-400 mb-1">
                    <span className="font-mono">{alt.time}</span>
                    <span className={`font-bold ${alt.type === 'CRITICAL' ? 'text-rose-400' : 'text-amber-400'}`}>{alt.type}</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-200">{alt.title}</h4>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{alt.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Regulatory & Guidelines Badge */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-2">
            <h3 className="text-xs font-bold text-slate-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Clinical Compliance & Standards
            </h3>
            <div className="text-[11px] text-slate-400 space-y-1">
              <p className="flex justify-between"><span>NCCN Guidelines:</span> <span className="text-emerald-400 font-semibold">2026 v2 Matched</span></p>
              <p className="flex justify-between"><span>FDA 21 CFR Part 11:</span> <span className="text-emerald-400 font-semibold">Validated</span></p>
              <p className="flex justify-between"><span>HL7 FHIR Genomics R4:</span> <span className="text-emerald-400 font-semibold">Connected</span></p>
            </div>
          </div>
        </div>

      </div>

      {/* Modal Inspector */}
      {showModal && selectedAlert && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-rose-950 text-rose-400 border border-rose-800 rounded-md">
                  {selectedAlert.type} BIOMARKER ALERT
                </span>
                <h3 className="text-lg font-bold text-slate-100 mt-2">{selectedAlert.title}</h3>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-200 font-mono text-xl">×</button>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed">{selectedAlert.desc}</p>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs text-slate-400 space-y-1">
              <p><strong className="text-slate-200">Standard Framework:</strong> {selectedAlert.standard}</p>
              <p><strong className="text-slate-200">Clinical Recommendation:</strong> Switch 1st-generation TKI therapy to 3rd-generation Osimertinib (80mg daily). Order follow-up ctDNA liquid biopsy in 8 weeks.</p>
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold">Dismiss</button>
              <button onClick={() => { alert('Precision Targeted Therapy Order Dispatched to Molecular Tumor Board'); setShowModal(false); }} className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-purple-600/40">Submit to Tumor Board</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BioAiDiagnosticsGenomicHub;
