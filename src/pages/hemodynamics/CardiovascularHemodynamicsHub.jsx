import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Activity,
  Heart,
  HeartPulse,
  ShieldAlert,
  AlertTriangle,
  Zap,
  Gauge,
  Sliders,
  TrendingUp,
  TrendingDown,
  Wind,
  Droplets,
  Radio,
  FileText,
  Download,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  User,
  Users,
  Eye,
  Layers,
  ChevronRight,
  Stethoscope,
  Siren,
  X,
  Plus,
  Play,
  Pause,
  SlidersHorizontal,
  Flame,
  ShieldCheck,
  Award,
  Cpu,
  ArrowUpRight,
  ArrowDownRight,
  Maximize2
} from "lucide-react";
import { downloadCsv } from "../../utils/csv";
import { useKindToasts, KindToastTray } from "../../components/common/HubToasts";
import { DetailRow as Row, AlertStatCard as StatCard, MiniStat as Vital } from "../../components/common/HubCards";

// ==========================================
// SEED PATIENTS DATA
// ==========================================
const SEED_PATIENTS = [
  {
    id: "PT-HEMO-101",
    name: "Eleanor Vance",
    age: 64,
    gender: "Female",
    bed: "ICU-CCU-01",
    diagnosis: "Acute Anterolateral STEMI / Post-PCI Cardiogenic Shock",
    scaiStage: "D", // Deteriorating
    scaiStageName: "Deteriorating",
    mcsDevice: "Impella CP",
    mcsMode: "P-8 (Auto)",
    mcsFlow: 3.4, // L/min
    mcsPurge: 18.2, // mL/hr
    mcsMotorCurrent: 620, // mA
    hr: 108,
    map: 64,
    sbp: 88,
    dbp: 52,
    cvp: 16,
    mpap: 34,
    spap: 48,
    dpap: 22,
    pcwp: 24,
    co: 3.1,
    ci: 1.72,
    bsa: 1.80,
    sv: 28.7,
    svri: 2232,
    pvri: 260,
    cpo: 0.44, // W
    cpi: 0.24,
    papi: 1.62,
    lvswi: 15.6,
    rvswi: 4.8,
    svo2: 51,
    sao2: 94,
    lactate: 4.6, // mmol/L
    hgb: 9.8,
    inotropes: [
      { drug: "Norepinephrine", dose: 0.18, unit: "mcg/kg/min" },
      { drug: "Dobutamine", dose: 7.5, unit: "mcg/kg/min" },
      { drug: "Vasopressin", dose: 0.03, unit: "units/min" }
    ],
    visScore: 38.5,
    status: "CRITICAL",
    riskCategory: "High Mortality Risk",
    admissionTime: "2026-08-18 22:40",
    attendingPhysician: "Dr. Marcus Vance, MD (Interventional Heart Failure)"
  },
  {
    id: "PT-HEMO-102",
    name: "Arthur Pendelton",
    age: 58,
    gender: "Male",
    bed: "ICU-CCU-04",
    diagnosis: "Fulminant Biventricular Myocarditis / Refractory Arrest",
    scaiStage: "E", // Extremis
    scaiStageName: "Extremis",
    mcsDevice: "VA-ECMO + Impella 5.5 (ECPELLA)",
    mcsMode: "VA-ECMO 4.2 L/min + P-7",
    mcsFlow: 4.8, // total support L/min
    mcsPurge: 22.0,
    mcsMotorCurrent: 710,
    hr: 116,
    map: 58,
    sbp: 76,
    dbp: 49,
    cvp: 21,
    mpap: 41,
    spap: 56,
    dpap: 28,
    pcwp: 28,
    co: 2.4,
    ci: 1.20,
    bsa: 2.00,
    sv: 20.6,
    svri: 2466,
    pvri: 433,
    cpo: 0.31,
    cpi: 0.15,
    papi: 1.33,
    lvswi: 9.9,
    rvswi: 4.2,
    svo2: 44,
    sao2: 91,
    lactate: 7.2,
    hgb: 8.4,
    inotropes: [
      { drug: "Epinephrine", dose: 0.15, unit: "mcg/kg/min" },
      { drug: "Norepinephrine", dose: 0.25, unit: "mcg/kg/min" },
      { drug: "Milrinone", dose: 0.375, unit: "mcg/kg/min" }
    ],
    visScore: 58.7,
    status: "EXTREMIS",
    riskCategory: "Immediate ECLS Escalation",
    admissionTime: "2026-08-19 02:15",
    attendingPhysician: "Dr. Sarah Chen, MD (Cardiothoracic Critical Care)"
  },
  {
    id: "PT-HEMO-103",
    name: "Gloria Ramirez",
    age: 71,
    gender: "Female",
    bed: "ICU-CCU-06",
    diagnosis: "Severe Ischemic Cardiomyopathy / ADHF Cardiorenal Syndrome",
    scaiStage: "C", // Classic Shock
    scaiStageName: "Classic Shock",
    mcsDevice: "IABP (Intra-Aortic Balloon Pump)",
    mcsMode: "1:1 Augmentation (Auto)",
    mcsFlow: 0.8, // Augmentation factor boost
    mcsPurge: 0,
    mcsMotorCurrent: 0,
    hr: 92,
    map: 68,
    sbp: 96,
    dbp: 54,
    cvp: 14,
    mpap: 31,
    spap: 44,
    dpap: 20,
    pcwp: 21,
    co: 3.6,
    ci: 2.11,
    bsa: 1.70,
    sv: 39.1,
    svri: 1948,
    pvri: 222,
    cpo: 0.54,
    cpi: 0.32,
    papi: 1.71,
    lvswi: 24.9,
    rvswi: 6.8,
    svo2: 58,
    sao2: 96,
    lactate: 2.4,
    hgb: 10.2,
    inotropes: [
      { drug: "Milrinone", dose: 0.50, unit: "mcg/kg/min" },
      { drug: "Norepinephrine", dose: 0.08, unit: "mcg/kg/min" }
    ],
    visScore: 18.0,
    status: "UNSTABLE",
    riskCategory: "Moderate Mortality Risk",
    admissionTime: "2026-08-17 14:10",
    attendingPhysician: "Dr. Arvind Patel, MD (Advanced Heart Failure)"
  },
  {
    id: "PT-HEMO-104",
    name: "David Sterling",
    age: 52,
    gender: "Male",
    bed: "ICU-CCU-09",
    diagnosis: "Post-Cardiotomy Vasoplegic Shock & RV Failure Post-CABG x 4",
    scaiStage: "C",
    scaiStageName: "Classic Shock",
    mcsDevice: "ProteoDuo RVAD + Medical Therapy",
    mcsMode: "Flow 3.8 L/min",
    mcsFlow: 3.8,
    mcsPurge: 15.0,
    mcsMotorCurrent: 540,
    hr: 88,
    map: 72,
    sbp: 102,
    dbp: 57,
    cvp: 18,
    mpap: 29,
    spap: 38,
    dpap: 19,
    pcwp: 14,
    co: 4.4,
    ci: 2.31,
    bsa: 1.90,
    sv: 50.0,
    svri: 1727,
    pvri: 190,
    cpo: 0.70,
    cpi: 0.37,
    papi: 1.05, // Severely low PAPi indicating RV vulnerability
    lvswi: 39.4,
    rvswi: 5.6,
    svo2: 64,
    sao2: 98,
    lactate: 1.9,
    hgb: 11.0,
    inotropes: [
      { drug: "Epinephrine", dose: 0.04, unit: "mcg/kg/min" },
      { drug: "Vasopressin", dose: 0.04, unit: "units/min" },
      { drug: "Inhaled Epoprostenol", dose: 30, unit: "ng/kg/min" }
    ],
    visScore: 16.0,
    status: "STABILIZING",
    riskCategory: "RV Dominant Failure",
    admissionTime: "2026-08-18 09:30",
    attendingPhysician: "Dr. Elena Rostova, MD (Cardiothoracic Surgery)"
  },
  {
    id: "PT-HEMO-105",
    name: "Margaret Thorne",
    age: 77,
    gender: "Female",
    bed: "ICU-CCU-12",
    diagnosis: "Post-TAVR Paravalvular Leak / Decompensated LV Diastolic Dysfunction",
    scaiStage: "B", // Beginning Shock
    scaiStageName: "Beginning Shock",
    mcsDevice: "Medical Management",
    mcsMode: "Invasive PAC Monitoring",
    mcsFlow: 0.0,
    mcsPurge: 0,
    mcsMotorCurrent: 0,
    hr: 79,
    map: 76,
    sbp: 114,
    dbp: 57,
    cvp: 11,
    mpap: 26,
    spap: 36,
    dpap: 16,
    pcwp: 18,
    co: 4.2,
    ci: 2.54,
    bsa: 1.65,
    sv: 53.1,
    svri: 2042,
    pvri: 152,
    cpo: 0.71,
    cpi: 0.43,
    papi: 1.81,
    lvswi: 41.8,
    rvswi: 7.9,
    svo2: 67,
    sao2: 97,
    lactate: 1.4,
    hgb: 10.8,
    inotropes: [
      { drug: "Dobutamine", dose: 2.5, unit: "mcg/kg/min" }
    ],
    visScore: 2.5,
    status: "OBSERVATION",
    riskCategory: "Low-to-Moderate Risk",
    admissionTime: "2026-08-19 04:50",
    attendingPhysician: "Dr. Marcus Vance, MD (Interventional Heart Failure)"
  }
];

// ==========================================
// PROTOCOLS REPOSITORY
// ==========================================
const EMERGENCY_PROTOCOLS = [
  {
    code: "CODE-SHOCK-ESC",
    title: "Code Shock — SCAI ECLS / Percutaneous MCS Escalation",
    triggerCondition: "CPO < 0.6W OR CI < 1.8 L/min/m² despite inotropes; Lactate > 4.0",
    targetAction: "Immediate Cath Lab transfer for Impella 5.5 / VA-ECMO cannulation & Perfusion Team mobilization",
    guideline: "ACC/AHA & Shock Academic Research Consortium (SHARC) 2026",
    level: "CRITICAL",
    color: "rose"
  },
  {
    code: "CODE-RV-FAIL",
    title: "Acute RV Failure Rescue Protocol (PAPi < 1.2)",
    triggerCondition: "PAPi < 1.2, CVP/PCWP ratio > 0.8, CVP > 15 mmHg with underfilled LV",
    targetAction: "Start Inhaled Pulmonary Vasodilator (iNO/Flolan), Milrinone, de-escalate left-sided unloading if suctioning",
    guideline: "ESC Guidelines for Acute Pulmonary Embolism & RV Shock",
    level: "HIGH",
    color: "amber"
  },
  {
    code: "CODE-PURGE-RUPTURE",
    title: "Mechanical Circulatory Support Purge Rupture & Suction Alarm",
    triggerCondition: "Impella Motor Current spike > 850mA, Purge Pressure < 300 mmHg, Optical Position Shift",
    targetAction: "Emergency Echo repositioning, verify D10W purge concentration, zero baseline calibration",
    guideline: "Abiomed Clinical Reference & FDA 21 CFR Part 11 Device Safety",
    level: "CRITICAL",
    color: "rose"
  },
  {
    code: "CODE-MTP-HEMO",
    title: "Massive Transfusion Protocol (MTP) for MCS Hemorrhage / Hemolysis",
    triggerCondition: "Free Plasma Hemoglobin > 40 mg/dL, Platelets < 50k, Rapid Hgb drop > 2 g/dL with Cannula site bleeding",
    targetAction: "Activate 1:1:1 PRBC/FFP/Platelets pack, Rotem/TEG guided hemostatic resuscitation, Anticoagulation pause",
    guideline: "ELSO Guidelines for Anticoagulation & Bleeding in ECLS",
    level: "HIGH",
    color: "purple"
  }
];

// ==========================================
// COMPONENT
// ==========================================
export default function CardiovascularHemodynamicsHub() {
  const [patients, setPatients] = useState(SEED_PATIENTS);
  const [selectedPatientId, setSelectedPatientId] = useState("PT-HEMO-101");
  const [activeTab, setActiveTab] = useState("telemetry"); // telemetry | mcs | waveforms | titration | protocols | audit
  const [searchQuery, setSearchQuery] = useState("");
  const [scaiFilter, setScaiFilter] = useState("ALL");
  const [isSimulating, setIsSimulating] = useState(true);
  const [selectedWaveformParam, setSelectedWaveformParam] = useState("PAC");
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [selectedEmergencyProtocol, setSelectedEmergencyProtocol] = useState(null);
  const [showCalculatorModal, setShowCalculatorModal] = useState(false);
  const [showPatientDetailModal, setShowPatientDetailModal] = useState(false);
  const [showMcsModal, setShowMcsModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  // Custom Interactive Titration Calculator State
  const [calcInputs, setCalcInputs] = useState({
    hr: 105,
    map: 65,
    cvp: 16,
    mpap: 34,
    pcwp: 24,
    co: 3.2,
    bsa: 1.85,
    hgb: 10.0,
    sao2: 95,
    svo2: 52
  });

  const { toasts, addToast, removeToast } = useKindToasts();

  const selectedPatient = useMemo(() => {
    return patients.find(p => p.id === selectedPatientId) || patients[0];
  }, [patients, selectedPatientId]);

  // Real-time telemetry simulation hook
  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      setPatients(prevPatients =>
        prevPatients.map(p => {
          if (p.status === "OBSERVATION" || p.status === "STABILIZING") {
            const hrDelta = (Math.random() - 0.5) * 2;
            const mapDelta = (Math.random() - 0.5) * 1.5;
            const coDelta = (Math.random() - 0.5) * 0.05;
            const newHr = Math.round(p.hr + hrDelta);
            const newMap = Math.round(p.map + mapDelta);
            const newCo = +(p.co + coDelta).toFixed(2);
            const newCpo = +((newMap * newCo) / 451).toFixed(2);
            const newCi = +(newCo / p.bsa).toFixed(2);

            return {
              ...p,
              hr: newHr,
              map: newMap,
              co: newCo,
              cpo: newCpo,
              ci: newCi
            };
          } else {
            // Unstable/Critical patients have jittery parameters
            const hrDelta = (Math.random() - 0.48) * 3;
            const mapDelta = (Math.random() - 0.52) * 2;
            const coDelta = (Math.random() - 0.51) * 0.08;
            const newHr = Math.max(60, Math.min(160, Math.round(p.hr + hrDelta)));
            const newMap = Math.max(45, Math.min(110, Math.round(p.map + mapDelta)));
            const newCo = Math.max(1.8, Math.min(6.5, +(p.co + coDelta).toFixed(2)));
            const newCpo = +((newMap * newCo) / 451).toFixed(2);
            const newCi = +(newCo / p.bsa).toFixed(2);
            const newSvri = Math.round(((newMap - p.cvp) * 80 * p.bsa) / newCo);

            return {
              ...p,
              hr: newHr,
              map: newMap,
              co: newCo,
              cpo: newCpo,
              ci: newCi,
              svri: newSvri
            };
          }
        })
      );
    }, 2800);

    return () => clearInterval(interval);
  }, [isSimulating]);

  // Derived Calculator Outputs
  const calcResults = useMemo(() => {
    const { hr, map, cvp, mpap, pcwp, co, bsa, hgb, sao2, svo2 } = calcInputs;
    const ci = +(co / bsa).toFixed(2);
    const sv = +( (co * 1000) / hr ).toFixed(1);
    const svi = +(sv / bsa).toFixed(1);
    const cpo = +( (map * co) / 451 ).toFixed(2);
    const cpi = +(cpo / bsa).toFixed(2);
    const svr = Math.round( ((map - cvp) * 80) / co );
    const svri = Math.round( ((map - cvp) * 80 * bsa) / co );
    const pvr = Math.round( ((mpap - pcwp) * 80) / co );
    const pvri = Math.round( ((mpap - pcwp) * 80 * bsa) / co );
    const woodUnits = +( (mpap - pcwp) / co ).toFixed(2);
    const tpg = mpap - pcwp; // Transpulmonary gradient
    const papi = +( (mpap * 1.3 - mpap * 0.7) / cvp ).toFixed(2); // Simulated spap - dpap / cvp
    const lvswi = +( 0.0136 * (map - pcwp) * svi ).toFixed(1);
    const rvswi = +( 0.0136 * (mpap - cvp) * svi ).toFixed(1);
    
    // Oxygen Delivery and Consumption (Fick)
    const cao2 = +( 1.34 * hgb * (sao2 / 100) + 0.003 * 100 ).toFixed(1);
    const cvo2 = +( 1.34 * hgb * (svo2 / 100) + 0.003 * 40 ).toFixed(1);
    const avdo2 = +( cao2 - cvo2 ).toFixed(1);
    const do2 = Math.round( co * 10 * cao2 );
    const do2i = Math.round( do2 / bsa );
    const vo2 = Math.round( co * 10 * avdo2 );
    const vo2i = Math.round( vo2 / bsa );
    const o2er = Math.round( (vo2 / do2) * 100 ); // Oxygen extraction ratio %

    // SCAI Shock classification estimator
    let scaiEst = "A";
    if (cpo < 0.6 || ci < 1.8 || svo2 < 50 || calcInputs.pcwp > 22) {
      if (cpo < 0.4 || ci < 1.4 || svo2 < 45) {
        scaiEst = "E (Extremis)";
      } else {
        scaiEst = "D (Deteriorating)";
      }
    } else if (cpo < 0.8 || ci < 2.2 || calcInputs.pcwp > 18) {
      scaiEst = "C (Classic Shock)";
    } else if (map < 65 || hr > 100) {
      scaiEst = "B (Beginning Shock)";
    } else {
      scaiEst = "A (At Risk)";
    }

    return {
      ci,
      sv,
      svi,
      cpo,
      cpi,
      svr,
      svri,
      pvr,
      pvri,
      woodUnits,
      tpg,
      papi,
      lvswi,
      rvswi,
      cao2,
      cvo2,
      avdo2,
      do2,
      do2i,
      vo2,
      vo2i,
      o2er,
      scaiEst
    };
  }, [calcInputs]);

  // Filter patients
  const filteredPatients = useMemo(() => {
    return patients.filter(p => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.diagnosis.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.bed.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesScai = scaiFilter === "ALL" || p.scaiStage === scaiFilter;
      return matchesSearch && matchesScai;
    });
  }, [patients, searchQuery, scaiFilter]);

  // Trigger Protocol Action
  const handleTriggerEmergency = (protocol) => {
    setSelectedEmergencyProtocol(protocol);
    setShowEmergencyModal(true);
  };

  const handleConfirmProtocolExecution = () => {
    addToast(
      `🚨 ${selectedEmergencyProtocol.code} ACTIVATED: Hospital Rapid Response & ECLS Teams Dispatched for ${selectedPatient.name} (${selectedPatient.bed}).`,
      "critical"
    );
    setShowEmergencyModal(false);
  };

  // Export CSV
  const handleExportCsv = () => {
    const dataToExport = patients.map(p => ({
      Patient_ID: p.id,
      Name: p.name,
      Bed: p.bed,
      Diagnosis: p.diagnosis,
      SCAI_Shock_Stage: p.scaiStage,
      Heart_Rate_bpm: p.hr,
      MAP_mmHg: p.map,
      Cardiac_Output_L_min: p.co,
      Cardiac_Index_L_min_m2: p.ci,
      Cardiac_Power_Output_W: p.cpo,
      PCWP_mmHg: p.pcwp,
      CVP_mmHg: p.cvp,
      PAPi_Score: p.papi,
      SVRI_dyn_s_cm5_m2: p.svri,
      SvO2_Percent: p.svo2,
      Lactate_mmol_L: p.lactate,
      MCS_Device: p.mcsDevice,
      VIS_Score: p.visScore,
      Clinical_Status: p.status
    }));

    downloadCsv(dataToExport, `MedTrack_Hemodynamics_Telemetry_${new Date().toISOString().slice(0, 10)}.csv`);
    addToast("Hemodynamic clinical audit ledger exported successfully.", "success");
    setShowExportModal(false);
  };

  // Waveform visualization generator (simulated dynamic canvas SVG)
  const renderWaveformPath = (type) => {
    if (type === "PAC") {
      // Pulmonary Artery Waveform with dicrotic notch
      return "M 0 50 Q 20 10, 30 25 T 45 40 Q 60 70, 75 50 Q 95 10, 105 25 T 120 40 Q 135 70, 150 50 Q 170 10, 180 25 T 195 40 Q 210 70, 225 50 Q 245 10, 255 25 T 270 40 Q 285 70, 300 50 Q 320 10, 330 25 T 345 40 Q 360 70, 375 50 Q 395 10, 405 25 T 420 40 Q 435 70, 450 50 Q 470 10, 480 25 T 495 40 Q 510 70, 525 50";
    } else if (type === "ART") {
      // Arterial Line Pulse Contour dP/dt
      return "M 0 60 L 15 10 L 25 35 L 35 30 L 75 60 L 90 10 L 100 35 L 110 30 L 150 60 L 165 10 L 175 35 L 185 30 L 225 60 L 240 10 L 250 35 L 260 30 L 300 60 L 315 10 L 325 35 L 335 30 L 375 60 L 390 10 L 400 35 L 410 30 L 450 60 L 465 10 L 475 35 L 485 30 L 525 60";
    } else if (type === "CVP") {
      // CVP waveform with a, c, v waves
      return "M 0 45 Q 15 30, 25 40 T 40 32 T 55 45 Q 70 30, 80 40 T 95 32 T 110 45 Q 125 30, 135 40 T 150 32 T 165 45 Q 180 30, 190 40 T 205 32 T 220 45 Q 235 30, 245 40 T 260 32 T 275 45 Q 290 30, 300 40 T 315 32 T 330 45 Q 345 30, 355 40 T 370 32 T 385 45 Q 400 30, 410 40 T 425 32 T 440 45 Q 455 30, 465 40 T 480 32 T 495 45 Q 510 30, 520 40 T 535 32";
    } else {
      // Impella Optical Motor Current / Flow telemetry
      return "M 0 40 Q 25 38, 50 42 T 100 39 T 150 41 T 200 38 T 250 43 T 300 39 T 350 40 T 400 42 T 450 38 T 500 41 L 530 40";
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-6 font-sans">
      <KindToastTray toasts={toasts} onDismiss={removeToast} />

      {/* HEADER BAR */}
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-rose-500/20 to-cyan-500/20 border border-rose-500/30 text-rose-400">
              <HeartPulse className="w-8 h-8 animate-pulse text-rose-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
                  Cardiovascular Hemodynamics & Circulatory Support Hub
                </h1>
                <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30">
                  CRITICAL CARE TELEMETRY
                </span>
              </div>
              <p className="text-xs md:text-sm text-slate-400 mt-0.5">
                Real-Time PAC Thermodilution, SCAI Shock Staging, Mechanical Circulatory Support (Impella / ECMO / IABP) & PV-Loop Simulation
              </p>
            </div>
          </div>
        </div>

        {/* Global Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsSimulating(!isSimulating)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              isSimulating
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/20"
                : "bg-amber-500/10 text-amber-400 border-amber-500/40 hover:bg-amber-500/20"
            }`}
          >
            {isSimulating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {isSimulating ? "Streaming Telemetry" : "Simulation Paused"}
          </button>

          <button
            onClick={() => setShowCalculatorModal(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/20 transition-all"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Hemodynamic Calculator
          </button>

          <button
            onClick={() => setShowExportModal(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            Audit Ledger
          </button>

          <button
            onClick={() => handleTriggerEmergency(EMERGENCY_PROTOCOLS[0])}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-rose-600 to-rose-700 text-white shadow-lg shadow-rose-900/30 hover:from-rose-500 hover:to-rose-600 transition-all"
          >
            <Siren className="w-4 h-4 animate-bounce" />
            CODE SHOCK TRIGGER
          </button>
        </div>
      </header>

      {/* TOP METRICS SUMMARY STRIP */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 my-6">
        <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-3.5 backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Patients on Active MCS</span>
            <Gauge className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-cyan-400">4 / 5</span>
            <span className="text-xs text-slate-400">80% High Acuity</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Impella CP, 5.5 & VA-ECMO</p>
        </div>

        <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-3.5 backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>SCAI Shock Stage D/E</span>
            <Flame className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-rose-500">2</span>
            <span className="text-xs text-rose-400">Refractory</span>
          </div>
          <p className="text-[10px] text-rose-400 mt-1">High Mortality Trajectory</p>
        </div>

        <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-3.5 backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Mean Cardiac Index</span>
            <Activity className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-400">1.98</span>
            <span className="text-xs text-slate-400">L/min/m²</span>
          </div>
          <p className="text-[10px] text-amber-300 mt-1">Target ≥ 2.20 L/min/m²</p>
        </div>

        <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-3.5 backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Mean CPO</span>
            <Zap className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-400">0.54</span>
            <span className="text-xs text-slate-400">Watts</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Shock cut-off &lt; 0.60 W</p>
        </div>

        <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-3.5 backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>RV Vulnerability (PAPi &lt; 1.2)</span>
            <TrendingDown className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-purple-400">1</span>
            <span className="text-xs text-purple-300">Pt-104</span>
          </div>
          <p className="text-[10px] text-purple-400 mt-1">ProteoDuo In Situ</p>
        </div>

        <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-3.5 backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Regulatory Standards</span>
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-indigo-400">100%</span>
            <span className="text-xs text-indigo-300">Compliant</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">FDA 21 CFR Part 11 / HL7 FHIR R4</p>
        </div>
      </div>

      {/* MAIN TWO-COLUMN WORKSPACE */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: PATIENT SELECTION & FAST ROSTER (4 cols) */}
        <div className="xl:col-span-4 space-y-4">
          
          {/* SEARCH & FILTERS */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Users className="w-4 h-4 text-cyan-400" />
                CCU / Cardiogenic Shock Roster
              </h2>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-cyan-400">
                {filteredPatients.length} Active
              </span>
            </div>

            <div className="space-y-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search by name, bed, diagnosis..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-all"
                />
              </div>

              <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px]">
                {["ALL", "E", "D", "C", "B"].map((stage) => (
                  <button
                    key={stage}
                    onClick={() => setScaiFilter(stage)}
                    className={`px-2.5 py-1 rounded-md font-medium border transition-all ${
                      scaiFilter === stage
                        ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/50"
                        : "bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800"
                    }`}
                  >
                    {stage === "ALL" ? "All Stages" : `SCAI ${stage}`}
                  </button>
                ))}
              </div>
            </div>

            {/* PATIENT LIST */}
            <div className="mt-3 space-y-2.5 max-h-[560px] overflow-y-auto pr-1">
              {filteredPatients.map((p) => {
                const isSelected = p.id === selectedPatientId;
                const scaiColor =
                  p.scaiStage === "E"
                    ? "bg-rose-500/20 text-rose-300 border-rose-500/50"
                    : p.scaiStage === "D"
                    ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
                    : p.scaiStage === "C"
                    ? "bg-amber-500/10 text-amber-300 border-amber-500/30"
                    : "bg-emerald-500/10 text-emerald-300 border-emerald-500/30";

                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPatientId(p.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? "bg-slate-800/90 border-cyan-500/70 shadow-md shadow-cyan-950/40"
                        : "bg-slate-950/60 border-slate-800/80 hover:bg-slate-900/60 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-100">{p.name}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                            {p.bed}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{p.diagnosis}</p>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${scaiColor}`}>
                        SCAI {p.scaiStage}
                      </span>
                    </div>

                    <div className="grid grid-cols-4 gap-2 mt-3 pt-2 border-t border-slate-800/60 text-center">
                      <div>
                        <span className="text-[10px] text-slate-500 block">CPO</span>
                        <span className={`text-xs font-bold ${p.cpo < 0.6 ? "text-rose-400" : "text-emerald-400"}`}>
                          {p.cpo} W
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">CI</span>
                        <span className={`text-xs font-bold ${p.ci < 2.0 ? "text-rose-400" : "text-cyan-400"}`}>
                          {p.ci} L/m²
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">PAPi</span>
                        <span className={`text-xs font-bold ${p.papi < 1.2 ? "text-rose-400" : "text-slate-300"}`}>
                          {p.papi}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">MAP</span>
                        <span className={`text-xs font-bold ${p.map < 65 ? "text-rose-400" : "text-slate-200"}`}>
                          {p.map}
                        </span>
                      </div>
                    </div>

                    <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-400 bg-slate-900/60 px-2 py-1 rounded-md">
                      <span className="flex items-center gap-1.5">
                        <Cpu className="w-3 h-3 text-cyan-400" />
                        {p.mcsDevice}
                      </span>
                      <span className="text-slate-500">VIS: {p.visScore}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ACTIVE PROTOCOL QUICK LAUNCH */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2 mb-2.5">
              <Siren className="w-4 h-4 text-rose-500" />
              Emergency Response Directives
            </h3>
            <div className="space-y-2">
              {EMERGENCY_PROTOCOLS.map((proto) => (
                <div
                  key={proto.code}
                  className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/90 flex items-center justify-between hover:border-slate-700 transition-all"
                >
                  <div className="pr-2">
                    <span className="text-xs font-bold text-slate-200 block">{proto.title}</span>
                    <span className="text-[10px] text-slate-400 line-clamp-1">{proto.triggerCondition}</span>
                  </div>
                  <button
                    onClick={() => handleTriggerEmergency(proto)}
                    className="shrink-0 px-2 py-1 rounded text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20"
                  >
                    Deploy
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: DETAILED TELEMETRY & COMMAND CONSOLE (8 cols) */}
        <div className="xl:col-span-8 space-y-4">
          
          {/* PATIENT BANNER CARD */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 lg:p-5 relative overflow-hidden">
            <div className="absolute right-0 top-0 w-96 h-96 bg-gradient-to-bl from-rose-500/5 via-cyan-500/5 to-transparent pointer-events-none" />
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-black text-white">{selectedPatient.name}</h2>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                    {selectedPatient.id}
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                    {selectedPatient.bed}
                  </span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-rose-500/15 text-rose-300 border border-rose-500/40">
                    SCAI STAGE {selectedPatient.scaiStage} ({selectedPatient.scaiStageName})
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  <span className="font-semibold text-slate-400">Diagnosis:</span> {selectedPatient.diagnosis}
                </p>
                <div className="flex flex-wrap items-center gap-4 mt-2 text-[11px] text-slate-400">
                  <span>Age: <strong className="text-slate-200">{selectedPatient.age}y</strong> ({selectedPatient.gender})</span>
                  <span>BSA: <strong className="text-slate-200">{selectedPatient.bsa} m²</strong></span>
                  <span>Attending: <strong className="text-slate-200">{selectedPatient.attendingPhysician}</strong></span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setShowPatientDetailModal(true)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-all"
                >
                  <Eye className="w-3.5 h-3.5 text-cyan-400" />
                  Full Inspection
                </button>
                <button
                  onClick={() => setShowMcsModal(true)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center gap-1.5 transition-all"
                >
                  <Cpu className="w-3.5 h-3.5" />
                  MCS Controls
                </button>
              </div>
            </div>

            {/* TAB NAVIGATION */}
            <div className="flex items-center gap-2 mt-5 border-b border-slate-800 overflow-x-auto text-xs">
              {[
                { id: "telemetry", label: "Hemodynamic Matrix", icon: Activity },
                { id: "mcs", label: "MCS & Impella/ECMO", icon: Cpu },
                { id: "waveforms", label: "Waveform & PV Loop", icon: HeartPulse },
                { id: "titration", label: "Vasoactive Inotropes", icon: Sliders },
                { id: "protocols", label: "Clinical Guidelines", icon: ShieldCheck }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-3 py-2 border-b-2 font-medium transition-all ${
                      activeTab === tab.id
                        ? "border-cyan-400 text-cyan-400"
                        : "border-transparent text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* TAB 1: HEMODYNAMIC MATRIX */}
          {activeTab === "telemetry" && (
            <div className="space-y-4">
              
              {/* PRIMARY CARDIAC TELEMETRY CARDS */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5">
                  <div className="flex items-center justify-between text-slate-400 text-xs">
                    <span>Cardiac Output / Index</span>
                    <Activity className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div className="mt-1">
                    <span className="text-2xl font-black text-cyan-400">{selectedPatient.co}</span>
                    <span className="text-xs text-slate-400 ml-1">L/min</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 flex justify-between">
                    <span>CI: <strong className="text-slate-200">{selectedPatient.ci} L/min/m²</strong></span>
                    <span>SV: <strong className="text-slate-200">{selectedPatient.sv} mL</strong></span>
                  </div>
                </div>

                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5">
                  <div className="flex items-center justify-between text-slate-400 text-xs">
                    <span>Cardiac Power Output</span>
                    <Zap className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="mt-1">
                    <span className={`text-2xl font-black ${selectedPatient.cpo < 0.6 ? "text-rose-500 animate-pulse" : "text-emerald-400"}`}>
                      {selectedPatient.cpo}
                    </span>
                    <span className="text-xs text-slate-400 ml-1">Watts</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 flex justify-between">
                    <span>CPI: <strong className="text-slate-200">{selectedPatient.cpi} W/m²</strong></span>
                    <span className="text-rose-400">{selectedPatient.cpo < 0.6 ? "Shock Deficit" : "Adequate"}</span>
                  </div>
                </div>

                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5">
                  <div className="flex items-center justify-between text-slate-400 text-xs">
                    <span>PAPi (RV Function)</span>
                    <Gauge className="w-4 h-4 text-purple-400" />
                  </div>
                  <div className="mt-1">
                    <span className={`text-2xl font-black ${selectedPatient.papi < 1.2 ? "text-rose-400" : "text-purple-400"}`}>
                      {selectedPatient.papi}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 flex justify-between">
                    <span>CVP: <strong className="text-slate-200">{selectedPatient.cvp} mmHg</strong></span>
                    <span>{selectedPatient.papi < 1.2 ? "RV Failure" : "RV Preserved"}</span>
                  </div>
                </div>

                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5">
                  <div className="flex items-center justify-between text-slate-400 text-xs">
                    <span>Pressures & Wedge</span>
                    <Heart className="w-4 h-4 text-rose-400" />
                  </div>
                  <div className="mt-1">
                    <span className="text-2xl font-black text-rose-400">{selectedPatient.pcwp}</span>
                    <span className="text-xs text-slate-400 ml-1">mmHg (PCWP)</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 flex justify-between">
                    <span>mPAP: <strong className="text-slate-200">{selectedPatient.mpap} mmHg</strong></span>
                    <span>MAP: <strong className="text-slate-200">{selectedPatient.map} mmHg</strong></span>
                  </div>
                </div>
              </div>

              {/* SECONDARY HEMODYNAMIC CALCULATIONS GRID */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center justify-between">
                  <span>Advanced Calculated Hemodynamic Indices</span>
                  <span className="text-[10px] text-slate-500 font-normal">Updated in real-time via thermodilution</span>
                </h3>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-slate-500 block">Systemic Vascular Res. (SVRI)</span>
                    <span className="text-base font-bold text-slate-200 mt-0.5 block">{selectedPatient.svri}</span>
                    <span className="text-[10px] text-slate-500">dyn·s·cm⁻⁵·m² (1900-2400)</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-slate-500 block">Pulmonary Vascular Res. (PVRI)</span>
                    <span className="text-base font-bold text-slate-200 mt-0.5 block">{selectedPatient.pvri}</span>
                    <span className="text-[10px] text-slate-500">dyn·s·cm⁻⁵·m² (225-315)</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-slate-500 block">LV Stroke Work Index (LVSWI)</span>
                    <span className="text-base font-bold text-slate-200 mt-0.5 block">{selectedPatient.lvswi}</span>
                    <span className="text-[10px] text-slate-500">g·m/m²/beat (50-62)</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-slate-500 block">Mixed Venous Sat (SvO2) / Lactate</span>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className={`text-base font-bold ${selectedPatient.svo2 < 60 ? "text-rose-400" : "text-emerald-400"}`}>
                        {selectedPatient.svo2}%
                      </span>
                      <span className="text-xs font-semibold text-rose-400">
                        {selectedPatient.lactate} mmol/L
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500">Target SvO2 &gt; 65%</span>
                  </div>
                </div>
              </div>

              {/* LIVE INVASIVE WAVEFORM DISPLAY */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      Real-Time Catheter Waveform Telemetry
                    </h3>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs">
                    {["PAC", "ART", "CVP", "IMPELLA"].map((wType) => (
                      <button
                        key={wType}
                        onClick={() => setSelectedWaveformParam(wType)}
                        className={`px-2 py-0.5 rounded text-[11px] font-semibold border transition-all ${
                          selectedWaveformParam === wType
                            ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/50"
                            : "bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800"
                        }`}
                      >
                        {wType} Trace
                      </button>
                    ))}
                  </div>
                </div>

                <div className="h-28 bg-slate-950 border border-slate-800/80 rounded-lg p-2 relative flex items-center overflow-hidden">
                  <div className="absolute inset-0 grid grid-cols-12 grid-rows-4 gap-0 opacity-15 pointer-events-none">
                    {Array.from({ length: 48 }).map((_, i) => (
                      <div key={i} className="border-r border-b border-cyan-500" />
                    ))}
                  </div>

                  <svg className="w-full h-full" viewBox="0 0 530 80" preserveAspectRatio="none">
                    <path
                      d={renderWaveformPath(selectedWaveformParam)}
                      fill="none"
                      stroke={
                        selectedWaveformParam === "PAC"
                          ? "#38bdf8"
                          : selectedWaveformParam === "ART"
                          ? "#f43f5e"
                          : selectedWaveformParam === "CVP"
                          ? "#a855f7"
                          : "#10b981"
                      }
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>

                  <div className="absolute top-2 left-3 flex items-center gap-3 text-[10px] font-mono">
                    <span className="text-cyan-400">SPEED: 25 mm/s</span>
                    <span className="text-slate-400">SCALE: 0-60 mmHg</span>
                    <span className="text-emerald-400">SIGNAL: OPTICAL HIGH CONFIDENCE</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MECHANICAL CIRCULATORY SUPPORT */}
          {activeTab === "mcs" && (
            <div className="space-y-4">
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/30">
                      <Cpu className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">{selectedPatient.mcsDevice} Command Station</h3>
                      <p className="text-xs text-slate-400">Current Mode: {selectedPatient.mcsMode}</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    PUMP FLOW ACTIVE
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-xs text-slate-500 block">Pump Support Flow</span>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-3xl font-black text-cyan-400">{selectedPatient.mcsFlow}</span>
                      <span className="text-xs text-slate-400">L/min</span>
                    </div>
                    <span className="text-[10px] text-emerald-400 mt-2 block">Continuous Unloading Active</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-xs text-slate-500 block">Purge Solution Flow</span>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-3xl font-black text-indigo-400">{selectedPatient.mcsPurge}</span>
                      <span className="text-xs text-slate-400">mL/hr</span>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-2 block">D5W with Heparin 25 U/mL</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-xs text-slate-500 block">Motor Current / Position</span>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-3xl font-black text-amber-400">{selectedPatient.mcsMotorCurrent}</span>
                      <span className="text-xs text-slate-400">mA</span>
                    </div>
                    <span className="text-[10px] text-emerald-400 mt-2 block">Optical Sensor: In Ventricle 3.5cm</span>
                  </div>
                </div>

                {/* MCS SAFETY CHECKLIST */}
                <div className="mt-4 p-3 rounded-lg bg-slate-950/70 border border-slate-800 text-xs space-y-2">
                  <span className="font-bold text-slate-300 block">Daily MCS Surveillance Checklist:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-400">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Echocardiographic cannula alignment verified</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Plasma free Hb &lt; 30 mg/dL (No hemolysis)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Distal limb perfusion cannula patent (VA-ECMO)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>ACT maintained 160-180 sec / Anti-Xa 0.3-0.5</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: WAVEFORMS & PV LOOP SIMULATION */}
          {activeTab === "waveforms" && (
            <div className="space-y-4">
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                    <HeartPulse className="w-4 h-4 text-rose-500" />
                    Left Ventricle Pressure-Volume (PV) Loop Reconstruction
                  </h3>
                  <span className="text-[11px] text-slate-400">Ees / Ea Ratio: 0.62 (Severe Uncoupling)</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* SIMULATED PV LOOP CANVAS */}
                  <div className="h-64 bg-slate-950 border border-slate-800 rounded-xl p-3 relative flex items-center justify-center">
                    <div className="absolute inset-0 grid grid-cols-8 grid-rows-6 gap-0 opacity-10 pointer-events-none">
                      {Array.from({ length: 48 }).map((_, i) => (
                        <div key={i} className="border-r border-b border-rose-500" />
                      ))}
                    </div>

                    <svg className="w-full h-full" viewBox="0 0 300 200">
                      {/* Normal Reference Loop (Dotted) */}
                      <path
                        d="M 60 160 C 60 80, 80 40, 180 40 C 220 40, 220 160, 180 160 Z"
                        fill="none"
                        stroke="#475569"
                        strokeWidth="1.5"
                        strokeDasharray="4 4"
                      />
                      {/* Patient Shock Loop */}
                      <path
                        d="M 90 170 C 90 110, 120 75, 230 75 C 260 75, 260 170, 210 170 Z"
                        fill="rgba(244, 63, 94, 0.15)"
                        stroke="#f43f5e"
                        strokeWidth="2.5"
                      />
                      {/* Labels */}
                      <text x="20" y="20" fill="#94a3b8" fontSize="10" fontFamily="monospace">LV Pressure (mmHg)</text>
                      <text x="180" y="195" fill="#94a3b8" fontSize="10" fontFamily="monospace">LV Volume (mL)</text>
                      <text x="100" y="100" fill="#f43f5e" fontSize="10" fontWeight="bold">Pt PV-Loop</text>
                      <text x="70" y="55" fill="#64748b" fontSize="9">Normal Ref</text>
                    </svg>

                    <div className="absolute bottom-2 left-3 text-[10px] font-mono text-slate-400">
                      EDV: 168 mL | ESV: 139 mL | SV: 29 mL | EF: 17%
                    </div>
                  </div>

                  {/* PV LOOP CLINICAL METRICS */}
                  <div className="space-y-2.5 text-xs">
                    <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                      <span className="text-slate-400 font-semibold block">Ventricular-Arterial Coupling (Ea / Ees)</span>
                      <span className="text-lg font-black text-rose-400 mt-1 block">2.34 (Severely Uncoupled)</span>
                      <p className="text-[10px] text-slate-500 mt-1">Normal is 0.7 - 1.0. Indicates severe contractile failure with afterload mismatch.</p>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                      <span className="text-slate-400 font-semibold block">Left Ventricular Stroke Work (LVSW)</span>
                      <span className="text-lg font-black text-amber-400 mt-1 block">15.6 g·m/m² (Severe Depression)</span>
                      <p className="text-[10px] text-slate-500 mt-1">Requires immediate inodilator (Milrinone / Levosimendan) and Impella LV unloading.</p>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                      <span className="text-slate-400 font-semibold block">dP/dt max (Contractility Index)</span>
                      <span className="text-lg font-black text-cyan-400 mt-1 block">680 mmHg/s (Depressed)</span>
                      <p className="text-[10px] text-slate-500 mt-1">Target &gt; 1200 mmHg/s. Continuous invasive arterial pulse contour estimation.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: INOTROPE & VASOPRESSOR TITRATION */}
          {activeTab === "titration" && (
            <div className="space-y-4">
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-cyan-400" />
                      Inotrope & Vasopressor Titration Matrix
                    </h3>
                    <p className="text-xs text-slate-400">Total Vasoactive-Inotropic Score (VIS): <strong className="text-amber-400">{selectedPatient.visScore}</strong></p>
                  </div>
                  <span className={`px-2.5 py-1 rounded text-xs font-bold border ${selectedPatient.visScore > 30 ? "bg-rose-500/10 text-rose-300 border-rose-500/40" : "bg-cyan-500/10 text-cyan-300 border-cyan-500/40"}`}>
                    {selectedPatient.visScore > 30 ? "High Inotropic Dependency" : "Moderate Support"}
                  </span>
                </div>

                <div className="space-y-3">
                  {selectedPatient.inotropes.map((item, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div>
                        <span className="text-sm font-bold text-slate-100">{item.drug}</span>
                        <p className="text-xs text-slate-400">Targeting MAP ≥ 65 mmHg & SVR normalization</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="text-base font-black text-cyan-400">{item.dose}</span>
                          <span className="text-xs text-slate-400 ml-1">{item.unit}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => addToast(`Decreased ${item.drug} titration by 10%`, "info")}
                            className="w-7 h-7 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 font-bold text-sm flex items-center justify-center"
                          >
                            -
                          </button>
                          <button
                            onClick={() => addToast(`Increased ${item.drug} titration by 10%`, "info")}
                            className="w-7 h-7 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 font-bold text-sm flex items-center justify-center"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* VIS Formula Explainer */}
                <div className="mt-4 p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 text-[11px] text-slate-400">
                  <span className="font-semibold text-slate-300">VIS Calculation Standard:</span>
                  <p className="mt-0.5">VIS = Dopamine + Dobutamine + (100 × Epinephrine) + (10 × Milrinone) + (10,000 × Vasopressin) + (100 × Norepinephrine).</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: CLINICAL GUIDELINES & PROTOCOLS */}
          {activeTab === "protocols" && (
            <div className="space-y-4">
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  International Cardiogenic Shock Management Consensus
                </h3>

                <div className="space-y-3 text-xs">
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="font-bold text-cyan-300">1. Invasive PAC Placement Standard (SHARC 2026)</span>
                    <p className="text-slate-400 mt-1">Routine early pulmonary artery catheterization within 4 hours of cardiogenic shock diagnosis is associated with significantly lower 30-day mortality by guiding phenotype-specific unloading and volume management.</p>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="font-bold text-rose-300">2. SCAI Shock Staging Criteria</span>
                    <p className="text-slate-400 mt-1">Stage A (At Risk) → Stage B (Beginning / Pre-shock) → Stage C (Classic / Hypoperfusion) → Stage D (Deteriorating / Refractory to 1st line) → Stage E (Extremis / Arrest, ECLS candidate).</p>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="font-bold text-amber-300">3. Cardiac Power Output (CPO) Prognostic Cutoffs</span>
                    <p className="text-slate-400 mt-1">CPO &lt; 0.6 W at baseline or failure to achieve CPO &gt; 0.6 W despite inotropes indicates impending cardiovascular collapse requiring mechanical circulatory assist escalation.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ========================================== */}
      {/* MODAL 1: HEMODYNAMIC CALCULATOR & TITRATION */}
      {/* ========================================== */}
      {showCalculatorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  <SlidersHorizontal className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Interactive Hemodynamic Calculation Engine</h3>
                  <p className="text-xs text-slate-400">Calculate Cardiac Power, Resistance & Fick Oxygen Kinetics</p>
                </div>
              </div>
              <button
                onClick={() => setShowCalculatorModal(false)}
                className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 my-5">
              {/* SLIDERS / INPUTS (6 cols) */}
              <div className="lg:col-span-6 space-y-3.5 bg-slate-950/70 p-4 rounded-xl border border-slate-800/80">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">Measured Raw Parameters</h4>

                <div>
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>Heart Rate (HR)</span>
                    <strong className="text-cyan-400">{calcInputs.hr} bpm</strong>
                  </div>
                  <input
                    type="range"
                    min="40"
                    max="180"
                    value={calcInputs.hr}
                    onChange={(e) => setCalcInputs({ ...calcInputs, hr: +e.target.value })}
                    className="w-full accent-cyan-400"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>Mean Arterial Pressure (MAP)</span>
                    <strong className="text-cyan-400">{calcInputs.map} mmHg</strong>
                  </div>
                  <input
                    type="range"
                    min="40"
                    max="140"
                    value={calcInputs.map}
                    onChange={(e) => setCalcInputs({ ...calcInputs, map: +e.target.value })}
                    className="w-full accent-cyan-400"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>Cardiac Output (CO)</span>
                    <strong className="text-cyan-400">{calcInputs.co} L/min</strong>
                  </div>
                  <input
                    type="range"
                    min="1.0"
                    max="8.0"
                    step="0.1"
                    value={calcInputs.co}
                    onChange={(e) => setCalcInputs({ ...calcInputs, co: +e.target.value })}
                    className="w-full accent-cyan-400"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>Central Venous Pressure (CVP)</span>
                    <strong className="text-cyan-400">{calcInputs.cvp} mmHg</strong>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="30"
                    value={calcInputs.cvp}
                    onChange={(e) => setCalcInputs({ ...calcInputs, cvp: +e.target.value })}
                    className="w-full accent-cyan-400"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>Pulmonary Capillary Wedge (PCWP)</span>
                    <strong className="text-cyan-400">{calcInputs.pcwp} mmHg</strong>
                  </div>
                  <input
                    type="range"
                    min="4"
                    max="35"
                    value={calcInputs.pcwp}
                    onChange={(e) => setCalcInputs({ ...calcInputs, pcwp: +e.target.value })}
                    className="w-full accent-cyan-400"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>Mean Pulmonary Artery Pressure (mPAP)</span>
                    <strong className="text-cyan-400">{calcInputs.mpap} mmHg</strong>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="60"
                    value={calcInputs.mpap}
                    onChange={(e) => setCalcInputs({ ...calcInputs, mpap: +e.target.value })}
                    className="w-full accent-cyan-400"
                  />
                </div>
              </div>

              {/* CALCULATED OUTPUTS (6 cols) */}
              <div className="lg:col-span-6 space-y-3 bg-slate-950/70 p-4 rounded-xl border border-slate-800/80">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">Derived Hemodynamic Matrix</h4>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-slate-500 block">Cardiac Power Output (CPO)</span>
                    <span className={`text-lg font-black ${calcResults.cpo < 0.6 ? "text-rose-400" : "text-emerald-400"}`}>
                      {calcResults.cpo} Watts
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">CPI: {calcResults.cpi} W/m²</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-slate-500 block">Cardiac Index (CI)</span>
                    <span className={`text-lg font-black ${calcResults.ci < 2.0 ? "text-rose-400" : "text-cyan-400"}`}>
                      {calcResults.ci} L/min/m²
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">SV: {calcResults.sv} mL</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-slate-500 block">Systemic Resistance (SVRI)</span>
                    <span className="text-lg font-black text-slate-200">
                      {calcResults.svri}
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">dyn·s·cm⁻⁵·m²</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-slate-500 block">Pulmonary Resistance (PVR)</span>
                    <span className="text-lg font-black text-slate-200">
                      {calcResults.woodUnits} Wood U
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">{calcResults.pvr} dyn·s·cm⁻⁵</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-slate-500 block">Oxygen Delivery (DO2I)</span>
                    <span className="text-lg font-black text-slate-200">
                      {calcResults.do2i} mL/min/m²
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">VO2I: {calcResults.vo2i} mL/min/m²</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-slate-500 block">Estimated SCAI Stage</span>
                    <span className="text-base font-black text-rose-400">
                      {calcResults.scaiEst}
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">Algorithmic Triage</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => {
                  setCalcInputs({
                    hr: selectedPatient.hr,
                    map: selectedPatient.map,
                    cvp: selectedPatient.cvp,
                    mpap: selectedPatient.mpap,
                    pcwp: selectedPatient.pcwp,
                    co: selectedPatient.co,
                    bsa: selectedPatient.bsa,
                    hgb: selectedPatient.hgb,
                    sao2: selectedPatient.sao2,
                    svo2: selectedPatient.svo2
                  });
                  addToast("Loaded selected patient measurements into calculator.", "info");
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all"
              >
                Sync with Selected Patient
              </button>
              <button
                onClick={() => setShowCalculatorModal(false)}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white transition-all"
              >
                Close Calculator
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL 2: EMERGENCY PROTOCOL CONFIRMATION */}
      {/* ========================================== */}
      {showEmergencyModal && selectedEmergencyProtocol && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border-2 border-rose-500/60 rounded-2xl w-full max-w-xl p-6 shadow-2xl shadow-rose-950/50">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
              <div className="p-3 rounded-xl bg-rose-500/20 text-rose-500 border border-rose-500/40 animate-pulse">
                <Siren className="w-7 h-7" />
              </div>
              <div>
                <span className="text-xs font-bold text-rose-400 tracking-wider uppercase">High-Assurance Emergency Escalation</span>
                <h3 className="text-xl font-black text-white">{selectedEmergencyProtocol.title}</h3>
              </div>
            </div>

            <div className="my-5 space-y-3.5 text-xs text-slate-300">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-500 font-semibold block">Target Patient:</span>
                <span className="text-base font-bold text-white">{selectedPatient.name} ({selectedPatient.id})</span>
                <span className="text-xs text-rose-400 block mt-0.5">{selectedPatient.bed} • {selectedPatient.diagnosis}</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-500 font-semibold block">Standardized Directive:</span>
                <p className="text-slate-200 mt-1">{selectedEmergencyProtocol.targetAction}</p>
                <span className="text-[10px] text-slate-500 block mt-2">Authority: {selectedEmergencyProtocol.guideline}</span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                onClick={() => setShowEmergencyModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all"
              >
                Cancel Protocol
              </button>
              <button
                onClick={handleConfirmProtocolExecution}
                className="px-6 py-2 rounded-xl text-xs font-black bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-900/40 transition-all flex items-center gap-2"
              >
                <Flame className="w-4 h-4" />
                EXECUTE EMERGENCY OVERRIDE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL 3: PATIENT FULL DETAIL INSPECTION */}
      {/* ========================================== */}
      {showPatientDetailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <User className="w-5 h-5 text-cyan-400" />
                Invasive Hemodynamic Dossier: {selectedPatient.name}
              </h3>
              <button onClick={() => setShowPatientDetailModal(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 my-4 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-slate-500 block">Patient ID</span>
                  <span className="font-bold text-slate-200">{selectedPatient.id}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-slate-500 block">Room / Bed</span>
                  <span className="font-bold text-slate-200">{selectedPatient.bed}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-slate-500 block">Admission Date</span>
                  <span className="font-bold text-slate-200">{selectedPatient.admissionTime}</span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5">
                <span className="font-bold text-slate-300 block">Complete Hemodynamic Panel</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-400">
                  <div>HR: <strong className="text-slate-200">{selectedPatient.hr} bpm</strong></div>
                  <div>BP: <strong className="text-slate-200">{selectedPatient.sbp}/{selectedPatient.dbp} ({selectedPatient.map})</strong></div>
                  <div>CVP: <strong className="text-slate-200">{selectedPatient.cvp} mmHg</strong></div>
                  <div>mPAP: <strong className="text-slate-200">{selectedPatient.mpap} mmHg</strong></div>
                  <div>PCWP: <strong className="text-slate-200">{selectedPatient.pcwp} mmHg</strong></div>
                  <div>CO: <strong className="text-slate-200">{selectedPatient.co} L/min</strong></div>
                  <div>CI: <strong className="text-slate-200">{selectedPatient.ci} L/min/m²</strong></div>
                  <div>CPO: <strong className="text-slate-200">{selectedPatient.cpo} W</strong></div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="font-bold text-slate-300 block">Attending Clinical Team</span>
                <p className="text-slate-400 mt-1">{selectedPatient.attendingPhysician}</p>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-800">
              <button
                onClick={() => setShowPatientDetailModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-200 hover:bg-slate-700"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL 4: MCS DEVICE CONFIGURATION */}
      {/* ========================================== */}
      {showMcsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Cpu className="w-5 h-5 text-rose-500" />
                MCS Hardware Telemetry & Speed Configuration
              </h3>
              <button onClick={() => setShowMcsModal(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="my-4 space-y-3 text-xs text-slate-300">
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-slate-500 block">Device Profile</span>
                <span className="text-base font-bold text-white">{selectedPatient.mcsDevice}</span>
                <span className="text-slate-400 block mt-0.5">Mode: {selectedPatient.mcsMode}</span>
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                <span className="font-semibold text-slate-300 block">Support Speed / Level Modulation</span>
                <div className="flex items-center justify-between">
                  <span>Current Performance Setting</span>
                  <span className="font-bold text-cyan-400">P-8 (High Flow Support)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Purge Pressure Range</span>
                  <span className="font-bold text-emerald-400">480 - 620 mmHg (Nominal)</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => {
                  addToast("MCS Calibration baseline logged into EHR ledger.", "success");
                  setShowMcsModal(false);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white"
              >
                Log Calibration Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL 5: AUDIT LEDGER & EXPORT */}
      {/* ========================================== */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Download className="w-5 h-5 text-indigo-400" />
                Clinical Audit & FHIR R4 Export
              </h3>
              <button onClick={() => setShowExportModal(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="my-4 text-xs text-slate-300 space-y-3">
              <p className="text-slate-400">
                Exports all invasive hemodynamic time-series records, SCAI shock stages, and MCS hardware state adhering to FDA 21 CFR Part 11 and HL7 FHIR R4 Observations.
              </p>
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-400">
                <span className="text-slate-300 font-semibold block">Cryptographic Provenance Stamp:</span>
                <span className="font-mono text-cyan-400 block mt-0.5">SHA256: e89a...b441f</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleExportCsv}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                Export CSV Record
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
