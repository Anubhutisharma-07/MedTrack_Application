import React, { useState, useEffect } from 'react';
import { 
  Heart, 
  Activity, 
  ShieldAlert, 
  Zap, 
  UserCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  FileText, 
  Droplet, 
  TrendingUp,
  Sliders
} from 'lucide-react';

const CardiovascularHemodynamicsHub = () => {
  const [selectedPatient, setSelectedPatient] = useState('CARDIO-881');
  const [showModal, setShowModal] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [protocolStatus, setProtocolStatus] = useState({
    codeStemi: false,
    vaEcmo: false,
    impellaPump: false,
    inotropeEscalation: false
  });

  // Cardiovascular Hemodynamics Telemetry State
  const [hemo, setHemo] = useState({
    co: 4.2, // Cardiac Output (L/min)
    ci: 2.1, // Cardiac Index (L/min/m2)
    cpo: 0.72, // Cardiac Power Output (Watts = (MAP * CO) / 451)
    svri: 2150, // Systemic Vascular Resistance Index (dynes-sec/cm5/m2)
    papSys: 38, // Pulmonary Artery Pressure Systolic
    papDia: 22, // Pulmonary Artery Pressure Diastolic
    pcwp: 19, // Pulmonary Capillary Wedge Pressure (mmHg)
    map: 74,
    hr: 112
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setHemo(prev => {
        const newCo = Math.round((4.0 + Math.random() * 0.5) * 10) / 10;
        const newMap = Math.floor(72 + Math.random() * 6);
        const newCpo = Math.round(((newMap * newCo) / 451) * 100) / 100;
        return {
          ...prev,
          co: newCo,
          map: newMap,
          cpo: newCpo,
          hr: Math.floor(108 + Math.random() * 8)
        };
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const patientList = [
    { id: 'CARDIO-881', name: 'Robert Vance', age: '61 yrs', unit: 'CICU Bed 02', status: 'CRITICAL', cpo: '0.72 W', ci: '2.1 L/min/m2', diagnosis: 'Acute Cardiogenic Shock / Anterior STEMI' },
    { id: 'CARDIO-904', name: 'Maria Santos', age: '54 yrs', unit: 'CICU Bed 05', status: 'STABLE', cpo: '1.10 W', ci: '2.8 L/min/m2', diagnosis: 'Post-CABG x 4 / Swan-Ganz Active' },
    { id: 'CARDIO-712', name: 'James Henderson', age: '69 yrs', unit: 'CICU Bed 07', status: 'WARNING', cpo: '0.84 W', ci: '2.3 L/min/m2', diagnosis: 'End-Stage Decompensated Heart Failure' },
    { id: 'CARDIO-603', name: 'Linda Crawford', age: '48 yrs', unit: 'CICU Bed 09', status: 'STABLE', cpo: '1.25 W', ci: '3.1 L/min/m2', diagnosis: 'Acute Myocarditis / Impella CP Weaning' }
  ];

  const cardioAlerts = [
    { id: 'ALT-C01', time: '15:08:30', type: 'CRITICAL', title: 'Refractory Cardiogenic Shock Threshold Exceeded', desc: 'Cardiac Power Output (CPO) <0.60 W (Current: 0.72 W trending down) despite dual inotropes. PCWP elevated at 19 mmHg.', standard: 'SCAI Shock Stage C/D Criteria' },
    { id: 'ALT-C02', time: '14:45:10', type: 'WARNING', title: 'Pulmonary Artery Pressure Elevation', desc: 'Mean PAP exceeded 28 mmHg (38/22 mmHg). Early Right Ventricular failure alert.', standard: 'ESC / ACC Hemodynamic Standards' },
    { id: 'ALT-C03', time: '13:30:00', type: 'INFO', title: 'Swan-Ganz Thermodilution Calibration Complete', desc: 'Continuous PA catheter cardiac output transducer auto-calibrated.', standard: 'HL7 FHIR R4 / FDA 21 CFR Part 11' }
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
              <Heart className="w-8 h-8 animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-rose-500 via-amber-400 to-cyan-400 bg-clip-text text-transparent">
                Cardiovascular Hemodynamics & Shock Overwatch
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                SCAI Shock Classification, Pulmonary Artery Thermodilution & Mechanical Circulatory Support (MCS) Engine
              </p>
            </div>
          </div>
        </div>

        {/* Emergency Cardiac Protocols */}
        <div className="flex flex-wrap items-center gap-2">
          <button 
            onClick={() => toggleProtocol('codeStemi')}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition-all duration-200 border flex items-center gap-1.5 ${
              protocolStatus.codeStemi 
                ? 'bg-rose-600 text-white border-rose-500 shadow-lg shadow-rose-600/50 animate-bounce' 
                : 'bg-rose-950/40 text-rose-300 border-rose-800/60 hover:bg-rose-900/40'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            CODE STEMI / CATH LAB STAT
          </button>

          <button 
            onClick={() => toggleProtocol('impellaPump')}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition-all duration-200 border flex items-center gap-1.5 ${
              protocolStatus.impellaPump 
                ? 'bg-amber-600 text-white border-amber-500 shadow-lg shadow-amber-600/50' 
                : 'bg-amber-950/40 text-amber-300 border-amber-800/60 hover:bg-amber-900/40'
            }`}
          >
            <Zap className="w-4 h-4" />
            IMPELLA / IABP ESCALATION
          </button>

          <button 
            onClick={() => toggleProtocol('vaEcmo')}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition-all duration-200 border flex items-center gap-1.5 ${
              protocolStatus.vaEcmo 
                ? 'bg-cyan-600 text-white border-cyan-500 shadow-lg shadow-cyan-600/50' 
                : 'bg-cyan-950/40 text-cyan-300 border-cyan-800/60 hover:bg-cyan-900/40'
            }`}
          >
            <Activity className="w-4 h-4" />
            VA-ECMO SURGICAL CANNULATION
          </button>
        </div>
      </header>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: CICU Roster */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-md">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-slate-300 flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-rose-400" />
                CICU Shock Roster
              </h2>
              <span className="px-2 py-0.5 text-[10px] bg-rose-950 text-rose-400 border border-rose-800 rounded-full font-mono">
                4 Active PA Catheters
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
                      <p className="text-xs text-slate-400 font-mono">{pt.id} • {pt.unit}</p>
                    </div>
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-rose-950 text-rose-400 border border-rose-800">
                      CPO {pt.cpo}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-2"><strong className="text-slate-400">Diagnosis:</strong> {pt.diagnosis}</p>
                  <p className="text-[11px] text-cyan-400 mt-1 font-mono">CI: {pt.ci}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Vasoactive Inotrope Score (VIS) Widget */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl">
            <h3 className="text-xs font-bold text-slate-300 flex items-center gap-2 mb-3">
              <Sliders className="w-4 h-4 text-amber-400" />
              Inotrope & Vasopressor Dosing
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800 text-slate-300">
                <span>Norepinephrine:</span>
                <span className="font-mono text-rose-400">0.12 mcg/kg/min</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800 text-slate-300">
                <span>Dobutamine:</span>
                <span className="font-mono text-cyan-400">5.0 mcg/kg/min</span>
              </div>
              <div className="flex justify-between py-1 text-slate-300">
                <span>VIS Score:</span>
                <span className="font-mono text-amber-400">17.0 (High Support)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Center Column: Hemodynamic Overwatch Display */}
        <div className="lg:col-span-6 space-y-6">
          {/* Patient Info Header Banner */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-wrap justify-between items-center gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold text-slate-100">Robert Vance</h2>
                <span className="px-2.5 py-0.5 text-xs bg-rose-950 text-rose-400 border border-rose-800 rounded-full font-semibold">
                  SCAI SHOCK STAGE C
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                MRN: 8810291 • Male • 61 Yrs • BSA: 1.95 m2 • Interventional Cardiologist: Dr. H. Vance, MD
              </p>
            </div>
            <div className="flex gap-2">
              <span className="px-3 py-1 bg-slate-800 text-slate-300 rounded-lg text-xs font-mono border border-slate-700">
                Swan-Ganz Active
              </span>
            </div>
          </div>

          {/* Core Hemodynamic Vitals Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-900/90 border border-rose-500/30 rounded-2xl p-4">
              <div className="text-xs font-bold text-rose-400 mb-1">CARDIAC POWER (CPO)</div>
              <div className="text-3xl font-black font-mono text-rose-400">{hemo.cpo} <span className="text-xs font-normal text-slate-400">W</span></div>
              <div className="text-[10px] text-slate-400 mt-1">Target &gt;0.60 W</div>
            </div>

            <div className="bg-slate-900/90 border border-cyan-500/30 rounded-2xl p-4">
              <div className="text-xs font-bold text-cyan-400 mb-1">CARDIAC INDEX (CI)</div>
              <div className="text-3xl font-black font-mono text-cyan-400">{hemo.ci} <span className="text-xs font-normal text-slate-400">L/min/m2</span></div>
              <div className="text-[10px] text-slate-400 mt-1">Target &gt;2.2 L/min/m2</div>
            </div>

            <div className="bg-slate-900/90 border border-amber-500/30 rounded-2xl p-4">
              <div className="text-xs font-bold text-amber-400 mb-1">PCWP WEDGE</div>
              <div className="text-3xl font-black font-mono text-amber-400">{hemo.pcwp} <span className="text-xs font-normal text-slate-400">mmHg</span></div>
              <div className="text-[10px] text-slate-400 mt-1">Elevated (&gt;15 mmHg)</div>
            </div>

            <div className="bg-slate-900/90 border border-purple-500/30 rounded-2xl p-4">
              <div className="text-xs font-bold text-purple-400 mb-1">PA PRESSURE</div>
              <div className="text-3xl font-black font-mono text-purple-400">{hemo.papSys}/{hemo.papDia}</div>
              <div className="text-[10px] text-slate-400 mt-1">Mean PA: 27 mmHg</div>
            </div>
          </div>

          {/* PA Waveform Thermodilution Monitor */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs font-bold text-slate-300 tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4 text-rose-400" />
                PULMONARY ARTERY PRESSURE WAVEFORM STREAM (SWAN-GANZ)
              </h3>
              <div className="flex items-center space-x-2 text-[10px] font-mono text-slate-400">
                <span className="inline-block w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                <span>REAL-TIME PA WAVE</span>
              </div>
            </div>
            
            <div className="h-32 bg-slate-950 border border-slate-800/80 rounded-xl flex items-center justify-center p-4 relative overflow-hidden">
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#f43f5e_1px,transparent_1px)] [background-size:16px_16px]"></div>
              <svg className="w-full h-full text-rose-400 stroke-current fill-none" viewBox="0 0 500 100" preserveAspectRatio="none">
                <path 
                  strokeWidth="2" 
                  d="M 0,70 L 25,25 L 35,45 L 45,55 L 75,70 L 125,70 L 150,25 L 160,45 L 170,55 L 200,70 L 250,70 L 275,25 L 285,45 L 295,55 L 325,70 L 375,70 L 400,25 L 410,45 L 420,55 L 450,70 L 500,70" 
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
                Active Shock Bulletins
              </h2>
              <span className="px-2 py-0.5 text-[10px] bg-rose-950 text-rose-400 border border-rose-800 rounded-full font-mono">
                {cardioAlerts.length} Critical
              </span>
            </div>

            <div className="space-y-3">
              {cardioAlerts.map(alt => (
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

          {/* Clinical Standards Compliance */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-2">
            <h3 className="text-xs font-bold text-slate-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Guideline Verification
            </h3>
            <div className="text-[11px] text-slate-400 space-y-1">
              <p className="flex justify-between"><span>SCAI Shock Criteria:</span> <span className="text-emerald-400 font-semibold">Stage C Verified</span></p>
              <p className="flex justify-between"><span>FDA 21 CFR Part 11:</span> <span className="text-emerald-400 font-semibold">Audit Passed</span></p>
              <p className="flex justify-between"><span>HL7 FHIR R4:</span> <span className="text-emerald-400 font-semibold">Streaming</span></p>
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
                  {selectedAlert.type} CARDIO ALERT
                </span>
                <h3 className="text-lg font-bold text-slate-100 mt-2">{selectedAlert.title}</h3>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-200 font-mono text-xl">×</button>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed">{selectedAlert.desc}</p>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs text-slate-400 space-y-1">
              <p><strong className="text-slate-200">Standard Framework:</strong> {selectedAlert.standard}</p>
              <p><strong className="text-slate-200">Clinical Protocol:</strong> Prepare cardiac cath lab for mechanical circulatory support (Impella CP placement). Escalate Dobutamine to 7.5 mcg/kg/min.</p>
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold">Dismiss</button>
              <button onClick={() => { alert('Interventional Cardiology & MCS Team Escalated'); setShowModal(false); }} className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-rose-600/40">Escalate MCS Protocol</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CardiovascularHemodynamicsHub;
