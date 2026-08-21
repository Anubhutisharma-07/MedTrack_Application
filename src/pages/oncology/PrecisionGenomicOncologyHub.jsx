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
  Microscope, 
  Sparkles,
  Award,
  Layers
} from 'lucide-react';

const PrecisionGenomicOncologyHub = () => {
  const [selectedPatient, setSelectedPatient] = useState('ONCO-9921');
  const [showModal, setShowModal] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [protocolStatus, setProtocolStatus] = useState({
    tumorBoard: false,
    crisprEdit: false,
    checkpointInhibitor: false,
    trialMatch: false
  });

  // Genomic Precision Telemetry State
  const [oncoData, setOncoData] = useState({
    ctDnaFraction: 14.8, // % circulating tumor DNA
    tmbScore: 16.4, // Mutations / Mb
    pdL1Expression: 85, // % TPS
    homologousRecombination: 'HRD-POSITIVE',
    aiMatchConfidence: 99.1
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setOncoData(prev => ({
        ...prev,
        ctDnaFraction: Math.round((14.0 + Math.random() * 1.5) * 10) / 10,
        aiMatchConfidence: Math.round((98.8 + Math.random() * 0.5) * 10) / 10
      }));
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  const patientList = [
    { id: 'ONCO-9921', name: 'Dr. Evelyn Reed', age: '56 yrs', cancer: 'Metastatic Pancreatic Ductal Adenocarcinoma', driver: 'KRAS G12C / TP53', tmb: '16.4 mut/Mb', status: 'ACTIONABLE' },
    { id: 'ONCO-8102', name: 'Julian Mercer', age: '63 yrs', cancer: 'Metastatic Colorectal Adenocarcinoma', driver: 'BRAF V600E / MSI-H', tmb: '22.1 mut/Mb', status: 'ACTIONABLE' },
    { id: 'ONCO-7734', name: 'Samantha Wu', age: '48 yrs', cancer: 'High-Grade Serous Ovarian Carcinoma', driver: 'BRCA2 Pathogenic / HRD+', tmb: '9.2 mut/Mb', status: 'STABLE' },
    { id: 'ONCO-6119', name: 'Gabriel Thorne', age: '71 yrs', cancer: 'Castration-Resistant Prostate Cancer', driver: 'AR-V7 / PTEN Loss', tmb: '5.8 mut/Mb', status: 'RESISTANCE_ALERT' }
  ];

  const oncoAlerts = [
    { id: 'ALT-ONC01', time: '15:20:40', type: 'CRITICAL', title: 'Actionable KRAS G12C Driver Mutation Detected', desc: 'Circulating tumor DNA ctDNA identified KRAS G12C mutation with 14.8% VAF. Matched with Sotorasib / Adagrasib NCCN Category 1.', standard: 'NCCN / ESMO Biomarker Standard' },
    { id: 'ALT-ONC02', time: '14:40:15', type: 'WARNING', title: 'HRD Positive Score Status', desc: 'Homologous Recombination Deficiency (HRD) genomic instability score elevated (68). PARP inhibitor (Niraparib) escalation recommended.', standard: 'FDA Biomarker Approval' },
    { id: 'ALT-ONC03', time: '13:10:00', type: 'INFO', title: 'Liquid Biopsy ctDNA Monitoring Completed', desc: 'Guardant360 74-gene panel alignment completed with 5000x ultra-deep coverage.', standard: 'HL7 FHIR R4 Genomics Standard' }
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
            <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400">
              <Microscope className="w-8 h-8 animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-rose-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                Precision Genomic Oncology & Molecular Tumor Board Hub
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                ctDNA Liquid Biopsy Surveillance, NCCN Category 1 Biomarker Matching & Immunotherapy Engine
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button 
            onClick={() => toggleProtocol('tumorBoard')}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition-all duration-200 border flex items-center gap-1.5 ${
              protocolStatus.tumorBoard 
                ? 'bg-rose-600 text-white border-rose-500 shadow-lg shadow-rose-600/50 animate-bounce' 
                : 'bg-rose-950/40 text-rose-300 border-rose-800/60 hover:bg-rose-900/40'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            CONVENE MOLECULAR TUMOR BOARD
          </button>

          <button 
            onClick={() => toggleProtocol('checkpointInhibitor')}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition-all duration-200 border flex items-center gap-1.5 ${
              protocolStatus.checkpointInhibitor 
                ? 'bg-purple-600 text-white border-purple-500 shadow-lg shadow-purple-600/50' 
                : 'bg-purple-950/40 text-purple-300 border-purple-800/60 hover:bg-purple-900/40'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            CHECKPOINT INHIBITOR PROTOCOL
          </button>

          <button 
            onClick={() => toggleProtocol('trialMatch')}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition-all duration-200 border flex items-center gap-1.5 ${
              protocolStatus.trialMatch 
                ? 'bg-cyan-600 text-white border-cyan-500 shadow-lg shadow-cyan-600/50' 
                : 'bg-cyan-950/40 text-cyan-300 border-cyan-800/60 hover:bg-cyan-900/40'
            }`}
          >
            <Layers className="w-4 h-4" />
            MATCH CLINICAL TRIALS
          </button>
        </div>
      </header>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Patient Roster */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-md">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-slate-300 flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-rose-400" />
                Oncology Patient Roster
              </h2>
              <span className="px-2 py-0.5 text-[10px] bg-rose-950 text-rose-400 border border-rose-800 rounded-full font-mono">
                4 Active Sequencing
              </span>
            </div>

            <div className="space-y-2">
              {patientList.map(pt => (
                <div 
                  key={pt.id}
                  onClick={() => setSelectedPatient(pt.id)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    selectedPatient === pt.id ? 'bg-slate-800/90 border-rose-500/60 shadow-lg shadow-rose-500/10' : 'bg-slate-950/60 border-slate-800/60 hover:border-slate-700'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-semibold text-slate-100">{pt.name}</p>
                      <p className="text-xs text-slate-400 font-mono">{pt.id}</p>
                    </div>
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-rose-950 text-rose-400 border border-rose-800">
                      {pt.tmb}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-2"><strong className="text-slate-400">Diagnosis:</strong> {pt.cancer}</p>
                  <p className="text-[11px] text-cyan-400 mt-1 font-mono">Driver: {pt.driver}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Liquid Biopsy Monitor */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl">
            <h3 className="text-xs font-bold text-slate-300 flex items-center gap-2 mb-3">
              <Dna className="w-4 h-4 text-purple-400" />
              ctDNA Liquid Biopsy Status
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800 text-slate-300">
                <span>ctDNA Tumor Fraction:</span>
                <span className="font-mono text-rose-400">{oncoData.ctDnaFraction}% VAF</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800 text-slate-300">
                <span>PD-L1 TPS Score:</span>
                <span className="font-mono text-cyan-400">{oncoData.pdL1Expression}% Expression</span>
              </div>
              <div className="flex justify-between py-1 text-slate-300">
                <span>AI Matching Score:</span>
                <span className="font-mono text-emerald-400">{oncoData.aiMatchConfidence}% Confidence</span>
              </div>
            </div>
          </div>
        </div>

        {/* Center Column: Genomic Workbench */}
        <div className="lg:col-span-6 space-y-6">
          {/* Patient Banner */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-wrap justify-between items-center gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold text-slate-100">Dr. Evelyn Reed</h2>
                <span className="px-2.5 py-0.5 text-xs bg-rose-950 text-rose-400 border border-rose-800 rounded-full font-semibold">
                  TMB-HIGH (16.4 mut/Mb)
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                MRN: 992104 | Female | 56 Yrs | Metastatic Pancreatic Ductal Adenocarcinoma | Oncologist: Dr. C. Vance, MD
              </p>
            </div>
            <div className="flex gap-2">
              <span className="px-3 py-1 bg-slate-800 text-slate-300 rounded-lg text-xs font-mono border border-slate-700">
                NCCN Category 1
              </span>
            </div>
          </div>

          {/* Biomarker Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-900/90 border border-rose-500/30 rounded-2xl p-4">
              <div className="text-xs font-bold text-rose-400 mb-1">ONCOGENIC DRIVER</div>
              <div className="text-xl font-black font-mono text-rose-300">KRAS G12C</div>
              <div className="text-[10px] text-slate-400 mt-1">Somatic Mutation</div>
            </div>

            <div className="bg-slate-900/90 border border-purple-500/30 rounded-2xl p-4">
              <div className="text-xs font-bold text-purple-400 mb-1">TUMOR SUPPRESSOR</div>
              <div className="text-xl font-black font-mono text-purple-300">TP53 R273H</div>
              <div className="text-[10px] text-slate-400 mt-1">Loss of Function</div>
            </div>

            <div className="bg-slate-900/90 border border-cyan-500/30 rounded-2xl p-4">
              <div className="text-xs font-bold text-cyan-400 mb-1">IMMUNOTHERAPY</div>
              <div className="text-xl font-black font-mono text-cyan-300">Pembrolizumab</div>
              <div className="text-[10px] text-slate-400 mt-1">TMB-High Eligible</div>
            </div>

            <div className="bg-slate-900/90 border border-emerald-500/30 rounded-2xl p-4">
              <div className="text-xs font-bold text-emerald-400 mb-1">TARGETED DRUG</div>
              <div className="text-xl font-black font-mono text-emerald-300">Sotorasib</div>
              <div className="text-[10px] text-slate-400 mt-1">960mg Daily Oral</div>
            </div>
          </div>

          {/* Molecular Alignment & Sequence Visualization */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs font-bold text-slate-300 tracking-wider flex items-center gap-2">
                <Dna className="w-4 h-4 text-rose-400" />
                KRAS EXON 2 CODON 12 ULTRA-DEEP DNA SEQUENCING STREAM
              </h3>
              <div className="flex items-center space-x-2 text-[10px] font-mono text-slate-400">
                <span className="inline-block w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                <span>5000x DEPTH</span>
              </div>
            </div>
            
            <div className="h-28 bg-slate-950 border border-slate-800/80 rounded-xl flex items-center justify-center p-4 font-mono text-xs text-slate-300 overflow-hidden">
              <div className="space-y-1 w-full text-center">
                <p className="text-slate-500">WILD-TYPE: GGT GGC GTA GGC AAG AGT GCC TTG ACG ATAC</p>
                <p className="text-rose-400 font-bold">MUTANT:    GGT <span className="bg-rose-950 px-1 border border-rose-700 animate-pulse">TGC</span> GTA GGC AAG AGT GCC TTG ACG ATAC (p.Gly12Cys)</p>
                <p className="text-slate-500 text-[10px]">Variant Allele Frequency (VAF): 14.8% | Read Count: 740 / 5000</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Molecular Tumor Board Bulletins */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-sm font-bold text-slate-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                Tumor Board Alerts
              </h2>
              <span className="px-2 py-0.5 text-[10px] bg-rose-950 text-rose-400 border border-rose-800 rounded-full font-mono">
                {oncoAlerts.length} Actionable
              </span>
            </div>

            <div className="space-y-3">
              {oncoAlerts.map(alt => (
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

          {/* Compliance Card */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-2">
            <h3 className="text-xs font-bold text-slate-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Oncology Standards
            </h3>
            <div className="text-[11px] text-slate-400 space-y-1">
              <p className="flex justify-between"><span>NCCN Guidelines:</span> <span className="text-emerald-400 font-semibold">2026 Category 1</span></p>
              <p className="flex justify-between"><span>FDA 21 CFR Part 11:</span> <span className="text-emerald-400 font-semibold">Audit Passed</span></p>
              <p className="flex justify-between"><span>HL7 FHIR Genomics:</span> <span className="text-emerald-400 font-semibold">Synced</span></p>
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
                  {selectedAlert.type} MOLECULAR ALERT
                </span>
                <h3 className="text-lg font-bold text-slate-100 mt-2">{selectedAlert.title}</h3>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-200 font-mono text-xl">×</button>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed">{selectedAlert.desc}</p>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs text-slate-400 space-y-1">
              <p><strong className="text-slate-200">Standard Framework:</strong> {selectedAlert.standard}</p>
              <p><strong className="text-slate-200">Recommendation:</strong> Initiate Sotorasib 960mg PO Daily. Schedule repeat liquid biopsy ctDNA quantification at 4 weeks.</p>
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold">Dismiss</button>
              <button onClick={() => { alert('Precision Targeted Therapy Order Dispatched'); setShowModal(false); }} className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-rose-600/40">Authorize NCCN Therapy</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrecisionGenomicOncologyHub;
