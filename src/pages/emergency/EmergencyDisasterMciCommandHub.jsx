import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldAlert,
  Activity,
  AlertTriangle,
  Flame,
  CheckCircle2,
  Users,
  Building,
  Heart,
  FileText,
  Search,
  Filter,
  RefreshCw,
  Radio,
  Share2,
  Download,
  Crosshair,
  Truck,
  Zap,
  PhoneCall,
  Sliders,
  AlertOctagon,
  LifeBuoy
} from 'lucide-react';

const MCI_CASUALTIES = [
  {
    id: "MCI-CAS-001",
    tagNumber: "START-RED-901",
    name: "John Doe (Unidentified Adult)",
    age: 38,
    gender: "Male",
    triageCategory: "RED_IMMEDIATE",
    mechanism: "High-Speed Vehicle Collision with Structural Collapse",
    injuries: "Tension Pneumothorax, Open Femur Fracture, Blast Lung",
    vitals: { hr: 142, bp: "72/40", sbp: 72, rr: 36, spo2: 84, gcs: 8, capRefill: 3.8 },
    shockIndex: "1.97",
    rts: "4.82",
    tourniquetApplied: true,
    mtpActive: true,
    bedAssignment: "Resuscitation Bay Trauma 1",
    transportUnit: "Medic 12 (ALS)",
    etaMinutes: 2
  },
  {
    id: "MCI-CAS-002",
    tagNumber: "START-YELLOW-304",
    name: "Elena Rostova",
    age: 29,
    gender: "Female",
    triageCategory: "YELLOW_DELAYED",
    mechanism: "Building Debris Blunt Impact",
    injuries: "Closed Pelvic Fracture (Stable), Left Forearm Fracture, Lacerations",
    vitals: { hr: 98, bp: "114/72", sbp: 114, rr: 20, spo2: 97, gcs: 14, capRefill: 1.6 },
    shockIndex: "0.86",
    rts: "7.84",
    tourniquetApplied: false,
    mtpActive: false,
    bedAssignment: "Acute Step-Down Bed 08",
    transportUnit: "Rescue 4",
    etaMinutes: 6
  },
  {
    id: "MCI-CAS-003",
    tagNumber: "START-GREEN-112",
    name: "Samir Khan",
    age: 45,
    gender: "Male",
    triageCategory: "GREEN_MINIMAL",
    mechanism: "Secondary Shrapnel Glass Shatter",
    injuries: "Superficial Corneal Abrasions, Facial Soft Tissue Lacerations",
    vitals: { hr: 84, bp: "128/80", sbp: 128, rr: 16, spo2: 99, gcs: 15, capRefill: 1.2 },
    shockIndex: "0.66",
    rts: "7.84",
    tourniquetApplied: false,
    mtpActive: false,
    bedAssignment: "Minor Triage Zone C",
    transportUnit: "Ambulance Bus 1",
    etaMinutes: 12
  },
  {
    id: "MCI-CAS-004",
    tagNumber: "START-BLACK-009",
    name: "Unidentified Casualty",
    age: 52,
    gender: "Unknown",
    triageCategory: "BLACK_EXPECTANT",
    mechanism: "Direct Blast Trauma & Crush Injury",
    injuries: "Catastrophic Craniocerebral Disruption, Traumatic Asystole",
    vitals: { hr: 0, bp: "0/0", sbp: 0, rr: 0, spo2: 0, gcs: 3, capRefill: 9.9 },
    shockIndex: "0.00",
    rts: "0.00",
    tourniquetApplied: false,
    mtpActive: false,
    bedAssignment: "Deceased / Expectant Holding",
    transportUnit: "Coroner Transport Unit",
    etaMinutes: 0
  }
];

const HOSPITAL_SURGE_STATUS = {
  facilityName: "Metro General Level 1 Trauma Center",
  incidentName: "Incident Bravo: Multi-Vehicle Commercial Tunnel Explosion",
  incidentCommandLevel: "FEMA NIMS Level 2 Disaster Activation",
  totalCasualtiesReported: 48,
  traumaBaysAvailable: 2,
  traumaBaysTotal: 8,
  operatingRoomsStaffed: 6,
  operatingRoomsInUse: 5,
  icuBedsAvailable: 4,
  bloodBankO_NegUnits: 42,
  bloodBankPlasmaUnits: 28,
  bloodBankPlateletUnits: 8
};

export default function EmergencyDisasterMciCommandHub() {
  const [casualties, setCasualties] = useState(MCI_CASUALTIES);
  const [selectedCasualtyId, setSelectedCasualtyId] = useState(MCI_CASUALTIES[0].id);
  const [activeTab, setActiveTab] = useState('triage_board'); // triage_board, surge_ops, mtp_cooler, hazmat, fhir
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [isDisasterCodeBlackActive, setIsDisasterCodeBlackActive] = useState(false);
  const [pulseTick, setPulseTick] = useState(0);
  const [auditLog, setAuditLog] = useState([
    { time: "19:30:10", user: "Incident Commander (Dr. Vance)", action: "Declared Hospital Surge Phase II - Elective surgeries halted" },
    { time: "19:22:45", user: "Trauma Medical Director", action: "Dispatched MTP Coolers #1 and #2 to Resus Bay 1 & OR 3" }
  ]);

  const selectedCasualty = useMemo(() => {
    return casualties.find(c => c.id === selectedCasualtyId) || casualties[0];
  }, [casualties, selectedCasualtyId]);

  useEffect(() => {
    const timer = setInterval(() => {
      setPulseTick(p => p + 1);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const filteredCasualties = useMemo(() => {
    if (filterCategory === 'ALL') return casualties;
    return casualties.filter(c => c.triageCategory === filterCategory);
  }, [casualties, filterCategory]);

  const triageCounts = useMemo(() => {
    return {
      RED: casualties.filter(c => c.triageCategory === 'RED_IMMEDIATE').length,
      YELLOW: casualties.filter(c => c.triageCategory === 'YELLOW_DELAYED').length,
      GREEN: casualties.filter(c => c.triageCategory === 'GREEN_MINIMAL').length,
      BLACK: casualties.filter(c => c.triageCategory === 'BLACK_EXPECTANT').length
    };
  }, [casualties]);

  const triggerMtpDispatch = (casualtyId) => {
    setCasualties(prev => prev.map(c => {
      if (c.id === casualtyId) {
        return { ...c, mtpActive: true };
      }
      return c;
    }));
    setAuditLog(prev => [
      { time: new Date().toLocaleTimeString(), user: "Blood Bank STAT", action: `Emergency MTP Cooler 1:1:1 (4 pRBC, 4 FFP, 1 Plt) released for ${casualtyId}` },
      ...prev
    ]);
    alert(`Massive Transfusion Protocol Cooler Dispatched STAT for ${casualtyId}`);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-6 lg:p-8 font-sans">
      {/* Top Incident Command Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-800 gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-gradient-to-tr from-rose-600 via-amber-600 to-red-700 rounded-xl shadow-lg shadow-rose-950/60 border border-rose-500/50">
            <Flame className="w-8 h-8 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl md:text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-amber-200 to-yellow-400">
                Mass Casualty Incident (MCI) & START Triage Command Station
              </h1>
              <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-rose-950 text-rose-300 border border-rose-700 uppercase">
                FEMA NIMS ICS-204 / START 2026
              </span>
            </div>
            <p className="text-xs md:text-sm text-slate-400 mt-0.5">
              {HOSPITAL_SURGE_STATUS.incidentName} — {HOSPITAL_SURGE_STATUS.incidentCommandLevel}
            </p>
          </div>
        </div>

        {/* Global Incident Action Triggers */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsDisasterCodeBlackActive(!isDisasterCodeBlackActive)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-black transition-all shadow-lg ${
              isDisasterCodeBlackActive
                ? 'bg-rose-600 text-white animate-bounce shadow-rose-950 ring-2 ring-rose-400'
                : 'bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-700'
            }`}
          >
            <AlertOctagon className="w-4 h-4" />
            <span>{isDisasterCodeBlackActive ? "CODE BLACK DISASTER ACTIVATED" : "DECLARE CODE BLACK"}</span>
          </button>
        </div>
      </div>

      {/* Code Black Disaster Emergency Directive Banner */}
      {isDisasterCodeBlackActive && (
        <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-rose-950 via-red-950 to-slate-900 border-2 border-rose-500 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-center space-x-3">
            <ShieldAlert className="w-8 h-8 text-rose-400 animate-pulse flex-shrink-0" />
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-black text-rose-200 tracking-wider uppercase">FEMA LEVEL 1 HOSPITAL DISASTER DIRECTIVE ACTIVE</span>
                <span className="px-2 py-0.5 text-xs bg-rose-600 text-white font-black rounded">SURGE CAPACITY PHASE III</span>
              </div>
              <p className="text-xs text-rose-300 mt-1">
                Mandatory recall of all off-duty trauma surgeons, anesthesiologists, and critical care nurses. All PACU & outpatient bays converted to Acute Trauma Surge Beds. External Hazmat Decontamination active.
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 w-full md:w-auto">
            <button
              onClick={() => {
                alert("Automated Mass Notification dispatched to 240 hospital clinical staff via Vocera & SMS.");
                setIsDisasterCodeBlackActive(false);
              }}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-black uppercase tracking-wider transition shadow-lg"
            >
              Broadcast Staff Recall
            </button>
            <button
              onClick={() => setIsDisasterCodeBlackActive(false)}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium"
            >
              Acknowledge
            </button>
          </div>
        </div>
      )}

      {/* Triage Summary Matrix Counters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        <div
          onClick={() => setFilterCategory('RED_IMMEDIATE')}
          className={`p-4 rounded-xl border cursor-pointer transition ${
            filterCategory === 'RED_IMMEDIATE'
              ? 'bg-rose-950/80 border-rose-500 ring-2 ring-rose-500'
              : 'bg-slate-900/90 border-slate-800 hover:border-rose-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-rose-400">RED: IMMEDIATE (P1)</span>
            <Crosshair className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-3xl font-black text-rose-300 mt-2">{triageCounts.RED}</div>
          <p className="text-xs text-slate-400 mt-1">Critical life threats / STAT OR</p>
        </div>

        <div
          onClick={() => setFilterCategory('YELLOW_DELAYED')}
          className={`p-4 rounded-xl border cursor-pointer transition ${
            filterCategory === 'YELLOW_DELAYED'
              ? 'bg-amber-950/80 border-amber-500 ring-2 ring-amber-500'
              : 'bg-slate-900/90 border-slate-800 hover:border-amber-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-amber-400">YELLOW: DELAYED (P2)</span>
            <Activity className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-black text-amber-300 mt-2">{triageCounts.YELLOW}</div>
          <p className="text-xs text-slate-400 mt-1">Serious injuries / Stable 1-2 hrs</p>
        </div>

        <div
          onClick={() => setFilterCategory('GREEN_MINIMAL')}
          className={`p-4 rounded-xl border cursor-pointer transition ${
            filterCategory === 'GREEN_MINIMAL'
              ? 'bg-emerald-950/80 border-emerald-500 ring-2 ring-emerald-500'
              : 'bg-slate-900/90 border-slate-800 hover:border-emerald-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-emerald-400">GREEN: MINIMAL (P3)</span>
            <Users className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-black text-emerald-300 mt-2">{triageCounts.GREEN}</div>
          <p className="text-xs text-slate-400 mt-1">Walking wounded / Minor hold</p>
        </div>

        <div
          onClick={() => setFilterCategory('BLACK_EXPECTANT')}
          className={`p-4 rounded-xl border cursor-pointer transition ${
            filterCategory === 'BLACK_EXPECTANT'
              ? 'bg-slate-900 border-slate-500 ring-2 ring-slate-400'
              : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-slate-400">BLACK: EXPECTANT (P4)</span>
            <AlertTriangle className="w-4 h-4 text-slate-500" />
          </div>
          <div className="text-3xl font-black text-slate-300 mt-2">{triageCounts.BLACK}</div>
          <p className="text-xs text-slate-400 mt-1">Deceased / Palliative care</p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center space-x-2 border-b border-slate-800 mt-6 pb-2 overflow-x-auto">
        {[
          { id: 'triage_board', label: 'Casualty START Triage Queue', icon: Crosshair },
          { id: 'surge_ops', label: 'Hospital Surge & Bed Allocation', icon: Building },
          { id: 'mtp_cooler', label: 'Massive Transfusion Protocol (MTP)', icon: Heart },
          { id: 'hazmat', label: 'Warm-Zone Hazmat Decon Corridor', icon: ShieldAlert },
          { id: 'fhir', label: 'HL7 FHIR R4 Disaster Audit Ledger', icon: FileText }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg text-xs md:text-sm font-semibold transition whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-rose-950 text-rose-300 border border-rose-600 shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Tab Views */}
      <div className="mt-6">
        {activeTab === 'triage_board' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setFilterCategory('ALL')}
                  className={`px-3 py-1 rounded text-xs font-bold ${filterCategory === 'ALL' ? 'bg-slate-800 text-white' : 'bg-slate-950 text-slate-400'}`}
                >
                  All Casualties ({casualties.length})
                </button>
                <span className="text-xs text-slate-500">| Showing {filteredCasualties.length} tagged patients</span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {filteredCasualties.map((cas) => (
                <div
                  key={cas.id}
                  onClick={() => setSelectedCasualtyId(cas.id)}
                  className={`cursor-pointer p-4 rounded-xl border transition-all ${
                    selectedCasualtyId === cas.id
                      ? 'bg-slate-900 border-rose-500 ring-1 ring-rose-500 shadow-xl shadow-rose-950/30'
                      : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex items-center space-x-3">
                      <div className={`p-3 rounded-lg font-mono font-black text-sm ${
                        cas.triageCategory === 'RED_IMMEDIATE'
                          ? 'bg-rose-600 text-white animate-pulse'
                          : cas.triageCategory === 'YELLOW_DELAYED'
                          ? 'bg-amber-600 text-slate-950'
                          : cas.triageCategory === 'GREEN_MINIMAL'
                          ? 'bg-emerald-600 text-slate-950'
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {cas.tagNumber}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-bold text-base text-slate-100">{cas.name}</h3>
                          <span className="text-xs text-slate-400">({cas.gender}, {cas.age}y)</span>
                          {cas.tourniquetApplied && (
                            <span className="px-2 py-0.5 bg-red-950 text-red-400 border border-red-800 text-xs font-bold rounded">
                              TOURNIQUET APPLIED
                            </span>
                          )}
                          {cas.mtpActive && (
                            <span className="px-2 py-0.5 bg-rose-600 text-white text-xs font-black rounded animate-pulse">
                              MTP COOLER 1:1:1 ACTIVE
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-rose-300 font-semibold mt-0.5">{cas.injuries}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-2 text-center text-xs">
                      <div className="bg-slate-950 p-1.5 rounded border border-slate-800">
                        <span className="text-slate-500">HR</span>
                        <div className="font-mono font-bold text-slate-200">{cas.vitals.hr}</div>
                      </div>
                      <div className="bg-slate-950 p-1.5 rounded border border-slate-800">
                        <span className="text-slate-500">BP</span>
                        <div className="font-mono font-bold text-slate-200">{cas.vitals.bp}</div>
                      </div>
                      <div className="bg-slate-950 p-1.5 rounded border border-slate-800">
                        <span className="text-slate-500">Shock Idx</span>
                        <div className={`font-mono font-bold ${Number(cas.shockIndex) >= 1.0 ? 'text-rose-400' : 'text-slate-200'}`}>{cas.shockIndex}</div>
                      </div>
                      <div className="bg-slate-950 p-1.5 rounded border border-slate-800">
                        <span className="text-slate-500">RTS Score</span>
                        <div className="font-mono font-bold text-cyan-400">{cas.rts}</div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between text-xs text-slate-400 gap-2">
                    <div>
                      <span>Assigned Target: </span>
                      <strong className="text-cyan-300">{cas.bedAssignment}</strong> (In transit via {cas.transportUnit}, ETA {cas.etaMinutes}m)
                    </div>
                    {cas.triageCategory === 'RED_IMMEDIATE' && !cas.mtpActive && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          triggerMtpDispatch(cas.id);
                        }}
                        className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded font-bold uppercase transition"
                      >
                        Dispatch MTP Cooler STAT
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'surge_ops' && (
          <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-xl space-y-6">
            <div className="border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-slate-100 flex items-center space-x-2">
                <Building className="w-5 h-5 text-amber-400" />
                <span>Hospital Surge Capacity & OR Allocation Matrix</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time trauma bay availability, emergency surgical suite readiness, and staff redeployment.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <span className="text-xs font-bold uppercase text-slate-400">Level 1 Trauma Bays</span>
                <div className="text-3xl font-black text-rose-400 mt-2">
                  {HOSPITAL_SURGE_STATUS.traumaBaysAvailable} / {HOSPITAL_SURGE_STATUS.traumaBaysTotal} <span className="text-xs text-slate-400 font-normal">Available</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
                  <div className="bg-rose-500 h-full" style={{ width: '75%' }}></div>
                </div>
                <p className="text-xs text-slate-400 mt-2">6 bays occupied with active resuscitation</p>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <span className="text-xs font-bold uppercase text-slate-400">Trauma Operating Suites</span>
                <div className="text-3xl font-black text-amber-400 mt-2">
                  {HOSPITAL_SURGE_STATUS.operatingRoomsStaffed - HOSPITAL_SURGE_STATUS.operatingRoomsInUse} / {HOSPITAL_SURGE_STATUS.operatingRoomsStaffed} <span className="text-xs text-slate-400 font-normal">Ready</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
                  <div className="bg-amber-500 h-full" style={{ width: '83%' }}></div>
                </div>
                <p className="text-xs text-slate-400 mt-2">OR 1-5 active: Exploratory Laparotomies & Craniotomies</p>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <span className="text-xs font-bold uppercase text-slate-400">Emergency Blood Bank Reserves</span>
                <div className="text-3xl font-black text-cyan-400 mt-2">
                  {HOSPITAL_SURGE_STATUS.bloodBankO_NegUnits} <span className="text-xs text-slate-400 font-normal">Units O-Neg pRBC</span>
                </div>
                <div className="text-xs text-slate-300 mt-3 space-y-1">
                  <div>Plasma (FFP): <strong>{HOSPITAL_SURGE_STATUS.bloodBankPlasmaUnits} units</strong></div>
                  <div>Platelet Apheresis: <strong>{HOSPITAL_SURGE_STATUS.bloodBankPlateletUnits} units</strong></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'mtp_cooler' && (
          <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-xl space-y-4">
            <div className="border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-slate-100 flex items-center space-x-2">
                <Heart className="w-5 h-5 text-rose-500" />
                <span>Massive Transfusion Protocol (MTP) 1:1:1 Cooler Dispatch System</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Balanced resuscitation cooler orchestration to prevent trauma-induced coagulopathy (TIC).
              </p>
            </div>

            <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-slate-900 rounded-lg border border-slate-800">
                <span className="text-xs uppercase font-bold text-rose-400">pRBC (Red Cells)</span>
                <div className="text-3xl font-black text-rose-400 mt-2">4 Units</div>
                <p className="text-xs text-slate-400 mt-1">Uncrossed O-Negative / Type-Specific</p>
              </div>

              <div className="p-4 bg-slate-900 rounded-lg border border-slate-800">
                <span className="text-xs uppercase font-bold text-amber-400">Fresh Frozen Plasma (FFP)</span>
                <div className="text-3xl font-black text-amber-400 mt-2">4 Units</div>
                <p className="text-xs text-slate-400 mt-1">Thawed AB or Type-Specific Plasma</p>
              </div>

              <div className="p-4 bg-slate-900 rounded-lg border border-slate-800">
                <span className="text-xs uppercase font-bold text-purple-400">Platelets (Apheresis)</span>
                <div className="text-3xl font-black text-purple-400 mt-2">1 Unit</div>
                <p className="text-xs text-slate-400 mt-1">Equivalent to 6-pack random donor</p>
              </div>
            </div>

            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-2">
              <h4 className="font-bold text-cyan-300 uppercase">Adjunctive Hemostatic Directives:</h4>
              <ul className="list-disc list-inside space-y-1 text-slate-400">
                <li>Administer Tranexamic Acid (TXA): 1 gram IV bolus over 10 min within 3 hours of trauma injury.</li>
                <li>Administer Calcium Chloride: 1 gram IV for every 4 units of blood products transfused (prevent citrate toxicity).</li>
                <li>Target core temperature &gt; 35°C, arterial pH &gt; 7.20, and base excess &gt; -6 mEq/L.</li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'hazmat' && (
          <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-xl space-y-4">
            <div className="border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-slate-100 flex items-center space-x-2">
                <ShieldAlert className="w-5 h-5 text-amber-400" />
                <span>External Warm-Zone Hazmat Decontamination Corridor</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                OSHA Level B / EPA Tier 1 gross decontamination to prevent hospital indoor secondary contamination.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <h4 className="font-bold text-amber-400 uppercase tracking-wider">Gross Decon Protocols</h4>
                <ol className="list-decimal list-inside space-y-2 text-slate-300">
                  <li>Remove 85-90% of contaminants by stripping all casualty clothing and double-bagging.</li>
                  <li>High-flow, low-pressure lukewarm water rinse for 3 minutes per victim.</li>
                  <li>Perform radiological survey (Ludlum Model 3) and chemical vapor detection (PID) prior to entry.</li>
                </ol>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <h4 className="font-bold text-cyan-400 uppercase tracking-wider">Decontamination Fleet Status</h4>
                <div className="space-y-2 text-slate-300">
                  <div className="flex justify-between">
                    <span>Outdoor Decon Tent 1:</span> <span className="text-emerald-400 font-bold">OPERATIONAL</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Outdoor Decon Tent 2:</span> <span className="text-emerald-400 font-bold">OPERATIONAL</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Negative Pressure Isolation:</span> <span className="text-emerald-400 font-bold">ACTIVE (12 ACH)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'fhir' && (
          <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-xl space-y-4">
            <div className="border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-slate-100 flex items-center space-x-2">
                <FileText className="w-5 h-5 text-indigo-400" />
                <span>HL7 FHIR R4 Disaster Encounter & Audit Ledger (21 CFR Part 11)</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Standardized disaster casualty tracking payload for regional health information exchange (HIE).
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs font-bold text-slate-300">
                  <span>FHIR R4 Disaster Encounter Resource</span>
                  <Download className="w-4 h-4 text-cyan-400 cursor-pointer" onClick={() => alert("FHIR Encounter JSON Exported.")} />
                </div>
                <pre className="mt-3 p-3 bg-slate-900 rounded-lg text-slate-300 text-xs font-mono overflow-x-auto max-h-64">
{JSON.stringify({
  resourceType: "Encounter",
  id: `enc-disaster-${selectedCasualty.id.toLowerCase()}`,
  status: "in-progress",
  class: {
    system: "http://terminology.hl7.org/CodeSystem/v3-ActCode",
    code: "EMER",
    display: "emergency"
  },
  type: [{
    coding: [{
      system: "http://snomed.info/sct",
      code: "225728007",
      display: "Disaster triage"
    }]
  }],
  subject: {
    display: selectedCasualty.name
  },
  priority: {
    coding: [{
      system: "http://terminology.hl7.org/CodeSystem/v3-ActPriority",
      code: selectedCasualty.triageCategory === 'RED_IMMEDIATE' ? "CR" : "EL",
      display: selectedCasualty.triageCategory
    }]
  },
  location: [{
    location: {
      display: selectedCasualty.bedAssignment
    }
  }]
}, null, 2)}
                </pre>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="pb-2 border-b border-slate-800 text-xs font-bold text-slate-300">
                    FEMA Incident Command Audit Trail (21 CFR Part 11)
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
                      const signer = prompt("Enter Incident Medical Commander ID:", "MD-TRAUMA-99014");
                      if (signer) {
                        setAuditLog(prev => [
                          { time: new Date().toLocaleTimeString(), user: signer, action: "Disaster Casualty Log Verified & Electronically Signed" },
                          ...prev
                        ]);
                        alert("Disaster Encounter Record Authenticated.");
                      }
                    }}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold tracking-wider uppercase transition shadow-lg"
                  >
                    Sign Disaster Command Log
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
