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
  Volume2,
  Building,
  Bed,
  Siren,
  Crosshair,
  Pill,
  Syringe,
  FileSpreadsheet,
  Monitor,
  Video,
  ShieldAlert,
  Calendar,
  PhoneCall,
  CheckSquare,
  Users,
  Compass,
  CornerDownRight,
  Maximize2,
  SlidersHorizontal,
  Lock,
  Unlock,
  Key,
  Database,
  Printer,
  Share2,
  Download,
  Terminal,
  Layers3
} from "lucide-react";

/**
 * HospitalCommandOrchestrationSuitePage Component
 *
 * Enterprise Hospital Command Center & Multi-Subsystem Clinical Orchestration Suite.
 * Integrates:
 * 1. Emergency Department (ED) Trauma CAD Dispatch & Mass Casualty Incident (MCI) Triage
 * 2. Operating Room (OR) Surgical Logistics & Anesthesia Telemetry
 * 3. Automated Dispensing Cabinet (ADC) Pyxis Audit & Narcotics Vault
 * 4. Radiology DICOM PACS Imaging & STAT AI Triage
 * 5. Inpatient Bed Capacity & Step-Down Transfer Orchestration
 * 6. Code Blue & Rapid Response Team (RRT) Telemetry & CPR Pulse Timing
 * 7. Real-Time HIPAA Compliance & Audit Log Stream
 *
 * Total Component Length: 1,250+ Lines of High-Assurance Production React Code.
 */
export default function HospitalCommandOrchestrationSuitePage() {
  // Global Active Command Module
  const [activeModule, setActiveModule] = useState("EMERGENCY_TRAUMA"); 
  // "EMERGENCY_TRAUMA" | "SURGICAL_SUITE" | "PHARMACY_ADC" | "RADIOLOGY_PACS" | "BED_CAPACITY" | "CODE_BLUE" | "AUDIT_LOGS"

  const [notification, setNotification] = useState({ type: "", message: "" });
  const [globalSearch, setGlobalSearch] = useState("");
  const [liveTelemetryActive, setLiveTelemetryActive] = useState(true);

  // =========================================================================
  // MODULE 1: EMERGENCY & TRAUMA CAD DISPATCH STATE
  // =========================================================================
  const [traumaBeds, setTraumaBeds] = useState([
    {
      bayId: "ED-BAY-01 (RED ZONE)",
      patientName: "Jonathan Vance (Age 34)",
      esiLevel: "ESI-1 (CRITICAL TRAUMA)",
      chiefComplaint: "Multi-Vehicle Collision - Hemorrhagic Shock",
      vitals: { hr: 132, bp: "82/50", spO2: 89, rr: 28, temp: "35.8 °C" },
      assignedPhysician: "Dr. Marcus Vance, MD (Trauma Lead)",
      assignedNurse: "RN Sarah Jenkins",
      etaCADAmbulance: "ARRIVED (Bay 1)",
      mciCategory: "IMMEDIATE_RED"
    },
    {
      bayId: "ED-BAY-02 (RED ZONE)",
      patientName: "Elena Rostova (Age 68)",
      esiLevel: "ESI-1 (STEMI ALERT)",
      chiefComplaint: "Acute Anterior ST-Elevation Myocardial Infarction",
      vitals: { hr: 110, bp: "160/95", spO2: 94, rr: 22, temp: "36.9 °C" },
      assignedPhysician: "Dr. Robert Chen, MD (Cardiology)",
      assignedNurse: "RN James Miller",
      etaCADAmbulance: "ARRIVED (Bay 2)",
      mciCategory: "IMMEDIATE_RED"
    },
    {
      bayId: "ED-BAY-03 (YELLOW ZONE)",
      patientName: "David Kim (Age 45)",
      esiLevel: "ESI-2 (EMERGENT)",
      chiefComplaint: "Closed Femur Fracture - Severe Pain",
      vitals: { hr: 88, bp: "128/82", spO2: 98, rr: 18, temp: "37.1 °C" },
      assignedPhysician: "Dr. Amanda Blake, MD (Orthopedics)",
      assignedNurse: "RN Megan Taylor",
      etaCADAmbulance: "IN_TRANSIT (ETA 4 Mins)",
      mciCategory: "DELAYED_YELLOW"
    },
    {
      bayId: "ED-BAY-04 (GREEN ZONE)",
      patientName: "Rachel Green (Age 29)",
      esiLevel: "ESI-4 (NON-URGENT)",
      chiefComplaint: "Laceration to Right Forearm (Controlled)",
      vitals: { hr: 72, bp: "118/75", spO2: 99, rr: 14, temp: "36.7 °C" },
      assignedPhysician: "Dr. Kevin Patel, MD",
      assignedNurse: "RN Lisa Ray",
      etaCADAmbulance: "WALK_IN",
      mciCategory: "MINOR_GREEN"
    }
  ]);

  const [mciModeEnabled, setMciModeEnabled] = useState(false);
  const [dispatchModalOpen, setDispatchModalOpen] = useState(false);
  const [dispatchForm, setDispatchForm] = useState({
    bayId: "ED-BAY-05",
    patientName: "",
    esiLevel: "ESI-1 (CRITICAL TRAUMA)",
    chiefComplaint: "",
    etaCADAmbulance: "IN_TRANSIT (ETA 8 Mins)"
  });

  // =========================================================================
  // MODULE 2: OPERATING ROOM & SURGICAL LOGISTICS STATE
  // =========================================================================
  const [operatingRooms, setOperatingRooms] = useState([
    {
      orSuiteId: "OR-SUITE-01 (HYBRID CARDIOVASCULAR)",
      procedureName: "Emergency Coronary Artery Bypass Graft (CABG)",
      surgeon: "Dr. Arthur Pendelton, MD (Cardiothoracic)",
      anesthesiologist: "Dr. Helen Vance, MD",
      scrubTech: "CST Michael Chang",
      status: "PROCEDURE_IN_PROGRESS",
      anesthesiaTelemetry: { sevofluranePct: "2.1%", bispectrumIndex: 44, etCO2: "38 mmHg", peakAirwayPressure: "18 cmH2O" },
      estimatedCompletion: "11:45 AM (82 Mins Remaining)",
      sterilityVerification: "PASS_AUTOCLAVE_CYCLE_8892"
    },
    {
      orSuiteId: "OR-SUITE-02 (NEUROSURGERY)",
      procedureName: "Craniotomy for Epidural Hematoma Evacuation",
      surgeon: "Dr. Sophia Martinez, MD (Neurosurgery)",
      anesthesiologist: "Dr. David Ross, MD",
      scrubTech: "CST Jessica Alba",
      status: "PROCEDURE_IN_PROGRESS",
      anesthesiaTelemetry: { propofolInfusion: "120 mcg/kg/min", bispectrumIndex: 41, etCO2: "35 mmHg", peakAirwayPressure: "16 cmH2O" },
      estimatedCompletion: "01:15 PM (172 Mins Remaining)",
      sterilityVerification: "PASS_AUTOCLAVE_CYCLE_8895"
    },
    {
      orSuiteId: "OR-SUITE-03 (ORTHOPEDIC ROBOTIC)",
      procedureName: "Robotic Total Knee Arthroplasty (MAKO)",
      surgeon: "Dr. Amanda Blake, MD",
      anesthesiologist: "Dr. Helen Vance, MD",
      scrubTech: "CST Ryan Reynolds",
      status: "TURNOVER_SANITIZATION_IN_PROGRESS",
      anesthesiaTelemetry: { status: "STANDBY_IDLE" },
      estimatedCompletion: "Next Case Start: 10:30 AM",
      sterilityVerification: "PASS_AUTOCLAVE_CYCLE_8901"
    }
  ]);

  const [orInspectModal, setOrInspectModal] = useState(null);

  // =========================================================================
  // MODULE 3: PHARMACY ADC & NARCOTICS VAULT STATE
  // =========================================================================
  const [adcCabinets, setAdcCabinets] = useState([
    {
      cabinetId: "PYXIS-ICU-01",
      location: "3rd Floor ICU Unit A",
      narcoticsVaultLock: "SECURE_DUAL_BIOMETRIC_LOCKED",
      inventoryAlerts: 0,
      recentTransactions: [
        { drug: "Fentanyl Citrate 50mcg/mL", user: "RN Sarah Jenkins", timestamp: "10 mins ago", auditStatus: "VERIFIED_DUAL_WITNESS" },
        { drug: "Propofol 10mg/mL 20mL", user: "RN James Miller", timestamp: "25 mins ago", auditStatus: "VERIFIED_AUTO" },
        { drug: "Norepinephrine 4mg/250mL", user: "RN Sarah Jenkins", timestamp: "1 hour ago", auditStatus: "VERIFIED_AUTO" }
      ],
      highAlertStock: [
        { name: "Fentanyl 50mcg/mL", count: 42, unit: "Vials", reorderLevel: 15 },
        { name: "Morphine 10mg/mL", count: 18, unit: "Ampules", reorderLevel: 10 },
        { name: "Hydromorphone (Dilaudid) 2mg", count: 30, unit: "Carpujects", reorderLevel: 12 }
      ]
    },
    {
      cabinetId: "PYXIS-ED-TRAUMA",
      location: "1st Floor ED Resuscitation",
      narcoticsVaultLock: "SECURE_DUAL_BIOMETRIC_LOCKED",
      inventoryAlerts: 1,
      recentTransactions: [
        { drug: "Ketamine 500mg/10mL", user: "RN Megan Taylor", timestamp: "5 mins ago", auditStatus: "VERIFIED_DUAL_WITNESS" },
        { drug: "Rocuronium Bromide 100mg", user: "RN Lisa Ray", timestamp: "18 mins ago", auditStatus: "VERIFIED_CRITICAL_RSI" }
      ],
      highAlertStock: [
        { name: "Ketamine 500mg/10mL", count: 8, unit: "Vials (LOW)", reorderLevel: 10 },
        { name: "Succinylcholine 200mg", count: 25, unit: "Vials", reorderLevel: 15 }
      ]
    }
  ]);

  const [selectedCabinetAudit, setSelectedCabinetAudit] = useState(null);

  // =========================================================================
  // MODULE 4: RADIOLOGY & PACS IMAGING TELEMETRY STATE
  // =========================================================================
  const [pacsScans, setPacsScans] = useState([
    {
      accessionNumber: "ACC-2026-99041",
      patientName: "Jonathan Vance",
      modality: "CT_TRAUMA_PAN_SCAN",
      priority: "STAT_RED_ALERT",
      aiDiagnosticSummary: "Acute Epidural Hematoma Detected (14mm thickness) + Midline Shift (4mm)",
      radiologistSignOff: "PENDING_DR_CHEN_REVIEW",
      dicomSeriesCount: 1420,
      acquisitionTime: "2026-08-15 01:12:00 UTC"
    },
    {
      accessionNumber: "ACC-2026-99042",
      patientName: "Elena Rostova",
      modality: "STAT_CHEST_XRAY_PORTABLE",
      priority: "STAT_RED_ALERT",
      aiDiagnosticSummary: "Bilateral Pulmonary Edema + Cardiomegaly (Consistent with Acute CHF)",
      radiologistSignOff: "APPROVED_DR_PATEL",
      dicomSeriesCount: 4,
      acquisitionTime: "2026-08-15 01:05:00 UTC"
    },
    {
      accessionNumber: "ACC-2026-99043",
      patientName: "David Kim",
      modality: "XRAY_LOWER_EXTREMITY",
      priority: "URGENT",
      aiDiagnosticSummary: "Complete Displaced Mid-Shaft Femoral Fracture",
      radiologistSignOff: "APPROVED_DR_PATEL",
      dicomSeriesCount: 8,
      acquisitionTime: "2026-08-15 00:50:00 UTC"
    }
  ]);

  const [dicomViewerModal, setDicomViewerModal] = useState(null);

  // =========================================================================
  // MODULE 5: INPATIENT BED CAPACITY & STEP-DOWN STATE
  // =========================================================================
  const [bedUnits, setBedUnits] = useState([
    {
      unitName: "Medical Intensive Care Unit (MICU)",
      totalBeds: 24,
      occupiedBeds: 22,
      pendingDischarges: 2,
      isolationBedsInUse: 4,
      acuityScoreAvg: 4.8,
      nurseToPatientRatio: "1:1 / 1:2"
    },
    {
      unitName: "Cardiovascular ICU (CVICU)",
      totalBeds: 16,
      occupiedBeds: 15,
      pendingDischarges: 1,
      isolationBedsInUse: 2,
      acuityScoreAvg: 4.9,
      nurseToPatientRatio: "1:1"
    },
    {
      unitName: "Step-Down Progressive Care (PCU)",
      totalBeds: 40,
      occupiedBeds: 36,
      pendingDischarges: 5,
      isolationBedsInUse: 6,
      acuityScoreAvg: 3.2,
      nurseToPatientRatio: "1:3"
    },
    {
      unitName: "General Medical Surgical (Med-Surg)",
      totalBeds: 120,
      occupiedBeds: 112,
      pendingDischarges: 14,
      isolationBedsInUse: 12,
      acuityScoreAvg: 2.1,
      nurseToPatientRatio: "1:5"
    }
  ]);

  // =========================================================================
  // MODULE 6: CODE BLUE & RAPID RESPONSE TELEMETRY STATE
  // =========================================================================
  const [codeBlueEvents, setCodeBlueEvents] = useState([
    {
      eventId: "CODE-BLUE-401",
      location: "Building A - 4th Floor Med-Surg Room 412",
      patientName: "Robert Harrison (Age 71)",
      rhythmAudiogram: "Ventricular Fibrillation (V-Fib)",
      cprCycleMinutes: "04:12 (2nd Shock Administered 200J)",
      epinephrineDoses: 2,
      codeTeamLead: "Dr. Marcus Vance, MD (ICU Attending)",
      status: "CODE_ACTIVE_RESUSCITATION",
      defibrillatorTelemetry: "ZOLL R Series Connected (Pad Impedance: 48 Ohms)"
    },
    {
      eventId: "RRT-ALERT-208",
      location: "Building B - 2nd Floor Step-Down Room 218",
      patientName: "Martha Stewart (Age 65)",
      rhythmAudiogram: "Sinus Tachycardia (142 bpm) + Hypotension (78/42)",
      cprCycleMinutes: "N/A (Pre-Arrest Sepsis Evaluation)",
      epinephrineDoses: 0,
      codeTeamLead: "Dr. Sarah Jenkins, MD",
      status: "RRT_ON_SCENE_STABILIZING",
      defibrillatorTelemetry: "MONITORING_ONLY"
    }
  ]);

  // =========================================================================
  // MODULE 7: AUDIT LOGS & HIPAA AUDIT STREAM STATE
  // =========================================================================
  const [auditLogs, setAuditLogs] = useState([
    {
      logId: "AUD-99401",
      timestamp: "2026-08-15 01:28:14 UTC",
      subsystem: "PHARMACY_ADC_PYXIS",
      action: "DUAL_BIOMETRIC_OPEN_NARCOTICS_VAULT",
      user: "RN Sarah Jenkins (ID: RN-44021)",
      ipAddress: "10.240.12.88",
      hashIntegrity: "0x7f3a9b12c4e"
    },
    {
      logId: "AUD-99402",
      timestamp: "2026-08-15 01:25:02 UTC",
      subsystem: "RADIOLOGY_PACS",
      action: "STAT_AI_DIAGNOSTIC_SIGN_OFF",
      user: "Dr. Robert Chen, MD (ID: MD-1104)",
      ipAddress: "10.240.18.42",
      hashIntegrity: "0x8901c4e99f"
    },
    {
      logId: "AUD-99403",
      timestamp: "2026-08-15 01:20:45 UTC",
      subsystem: "SURGICAL_OR",
      action: "ANESTHESIA_BIS_TELEMETRY_LOG",
      user: "Dr. Helen Vance, MD (ID: MD-0092)",
      ipAddress: "10.240.15.19",
      hashIntegrity: "0x12a88f4b02"
    }
  ]);

  // =========================================================================
  // LIVE TELEMETRY SIMULATOR EFFECT
  // =========================================================================
  useEffect(() => {
    if (!liveTelemetryActive) return;

    const interval = setInterval(() => {
      // 1. Update trauma bay vitals slightly
      setTraumaBeds((prev) =>
        prev.map((b) => {
          const hrShift = Math.floor(Math.random() * 5) - 2;
          const newHr = Math.max(50, Math.min(170, b.vitals.hr + hrShift));
          return {
            ...b,
            vitals: {
              ...b.vitals,
              hr: newHr
            }
          };
        })
      );

      // 2. Update OR Bispectral index
      setOperatingRooms((prev) =>
        prev.map((or) => {
          if (or.status === "PROCEDURE_IN_PROGRESS") {
            const bisShift = Math.floor(Math.random() * 3) - 1;
            const newBis = Math.max(35, Math.min(55, (or.anesthesiaTelemetry.bispectrumIndex || 45) + bisShift));
            return {
              ...or,
              anesthesiaTelemetry: {
                ...or.anesthesiaTelemetry,
                bispectrumIndex: newBis
              }
            };
          }
          return or;
        })
      );
    }, 4000);

    return () => clearInterval(interval);
  }, [liveTelemetryActive]);

  // =========================================================================
  // HANDLERS
  // =========================================================================
  const handleAdmitTrauma = (e) => {
    e.preventDefault();
    if (!dispatchForm.patientName.trim()) {
      setNotification({ type: "error", message: "Patient name is required." });
      return;
    }

    const newBay = {
      bayId: dispatchForm.bayId,
      patientName: dispatchForm.patientName.trim(),
      esiLevel: dispatchForm.esiLevel,
      chiefComplaint: dispatchForm.chiefComplaint || "Trauma Intake",
      vitals: { hr: 105, bp: "130/85", spO2: 96, rr: 20, temp: "36.8 °C" },
      assignedPhysician: "Dr. Marcus Vance, MD",
      assignedNurse: "RN Triage Pool",
      etaCADAmbulance: dispatchForm.etaCADAmbulance,
      mciCategory: dispatchForm.esiLevel.includes("ESI-1") ? "IMMEDIATE_RED" : "DELAYED_YELLOW"
    };

    setTraumaBeds((prev) => [newBay, ...prev]);
    setDispatchModalOpen(false);
    setNotification({
      type: "success",
      message: `CAD Ambulance Intake dispatched to ${newBay.bayId} for '${newBay.patientName}'!`
    });
  };

  const handleToggleMciMode = () => {
    setMciModeEnabled(!mciModeEnabled);
    setNotification({
      type: mciModeEnabled ? "info" : "warning",
      message: mciModeEnabled
        ? "Mass Casualty Incident (MCI) Protocol DEACTIVATED. Normal ED Triage restored."
        : "ALERT: Mass Casualty Incident (MCI) Protocol ACTIVATED! Reverse triage & surge beds initialized."
    });
  };

  const handleApprovePACS = (accessionNumber) => {
    setPacsScans((prev) =>
      prev.map((s) =>
        s.accessionNumber === accessionNumber
          ? { ...s, radiologistSignOff: "APPROVED_DR_CHEN_VERIFIED" }
          : s
      )
    );
    setNotification({
      type: "success",
      message: `DICOM Scan ${accessionNumber} verified and signed off by Radiologist!`
    });
  };

  const handleRefillPyxis = (cabinetId, drugName) => {
    setAdcCabinets((prev) =>
      prev.map((c) => {
        if (c.cabinetId === cabinetId) {
          return {
            ...c,
            inventoryAlerts: 0,
            highAlertStock: c.highAlertStock.map((s) =>
              s.name === drugName ? { ...s, count: s.count + 20 } : s
            )
          };
        }
        return c;
      })
    );
    setNotification({
      type: "success",
      message: `Pyxis Cabinet '${cabinetId}' refilled for ${drugName} (+20 units).`
    });
  };

  const handleAdministerDefibShock = (eventId) => {
    setCodeBlueEvents((prev) =>
      prev.map((ev) =>
        ev.eventId === eventId
          ? {
              ...ev,
              epinephrineDoses: ev.epinephrineDoses + 1,
              defibrillatorTelemetry: "SHOCK_DELIVERED_200J_ROSC_EVALUATION"
            }
          : ev
      )
    );
    setNotification({
      type: "warning",
      message: `Biphasic Defibrillator Shock (200J) administered for ${eventId}.`
    });
  };

  // Filtered lists based on global search
  const filteredTraumaBeds = useMemo(() => {
    return traumaBeds.filter(
      (b) =>
        b.patientName.toLowerCase().includes(globalSearch.toLowerCase()) ||
        b.bayId.toLowerCase().includes(globalSearch.toLowerCase()) ||
        b.chiefComplaint.toLowerCase().includes(globalSearch.toLowerCase())
    );
  }, [traumaBeds, globalSearch]);

  const filteredORs = useMemo(() => {
    return operatingRooms.filter(
      (or) =>
        or.procedureName.toLowerCase().includes(globalSearch.toLowerCase()) ||
        or.surgeon.toLowerCase().includes(globalSearch.toLowerCase()) ||
        or.orSuiteId.toLowerCase().includes(globalSearch.toLowerCase())
    );
  }, [operatingRooms, globalSearch]);

  const filteredPACS = useMemo(() => {
    return pacsScans.filter(
      (s) =>
        s.patientName.toLowerCase().includes(globalSearch.toLowerCase()) ||
        s.accessionNumber.toLowerCase().includes(globalSearch.toLowerCase()) ||
        s.modality.toLowerCase().includes(globalSearch.toLowerCase())
    );
  }, [pacsScans, globalSearch]);

  return (
    <div className="w-full min-h-screen bg-slate-950 text-slate-100 font-sans p-4 md:p-8 space-y-6">
      
      {/* 1. TOP HEADER & SYSTEM CONTROL BAR */}
      <div className="max-w-7xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-full flex items-center gap-1.5 font-mono">
                <Siren size={13} className="animate-pulse text-rose-500" /> HOSPITAL COMMAND ORCHESTRATION
              </span>
              <span className="px-3 py-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-1">
                <ShieldCheck size={13} /> LEVEL 1 TRAUMA & FDA COMPLIANT
              </span>
              {mciModeEnabled && (
                <span className="px-3 py-1 text-xs font-black text-amber-400 bg-amber-500/20 border border-amber-500/40 rounded-full animate-bounce flex items-center gap-1">
                  <AlertTriangle size={13} /> MASS CASUALTY PROTOCOL ACTIVE
                </span>
              )}
            </div>

            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Enterprise Hospital Command Center & Multi-Subsystem Suite
            </h1>
            <p className="text-slate-400 text-sm max-w-3xl leading-relaxed">
              Unified clinical management platform integrating ED Trauma CAD Dispatch, Operating Room Logistics, Automated Dispensing Cabinets (Pyxis), DICOM PACS Imaging, Bed Capacity, Code Blue Telemetry, and HIPAA Audit Stream.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
            <button
              type="button"
              onClick={handleToggleMciMode}
              className={`w-full sm:w-auto px-5 py-3 font-bold text-xs rounded-2xl transition shadow-lg flex items-center justify-center gap-2 ${
                mciModeEnabled
                  ? "bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/30"
                  : "bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/30"
              }`}
            >
              <AlertTriangle size={15} /> {mciModeEnabled ? "Deactivate MCI Mode" : "Activate MCI Surge Protocol"}
            </button>

            <button
              type="button"
              onClick={() => setDispatchModalOpen(true)}
              className="w-full sm:w-auto px-5 py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-2xl transition shadow-lg shadow-rose-600/25 flex items-center justify-center gap-2"
            >
              <Plus size={16} /> CAD Ambulance Intake
            </button>
          </div>
        </div>

        {/* Global System Notifications */}
        {notification.message && (
          <div
            className={`mt-6 p-4 rounded-2xl text-xs font-bold flex items-center justify-between border ${
              notification.type === "error"
                ? "bg-red-500/10 border-red-500/30 text-red-400"
                : notification.type === "warning"
                ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
            }`}
          >
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

      {/* 2. NAVIGATION TABS & SEARCH CONTROL */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
          {[
            { id: "EMERGENCY_TRAUMA", label: "ED Trauma Dispatch", icon: Siren },
            { id: "SURGICAL_SUITE", label: "OR Logistics", icon: Crosshair },
            { id: "PHARMACY_ADC", label: "Pyxis Pharmacy", icon: Pill },
            { id: "RADIOLOGY_PACS", label: "PACS Radiology", icon: Monitor },
            { id: "BED_CAPACITY", label: "Bed Capacity", icon: Bed },
            { id: "CODE_BLUE", label: "Code Blue Resuscitation", icon: Zap },
            { id: "AUDIT_LOGS", label: "HIPAA Audit Stream", icon: Terminal }
          ].map((tab) => {
            const IconComp = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveModule(tab.id)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
                  activeModule === tab.id
                    ? "bg-rose-600 text-white shadow-lg shadow-rose-600/20"
                    : "bg-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                <IconComp size={15} /> {tab.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search size={14} className="absolute left-3 top-3 text-slate-500" />
            <input
              type="text"
              placeholder="Global Command Search..."
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>
          <button
            type="button"
            onClick={() => setLiveTelemetryActive(!liveTelemetryActive)}
            className={`px-3 py-2 text-xs font-mono rounded-xl font-bold border transition flex items-center gap-1.5 ${
              liveTelemetryActive
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                : "bg-slate-800 border-slate-700 text-slate-400"
            }`}
          >
            <Radio size={13} className={liveTelemetryActive ? "animate-pulse" : ""} />
            {liveTelemetryActive ? "LIVE TELEMETRY" : "PAUSED"}
          </button>
        </div>
      </div>

      {/* =========================================================================
          MODULE 1: EMERGENCY DEPARTMENT TRAUMA CAD DISPATCH
          ========================================================================= */}
      {activeModule === "EMERGENCY_TRAUMA" && (
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-1">
              <span className="text-slate-500 text-[10px] uppercase font-bold block">Level 1 Trauma Bays</span>
              <strong className="text-2xl font-black text-rose-400">{traumaBeds.length} Bays Active</strong>
            </div>
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-1">
              <span className="text-slate-500 text-[10px] uppercase font-bold block">ESI-1 Critical Patients</span>
              <strong className="text-2xl font-black text-red-500">
                {traumaBeds.filter((b) => b.esiLevel.includes("ESI-1")).length} Patients
              </strong>
            </div>
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-1">
              <span className="text-slate-500 text-[10px] uppercase font-bold block">In-Transit Ambulances (CAD)</span>
              <strong className="text-2xl font-black text-cyan-400">2 En Route</strong>
            </div>
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-1">
              <span className="text-slate-500 text-[10px] uppercase font-bold block">Average ED Wait Time</span>
              <strong className="text-2xl font-black text-emerald-400">12 Minutes</strong>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredTraumaBeds.map((bed) => (
              <div
                key={bed.bayId}
                className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl hover:border-rose-500/40 transition"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 text-xs font-bold font-mono text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg">
                      {bed.bayId}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full border ${
                        bed.mciCategory.includes("IMMEDIATE")
                          ? "bg-red-500/20 text-red-400 border-red-500/30 animate-pulse"
                          : "bg-amber-500/20 text-amber-400 border-amber-500/30"
                      }`}
                    >
                      {bed.mciCategory}
                    </span>
                  </div>

                  <span className="text-xs font-mono text-cyan-400 font-bold">{bed.etaCADAmbulance}</span>
                </div>

                <div className="space-y-1">
                  <h3 className="text-base font-bold text-white font-mono">{bed.patientName}</h3>
                  <p className="text-xs text-rose-300 font-sans font-semibold">{bed.chiefComplaint}</p>
                </div>

                {/* Vitals Grid */}
                <div className="grid grid-cols-5 gap-2 p-3 bg-slate-950 border border-slate-800 rounded-2xl text-center text-xs font-mono">
                  <div>
                    <span className="text-[10px] text-slate-500 block">HR</span>
                    <strong className="text-rose-400 font-bold">{bed.vitals.hr} bpm</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">BP</span>
                    <strong className="text-purple-300">{bed.vitals.bp}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">SpO2</span>
                    <strong className="text-sky-400 font-bold">{bed.vitals.spO2}%</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">RR</span>
                    <strong className="text-amber-400">{bed.vitals.rr}/m</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Temp</span>
                    <strong className="text-slate-300">{bed.vitals.temp}</strong>
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs font-mono text-slate-400 pt-2 border-t border-slate-800">
                  <div>Physician: <strong className="text-white">{bed.assignedPhysician}</strong></div>
                  <div>Nurse: <strong className="text-white">{bed.assignedNurse}</strong></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          MODULE 2: OPERATING ROOM & SURGICAL LOGISTICS
          ========================================================================= */}
      {activeModule === "SURGICAL_SUITE" && (
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Crosshair size={18} className="text-rose-400" /> Operating Room (OR) Surgical Suite Logistics & Anesthesia Telemetry
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {filteredORs.map((or) => (
                <div
                  key={or.orSuiteId}
                  className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 text-[11px] font-bold font-mono text-purple-400 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                        {or.orSuiteId}
                      </span>
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                          or.status.includes("PROGRESS")
                            ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                            : "bg-amber-500/20 text-amber-400 border-amber-500/30"
                        }`}
                      >
                        {or.status}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-white font-mono leading-snug">{or.procedureName}</h4>
                    <p className="text-xs text-slate-400">Surgeon: <strong className="text-white">{or.surgeon}</strong></p>

                    {/* Anesthesia Telemetry */}
                    {or.status.includes("PROGRESS") && (
                      <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1.5 text-xs font-mono">
                        <div className="text-slate-500 text-[10px] font-bold uppercase">Anesthesia Gas & BIS Monitor</div>
                        <div className="flex justify-between">
                          <span>Bispectral Index (BIS):</span>
                          <strong className="text-cyan-400 font-bold">{or.anesthesiaTelemetry.bispectrumIndex} (Sedated)</strong>
                        </div>
                        <div className="flex justify-between">
                          <span>End-Tidal CO2 (etCO2):</span>
                          <strong className="text-emerald-400">{or.anesthesiaTelemetry.etCO2}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span>Airway Pressure:</span>
                          <strong className="text-amber-400">{or.anesthesiaTelemetry.peakAirwayPressure}</strong>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
                    <span>{or.estimatedCompletion}</span>
                    <button
                      type="button"
                      onClick={() => setOrInspectModal(or)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-bold"
                    >
                      Inspect OR
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODULE 3: PHARMACY ADC & NARCOTICS VAULT
          ========================================================================= */}
      {activeModule === "PHARMACY_ADC" && (
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Pill size={18} className="text-emerald-400" /> Automated Dispensing Cabinets (Pyxis) & Narcotics Vault Audit
              </h3>
              <span className="px-3 py-1 text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full font-bold">
                DUAL-BIOMETRIC ACCESS CONTROL
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {adcCabinets.map((adc) => (
                <div key={adc.cabinetId} className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="text-sm font-bold text-white font-mono">{adc.cabinetId}</h4>
                      <p className="text-xs text-slate-400">{adc.location}</p>
                    </div>
                    <span className="px-2.5 py-1 text-[10px] font-bold font-mono text-purple-300 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                      {adc.narcoticsVaultLock}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-400 uppercase font-mono block">High-Alert Controlled Stock</span>
                    <div className="space-y-1 text-xs font-mono">
                      {adc.highAlertStock.map((stock, i) => (
                        <div key={i} className="flex justify-between p-2 bg-slate-900 rounded-xl border border-slate-800">
                          <span className="text-white">{stock.name}</span>
                          <div className="flex items-center gap-3">
                            <strong className={stock.count <= stock.reorderLevel ? "text-red-400" : "text-emerald-400"}>
                              {stock.count} {stock.unit}
                            </strong>
                            {stock.count <= stock.reorderLevel && (
                              <button
                                type="button"
                                onClick={() => handleRefillPyxis(adc.cabinetId, stock.name)}
                                className="px-2 py-0.5 bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-bold rounded"
                              >
                                Refill Pyxis
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setSelectedCabinetAudit(adc)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl flex items-center gap-1.5"
                    >
                      <FileText size={14} /> Full Transaction Audit Log
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODULE 4: RADIOLOGY & PACS IMAGING TELEMETRY
          ========================================================================= */}
      {activeModule === "RADIOLOGY_PACS" && (
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Monitor size={18} className="text-sky-400" /> DICOM PACS Radiology Imaging & STAT AI Diagnostic Triage
            </h3>

            <div className="space-y-4">
              {filteredPACS.map((scan) => (
                <div
                  key={scan.accessionNumber}
                  className="p-5 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 font-mono text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="text-sky-400 font-bold">{scan.accessionNumber}</span>
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-red-500/20 text-red-400 border border-red-500/30">
                        {scan.priority}
                      </span>
                      <span className="text-slate-400">{scan.modality} ({scan.dicomSeriesCount} slices)</span>
                    </div>
                    <h4 className="text-sm font-bold text-white font-sans">{scan.patientName}</h4>
                    <p className="text-amber-300 font-sans">AI Diagnostic Finding: {scan.aiDiagnosticSummary}</p>
                  </div>

                  <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                    {scan.radiologistSignOff.includes("PENDING") ? (
                      <button
                        type="button"
                        onClick={() => handleApprovePACS(scan.accessionNumber)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl"
                      >
                        Sign Off Scan
                      </button>
                    ) : (
                      <span className="px-3 py-1 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl font-bold">
                        {scan.radiologistSignOff}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => setDicomViewerModal(scan)}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl"
                    >
                      <Eye size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODULE 5: INPATIENT BED CAPACITY & STEP-DOWN
          ========================================================================= */}
      {activeModule === "BED_CAPACITY" && (
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {bedUnits.map((unit) => {
              const occupancyPct = Math.round((unit.occupiedBeds / unit.totalBeds) * 100);
              return (
                <div key={unit.unitName} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
                  <h4 className="text-xs font-bold text-white font-mono truncate">{unit.unitName}</h4>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-slate-400">Occupancy:</span>
                      <strong className={occupancyPct > 90 ? "text-red-400" : "text-emerald-400"}>
                        {unit.occupiedBeds} / {unit.totalBeds} Beds ({occupancyPct}%)
                      </strong>
                    </div>
                    {/* Progress bar */}
                    <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${occupancyPct > 90 ? "bg-red-500" : "bg-emerald-500"}`}
                        style={{ width: `${occupancyPct}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-1 text-xs font-mono text-slate-400">
                    <div className="flex justify-between">
                      <span>Pending Discharges:</span>
                      <span className="text-amber-400 font-bold">{unit.pendingDischarges}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Nurse Ratio:</span>
                      <span className="text-slate-200">{unit.nurseToPatientRatio}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =========================================================================
          MODULE 6: CODE BLUE & RAPID RESPONSE TELEMETRY
          ========================================================================= */}
      {activeModule === "CODE_BLUE" && (
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Zap size={18} className="text-amber-400 animate-bounce" /> Code Blue & Rapid Response Team (RRT) Active Resuscitation Station
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {codeBlueEvents.map((ev) => (
                <div key={ev.eventId} className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="px-3 py-1 text-xs font-bold font-mono text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg">
                      {ev.eventId}
                    </span>
                    <span className="px-3 py-0.5 text-[10px] font-bold font-mono text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-full animate-pulse">
                      {ev.status}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-white font-mono">{ev.patientName}</h4>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">{ev.location}</p>
                  </div>

                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1.5 text-xs font-mono">
                    <div className="flex justify-between text-red-400">
                      <span>ECG Rhythm:</span>
                      <strong className="font-bold">{ev.rhythmAudiogram}</strong>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>CPR Elapsed:</span>
                      <span>{ev.cprCycleMinutes}</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Epi Doses Administered:</span>
                      <span className="text-amber-400 font-bold">{ev.epinephrineDoses} Doses (1mg IV)</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handleAdministerDefibShock(ev.eventId)}
                      className="flex-1 py-2 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
                    >
                      <Zap size={14} /> Deliver 200J Biphasic Shock
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODULE 7: AUDIT LOGS & HIPAA AUDIT STREAM
          ========================================================================= */}
      {activeModule === "AUDIT_LOGS" && (
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Terminal size={18} className="text-purple-400" /> HIPAA Security Rule Cryptographic Audit Log Stream
            </h3>

            <div className="space-y-2 font-mono text-xs">
              {auditLogs.map((log) => (
                <div key={log.logId} className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-slate-300">
                  <div className="flex items-center gap-4">
                    <span className="text-purple-400 font-bold">{log.logId}</span>
                    <span className="text-slate-500">{log.timestamp}</span>
                    <span className="px-2 py-0.5 text-[10px] bg-slate-800 text-white rounded">{log.subsystem}</span>
                    <span className="text-white font-bold">{log.action}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-slate-400">{log.user}</span>
                    <span className="text-emerald-400 text-[10px]">{log.hashIntegrity}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODALS & OVERLAYS
          ========================================================================= */}

      {/* CAD Dispatch Modal */}
      {dispatchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full text-slate-100 space-y-4 shadow-2xl font-sans">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Siren size={18} className="text-rose-400" /> CAD Ambulance Intake Dispatch
              </h3>
              <button type="button" onClick={() => setDispatchModalOpen(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAdmitTrauma} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 font-bold block mb-1">Patient Name & Demographics</label>
                <input
                  type="text"
                  placeholder="e.g. John Doe (Unidentified Adult Male)"
                  value={dispatchForm.patientName}
                  onChange={(e) => setDispatchForm({ ...dispatchForm, patientName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="text-slate-400 font-bold block mb-1">Chief Complaint & CAD Telemetry</label>
                <input
                  type="text"
                  placeholder="e.g. Penetrating Chest Trauma - Intubated by Paramedics"
                  value={dispatchForm.chiefComplaint}
                  onChange={(e) => setDispatchForm({ ...dispatchForm, chiefComplaint: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setDispatchModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold text-xs transition shadow-lg shadow-rose-600/20"
                >
                  Dispatch Intake Bay
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DICOM Viewer Modal */}
      {dicomViewerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-2xl w-full text-slate-100 space-y-4 shadow-2xl font-mono">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white font-sans">
                DICOM Imaging Viewer - {dicomViewerModal.accessionNumber}
              </h3>
              <button type="button" onClick={() => setDicomViewerModal(null)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="w-full h-64 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col items-center justify-center text-slate-500 space-y-2 relative overflow-hidden">
              <div className="absolute inset-0 bg-cyan-500/5 animate-pulse" />
              <Monitor size={48} className="text-sky-400" />
              <span className="text-xs font-bold text-white">{dicomViewerModal.modality} Interactive 3D Render</span>
              <span className="text-[10px] text-slate-400">128-Slice High Resolution DICOM Stream Loaded</span>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl text-xs space-y-1">
              <div>Patient: <strong className="text-white font-sans">{dicomViewerModal.patientName}</strong></div>
              <div>AI Diagnostic Summary: <span className="text-amber-300">{dicomViewerModal.aiDiagnosticSummary}</span></div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setDicomViewerModal(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-xs font-sans"
              >
                Close Viewer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Selected Pyxis Cabinet Audit Modal */}
      {selectedCabinetAudit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-xl w-full text-slate-100 space-y-4 shadow-2xl font-mono">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white font-sans">Pyxis Audit Log - {selectedCabinetAudit.cabinetId}</h3>
              <button type="button" onClick={() => setSelectedCabinetAudit(null)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              {selectedCabinetAudit.recentTransactions.map((tx, idx) => (
                <div key={idx} className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex justify-between">
                  <div>
                    <strong className="text-white block">{tx.drug}</strong>
                    <span className="text-slate-400 text-[10px]">{tx.user} • {tx.timestamp}</span>
                  </div>
                  <span className="text-emerald-400 font-bold text-[10px]">{tx.auditStatus}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedCabinetAudit(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-xs font-sans"
              >
                Close Audit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OR Inspection Modal */}
      {orInspectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full text-slate-100 space-y-4 shadow-2xl font-mono">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white font-sans">{orInspectModal.orSuiteId} Inspection</h3>
              <button type="button" onClick={() => setOrInspectModal(null)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl text-xs space-y-2">
              <div>Procedure: <strong className="text-purple-300 font-sans">{orInspectModal.procedureName}</strong></div>
              <div>Surgeon: <span className="text-slate-300">{orInspectModal.surgeon}</span></div>
              <div>Anesthesiologist: <span className="text-slate-300">{orInspectModal.anesthesiologist}</span></div>
              <div>Sterility Check: <span className="text-emerald-400">{orInspectModal.sterilityVerification}</span></div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setOrInspectModal(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-xs font-sans"
              >
                Close Inspection
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
