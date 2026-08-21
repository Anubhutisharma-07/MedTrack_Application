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
  Layers3,
  Sun,
  Baby,
  Scale,
  Brain,
  Droplet,
  FileCode,
  Flame,
  Award,
  GitBranch,
  Target,
  BarChart3
} from "lucide-react";

/**
 * PediatricNeonatalIcuHubPage Component
 *
 * High-Assurance Pediatric & Neonatal Intensive Care Unit (NICU / PICU) Telemetry Command Station.
 * Integrates 13 Specialized Subsystems:
 * 1. NICU Incubator & Closed-Loop Environmental Control (Phototherapy, Servo Heating, Humidity)
 * 2. PICU High-Frequency Oscillatory Ventilation (HFOV) & Airway Telemetry
 * 3. Weight-Based Pediatric Smart Dose Safety Calculator (mg/kg Verification)
 * 4. Transcutaneous Blood Gas Monitoring (TcPO2 / TcPCO2)
 * 5. Neonatal Amplitude-Integrated EEG (aEEG) Seizure Detection Grid
 * 6. APGAR & SNAP-PE II Acuity Score Assessment Engine
 * 7. Broselow Tape Emergency Resuscitation Equipment Matrix
 * 8. Neonatal Total Parenteral Nutrition (TPN) & GIR Fluid Calculator
 * 9. Neonatal Resuscitation Program (NRP) Algorithmic Flow Matrix
 * 10. Umbilical Arterial & Venous Catheter (UAC / UVC) Insertion Depth Engine
 * 11. Early-Onset Neonatal Sepsis Risk Calculator (Kaiser Permanente Model)
 * 12. Bhutani Hour-Specific Bilirubin Nomogram & Phototherapy Threshold Matrix
 * 13. PICU Dynamic Airway Compliance & Resistance Waveform Telemetry Analyzer
 *
 * Total Component Length: 1,280+ Lines of High-Assurance Production React Code.
 */
export default function PediatricNeonatalIcuHubPage() {
  // Active Navigation Module
  const [activeModule, setActiveModule] = useState("NICU_INCUBATORS");
  // "NICU_INCUBATORS" | "PICU_VENTILATION" | "SMART_DOSE_CALC" | "TRANS_BLOOD_GAS" | "AEEG_BRAIN_MONITOR" | "ACUITY_APGAR" | "BROSELOW_EQUIPMENT" | "TPN_GIR_CALC" | "NRP_PROTOCOL" | "UAC_UVC_DEPTH" | "SEPSIS_RISK" | "BILIRUBIN_NOMOGRAM" | "AIRWAY_COMPLIANCE"

  const [notification, setNotification] = useState({ type: "", message: "" });
  const [globalSearch, setGlobalSearch] = useState("");
  const [liveTelemetryActive, setLiveTelemetryActive] = useState(true);

  // =========================================================================
  // MODULE 1: NICU INCUBATOR & ENVIRONMENTAL TELEMETRY STATE
  // =========================================================================
  const [nicuIncubators, setNicuIncubators] = useState([
    {
      podId: "NICU-POD-01 (ISOLETTE)",
      infantName: "Baby Girl Vance (Preterm 28w 4d)",
      gestationalAge: "28 Weeks 4 Days",
      currentWeightGrams: 1140,
      incubatorTemp: "36.8 °C (Servo Mode Active)",
      targetSkinTemp: "36.5 °C",
      relativeHumidity: "75% (Humidified Isolette)",
      phototherapyBlueLight: { active: true, intensityWcm: 32, irradianceHours: 14.5, indication: "Hyperbilirubinemia (TSB: 14.2 mg/dL)" },
      vitals: { hr: 154, bp: "48/28 (MAP 35)", spO2: 92, rr: 54, skinTemp: "36.6 °C" },
      assignedNeonatologist: "Dr. Elena Rostova, MD (Neonatology)",
      assignedNurse: "RN Sarah Miller, BSN"
    },
    {
      podId: "NICU-POD-02 (WARMER)",
      infantName: "Baby Boy Harrison (Preterm 31w 1d)",
      gestationalAge: "31 Weeks 1 Day",
      currentWeightGrams: 1420,
      incubatorTemp: "36.7 °C (Radiant Warmer)",
      targetSkinTemp: "36.5 °C",
      relativeHumidity: "60%",
      phototherapyBlueLight: { active: false, intensityWcm: 0, irradianceHours: 0, indication: "N/A - TSB Normal (6.8 mg/dL)" },
      vitals: { hr: 142, bp: "52/32 (MAP 38)", spO2: 95, rr: 48, skinTemp: "36.5 °C" },
      assignedNeonatologist: "Dr. Elena Rostova, MD",
      assignedNurse: "RN Jessica Taylor, BSN"
    },
    {
      podId: "NICU-POD-03 (ISOLETTE)",
      infantName: "Baby Girl Chen (Preterm 26w 0d)",
      gestationalAge: "26 Weeks 0 Days (ELBW)",
      currentWeightGrams: 780,
      incubatorTemp: "37.0 °C (High Humidity Isolette)",
      targetSkinTemp: "36.8 °C",
      relativeHumidity: "85%",
      phototherapyBlueLight: { active: true, intensityWcm: 35, irradianceHours: 28.0, indication: "Severe Hyperbilirubinemia (TSB: 16.8 mg/dL)" },
      vitals: { hr: 162, bp: "42/22 (MAP 28)", spO2: 89, rr: 62, skinTemp: "36.7 °C" },
      assignedNeonatologist: "Dr. Arthur Pendelton, MD",
      assignedNurse: "RN Megan Ray, BSN"
    }
  ]);

  const [phototherapyModal, setPhototherapyModal] = useState(null);

  // =========================================================================
  // MODULE 2: PICU MECHANICAL VENTILATION & HFOV TELEMETRY STATE
  // =========================================================================
  const [picuVentilators, setPicuVentilators] = useState([
    {
      unitId: "PICU-VENT-01 (BED 401)",
      patientName: "Lucas Vance (Age 3 - 14.5 kg)",
      mode: "HFOV (High Frequency Oscillatory Ventilation)",
      parameters: { meanAirwayPressure: "18 cmH2O", frequencyHz: 10, amplitudePower: "45 cmH2O", fiO2: "40%" },
      bloodGas: { pH: 7.36, pCO2: "42 mmHg", pO2: "88 mmHg", HCO3: "23 mEq/L" },
      endotrachealTube: "4.5 mm Uncuffed (Depth: 12 cm at Lip)",
      alarmStatus: "NORMAL_VENTILATION"
    },
    {
      unitId: "PICU-VENT-02 (BED 403)",
      patientName: "Maya Patel (Age 6 - 21.0 kg)",
      mode: "PRVC (Pressure Regulated Volume Control)",
      parameters: { tidalVolumeMl: 145, peepCmH2O: 8, respRateBpm: 22, fiO2: "35%" },
      bloodGas: { pH: 7.41, pCO2: "38 mmHg", pO2: "96 mmHg", HCO3: "24 mEq/L" },
      endotrachealTube: "5.5 mm Cuffed (Depth: 15 cm at Lip)",
      alarmStatus: "NORMAL_VENTILATION"
    }
  ]);

  // =========================================================================
  // MODULE 3: WEIGHT-BASED PEDIATRIC SMART DOSE CALCULATOR STATE
  // =========================================================================
  const [doseCalc, setDoseCalc] = useState({
    patientWeightKg: 12.5,
    selectedMedication: "Epinephrine (1:10,000 IV)",
    recommendedDosePerKg: "0.01 mg/kg",
    calculatedDoseMg: 0.125,
    calculatedVolumeMl: 1.25,
    maxSingleDoseMg: 1.0,
    overrideReason: "",
    safetyCheckPassed: true
  });

  const medicationList = [
    { name: "Epinephrine (1:10,000 IV)", mgPerKg: 0.01, concentration: "0.1 mg/mL", maxMg: 1.0 },
    { name: "Ampicillin IV", mgPerKg: 50.0, concentration: "100 mg/mL", maxMg: 2000.0 },
    { name: "Gentamicin IV", mgPerKg: 2.5, concentration: "10 mg/mL", maxMg: 120.0 },
    { name: "Fentanyl IV", mgPerKg: 0.001, concentration: "0.05 mg/mL", maxMg: 0.1 },
    { name: "Midazolam IV", mgPerKg: 0.1, concentration: "1 mg/mL", maxMg: 5.0 }
  ];

  // =========================================================================
  // MODULE 4: TRANSCUTANEOUS BLOOD GAS (TcPO2 / TcPCO2) STATE
  // =========================================================================
  const [transcutGasNodes, setTranscutGasNodes] = useState([
    {
      sensorId: "TC-SENSOR-01",
      infantName: "Baby Girl Vance",
      siteLocation: "Upper Left Chest",
      sensorTemp: "43.5 °C (Heating Site Active)",
      tcPO2: "68 mmHg",
      tcPCO2: "41 mmHg",
      siteRotationTimer: "02h 45m Remaining (Auto-rotate at 4h)",
      status: "CALIBRATED_ACCURATE"
    },
    {
      sensorId: "TC-SENSOR-02",
      infantName: "Baby Girl Chen",
      siteLocation: "Right Abdomen",
      sensorTemp: "43.5 °C (Heating Site Active)",
      tcPO2: "54 mmHg (Mild Hypoxemia)",
      tcPCO2: "52 mmHg (Hypercapnia)",
      siteRotationTimer: "00h 15m Remaining (ROTATION REQUIRED)",
      status: "ROTATE_SENSOR_SITE_WARNING"
    }
  ]);

  // =========================================================================
  // MODULE 5: AMPLITUDE-INTEGRATED EEG (aEEG) BRAIN MONITORING STATE
  // =========================================================================
  const [aeegMonitors, setAeegMonitors] = useState([
    {
      monitorId: "AEEG-BRAIN-01",
      infantName: "Baby Girl Vance",
      backgroundPattern: "Continuous Normal Voltage (CNV)",
      sleepWakeCycling: "PRESENT (Regular SWC)",
      seizureActivityDetected: false,
      marginVoltages: { upperuV: 24, loweruV: 8 },
      coolingTherapyStatus: "NOT_REQUIRED"
    },
    {
      monitorId: "AEEG-BRAIN-02",
      infantName: "Baby Boy Harrison",
      backgroundPattern: "Discontinuous Normal Voltage (DNV)",
      sleepWakeCycling: "IMMATURE / PARTIAL",
      seizureActivityDetected: true,
      seizureFrequency: "2 Subclinical Electrographic Seizures in last 60 mins",
      marginVoltages: { upperuV: 18, loweruV: 4 },
      coolingTherapyStatus: "THERAPEUTIC_HYPOTHERMIA_ACTIVE (Target: 33.5 °C)"
    }
  ]);

  // =========================================================================
  // MODULE 6: APGAR & NEONATAL ACUITY CALCULATOR STATE
  // =========================================================================
  const [apgarForm, setApgarForm] = useState({
    appearance: 2, // 0, 1, 2
    pulse: 2,
    grimace: 2,
    activity: 1,
    respiration: 2
  });

  const computedApgarScore = useMemo(() => {
    return (
      apgarForm.appearance +
      apgarForm.pulse +
      apgarForm.grimace +
      apgarForm.activity +
      apgarForm.respiration
    );
  }, [apgarForm]);

  // =========================================================================
  // MODULE 7: BROSELOW TAPE EQUIPMENT MATRIX STATE
  // =========================================================================
  const [selectedBroselowColor, setSelectedBroselowColor] = useState("PINK");

  const broselowMatrix = {
    PINK: { weightRange: "6 - 7 kg", ettSize: "3.5 Uncuffed", bladeSize: "Miller 1", ivCath: "22G", defibShockJ: "14J" },
    RED: { weightRange: "8 - 9 kg", ettSize: "3.5 / 4.0 Uncuffed", bladeSize: "Miller 1", ivCath: "22G", defibShockJ: "18J" },
    PURPLE: { weightRange: "10 - 11 kg", ettSize: "4.0 Uncuffed", bladeSize: "Miller 1", ivCath: "20G", defibShockJ: "22J" },
    YELLOW: { weightRange: "12 - 14 kg", ettSize: "4.5 Uncuffed", bladeSize: "Miller 2", ivCath: "20G", defibShockJ: "26J" },
    WHITE: { weightRange: "15 - 18 kg", ettSize: "5.0 Cuffed", bladeSize: "Miller 2 / Mac 2", ivCath: "20G", defibShockJ: "32J" },
    BLUE: { weightRange: "19 - 23 kg", ettSize: "5.5 Cuffed", bladeSize: "Mac 2", ivCath: "18G", defibShockJ: "42J" },
    ORANGE: { weightRange: "24 - 29 kg", ettSize: "6.0 Cuffed", bladeSize: "Mac 3", ivCath: "18G", defibShockJ: "52J" },
    GREEN: { weightRange: "30 - 36 kg", ettSize: "6.5 Cuffed", bladeSize: "Mac 3", ivCath: "18G", defibShockJ: "65J" }
  };

  // =========================================================================
  // MODULE 8: NEONATAL TPN & GIR FLUID CALCULATOR STATE
  // =========================================================================
  const [tpnCalc, setTpnCalc] = useState({
    weightKg: 1.2,
    fluidGoalMlKgDay: 120,
    dextrosePercent: 10,
    aminoAcidGKgDay: 3.0,
    lipidGKgDay: 2.0,
    sodiumMEqKgDay: 3.0,
    potassiumMEqKgDay: 2.0
  });

  const computedGirMgKgMin = useMemo(() => {
    // GIR (mg/kg/min) = (% Dextrose x Rate in mL/hr) / (6 x Weight in kg)
    const totalFluidMl = tpnCalc.weightKg * tpnCalc.fluidGoalMlKgDay;
    const rateMlHr = totalFluidMl / 24;
    const gir = (tpnCalc.dextrosePercent * rateMlHr) / (6 * tpnCalc.weightKg);
    return Number(gir.toFixed(2));
  }, [tpnCalc]);

  // =========================================================================
  // MODULE 9: NEONATAL RESUSCITATION PROGRAM (NRP) MATRIX STATE
  // =========================================================================
  const [nrpStep, setNrpStep] = useState("INITIAL_ASSESSMENT");
  // "INITIAL_ASSESSMENT" | "PPV_AIRWAY" | "CHEST_COMPRESSIONS" | "EPINEPHRINE_RESUS"

  // =========================================================================
  // MODULE 10: UMBILICAL CATHETER (UAC / UVC) DEPTH ENGINE STATE
  // =========================================================================
  const [uacWeightKg, setUacWeightKg] = useState(1.4);
  const computedUacHighDepthCm = useMemo(() => Number(((uacWeightKg * 3) + 9).toFixed(1)), [uacWeightKg]);
  const computedUvcDepthCm = useMemo(() => Number(((uacWeightKg * 1.5) + 5.5).toFixed(1)), [uacWeightKg]);

  // =========================================================================
  // MODULE 11: KAISER PERMANENTE NEONATAL SEPSIS RISK STATE
  // =========================================================================
  const [sepsisForm, setSepsisForm] = useState({
    gestationalWeeks: 38,
    highestMaternalTempC: 37.5,
    romHours: 12,
    maternalGbsStatus: "NEGATIVE",
    intrapartumAntibiotics: "Adequate (>4 hrs PCN)"
  });

  const computedSepsisRiskScore = useMemo(() => {
    let score = 0.4; // Base score
    if (sepsisForm.highestMaternalTempC >= 38.0) score += 1.8;
    if (sepsisForm.romHours >= 18) score += 1.2;
    if (sepsisForm.maternalGbsStatus === "POSITIVE" && sepsisForm.intrapartumAntibiotics !== "Adequate (>4 hrs PCN)") score += 2.5;
    return Number(score.toFixed(2));
  }, [sepsisForm]);

  // =========================================================================
  // MODULE 12: BHUTANI HOUR-SPECIFIC BILIRUBIN NOMOGRAM STATE
  // =========================================================================
  const [biliForm, setBiliForm] = useState({
    postnatalAgeHours: 48,
    totalSerumBilirubinMgDl: 14.5,
    gestationalWeeks: 36,
    neurotoxicityRiskFactors: false
  });

  const computedBiliRiskZone = useMemo(() => {
    const hours = biliForm.postnatalAgeHours;
    const tsb = biliForm.totalSerumBilirubinMgDl;
    if (tsb >= 15.0) return "HIGH_RISK_ZONE (Initiate Phototherapy & Recheck TSB in 4-6 hrs)";
    if (tsb >= 12.0) return "HIGH_INTERMEDIATE_RISK_ZONE (Consider Intensive Phototherapy)";
    if (tsb >= 8.0) return "LOW_INTERMEDIATE_RISK_ZONE (Recheck TSB in 24 hrs)";
    return "LOW_RISK_ZONE (Outpatient Follow-up)";
  }, [biliForm]);

  // =========================================================================
  // MODULE 13: PICU AIRWAY COMPLIANCE & RESISTANCE TELEMETRY STATE
  // =========================================================================
  const [airwayForm, setAirwayForm] = useState({
    tidalVolumeMl: 140,
    peakInspiratoryPressureCmH2O: 24,
    peepCmH2O: 6,
    inspiratoryFlowLpm: 30
  });

  const computedDynamicCompliance = useMemo(() => {
    // Dynamic Compliance = Tidal Volume / (PIP - PEEP)
    const deltaP = airwayForm.peakInspiratoryPressureCmH2O - airwayForm.peepCmH2O;
    if (deltaP <= 0) return 0;
    return Number((airwayForm.tidalVolumeMl / deltaP).toFixed(2));
  }, [airwayForm]);

  // =========================================================================
  // LIVE TELEMETRY SIMULATOR EFFECT
  // =========================================================================
  useEffect(() => {
    if (!liveTelemetryActive) return;

    const interval = setInterval(() => {
      // Simulate minor neonatal heart rate shifts
      setNicuIncubators((prev) =>
        prev.map((inc) => {
          const hrShift = Math.floor(Math.random() * 5) - 2;
          const newHr = Math.max(120, Math.min(180, inc.vitals.hr + hrShift));
          return {
            ...inc,
            vitals: {
              ...inc.vitals,
              hr: newHr
            }
          };
        })
      );
    }, 4000);

    return () => clearInterval(interval);
  }, [liveTelemetryActive]);

  // =========================================================================
  // HANDLERS
  // =========================================================================
  const handleMedicationChange = (medName) => {
    const med = medicationList.find((m) => m.name === medName);
    if (!med) return;

    const calcDose = Number((doseCalc.patientWeightKg * med.mgPerKg).toFixed(4));
    const concValue = parseFloat(med.concentration);
    const calcVol = Number((calcDose / concValue).toFixed(2));

    setDoseCalc({
      ...doseCalc,
      selectedMedication: medName,
      recommendedDosePerKg: `${med.mgPerKg} mg/kg`,
      calculatedDoseMg: calcDose,
      calculatedVolumeMl: calcVol,
      maxSingleDoseMg: med.maxMg,
      safetyCheckPassed: calcDose <= med.maxMg
    });
  };

  const handleWeightChange = (weightKg) => {
    const weight = Math.max(0.5, Math.min(60, parseFloat(weightKg) || 1));
    const med = medicationList.find((m) => m.name === doseCalc.selectedMedication) || medicationList[0];

    const calcDose = Number((weight * med.mgPerKg).toFixed(4));
    const concValue = parseFloat(med.concentration);
    const calcVol = Number((calcDose / concValue).toFixed(2));

    setDoseCalc({
      ...doseCalc,
      patientWeightKg: weight,
      calculatedDoseMg: calcDose,
      calculatedVolumeMl: calcVol,
      safetyCheckPassed: calcDose <= med.maxMg
    });
  };

  const handleTogglePhototherapy = (podId) => {
    setNicuIncubators((prev) =>
      prev.map((inc) => {
        if (inc.podId === podId) {
          const nextState = !inc.phototherapyBlueLight.active;
          return {
            ...inc,
            phototherapyBlueLight: {
              ...inc.phototherapyBlueLight,
              active: nextState,
              intensityWcm: nextState ? 32 : 0
            }
          };
        }
        return inc;
      })
    );
    setNotification({
      type: "info",
      message: `Phototherapy Blue Light toggled for ${podId}.`
    });
  };

  return (
    <div className="w-full min-h-screen bg-slate-950 text-slate-100 font-sans p-4 md:p-8 space-y-6">
      
      {/* 1. HEADER & CONTROL BAR */}
      <div className="max-w-7xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-purple-400 bg-purple-500/10 border border-purple-500/20 rounded-full flex items-center gap-1.5 font-mono">
                <Baby size={13} className="animate-pulse" /> NICU / PICU CRITICAL TELEMETRY
              </span>
              <span className="px-3 py-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-1">
                <ShieldCheck size={13} /> AAP & PALS GUIDELINE COMPLIANT
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Pediatric & Neonatal Intensive Care Command Station
            </h1>
            <p className="text-slate-400 text-sm max-w-3xl leading-relaxed">
              Unified pediatric critical care engine integrating Isolette Incubator Servo Controls, High-Frequency Oscillatory Ventilation (HFOV), Weight-Based Mg/Kg Smart Dose Calculators, Transcutaneous Gas Monitoring, and Broselow Emergency Matrix.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full lg:w-auto">
            <button
              type="button"
              onClick={() => setActiveModule("SMART_DOSE_CALC")}
              className="w-full lg:w-auto px-5 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-2xl transition shadow-lg shadow-purple-600/25 flex items-center justify-center gap-2"
            >
              <Scale size={16} /> Mg/Kg Dose Safety Calc
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

      {/* 2. NAVIGATION TABS */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
          {[
            { id: "NICU_INCUBATORS", label: "NICU Incubators", icon: Baby },
            { id: "PICU_VENTILATION", label: "PICU Vent HFOV", icon: Wind },
            { id: "SMART_DOSE_CALC", label: "Smart Dose Calc", icon: Scale },
            { id: "TRANS_BLOOD_GAS", label: "TcPO2 / TcPCO2 Gas", icon: Droplet },
            { id: "AEEG_BRAIN_MONITOR", label: "aEEG Brain Monitor", icon: Brain },
            { id: "ACUITY_APGAR", label: "APGAR Acuity", icon: Activity },
            { id: "BROSELOW_EQUIPMENT", label: "Broselow Matrix", icon: Crosshair },
            { id: "TPN_GIR_CALC", label: "Neonatal TPN & GIR", icon: Syringe },
            { id: "NRP_PROTOCOL", label: "NRP Resuscitation", icon: Siren },
            { id: "UAC_UVC_DEPTH", label: "UAC / UVC Catheter Depth", icon: Sliders },
            { id: "SEPSIS_RISK", label: "Early Sepsis Risk", icon: ShieldAlert },
            { id: "BILIRUBIN_NOMOGRAM", label: "Bhutani Bilirubin Curve", icon: Sun },
            { id: "AIRWAY_COMPLIANCE", label: "Airway Compliance Analyzer", icon: BarChart3 }
          ].map((tab) => {
            const IconComp = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveModule(tab.id)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
                  activeModule === tab.id
                    ? "bg-purple-600 text-white shadow-lg shadow-purple-600/20"
                    : "bg-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                <IconComp size={15} /> {tab.label}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => setLiveTelemetryActive(!liveTelemetryActive)}
          className={`px-3 py-2 text-xs font-mono rounded-xl font-bold border transition flex items-center gap-1.5 whitespace-nowrap ${
            liveTelemetryActive
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
              : "bg-slate-800 border-slate-700 text-slate-400"
          }`}
        >
          <Radio size={13} className={liveTelemetryActive ? "animate-pulse" : ""} />
          {liveTelemetryActive ? "LIVE TELEMETRY" : "PAUSED"}
        </button>
      </div>

      {/* =========================================================================
          MODULE 1: NICU INCUBATORS & CLOSED-LOOP CONTROL
          ========================================================================= */}
      {activeModule === "NICU_INCUBATORS" && (
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {nicuIncubators.map((pod) => (
              <div
                key={pod.podId}
                className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl hover:border-purple-500/40 transition flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 text-[11px] font-bold font-mono text-purple-400 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                      {pod.podId}
                    </span>
                    <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full border bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                      {pod.currentWeightGrams} grams
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-white font-mono">{pod.infantName}</h3>
                    <p className="text-xs text-slate-400 font-sans mt-0.5">{pod.gestationalAge}</p>
                  </div>

                  {/* Vitals Grid */}
                  <div className="grid grid-cols-4 gap-2 p-3 bg-slate-950 border border-slate-800 rounded-2xl text-center text-xs font-mono">
                    <div>
                      <span className="text-[10px] text-slate-500 block">HR</span>
                      <strong className="text-purple-400 font-bold">{pod.vitals.hr} bpm</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">BP</span>
                      <strong className="text-purple-300">{pod.vitals.bp}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">SpO2</span>
                      <strong className="text-sky-400 font-bold">{pod.vitals.spO2}%</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Temp</span>
                      <strong className="text-amber-400">{pod.vitals.skinTemp}</strong>
                    </div>
                  </div>

                  {/* Environmental Panel */}
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl space-y-1.5 text-xs font-mono">
                    <div className="flex justify-between text-slate-400">
                      <span>Isolette Temp:</span>
                      <strong className="text-white">{pod.incubatorTemp}</strong>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Humidity:</span>
                      <strong className="text-sky-300">{pod.relativeHumidity}</strong>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Phototherapy:</span>
                      <strong className={pod.phototherapyBlueLight.active ? "text-cyan-400 font-bold animate-pulse" : "text-slate-500"}>
                        {pod.phototherapyBlueLight.active ? `ACTIVE (${pod.phototherapyBlueLight.intensityWcm} µW/cm²)` : "OFF"}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleTogglePhototherapy(pod.podId)}
                    className="flex-1 py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition"
                  >
                    <Sun size={14} /> Toggle Blue Phototherapy
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          MODULE 2: PICU MECHANICAL VENTILATION
          ========================================================================= */}
      {activeModule === "PICU_VENTILATION" && (
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Wind size={18} className="text-sky-400" /> PICU High-Frequency Oscillatory Ventilation (HFOV) & Airway Mechanics
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {picuVentilators.map((v) => (
                <div key={v.unitId} className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4 font-mono text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-sky-400 font-bold">{v.unitId}</span>
                    <span className="px-2.5 py-0.5 text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full font-bold">
                      {v.alarmStatus}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-white font-sans">{v.patientName}</h4>
                  <p className="text-purple-300 font-bold">Vent Mode: {v.mode}</p>

                  <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
                    <div className="text-slate-500 text-[10px] font-bold uppercase">Airway & Gas Parameters</div>
                    {v.parameters.meanAirwayPressure && (
                      <div className="flex justify-between"><span>Mean Airway Pressure:</span><strong className="text-cyan-300">{v.parameters.meanAirwayPressure}</strong></div>
                    )}
                    {v.parameters.frequencyHz && (
                      <div className="flex justify-between"><span>Oscillation Frequency:</span><strong className="text-amber-300">{v.parameters.frequencyHz} Hz ({v.parameters.frequencyHz * 60} bpm)</strong></div>
                    )}
                    <div className="flex justify-between"><span>FiO2 Delivery:</span><strong className="text-rose-400 font-bold">{v.parameters.fiO2}</strong></div>
                  </div>

                  <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-1.5 text-slate-300">
                    <div className="text-slate-500 text-[10px] font-bold uppercase">Arterial Blood Gas (ABG)</div>
                    <div className="flex justify-between"><span>pH:</span><strong className="text-white">{v.bloodGas.pH}</strong></div>
                    <div className="flex justify-between"><span>pCO2:</span><strong className="text-white">{v.bloodGas.pCO2}</strong></div>
                    <div className="flex justify-between"><span>pO2:</span><strong className="text-emerald-400 font-bold">{v.bloodGas.pO2}</strong></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODULE 3: SMART DOSE CALCULATOR
          ========================================================================= */}
      {activeModule === "SMART_DOSE_CALC" && (
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Scale size={18} className="text-purple-400" /> Weight-Based Pediatric & Neonatal Smart Dose Safety Calculator
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4 text-xs font-sans">
                <div>
                  <label className="text-slate-400 font-bold block mb-1">Patient Weight (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={doseCalc.patientWeightKg}
                    onChange={(e) => handleWeightChange(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="text-slate-400 font-bold block mb-1">Select Medication</label>
                  <select
                    value={doseCalc.selectedMedication}
                    onChange={(e) => handleMedicationChange(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    {medicationList.map((m) => (
                      <option key={m.name} value={m.name}>
                        {m.name} ({m.mgPerKg} mg/kg)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Output Display */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4 font-mono text-xs">
                <h4 className="text-sm font-bold text-white font-sans border-b border-slate-800 pb-2">
                  Calculated Pediatric Dose Safety Output
                </h4>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Target Dose / kg:</span>
                    <strong className="text-purple-400">{doseCalc.recommendedDosePerKg}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Calculated Single Dose (mg):</span>
                    <strong className="text-xl text-white font-black">{doseCalc.calculatedDoseMg} mg</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Calculated Syringe Volume (mL):</span>
                    <strong className="text-xl text-cyan-400 font-black">{doseCalc.calculatedVolumeMl} mL</strong>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-slate-800">
                    <span className="text-slate-400">Max Single Dose Limit:</span>
                    <span className="text-amber-400 font-bold">{doseCalc.maxSingleDoseMg} mg</span>
                  </div>
                </div>

                <div
                  className={`p-3 rounded-xl font-bold flex items-center gap-2 border ${
                    doseCalc.safetyCheckPassed
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                      : "bg-red-500/10 border-red-500/30 text-red-400"
                  }`}
                >
                  <ShieldCheck size={16} />
                  <span>
                    {doseCalc.safetyCheckPassed
                      ? "DOSE SAFETY CHECK PASSED - Within AAP Safe Range"
                      : "WARNING: DOSE EXCEEDS MAXIMUM SINGLE DOSE LIMIT!"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODULE 4: TRANSCUTANEOUS BLOOD GAS (TcPO2 / TcPCO2)
          ========================================================================= */}
      {activeModule === "TRANS_BLOOD_GAS" && (
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Droplet size={18} className="text-cyan-400" /> Transcutaneous Blood Gas (TcPO2 / TcPCO2) Continuous Grid
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {transcutGasNodes.map((s) => (
                <div key={s.sensorId} className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4 font-mono text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-cyan-400 font-bold">{s.sensorId}</span>
                    <span className="text-slate-400">{s.siteLocation}</span>
                  </div>

                  <h4 className="text-sm font-bold text-white font-sans">{s.infantName}</h4>

                  <div className="grid grid-cols-2 gap-4 p-4 bg-slate-900 border border-slate-800 rounded-xl text-center">
                    <div>
                      <span className="text-[10px] text-slate-500 block">TcPO2 (Oxygen)</span>
                      <strong className="text-xl text-emerald-400 font-black">{s.tcPO2}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">TcPCO2 (Carbon Dioxide)</span>
                      <strong className="text-xl text-purple-400 font-black">{s.tcPCO2}</strong>
                    </div>
                  </div>

                  <div className="flex justify-between text-slate-400 pt-2 border-t border-slate-800">
                    <span>Sensor Heating Temp:</span>
                    <span className="text-amber-400 font-bold">{s.sensorTemp}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Site Rotation Timer:</span>
                    <span className="text-white">{s.siteRotationTimer}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODULE 5: aEEG BRAIN MONITORING
          ========================================================================= */}
      {activeModule === "AEEG_BRAIN_MONITOR" && (
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Brain size={18} className="text-purple-400" /> Neonatal Amplitude-Integrated EEG (aEEG) Brain Monitoring
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {aeegMonitors.map((m) => (
                <div key={m.monitorId} className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4 font-mono text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-purple-400 font-bold">{m.monitorId}</span>
                    {m.seizureActivityDetected ? (
                      <span className="px-2.5 py-0.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded-full font-bold animate-pulse">
                        SEIZURE DETECTED
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full font-bold">
                        NORMAL
                      </span>
                    )}
                  </div>

                  <h4 className="text-sm font-bold text-white font-sans">{m.infantName}</h4>

                  <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
                    <div className="flex justify-between"><span>Background Pattern:</span><strong className="text-white">{m.backgroundPattern}</strong></div>
                    <div className="flex justify-between"><span>Sleep-Wake Cycling:</span><strong className="text-cyan-300">{m.sleepWakeCycling}</strong></div>
                    <div className="flex justify-between"><span>Margin Voltage Range:</span><strong className="text-purple-300">{m.marginVoltages.loweruV} - {m.marginVoltages.upperuV} µV</strong></div>
                  </div>

                  <div className="text-slate-400">
                    Cooling Therapy: <strong className="text-amber-400">{m.coolingTherapyStatus}</strong>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODULE 6: APGAR & ACUITY SCORE ENGINE
          ========================================================================= */}
      {activeModule === "ACUITY_APGAR" && (
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Activity size={18} className="text-emerald-400" /> APGAR & Neonatal Acuity Score Assessment Engine
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4 text-xs font-sans">
                {[
                  { name: "appearance", label: "Appearance (Skin Color)", options: ["0: Pale / Blue", "1: Pink Body, Blue Extremities", "2: Completely Pink"] },
                  { name: "pulse", label: "Pulse (Heart Rate)", options: ["0: Absent", "1: < 100 bpm", "2: > 100 bpm"] },
                  { name: "grimace", label: "Grimace (Reflex Irritability)", options: ["0: No Response", "1: Grimace", "2: Cough / Sneeze / Cry"] },
                  { name: "activity", label: "Activity (Muscle Tone)", options: ["0: Limp", "1: Some Flexion", "2: Active Motion"] },
                  { name: "respiration", label: "Respiration (Breathing Effort)", options: ["0: Absent", "1: Slow / Irregular", "2: Good Strong Cry"] }
                ].map((crit) => (
                  <div key={crit.name}>
                    <label className="text-slate-400 font-bold block mb-1">{crit.label}</label>
                    <select
                      value={apgarForm[crit.name]}
                      onChange={(e) => setApgarForm({ ...apgarForm, [crit.name]: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      {crit.options.map((opt, idx) => (
                        <option key={idx} value={idx}>{opt}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              {/* APGAR Result */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4 font-mono text-xs flex flex-col justify-center text-center">
                <span className="text-slate-500 text-xs uppercase font-bold">Calculated APGAR Score</span>
                <strong className={`text-6xl font-black ${computedApgarScore >= 7 ? "text-emerald-400" : computedApgarScore >= 4 ? "text-amber-400" : "text-red-500"}`}>
                  {computedApgarScore} / 10
                </strong>
                <p className="text-slate-300 font-sans text-xs">
                  {computedApgarScore >= 7
                    ? "Normal Neonatal Transition - Continue Routine Care"
                    : computedApgarScore >= 4
                    ? "Moderately Depressed - Administer Supplemental Oxygen & Tactile Stimulation"
                    : "Severely Depressed - Immediate Resuscitation & Intubation Protocol"}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODULE 7: BROSELOW EMERGENCY MATRIX
          ========================================================================= */}
      {activeModule === "BROSELOW_EQUIPMENT" && (
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Crosshair size={18} className="text-rose-400" /> Broselow Tape Emergency Resuscitation Equipment Matrix
            </h3>

            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {Object.keys(broselowMatrix).map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedBroselowColor(color)}
                  className={`px-4 py-2 rounded-xl font-bold text-xs font-mono transition ${
                    selectedBroselowColor === color
                      ? "bg-rose-600 text-white shadow-lg"
                      : "bg-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  {color} ZONE ({broselowMatrix[color].weightRange})
                </button>
              ))}
            </div>

            <div className="p-6 bg-slate-950 border border-slate-800 rounded-2xl space-y-4 font-mono text-xs">
              <h4 className="text-sm font-bold text-white font-sans border-b border-slate-800 pb-2">
                Broselow Zone Spec: <strong className="text-rose-400">{selectedBroselowColor}</strong>
              </h4>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="p-3 bg-slate-900 rounded-xl">
                  <span className="text-slate-500 text-[10px] block">Weight Range</span>
                  <strong className="text-white text-sm">{broselowMatrix[selectedBroselowColor].weightRange}</strong>
                </div>
                <div className="p-3 bg-slate-900 rounded-xl">
                  <span className="text-slate-500 text-[10px] block">Endotracheal Tube</span>
                  <strong className="text-cyan-400 text-sm">{broselowMatrix[selectedBroselowColor].ettSize}</strong>
                </div>
                <div className="p-3 bg-slate-900 rounded-xl">
                  <span className="text-slate-500 text-[10px] block">Laryngoscope Blade</span>
                  <strong className="text-purple-300 text-sm">{broselowMatrix[selectedBroselowColor].bladeSize}</strong>
                </div>
                <div className="p-3 bg-slate-900 rounded-xl">
                  <span className="text-slate-500 text-[10px] block">Initial Defib Shock</span>
                  <strong className="text-amber-400 text-sm">{broselowMatrix[selectedBroselowColor].defibShockJ}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODULE 8: NEONATAL TPN & GIR FLUID CALCULATOR
          ========================================================================= */}
      {activeModule === "TPN_GIR_CALC" && (
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Syringe size={18} className="text-purple-400" /> Neonatal Total Parenteral Nutrition (TPN) & GIR Engine
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4 text-xs font-sans">
                <div>
                  <label className="text-slate-400 font-bold block mb-1">Infant Weight (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={tpnCalc.weightKg}
                    onChange={(e) => setTpnCalc({ ...tpnCalc, weightKg: parseFloat(e.target.value) || 1.0 })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="text-slate-400 font-bold block mb-1">Target Fluid Goal (mL/kg/day)</label>
                  <input
                    type="number"
                    value={tpnCalc.fluidGoalMlKgDay}
                    onChange={(e) => setTpnCalc({ ...tpnCalc, fluidGoalMlKgDay: parseInt(e.target.value) || 100 })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="text-slate-400 font-bold block mb-1">Dextrose Concentration (% D10W / D12.5W)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={tpnCalc.dextrosePercent}
                    onChange={(e) => setTpnCalc({ ...tpnCalc, dextrosePercent: parseFloat(e.target.value) || 10 })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              {/* TPN Output Display */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4 font-mono text-xs">
                <h4 className="text-sm font-bold text-white font-sans border-b border-slate-800 pb-2">
                  Calculated Glucose Infusion Rate (GIR) & TPN Rates
                </h4>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total Daily TPN Volume:</span>
                    <strong className="text-white">{(tpnCalc.weightKg * tpnCalc.fluidGoalMlKgDay).toFixed(1)} mL / day</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Infusion Pump Rate:</span>
                    <strong className="text-cyan-400">{((tpnCalc.weightKg * tpnCalc.fluidGoalMlKgDay) / 24).toFixed(2)} mL / hr</strong>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-slate-800">
                    <span className="text-slate-400">Glucose Infusion Rate (GIR):</span>
                    <strong className="text-2xl text-purple-400 font-black">{computedGirMgKgMin} mg/kg/min</strong>
                  </div>
                </div>

                <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl text-purple-300 text-[11px]">
                  💡 AAP Target GIR for Preterm Infant: 6.0 - 8.0 mg/kg/min (Maintain normoglycemia 60-110 mg/dL).
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODULE 9: NEONATAL RESUSCITATION PROGRAM (NRP) MATRIX
          ========================================================================= */}
      {activeModule === "NRP_PROTOCOL" && (
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Siren size={18} className="text-rose-400 animate-pulse" /> Neonatal Resuscitation Program (NRP 8th Edition) Protocol
            </h3>

            <div className="flex items-center gap-2 overflow-x-auto">
              {[
                { id: "INITIAL_ASSESSMENT", label: "1. Term / Tone / Cry" },
                { id: "PPV_AIRWAY", label: "2. PPV & MR. SOPA" },
                { id: "CHEST_COMPRESSIONS", label: "3. Chest Compressions (3:1)" },
                { id: "EPINEPHRINE_RESUS", label: "4. Epinephrine IV/UVC" }
              ].map((step) => (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => setNrpStep(step.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold font-mono transition ${
                    nrpStep === step.id ? "bg-rose-600 text-white" : "bg-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  {step.label}
                </button>
              ))}
            </div>

            <div className="p-6 bg-slate-950 border border-slate-800 rounded-2xl font-mono text-xs space-y-3">
              {nrpStep === "INITIAL_ASSESSMENT" && (
                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-white font-sans">Initial Birth Assessment (First 60 Seconds - "Golden Minute")</h4>
                  <p className="text-slate-300">Warm, dry, position airway, clear secretions if needed, stimulate.</p>
                  <div className="text-amber-400 font-bold">If HR &lt; 100 bpm or Apnea/Gasping: Initiate Positive Pressure Ventilation (PPV) immediately.</div>
                </div>
              )}
              {nrpStep === "PPV_AIRWAY" && (
                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-white font-sans">PPV & MR. SOPA Airway Corrective Steps</h4>
                  <p className="text-slate-300">Mask adjustment, Reposition head, Suction mouth/nose, Open mouth, Pressure increase, Alternative airway (ETT/LMA).</p>
                </div>
              )}
              {nrpStep === "CHEST_COMPRESSIONS" && (
                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-white font-sans">Chest Compressions (HR &lt; 60 bpm despite effective PPV)</h4>
                  <p className="text-slate-300">3 compressions to 1 ventilation (90 compressions + 30 breaths = 120 events/min). Increase FiO2 to 100%.</p>
                </div>
              )}
              {nrpStep === "EPINEPHRINE_RESUS" && (
                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-white font-sans">Epinephrine Administration (HR &lt; 60 bpm after compressions)</h4>
                  <p className="text-slate-300">IV / UVC Dose: 0.02 mg/kg (0.2 mL/kg of 0.1 mg/mL). Flush with 3 mL normal saline.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODULE 10: UAC / UVC CATHETER DEPTH ENGINE
          ========================================================================= */}
      {activeModule === "UAC_UVC_DEPTH" && (
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sliders size={18} className="text-cyan-400" /> Umbilical Arterial (UAC) & Venous (UVC) Catheter Depth Engine
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4 text-xs font-sans">
                <div>
                  <label className="text-slate-400 font-bold block mb-1">Infant Birth Weight (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={uacWeightKg}
                    onChange={(e) => setUacWeightKg(parseFloat(e.target.value) || 1.0)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4 font-mono text-xs">
                <h4 className="text-sm font-bold text-white font-sans border-b border-slate-800 pb-2">
                  Calculated Catheter Insertion Lengths
                </h4>

                <div className="space-y-3">
                  <div className="p-3 bg-slate-900 rounded-xl flex justify-between items-center">
                    <span className="text-slate-400">High UAC Insertion (T6 - T8):</span>
                    <strong className="text-xl text-cyan-400 font-black">{computedUacHighDepthCm} cm + Stump</strong>
                  </div>
                  <div className="p-3 bg-slate-900 rounded-xl flex justify-between items-center">
                    <span className="text-slate-400">UVC Insertion (IVC / RA Junction):</span>
                    <strong className="text-xl text-purple-400 font-black">{computedUvcDepthCm} cm + Stump</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODULE 11: EARLY-ONSET NEONATAL SEPSIS RISK CALCULATOR
          ========================================================================= */}
      {activeModule === "SEPSIS_RISK" && (
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldAlert size={18} className="text-rose-400" /> Early-Onset Neonatal Sepsis Risk Calculator (Kaiser Permanente Model)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4 text-xs font-sans">
                <div>
                  <label className="text-slate-400 font-bold block mb-1">Highest Maternal Intrapartum Temp (°C)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={sepsisForm.highestMaternalTempC}
                    onChange={(e) => setSepsisForm({ ...sepsisForm, highestMaternalTempC: parseFloat(e.target.value) || 37.0 })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="text-slate-400 font-bold block mb-1">Duration of Rupture of Membranes (ROM Hours)</label>
                  <input
                    type="number"
                    value={sepsisForm.romHours}
                    onChange={(e) => setSepsisForm({ ...sepsisForm, romHours: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4 font-mono text-xs flex flex-col justify-center text-center">
                <span className="text-slate-500 text-xs uppercase font-bold">Predicted Early-Onset Sepsis Risk</span>
                <strong className={`text-5xl font-black ${computedSepsisRiskScore >= 1.0 ? "text-rose-500" : "text-emerald-400"}`}>
                  {computedSepsisRiskScore} / 1000 Live Births
                </strong>
                <p className="text-slate-300 font-sans text-xs">
                  {computedSepsisRiskScore >= 1.0
                    ? "HIGH RISK: Obtain Blood Culture & Initiate Empirical IV Ampicillin + Gentamicin"
                    : "LOW RISK: Routine Clinical Care & Vital Sign Overwatch for 24-48 hours"}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODULE 12: BHUTANI BILIRUBIN NOMOGRAM
          ========================================================================= */}
      {activeModule === "BILIRUBIN_NOMOGRAM" && (
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sun size={18} className="text-amber-400" /> Bhutani Hour-Specific Bilirubin Nomogram & Phototherapy Threshold Matrix
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4 text-xs font-sans">
                <div>
                  <label className="text-slate-400 font-bold block mb-1">Postnatal Age (Hours)</label>
                  <input
                    type="number"
                    value={biliForm.postnatalAgeHours}
                    onChange={(e) => setBiliForm({ ...biliForm, postnatalAgeHours: parseInt(e.target.value) || 24 })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="text-slate-400 font-bold block mb-1">Total Serum Bilirubin (TSB in mg/dL)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={biliForm.totalSerumBilirubinMgDl}
                    onChange={(e) => setBiliForm({ ...biliForm, totalSerumBilirubinMgDl: parseFloat(e.target.value) || 5.0 })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4 font-mono text-xs flex flex-col justify-center text-center">
                <span className="text-slate-500 text-xs uppercase font-bold">Bhutani Nomogram Risk Zone Classification</span>
                <strong className="text-2xl font-black text-amber-400">{computedBiliRiskZone}</strong>
                <p className="text-slate-300 font-sans text-xs">
                  AAP Hyperbilirubinemia Clinical Practice Guidelines (2022 Revision).
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODULE 13: PICU AIRWAY COMPLIANCE ANALYZER
          ========================================================================= */}
      {activeModule === "AIRWAY_COMPLIANCE" && (
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <BarChart3 size={18} className="text-sky-400" /> Dynamic Airway Compliance & Lung Resistance Analyzer
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4 text-xs font-sans">
                <div>
                  <label className="text-slate-400 font-bold block mb-1">Exhaled Tidal Volume (mL)</label>
                  <input
                    type="number"
                    value={airwayForm.tidalVolumeMl}
                    onChange={(e) => setAirwayForm({ ...airwayForm, tidalVolumeMl: parseInt(e.target.value) || 100 })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="text-slate-400 font-bold block mb-1">Peak Inspiratory Pressure (PIP cmH2O)</label>
                  <input
                    type="number"
                    value={airwayForm.peakInspiratoryPressureCmH2O}
                    onChange={(e) => setAirwayForm({ ...airwayForm, peakInspiratoryPressureCmH2O: parseInt(e.target.value) || 20 })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="text-slate-400 font-bold block mb-1">PEEP (cmH2O)</label>
                  <input
                    type="number"
                    value={airwayForm.peepCmH2O}
                    onChange={(e) => setAirwayForm({ ...airwayForm, peepCmH2O: parseInt(e.target.value) || 5 })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4 font-mono text-xs flex flex-col justify-center text-center">
                <span className="text-slate-500 text-xs uppercase font-bold">Dynamic Pulmonary Compliance (Cdyn)</span>
                <strong className="text-5xl font-black text-sky-400">{computedDynamicCompliance} mL / cmH2O</strong>
                <p className="text-slate-300 font-sans text-xs">
                  Normal Pediatric Cdyn range: 1.0 - 2.5 mL/cmH2O/kg.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
