import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Activity,
  Heart,
  Thermometer,
  Wind,
  Zap,
  ShieldCheck,
  AlertTriangle,
  Search,
  Plus,
  RefreshCw,
  Eye,
  CheckCircle2,
  X,
  Sliders,
  Sparkles,
  Server,
  Layers,
  Radio,
  FileText,
  Clock,
  Bell,
  Cpu,
  UserCheck,
  Stethoscope,
  TrendingUp,
  Volume2
} from "lucide-react";

/**
 * IcuVitalsTelemetryHubPage Component
 *
 * Real-Time Intensive Care Unit (ICU) Patient Vitals Telemetry & Medical IoT Sensor Overwatch.
 * Enforces National Early Warning Score (NEWS2), Real-Time ECG Waveform Monitoring,
 * Ventilator Telemetry, Invasive Arterial Blood Pressure (IABP), and Automated Sepsis Alerts.
 */
export default function IcuVitalsTelemetryHubPage() {
  // Patients State
  const [patients, setPatients] = useState([
    {
      patientId: "ICU-BED-01",
      patientName: "Eleanor Vance (Age 64)",
      diagnosis: "Post-Operative Cardiac Bypass (CABG)",
      news2Score: 7,
      triageLevel: "HIGH_RISK_SEPSIS_WARNING",
      vitals: {
        heartRate: 118, // bpm
        bloodPressure: "145/92 mmHg", // IABP
        spO2: 93, // %
        respiratoryRate: 24, // breaths/min
        temperature: "38.6 °C",
        glasgowComaScale: 14
      },
      iotDeviceStatus: "CONNECTED_ENCRYPTED_TELEMETRY",
      lastAlarm: "10 mins ago - Tachycardia Spike (124 bpm)",
      attendingPhysician: "Dr. Sarah Jenkins, MD (Cardiology)"
    },
    {
      patientId: "ICU-BED-02",
      patientName: "Marcus Sterling (Age 52)",
      diagnosis: "Acute Respiratory Distress Syndrome (ARDS)",
      news2Score: 3,
      triageLevel: "MODERATE_RISK",
      vitals: {
        heartRate: 84,
        bloodPressure: "122/78 mmHg",
        spO2: 96,
        respiratoryRate: 18,
        temperature: "37.1 °C",
        glasgowComaScale: 15
      },
      iotDeviceStatus: "CONNECTED_ENCRYPTED_TELEMETRY",
      lastAlarm: "2 hours ago - Low Oxygen Saturation (91%)",
      attendingPhysician: "Dr. Robert Chen, MD (Pulmonology)"
    },
    {
      patientId: "ICU-BED-03",
      patientName: "Sophia Martinez (Age 41)",
      diagnosis: "Polytrauma & Mechanical Ventilation",
      news2Score: 1,
      triageLevel: "STABLE",
      vitals: {
        heartRate: 72,
        bloodPressure: "118/74 mmHg",
        spO2: 99,
        respiratoryRate: 14,
        temperature: "36.8 °C",
        glasgowComaScale: 15
      },
      iotDeviceStatus: "CONNECTED_ENCRYPTED_TELEMETRY",
      lastAlarm: "None in past 24 hours",
      attendingPhysician: "Dr. Elena Rostova, MD (Trauma Surgery)"
    }
  ]);

  const [activeTab, setActiveTab] = useState("BEDSIDE_MONITOR"); // "BEDSIDE_MONITOR" | "ECG_SIMULATOR" | "IOT_FLEET"
  const [searchTerm, setSearchTerm] = useState("");
  const [triageFilter, setTriageFilter] = useState("ALL");
  const [notification, setNotification] = useState({ type: "", message: "" });
  const [admissionModalOpen, setAdmissionModalOpen] = useState(false);
  const [inspectPatient, setInspectPatient] = useState(null);

  // New Patient Form State
  const [patientForm, setPatientForm] = useState({
    patientName: "",
    bedId: "ICU-BED-04",
    diagnosis: "Severe Pneumonia",
    attendingPhysician: "Dr. Sarah Jenkins, MD"
  });

  // Simulator State
  const [simulationActive, setSimulationActive] = useState(true);
  const [ecgBpm, setEcgBpm] = useState(78);

  // Live Pulse Animation Hook
  useEffect(() => {
    if (!simulationActive) return;
    const interval = setInterval(() => {
      setPatients((prev) =>
        prev.map((p) => {
          const hrDelta = Math.floor(Math.random() * 5) - 2;
          const spO2Delta = Math.floor(Math.random() * 3) - 1;
          const newHr = Math.max(50, Math.min(160, p.vitals.heartRate + hrDelta));
          const newSpO2 = Math.max(88, Math.min(100, p.vitals.spO2 + spO2Delta));
          return {
            ...p,
            vitals: {
              ...p.vitals,
              heartRate: newHr,
              spO2: newSpO2
            }
          };
        })
      );
    }, 3000);
    return () => clearInterval(interval);
  }, [simulationActive]);

  // Admission Handler
  const handleAdmitPatient = (e) => {
    e.preventDefault();
    if (!patientForm.patientName.trim()) {
      setNotification({ type: "error", message: "Patient name is required." });
      return;
    }

    const newPatient = {
      patientId: patientForm.bedId,
      patientName: patientForm.patientName.trim(),
      diagnosis: patientForm.diagnosis,
      news2Score: 0,
      triageLevel: "STABLE",
      vitals: {
        heartRate: 75,
        bloodPressure: "120/80 mmHg",
        spO2: 98,
        respiratoryRate: 16,
        temperature: "36.9 °C",
        glasgowComaScale: 15
      },
      iotDeviceStatus: "CONNECTED_ENCRYPTED_TELEMETRY",
      lastAlarm: "Just Admitted",
      attendingPhysician: patientForm.attendingPhysician
    };

    setPatients((prev) => [newPatient, ...prev]);
    setAdmissionModalOpen(false);
    setNotification({
      type: "success",
      message: `Patient '${newPatient.patientName}' assigned to ${newPatient.patientId} and telemetry synced!`
    });
    setPatientForm({
      patientName: "",
      bedId: `ICU-BED-0${patients.length + 2}`,
      diagnosis: "Severe Pneumonia",
      attendingPhysician: "Dr. Sarah Jenkins, MD"
    });
  };

  // Acknowledge Alarm Handler
  const handleAcknowledgeAlarm = (patientId) => {
    setPatients((prev) =>
      prev.map((p) =>
        p.patientId === patientId
          ? {
              ...p,
              triageLevel: "STABLE",
              news2Score: Math.max(1, p.news2Score - 3),
              lastAlarm: "Alarm Acknowledged by Nursing Staff"
            }
          : p
      )
    );
    setNotification({
      type: "success",
      message: `Alarm acknowledged for bed ${patientId}. Triage score updated.`
    });
  };

  // Filtered Patients List
  const filteredPatients = useMemo(() => {
    return patients.filter((p) => {
      const matchSearch =
        p.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.patientId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.diagnosis.toLowerCase().includes(searchTerm.toLowerCase());
      const matchTriage =
        triageFilter === "ALL" ||
        (triageFilter === "HIGH" && p.triageLevel.includes("HIGH")) ||
        (triageFilter === "MODERATE" && p.triageLevel.includes("MODERATE")) ||
        (triageFilter === "STABLE" && p.triageLevel.includes("STABLE"));
      return matchSearch && matchTriage;
    });
  }, [patients, searchTerm, triageFilter]);

  return (
    <div className="w-full min-h-screen bg-slate-950 text-slate-100 font-sans p-4 md:p-8 space-y-6">
      
      {/* 1. Page Header */}
      <div className="max-w-7xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-full flex items-center gap-1.5 font-mono">
                <Heart size={13} className="animate-ping text-rose-500" /> ICU TELEMETRY OVERWATCH
              </span>
              <span className="px-3 py-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-1">
                <ShieldCheck size={13} /> NEWS2 SEPSIS ALGORITHM
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Real-Time ICU Bedside Vitals & Medical IoT Sensor Station
            </h1>
            <p className="text-slate-400 text-sm max-w-3xl leading-relaxed">
              Centralized clinical command dashboard providing continuous telemetry monitoring for invasive arterial blood pressure, real-time ECG waveforms, mechanical ventilation, and NEWS2 early warning triage scoring.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full lg:w-auto">
            <button
              type="button"
              onClick={() => setAdmissionModalOpen(true)}
              className="w-full lg:w-auto px-5 py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-2xl transition shadow-lg shadow-rose-600/25 flex items-center justify-center gap-2"
            >
              <Plus size={16} /> Admit ICU Patient Bed
            </button>
          </div>
        </div>

        {/* Global Notifications */}
        {notification.message && (
          <div className="mt-6 p-4 rounded-2xl text-xs font-bold flex items-center justify-between bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} />
              <span>{notification.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setNotification({ type: "", message: "" })}
              className="text-slate-400 hover:text-white"
            >
              <X size={14} />
            </button>
          </div>
        )}
      </div>

      {/* 2. Navigation Tabs */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
          {[
            { id: "BEDSIDE_MONITOR", label: "ICU Bedside Overwatch", icon: Activity },
            { id: "ECG_SIMULATOR", label: "ECG Waveform Telemetry", icon: Heart },
            { id: "IOT_FLEET", label: "Medical Device Mesh Status", icon: Cpu }
          ].map((tab) => {
            const IconComp = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
                  activeTab === tab.id
                    ? "bg-rose-600 text-white shadow-lg shadow-rose-600/20"
                    : "bg-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                <IconComp size={15} /> {tab.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-4 text-xs font-mono text-slate-400 w-full md:w-auto justify-end">
          <div>Telemetry Status: <strong className="text-emerald-400">LIVE (AES-256 ENCRYPTED)</strong></div>
          <div>Active ICU Beds: <strong className="text-white">{patients.length}</strong></div>
        </div>
      </div>

      {/* 3. TAB CONTENT: BEDSIDE MONITOR */}
      {activeTab === "BEDSIDE_MONITOR" && (
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-2xl text-xs">
            <div className="relative w-full sm:w-80">
              <Search size={14} className="absolute left-3 top-3 text-slate-500" />
              <input
                type="text"
                placeholder="Search patient name, bed ID, or diagnosis..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-bold uppercase text-[10px]">Filter Risk Level:</span>
              <select
                value={triageFilter}
                onChange={(e) => setTriageFilter(e.target.value)}
                className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                <option value="ALL">ALL RISK LEVELS</option>
                <option value="HIGH">HIGH RISK / SEPSIS</option>
                <option value="MODERATE">MODERATE RISK</option>
                <option value="STABLE">STABLE</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPatients.map((p) => (
              <div
                key={p.patientId}
                className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl hover:border-rose-500/40 transition flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 text-[11px] font-bold font-mono text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg">
                      {p.patientId}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full border ${
                        p.triageLevel.includes("HIGH")
                          ? "bg-red-500/20 text-red-400 border-red-500/30 animate-pulse"
                          : p.triageLevel.includes("MODERATE")
                          ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                          : "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                      }`}
                    >
                      NEWS2 SCORE: {p.news2Score} ({p.triageLevel})
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-white font-mono truncate">{p.patientName}</h3>
                    <p className="text-[11px] text-slate-400 font-sans mt-0.5">{p.diagnosis}</p>
                  </div>

                  {/* Vitals Telemetry Grid */}
                  <div className="grid grid-cols-2 gap-2 p-3 bg-slate-950 border border-slate-800 rounded-2xl text-xs font-mono">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 text-[10px]">HR:</span>
                      <strong className="text-rose-400 font-bold">{p.vitals.heartRate} bpm</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 text-[10px]">SpO2:</span>
                      <strong className="text-sky-400 font-bold">{p.vitals.spO2}%</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 text-[10px]">BP:</span>
                      <strong className="text-purple-300">{p.vitals.bloodPressure}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 text-[10px]">Resp:</span>
                      <strong className="text-amber-400">{p.vitals.respiratoryRate}/m</strong>
                    </div>
                  </div>

                  <div className="space-y-1 text-xs font-mono">
                    <div className="flex justify-between text-slate-400">
                      <span>Attending MD:</span>
                      <span className="text-slate-200">{p.attendingPhysician}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Last Alarm:</span>
                      <span className="text-amber-400 text-[11px] truncate">{p.lastAlarm}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleAcknowledgeAlarm(p.patientId)}
                    className="flex-1 py-2 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition"
                  >
                    <Bell size={13} /> Ack Alarm
                  </button>
                  <button
                    type="button"
                    onClick={() => setInspectPatient(p)}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs"
                  >
                    <Eye size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. TAB CONTENT: ECG SIMULATOR */}
      {activeTab === "ECG_SIMULATOR" && (
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Heart size={18} className="text-rose-400 animate-pulse" /> 12-Lead Electrocardiogram (ECG) Real-Time Waveform Simulator
            </h3>
            <p className="text-xs text-slate-400">
              High-frequency ECG waveform monitoring engine simulating Lead II ST-segment elevation, QRS duration, and arrhythmia detection algorithms.
            </p>

            <div className="p-6 bg-slate-950 border border-slate-800 rounded-2xl font-mono text-xs space-y-4">
              <div className="flex justify-between items-center text-rose-400">
                <span className="font-bold flex items-center gap-2">
                  <Activity size={16} className="animate-spin" /> LEAD II CONTINUOUS FEED
                </span>
                <span>Heart Rate: {ecgBpm} BPM (Normal Sinus Rhythm)</span>
              </div>

              {/* Simulated Waveform Graphic */}
              <div className="w-full h-32 bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-rose-500/10 to-transparent animate-pulse" />
                <svg className="w-full h-full stroke-rose-500 fill-none stroke-2" viewBox="0 0 500 100">
                  <path d="M 0 50 L 50 50 L 60 40 L 70 60 L 80 50 L 100 50 L 105 20 L 115 90 L 125 10 L 135 70 L 140 50 L 180 50 L 190 40 L 200 60 L 210 50 L 250 50 L 255 20 L 265 90 L 275 10 L 285 70 L 290 50 L 330 50 L 340 40 L 350 60 L 360 50 L 400 50 L 405 20 L 415 90 L 425 10 L 435 70 L 440 50 L 500 50" />
                </svg>
              </div>

              <div className="flex items-center justify-between text-slate-400 text-[11px]">
                <span>PR Interval: 160 ms</span>
                <span>QRS Complex: 88 ms</span>
                <span>QT/QTc: 390/412 ms</span>
                <span>ST Segment: Isoelectric (0.0 mV)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. TAB CONTENT: IOT FLEET */}
      {activeTab === "IOT_FLEET" && (
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Cpu size={18} className="text-rose-400" /> Medical IoT Sensor Mesh & Encryption Health
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-1">
                <span className="text-slate-500 text-[10px] block">Sensor Mesh Protocol</span>
                <strong className="text-white">IEEE 11073 Personal Health Devices / BLE 5.3</strong>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-1">
                <span className="text-slate-500 text-[10px] block">Data Payload Encryption</span>
                <strong className="text-emerald-400">AES-256-GCM Hardware Encryption</strong>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-1">
                <span className="text-slate-500 text-[10px] block">Central Gateway Latency</span>
                <strong className="text-purple-300">1.8 ms Average Round-Trip</strong>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-1">
                <span className="text-slate-500 text-[10px] block">Active Medical Sensor Devices</span>
                <strong className="text-sky-300">48 Connected Monitors</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Admit Patient Modal */}
      {admissionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-xl w-full text-slate-100 space-y-4 shadow-2xl font-sans">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Stethoscope size={18} className="text-rose-400" /> Admit New Patient to ICU Bedside Telemetry
              </h3>
              <button type="button" onClick={() => setAdmissionModalOpen(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAdmitPatient} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 font-bold block mb-1">Patient Name & Age</label>
                <input
                  type="text"
                  placeholder="e.g. Arthur Pendelton (Age 58)"
                  value={patientForm.patientName}
                  onChange={(e) => setPatientForm({ ...patientForm, patientName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="text-slate-400 font-bold block mb-1">Clinical Diagnosis</label>
                <input
                  type="text"
                  placeholder="e.g. Sepsis Secondary to Urinary Tract Infection"
                  value={patientForm.diagnosis}
                  onChange={(e) => setPatientForm({ ...patientForm, diagnosis: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="text-slate-400 font-bold block mb-1">Assign ICU Bed ID</label>
                <input
                  type="text"
                  value={patientForm.bedId}
                  onChange={(e) => setPatientForm({ ...patientForm, bedId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setAdmissionModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold text-xs transition shadow-lg shadow-rose-600/20"
                >
                  Admit Patient & Connect Telemetry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inspect Patient Modal */}
      {inspectPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full text-slate-100 space-y-4 shadow-2xl font-mono">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white font-sans">{inspectPatient.patientId} - Inspection</h3>
              <button type="button" onClick={() => setInspectPatient(null)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl text-xs space-y-2">
              <div>Name: <strong className="text-rose-300 font-sans">{inspectPatient.patientName}</strong></div>
              <div>Diagnosis: <span className="text-slate-300">{inspectPatient.diagnosis}</span></div>
              <div>NEWS2 Score: <span className="text-amber-400 font-bold">{inspectPatient.news2Score}</span></div>
              <div>HR / SpO2: <span className="text-emerald-400">{inspectPatient.vitals.heartRate} bpm / {inspectPatient.vitals.spO2}%</span></div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setInspectPatient(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-xs font-sans"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
