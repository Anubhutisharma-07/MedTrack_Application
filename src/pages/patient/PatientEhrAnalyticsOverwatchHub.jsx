import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Activity, 
  ShieldAlert, 
  Zap, 
  UserCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  Droplet, 
  Database,
  BrainCircuit,
  Search
} from 'lucide-react';

const PatientEhrAnalyticsOverwatchHub = () => {
  const [selectedPatient, setSelectedPatient] = useState('EHR-1092');
  const [showModal, setShowModal] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [protocolStatus, setProtocolStatus] = useState({
    predictiveRisk: false,
    readmissionLock: false,
    ehrAuditExport: false,
    fhirSync: false
  });

  // EHR Analytics State
  const [analytics, setAnalytics] = useState({
    readmissionRiskScore: 78.4, // %
    sepsisMortalityRisk: 34.2, // %
    lengthOfStayPredictDays: 4.8,
    polypharmacyRisk: 'HIGH_ALERT',
    auditTrailIntegrity: 100
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setAnalytics(prev => ({
        ...prev,
        readmissionRiskScore: Math.round((77.5 + Math.random() * 2.0) * 10) / 10,
        sepsisMortalityRisk: Math.round((33.0 + Math.random() * 2.5) * 10) / 10
      }));
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  const patientList = [
    { id: 'EHR-1092', name: 'Eleanor Vance', age: '72 yrs', room: 'Telemetry Room 304', risk: 'HIGH_READMISSION', score: '78.4%', diagnosis: 'Decompensated Heart Failure / CKD Stage IV' },
    { id: 'EHR-2041', name: 'Arthur Pendelton', age: '65 yrs', room: 'ICU Bed 05', risk: 'SEPSIS_ALERT', score: '34.2%', diagnosis: 'Severe Pneumonia / Septic Shock' },
    { id: 'EHR-3389', name: 'Clara Oswald', age: '54 yrs', room: 'Stepdown Room 212', risk: 'STABLE', score: '12.1%', diagnosis: 'Post-Cholecystectomy / Routine Discharge' },
    { id: 'EHR-4501', name: 'Victor Stone', age: '81 yrs', room: 'Geriatric Bed 18', risk: 'POLYPHARMACY', score: '62.0%', diagnosis: 'COPD Exacerbation / Multi-Morbidity' }
  ];

  const ehrAlerts = [
    { id: 'ALT-EHR01', time: '15:28:00', type: 'CRITICAL', title: 'Predictive 30-Day Readmission Risk Spike (>75%)', desc: 'AI predictive model flagged 78.4% readmission probability due to rising NT-proBNP (4,200 pg/mL) & eGFR decline (22 mL/min).', standard: 'CMS LACE Index / Epic Readmission Model' },
    { id: 'ALT-EHR02', time: '14:50:12', type: 'WARNING', title: 'Polypharmacy Drug-Drug Interaction Alert', desc: 'Concurrent order of Amiodarone & Warfarin identified. INR prolongation risk elevated (Target INR 2.0-3.0).', standard: 'FDA 21 CFR Part 11 / Beer’s Criteria' },
    { id: 'ALT-EHR03', time: '13:15:45', type: 'INFO', title: 'Zero-Trust EHR Audit Trail Logging Verified', desc: 'Cryptographic SHA-256 ledger logged 1,240 FHIR R4 clinical observation events.', standard: 'HIPAA Security Rule / NIST SP 800-53' }
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
            <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-400">
              <BrainCircuit className="w-8 h-8 animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 via-purple-400 to-rose-400 bg-clip-text text-transparent">
                Patient EHR Analytics & Predictive Care Overwatch
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Zero-Egress Machine Learning Readmission Engine, Polypharmacy Safety Guardrails & HL7 FHIR R4 Analytics
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button 
            onClick={() => toggleProtocol('predictiveRisk')}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition-all duration-200 border flex items-center gap-1.5 ${
              protocolStatus.predictiveRisk 
                ? 'bg-rose-600 text-white border-rose-500 shadow-lg shadow-rose-600/50 animate-bounce' 
                : 'bg-rose-950/40 text-rose-300 border-rose-800/60 hover:bg-rose-900/40'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            RE-RUN PREDICTIVE RISK MODEL
          </button>

          <button 
            onClick={() => toggleProtocol('readmissionLock')}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition-all duration-200 border flex items-center gap-1.5 ${
              protocolStatus.readmissionLock 
                ? 'bg-purple-600 text-white border-purple-500 shadow-lg shadow-purple-600/50' 
                : 'bg-purple-950/40 text-purple-300 border-purple-800/60 hover:bg-purple-900/40'
            }`}
          >
            <Zap className="w-4 h-4" />
            DISCHARGE SAFETY LOCK
          </button>

          <button 
            onClick={() => toggleProtocol('fhirSync')}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition-all duration-200 border flex items-center gap-1.5 ${
              protocolStatus.fhirSync 
                ? 'bg-cyan-600 text-white border-cyan-500 shadow-lg shadow-cyan-600/50' 
                : 'bg-cyan-950/40 text-cyan-300 border-cyan-800/60 hover:bg-cyan-900/40'
            }`}
          >
            <Database className="w-4 h-4" />
            EXPORT AUDIT LEDGER
          </button>
        </div>
      </header>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: EHR Patient Roster */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-md">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-slate-300 flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-cyan-400" />
                Active EHR Census
              </h2>
              <span className="px-2 py-0.5 text-[10px] bg-cyan-950 text-cyan-400 border border-cyan-800 rounded-full font-mono">
                4 Monitored EHRs
              </span>
            </div>

            <div className="space-y-2">
              {patientList.map(pt => (
                <div 
                  key={pt.id}
                  onClick={() => setSelectedPatient(pt.id)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    selectedPatient === pt.id ? 'bg-slate-800/90 border-cyan-500/60 shadow-lg shadow-cyan-500/10' : 'bg-slate-950/60 border-slate-800/60 hover:border-slate-700'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-semibold text-slate-100">{pt.name}</p>
                      <p className="text-xs text-slate-400 font-mono">{pt.id} • {pt.room}</p>
                    </div>
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${
                      pt.risk === 'HIGH_READMISSION' ? 'bg-rose-950 text-rose-400 border border-rose-800' :
                      pt.risk === 'SEPSIS_ALERT' ? 'bg-amber-950 text-amber-400 border border-amber-800' :
                      'bg-emerald-950 text-emerald-400 border border-emerald-800'
                    }`}>
                      Risk {pt.score}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-2"><strong className="text-slate-400">Diagnosis:</strong> {pt.diagnosis}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Polypharmacy Safety Guardrail Card */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl">
            <h3 className="text-xs font-bold text-slate-300 flex items-center gap-2 mb-3">
              <Activity className="w-4 h-4 text-purple-400" />
              Polypharmacy & Interaction Engine
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800 text-slate-300">
                <span>Active Prescriptions:</span>
                <span className="font-mono text-purple-400">14 Medications</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800 text-slate-300">
                <span>High-Risk Interactions:</span>
                <span className="font-mono text-rose-400">2 Critical Flagged</span>
              </div>
              <div className="flex justify-between py-1 text-slate-300">
                <span>Beer’s Criteria Score:</span>
                <span className="font-mono text-amber-400">ELEVATED RISK</span>
              </div>
            </div>
          </div>
        </div>

        {/* Center Column: Predictive Analytics Dashboard */}
        <div className="lg:col-span-6 space-y-6">
          {/* Patient Overview Header Banner */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-wrap justify-between items-center gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold text-slate-100">Eleanor Vance</h2>
                <span className="px-2.5 py-0.5 text-xs bg-rose-950 text-rose-400 border border-rose-800 rounded-full font-semibold">
                  30-DAY READMISSION HIGH RISK
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                MRN: 1092841 • Female • 72 Yrs • Telemetry Room 304 • Attending Physician: Dr. M. Ross, MD
              </p>
            </div>
            <div className="flex gap-2">
              <span className="px-3 py-1 bg-slate-800 text-slate-300 rounded-lg text-xs font-mono border border-slate-700">
                FHIR R4 Validated
              </span>
            </div>
          </div>

          {/* Core Analytics Vitals Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-900/90 border border-rose-500/30 rounded-2xl p-4">
              <div className="text-xs font-bold text-rose-400 mb-1">READMISSION RISK</div>
              <div className="text-3xl font-black font-mono text-rose-400">{analytics.readmissionRiskScore}%</div>
              <div className="text-[10px] text-slate-400 mt-1">CMS LACE Target &lt;40%</div>
            </div>

            <div className="bg-slate-900/90 border border-amber-500/30 rounded-2xl p-4">
              <div className="text-xs font-bold text-amber-400 mb-1">SEPSIS MORTALITY</div>
              <div className="text-3xl font-black font-mono text-amber-400">{analytics.sepsisMortalityRisk}%</div>
              <div className="text-[10px] text-slate-400 mt-1">Predictive XGBoost</div>
            </div>

            <div className="bg-slate-900/90 border border-cyan-500/30 rounded-2xl p-4">
              <div className="text-xs font-bold text-cyan-400 mb-1">PREDICTED LOS</div>
              <div className="text-3xl font-black font-mono text-cyan-400">{analytics.lengthOfStayPredictDays} <span className="text-xs font-normal text-slate-400">days</span></div>
              <div className="text-[10px] text-slate-400 mt-1">Length of Stay</div>
            </div>

            <div className="bg-slate-900/90 border border-emerald-500/30 rounded-2xl p-4">
              <div className="text-xs font-bold text-emerald-400 mb-1">AUDIT TRAIL</div>
              <div className="text-3xl font-black font-mono text-emerald-400">100%</div>
              <div className="text-[10px] text-slate-400 mt-1">Cryptographic Ledger</div>
            </div>
          </div>

          {/* Longitudinal EHR Biomarker Trend Stream */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs font-bold text-slate-300 tracking-wider flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                LONGITUDINAL BIOMARKER & LAB TRAJECTORY STREAM (72 HOURS)
              </h3>
              <div className="flex items-center space-x-2 text-[10px] font-mono text-slate-400">
                <span className="inline-block w-2 h-2 rounded-full bg-cyan-500 animate-ping"></span>
                <span>REAL-TIME EHR SYNC</span>
              </div>
            </div>
            
            <div className="h-32 bg-slate-950 border border-slate-800/80 rounded-xl flex items-center justify-center p-4 relative overflow-hidden">
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]"></div>
              <svg className="w-full h-full text-cyan-400 stroke-current fill-none" viewBox="0 0 500 100" preserveAspectRatio="none">
                <path 
                  strokeWidth="2" 
                  d="M 0,30 L 50,45 L 100,20 L 150,60 L 200,35 L 250,80 L 300,50 L 350,85 L 400,40 L 450,75 L 500,25" 
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Right Column: Alerts & Decision Support */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-sm font-bold text-slate-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                Predictive Care Bulletins
              </h2>
              <span className="px-2 py-0.5 text-[10px] bg-cyan-950 text-cyan-400 border border-cyan-800 rounded-full font-mono">
                {ehrAlerts.length} Active
              </span>
            </div>

            <div className="space-y-3">
              {ehrAlerts.map(alt => (
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
              EHR Compliance Standards
            </h3>
            <div className="text-[11px] text-slate-400 space-y-1">
              <p className="flex justify-between"><span>HL7 FHIR R4:</span> <span className="text-emerald-400 font-semibold">Validated</span></p>
              <p className="flex justify-between"><span>FDA 21 CFR Part 11:</span> <span className="text-emerald-400 font-semibold">Audit Ready</span></p>
              <p className="flex justify-between"><span>HIPAA Privacy Guard:</span> <span className="text-emerald-400 font-semibold">Active</span></p>
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
                  {selectedAlert.type} ANALYTICS ALERT
                </span>
                <h3 className="text-lg font-bold text-slate-100 mt-2">{selectedAlert.title}</h3>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-200 font-mono text-xl">×</button>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed">{selectedAlert.desc}</p>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs text-slate-400 space-y-1">
              <p><strong className="text-slate-200">Standard Framework:</strong> {selectedAlert.standard}</p>
              <p><strong className="text-slate-200">Recommended Action:</strong> Engage Heart Failure transitional care coordinator. Order post-discharge 48-hour home health visit & remote tele-monitoring.</p>
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold">Dismiss</button>
              <button onClick={() => { alert('Transitional Care Protocol Enforced'); setShowModal(false); }} className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-cyan-600/40">Activate Transitional Care</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientEhrAnalyticsOverwatchHub;
