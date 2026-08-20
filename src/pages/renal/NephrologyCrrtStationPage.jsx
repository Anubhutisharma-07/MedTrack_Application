import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity, AlertOctagon, AlertTriangle, ArrowDownRight, ArrowUpRight, Battery,
  Bell, CheckCircle2, ChevronRight, Clock, Cpu, Download, Droplets, Eye, FileText,
  Filter, Flame, Gauge, Heart, HeartPulse, HelpCircle, Info, Layers, Lock,
  Monitor, Pause, Play, Plus, Power, Radio, RefreshCw, RotateCcw, Search,
  ShieldAlert, ShieldCheck, Siren, Sliders, SlidersHorizontal, Sparkles,
  Stethoscope, Thermometer, Timer, TrendingDown, TrendingUp, User, Users, Waves,
  Wind, X, Zap,
} from "lucide-react";
import { downloadCsv } from "../../utils/csv";
import { useKindToasts, KindToastTray } from "../../components/common/HubToasts";

/* ------------------------------------------------------------------ */
/*  Clinical Seed Data & Presets (KDIGO CRRT Telemetry)                */
/* ------------------------------------------------------------------ */

const INITIAL_CRRT_PATIENTS = [
  {
    id: "CRRT-501",
    name: "Arthur Pendelton",
    mrn: "MRN-33910",
    age: 68,
    gender: "Male",
    weightKg: 82.5,
    diagnosis: "Septic Shock / KDIGO Stage 3 AKI / Refractory Acidosis",
    kdigoStage: "Stage 3",
    crrtMode: "CVVHDF",
    dialyzer: "AN69 ST150 Membrane (Surface 1.5 m²)",
    accessSite: "Right Internal Jugular Trialysis Catheter 13 Fr",
    bloodFlowQb: 220,
    dialysateQd: 1400,
    replacementPre: 600,
    replacementPost: 600,
    netUfrTarget: 150,
    actualUfr: 148,
    tmp: 145,
    pFilter: 185,
    pVenous: 75,
    pAccess: -80,
    effluentDose: 31.5,
    citrateRate: 240,
    calciumInfusion: 45,
    postFilterIca: 0.32,
    systemicIca: 1.18,
    serumCreatinine: 4.8,
    bun: 84,
    potassium: 5.6,
    bicarbonate: 16.5,
    lactate: 3.4,
    status: "Active Filtration",
    alerts: [
      { id: "alt-1", type: "warning", msg: "TMP rising: +25 mmHg over last 2h (Fibrin layering)", time: "6m ago" },
      { id: "alt-2", type: "info", msg: "Effluent dose target 30 mL/kg/h maintained", time: "18m ago" },
    ],
  },
  {
    id: "CRRT-502",
    name: "Helena Rostova",
    mrn: "MRN-44129",
    age: 54,
    gender: "Female",
    weightKg: 64.0,
    diagnosis: "Post-Cardiac Arrest AKI / Fluid Overload (+6.5 L)",
    kdigoStage: "Stage 3",
    crrtMode: "CVVH",
    dialyzer: "Polysulfone HF1000 (Surface 1.1 m²)",
    accessSite: "Right Femoral VasCath 13.5 Fr × 24cm",
    bloodFlowQb: 200,
    dialysateQd: 0,
    replacementPre: 1200,
    replacementPost: 600,
    netUfrTarget: 250,
    actualUfr: 250,
    tmp: 120,
    pFilter: 160,
    pVenous: 65,
    pAccess: -60,
    effluentDose: 32.0,
    citrateRate: 190,
    calciumInfusion: 38,
    postFilterIca: 0.29,
    systemicIca: 1.22,
    serumCreatinine: 3.6,
    bun: 62,
    potassium: 4.6,
    bicarbonate: 21.0,
    lactate: 2.1,
    status: "Stable Fluid Removal",
    alerts: [
      { id: "alt-3", type: "info", msg: "Negative fluid balance goal 2.5L/24h on track", time: "12m ago" },
    ],
  },
  {
    id: "CRRT-503",
    name: "Darius Sterling",
    mrn: "MRN-55823",
    age: 61,
    gender: "Male",
    weightKg: 95.0,
    diagnosis: "Severe Acute Pancreatitis / Hyperkalemia 6.8 mEq/L",
    kdigoStage: "Stage 3",
    crrtMode: "CVVHD",
    dialyzer: "Oxiris Endotoxin & Cytokine Adsorption Membrane",
    accessSite: "Left Femoral Extended 13.5 Fr × 28cm",
    bloodFlowQb: 250,
    dialysateQd: 2200,
    replacementPre: 0,
    replacementPost: 0,
    netUfrTarget: 100,
    actualUfr: 98,
    tmp: 215,
    pFilter: 260,
    pVenous: 110,
    pAccess: -120,
    effluentDose: 24.2,
    citrateRate: 280,
    calciumInfusion: 52,
    postFilterIca: 0.38,
    systemicIca: 1.09,
    serumCreatinine: 5.9,
    bun: 98,
    potassium: 6.8,
    bicarbonate: 13.2,
    lactate: 4.8,
    status: "High Transmembrane Pressure",
    alerts: [
      { id: "alt-4", type: "critical", msg: "TMP > 200 mmHg (215 mmHg) - High Filter Coagulation Risk", time: "2m ago" },
      { id: "alt-5", type: "critical", msg: "Severe Acidemia / Serum K+ 6.8 mEq/L", time: "5m ago" },
    ],
  },
  {
    id: "CRRT-504",
    name: "Miriam Al-Mansoor",
    mrn: "MRN-66718",
    age: 43,
    gender: "Female",
    weightKg: 58.0,
    diagnosis: "Hepatorenal Syndrome Type 1 / Encephalopathy",
    kdigoStage: "Stage 2",
    crrtMode: "CVVHDF",
    dialyzer: "AN69 ST100 Membrane",
    accessSite: "Right Internal Jugular 12 Fr × 16cm",
    bloodFlowQb: 180,
    dialysateQd: 1200,
    replacementPre: 400,
    replacementPost: 400,
    netUfrTarget: 80,
    actualUfr: 80,
    tmp: 95,
    pFilter: 130,
    pVenous: 55,
    pAccess: -50,
    effluentDose: 35.8,
    citrateRate: 170,
    calciumInfusion: 32,
    postFilterIca: 0.30,
    systemicIca: 1.25,
    serumCreatinine: 2.9,
    bun: 51,
    potassium: 4.1,
    bicarbonate: 23.5,
    lactate: 1.6,
    status: "Weaning Assessment",
    alerts: [
      { id: "alt-6", type: "info", msg: "Spontaneous urine output increasing: 35 mL/hr", time: "30m ago" },
    ],
  },
];

const KDIGO_BADGES = {
  "Stage 1": { label: "KDIGO 1", cls: "bg-slate-500/20 text-slate-300 border-slate-500/40" },
  "Stage 2": { label: "KDIGO 2", cls: "bg-amber-500/20 text-amber-300 border-amber-500/40" },
  "Stage 3": { label: "KDIGO 3", cls: "bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse" },
};

function calcTotalEffluent(qd, repPre, repPost, netUfr) {
  return qd + repPre + repPost + netUfr;
}

function calcEffluentDose(totalEffluent, weightKg) {
  if (!weightKg || weightKg <= 0) return 0;
  return Number((totalEffluent / weightKg).toFixed(1));
}

function calcFiltrationFraction(repPre, netUfr, qb) {
  const plasmaFlowPerHour = qb * 60 * 0.70;
  if (plasmaFlowPerHour <= 0) return 0;
  return Number((((repPre + netUfr) / plasmaFlowPerHour) * 100).toFixed(1));
}

export default function NephrologyCrrtStationPage() {
  const { toasts, pushToast, removeToast } = useKindToasts();

  const [patients, setPatients] = useState(INITIAL_CRRT_PATIENTS);
  const [selectedId, setSelectedId] = useState(INITIAL_CRRT_PATIENTS[0].id);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState("ALL");
  const [isLiveSimulating, setIsLiveSimulating] = useState(true);

  const [activeModal, setActiveModal] = useState(null);
  const [modalPatient, setModalPatient] = useState(null);

  const [editParams, setEditParams] = useState({
    bloodFlowQb: 220,
    dialysateQd: 1400,
    replacementPre: 600,
    replacementPost: 600,
    netUfrTarget: 150,
    citrateRate: 240,
    calciumInfusion: 45,
  });

  const activePatient = useMemo(() => {
    return patients.find((p) => p.id === selectedId) || patients[0];
  }, [patients, selectedId]);

  const totalEffluent = useMemo(() => {
    return calcTotalEffluent(
      activePatient.dialysateQd,
      activePatient.replacementPre,
      activePatient.replacementPost,
      activePatient.netUfrTarget
    );
  }, [activePatient]);

  const effluentDose = useMemo(() => {
    return calcEffluentDose(totalEffluent, activePatient.weightKg);
  }, [totalEffluent, activePatient.weightKg]);

  const filtrationFraction = useMemo(() => {
    return calcFiltrationFraction(
      activePatient.replacementPre,
      activePatient.netUfrTarget,
      activePatient.bloodFlowQb
    );
  }, [activePatient]);

  useEffect(() => {
    if (!isLiveSimulating) return;

    const interval = setInterval(() => {
      setPatients((prev) =>
        prev.map((pt) => {
          const tmpJitter = Math.floor(Math.random() * 3) - 1;
          const pFilterJitter = Math.floor(Math.random() * 3) - 1;
          const pVenousJitter = Math.floor(Math.random() * 3) - 1;

          return {
            ...pt,
            pFilter: Math.max(100, Math.min(320, pt.pFilter + pFilterJitter)),
            pVenous: Math.max(30, Math.min(180, pt.pVenous + pVenousJitter)),
            tmp: Math.max(60, Math.min(280, pt.tmp + tmpJitter)),
          };
        })
      );
    }, 2500);

    return () => clearInterval(interval);
  }, [isLiveSimulating]);

  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animationFrameId;
    let offset = 0;

    const render = () => {
      const w = canvas.width;
      const h = canvas.height;

      ctx.fillStyle = "#020617";
      ctx.fillRect(0, 0, w, h);

      ctx.strokeStyle = "#1e293b";
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 0; x < w; x += 30) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
      }
      for (let y = 0; y < h; y += 20) {
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
      }
      ctx.stroke();

      ctx.strokeStyle = "#f59e0b";
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let x = 0; x < w; x++) {
        const t = (x + offset) * 0.06;
        const roller = Math.abs(Math.sin(t)) * 14 + Math.sin(3 * t) * 4;
        const y = h * 0.35 - roller;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      ctx.strokeStyle = "#06b6d4";
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let x = 0; x < w; x++) {
        const t = (x + offset) * 0.03;
        const tmpWave = Math.sin(t) * 8 + Math.cos(2 * t) * 4;
        const y = h * 0.75 - tmpWave;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      const sweepX = (offset * 3) % w;
      ctx.fillStyle = "rgba(6, 182, 212, 0.2)";
      ctx.fillRect(sweepX, 0, 4, h);

      offset += 1;
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  const handleOpenTitrate = (patient) => {
    setModalPatient(patient);
    setEditParams({
      bloodFlowQb: patient.bloodFlowQb,
      dialysateQd: patient.dialysateQd,
      replacementPre: patient.replacementPre,
      replacementPost: patient.replacementPost,
      netUfrTarget: patient.netUfrTarget,
      citrateRate: patient.citrateRate,
      calciumInfusion: patient.calciumInfusion,
    });
    setActiveModal("TITRATE_CRRT");
  };

  const handleSaveTitration = () => {
    if (!modalPatient) return;
    setPatients((prev) =>
      prev.map((p) => {
        if (p.id !== modalPatient.id) return p;
        const newTotalEffluent = calcTotalEffluent(
          Number(editParams.dialysateQd),
          Number(editParams.replacementPre),
          Number(editParams.replacementPost),
          Number(editParams.netUfrTarget)
        );
        const newEffluentDose = calcEffluentDose(newTotalEffluent, p.weightKg);

        return {
          ...p,
          bloodFlowQb: Number(editParams.bloodFlowQb),
          dialysateQd: Number(editParams.dialysateQd),
          replacementPre: Number(editParams.replacementPre),
          replacementPost: Number(editParams.replacementPost),
          netUfrTarget: Number(editParams.netUfrTarget),
          actualUfr: Number(editParams.netUfrTarget),
          citrateRate: Number(editParams.citrateRate),
          calciumInfusion: Number(editParams.calciumInfusion),
          effluentDose: newEffluentDose,
        };
      })
    );
    pushToast("success", `CRRT Prescription updated for ${modalPatient.name}.`);
    setActiveModal(null);
  };

  const triggerProtocol = (protocolName) => {
    pushToast("error", `🚨 EMERGENCY PROTOCOL: ${protocolName} executed on ${activePatient.name}.`);
    setActiveModal(null);
  };

  const handleExportCsv = () => {
    const exportData = patients.map((p) => {
      const totEff = calcTotalEffluent(p.dialysateQd, p.replacementPre, p.replacementPost, p.netUfrTarget);
      return {
        Patient_ID: p.id,
        Name: p.name,
        MRN: p.mrn,
        Age: p.age,
        Weight_Kg: p.weightKg,
        KDIGO_Stage: p.kdigoStage,
        CRRT_Mode: p.crrtMode,
        Blood_Flow_Qb: p.bloodFlowQb,
        Total_Effluent_mL_hr: totEff,
        Effluent_Dose_mL_kg_hr: calcEffluentDose(totEff, p.weightKg),
        TMP_mmHg: p.tmp,
        Filter_Pressure_mmHg: p.pFilter,
        Citrate_ACDA: p.citrateRate,
        Calcium_Infusion: p.calciumInfusion,
        Serum_Creatinine: p.serumCreatinine,
        Serum_Potassium: p.potassium,
        Status: p.status,
      };
    });

    downloadCsv(exportData, "Nephrology_CRRT_Telemetry_Export.csv");
    pushToast("info", "CRRT hemodialysis audit dataset exported successfully.");
  };

  const filteredPatients = useMemo(() => {
    return patients.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.mrn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.diagnosis.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchMode = filterMode === "ALL" || p.crrtMode === filterMode;
      return matchSearch && matchMode;
    });
  }, [patients, searchQuery, filterMode]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 font-sans selection:bg-cyan-500/30">
      <KindToastTray toasts={toasts} onDismiss={removeToast} />

      {/* Top Header */}
      <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 via-cyan-500/10 to-transparent border border-cyan-500/40 text-cyan-400 shadow-lg shadow-cyan-950/40">
              <Droplets className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                  Nephrology CRRT & Dialysis Command Station
                </h1>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-500/10 px-2.5 py-0.5 text-xs font-semibold text-cyan-400 border border-cyan-500/30">
                  <Activity className="h-3 w-3" /> KDIGO ICU Nephrology Level 1
                </span>
              </div>
              <p className="text-xs text-slate-400 sm:text-sm mt-0.5">
                Continuous Renal Replacement Therapy • Regional Citrate Anticoagulation (RCA) • TMP & Filter Surveillance
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
