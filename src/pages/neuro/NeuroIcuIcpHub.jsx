import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  Activity, 
  ShieldAlert, 
  Zap, 
  UserCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  FileText, 
  Droplet, 
  RefreshCw,
  Gauge,
  Thermometer,
  Layers
} from 'lucide-react';

const NeuroIcuIcpHub = () => {
  const [selectedPatient, setSelectedPatient] = useState('NEURO-901');
  const [showModal, setShowModal] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [protocolStatus, setProtocolStatus] = useState({
    hyperosmolar: false,
    hypothermia: false,
    sedationTier: false,
    decompressive: false
  });

  // Real-time telemetry telemetry state
  const [telemetry, setTelemetry] = useState({
    icp: 18.4, // Intracranial Pressure (mmHg)
    map: 88.0, // Mean Arterial Pressure (mmHg)
    cpp: 69.6, // Cerebral Perfusion Pressure (mmHg = MAP - ICP)
    pbto2: 24.5, // Brain Tissue Oxygenation (mmHg)
    sjvo2: 68.0, // Jugular Venous Oxygen Saturation (%)
    coreTemp: 36.8, // Core Body Temp (°C)
    pupilLeft: 3.2,
    pupilRight: 3.1,
    gcs: 9
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setTelemetry(prev => {
        const newIcp = Math.round((17.5 + Math.random() * 3.5) * 10) / 10;
        const newMap = Math.round((85.0 + Math.random() * 8.0) * 10) / 10;
        const newCpp = Math.round((newMap - newIcp) * 10) / 10;
        return {
          ...prev,
          icp: newIcp,
          map: newMap,
          cpp: newCpp,
          pbto2: Math.round((22.0 + Math.random() * 5.0) * 10) / 10
        };
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const patientList = [
    { id: 'NEURO-901', name: 'Marcus Vance', age: '44 yrs', unit: 'Neuro ICU Bed 01', status: 'CRITICAL', gcs: 9, icp: '18.4 mmHg', diagnosis: 'Severe Traumatic Brain Injury (TBI) / EVD Placed' },
    { id: 'NEURO-712', name: 'Elena Rostova', age: '58 yrs', unit: 'Neuro ICU Bed 03', status: 'STABLE', gcs: 13, icp: '11.2 mmHg', diagnosis: 'Aneurysmal Subarachnoid Hemorrhage (aSAH)' },
    { id: 'NEURO-844', name: 'David Kim', age: '62 yrs', unit: 'Neuro ICU Bed 06', status: 'WARNING', gcs: 10, icp: '16.8 mmHg', diagnosis: 'Malignant MCA Infarction' },
    { id: 'NEURO-509', name: 'Sarah Jenkins', age: '35 yrs', unit: 'Neuro ICU Bed 08', status: 'STABLE', gcs: 14, icp: '9.8 mmHg', diagnosis: 'Post-Craniotomy Tumor Resection' }
  ];

  const alerts = [
    { id: 'ALT-N01', time: '14:52:10', type: 'CRITICAL', title: 'Refractory ICP Spiked >20 mmHg', desc: 'ICP exceeded 20 mmHg threshold for 5 consecutive minutes (Peak 21.8 mmHg). CPP trending down to 64 mmHg.', standard: 'BTF (Brain Trauma Foundation) 4th Ed.' },
    { id: 'ALT-N02', time: '14:30:45', type: 'WARNING', title: 'PbtO2 Hypoxia Warning', desc: 'Brain tissue oxygenation dropped below target (>20 mmHg). Current PbtO2: 18.2 mmHg.', standard: 'ACNS / Neurocritical Care Standard' },
    { id: 'ALT-N03', time: '13:15:00', type: 'INFO', title: 'EVD Leveling & Transducer Auto-Zero', desc: 'External Ventricular Drain transducer auto-zero completed at Foramen of Monro.', standard: 'FDA 21 CFR Part 11 / HL7 FHIR R4' }
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
              <Brain className="w-8 h-8 animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-purple-400 via-cyan-400 to-rose-400 bg-clip-text text-transparent">
                Neuro ICU Intracranial Pressure & Hemodynamic Overwatch
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Brain Trauma Foundation (BTF) Real-Time CPP/ICP Optimization & Multimodal Neuromonitoring
              </p>
            </div>
          </div>
        </div>

        {/* Emergency Refractory Protocols */}
        <div className="flex flex-wrap items-center gap-2">
          <button 
            onClick={() => toggleProtocol('hyperosmolar')}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition-all duration-200 border flex items-center gap-1.5 ${
              protocolStatus.hyperosmolar 
                ? 'bg-rose-600 text-white border-rose-500 shadow-lg shadow-rose-600/50 animate-bounce' 
                : 'bg-rose-950/40 text-rose-300 border-rose-800/60 hover:bg-rose-900/40'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            HYPEROSMOLAR THERAPY (3% NaCl / MANNITOL)
          </button>

          <button 
            onClick={() => toggleProtocol('hypothermia')}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition-all duration-200 border flex items-center gap-1.5 ${
              protocolStatus.hypothermia 
                ? 'bg-cyan-600 text-white border-cyan-500 shadow-lg shadow-cyan-600/50' 
                : 'bg-cyan-950/40 text-cyan-300 border-cyan-800/60 hover:bg-cyan-900/40'
            }`}
          >
            <Thermometer className="w-4 h-4" />
            TARGETED TEMPERATURE MANAGEMENT
          </button>

          <button 
            onClick={() => toggleProtocol('decompressive')}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition-all duration-200 border flex items-center gap-1.5 ${
              protocolStatus.decompressive 
                ? 'bg-purple-600 text-white border-purple-500 shadow-lg shadow-purple-600/50' 
                : 'bg-purple-950/40 text-purple-300 border-purple-800/60 hover:bg-purple-900/40'
            }`}
          >
            <Layers className="w-4 h-4" />
            DECOMPRESSIVE CRANIECTOMY ESCALATION
          </button>
        </div>
      </header>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Census & Patient Roster */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-md">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-slate-300 flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-purple-400" />
                Neuro ICU Patient Census
              </h2>
              <span className="px-2 py-0.5 text-[10px] bg-purple-950 text-purple-400 border border-purple-800 rounded-full font-mono">
                4 Active EVDs
              </span>
            </div>

            <div className="space-y-2">
              {patientList.map(pt => (
                <div 
                  key={pt.id}
                  onClick={() => setSelectedPatient(pt.id)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    selectedPatient === pt.id 
                      ? 'bg-slate-800/90 border-purple-500/60 shadow-lg shadow-purple-500/10' 
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
                      GCS {pt.gcs}
                    </span>
                  </div>
                  <div className="mt-2 flex justify-between items-center text-[11px] text-slate-400 border-t border-slate-800/60 pt-2">
                    <span>{pt.diagnosis}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Neurological Assessment Card */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl">
            <h3 className="text-xs font-bold text-slate-300 flex items-center gap-2 mb-3">
              <Brain className="w-4 h-4 text-cyan-400" />
              Automated NPi & Pupillometry
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800 text-slate-300">
                <span>Left Pupil (NPi 4.5):</span>
                <span className="font-mono text-cyan-400">{telemetry.pupilLeft} mm (Brisk)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800 text-slate-300">
                <span>Right Pupil (NPi 4.4):</span>
                <span className="font-mono text-cyan-400">{telemetry.pupilRight} mm (Brisk)</span>
              </div>
              <div className="flex justify-between py-1 text-slate-300">
                <span>Glasgow Coma Scale (GCS):</span>
                <span className="font-mono text-amber-400">E2V2M5 = 9</span>
              </div>
            </div>
          </div>
        </div>

        {/* Center Column: Neuromonitoring Dashboard */}
        <div className="lg:col-span-6 space-y-6">
          {/* Patient Info Header */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-wrap justify-between items-center gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold text-slate-100">Marcus Vance</h2>
                <span className="px-2.5 py-0.5 text-xs bg-rose-950 text-rose-400 border border-rose-800 rounded-full font-semibold">
                  EVD TRANSDUCER ACTIVE
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                MRN: 9940129 • Male • 44 Yrs • TBI / Subdural Hematoma • Neurosurgeon: Dr. A. Sterling, MD
              </p>
            </div>
            <div className="flex gap-2">
              <span className="px-3 py-1 bg-slate-800 text-slate-300 rounded-lg text-xs font-mono border border-slate-700">
                BTF Guidelines Compliant
              </span>
            </div>
          </div>

          {/* Critical Neuromonitoring Vitals */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {/* ICP */}
            <div className="bg-slate-900/90 border border-rose-500/30 rounded-2xl p-4 relative overflow-hidden">
              <div className="flex justify-between items-center text-rose-400 mb-1">
                <span className="text-xs font-bold tracking-wider">ICP (EVD)</span>
                <Gauge className="w-4 h-4 animate-pulse" />
              </div>
              <div className="text-3xl font-black font-mono text-rose-400">{telemetry.icp}</div>
              <div className="text-[10px] text-slate-400 mt-1">mmHg • BTF Target &lt;22</div>
            </div>

            {/* CPP */}
            <div className="bg-slate-900/90 border border-cyan-500/30 rounded-2xl p-4 relative overflow-hidden">
              <div className="flex justify-between items-center text-cyan-400 mb-1">
                <span className="text-xs font-bold tracking-wider">CPP (PERFUSION)</span>
                <Activity className="w-4 h-4" />
              </div>
              <div className="text-3xl font-black font-mono text-cyan-400">{telemetry.cpp}</div>
              <div className="text-[10px] text-slate-400 mt-1">mmHg • Target 60-70</div>
            </div>

            {/* MAP */}
            <div className="bg-slate-900/90 border border-amber-500/30 rounded-2xl p-4 relative overflow-hidden">
              <div className="flex justify-between items-center text-amber-400 mb-1">
                <span className="text-xs font-bold tracking-wider">ART MAP</span>
                <Zap className="w-4 h-4" />
              </div>
              <div className="text-3xl font-black font-mono text-amber-400">{telemetry.map}</div>
              <div className="text-[10px] text-slate-400 mt-1">mmHg • Radial A-Line</div>
            </div>

            {/* PbtO2 */}
            <div className="bg-slate-900/90 border border-purple-500/30 rounded-2xl p-4 relative overflow-hidden">
              <div className="flex justify-between items-center text-purple-400 mb-1">
                <span className="text-xs font-bold tracking-wider">PbtO2 (BRAIN O2)</span>
                <Droplet className="w-4 h-4" />
              </div>
              <div className="text-3xl font-black font-mono text-purple-400">{telemetry.pbto2}</div>
              <div className="text-[10px] text-slate-400 mt-1">mmHg • Target &gt;20</div>
            </div>
          </div>

          {/* ICP Pulsatile Waveform Monitor */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs font-bold text-slate-300 tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4 text-purple-400" />
                HIGH-FIDELITY ICP WAVEFORM STREAM (P1, P2, P3 PULSATILITY)
              </h3>
              <div className="flex items-center space-x-2 text-[10px] font-mono text-slate-400">
                <span className="inline-block w-2 h-2 rounded-full bg-purple-500 animate-ping"></span>
                <span>P2 &gt; P1 WARNING</span>
              </div>
            </div>
            
            {/* Waveform Visualization */}
            <div className="h-32 bg-slate-950 border border-slate-800/80 rounded-xl flex items-center justify-center p-4 relative overflow-hidden">
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#a855f7_1px,transparent_1px)] [background-size:16px_16px]"></div>
              <svg className="w-full h-full text-purple-400 stroke-current fill-none" viewBox="0 0 500 100" preserveAspectRatio="none">
                <path 
                  strokeWidth="2" 
                  d="M 0,60 L 20,20 L 30,35 L 40,45 L 60,60 L 100,60 L 120,20 L 130,35 L 140,45 L 160,60 L 200,60 L 220,20 L 230,35 L 240,45 L 260,60 L 300,60 L 320,20 L 330,35 L 340,45 L 360,60 L 400,60 L 420,20 L 430,35 L 440,45 L 460,60 L 500,60" 
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Right Column: Decision Support & Protocol Alerts */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-sm font-bold text-slate-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                Active ICP Crisis Alerts
              </h2>
              <span className="px-2 py-0.5 text-[10px] bg-rose-950 text-rose-400 border border-rose-800 rounded-full font-mono">
                {alerts.length} Active
              </span>
            </div>

            <div className="space-y-3">
              {alerts.map(alt => (
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

          {/* Compliance & Safety Certification */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-2">
            <h3 className="text-xs font-bold text-slate-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Clinical Protocol Compliance
            </h3>
            <div className="text-[11px] text-slate-400 space-y-1">
              <p className="flex justify-between"><span>BTF TBI Guidelines:</span> <span className="text-emerald-400 font-semibold">Tier 2 Protocol</span></p>
              <p className="flex justify-between"><span>FDA 21 CFR Part 11:</span> <span className="text-emerald-400 font-semibold">Audit Ready</span></p>
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
                  {selectedAlert.type} NEURO ALERT
                </span>
                <h3 className="text-lg font-bold text-slate-100 mt-2">{selectedAlert.title}</h3>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-200 font-mono text-xl">×</button>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed">{selectedAlert.desc}</p>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs text-slate-400 space-y-1">
              <p><strong className="text-slate-200">Standard:</strong> {selectedAlert.standard}</p>
              <p><strong className="text-slate-200">Protocol Action:</strong> Administer 23.4% Hypertonic Saline bolus (30 mL) or 20% Mannitol (1 g/kg). Verify HOB elevated 30 degrees.</p>
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold">Dismiss</button>
              <button onClick={() => { alert('Refractory ICP Escalation Protocol Triggered'); setShowModal(false); }} className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-rose-600/40">Trigger Hyperosmolar Protocol</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NeuroIcuIcpHub;
