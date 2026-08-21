import React, { useState, useEffect } from 'react';
import { 
  Heart, 
  Activity, 
  Thermometer, 
  ShieldAlert, 
  Zap, 
  UserCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  FileText, 
  Droplet, 
  RefreshCw,
  Search,
  Filter,
  Syringe,
  Baby
} from 'lucide-react';

const PediatricIcuOverwatchHub = () => {
  const [selectedPatient, setSelectedPatient] = useState('PED-8942');
  const [activeTab, setActiveTab] = useState('telemetry');
  const [filterSeverity, setFilterSeverity] = useState('ALL');
  const [showModal, setShowModal] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [protocolStatus, setProtocolStatus] = useState({
    codePeds: false,
    rapidResponse: false,
    septicShock: false,
    airwayEscalation: false
  });

  // Real-time telemetry simulation state
  const [vitals, setVitals] = useState({
    hr: 138,
    bpSys: 92,
    bpDia: 58,
    map: 69,
    spo2: 97,
    rr: 32,
    temp: 38.4,
    picp: 11,
    weightKg: 14.2,
    ageMonths: 28,
    pewsScore: 6 // Pediatric Early Warning Score
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setVitals(prev => ({
        ...prev,
        hr: Math.floor(132 + Math.random() * 12),
        spo2: Math.min(100, Math.floor(96 + Math.random() * 4)),
        rr: Math.floor(28 + Math.random() * 8),
        map: Math.floor(65 + Math.random() * 8)
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const patientList = [
    { id: 'PED-8942', name: 'Baby Liam Vance', age: '28 mos', weight: '14.2 kg', unit: 'PICU Bed 04', status: 'CRITICAL', score: 6, diagnosis: 'Severe Bronchiolitis / Pediatric Sepsis' },
    { id: 'PED-7719', name: 'Sophia Chen', age: '5 yrs', weight: '18.5 kg', unit: 'PICU Bed 08', status: 'STABLE', score: 2, diagnosis: 'Post-Op Coarctation Repair' },
    { id: 'PED-9021', name: 'Ethan Miller', age: '8 mos', weight: '7.8 kg', unit: 'NICU Bed 02', status: 'WARNING', score: 4, diagnosis: 'Congenital Diaphragmatic Hernia' },
    { id: 'PED-6304', name: 'Olivia Taylor', age: '12 yrs', weight: '36.0 kg', unit: 'PICU Bed 12', status: 'STABLE', score: 1, diagnosis: 'Status Asthmaticus (Resolving)' }
  ];

  const alerts = [
    { id: 'ALT-101', time: '14:22:05', type: 'CRITICAL', title: 'PEWS Escalation Threshold Exceeded', desc: 'PEWS score increased from 4 to 6 within 30 min. Sustained tachycardia (145 bpm) & tachypnea.', standard: 'PEWS / NEWS2 Standard' },
    { id: 'ALT-102', time: '14:05:12', type: 'WARNING', title: 'Weight-Based Dosing Safety Guardrail', desc: 'Fentanyl infusion rate approaching maximum age-adjusted safety threshold (2 mcg/kg/hr).', standard: 'FDA 21 CFR Part 11 / HL7 FHIR R4' },
    { id: 'ALT-103', time: '13:48:30', type: 'INFO', title: 'Continuous Arterial Line Damping Alert', desc: 'A-line waveform dampening detected in Right Radial line. Flush line required.', standard: 'AAMI / PICU Guideline' }
  ];

  const toggleProtocol = (proto) => {
    setProtocolStatus(prev => ({
      ...prev,
      [proto]: !prev[proto]
    }));
  };

  const handleOpenAlertModal = (alert) => {
    setSelectedAlert(alert);
    setShowModal(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 font-sans">
      {/* Header Bar */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center pb-6 mb-6 border-b border-slate-800 gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400">
              <Baby className="w-8 h-8 animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-rose-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">
                Pediatric & Neonatal ICU Overwatch Station
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Zero-Trust Real-Time Telemetry, Weight-Based Dosing Engine & PEWS Surveillance System
              </p>
            </div>
          </div>
        </div>

        {/* Emergency Protocol Triggers */}
        <div className="flex flex-wrap items-center gap-2">
          <button 
            onClick={() => toggleProtocol('codePeds')}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition-all duration-200 border flex items-center gap-1.5 ${
              protocolStatus.codePeds 
                ? 'bg-rose-600 text-white border-rose-500 shadow-lg shadow-rose-600/50 animate-bounce' 
                : 'bg-rose-950/40 text-rose-300 border-rose-800/60 hover:bg-rose-900/40'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            CODE PEDS STAT
          </button>

          <button 
            onClick={() => toggleProtocol('rapidResponse')}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition-all duration-200 border flex items-center gap-1.5 ${
              protocolStatus.rapidResponse 
                ? 'bg-amber-600 text-white border-amber-500 shadow-lg shadow-amber-600/50' 
                : 'bg-amber-950/40 text-amber-300 border-amber-800/60 hover:bg-amber-900/40'
            }`}
          >
            <Zap className="w-4 h-4" />
            PEDIATRIC MET / RRT
          </button>

          <button 
            onClick={() => toggleProtocol('septicShock')}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition-all duration-200 border flex items-center gap-1.5 ${
              protocolStatus.septicShock 
                ? 'bg-purple-600 text-white border-purple-500 shadow-lg shadow-purple-600/50' 
                : 'bg-purple-950/40 text-purple-300 border-purple-800/60 hover:bg-purple-900/40'
            }`}
          >
            <Droplet className="w-4 h-4" />
            PEDS SEPSIS PROTOCOL
          </button>
        </div>
      </header>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Patient Selector & Roster */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-md">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-slate-300 flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-cyan-400" />
                PICU Census & Roster
              </h2>
              <span className="px-2 py-0.5 text-[10px] bg-cyan-950 text-cyan-400 border border-cyan-800 rounded-full font-mono">
                4 Active Beds
              </span>
            </div>

            <div className="space-y-2">
              {patientList.map(pt => (
                <div 
                  key={pt.id}
                  onClick={() => setSelectedPatient(pt.id)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    selectedPatient === pt.id 
                      ? 'bg-slate-800/90 border-cyan-500/60 shadow-lg shadow-cyan-500/10' 
                      : 'bg-slate-950/60 border-slate-800/60 hover:border-slate-700'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-semibold text-slate-100">{pt.name}</p>
                      <p className="text-xs text-slate-400 font-mono">{pt.id} • {pt.unit}</p>
                    </div>
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${
                      pt.status === 'CRITICAL' ? 'bg-rose-950 text-rose-400 border border-rose-800' :
                      pt.status === 'WARNING' ? 'bg-amber-950 text-amber-400 border border-amber-800' :
                      'bg-emerald-950 text-emerald-400 border border-emerald-800'
                    }`}>
                      PEWS {pt.score}
                    </span>
                  </div>
                  <div className="mt-2 flex justify-between items-center text-[11px] text-slate-400 border-t border-slate-800/60 pt-2">
                    <span>Age: {pt.age}</span>
                    <span>Wt: {pt.weight}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dosing Safety Widget */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl">
            <h3 className="text-xs font-bold text-slate-300 flex items-center gap-2 mb-3">
              <Syringe className="w-4 h-4 text-purple-400" />
              Weight-Adjusted Infusion Calculator
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800 text-slate-300">
                <span>Epinephrine:</span>
                <span className="font-mono text-cyan-400">0.05 mcg/kg/min</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800 text-slate-300">
                <span>Milrinone:</span>
                <span className="font-mono text-cyan-400">0.375 mcg/kg/min</span>
              </div>
              <div className="flex justify-between py-1 text-slate-300">
                <span>Maintenance Fluids (4-2-1):</span>
                <span className="font-mono text-amber-400">48.4 mL/hr</span>
              </div>
            </div>
          </div>
        </div>

        {/* Center Column: Vitals Telemetry & Monitor */}
        <div className="lg:col-span-6 space-y-6">
          {/* Patient Overview Header */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-wrap justify-between items-center gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold text-slate-100">Baby Liam Vance</h2>
                <span className="px-2.5 py-0.5 text-xs bg-rose-950 text-rose-400 border border-rose-800 rounded-full font-semibold">
                  HIGH RISK (PEWS: {vitals.pewsScore})
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                MRN: 94820194 • Male • 28 Months • 14.2 kg (50th %ile) • Attending: Dr. S. Jenkins, MD
              </p>
            </div>
            <div className="flex gap-2">
              <span className="px-3 py-1 bg-slate-800 text-slate-300 rounded-lg text-xs font-mono border border-slate-700">
                HL7 FHIR R4 Connected
              </span>
            </div>
          </div>

          {/* Vitals Telemetry Monitor Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {/* HR */}
            <div className="bg-slate-900/90 border border-rose-500/30 rounded-2xl p-4 relative overflow-hidden">
              <div className="flex justify-between items-center text-rose-400 mb-1">
                <span className="text-xs font-bold tracking-wider">HEART RATE</span>
                <Heart className="w-4 h-4 animate-pulse" />
              </div>
              <div className="text-3xl font-black font-mono text-rose-400">{vitals.hr}</div>
              <div className="text-[10px] text-slate-400 mt-1">bpm • Norm: 90-140</div>
            </div>

            {/* SpO2 */}
            <div className="bg-slate-900/90 border border-cyan-500/30 rounded-2xl p-4 relative overflow-hidden">
              <div className="flex justify-between items-center text-cyan-400 mb-1">
                <span className="text-xs font-bold tracking-wider">SpO2 PULSE</span>
                <Activity className="w-4 h-4" />
              </div>
              <div className="text-3xl font-black font-mono text-cyan-400">{vitals.spo2}%</div>
              <div className="text-[10px] text-slate-400 mt-1">Target: &gt;95% (FiO2 35%)</div>
            </div>

            {/* Arterial BP */}
            <div className="bg-slate-900/90 border border-amber-500/30 rounded-2xl p-4 relative overflow-hidden">
              <div className="flex justify-between items-center text-amber-400 mb-1">
                <span className="text-xs font-bold tracking-wider">ART MAP (BP)</span>
                <Zap className="w-4 h-4" />
              </div>
              <div className="text-3xl font-black font-mono text-amber-400">
                {vitals.map} <span className="text-xs font-normal text-slate-400">({vitals.bpSys}/{vitals.bpDia})</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-1">mmHg • Target MAP &gt;60</div>
            </div>

            {/* Core Temp */}
            <div className="bg-slate-900/90 border border-purple-500/30 rounded-2xl p-4 relative overflow-hidden">
              <div className="flex justify-between items-center text-purple-400 mb-1">
                <span className="text-xs font-bold tracking-wider">CORE TEMP</span>
                <Thermometer className="w-4 h-4" />
              </div>
              <div className="text-3xl font-black font-mono text-purple-400">{vitals.temp}°C</div>
              <div className="text-[10px] text-slate-400 mt-1">Rectal Sensor • Febrile</div>
            </div>
          </div>

          {/* Simulated Waveform / Telemetry Graph Panel */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs font-bold text-slate-300 tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                REAL-TIME ECG & ARTERIAL PRESSURE STREAM (125 Hz)
              </h3>
              <div className="flex items-center space-x-2 text-[10px] font-mono text-slate-400">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                <span>LIVE FEED</span>
              </div>
            </div>
            
            {/* Waveform graphic mock */}
            <div className="h-32 bg-slate-950 border border-slate-800/80 rounded-xl flex items-center justify-center p-4 relative overflow-hidden">
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]"></div>
              <svg className="w-full h-full text-emerald-400 stroke-current fill-none" viewBox="0 0 500 100" preserveAspectRatio="none">
                <path 
                  strokeWidth="2" 
                  d="M 0,50 L 40,50 L 50,20 L 55,80 L 60,10 L 65,90 L 70,50 L 120,50 L 130,20 L 135,80 L 140,10 L 145,90 L 150,50 L 200,50 L 210,20 L 215,80 L 220,10 L 225,90 L 230,50 L 280,50 L 290,20 L 295,80 L 300,10 L 305,90 L 310,50 L 360,50 L 370,20 L 375,80 L 380,10 L 385,90 L 390,50 L 440,50 L 450,20 L 455,80 L 460,10 L 465,90 L 470,50 L 500,50" 
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Right Column: Clinical Decision Support & Alerts */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-sm font-bold text-slate-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                Active Clinical Alerts
              </h2>
              <span className="px-2 py-0.5 text-[10px] bg-amber-950 text-amber-400 border border-amber-800 rounded-full font-mono">
                {alerts.length} New
              </span>
            </div>

            <div className="space-y-3">
              {alerts.map(alt => (
                <div 
                  key={alt.id}
                  onClick={() => handleOpenAlertModal(alt)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all hover:scale-[1.02] ${
                    alt.type === 'CRITICAL' ? 'bg-rose-950/40 border-rose-800/80' :
                    alt.type === 'WARNING' ? 'bg-amber-950/40 border-amber-800/80' :
                    'bg-slate-950/60 border-slate-800'
                  }`}
                >
                  <div className="flex justify-between items-center text-[10px] text-slate-400 mb-1">
                    <span className="font-mono">{alt.time}</span>
                    <span className={`font-bold ${
                      alt.type === 'CRITICAL' ? 'text-rose-400' : 'text-amber-400'
                    }`}>{alt.type}</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-200">{alt.title}</h4>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{alt.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Clinical Guidelines Compliance Badge */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-2">
            <h3 className="text-xs font-bold text-slate-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Regulatory & Guideline Compliance
            </h3>
            <div className="text-[11px] text-slate-400 space-y-1">
              <p className="flex justify-between"><span>PALS Sepsis Bundle:</span> <span className="text-emerald-400 font-semibold">100% Compliant</span></p>
              <p className="flex justify-between"><span>FDA 21 CFR Part 11:</span> <span className="text-emerald-400 font-semibold">Verified</span></p>
              <p className="flex justify-between"><span>HL7 FHIR R4 Sync:</span> <span className="text-emerald-400 font-semibold">Active</span></p>
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
                  {selectedAlert.type} ALERT
                </span>
                <h3 className="text-lg font-bold text-slate-100 mt-2">{selectedAlert.title}</h3>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-200 font-mono text-xl"
              >
                ×
              </button>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed">
              {selectedAlert.desc}
            </p>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs text-slate-400 space-y-1">
              <p><strong className="text-slate-200">Regulatory Standard:</strong> {selectedAlert.standard}</p>
              <p><strong className="text-slate-200">Recommended Action:</strong> Initiate immediate bedside evaluation, verify blood gas & lactate, consider fluid bolus 10-20 mL/kg.</p>
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button 
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold"
              >
                Dismiss Alert
              </button>
              <button 
                onClick={() => {
                  alert('Emergency Clinical Response Dispatched');
                  setShowModal(false);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-rose-600/40"
              >
                Acknowledge & Escalate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PediatricIcuOverwatchHub;
