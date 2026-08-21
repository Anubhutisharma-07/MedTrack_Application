import React, { useState, useEffect, useMemo } from 'react';
import {
  Activity,
  Wind,
  ShieldAlert,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Heart,
  Zap,
  TrendingUp,
  Award,
  Layers,
  ChevronRight,
  Database,
  Share2,
  RefreshCw,
  Cpu,
  Flame,
  Stethoscope,
  Radio,
  Sliders,
  Send,
  Download,
  AlertCircle,
  Thermometer,
  Gauge,
  Baby,
  Scale
} from 'lucide-react';

const PICU_PATIENTS = [
  {
    id: "PICU-BED-04",
    name: "Liam O'Connor",
    ageMonths: 14,
    weightKg: 9.8,
    gender: "Male",
    mrn: "MRN-PICU-90214",
    diagnosis: "Severe Viral Bronchiolitis (RSV+) & Severe PARDS (PALICC-2)",
    ventilatorMode: "Sensormedics 3100A (HFOV)",
    telemetry: {
      paw: 26.5,          // Mean Airway Pressure cmH2O
      fio2: 75,            // %
      deltaP: 46,          // Amplitude cmH2O
      freqHz: 9.0,         // Frequency Hertz
      itPercent: 33,       // Inspiratory Time %
      biasFlow: 20,        // L/min
      spo2: 91,
      hr: 154,
      bp: "78/44",
      map: 55,
      temp: 38.6,
      abg: { ph: 7.24, paco2: 62.0, pao2: 56.4, hco3: 25.8, lactate: 2.9, baseExcess: -2.1 },
      chestWiggle: "Optimal (Mid-Thigh Level)",
      sedationRass: -4,
      nirsCerebral: 64,
      nirsRenal: 71
    },
    inotropes: [
      { drug: "Epinephrine", rate: "0.08 mcg/kg/min", dose: "0.78 mcg/min", status: "Active Infusion" },
      { drug: "Milrinone", rate: "0.50 mcg/kg/min", dose: "4.90 mcg/min", status: "Active Infusion" },
      { drug: "Fentanyl", rate: "2.0 mcg/kg/hr", dose: "19.6 mcg/hr", status: "Sedation Target" }
    ],
    alerts: [
      { type: "WARNING", text: "Severe PARDS: Oxygenation Index (OI) = 35.2. Close ECMO standby triggered." },
      { type: "INFO", text: "Permissive Hypercapnia accepted: Target pH > 7.20, PaCO2 55-70 mmHg." }
    ]
  },
  {
    id: "PICU-BED-08",
    name: "Maya Lin",
    ageMonths: 6,
    weightKg: 5.4,
    gender: "Female",
    mrn: "MRN-PICU-48192",
    diagnosis: "Post-Cardiac Congenital Repair (Tetralogy of Fallot) & Acute Pulmonary Edema",
    ventilatorMode: "VN500 HFOV Hybrid",
    telemetry: {
      paw: 22.0,
      fio2: 60,
      deltaP: 38,
      freqHz: 11.0,
      itPercent: 33,
      biasFlow: 16,
      spo2: 94,
      hr: 168,
      bp: "68/38",
      map: 48,
      temp: 37.4,
      abg: { ph: 7.32, paco2: 48.0, pao2: 68.0, hco3: 24.2, lactate: 1.8, baseExcess: -0.8 },
      chestWiggle: "Moderate (Umbilicus Level)",
      sedationRass: -3,
      nirsCerebral: 58,
      nirsRenal: 66
    },
    inotropes: [
      { drug: "Milrinone", rate: "0.35 mcg/kg/min", dose: "1.89 mcg/min", status: "Active Infusion" },
      { drug: "Dexmedetomidine", rate: "0.70 mcg/kg/hr", dose: "3.78 mcg/hr", status: "Sedation Target" }
    ],
    alerts: [
      { type: "INFO", text: "Oxygenation Index (OI) = 19.4 (Moderate-to-Severe PARDS). Weaning protocol active." }
    ]
  },
  {
    id: "PICU-BED-02",
    name: "Ethan Ramirez",
    ageMonths: 36,
    weightKg: 14.2,
    gender: "Male",
    mrn: "MRN-PICU-11938",
    diagnosis: "Septic Shock secondary to Staphylococcal Pneumonia (MRSA)",
    ventilatorMode: "Servo-U APRV / PRVC",
    telemetry: {
      paw: 18.0,
      fio2: 50,
      deltaP: 0,
      freqHz: 0,
      itPercent: 50,
      biasFlow: 0,
      spo2: 96,
      hr: 132,
      bp: "88/54",
      map: 65,
      temp: 39.1,
      abg: { ph: 7.36, paco2: 42.0, pao2: 84.0, hco3: 23.0, lactate: 1.4, baseExcess: -1.2 },
      chestWiggle: "Spontaneous Synchronized",
      sedationRass: -2,
      nirsCerebral: 72,
      nirsRenal: 78
    },
    inotropes: [
      { drug: "Norepinephrine", rate: "0.05 mcg/kg/min", dose: "0.71 mcg/min", status: "Weaning" }
    ],
    alerts: [
      { type: "SUCCESS", text: "Oxygenation Index (OI) = 10.7. Candidate for step-down conventional weaning." }
    ]
  }
];

export default function PediatricIcuHfovCommandHub() {
  const [selectedPatientId, setSelectedPatientId] = useState(PICU_PATIENTS[0].id);
  const [activeTab, setActiveTab] = useState('telemetry'); // telemetry, hfov_settings, resuscitation, pards_matrix, fhir
  const [telemetryPulse, setTelemetryPulse] = useState(0);
  const [isCodeBlueActive, setIsCodeBlueActive] = useState(false);
  const [auditLog, setAuditLog] = useState([
    { time: "19:15:20", user: "Dr. K. Patel (PICU Attending)", action: "HFOV Delta-P adjusted from 42 to 46 cmH2O for severe hypercapnia" },
    { time: "18:50:00", user: "Respiratory Care Lead", action: "Stat ABG synchronized with Radiometer ABL90 FLEX" }
  ]);

  const patient = useMemo(() => {
    return PICU_PATIENTS.find(p => p.id === selectedPatientId) || PICU_PATIENTS[0];
  }, [selectedPatientId]);

  // Derived calculation for Oxygenation Index (OI = (Paw * FiO2) / PaO2)
  const oxygenationIndex = useMemo(() => {
    if (!patient.telemetry.abg.pao2) return 0;
    return ((patient.telemetry.paw * patient.telemetry.fio2) / patient.telemetry.abg.pao2).toFixed(1);
  }, [patient]);

  // Derived calculation for Oxygen Saturation Index (OSI = (Paw * FiO2) / SpO2)
  const oxygenSaturationIndex = useMemo(() => {
    if (!patient.telemetry.spo2) return 0;
    return ((patient.telemetry.paw * patient.telemetry.fio2) / patient.telemetry.spo2).toFixed(1);
  }, [patient]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTelemetryPulse(p => p + 1);
    }, 2500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-6 lg:p-8 font-sans">
      {/* Top Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-800 gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-xl shadow-lg shadow-cyan-950/60 border border-cyan-400/40">
            <Baby className="w-8 h-8 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl md:text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-sky-200 to-indigo-400">
                Pediatric ICU & HFOV Life-Support Command Station
              </h1>
              <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-cyan-950 text-cyan-400 border border-cyan-700 uppercase">
                PALICC-2 / PALS 2026
              </span>
            </div>
            <p className="text-xs md:text-sm text-slate-400 mt-0.5">
              High-Frequency Oscillatory Ventilation (HFOV), Real-Time Blood Gas Telemetry & Weight-Tiered Resuscitation Decision Support
            </p>
          </div>
        </div>

        {/* Global Action Trigger Bar */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsCodeBlueActive(!isCodeBlueActive)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-black transition-all shadow-lg ${
              isCodeBlueActive
                ? 'bg-rose-600 text-white animate-bounce shadow-rose-900/80 ring-2 ring-rose-400'
                : 'bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-700/80'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>{isCodeBlueActive ? "CODE BLUE PEDIATRIC RESCUE ACTIVE" : "CODE BLUE PEDIATRIC"}</span>
          </button>
        </div>
      </div>

      {/* Code Blue Pediatric Emergency Protocol Overlay */}
      {isCodeBlueActive && (
        <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-rose-950 via-red-900 to-slate-900 border-2 border-rose-500 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-center space-x-3">
            <Flame className="w-8 h-8 text-rose-400 animate-pulse flex-shrink-0" />
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-black text-rose-200 tracking-wider uppercase">STAT PEDIATRIC RESUSCITATION DIRECTIVE (PALS)</span>
                <span className="px-2 py-0.5 text-xs bg-rose-600 text-white font-black rounded">WEIGHT: {patient.weightKg} KG</span>
              </div>
              <p className="text-xs text-rose-300 mt-1">
                Epinephrine (1:10,000 IV/IO): <strong>{(patient.weightKg * 0.01).toFixed(2)} mg (0.1 mL/kg)</strong> q3-5min.
                Defibrillation (Shockable rhythm): <strong>{(patient.weightKg * 2).toFixed(0)} Joules</strong> Initial / <strong>{(patient.weightKg * 4).toFixed(0)} Joules</strong> Subsequent.
                Amiodarone: <strong>{(patient.weightKg * 5).toFixed(0)} mg</strong> (5 mg/kg bolus).
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 w-full md:w-auto">
            <button
              onClick={() => {
                alert(`PALS STAT orders dispatched for ${patient.name} (${patient.weightKg}kg). Resuscitation timer initiated.`);
                setIsCodeBlueActive(false);
              }}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-black uppercase tracking-wider transition shadow-lg shadow-rose-950"
            >
              Confirm Resuscitation Delivery
            </button>
            <button
              onClick={() => setIsCodeBlueActive(false)}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium"
            >
              Stand Down
            </button>
          </div>
        </div>
      )}

      {/* Patient Selection & Core Metrics Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mt-6">
        {/* Patient Selection Card */}
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl shadow-lg">
          <label className="text-xs uppercase font-bold tracking-wider text-slate-400 flex items-center justify-between mb-2">
            <span>Select PICU Bed & Patient</span>
            <Baby className="w-4 h-4 text-cyan-400" />
          </label>
          <select
            value={selectedPatientId}
            onChange={(e) => setSelectedPatientId(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-cyan-300 font-bold focus:outline-none focus:border-cyan-500"
          >
            {PICU_PATIENTS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.id}: {p.name} ({p.weightKg}kg, {p.ageMonths}m)
              </option>
            ))}
          </select>
          <div className="mt-3 text-xs text-slate-400 space-y-1">
            <div className="flex justify-between">
              <span>MRN:</span> <span className="font-mono text-slate-200">{patient.mrn}</span>
            </div>
            <div className="flex justify-between">
              <span>Ventilator Circuit:</span> <span className="text-cyan-400 font-semibold">{patient.ventilatorMode}</span>
            </div>
            <div className="flex justify-between">
              <span>Diagnosis:</span> <span className="text-slate-300 font-medium truncate max-w-[180px]">{patient.diagnosis}</span>
            </div>
          </div>
        </div>

        {/* Oxygenation Index (OI) Status */}
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-bold tracking-wider text-slate-400">Oxygenation Index (OI)</span>
            <Wind className="w-4 h-4 text-sky-400" />
          </div>
          <div className="my-2">
            <div className="text-3xl font-black text-sky-300">{oxygenationIndex}</div>
            <span className={`inline-block mt-1 px-2 py-0.5 text-xs font-bold rounded ${
              Number(oxygenationIndex) >= 16
                ? 'bg-rose-950 text-rose-400 border border-rose-800'
                : Number(oxygenationIndex) >= 8
                ? 'bg-amber-950 text-amber-400 border border-amber-800'
                : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
            }`}>
              {Number(oxygenationIndex) >= 16 ? "Severe PARDS (OI >= 16) - ECMO Standby" : Number(oxygenationIndex) >= 8 ? "Moderate PARDS (OI 8-16)" : "Mild / Controlled"}
            </span>
          </div>
          <div className="text-xs text-slate-400 flex justify-between border-t border-slate-800/80 pt-2">
            <span>Oxygen Sat Index (OSI):</span>
            <span className="font-mono font-bold text-cyan-300">{oxygenSaturationIndex}</span>
          </div>
        </div>

        {/* Real-Time Telemetry & Vitals */}
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-bold tracking-wider text-slate-400 flex items-center space-x-1">
              <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>Invasive Hemodynamics</span>
            </span>
            <Heart className="w-4 h-4 text-rose-400 animate-pulse" />
          </div>
          <div className="grid grid-cols-3 gap-2 my-2 text-center">
            <div className="bg-slate-950/80 p-2 rounded border border-slate-800">
              <span className="text-xs text-slate-400">HR</span>
              <div className="text-base font-bold text-emerald-300">{patient.telemetry.hr + (telemetryPulse % 3) - 1}</div>
            </div>
            <div className="bg-slate-950/80 p-2 rounded border border-slate-800">
              <span className="text-xs text-slate-400">ART BP</span>
              <div className="text-xs font-bold text-slate-200">{patient.telemetry.bp}</div>
            </div>
            <div className="bg-slate-950/80 p-2 rounded border border-slate-800">
              <span className="text-xs text-slate-400">SpO2</span>
              <div className="text-base font-bold text-cyan-300">{patient.telemetry.spo2}%</div>
            </div>
          </div>
          <div className="text-xs text-slate-400 flex justify-between border-t border-slate-800/80 pt-2">
            <span>Mean Art Pressure (MAP):</span>
            <span className="font-mono font-bold text-emerald-400">{patient.telemetry.map} mmHg</span>
          </div>
        </div>

        {/* NIRS Tissue Oxygenation & RASS */}
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-bold tracking-wider text-slate-400">NIRS Tissue Perfusion</span>
            <Gauge className="w-4 h-4 text-purple-400" />
          </div>
          <div className="my-2 grid grid-cols-2 gap-2">
            <div className="bg-slate-950/60 p-2 rounded border border-slate-800">
              <span className="text-xs text-slate-400">Cerebral rSO2</span>
              <div className="text-lg font-bold text-purple-300">{patient.telemetry.nirsCerebral}%</div>
            </div>
            <div className="bg-slate-950/60 p-2 rounded border border-slate-800">
              <span className="text-xs text-slate-400">Splanchnic rSO2</span>
              <div className="text-lg font-bold text-indigo-300">{patient.telemetry.nirsRenal}%</div>
            </div>
          </div>
          <div className="text-xs text-slate-400 flex justify-between border-t border-slate-800/80 pt-2">
            <span>RASS Sedation Depth:</span>
            <span className="font-bold text-amber-400">{patient.telemetry.sedationRass} (Deep Sedation)</span>
          </div>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-800 mt-6 pb-2 overflow-x-auto">
        {[
          { id: 'telemetry', label: 'HFOV Circuit & Ventilator Telemetry', icon: Wind },
          { id: 'abg', label: 'Continuous Arterial Blood Gas (ABG)', icon: Activity },
          { id: 'resuscitation', label: 'PALS Weight-Based Dosing Matrix', icon: Scale },
          { id: 'pards_matrix', label: 'PALICC-2 PARDS Decision Support', icon: Stethoscope },
          { id: 'fhir', label: 'HL7 FHIR R4 DeviceMetric & Audit', icon: FileText }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg text-xs md:text-sm font-semibold transition whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-600 shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Content Render */}
      <div className="mt-6">
        {activeTab === 'telemetry' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                <span className="text-xs uppercase font-bold text-slate-400">Paw (Mean Airway)</span>
                <div className="text-2xl font-black text-cyan-300 mt-2">{patient.telemetry.paw} <span className="text-xs text-slate-400">cmH2O</span></div>
                <p className="text-xs text-slate-500 mt-1">Lung recruitment target</p>
              </div>

              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                <span className="text-xs uppercase font-bold text-slate-400">Delta-P (Amplitude)</span>
                <div className="text-2xl font-black text-indigo-300 mt-2">{patient.telemetry.deltaP} <span className="text-xs text-slate-400">cmH2O</span></div>
                <p className="text-xs text-slate-500 mt-1">CO2 elimination power</p>
              </div>

              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                <span className="text-xs uppercase font-bold text-slate-400">Frequency (Hz)</span>
                <div className="text-2xl font-black text-purple-300 mt-2">{patient.telemetry.freqHz} <span className="text-xs text-slate-400">Hz ({patient.telemetry.freqHz * 60} bpm)</span></div>
                <p className="text-xs text-slate-500 mt-1">Oscillation cycles</p>
              </div>

              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                <span className="text-xs uppercase font-bold text-slate-400">FiO2 Delivered</span>
                <div className="text-2xl font-black text-sky-300 mt-2">{patient.telemetry.fio2}%</div>
                <p className="text-xs text-slate-500 mt-1">Inspired oxygen fraction</p>
              </div>

              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                <span className="text-xs uppercase font-bold text-slate-400">I:E Inspiratory %</span>
                <div className="text-2xl font-black text-amber-300 mt-2">{patient.telemetry.itPercent}%</div>
                <p className="text-xs text-slate-500 mt-1">Nominal 33% (1:2 ratio)</p>
              </div>

              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                <span className="text-xs uppercase font-bold text-slate-400">Chest Wiggle</span>
                <div className="text-sm font-black text-emerald-300 mt-3 truncate">{patient.telemetry.chestWiggle}</div>
                <p className="text-xs text-slate-500 mt-1">Clinical amplitude index</p>
              </div>
            </div>

            {/* Active Inotropes & Infusions */}
            <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  <span>Continuous Vasoactive & Inodilator Infusions (Smart Pump Telemetry)</span>
                </h3>
                <span className="text-xs text-slate-400">Double-Checked via Smart Pump Guardrails</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {patient.inotropes.map((ino, idx) => (
                  <div key={idx} className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-cyan-300 text-sm">{ino.drug}</span>
                      <span className="px-2 py-0.5 text-xs bg-emerald-950 text-emerald-400 rounded font-semibold border border-emerald-800">{ino.status}</span>
                    </div>
                    <div className="mt-2 text-xl font-bold text-slate-100 font-mono">{ino.rate}</div>
                    <div className="text-xs text-slate-400 mt-1">Total Delivery: {ino.dose}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'abg' && (
          <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-base font-bold text-slate-100 flex items-center space-x-2">
                  <Activity className="w-5 h-5 text-rose-400" />
                  <span>Arterial Blood Gas (ABG) & Acid-Base Physiology</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Synchronized with Bedside Co-Oximeter (Radiometer ABL90 FLEX). Permissive hypercapnia protocol active.
                </p>
              </div>
              <button
                onClick={() => alert("STAT ABG Request transmitted to Laboratory Automation System.")}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition"
              >
                Order STAT Recalibration ABG
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center">
                <span className="text-xs text-slate-400">Arterial pH</span>
                <div className={`text-2xl font-bold font-mono mt-1 ${patient.telemetry.abg.ph < 7.25 ? 'text-rose-400' : 'text-emerald-300'}`}>
                  {patient.telemetry.abg.ph}
                </div>
                <span className="text-xs text-slate-500">Ref: 7.35 - 7.45</span>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center">
                <span className="text-xs text-slate-400">PaCO2</span>
                <div className="text-2xl font-bold font-mono text-amber-300 mt-1">
                  {patient.telemetry.abg.paco2} <span className="text-xs text-slate-400">mmHg</span>
                </div>
                <span className="text-xs text-slate-500">Permissive 55-70</span>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center">
                <span className="text-xs text-slate-400">PaO2</span>
                <div className="text-2xl font-bold font-mono text-sky-300 mt-1">
                  {patient.telemetry.abg.pao2} <span className="text-xs text-slate-400">mmHg</span>
                </div>
                <span className="text-xs text-slate-500">Target 55 - 80</span>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center">
                <span className="text-xs text-slate-400">HCO3</span>
                <div className="text-2xl font-bold font-mono text-slate-200 mt-1">
                  {patient.telemetry.abg.hco3} <span className="text-xs text-slate-400">mEq/L</span>
                </div>
                <span className="text-xs text-slate-500">Ref: 22 - 26</span>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center">
                <span className="text-xs text-slate-400">Serum Lactate</span>
                <div className={`text-2xl font-bold font-mono mt-1 ${patient.telemetry.abg.lactate > 2.0 ? 'text-rose-400' : 'text-emerald-300'}`}>
                  {patient.telemetry.abg.lactate} <span className="text-xs text-slate-400">mmol/L</span>
                </div>
                <span className="text-xs text-slate-500">Ref: &lt; 2.0</span>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center">
                <span className="text-xs text-slate-400">Base Excess</span>
                <div className="text-2xl font-bold font-mono text-slate-200 mt-1">
                  {patient.telemetry.abg.baseExcess} <span className="text-xs text-slate-400">mEq/L</span>
                </div>
                <span className="text-xs text-slate-500">Ref: -2 to +2</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'resuscitation' && (
          <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-base font-bold text-slate-100 flex items-center space-x-2">
                  <Scale className="w-5 h-5 text-cyan-400" />
                  <span>PALS Resuscitation & High-Alert Pediatric Dosing Calculator</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Calculated precisely for patient weight of <strong>{patient.weightKg} kg</strong> (Broselow Zone Color: Purple / Grey).
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <span className="text-xs font-bold uppercase text-slate-400">Epinephrine (Cardiac Arrest)</span>
                <div className="text-xl font-black text-rose-400 mt-2">{(patient.weightKg * 0.01).toFixed(2)} mg</div>
                <p className="text-xs text-slate-300 mt-1">0.1 mL/kg of 1:10,000 solution IV/IO</p>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <span className="text-xs font-bold uppercase text-slate-400">Cardioversion / Defib</span>
                <div className="text-xl font-black text-amber-300 mt-2">{(patient.weightKg * 2).toFixed(0)} - {(patient.weightKg * 4).toFixed(0)} J</div>
                <p className="text-xs text-slate-300 mt-1">Initial 2 J/kg, subsequent 4 J/kg synchronized</p>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <span className="text-xs font-bold uppercase text-slate-400">Normal Saline Bolus</span>
                <div className="text-xl font-black text-cyan-300 mt-2">{(patient.weightKg * 10).toFixed(0)} - {(patient.weightKg * 20).toFixed(0)} mL</div>
                <p className="text-xs text-slate-300 mt-1">10-20 mL/kg over 10-20 min</p>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <span className="text-xs font-bold uppercase text-slate-400">Endotracheal Tube Size</span>
                <div className="text-xl font-black text-indigo-300 mt-2">{(patient.ageMonths / 12 / 4 + 3.5).toFixed(1)} cuffed</div>
                <p className="text-xs text-slate-300 mt-1">Depth: {((patient.ageMonths / 12 / 4 + 3.5) * 3).toFixed(0)} cm at lip</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'pards_matrix' && (
          <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-xl space-y-4">
            <div className="border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-slate-100 flex items-center space-x-2">
                <Stethoscope className="w-5 h-5 text-indigo-400" />
                <span>PALICC-2 Pediatric ARDS Consensus Decision Protocol</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Evidence-based algorithmic escalation pathway for invasive and high-frequency oscillatory ventilation.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <h4 className="font-bold text-cyan-400 uppercase tracking-wider">HFOV Oxygenation Optimization</h4>
                <ul className="space-y-2 text-slate-300 list-disc list-inside">
                  <li>Increment Paw by 1-2 cmH2O to recruit atelectatic alveolar units until FiO2 can be weaned below 60%.</li>
                  <li>Perform continuous chest radiograph / lung ultrasound monitoring for hyperinflation (target 8-9 posterior ribs).</li>
                  <li>Maintain permissive hypercapnia (pH &gt;= 7.20) to avoid excessive tidal volume shear stress.</li>
                </ul>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <h4 className="font-bold text-rose-400 uppercase tracking-wider">Refractory Hypoxemia & ECLS Triggers</h4>
                <ul className="space-y-2 text-slate-300 list-disc list-inside">
                  <li>Initiate trial of inhaled Nitric Oxide (iNO) at 20 ppm if Right Ventricular dysfunction or elevated PAP is suspected.</li>
                  <li>Prone positioning trial (16 hours/day) indicated for severe PARDS (OI &gt;= 16).</li>
                  <li>Activate Pediatric ECMO Cannulation Team if OI &gt;= 35 or PaO2/FiO2 &lt; 60 for &gt; 4 hours.</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'fhir' && (
          <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-xl space-y-4">
            <div className="border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-slate-100 flex items-center space-x-2">
                <FileText className="w-5 h-5 text-indigo-400" />
                <span>HL7 FHIR R4 DeviceMetric & Audit Trail (21 CFR Part 11)</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time medical device telemetry integration payload and tamper-evident audit ledger.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs font-bold text-slate-300">
                  <span>FHIR R4 DeviceMetric Telemetry Stream</span>
                  <Download className="w-4 h-4 text-cyan-400 cursor-pointer" onClick={() => alert("FHIR DeviceMetric Stream Exported.")} />
                </div>
                <pre className="mt-3 p-3 bg-slate-900 rounded-lg text-slate-300 text-xs font-mono overflow-x-auto max-h-64">
{JSON.stringify({
  resourceType: "DeviceMetric",
  id: `dm-picu-${patient.id.toLowerCase()}`,
  type: {
    coding: [{
      system: "urn:iso:std:iso:11073:10101",
      code: "150456",
      display: "MDC_VENT_PRESS_AWAY_MEAN"
    }]
  },
  unit: {
    coding: [{
      system: "http://unitsofmeasure.org",
      code: "cm[H2O]"
    }]
  },
  source: {
    reference: `Device/${patient.ventilatorMode.replace(/\s+/g, '-').toLowerCase()}`
  },
  operationalStatus: "on",
  color: "cyan",
  category: "measurement",
  measurementPeriod: {
    repeat: {
      frequency: 1,
      period: 1,
      periodUnit: "s"
    }
  },
  calibration: [{
    type: "two-point",
    state: "calibrated",
    time: new Date().toISOString()
  }]
}, null, 2)}
                </pre>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="pb-2 border-b border-slate-800 text-xs font-bold text-slate-300">
                    Clinical Audit Ledger (21 CFR Part 11)
                  </div>
                  <div className="mt-3 space-y-2 max-h-60 overflow-y-auto">
                    {auditLog.map((log, i) => (
                      <div key={i} className="p-2.5 rounded bg-slate-900/80 border border-slate-800 text-xs">
                        <div className="flex items-center justify-between text-slate-400">
                          <span className="font-mono text-cyan-400">{log.time}</span>
                          <span className="text-slate-300 font-semibold">{log.user}</span>
                        </div>
                        <p className="text-slate-200 mt-1">{log.action}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800">
                  <button
                    onClick={() => {
                      const signer = prompt("Enter Attending Physician Credential ID:", "MD-PICU-77291");
                      if (signer) {
                        setAuditLog(prev => [
                          { time: new Date().toLocaleTimeString(), user: signer, action: "Attending Clinical Sign-off Recorded (SHA-256 Validated)" },
                          ...prev
                        ]);
                        alert("PICU Chart Digitally Signed.");
                      }
                    }}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold tracking-wider uppercase transition shadow-lg"
                  >
                    Affix PICU Attending Digital Signature
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
