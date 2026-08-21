import React, { useState, useEffect, useMemo } from 'react';
import {
  Activity,
  Droplets,
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
  FlaskConical,
  Flame,
  Siren,
  Scale
} from 'lucide-react';

// ============================================================================
// CONTINUOUS DIALYSIS & ACUTE KIDNEY INJURY (AKI) NEPHROLOGY OVERWATCH HUB
// Enterprise Nephrology & Critical Care CRRT Subsystem for MedTrack Ecosystem
// Standards: KDIGO AKI Staging 1-3, CVVHDF CRRT, RCA Citrate Calcium, %FO Fluid Overload
// ============================================================================

export default function ContinuousDialysisAkiOverwatchPage() {
  // --------------------------------------------------------------------------
  // STATE MANAGEMENT
  // --------------------------------------------------------------------------
  const [activeTab, setActiveTab] = useState('crrt-circuit');
  const [selectedPatientId, setSelectedPatientId] = useState('NEPH-4401');
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState('ALL');
  const [selectedCircuit, setSelectedCircuit] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [notification, setNotification] = useState(null);

  // --------------------------------------------------------------------------
  // NEPHROLOGY PATIENT COHORT DATASET
  // --------------------------------------------------------------------------
  const nephrologyPatients = [
    {
      id: 'NEPH-4401',
      name: 'Deborah Vance',
      age: 63,
      gender: 'Female',
      diagnosis: 'Septic Shock / KDIGO Stage 3 AKI / Severe Metabolic Acidosis',
      crrtMode: 'CVVHDF (Continuous Veno-Venous Hemodiafiltration)',
      anticoagulation: 'Regional Citrate Anticoagulation (RCA)',
      vitals: { sbp: 102, dbp: 58, map: 72, hr: 96, temp: 37.4 },
      labs: {
        creatinine: 5.4, // mg/dL (Baseline 0.9) -> >3x Increase (KDIGO 3)
        bun: 88, // mg/dL
        egfr: 8, // mL/min/1.73m2
        potassium: 5.8, // mEq/L (Hyperkalemia)
        bicarbonate: 14, // mEq/L (Severe Acidosis)
        urineOutput: 0.12, // mL/kg/hr (Anuric < 0.3 for 24h)
        iCaSys: 1.18, // mmol/L Systemic Ionized Calcium
        iCaCircuit: 0.38, // mmol/L Circuit Ionized Calcium (Target 0.25-0.40)
        tCaToICaRatio: 2.1 // Total Calcium / iCa (Toxicity > 2.5)
      },
      crrtParams: {
        bloodFlowQb: 200, // mL/min
        dialysateQd: 1500, // mL/hr
        replacementQr: 1500, // mL/hr (Post-dilution)
        netUfRate: 150, // mL/hr Net Ultrafiltration
        effluentDose: 32.5, // mL/kg/hr (Target > 20-25)
        tmp: 145, // mmHg Transmembrane Pressure (Clot alert > 250)
        filterPressure: 210,
        accessPressure: -110,
        returnPressure: 130
      },
      fluidOverloadPct: 14.2, // % FO (High Overload > 10%)
      admitWeightKg: 68.0,
      currentWeightKg: 77.6,
      attendingNephrologist: 'Dr. Robert Vance, MD, FASN'
    },
    {
      id: 'NEPH-3312',
      name: 'Gregory House',
      age: 58,
      gender: 'Male',
      diagnosis: 'Rhabdomyolysis / Acute Tubular Necrosis (ATN) / KDIGO Stage 3',
      crrtMode: 'CVVH (High-Volume Hemofiltration)',
      anticoagulation: 'Heparin Systemic Protocol',
      vitals: { sbp: 118, dbp: 72, map: 87, hr: 82, temp: 36.9 },
      labs: {
        creatinine: 6.8,
        bun: 112,
        egfr: 6,
        potassium: 6.2,
        bicarbonate: 17,
        urineOutput: 0.05,
        iCaSys: 1.12,
        iCaCircuit: 0.42,
        tCaToICaRatio: 1.9
      },
      crrtParams: {
        bloodFlowQb: 220,
        dialysateQd: 0,
        replacementQr: 3000,
        netUfRate: 100,
        effluentDose: 35.0,
        tmp: 180,
        filterPressure: 240,
        accessPressure: -130,
        returnPressure: 145
      },
      fluidOverloadPct: 8.5,
      admitWeightKg: 82.0,
      currentWeightKg: 89.0,
      attendingNephrologist: 'Dr. Elena Rostova, MD'
    }
  ];

  const currentPatient = useMemo(
    () => nephrologyPatients.find((p) => p.id === selectedPatientId) || nephrologyPatients[0],
    [selectedPatientId]
  );

  // --------------------------------------------------------------------------
  // HANDLERS
  // --------------------------------------------------------------------------
  const handleRefreshFeed = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      triggerNotification('CRRT Telemetry & Effluent Dose Stream Synchronized.');
    }, 800);
  };

  const triggerNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 md:p-8 space-y-6">
      {/* -------------------------------------------------------------------- */}
      {/* HEADER & PATIENT SELECTION BAR                                      */}
      {/* -------------------------------------------------------------------- */}
      <header className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center space-x-4">
            <div className="p-3.5 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-400">
              <Droplets className="w-9 h-9 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
                  Continuous Dialysis & AKI Nephrology Overwatch
                </h1>
                <span className="px-3 py-1 bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-mono rounded-full font-semibold">
                  CRRT TELEMETRY LIVE
                </span>
              </div>
              <p className="text-slate-400 text-sm mt-1">
                KDIGO AKI Staging 1-3, Continuous Renal Replacement Therapy (CVVHDF), RCA Citrate & %FO Fluid Overload
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleRefreshFeed}
              disabled={isRefreshing}
              className="flex items-center space-x-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl font-medium text-sm text-slate-200"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
              <span>{isRefreshing ? 'Syncing...' : 'Sync CRRT Data'}</span>
            </button>
          </div>
        </div>

        {/* Patient Selection Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-slate-800">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              CRRT Nephrology Patient
            </label>
            <select
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm font-semibold text-cyan-300 focus:outline-none focus:border-cyan-500"
            >
              {nephrologyPatients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.id}) - {p.crrtMode.substring(0, 20)}...
                </option>
              ))}
            </select>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 flex flex-col justify-between">
            <span className="text-xs font-medium text-slate-400">Diagnosis & Anticoagulation</span>
            <span className="text-xs font-bold text-white truncate">{currentPatient.diagnosis}</span>
            <span className="text-[11px] font-mono text-cyan-300">{currentPatient.anticoagulation}</span>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 flex flex-col justify-between">
            <span className="text-xs font-medium text-slate-400">Serum Creatinine & eGFR</span>
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-200">
              <span className="text-rose-400 font-mono">Cr: {currentPatient.labs.creatinine} mg/dL</span>
              <span className="text-slate-600">|</span>
              <span className="text-purple-400 font-mono">eGFR: {currentPatient.labs.egfr} mL/min</span>
            </div>
            <span className="text-[11px] font-mono text-amber-300">UO: {currentPatient.labs.urineOutput} mL/kg/hr</span>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 flex flex-col justify-between">
            <span className="text-xs font-medium text-slate-400">CRRT Effluent Dose & %FO</span>
            <span className="text-xs font-bold text-emerald-400 font-mono">
              Dose: {currentPatient.crrtParams.effluentDose} mL/kg/hr | FO: {currentPatient.fluidOverloadPct}%
            </span>
            <span className="text-[11px] font-mono text-slate-400 truncate">{currentPatient.attendingNephrologist}</span>
          </div>
        </div>
      </header>

      {/* -------------------------------------------------------------------- */}
      {/* SYSTEM TOAST NOTIFICATION                                             */}
      {/* -------------------------------------------------------------------- */}
      {notification && (
        <div className="bg-cyan-950/80 border border-cyan-500/50 rounded-xl p-4 flex items-center justify-between text-cyan-200 shadow-xl animate-fade-in">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-5 h-5 text-cyan-400 flex-shrink-0" />
            <span className="text-sm font-medium">{notification}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-cyan-400 hover:text-white">
            &times;
          </button>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* NAVIGATION TABS                                                      */}
      {/* -------------------------------------------------------------------- */}
      <nav className="flex flex-wrap items-center gap-2 bg-slate-900/60 border border-slate-800/80 rounded-xl p-1.5">
        {[
          { id: 'crrt-circuit', label: 'CRRT Circuit Telemetry (CVVHDF)', icon: Activity },
          { id: 'rca-calcium', label: 'RCA Citrate & Calcium Protocol', icon: FlaskConical },
          { id: 'fluid-overload', label: 'Fluid Balance & %FO Ultrafiltration', icon: Scale },
          { id: 'kdigo-staging', label: 'KDIGO AKI Staging & Electrolytes', icon: ShieldAlert }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-600/30 to-teal-600/30 text-cyan-300 border border-cyan-500/40 shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* -------------------------------------------------------------------- */}
      {/* TAB 1: CRRT CIRCUIT TELEMETRY                                        */}
      {/* -------------------------------------------------------------------- */}
      {activeTab === 'crrt-circuit' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-2">
              <span className="text-xs font-semibold text-slate-400 uppercase">Effluent Prescribed Dose</span>
              <div className="text-3xl font-black text-emerald-400 font-mono">{currentPatient.crrtParams.effluentDose}</div>
              <p className="text-xs text-slate-400">mL/kg/hr (Target KDIGO &gt; 20-25)</p>
            </div>

            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-2">
              <span className="text-xs font-semibold text-slate-400 uppercase">Transmembrane Pressure (TMP)</span>
              <div className="text-3xl font-black text-cyan-400 font-mono">{currentPatient.crrtParams.tmp} mmHg</div>
              <p className="text-xs text-slate-400">Filter Clot Warning (&gt; 250 mmHg)</p>
            </div>

            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-2">
              <span className="text-xs font-semibold text-slate-400 uppercase">Blood Flow Rate (Qb)</span>
              <div className="text-3xl font-black text-purple-400 font-mono">{currentPatient.crrtParams.bloodFlowQb} mL/min</div>
              <p className="text-xs text-slate-400">Access Pump Speed</p>
            </div>

            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-2">
              <span className="text-xs font-semibold text-slate-400 uppercase">Net Ultrafiltration (UF)</span>
              <div className="text-3xl font-black text-amber-400 font-mono">{currentPatient.crrtParams.netUfRate} mL/hr</div>
              <p className="text-xs text-slate-400">Fluid Removal Target</p>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* TAB 2: RCA CITRATE & CALCIUM PROTOCOL                                */}
      {/* -------------------------------------------------------------------- */}
      {activeTab === 'rca-calcium' && (
        <div className="space-y-6">
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h2 className="text-lg font-bold text-white">Regional Citrate Anticoagulation (RCA) Calcium Ratios</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
                <span className="text-xs text-slate-400 font-mono">Systemic Ionized Ca (iCa)</span>
                <div className="text-2xl font-black text-emerald-400 font-mono">{currentPatient.labs.iCaSys} mmol/L</div>
                <p className="text-[11px] text-slate-500">Target 1.10 - 1.30 mmol/L</p>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
                <span className="text-xs text-slate-400 font-mono">Circuit Post-Filter iCa</span>
                <div className="text-2xl font-black text-cyan-400 font-mono">{currentPatient.labs.iCaCircuit} mmol/L</div>
                <p className="text-[11px] text-slate-500">Target 0.25 - 0.40 mmol/L</p>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
                <span className="text-xs text-slate-400 font-mono">Total Ca / iCa Ratio</span>
                <div className="text-2xl font-black text-purple-400 font-mono">{currentPatient.labs.tCaToICaRatio}</div>
                <p className="text-[11px] text-slate-500">Citrate Toxicity Alert (&gt; 2.5)</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
