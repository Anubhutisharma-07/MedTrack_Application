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
  Wind,
  Gauge
} from 'lucide-react';

const IcuVitalsTelemetryOverwatchHub = () => {
  const [selectedPatient, setSelectedPatient] = useState('ICU-BED-01');
  const [showModal, setShowModal] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [protocolStatus, setProtocolStatus] = useState({
    codeBlue: false,
    massiveTransfusion: false,
    sepsisProtocol: false,
    airwayEmergency: false
  });

  // Real-time telemetry state
  const [vitals, setVitals] = useState({
    hr: 124, // bpm
    bpSys: 88,
    bpDia: 54,
    map: 65, // mmHg
    spo2: 92, // %
    rr: 28, // breaths/min
    temp: 38.9, // °C
    cvp: 14, // mmHg
    news2Score: 9 // Critical risk score
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setVitals(prev => {
        const newHr = Math.floor(120 + Math.random() * 10);
        const newSpo2 = Math.min(100, Math.floor(91 + Math.random() * 4));
        const newMap = Math.floor(63 + Math.random() * 6);
        return {
          ...prev,
          hr: newHr,
          spo2: newSpo2,
          map: newMap
        };
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const patientList = [
    { id: 'ICU-BED-01', name: 'Jonathan Hayes', age: '67 yrs', unit: 'ICU Bed 01', status: 'CRITICAL', news2: 9, diagnosis: 'Severe Septic Shock / ARDS' },
    { id: 'ICU-BED-04', name: 'Beatrice Vance', age: '74 yrs', unit: 'ICU Bed 04', status: 'WARNING', news2: 6, diagnosis: 'Acute Respiratory Failure / BiPAP' },
    { id: 'ICU-BED-07', name: 'Marcus Sterling', age: '58 yrs', unit: 'ICU Bed 07', status: 'STABLE', news2: 2, diagnosis: 'Post-CABG Day 2 / Weaned' },
    { id: 'ICU-BED-10', name: 'Clara Oswald', age: '45 yrs', unit: 'ICU Bed 10', status: 'STABLE', news2: 1, diagnosis: 'DKA Resolution / Stepdown Ready' }
  ];

  const telemetryAlerts = [
    { id: 'ALT-ICU01', time: '15:24:12', type: 'CRITICAL', title: 'NEWS2 Critical Trigger Exceeded (Score: 9)', desc: 'Sustained hypotension (MAP 65 mmHg) & tachycardia (124 bpm). Lactate 4.2 mmol/L. qSOFA sepsis criteria met.', standard: 'NEWS2 / qSOFA Sepsis Guidelines' },
    { id: 'ALT-ICU02', time: '15:05:00', type: 'WARNING', title: 'SpO2 Desaturation Alert (<93%)', desc: 'Pulse oximetry dropped to 92% on 60% FiO2 ventilator setting. P/F ratio <200 (Moderate ARDS).', standard: 'ARDSNet Ventilator Protocol' },
    { id: 'ALT-ICU03', time: '14:30:18', type: 'INFO', title: 'CVP Transducer Zeroing Complete', desc: 'Central Venous Pressure transducer calibrated at phlebostatic axis.', standard: 'HL7 FHIR R4 / FDA 21 CFR Part 11' }
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
              <Activity className="w-8 h-8 animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-rose-500 via-amber-400 to-cyan-400 bg-clip-text text-transparent">
                ICU Critical Care Vitals & Telemetry Overwatch
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Real-Time NEWS2 Early Warning System, Multichannel Waveform Surveillance & Sepsis Protocol Engine
              </p>
            </div>
          </div>
        </div>

        {/* Emergency Triggers */}
        <div className="flex flex-wrap items-center gap-2">
          <button 
            onClick={() => toggleProtocol('codeBlue')}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition-all duration-200 border flex items-center gap-1.5 ${
              protocolStatus.codeBlue 
                ? 'bg-rose-600 text-white border-rose-500 shadow-lg shadow-rose-600/50 animate-bounce' 
                : 'bg-rose-950/40 text-rose-300 border-rose-800/60 hover:bg-rose-900/40'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            CODE BLUE STAT
          </button>

          <button 
            onClick={() => toggleProtocol('massiveTransfusion')}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition-all duration-200 border flex items-center gap-1.5 ${
              protocolStatus.massiveTransfusion 
                ? 'bg-amber-600 text-white border-amber-500 shadow-lg shadow-amber-600/50' 
                : 'bg-amber-950/40 text-amber-300 border-amber-800/60 hover:bg-amber-900/40'
            }`}
          >
            <Droplet className="w-4 h-4" />
            MASSIVE TRANSFUSION (MTP)
          </button>

          <button 
            onClick={() => toggleProtocol('sepsisProtocol')}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition-all duration-200 border flex items-center gap-1.5 ${
              protocolStatus.sepsisProtocol 
                ? 'bg-cyan-600 text-white border-cyan-500 shadow-lg shadow-cyan-600/50' 
                : 'bg-cyan-950/40 text-cyan-300 border-cyan-800/60 hover:bg-cyan-900/40'
            }`}
          >
            <Zap className="w-4 h-4" />
            SEPSIS BUNDLE HOUR-1
          </button>
        </div>
      </header>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: ICU Bed Roster */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-md">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-slate-300 flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-cyan-400" />
                ICU Bed Census & NEWS2
              </h2>
              <span className="px-2 py-0.5 text-[10px] bg-rose-950 text-rose-400 border border-rose-800 rounded-full font-mono">
                4 Active Telemetry
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
                      <p className="text-xs text-slate-400 font-mono">{pt.id} • {pt.unit}</p>
                    </div>
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${
                      pt.status === 'CRITICAL' ? 'bg-rose-950 text-rose-400 border border-rose-800' :
                      pt.status === 'WARNING' ? 'bg-amber-950 text-amber-400 border border-amber-800' :
                      'bg-emerald-950 text-emerald-400 border border-emerald-800'
                    }`}>
                      NEWS2: {pt.news2}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-2"><strong className="text-slate-400">Diagnosis:</strong> {pt.diagnosis}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Ventilator Settings Card */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl">
            <h3 className="text-xs font-bold text-slate-300 flex items-center gap-2 mb-3">
              <Wind className="w-4 h-4 text-purple-400" />
              Ventilator Telemetry (Servo-U)
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800 text-slate-300">
                <span>Mode:</span>
                <span className="font-mono text-purple-400">PRVC (Assist/Control)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800 text-slate-300">
                <span>FiO2 / PEEP:</span>
                <span className="font-mono text-cyan-400">60% / +12 cmH2O</span>
              </div>
              <div className="flex justify-between py-1 text-slate-300">
                <span>Tidal Volume (Vt):</span>
                <span className="font-mono text-amber-400">420 mL (6 mL/kg PBW)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Center Column: Live Vitals Monitor & Waveform */}
        <div className="lg:col-span-6 space-y-6">
          {/* Patient Overview Header */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-wrap justify-between items-center gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold text-slate-100">Jonathan Hayes</h2>
                <span className="px-2.5 py-0.5 text-xs bg-rose-950 text-rose-400 border border-rose-800 rounded-full font-semibold">
                  NEWS2 SCORE: {vitals.news2Score} (HIGH RISK)
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                MRN: 8810291 • Male • 67 Yrs • ICU Bed 01 • Intensivist: Dr. A. Vance, MD
              </p>
            </div>
            <div className="flex gap-2">
              <span className="px-3 py-1 bg-slate-800 text-slate-300 rounded-lg text-xs font-mono border border-slate-700">
                HL7 FHIR R4 Connected
              </span>
            </div>
          </div>

          {/* Vitals Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-900/90 border border-rose-500/30 rounded-2xl p-4">
              <div className="flex justify-between items-center text-rose-400 mb-1">
                <span className="text-xs font-bold tracking-wider">HEART RATE</span>
                <Heart className="w-4 h-4 animate-pulse" />
              </div>
              <div className="text-3xl font-black font-mono text-rose-400">{vitals.hr}</div>
              <div className="text-[10px] text-slate-400 mt-1">bpm • Sinus Tachycardia</div>
            </div>

            <div className="bg-slate-900/90 border border-cyan-500/30 rounded-2xl p-4">
              <div className="flex justify-between items-center text-cyan-400 mb-1">
                <span className="text-xs font-bold tracking-wider">SpO2 PULSE</span>
                <Activity className="w-4 h-4" />
              </div>
              <div className="text-3xl font-black font-mono text-cyan-400">{vitals.spo2}%</div>
              <div className="text-[10px] text-slate-400 mt-1">FiO2 60% • Target &gt;94%</div>
            </div>

            <div className="bg-slate-900/90 border border-amber-500/30 rounded-2xl p-4">
              <div className="flex justify-between items-center text-amber-400 mb-1">
                <span className="text-xs font-bold tracking-wider">ART MAP (BP)</span>
                <Gauge className="w-4 h-4" />
              </div>
              <div className="text-3xl font-black font-mono text-amber-400">
                {vitals.map} <span className="text-xs font-normal text-slate-400">({vitals.bpSys}/{vitals.bpDia})</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-1">mmHg • Target MAP &gt;65</div>
            </div>

            <div className="bg-slate-900/90 border border-purple-500/30 rounded-2xl p-4">
              <div className="flex justify-between items-center text-purple-400 mb-1">
                <span className="text-xs font-bold tracking-wider">CORE TEMP</span>
                <Thermometer className="w-4 h-4" />
              </div>
              <div className="text-3xl font-black font-mono text-purple-400">{vitals.temp}°C</div>
              <div className="text-[10px] text-slate-400 mt-1">Febrile • Foleygard Sensor</div>
            </div>
          </div>

          {/* Multichannel ECG & Arterial Pressure Waveform */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs font-bold text-slate-300 tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                MULTICHANNEL ECG LEAD II & ARTERIAL LINE WAVEFORM STREAM (250 Hz)
              </h3>
              <div className="flex items-center space-x-2 text-[10px] font-mono text-slate-400">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                <span>LIVE TELEMETRY</span>
              </div>
            </div>
            
            <div className="h-32 bg-slate-950 border border-slate-800/80 rounded-xl flex items-center justify-center p-4 relative overflow-hidden">
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px]"></div>
              <svg className="w-full h-full text-emerald-400 stroke-current fill-none" viewBox="0 0 500 100" preserveAspectRatio="none">
                <path 
                  strokeWidth="2" 
                  d="M 0,50 L 40,50 L 50,15 L 55,85 L 60,5 L 65,95 L 70,50 L 120,50 L 130,15 L 135,85 L 140,5 L 145,95 L 150,50 L 200,50 L 210,15 L 215,85 L 220,5 L 225,95 L 230,50 L 280,50 L 290,15 L 295,85 L 300,5 L 305,95 L 310,50 L 360,50 L 370,15 L 375,85 L 380,5 L 385,95 L 390,50 L 440,50 L 450,15 L 455,85 L 460,5 L 465,95 L 470,50 L 500,50" 
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Right Column: Early Warning Alerts */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-sm font-bold text-slate-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                Active Telemetry Alerts
              </h2>
              <span className="px-2 py-0.5 text-[10px] bg-rose-950 text-rose-400 border border-rose-800 rounded-full font-mono">
                {telemetryAlerts.length} Alerts
              </span>
            </div>

            <div className="space-y-3">
              {telemetryAlerts.map(alt => (
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

          {/* Compliance & Standards */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-2">
            <h3 className="text-xs font-bold text-slate-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Clinical Protocol Compliance
            </h3>
            <div className="text-[11px] text-slate-400 space-y-1">
              <p className="flex justify-between"><span>NEWS2 Early Warning:</span> <span className="text-emerald-400 font-semibold">Verified</span></p>
              <p className="flex justify-between"><span>FDA 21 CFR Part 11:</span> <span className="text-emerald-400 font-semibold">Audit Ready</span></p>
              <p className="flex justify-between"><span>HL7 FHIR R4 Telemetry:</span> <span className="text-emerald-400 font-semibold">Streaming</span></p>
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
                  {selectedAlert.type} TELEMETRY ALERT
                </span>
                <h3 className="text-lg font-bold text-slate-100 mt-2">{selectedAlert.title}</h3>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-200 font-mono text-xl">×</button>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed">{selectedAlert.desc}</p>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs text-slate-400 space-y-1">
              <p><strong className="text-slate-200">Standard Protocol:</strong> {selectedAlert.standard}</p>
              <p><strong className="text-slate-200">Action:</strong> Initiate immediate bedside evaluation by MET/ICU team. Administer 30 mL/kg IV crystalloid bolus for sepsis-induced hypoperfusion.</p>
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold">Dismiss Alert</button>
              <button onClick={() => { alert('Sepsis Bundle Hour-1 Escalation Activated'); setShowModal(false); }} className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-rose-600/40">Trigger Hour-1 Sepsis Bundle</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IcuVitalsTelemetryOverwatchHub;
