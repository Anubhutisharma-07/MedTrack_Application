import React, { useState, useEffect, useMemo } from 'react';
import {
  HeartPulse,
  Activity,
  Zap,
  TrendingUp,
  TrendingDown,
  ShieldAlert,
  Search,
  Filter,
  RefreshCw,
  PlusCircle,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Layers,
  Thermometer,
  Syringe,
  BarChart3,
  Calendar,
  Clock,
  UserCheck,
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
  Cpu,
  Waves,
  Stethoscope,
  Siren
} from 'lucide-react';

// ============================================================================
// CARDIOVASCULAR TELEMETRY & INVASIVE HEMODYNAMICS OVERWATCH HUB
// Enterprise Cardiology & Cardiac Surgery Subsystem for MedTrack Ecosystem
// Standards: PAC Swan-Ganz, Impella CP/5.5 MCS, IABP 1:1, STEMI 12-Lead, CPO, SVR
// ============================================================================

export default function CardiovascularHemodynamicsOverwatchPage() {
  // --------------------------------------------------------------------------
  // STATE MANAGEMENT
  // --------------------------------------------------------------------------
  const [activeTab, setActiveTab] = useState('hemo-overview');
  const [selectedPatientId, setSelectedPatientId] = useState('CARD-9910');
  const [searchQuery, setSearchQuery] = useState('');
  const [shockFilter, setShockFilter] = useState('ALL');
  const [selectedWaveform, setSelectedWaveform] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [notification, setNotification] = useState(null);
  const [mcsAugmentation, setMcsAugmentation] = useState('1:1');

  // --------------------------------------------------------------------------
  // CARDIAC ICU PATIENT COHORT TELEMETRY DATASET
  // --------------------------------------------------------------------------
  const cardiacPatients = [
    {
      id: 'CARD-9910',
      name: 'Arthur Pendelton',
      age: 67,
      gender: 'Male',
      diagnosis: 'Acute Anterior STEMI / Severe Cardiogenic Shock (SCAI Stage D)',
      supportDevice: 'Impella CP + IABP 1:1',
      vitals: { hr: 112, sbp: 86, dbp: 52, map: 63, spo2: 92, temp: 36.4 },
      hemo: {
        co: 3.1, // Cardiac Output L/min
        ci: 1.65, // Cardiac Index L/min/m2
        pawp: 26, // Pulmonary Artery Wedge Pressure mmHg
        cvp: 16, // Central Venous Pressure mmHg
        svr: 1840, // Systemic Vascular Resistance dynes/sec/cm-5
        cpo: 0.43, // Cardiac Power Output Watts (Severe Shock < 0.6)
        ppv: 18 // Pulse Pressure Variation %
      },
      ecgStatus: 'Anterolateral ST Elevation 4.5mm (V1-V4), Frequent PVCs',
      cathLabStatus: 'PCI Completed: LAD Drug-Eluting Stent (Xience 3.5x18mm)',
      attendingCardiologist: 'Dr. Harrison Wells, MD, FACC'
    },
    {
      id: 'CARD-8832',
      name: 'Beatrice Lawson',
      age: 74,
      gender: 'Female',
      diagnosis: 'Decompensated Ischemic Cardiomyopathy (EF 15%)',
      supportDevice: 'Milrinone 0.375 mcg/kg/min IV',
      vitals: { hr: 94, sbp: 98, dbp: 60, map: 73, spo2: 95, temp: 36.8 },
      hemo: {
        co: 4.2,
        ci: 2.1,
        pawp: 19,
        cvp: 11,
        svr: 1320,
        cpo: 0.68,
        ppv: 9
      },
      ecgStatus: 'Atrial Fibrillation with Controlled Ventricular Response (85-95 bpm)',
      cathLabStatus: 'Transcatheter Edge-to-Edge Repair (MitraClip) Planned',
      attendingCardiologist: 'Dr. Elena Rostova, MD'
    },
    {
      id: 'CARD-7704',
      name: 'Charles Sterling',
      age: 59,
      gender: 'Male',
      diagnosis: 'Post-CABG x 4 / VA-ECMO Mechanical Support',
      supportDevice: 'VA-ECMO (3.8 L/min) + Impella 5.5',
      vitals: { hr: 88, sbp: 104, dbp: 68, map: 80, spo2: 98, temp: 37.1 },
      hemo: {
        co: 5.1,
        ci: 2.55,
        pawp: 14,
        cvp: 8,
        svr: 1120,
        cpo: 0.90,
        ppv: 6
      },
      ecgStatus: 'Sinus Rhythm with Non-Specific ST-T Wave Changes',
      cathLabStatus: 'Graft Patency Confirmed via Angiogram',
      attendingCardiologist: 'Dr. Marcus Vance, MD, FSCAI'
    }
  ];

  const currentPatient = useMemo(
    () => cardiacPatients.find((p) => p.id === selectedPatientId) || cardiacPatients[0],
    [selectedPatientId]
  );

  // --------------------------------------------------------------------------
  // MECHANICAL CIRCULATORY SUPPORT (MCS) TELEMETRY DATA
  // --------------------------------------------------------------------------
  const mcsDevices = [
    {
      name: 'Impella CP Left Ventricular Assist Device',
      status: 'RUNNING (P-8 Flow Mode)',
      flowRate: '3.4 L/min',
      motorSpeed: '42,000 RPM',
      purgePressure: '480 mmHg',
      purgeFlow: '12.5 mL/hr',
      suctionAlarm: 'NO ALARMS - Optimal Position'
    },
    {
      name: 'Intra-Aortic Balloon Pump (IABP)',
      status: 'ACTIVE 1:1 AUGMENTATION',
      frequency: '1:1',
      augPressure: '135 mmHg',
      gasSource: 'Helium Tank Level 85%',
      timingMode: 'Auto-ECG R-Wave Trigger'
    },
    {
      name: 'VA-ECMO Extracorporeal Circuit',
      status: 'STABLE RUNNING',
      rpm: '3,250 RPM',
      bloodFlow: '3.85 L/min',
      fiO2: '100% Sweep Gas 4.0 L/min',
      deltaP: '28 mmHg (Transmembrane Gradient)'
    }
  ];

  // --------------------------------------------------------------------------
  // 12-LEAD ECG TELEMETRY LEADS DATA
  // --------------------------------------------------------------------------
  const ecgLeads = [
    { lead: 'V1', stElevation: 2.1, status: 'ELEVATED' },
    { lead: 'V2', stElevation: 4.5, status: 'CRITICAL STEMI' },
    { lead: 'V3', stElevation: 4.8, status: 'CRITICAL STEMI' },
    { lead: 'V4', stElevation: 3.2, status: 'ELEVATED' },
    { lead: 'V5', stElevation: 1.1, status: 'BORDERLINE' },
    { lead: 'V6', stElevation: 0.5, status: 'NORMAL' },
    { lead: 'II', stElevation: -0.8, status: 'RECIPROCAL DEPRESSION' },
    { lead: 'III', stElevation: -1.2, status: 'RECIPROCAL DEPRESSION' },
    { lead: 'aVF', stElevation: -1.0, status: 'RECIPROCAL DEPRESSION' }
  ];

  // --------------------------------------------------------------------------
  // HANDLERS
  // --------------------------------------------------------------------------
  const handleRefreshTelemetry = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      triggerNotification('Swan-Ganz & Invasive Arterial Telemetry Stream Synchronized.');
    }, 800);
  };

  const triggerNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const handleCathLabEmergencyTrigger = () => {
    triggerNotification('EMERGENCY CATH LAB ACTIVATION: Code STEMI Team Dispatched to Unit.');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 md:p-8 space-y-6">
      {/* -------------------------------------------------------------------- */}
      {/* HEADER & CARDIAC PATIENT TELEMETRY BAR                               */}
      {/* -------------------------------------------------------------------- */}
      <header className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center space-x-4">
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400">
              <HeartPulse className="w-9 h-9 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
                  Cardiovascular Telemetry & Invasive Hemodynamics Overwatch
                </h1>
                <span className="px-3 py-1 bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-mono rounded-full font-semibold">
                  SWAN-GANZ LIVE
                </span>
              </div>
              <p className="text-slate-400 text-sm mt-1">
                Pulmonary Artery Catheterization, Impella/IABP MCS Telemetry & Cardiogenic Shock (CPO) Overwatch
              </p>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleCathLabEmergencyTrigger}
              className="flex items-center space-x-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-rose-900/50 transition-all duration-200 animate-pulse"
            >
              <Siren className="w-4 h-4" />
              <span>Activate Code STEMI</span>
            </button>

            <button
              onClick={handleRefreshTelemetry}
              disabled={isRefreshing}
              className="flex items-center space-x-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl font-medium text-sm text-slate-200"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-rose-400' : ''}`} />
              <span>{isRefreshing ? 'Syncing...' : 'Sync Telemetry'}</span>
            </button>
          </div>
        </div>

        {/* Patient Selection Bar */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-slate-800">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Cardiac ICU Patient
            </label>
            <select
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm font-semibold text-rose-300 focus:outline-none focus:border-rose-500"
            >
              {cardiacPatients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.id}) - {p.diagnosis.substring(0, 24)}...
                </option>
              ))}
            </select>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 flex flex-col justify-between">
            <span className="text-xs font-medium text-slate-400">Diagnosis & SCAI Stage</span>
            <span className="text-xs font-bold text-white truncate">{currentPatient.diagnosis}</span>
            <span className="text-[11px] font-mono text-rose-400">{currentPatient.supportDevice}</span>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 flex flex-col justify-between">
            <span className="text-xs font-medium text-slate-400">Cardiac Output & Index</span>
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-200">
              <span className="text-emerald-400 font-mono">CO: {currentPatient.hemo.co} L/min</span>
              <span className="text-slate-600">|</span>
              <span className="text-cyan-400 font-mono">CI: {currentPatient.hemo.ci} L/min/m²</span>
            </div>
            <span className="text-[11px] font-mono text-amber-300">CPO: {currentPatient.hemo.cpo} Watts</span>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 flex flex-col justify-between">
            <span className="text-xs font-medium text-slate-400">Pressures (PAWP / CVP / MAP)</span>
            <span className="text-xs font-bold text-rose-300 font-mono">
              PAWP: {currentPatient.hemo.pawp} | CVP: {currentPatient.hemo.cvp} | MAP: {currentPatient.vitals.map} mmHg
            </span>
            <span className="text-[11px] font-mono text-slate-400 truncate">{currentPatient.attendingCardiologist}</span>
          </div>
        </div>
      </header>

      {/* -------------------------------------------------------------------- */}
      {/* SYSTEM TOAST NOTIFICATION                                             */}
      {/* -------------------------------------------------------------------- */}
      {notification && (
        <div className="bg-rose-950/80 border border-rose-500/50 rounded-xl p-4 flex items-center justify-between text-rose-200 shadow-xl animate-fade-in">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0" />
            <span className="text-sm font-medium">{notification}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-rose-400 hover:text-white">
            &times;
          </button>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* NAVIGATION TABS                                                      */}
      {/* -------------------------------------------------------------------- */}
      <nav className="flex flex-wrap items-center gap-2 bg-slate-900/60 border border-slate-800/80 rounded-xl p-1.5">
        {[
          { id: 'hemo-overview', label: 'Swan-Ganz PAC Hemodynamics', icon: Waves },
          { id: 'mcs-support', label: 'Mechanical Circulatory Support (Impella/IABP)', icon: Cpu },
          { id: 'ecg-stemi', label: '12-Lead ECG STEMI & Arrhythmia', icon: Activity },
          { id: 'cath-lab', label: 'Cath Lab Angiography & FFR', icon: Stethoscope }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-r from-rose-600/30 to-amber-600/30 text-rose-300 border border-rose-500/40 shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-rose-400' : 'text-slate-500'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* -------------------------------------------------------------------- */}
      {/* TAB 1: SWAN-GANZ PAC HEMODYNAMICS                                    */}
      {/* -------------------------------------------------------------------- */}
      {activeTab === 'hemo-overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-2">
              <span className="text-xs font-semibold text-slate-400 uppercase">Cardiac Power Output (CPO)</span>
              <div className="text-3xl font-black text-rose-400 font-mono">{currentPatient.hemo.cpo} W</div>
              <p className="text-xs text-slate-400">Cardiogenic Shock Indicator (&lt; 0.6 W high mortality)</p>
            </div>

            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-2">
              <span className="text-xs font-semibold text-slate-400 uppercase">Systemic Vascular Resistance</span>
              <div className="text-3xl font-black text-amber-400 font-mono">{currentPatient.hemo.svr}</div>
              <p className="text-xs text-slate-400">dynes/sec/cm⁻⁵ (Normal 800 - 1200)</p>
            </div>

            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-2">
              <span className="text-xs font-semibold text-slate-400 uppercase">Pulmonary Artery Wedge (PAWP)</span>
              <div className="text-3xl font-black text-cyan-400 font-mono">{currentPatient.hemo.pawp} mmHg</div>
              <p className="text-xs text-slate-400">Left Ventricular End-Diastolic Pressure</p>
            </div>

            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-2">
              <span className="text-xs font-semibold text-slate-400 uppercase">Pulse Pressure Variation (PPV)</span>
              <div className="text-3xl font-black text-emerald-400 font-mono">{currentPatient.hemo.ppv}%</div>
              <p className="text-xs text-slate-400">Fluid Responsiveness Predictor (&gt; 13% responsive)</p>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* TAB 2: MECHANICAL CIRCULATORY SUPPORT (MCS)                          */}
      {/* -------------------------------------------------------------------- */}
      {activeTab === 'mcs-support' && (
        <div className="space-y-6">
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="flex items-center space-x-3">
              <Cpu className="w-6 h-6 text-rose-400" />
              <div>
                <h2 className="text-lg font-bold text-white">Mechanical Circulatory Support (MCS) Telemetry</h2>
                <p className="text-xs text-slate-400">Impella CP/5.5 Motor Speed, Purge Pressure & IABP 1:1 Augmentation</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {mcsDevices.map((dev, idx) => (
                <div key={idx} className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-3">
                  <span className="px-2.5 py-1 bg-rose-950 text-rose-300 border border-rose-500/30 text-xs font-mono font-bold rounded-lg">
                    {dev.status}
                  </span>
                  <h3 className="text-sm font-bold text-white mt-2">{dev.name}</h3>
                  <div className="space-y-1 text-xs font-mono text-slate-300 pt-2 border-t border-slate-800">
                    <div>Flow / Speed: <strong className="text-emerald-400">{dev.flowRate || dev.rpm}</strong></div>
                    <div>Purge / Gas: <strong className="text-cyan-300">{dev.purgePressure || dev.gasSource}</strong></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* TAB 3: 12-LEAD ECG STEMI ANALYSIS                                    */}
      {/* -------------------------------------------------------------------- */}
      {activeTab === 'ecg-stemi' && (
        <div className="space-y-6">
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h2 className="text-lg font-bold text-white">12-Lead ECG ST-Segment Elevation Tracking</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {ecgLeads.map((lead) => (
                <div key={lead.lead} className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
                  <span className="font-bold text-white font-mono">{lead.lead}</span>
                  <span className={`font-mono text-sm font-bold ${lead.stElevation > 2 ? 'text-rose-400' : 'text-slate-400'}`}>
                    {lead.stElevation > 0 ? `+${lead.stElevation}` : lead.stElevation} mm
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
