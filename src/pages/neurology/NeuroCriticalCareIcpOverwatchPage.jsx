import React, { useState, useEffect, useMemo } from 'react';
import {
  Brain,
  Activity,
  HeartPulse,
  ShieldAlert,
  Search,
  Filter,
  RefreshCw,
  PlusCircle,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  TrendingUp,
  TrendingDown,
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
  Siren,
  Gauge
} from 'lucide-react';

// ============================================================================
// NEURO CRITICAL CARE & INTRACRANIAL PRESSURE (ICP) OVERWATCH HUB
// Enterprise Neuro-Intensive Care Subsystem for MedTrack Ecosystem
// Standards: ICP / CPP, EVD CSF Drainage, qEEG Seizure, TCD Lindegaard Ratio, NPi
// ============================================================================

export default function NeuroCriticalCareIcpOverwatchPage() {
  // --------------------------------------------------------------------------
  // STATE MANAGEMENT
  // --------------------------------------------------------------------------
  const [activeTab, setActiveTab] = useState('icp-cpp');
  const [selectedPatientId, setSelectedPatientId] = useState('NEURO-7701');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [notification, setNotification] = useState(null);

  // --------------------------------------------------------------------------
  // NEURO ICU PATIENT COHORT DATASET
  // --------------------------------------------------------------------------
  const neuroPatients = [
    {
      id: 'NEURO-7701',
      name: 'Julian Sterling',
      age: 42,
      gender: 'Male',
      diagnosis: 'Severe Traumatic Brain Injury (TBI) / Left Subdural Hematoma',
      evdStatus: 'EVD Open to Drain @ +10 cm H2O',
      vitals: { sbp: 138, dbp: 82, map: 101, hr: 78, temp: 37.8 },
      neuro: {
        icp: 22, // Intracranial Pressure mmHg (Hypertension > 20)
        cpp: 79, // CPP = MAP - ICP = 101 - 22 = 79 mmHg (Target 60-70)
        evdRate: 14, // mL/hr CSF drainage
        csfColor: 'Xanthochromic / Clear',
        pbtO2: 18.5, // Brain Tissue Oxygenation mmHg (Ischemia < 20)
        npiLeft: 2.8, // Neurological Pupil Index (Abnormal < 3.0)
        npiRight: 4.2, // Normal 3.0-5.0
        qeegSr: 12, // Suppression Ratio %
        tcdLindegaard: 4.2 // Lindegaard Ratio (Moderate Vasospasm 3-6)
      },
      gcsScore: 'GCS 7T (E2 V1t M4)',
      attendingNeurointensivist: 'Dr. Sarah Jenkins, MD, FNCS'
    },
    {
      id: 'NEURO-6612',
      name: 'Evelyn Reed',
      age: 56,
      gender: 'Female',
      diagnosis: 'Aneurysmal Subarachnoid Hemorrhage (aSAH) / Fischer Grade 4',
      evdStatus: 'EVD Clamped for ICP Trial',
      vitals: { sbp: 145, dbp: 88, map: 107, hr: 84, temp: 37.2 },
      neuro: {
        icp: 16,
        cpp: 91,
        evdRate: 0,
        csfColor: 'Sanguinous',
        pbtO2: 26.0,
        npiLeft: 4.5,
        npiRight: 4.6,
        qeegSr: 0,
        tcdLindegaard: 6.8 // Severe Vasospasm > 6.0
      },
      gcsScore: 'GCS 12 (E3 V4 M5)',
      attendingNeurointensivist: 'Dr. Marcus Vance, MD'
    }
  ];

  const currentPatient = useMemo(
    () => neuroPatients.find((p) => p.id === selectedPatientId) || neuroPatients[0],
    [selectedPatientId]
  );

  // --------------------------------------------------------------------------
  // HANDLERS
  // --------------------------------------------------------------------------
  const handleRefreshFeed = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      triggerNotification('Intracranial Pressure (ICP) & qEEG Telemetry Synchronized.');
    }, 800);
  };

  const triggerNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const handleDecompressAlert = () => {
    triggerNotification('REFRACTORY ICP ALERT: Decompressive Craniectomy & Hyperosmolar Protocol Dispatched.');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 md:p-8 space-y-6">
      {/* -------------------------------------------------------------------- */}
      {/* HEADER & NEURO PATIENT TELEMETRY BAR                                 */}
      {/* -------------------------------------------------------------------- */}
      <header className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center space-x-4">
            <div className="p-3.5 bg-purple-500/10 border border-purple-500/30 rounded-xl text-purple-400">
              <Brain className="w-9 h-9 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
                  Neuro Critical Care & ICP Multimodal Overwatch
                </h1>
                <span className="px-3 py-1 bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-mono rounded-full font-semibold">
                  EVD TELEMETRY LIVE
                </span>
              </div>
              <p className="text-slate-400 text-sm mt-1">
                Intracranial Pressure (ICP), Cerebral Perfusion Pressure (CPP), qEEG Seizure & TCD Vasospasm Subsystem
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleDecompressAlert}
              className="flex items-center space-x-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-rose-900/50 transition-all duration-200 animate-pulse"
            >
              <Siren className="w-4 h-4" />
              <span>Refractory ICP Crisis</span>
            </button>

            <button
              onClick={handleRefreshFeed}
              disabled={isRefreshing}
              className="flex items-center space-x-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl font-medium text-sm text-slate-200"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-purple-400' : ''}`} />
              <span>{isRefreshing ? 'Syncing...' : 'Sync Neuro Stream'}</span>
            </button>
          </div>
        </div>

        {/* Patient Selector Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-slate-800">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Neuro ICU Patient
            </label>
            <select
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm font-semibold text-purple-300 focus:outline-none focus:border-purple-500"
            >
              {neuroPatients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.id}) - {p.gcsScore}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 flex flex-col justify-between">
            <span className="text-xs font-medium text-slate-400">Diagnosis & EVD Status</span>
            <span className="text-xs font-bold text-white truncate">{currentPatient.diagnosis}</span>
            <span className="text-[11px] font-mono text-purple-300">{currentPatient.evdStatus}</span>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 flex flex-col justify-between">
            <span className="text-xs font-medium text-slate-400">ICP & Cerebral Perfusion (CPP)</span>
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-200">
              <span className="text-rose-400 font-mono">ICP: {currentPatient.neuro.icp} mmHg</span>
              <span className="text-slate-600">|</span>
              <span className="text-emerald-400 font-mono">CPP: {currentPatient.neuro.cpp} mmHg</span>
            </div>
            <span className="text-[11px] font-mono text-amber-300">PbtO2: {currentPatient.neuro.pbtO2} mmHg</span>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 flex flex-col justify-between">
            <span className="text-xs font-medium text-slate-400">Pupillometry (NPi L/R)</span>
            <span className="text-xs font-bold text-cyan-300 font-mono">
              Left: {currentPatient.neuro.npiLeft} | Right: {currentPatient.neuro.npiRight}
            </span>
            <span className="text-[11px] font-mono text-slate-400 truncate">{currentPatient.attendingNeurointensivist}</span>
          </div>
        </div>
      </header>

      {/* -------------------------------------------------------------------- */}
      {/* SYSTEM TOAST NOTIFICATION                                             */}
      {/* -------------------------------------------------------------------- */}
      {notification && (
        <div className="bg-purple-950/80 border border-purple-500/50 rounded-xl p-4 flex items-center justify-between text-purple-200 shadow-xl animate-fade-in">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-5 h-5 text-purple-400 flex-shrink-0" />
            <span className="text-sm font-medium">{notification}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-purple-400 hover:text-white">
            &times;
          </button>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* NAVIGATION TABS                                                      */}
      {/* -------------------------------------------------------------------- */}
      <nav className="flex flex-wrap items-center gap-2 bg-slate-900/60 border border-slate-800/80 rounded-xl p-1.5">
        {[
          { id: 'icp-cpp', label: 'ICP & Cerebral Perfusion (CPP)', icon: Gauge },
          { id: 'qeeg-seizure', label: 'qEEG Seizure & Suppression', icon: Activity },
          { id: 'tcd-vasospasm', label: 'TCD Vasospasm (Lindegaard)', icon: BrainCircuit }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-r from-purple-600/30 to-rose-600/30 text-purple-300 border border-purple-500/40 shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-purple-400' : 'text-slate-500'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* -------------------------------------------------------------------- */}
      {/* TAB 1: ICP & CPP TELEMETRY                                            */}
      {/* -------------------------------------------------------------------- */}
      {activeTab === 'icp-cpp' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-2">
              <span className="text-xs font-semibold text-slate-400 uppercase">Intracranial Pressure (ICP)</span>
              <div className="text-3xl font-black text-rose-400 font-mono">{currentPatient.neuro.icp} mmHg</div>
              <p className="text-xs text-slate-400">Intracranial Hypertension (&gt; 20 mmHg)</p>
            </div>

            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-2">
              <span className="text-xs font-semibold text-slate-400 uppercase">Cerebral Perfusion Pressure</span>
              <div className="text-3xl font-black text-emerald-400 font-mono">{currentPatient.neuro.cpp} mmHg</div>
              <p className="text-xs text-slate-400">CPP = MAP - ICP (Target 60 - 70)</p>
            </div>

            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-2">
              <span className="text-xs font-semibold text-slate-400 uppercase">Brain Tissue Oxygenation (PbtO2)</span>
              <div className="text-3xl font-black text-amber-400 font-mono">{currentPatient.neuro.pbtO2} mmHg</div>
              <p className="text-xs text-slate-400">Ischemia Warning (&lt; 20 mmHg)</p>
            </div>

            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-2">
              <span className="text-xs font-semibold text-slate-400 uppercase">EVD CSF Drainage Rate</span>
              <div className="text-3xl font-black text-purple-400 font-mono">{currentPatient.neuro.evdRate} mL/hr</div>
              <p className="text-xs text-slate-400">Color: {currentPatient.neuro.csfColor}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
