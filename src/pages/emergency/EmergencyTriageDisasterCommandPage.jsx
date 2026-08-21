import React, { useState, useEffect, useMemo } from 'react';
import {
  Siren,
  ShieldAlert,
  Ambulance,
  Cross,
  Radio,
  Flame,
  Activity,
  HeartPulse,
  Syringe,
  Stethoscope,
  Users,
  Search,
  Filter,
  RefreshCw,
  PlusCircle,
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  Compass,
  Zap,
  TrendingUp,
  BarChart3,
  Layers,
  Thermometer,
  ShieldCheck,
  Building2,
  Bed,
  FileSpreadsheet,
  Download,
  Share2,
  Sliders,
  ChevronRight,
  ExternalLink,
  Eye,
  RadioTower,
  Cpu,
  Database
} from 'lucide-react';

// ============================================================================
// EMERGENCY TRIAGE & DISASTER MASS CASUALTY COMMAND HUB
// Enterprise Emergency Medicine & Incident Command System (ICS) Subsystem
// Standards: START / JumpSTART Triage, NIMS ICS-204, CBRN Hazmat, MTP 1:1:1, GCS
// ============================================================================

export default function EmergencyTriageDisasterCommandPage() {
  // --------------------------------------------------------------------------
  // STATE MANAGEMENT
  // --------------------------------------------------------------------------
  const [activeTab, setActiveTab] = useState('triage-wall');
  const [triageFilter, setTriageFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [notification, setNotification] = useState(null);
  const [mtpActive, setMtpActive] = useState(false);
  const [mtpUnits, setMtpUnits] = useState({ prbc: 6, ffp: 6, plt: 1, cryo: 1 });
  const [selectedIncident, setSelectedIncident] = useState('INC-2026-MCI-09');

  // --------------------------------------------------------------------------
  // INCIDENT COMMAND SYSTEM (ICS) EVENT METADATA
  // --------------------------------------------------------------------------
  const incidents = [
    {
      id: 'INC-2026-MCI-09',
      title: 'Interstate Highway 95 Multi-Vehicle Collision & Chemical Spill',
      type: 'Hazmat & Multi-Vehicle Collision',
      hazardLevel: 'CBRN Level B (Volatile Organic Solvents)',
      incidentCommander: 'Chief Marcus Vance, EMT-P',
      totalCasualties: 38,
      triageRed: 9,
      triageYellow: 14,
      triageGreen: 12,
      triageBlack: 3,
      deconStatus: 'ACTIVE - Corridor 2 Operating',
      startTime: '2026-08-18 13:42:00'
    },
    {
      id: 'INC-2026-MCI-10',
      title: 'Metro Industrial Complex Structural Fire & Explosion',
      type: 'Industrial Explosion & Thermal Burns',
      hazardLevel: 'CBRN Level C (Smoke Inhalation & Ammonia)',
      incidentCommander: 'Capt. Elena Rostova, MD',
      totalCasualties: 22,
      triageRed: 6,
      triageYellow: 8,
      triageGreen: 7,
      triageBlack: 1,
      deconStatus: 'STANDBY',
      startTime: '2026-08-18 14:10:00'
    }
  ];

  const currentIncident = incidents.find((i) => i.id === selectedIncident) || incidents[0];

  // --------------------------------------------------------------------------
  // START TRIAGE PATIENT DATASET (MASS CASUALTY CASUALTY ROSTER)
  // --------------------------------------------------------------------------
  const initialPatients = [
    {
      id: 'MCI-001',
      alias: 'Unidentified Male Alpha-101',
      age: 34,
      gender: 'Male',
      triageTag: 'RED',
      triageCategory: 'IMMEDIATE',
      rpmStatus: 'R: 34 bpm | P: Weak Radial Pulse | M: Unresponsive to Commands',
      gcs: 7,
      vitals: { hr: 138, sbp: 82, dbp: 48, spo2: 86, rr: 34, temp: 35.8 },
      injuries: ['Flail Chest Right', 'Tension Pneumothorax', 'Open Femur Fracture'],
      shockIndex: 1.68,
      traumaBayAssigned: 'Trauma Bay 1 (MTP Active)',
      deconCompleted: true,
      etaMinutes: 0
    },
    {
      id: 'MCI-002',
      alias: 'Unidentified Female Beta-102',
      age: 28,
      gender: 'Female',
      triageTag: 'RED',
      triageCategory: 'IMMEDIATE',
      rpmStatus: 'R: 28 bpm | P: Cap Refill 4s | M: Follows Simple Commands',
      gcs: 11,
      vitals: { hr: 124, sbp: 88, dbp: 54, spo2: 91, rr: 28, temp: 36.2 },
      injuries: ['Traumatic Abdominal Laceration', 'Hypovolemic Shock', 'Pelvic Instability'],
      shockIndex: 1.41,
      traumaBayAssigned: 'Trauma Bay 2',
      deconCompleted: true,
      etaMinutes: 0
    },
    {
      id: 'MCI-003',
      alias: 'Jonathan Miller',
      age: 52,
      gender: 'Male',
      triageTag: 'YELLOW',
      triageCategory: 'URGENT (DELAYED)',
      rpmStatus: 'R: 22 bpm | P: Strong Radial Pulse | M: Fully Alert & Oriented',
      gcs: 15,
      vitals: { hr: 98, sbp: 128, dbp: 82, spo2: 97, rr: 22, temp: 36.8 },
      injuries: ['Closed Humerus Fracture', 'Moderate Lacerations', 'C-Spine Precautions'],
      shockIndex: 0.77,
      traumaBayAssigned: 'Urgent Care Area B',
      deconCompleted: true,
      etaMinutes: 5
    },
    {
      id: 'MCI-004',
      alias: 'Sarah Chen',
      age: 41,
      gender: 'Female',
      triageTag: 'GREEN',
      triageCategory: 'MINOR (WALKING WOUNDED)',
      rpmStatus: 'R: 18 bpm | P: Normal | M: Ambulatory',
      gcs: 15,
      vitals: { hr: 84, sbp: 122, dbp: 78, spo2: 99, rr: 18, temp: 37.0 },
      injuries: ['Superficial Abrasions', 'Soft Tissue Contusions'],
      shockIndex: 0.68,
      traumaBayAssigned: 'Minor Care Sector C',
      deconCompleted: false,
      etaMinutes: 12
    },
    {
      id: 'MCI-005',
      alias: 'Unidentified Male Gamma-105',
      age: 60,
      gender: 'Male',
      triageTag: 'BLACK',
      triageCategory: 'EXPECTANT / DECEASED',
      rpmStatus: 'R: Apneic (No spontaneous breaths after airway opening)',
      gcs: 3,
      vitals: { hr: 0, sbp: 0, dbp: 0, spo2: 0, rr: 0, temp: 34.5 },
      injuries: ['Massive Craniocerebral Trauma', 'Asystole'],
      shockIndex: 0.0,
      traumaBayAssigned: 'Morgue Sector D',
      deconCompleted: false,
      etaMinutes: 0
    },
    {
      id: 'MCI-006',
      alias: 'Unidentified Child Delta-106 (JumpSTART)',
      age: 7,
      gender: 'Male',
      triageTag: 'RED',
      triageCategory: 'PEDIATRIC IMMEDIATE',
      rpmStatus: 'R: 45 bpm (Tachypneic) | P: Weak Pulse | M: Inappropriate Words',
      gcs: 9,
      vitals: { hr: 162, sbp: 74, dbp: 42, spo2: 88, rr: 45, temp: 35.6 },
      injuries: ['Pediatric Inhalation Injury', 'Second Degree Chemical Burns 18% BSA'],
      shockIndex: 2.18,
      traumaBayAssigned: 'Pediatric Resuscitation Bay 1',
      deconCompleted: true,
      etaMinutes: 2
    }
  ];

  const [patients, setPatients] = useState(initialPatients);

  // --------------------------------------------------------------------------
  // EMS FLEET & HELICOPTER MEDEVAC TELEMETRY
  // --------------------------------------------------------------------------
  const emsFleet = [
    {
      id: 'MEDEVAC-1',
      type: 'Air Ambulance Helicopter (EC145)',
      callsign: 'LIFEFLIGHT 8',
      status: 'IN-FLIGHT EN ROUTE',
      etaMinutes: 4,
      patientAssigned: 'MCI-001 (Trauma Red)',
      flightVector: 'Heading 180° @ 120 knots',
      crew: 'Flight Medic / Flight Nurse'
    },
    {
      id: 'AMB-104',
      type: 'Advanced Life Support (ALS) Ground Unit',
      callsign: 'METRO EMS 104',
      status: 'ON-SCENE DECON',
      etaMinutes: 8,
      patientAssigned: 'MCI-002 & MCI-006',
      flightVector: 'I-95 Southbound Corridor',
      crew: 'Paramedic / EMT'
    },
    {
      id: 'AMB-208',
      type: 'Basic Life Support (BLS) Transport',
      callsign: 'COUNTY RESCUE 208',
      status: 'TRANSITING TO HOSPITAL',
      etaMinutes: 12,
      patientAssigned: 'MCI-003 & MCI-004',
      flightVector: 'Route 4 Bypass',
      crew: 'EMT / EMT'
    }
  ];

  // --------------------------------------------------------------------------
  // TRAUMA BAY & HOSPITAL SURGE CAPACITY METRICS
  // --------------------------------------------------------------------------
  const capacityMetrics = [
    { label: 'Level 1 Trauma Bays', occupied: 4, total: 6, status: 'SURGE WARNING' },
    { label: 'ICU Critical Care Beds', occupied: 18, total: 20, status: '90% CAP' },
    { label: 'Operating Rooms (OR)', occupied: 5, total: 8, status: '3 AVAILABLE' },
    { label: 'Mechanical Ventilators', occupied: 22, total: 30, status: '8 AVAILABLE' },
    { label: 'Decon Shower Corridors', occupied: 2, total: 4, status: 'ACTIVE' }
  ];

  // --------------------------------------------------------------------------
  // FILTERED PATIENT LIST COMPUTED MEMO
  // --------------------------------------------------------------------------
  const filteredPatients = useMemo(() => {
    return patients.filter((p) => {
      const matchesSearch =
        p.alias.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.injuries.some((inj) => inj.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesTag = triageFilter === 'ALL' || p.triageTag === triageFilter;
      return matchesSearch && matchesTag;
    });
  }, [patients, searchQuery, triageFilter]);

  // --------------------------------------------------------------------------
  // HANDLERS & ACTIONS
  // --------------------------------------------------------------------------
  const handleRefreshFeed = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      triggerNotification('Emergency Disaster Telemetry & Incident Command Stream Updated.');
    }, 800);
  };

  const triggerNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const handleToggleMtp = () => {
    setMtpActive(!mtpActive);
    triggerNotification(!mtpActive ? 'MASSIVE TRANSFUSION PROTOCOL (MTP 1:1:1) ACTIVATED!' : 'MTP Protocol Standby.');
  };

  const handleRetriage = (patientId, newTag) => {
    setPatients((prev) =>
      prev.map((p) => (p.id === patientId ? { ...p, triageTag: newTag } : p))
    );
    triggerNotification(`Patient ${patientId} re-triaged to ${newTag}.`);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 md:p-8 space-y-6">
      {/* -------------------------------------------------------------------- */}
      {/* INCIDENT COMMAND HEADER BAR                                          */}
      {/* -------------------------------------------------------------------- */}
      <header className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center space-x-4">
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400">
              <Siren className="w-9 h-9 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
                  Emergency Triage & Disaster Mass Casualty Command Hub
                </h1>
                <span className="px-3 py-1 bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-mono rounded-full font-semibold">
                  MCI DISASTER CODE RED
                </span>
              </div>
              <p className="text-slate-400 text-sm mt-1">
                NIMS Incident Command System (ICS), START / JumpSTART Triage & Massive Transfusion Overwatch
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleToggleMtp}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 shadow-lg ${
                mtpActive
                  ? 'bg-rose-600 text-white animate-pulse border border-rose-400 shadow-rose-900/50'
                  : 'bg-slate-800 text-rose-300 border border-slate-700 hover:bg-slate-700'
              }`}
            >
              <Syringe className="w-4 h-4" />
              <span>{mtpActive ? 'MTP ACTIVE (1:1:1 PRBC/FFP)' : 'Activate MTP Protocol'}</span>
            </button>

            <button
              onClick={handleRefreshFeed}
              disabled={isRefreshing}
              className="flex items-center space-x-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl font-medium text-sm text-slate-200"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-rose-400' : ''}`} />
              <span>{isRefreshing ? 'Updating...' : 'Sync Disaster Stream'}</span>
            </button>
          </div>
        </div>

        {/* Active Incident Selection & Casualty Counts */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 pt-4 border-t border-slate-800">
          <div className="space-y-1 lg:col-span-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Active Mass Casualty Incident (MCI)
            </label>
            <select
              value={selectedIncident}
              onChange={(e) => setSelectedIncident(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm font-semibold text-rose-300 focus:outline-none focus:border-rose-500"
            >
              {incidents.map((inc) => (
                <option key={inc.id} value={inc.id}>
                  {inc.id}: {inc.title.substring(0, 36)}...
                </option>
              ))}
            </select>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 flex flex-col justify-between">
            <span className="text-xs font-medium text-slate-400">Total MCI Casualties</span>
            <span className="text-xl font-black text-white font-mono">{currentIncident.totalCasualties}</span>
            <span className="text-[11px] font-mono text-slate-400">Hazmat: {currentIncident.hazardLevel}</span>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 flex flex-col justify-between">
            <span className="text-xs font-medium text-slate-400">Triage Distribution</span>
            <div className="flex items-center space-x-2 text-xs font-mono font-bold">
              <span className="text-rose-400">R: {currentIncident.triageRed}</span>
              <span className="text-amber-400">Y: {currentIncident.triageYellow}</span>
              <span className="text-emerald-400">G: {currentIncident.triageGreen}</span>
              <span className="text-slate-500">B: {currentIncident.triageBlack}</span>
            </div>
            <span className="text-[11px] text-teal-300 font-mono">Decon: {currentIncident.deconStatus}</span>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 flex flex-col justify-between">
            <span className="text-xs font-medium text-slate-400">Incident Commander</span>
            <span className="text-xs font-bold text-slate-200">{currentIncident.incidentCommander}</span>
            <span className="text-[11px] font-mono text-slate-500">Started: {currentIncident.startTime}</span>
          </div>
        </div>
      </header>

      {/* -------------------------------------------------------------------- */}
      {/* TOAST NOTIFICATION BANNER                                            */}
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
          { id: 'triage-wall', label: 'START Triage Patient Wall', icon: Users },
          { id: 'medevac-radar', label: 'EMS & Medevac Air Radar', icon: Ambulance },
          { id: 'surge-capacity', label: 'Surge Beds & Trauma Bays', icon: Bed },
          { id: 'mtp-transfusion', label: 'Massive Transfusion (MTP)', icon: Syringe },
          { id: 'cbrn-hazmat', label: 'CBRN Decontamination Zone', icon: Flame }
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
      {/* TAB 1: START TRIAGE PATIENT WALL                                      */}
      {/* -------------------------------------------------------------------- */}
      {activeTab === 'triage-wall' && (
        <div className="space-y-6">
          {/* Filters & Search */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:w-96">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
              <input
                type="text"
                placeholder="Search by patient alias, ID, or trauma injury..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-slate-400 uppercase">Triage Category:</span>
              {['ALL', 'RED', 'YELLOW', 'GREEN', 'BLACK'].map((tag) => (
                <button
                  key={tag}
                  onClick={() => setTriageFilter(tag)}
                  className={`px-3 py-1 text-xs font-mono font-bold rounded-lg border transition-all ${
                    triageFilter === tag
                      ? 'bg-rose-600 text-white border-rose-400'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Patient Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPatients.map((patient) => {
              const tagColors = {
                RED: 'bg-rose-950/80 border-rose-500/50 text-rose-300',
                YELLOW: 'bg-amber-950/80 border-amber-500/50 text-amber-300',
                GREEN: 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300',
                BLACK: 'bg-slate-900/90 border-slate-700 text-slate-400'
              };

              return (
                <div
                  key={patient.id}
                  onClick={() => setSelectedPatient(patient)}
                  className={`border rounded-2xl p-5 shadow-xl transition-all duration-200 cursor-pointer space-y-4 flex flex-col justify-between hover:shadow-2xl ${
                    tagColors[patient.triageTag] || 'border-slate-800'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold">{patient.id}</span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase font-mono tracking-wider bg-black/40">
                        {patient.triageCategory}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white mt-1">{patient.alias}</h3>
                    <p className="text-xs text-slate-300 mt-0.5">{patient.age} yrs | {patient.gender}</p>

                    {/* Vitals Summary */}
                    <div className="grid grid-cols-3 gap-2 bg-black/40 p-2.5 rounded-xl border border-white/10 text-xs font-mono mt-3">
                      <div>
                        <span className="text-slate-400 text-[10px]">HR:</span>{' '}
                        <strong className={patient.vitals.hr > 120 ? 'text-rose-400' : 'text-white'}>
                          {patient.vitals.hr}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px]">BP:</span>{' '}
                        <strong className="text-white">{patient.vitals.sbp}/{patient.vitals.dbp}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px]">SpO2:</span>{' '}
                        <strong className={patient.vitals.spo2 < 90 ? 'text-rose-400' : 'text-white'}>
                          {patient.vitals.spo2}%
                        </strong>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-white/10 text-xs">
                    <div className="text-slate-300">
                      <span className="text-slate-400">Trauma Assigned:</span>{' '}
                      <strong className="text-white font-medium">{patient.traumaBayAssigned}</strong>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Shock Index: <strong className="font-mono text-rose-300">{patient.shockIndex}</strong></span>
                      <span className="text-rose-400 font-bold hover:underline">Inspect Case &rarr;</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* TAB 2: EMS & MEDEVAC AIR RADAR                                        */}
      {/* -------------------------------------------------------------------- */}
      {activeTab === 'medevac-radar' && (
        <div className="space-y-6">
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Ambulance className="w-6 h-6 text-rose-400" />
                <div>
                  <h2 className="text-lg font-bold text-white">EMS Ground & Air Medevac Dispatch Radar</h2>
                  <p className="text-xs text-slate-400">Real-Time In-Bound Telemetry, Flight Vectors & ETA Monitoring</p>
                </div>
              </div>
              <span className="px-3 py-1 bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-mono rounded-full font-bold">
                Units Active: 3 In-Bound
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {emsFleet.map((unit) => (
                <div key={unit.id} className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-rose-400">{unit.id}</span>
                    <span className="px-2 py-0.5 bg-rose-950 text-rose-300 border border-rose-500/30 text-[10px] font-bold rounded">
                      {unit.status}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-white">{unit.callsign}</h3>
                  <p className="text-xs text-slate-400">{unit.type}</p>

                  <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-1 text-xs font-mono">
                    <div><span className="text-slate-500">ETA:</span> <strong className="text-emerald-400">{unit.etaMinutes} mins</strong></div>
                    <div><span className="text-slate-500">Patient:</span> <strong className="text-white">{unit.patientAssigned}</strong></div>
                    <div><span className="text-slate-500">Vector:</span> <span className="text-slate-300">{unit.flightVector}</span></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* TAB 3: SURGE BEDS & TRAUMA BAYS                                       */}
      {/* -------------------------------------------------------------------- */}
      {activeTab === 'surge-capacity' && (
        <div className="space-y-6">
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="flex items-center space-x-3">
              <Bed className="w-6 h-6 text-amber-400" />
              <div>
                <h2 className="text-lg font-bold text-white">Hospital Surge Capacity & Trauma Bay Allocation</h2>
                <p className="text-xs text-slate-400">Emergency Department Surge Beds, OR & Ventilator Allocation Matrix</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {capacityMetrics.map((cap, i) => (
                <div key={i} className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{cap.label}</span>
                    <span className="px-2 py-0.5 bg-amber-950 text-amber-300 text-[10px] font-bold rounded">
                      {cap.status}
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-black font-mono text-emerald-400">
                      {cap.occupied} / {cap.total}
                    </span>
                    <span className="text-xs text-slate-400">Occupied</span>
                  </div>

                  <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-emerald-500 to-amber-500 h-full rounded-full"
                      style={{ width: `${(cap.occupied / cap.total) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* DETAILED PATIENT INSPECTOR MODAL                                      */}
      {/* -------------------------------------------------------------------- */}
      {selectedPatient && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs font-mono font-bold text-rose-400">{selectedPatient.id}</span>
                <h2 className="text-xl font-black text-white">{selectedPatient.alias}</h2>
              </div>
              <button
                onClick={() => setSelectedPatient(null)}
                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                &times;
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div><span className="text-slate-500">Glasgow Coma Scale:</span> <strong className="text-rose-400 font-mono">GCS {selectedPatient.gcs}/15</strong></div>
                <div><span className="text-slate-500">Shock Index:</span> <strong className="text-amber-300 font-mono">{selectedPatient.shockIndex}</strong></div>
                <div><span className="text-slate-500">Assigned Bay:</span> <strong className="text-emerald-300 font-mono">{selectedPatient.traumaBayAssigned}</strong></div>
                <div><span className="text-slate-500">Decon Status:</span> <strong className="text-cyan-300 font-mono">{selectedPatient.deconCompleted ? 'COMPLETED' : 'PENDING'}</strong></div>
              </div>

              <div>
                <h4 className="font-bold text-slate-200 mb-1">Trauma Injuries:</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedPatient.injuries.map((inj, i) => (
                    <span key={i} className="px-2.5 py-1 bg-rose-950/60 border border-rose-500/30 text-rose-300 text-xs font-medium rounded-lg">
                      {inj}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-200 mb-1">Re-Triage Patient Tag:</h4>
                <div className="flex space-x-2 pt-1">
                  {['RED', 'YELLOW', 'GREEN', 'BLACK'].map((tag) => (
                    <button
                      key={tag}
                      onClick={() => handleRetriage(selectedPatient.id, tag)}
                      className={`px-3 py-1.5 text-xs font-mono font-bold rounded-lg border transition-all ${
                        selectedPatient.triageTag === tag
                          ? 'bg-rose-600 text-white border-rose-400'
                          : 'bg-slate-950 text-slate-300 border-slate-700 hover:bg-slate-800'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-800">
              <button
                onClick={() => setSelectedPatient(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-xl"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
