import React, { useState, useEffect } from 'react';
import { 
  AlertOctagon, 
  Activity, 
  ShieldAlert, 
  Zap, 
  Users, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  FileText, 
  Radio, 
  Ambulance,
  TrendingUp,
  Hospital
} from 'lucide-react';

const DisasterTriageIncidentCommandHub = () => {
  const [selectedVictim, setSelectedVictim] = useState('TRIAGE-001');
  const [showModal, setShowModal] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [protocolStatus, setProtocolStatus] = useState({
    deconProtocol: false,
    massCasualty: false,
    surgeCapacity: false,
    haMatLockdown: false
  });

  // Triage stats counter state
  const [triageMetrics, setTriageMetrics] = useState({
    immediateRed: 14,
    delayedYellow: 28,
    minorGreen: 45,
    expectantBlack: 3,
    deconCount: 12,
    traumaBayAvailable: 2
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setTriageMetrics(prev => ({
        ...prev,
        immediateRed: Math.max(10, prev.immediateRed + Math.floor(Math.random() * 3) - 1),
        delayedYellow: Math.max(20, prev.delayedYellow + Math.floor(Math.random() * 3) - 1),
        minorGreen: Math.max(30, prev.minorGreen + Math.floor(Math.random() * 5) - 2)
      }));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const victimList = [
    { id: 'TRIAGE-001', tag: 'RED', location: 'Decon Zone Alpha', age: '32 yrs', status: 'IMMEDIATE', rpm: 'START Red', vitals: 'RR 34, Pulse 138, Unconscious', injury: 'Inhalation Injury & Blast Trauma' },
    { id: 'TRIAGE-002', tag: 'YELLOW', location: 'Triage Zone Bravo', age: '45 yrs', status: 'DELAYED', rpm: 'START Yellow', vitals: 'RR 22, Pulse 102, Alert', injury: 'Closed Femur Fracture' },
    { id: 'TRIAGE-003', tag: 'GREEN', location: 'Walking Wounded Zone', age: '21 yrs', status: 'MINOR', rpm: 'START Green', vitals: 'RR 18, Pulse 88, Ambulatory', injury: 'Superficial Lacerations' },
    { id: 'TRIAGE-004', tag: 'BLACK', location: 'Morgue Holding', age: '50+ yrs', status: 'EXPECTANT', rpm: 'START Black', vitals: 'Apneic after airway positioning', injury: 'Penetrating Head Trauma' }
  ];

  const incidentAlerts = [
    { id: 'ALT-MCI01', time: '14:55:00', type: 'CRITICAL', title: 'Mass Casualty Incident (MCI) Level 3 Declared', desc: 'Industrial chemical explosion at Port Facility. Estimated 90+ casualties incoming via EMS.', standard: 'START Triage / JumpSTART (Pediatric)' },
    { id: 'ALT-MCI02', time: '14:42:15', type: 'WARNING', title: 'ED Trauma Surge Capacity Reached 90%', desc: 'Trauma Bays 1-8 occupied. Initiating fast-track discharge of low-acuity ED patients.', standard: 'NDMS / Hospital Incident Command System (HICS)' },
    { id: 'ALT-MCI03', time: '14:20:10', type: 'INFO', title: 'HAZMAT Decontamination Line Active', desc: 'Hot-zone dry/wet decon operational. Organophosphate neutralization protocol engaged.', standard: 'OSHA 1910.120 / FEMA Incident Command' }
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
              <AlertOctagon className="w-8 h-8 animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-rose-500 via-amber-400 to-cyan-400 bg-clip-text text-transparent">
                Emergency Disaster Triage & Incident Command Station
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                FEMA HICS / START Triage Real-Time Casualty Tracking & CBRNE Decontamination Overwatch
              </p>
            </div>
          </div>
        </div>

        {/* Emergency Disaster Protocols */}
        <div className="flex flex-wrap items-center gap-2">
          <button 
            onClick={() => toggleProtocol('massCasualty')}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition-all duration-200 border flex items-center gap-1.5 ${
              protocolStatus.massCasualty 
                ? 'bg-rose-600 text-white border-rose-500 shadow-lg shadow-rose-600/50 animate-bounce' 
                : 'bg-rose-950/40 text-rose-300 border-rose-800/60 hover:bg-rose-900/40'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            CODE RED: MCI LEVEL 3
          </button>

          <button 
            onClick={() => toggleProtocol('deconProtocol')}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition-all duration-200 border flex items-center gap-1.5 ${
              protocolStatus.deconProtocol 
                ? 'bg-amber-600 text-white border-amber-500 shadow-lg shadow-amber-600/50' 
                : 'bg-amber-950/40 text-amber-300 border-amber-800/60 hover:bg-amber-900/40'
            }`}
          >
            <Zap className="w-4 h-4" />
            HAZMAT DECON LOCKDOWN
          </button>

          <button 
            onClick={() => toggleProtocol('surgeCapacity')}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition-all duration-200 border flex items-center gap-1.5 ${
              protocolStatus.surgeCapacity 
                ? 'bg-cyan-600 text-white border-cyan-500 shadow-lg shadow-cyan-600/50' 
                : 'bg-cyan-950/40 text-cyan-300 border-cyan-800/60 hover:bg-cyan-900/40'
            }`}
          >
            <Hospital className="w-4 h-4" />
            ACTIVATE SURGE BEDS
          </button>
        </div>
      </header>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: START Triage Casualty Breakdown */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-md">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-slate-300 flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-400" />
                START Triage Census
              </h2>
              <span className="px-2 py-0.5 text-[10px] bg-rose-950 text-rose-400 border border-rose-800 rounded-full font-mono">
                {triageMetrics.immediateRed + triageMetrics.delayedYellow + triageMetrics.minorGreen + triageMetrics.expectantBlack} Total
              </span>
            </div>

            <div className="space-y-2">
              <div className="p-3 bg-rose-950/40 border border-rose-800/80 rounded-xl flex justify-between items-center">
                <div>
                  <p className="text-xs font-bold text-rose-300">IMMEDIATE (RED)</p>
                  <p className="text-[10px] text-slate-400">Critical Airway / Hemorrhage</p>
                </div>
                <span className="text-xl font-black font-mono text-rose-400">{triageMetrics.immediateRed}</span>
              </div>

              <div className="p-3 bg-amber-950/40 border border-amber-800/80 rounded-xl flex justify-between items-center">
                <div>
                  <p className="text-xs font-bold text-amber-300">DELAYED (YELLOW)</p>
                  <p className="text-[10px] text-slate-400">Major Injury, Stable Vitals</p>
                </div>
                <span className="text-xl font-black font-mono text-amber-400">{triageMetrics.delayedYellow}</span>
              </div>

              <div className="p-3 bg-emerald-950/40 border border-emerald-800/80 rounded-xl flex justify-between items-center">
                <div>
                  <p className="text-xs font-bold text-emerald-300">MINOR (GREEN)</p>
                  <p className="text-[10px] text-slate-400">Walking Wounded</p>
                </div>
                <span className="text-xl font-black font-mono text-emerald-400">{triageMetrics.minorGreen}</span>
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex justify-between items-center">
                <div>
                  <p className="text-xs font-bold text-slate-400">EXPECTANT (BLACK)</p>
                  <p className="text-[10px] text-slate-500">Deceased / Nonsurvivable</p>
                </div>
                <span className="text-xl font-black font-mono text-slate-400">{triageMetrics.expectantBlack}</span>
              </div>
            </div>
          </div>

          {/* HAZMAT Decontamination Progress */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl">
            <h3 className="text-xs font-bold text-slate-300 flex items-center gap-2 mb-3">
              <Radio className="w-4 h-4 text-cyan-400" />
              CBRNE Decon Pipeline
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800 text-slate-300">
                <span>Decontaminated Victims:</span>
                <span className="font-mono text-cyan-400">{triageMetrics.deconCount} Processed</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800 text-slate-300">
                <span>Hot-Zone Runoff Containment:</span>
                <span className="font-mono text-emerald-400">SECURE (Tank A)</span>
              </div>
              <div className="flex justify-between py-1 text-slate-300">
                <span>Available Trauma Bays:</span>
                <span className="font-mono text-rose-400">{triageMetrics.traumaBayAvailable} / 12 Open</span>
              </div>
            </div>
          </div>
        </div>

        {/* Center Column: Live Casualty Tracking & Incident Map */}
        <div className="lg:col-span-6 space-y-6">
          {/* Incident Overview Banner */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-wrap justify-between items-center gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold text-slate-100">Incident: Port Chemical Explosion</h2>
                <span className="px-2.5 py-0.5 text-xs bg-rose-950 text-rose-400 border border-rose-800 rounded-full font-semibold">
                  HICS ACTIVE
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Incident Commander: Dr. V. Mercer | Safety Officer: Chief J. Vance | Location: Port Dock 14
              </p>
            </div>
            <div className="flex gap-2">
              <span className="px-3 py-1 bg-slate-800 text-slate-300 rounded-lg text-xs font-mono border border-slate-700">
                NDMS Integrated
              </span>
            </div>
          </div>

          {/* Victim Tracking Table */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <h3 className="text-xs font-bold text-slate-300 tracking-wider mb-4 flex items-center gap-2">
              <Ambulance className="w-4 h-4 text-cyan-400" />
              LIVE CASUALTY FIELD TRACKING & RECEPTION ROSTER
            </h3>

            <div className="space-y-3">
              {victimList.map(v => (
                <div 
                  key={v.id}
                  onClick={() => setSelectedVictim(v.id)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    selectedVictim === v.id ? 'bg-slate-800/90 border-cyan-500/60 shadow-lg' : 'bg-slate-950/60 border-slate-800'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs font-bold font-mono text-slate-200">{v.id}</span>
                      <span className="text-xs text-slate-400 ml-2">({v.location})</span>
                    </div>
                    <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-md ${
                      v.tag === 'RED' ? 'bg-rose-950 text-rose-400 border border-rose-800' :
                      v.tag === 'YELLOW' ? 'bg-amber-950 text-amber-400 border border-amber-800' :
                      v.tag === 'GREEN' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                      'bg-slate-900 text-slate-400 border border-slate-700'
                    }`}>
                      {v.rpm}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-2"><strong className="text-slate-400">Injury:</strong> {v.injury}</p>
                  <p className="text-[11px] text-slate-400 mt-1 font-mono"><strong className="text-slate-400">Field Vitals:</strong> {v.vitals}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Incident Notifications & Alerts */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-sm font-bold text-slate-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                Incident Command Bulletins
              </h2>
              <span className="px-2 py-0.5 text-[10px] bg-rose-950 text-rose-400 border border-rose-800 rounded-full font-mono">
                {incidentAlerts.length} Alerts
              </span>
            </div>

            <div className="space-y-3">
              {incidentAlerts.map(alt => (
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

          {/* Regulatory Standards Compliance */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-2">
            <h3 className="text-xs font-bold text-slate-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Standard Operating Protocols
            </h3>
            <div className="text-[11px] text-slate-400 space-y-1">
              <p className="flex justify-between"><span>FEMA HICS Level:</span> <span className="text-emerald-400 font-semibold">Activated</span></p>
              <p className="flex justify-between"><span>START Triage Algorithm:</span> <span className="text-emerald-400 font-semibold">Active</span></p>
              <p className="flex justify-between"><span>HL7 FHIR R4 Tracking:</span> <span className="text-emerald-400 font-semibold">Streaming</span></p>
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
                  {selectedAlert.type} BULLETIN
                </span>
                <h3 className="text-lg font-bold text-slate-100 mt-2">{selectedAlert.title}</h3>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-200 font-mono text-xl">×</button>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed">{selectedAlert.desc}</p>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs text-slate-400 space-y-1">
              <p><strong className="text-slate-200">Standard Framework:</strong> {selectedAlert.standard}</p>
              <p><strong className="text-slate-200">Command Directive:</strong> Divert non-trauma EMS transport to regional partner facilities. Activate off-duty trauma surgical teams.</p>
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold">Close</button>
              <button onClick={() => { alert('Disaster Command Directive Dispatched'); setShowModal(false); }} className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-rose-600/40">Broadcast HICS Directive</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DisasterTriageIncidentCommandHub;
