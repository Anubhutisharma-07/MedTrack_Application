import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle, CheckCircle2, Droplets, Factory, FileText, Gauge, Info,
  Layers, Pause, Play, RefreshCw, ShieldAlert, SlidersHorizontal, Wind,
} from "lucide-react";
import { ExportCsvButton } from "../../components/common/ExportButton";
import { CompactStatCard as StatCard } from "../../components/common/StatCard";
import { CompactSearch } from "../../components/common/SearchBox";
import { FilterChips } from "../../components/common/FilterChips";
import { Row } from "../../components/common/InfoRow";
import { EmptyState } from "../../components/common/EmptyState";
import { ToneBadge } from "../../components/common/ToneBadge";
import { TabsBar } from "../../components/common/TabsBar";
import { SimpleModal as Modal } from "../../components/common/Modal";
import { downloadCsv } from "../../utils/csv";

/* ------------------------------------------------------------------ *
 *  MedTrack Medical Gas & Utilities Plant Hub
 *  ------------------------------------------------------------------
 *  MedTrack knows about every device that plugs into the wall. This
 *  page is about the wall.
 *
 *  Piped medical gas is the largest single point of failure in a
 *  hospital and the only one where a fault is simultaneously silent,
 *  immediate and building-wide. A ventilator failing takes one patient
 *  off support and alarms two feet from a nurse. The oxygen plant
 *  failing takes every ventilated patient in the estate off support at
 *  once, and the first indication most staff get is a wall panel that
 *  somebody has to be standing in front of.
 *
 *    1. Source Plant  - the liquid oxygen VIE, manifolds, cylinder
 *                       banks and automatic changeover, with how long
 *                       each source actually has left.
 *    2. Quality       - analysers against European Pharmacopoeia limits
 *                       per analyte, plus compressor duty balance.
 *    3. Distribution  - area valve service units and zone pressures,
 *                       each naming the clinical areas it isolates.
 *    4. Vacuum & AGSS - the pump set and scavenging, which nobody
 *                       thinks about until a list is cancelled.
 *
 *  The substance of the page is daysOfSupply(): a VIE panel reports a
 *  level percentage, and a level percentage is not an answer to the
 *  only question estates has, which is when the tanker needs to come.
 *  See that function for the conversion and for the four states in
 *  which it declines to produce a number.
 * ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/*  Plant constants                                                    */
/* ------------------------------------------------------------------ */

/**
 * Liquid-to-gas expansion ratio for liquid oxygen at NTP.
 *
 * One litre of LOX becomes roughly 842 litres of gas. This single constant is what converts a tank
 * gauge into a number of days, and getting it wrong - or, far more commonly, not applying it at all
 * and treating the level percentage as though it were proportional to days remaining - is how a
 * delivery gets deferred into the emergency reserve.
 */
const LOX_EXPANSION_RATIO = 842;

/**
 * Emergency reserve retained in each source, as a percentage of capacity.
 *
 * HTM 02-01 requires a source to hold a defined reserve. Days-of-supply computed down to an empty
 * tank is a number that will be used to defer a delivery into the reserve that exists precisely so
 * it is never used, so the reserve is subtracted before the division rather than mentioned in a
 * footnote underneath it.
 */
const RESERVE_PCT = 15;

/**
 * A consumption baseline older than this no longer describes current demand.
 *
 * Days of supply is a division by a consumption rate, and the rate is only meaningful if it is
 * recent. A figure carried over from a quiet week over-states supply exactly when demand is rising,
 * which is the only time anybody reads the number.
 */
const CONSUMPTION_BASELINE_MAX_AGE_DAYS = 7;

/** Below this, the tanker is ordered rather than scheduled. */
const DAYS_OF_SUPPLY_CRITICAL = 3;
const DAYS_OF_SUPPLY_WARNING = 7;

/**
 * European Pharmacopoeia limits, per analyte.
 *
 * Medical air made on site is a manufactured product and is graded as one. A single pass lamp on an
 * analyser panel collapses six independent tests into one bit, and the one that matters
 * operationally - dew point - is the one most often left amber: a failed drier puts liquid water
 * into a pipeline that freezes at a pressure reduction and takes out a zone.
 */
const PH_EUR_LIMITS = {
  "Medical air": {
    o2Pct: { min: 20.4, max: 21.4, label: "O2 %v/v" },
    coPpm: { max: 5, label: "CO ppm" },
    co2Ppm: { max: 500, label: "CO2 ppm" },
    noxPpm: { max: 2, label: "NO/NO2 ppm" },
    dewPointC: { max: -46, label: "Dew point °C" },
    oilMgM3: { max: 0.1, label: "Oil mg/m³" },
  },
  Oxygen: {
    o2Pct: { min: 99.5, max: 100, label: "O2 %v/v" },
    coPpm: { max: 5, label: "CO ppm" },
    co2Ppm: { max: 300, label: "CO2 ppm" },
    noxPpm: { max: 2, label: "NO/NO2 ppm" },
    dewPointC: { max: -46, label: "Dew point °C" },
    oilMgM3: { max: 0.1, label: "Oil mg/m³" },
  },
};

/** Nominal pipeline pressures in bar, per HTM 02-01. A zone outside this band is a fault. */
const NOMINAL_PRESSURE_BAR = {
  Oxygen: { nominal: 4.1, min: 3.8, max: 4.6 },
  "Medical air": { nominal: 4.1, min: 3.8, max: 4.6 },
  "Surgical air": { nominal: 7.0, min: 6.5, max: 8.0 },
  "Nitrous oxide": { nominal: 4.1, min: 3.8, max: 4.6 },
  Vacuum: { nominal: -0.6, min: -1.0, max: -0.45 },
};

/**
 * Compressor duty imbalance beyond which the lead-lag rotation has stopped working.
 *
 * Three compressors are installed so that any one can fail without consequence. If the controller
 * has stopped rotating them, one unit carries the estate and all three reach end of life within
 * weeks of each other - which converts a redundant plant into a single point of failure without
 * anything ever alarming.
 */
const DUTY_IMBALANCE_PCT = 20;

/* ------------------------------------------------------------------ */
/*  Seed data                                                          */
/* ------------------------------------------------------------------ */

const SOURCES = [
  {
    id: "SRC-VIE-01", name: "Liquid oxygen VIE", kind: "VIE", gas: "Oxygen", location: "Gas compound north",
    capacityLitres: 11_000, contentsPct: 61, state: "On line", consumptionLitresDay: 1_640_000,
    baselineAgeDays: 1, vaporiserRatedLpm: 3_600, peakDemandLpm: 2_950, lastFillDays: 6,
  },
  {
    id: "SRC-VIE-02", name: "Liquid oxygen VIE (reserve)", kind: "VIE", gas: "Oxygen", location: "Gas compound north",
    capacityLitres: 5_000, contentsPct: 88, state: "Standby", consumptionLitresDay: 0,
    baselineAgeDays: 1, vaporiserRatedLpm: 1_800, peakDemandLpm: 0, lastFillDays: 22,
  },
  {
    id: "SRC-VIE-03", name: "Liquid oxygen VIE (satellite)", kind: "VIE", gas: "Oxygen", location: "Elective site",
    capacityLitres: 3_200, contentsPct: 34, state: "On line", consumptionLitresDay: 260_000,
    baselineAgeDays: 19, vaporiserRatedLpm: 900, peakDemandLpm: 610, lastFillDays: 14,
  },
  {
    id: "SRC-MAN-N2O", name: "Nitrous oxide manifold", kind: "Manifold", gas: "Nitrous oxide", location: "Manifold room 1",
    capacityLitres: 36_000, contentsPct: 47, state: "On line", consumptionLitresDay: 4_100,
    baselineAgeDays: 2, vaporiserRatedLpm: 400, peakDemandLpm: 120, lastFillDays: 9, bankRunning: "Left", cylinders: 12,
  },
  {
    id: "SRC-MAN-CO2", name: "Carbon dioxide manifold", kind: "Manifold", gas: "Carbon dioxide", location: "Manifold room 1",
    capacityLitres: 12_000, contentsPct: 19, state: "Changeover", consumptionLitresDay: 900,
    baselineAgeDays: 3, vaporiserRatedLpm: 200, peakDemandLpm: 40, lastFillDays: 31, bankRunning: "Right", cylinders: 8,
  },
  {
    id: "SRC-CMP-AIR4", name: "Medical air compressor set (4 bar)", kind: "Compressor", gas: "Medical air", location: "Plant room B",
    capacityLitres: null, contentsPct: null, state: "On line", consumptionLitresDay: 980_000,
    baselineAgeDays: 1, vaporiserRatedLpm: 2_400, peakDemandLpm: 2_180, lastFillDays: null,
  },
  {
    id: "SRC-CMP-AIR7", name: "Surgical air compressor set (7 bar)", kind: "Compressor", gas: "Surgical air", location: "Plant room B",
    capacityLitres: null, contentsPct: null, state: "On line", consumptionLitresDay: 210_000,
    baselineAgeDays: 1, vaporiserRatedLpm: 900, peakDemandLpm: 740, lastFillDays: null,
  },
  {
    id: "SRC-BNK-O2E", name: "Emergency oxygen cylinder bank", kind: "Cylinder bank", gas: "Oxygen", location: "Gas compound east",
    capacityLitres: 90_000, contentsPct: 96, state: "Standby", consumptionLitresDay: 0,
    baselineAgeDays: 1, vaporiserRatedLpm: 1_200, peakDemandLpm: 0, lastFillDays: 40, cylinders: 20,
  },
  {
    id: "SRC-MAN-HEO", name: "Heliox manifold", kind: "Manifold", gas: "Heliox", location: "Manifold room 2",
    capacityLitres: 6_000, contentsPct: 72, state: "Fault", consumptionLitresDay: 300,
    baselineAgeDays: 4, vaporiserRatedLpm: 150, peakDemandLpm: 0, lastFillDays: 55, bankRunning: "Left", cylinders: 4,
  },
];

const ANALYSERS = [
  { id: "AN-AIR-01", gas: "Medical air", location: "Plant room B outlet", o2Pct: 20.9, coPpm: 1, co2Ppm: 340, noxPpm: 0.4, dewPointC: -52, oilMgM3: 0.02, sampledHoursAgo: 1 },
  { id: "AN-AIR-02", gas: "Medical air", location: "Ward 12 terminal", o2Pct: 20.8, coPpm: 2, co2Ppm: 410, noxPpm: 0.6, dewPointC: -38, oilMgM3: 0.04, sampledHoursAgo: 3 },
  { id: "AN-AIR-03", gas: "Medical air", location: "Theatre 4 terminal", o2Pct: 21.1, coPpm: 7, co2Ppm: 380, noxPpm: 0.5, dewPointC: -49, oilMgM3: 0.03, sampledHoursAgo: 2 },
  { id: "AN-O2-01", gas: "Oxygen", location: "VIE-01 outlet", o2Pct: 99.7, coPpm: 0, co2Ppm: 60, noxPpm: 0.1, dewPointC: -61, oilMgM3: 0.01, sampledHoursAgo: 1 },
  { id: "AN-O2-02", gas: "Oxygen", location: "ICU riser", o2Pct: 99.2, coPpm: 1, co2Ppm: 90, noxPpm: 0.2, dewPointC: -58, oilMgM3: 0.01, sampledHoursAgo: 4 },
  { id: "AN-O2-03", gas: "Oxygen", location: "Elective site riser", o2Pct: 99.6, coPpm: 0, co2Ppm: 70, noxPpm: 0.1, dewPointC: -44, oilMgM3: 0.02, sampledHoursAgo: 9 },
];

const COMPRESSORS = [
  { id: "CMP-01", set: "Medical air (4 bar)", role: "Lead", runHours: 41_220, dutyPct: 58, serviceDueHours: 780, state: "Running" },
  { id: "CMP-02", set: "Medical air (4 bar)", role: "Lag", runHours: 39_910, dutyPct: 31, serviceDueHours: 1_940, state: "Running" },
  { id: "CMP-03", set: "Medical air (4 bar)", role: "Standby", runHours: 12_004, dutyPct: 11, serviceDueHours: 4_600, state: "Standby" },
  { id: "CMP-11", set: "Surgical air (7 bar)", role: "Lead", runHours: 22_870, dutyPct: 36, serviceDueHours: 1_120, state: "Running" },
  { id: "CMP-12", set: "Surgical air (7 bar)", role: "Lag", runHours: 22_140, dutyPct: 34, serviceDueHours: 1_260, state: "Running" },
  { id: "CMP-13", set: "Surgical air (7 bar)", role: "Standby", runHours: 21_600, dutyPct: 30, serviceDueHours: 1_510, state: "Standby" },
];

/**
 * Area valve service units.
 *
 * `serves` is the reason this console exists rather than the pressure column. A zone valve is only
 * useful in an emergency if somebody knows what it isolates *before* the emergency, and the answer
 * is usually on a laminated sheet in the plant room rather than anywhere a nurse can reach it.
 */
const ZONES = [
  { id: "AVSU-ICU-O2", gas: "Oxygen", zone: "ICU riser", pressureBar: 4.15, alarmPanel: "Normal", valveState: "Open", serves: "ICU beds 1–18, ICU isolation 1–2", lastTestedDays: 41, terminals: 62 },
  { id: "AVSU-ICU-VAC", gas: "Vacuum", zone: "ICU riser", pressureBar: -0.71, alarmPanel: "Normal", valveState: "Open", serves: "ICU beds 1–18", lastTestedDays: 41, terminals: 40 },
  { id: "AVSU-TH-O2", gas: "Oxygen", zone: "Theatres 1–6", pressureBar: 4.02, alarmPanel: "Normal", valveState: "Open", serves: "Theatres 1–6, anaesthetic rooms 1–6, recovery bays 1–12", lastTestedDays: 12, terminals: 88 },
  { id: "AVSU-TH-N2O", gas: "Nitrous oxide", zone: "Theatres 1–6", pressureBar: 3.71, alarmPanel: "Low pressure", valveState: "Open", serves: "Theatres 1–6, anaesthetic rooms 1–6", lastTestedDays: 12, terminals: 24 },
  { id: "AVSU-TH-SA", gas: "Surgical air", zone: "Theatres 1–6", pressureBar: 7.08, alarmPanel: "Normal", valveState: "Open", serves: "Theatres 1–6 tool outlets", lastTestedDays: 12, terminals: 18 },
  { id: "AVSU-W12-O2", gas: "Oxygen", zone: "Ward 12", pressureBar: 4.09, alarmPanel: "Normal", valveState: "Open", serves: "Ward 12 bays 1–6, Ward 12 side rooms 1–4", lastTestedDays: 402, terminals: 34 },
  { id: "AVSU-ED-O2", gas: "Oxygen", zone: "Emergency department", pressureBar: 4.71, alarmPanel: "High pressure", valveState: "Open", serves: "ED resus 1–4, majors 1–20, paediatric ED", lastTestedDays: 88, terminals: 71 },
  { id: "AVSU-MAT-O2", gas: "Oxygen", zone: "Maternity", pressureBar: 4.11, alarmPanel: "Normal", valveState: "Open", serves: "Delivery rooms 1–10, obstetric theatre, NICU cots 1–16", lastTestedDays: 33, terminals: 55 },
  { id: "AVSU-ENDO-CO2", gas: "Carbon dioxide", zone: "Endoscopy", pressureBar: 4.06, alarmPanel: "Normal", valveState: "Closed for works", serves: "Endoscopy rooms 1–4", lastTestedDays: 6, terminals: 8 },
  { id: "AVSU-W09-MA", gas: "Medical air", zone: "Ward 9", pressureBar: 4.13, alarmPanel: "Normal", valveState: "Open", serves: "Ward 9 bays 1–8", lastTestedDays: 210, terminals: 28 },
];

const VACUUM_PLANT = [
  { id: "VAC-01", name: "Medical vacuum pump", set: "Vacuum plant", role: "Lead", vacuumBar: -0.72, runHours: 51_400, dutyPct: 44, state: "Running", receiverPct: 78, bacterialFilterDays: 40 },
  { id: "VAC-02", name: "Medical vacuum pump", set: "Vacuum plant", role: "Lag", vacuumBar: -0.70, runHours: 50_900, dutyPct: 39, state: "Running", receiverPct: 78, bacterialFilterDays: 40 },
  { id: "VAC-03", name: "Medical vacuum pump", set: "Vacuum plant", role: "Standby", vacuumBar: 0, runHours: 18_220, dutyPct: 17, state: "Standby", receiverPct: 78, bacterialFilterDays: 210 },
  { id: "AGS-01", name: "AGSS scavenging blower", set: "AGSS", role: "Lead", vacuumBar: -0.31, runHours: 29_110, dutyPct: 51, state: "Running", receiverPct: null, bacterialFilterDays: 96 },
  { id: "AGS-02", name: "AGSS scavenging blower", set: "AGSS", role: "Standby", vacuumBar: 0, runHours: 28_700, dutyPct: 49, state: "Standby", receiverPct: null, bacterialFilterDays: 96 },
];

/* ------------------------------------------------------------------ */
/*  Plant calculations                                                 */
/* ------------------------------------------------------------------ */

/**
 * How many days of gas a source actually has, or a refusal saying why it cannot be computed.
 *
 *   usable_litres_liquid = (contents_pct - reserve_pct) / 100 x capacity_litres
 *   gas_litres           = usable_litres_liquid x 842
 *   days                 = gas_litres / mean_daily_consumption_litres
 *
 * The reserve is subtracted before the division rather than mentioned underneath it, because a
 * days-of-supply figure computed down to an empty tank will be used to defer a delivery into the
 * emergency reserve that exists so it is never used.
 *
 * Four states return a refusal instead of a number, and each of them would otherwise produce a
 * *comfortable* figure, which is the direction that matters:
 *
 *   - the source is not on line, so its contents are not available to the pipeline at the flow the
 *     wards are drawing, and adding them to a running total overstates the estate;
 *   - consumption is zero or absent, which divides to infinity and renders a source that
 *     apparently never runs out;
 *   - the consumption baseline is stale, so the figure describes demand that is no longer current -
 *     and it is over-stated precisely when demand is rising, the only time anybody reads it;
 *   - the source has no measurable contents at all, like a compressor, which makes gas rather
 *     than storing it.
 *
 * @returns {{days: number|null, refusal: string|null, usableGasLitres: number|null}}
 */
export function daysOfSupply(source) {
  if (source.capacityLitres == null || source.contentsPct == null) {
    return {
      days: null, usableGasLitres: null,
      refusal: `${source.kind} sources make gas rather than store it, so there are no contents to divide. Continuity here is a question of duty and capacity, not of days.`,
    };
  }

  if (source.state !== "On line") {
    return {
      days: null, usableGasLitres: null,
      refusal: `Source is ${source.state.toLowerCase()}, so its contents are not available to the pipeline at the flow the estate is drawing. Excluded from the running total rather than quietly added to it.`,
    };
  }

  if (!source.consumptionLitresDay || source.consumptionLitresDay <= 0) {
    return {
      days: null, usableGasLitres: null,
      refusal: "No measured consumption. Dividing by zero renders a source that apparently never runs out, which is the one answer that is certainly wrong.",
    };
  }

  if (source.baselineAgeDays > CONSUMPTION_BASELINE_MAX_AGE_DAYS) {
    return {
      days: null, usableGasLitres: null,
      refusal: `Consumption baseline is ${source.baselineAgeDays} days old, beyond the ${CONSUMPTION_BASELINE_MAX_AGE_DAYS} day window. A figure carried over from a quieter week over-states supply exactly when demand is rising.`,
    };
  }

  const usableLiquid = ((source.contentsPct - RESERVE_PCT) / 100) * source.capacityLitres;
  if (usableLiquid <= 0) {
    return {
      days: 0, usableGasLitres: 0,
      refusal: null,
    };
  }

  const usableGasLitres = Math.round(usableLiquid * LOX_EXPANSION_RATIO);
  const days = Math.round((usableGasLitres / source.consumptionLitresDay) * 10) / 10;
  return { days, usableGasLitres, refusal: null };
}

/**
 * Whether the vaporisers can boil off gas as fast as the estate can draw it.
 *
 * A tank with three weeks of supply can still fail this afternoon. The VIE's binding constraint is
 * vaporisation rate, not contents: draw more than the evaporators can vaporise and the pipeline
 * pressure falls with the tank still nearly full. That is the failure mode that surprised a lot of
 * estates teams in 2021, when the ceiling on how many patients a hospital could ventilate turned
 * out to be litres per minute rather than ventilators, beds or staff.
 *
 * It is therefore checked independently of contents, and a source that passes one and fails the
 * other is reported as failing.
 */
export function vaporiserHeadroom(source) {
  if (!source.vaporiserRatedLpm) return null;
  const headroomLpm = source.vaporiserRatedLpm - source.peakDemandLpm;
  const utilisationPct = Math.round((source.peakDemandLpm / source.vaporiserRatedLpm) * 1000) / 10;
  return {
    headroomLpm,
    utilisationPct,
    breached: headroomLpm <= 0,
    tight: headroomLpm > 0 && utilisationPct >= 85,
  };
}

/** Every fault on a source, ordered with continuity ahead of housekeeping. */
export function sourceFaults(source) {
  const faults = [];
  const supply = daysOfSupply(source);
  const headroom = vaporiserHeadroom(source);

  if (headroom && headroom.breached) {
    faults.push({
      code: "VAPORISER", tone: "red",
      text: `Peak demand ${source.peakDemandLpm} L/min exceeds the ${source.vaporiserRatedLpm} L/min vaporiser rating. Pressure will fall with the tank still full — contents are not the constraint here.`,
    });
  } else if (headroom && headroom.tight) {
    faults.push({
      code: "VAPORISER-TIGHT", tone: "amber",
      text: `Peak demand is ${headroom.utilisationPct}% of vaporiser capacity, leaving ${headroom.headroomLpm} L/min of headroom for a surge.`,
    });
  }

  if (supply.days != null && supply.days <= DAYS_OF_SUPPLY_CRITICAL) {
    faults.push({ code: "SUPPLY", tone: "red", text: `${supply.days} days of usable supply above the reserve. Order the tanker rather than scheduling it.` });
  } else if (supply.days != null && supply.days <= DAYS_OF_SUPPLY_WARNING) {
    faults.push({ code: "SUPPLY-LOW", tone: "amber", text: `${supply.days} days of usable supply above the reserve.` });
  }

  if (source.state === "Fault") {
    faults.push({ code: "STATE", tone: "red", text: "Source is in fault and is carrying no load. The estate is running without this leg of its redundancy." });
  } else if (source.state === "Changeover") {
    faults.push({ code: "CHANGEOVER", tone: "amber", text: `Manifold is mid-changeover on the ${source.bankRunning || "running"} bank. Contents are not fully available until it settles.` });
  }

  return faults;
}

/**
 * Grade one analyser against the Ph. Eur. limits for the gas it is sampling, analyte by analyte.
 *
 * A single pass lamp collapses six independent tests into one bit and hides which one failed. Dew
 * point is the one that matters operationally and the one most often left as a persistent amber: a
 * failed drier puts liquid water into a pipeline, and liquid water freezes at a pressure reduction
 * and takes out a zone.
 */
export function purityGrade(analyser) {
  const limits = PH_EUR_LIMITS[analyser.gas];
  if (!limits) {
    return { evaluable: false, refusal: `No European Pharmacopoeia monograph is configured for ${analyser.gas}, so the sample is recorded rather than graded.`, breaches: [] };
  }

  const breaches = [];
  for (const [key, limit] of Object.entries(limits)) {
    const value = analyser[key];
    if (value == null) {
      breaches.push({ key, label: limit.label, value: null, tone: "amber", text: `${limit.label} was not sampled, so it is unassessed rather than within limit.` });
      continue;
    }
    if (limit.min != null && value < limit.min) {
      breaches.push({ key, label: limit.label, value, tone: "red", text: `${limit.label} ${value} is below the ${limit.min} minimum.` });
    } else if (limit.max != null && value > limit.max) {
      breaches.push({ key, label: limit.label, value, tone: "red", text: `${limit.label} ${value} exceeds the ${limit.max} limit.` });
    }
  }

  return { evaluable: true, refusal: null, breaches };
}

/**
 * Whether the lead-lag controller is still rotating a compressor or vacuum set.
 *
 * Three units are installed so that any one can fail without consequence. If duty has stopped
 * rotating, one unit carries the estate and all three reach end of life within weeks of each other,
 * which converts a redundant plant into a single point of failure without anything ever alarming.
 */
export function dutyBalance(units) {
  if (units.length < 2) return null;
  const duties = units.map((u) => u.dutyPct);
  const spread = Math.max(...duties) - Math.min(...duties);
  return { spread, imbalanced: spread > DUTY_IMBALANCE_PCT };
}

/** Zone faults: pressure outside the HTM band, an alarm standing, or a lapsed valve test. */
export function zoneFaults(zone) {
  const faults = [];
  const band = NOMINAL_PRESSURE_BAR[zone.gas];

  if (band) {
    if (zone.pressureBar < band.min) {
      faults.push({ code: "LOW", tone: "red", text: `${zone.pressureBar} bar is below the ${band.min} bar floor for ${zone.gas}. Terminal units in this zone are being starved.` });
    } else if (zone.pressureBar > band.max) {
      faults.push({ code: "HIGH", tone: "red", text: `${zone.pressureBar} bar is above the ${band.max} bar ceiling for ${zone.gas}. A regulator has drifted or failed open.` });
    }
  }

  if (zone.alarmPanel !== "Normal") {
    faults.push({ code: "ALARM", tone: "amber", text: `Panel showing "${zone.alarmPanel}". An alarm at a panel nobody is standing in front of is not an alarm.` });
  }

  if (zone.lastTestedDays > 365) {
    faults.push({ code: "TEST", tone: "amber", text: `Valve last operated ${zone.lastTestedDays} days ago. A valve that has not been turned in a year is a valve nobody knows will turn.` });
  }

  if (zone.valveState !== "Open") {
    faults.push({ code: "CLOSED", tone: "amber", text: `Valve is ${zone.valveState.toLowerCase()} — ${zone.serves} is isolated.` });
  }

  return faults;
}

/* ------------------------------------------------------------------ */
/*  Simulation                                                         */
/* ------------------------------------------------------------------ */

/** Drains sources at their measured consumption and drifts zone pressures the way a plant drifts. */
function usePlantSimulation({ sourcesRef, zonesRef, toast }) {
  const [running, setRunning] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [tick, setTick] = useState(0);
  const speedRef = useRef(speed);
  const runningRef = useRef(running);

  useEffect(() => { speedRef.current = speed; }, [speed]);
  useEffect(() => { runningRef.current = running; }, [running]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!runningRef.current) return;
      const step = speedRef.current;

      sourcesRef.current = sourcesRef.current.map((source) => {
        if (source.capacityLitres == null || source.contentsPct == null) return source;
        if (source.state !== "On line" || !source.consumptionLitresDay) return source;
        // One simulated tick is an hour of draw, converted back from gas litres to a tank level.
        const litresLiquidPerHour = source.consumptionLitresDay / 24 / LOX_EXPANSION_RATIO;
        const pctDrop = (litresLiquidPerHour * step * 100) / source.capacityLitres;
        const next = Math.max(0, Math.round((source.contentsPct - pctDrop) * 100) / 100);
        if (source.contentsPct > RESERVE_PCT && next <= RESERVE_PCT) {
          toast(`${source.id} has fallen into the ${RESERVE_PCT}% emergency reserve`, "High");
        }
        return { ...source, contentsPct: next };
      });

      zonesRef.current = zonesRef.current.map((zone) => {
        if (zone.gas === "Vacuum") return zone;
        const drift = (Math.random() - 0.5) * 0.04 * step;
        return { ...zone, pressureBar: Math.round((zone.pressureBar + drift) * 100) / 100 };
      });

      setTick((t) => t + 1);
    }, 1600);

    return () => clearInterval(interval);
  }, [sourcesRef, zonesRef, toast]);

  return {
    running, setRunning, speed, setSpeed, tick,
    reset: () => {
      sourcesRef.current = SOURCES.map((s) => ({ ...s }));
      zonesRef.current = ZONES.map((z) => ({ ...z }));
      setTick(0);
      toast("Medical gas plant console reset to baseline", "Low");
    },
  };
}

/* ------------------------------------------------------------------ */
/*  Main page                                                          */
/* ------------------------------------------------------------------ */

export default function MedicalGasPlantHub() {
  const [tab, setTab] = useState("sources");
  const [modal, setModal] = useState(null);
  const [query, setQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState("All");
  const [qualityFilter, setQualityFilter] = useState("All");
  const [zoneFilter, setZoneFilter] = useState("All");
  const [vacuumFilter, setVacuumFilter] = useState("All");

  const [toasts, setToasts] = useState([]);
  const toast = useCallback((message, severity = "Low") => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((current) => [...current.slice(-4), { id, message, severity }]);
    setTimeout(() => setToasts((current) => current.filter((t) => t.id !== id)), 4200);
  }, []);

  const [sources, setSources] = useState(() => SOURCES.map((s) => ({ ...s })));
  const [zones, setZones] = useState(() => ZONES.map((z) => ({ ...z })));
  const [analysers, setAnalysers] = useState(() => ANALYSERS.map((a) => ({ ...a })));
  const [compressors, setCompressors] = useState(() => COMPRESSORS.map((c) => ({ ...c })));
  const [vacuum, setVacuum] = useState(() => VACUUM_PLANT.map((v) => ({ ...v })));

  const sourcesRef = useRef(sources);
  const zonesRef = useRef(zones);

  useEffect(() => { sourcesRef.current = sources; }, [sources]);
  useEffect(() => { zonesRef.current = zones; }, [zones]);

  const sim = usePlantSimulation({ sourcesRef, zonesRef, toast });

  useEffect(() => {
    setSources([...sourcesRef.current]);
    setZones([...zonesRef.current]);
  }, [sim.tick]);

  /* ---------- derived ---------- */

  const supplies = useMemo(
    () => sources.map((source) => ({ source, supply: daysOfSupply(source), headroom: vaporiserHeadroom(source), faults: sourceFaults(source) })),
    [sources]
  );

  const grades = useMemo(
    () => analysers.map((analyser) => ({ analyser, ...purityGrade(analyser) })),
    [analysers]
  );

  const compressorSets = useMemo(() => {
    const bySet = new Map();
    for (const unit of compressors) {
      if (!bySet.has(unit.set)) bySet.set(unit.set, []);
      bySet.get(unit.set).push(unit);
    }
    return [...bySet.entries()].map(([name, units]) => ({ name, units, balance: dutyBalance(units) }));
  }, [compressors]);

  const stats = useMemo(() => {
    const critical = supplies.filter((s) => s.supply.days != null && s.supply.days <= DAYS_OF_SUPPLY_CRITICAL).length;
    const notComputable = supplies.filter((s) => s.supply.refusal != null && s.source.capacityLitres != null).length;
    const purityBreaches = grades.filter((g) => g.breaches.some((b) => b.tone === "red")).length;
    const zonesFaulted = zones.filter((z) => zoneFaults(z).some((f) => f.tone === "red")).length;
    return { critical, notComputable, purityBreaches, zonesFaulted };
  }, [supplies, grades, zones]);

  const filteredSources = useMemo(() => {
    const q = query.toLowerCase();
    return supplies.filter((entry) => {
      const { source } = entry;
      const matchesQuery = !q || [source.id, source.name, source.gas, source.location, source.kind].some((f) => String(f).toLowerCase().includes(q));
      if (!matchesQuery) return false;
      if (sourceFilter === "All") return true;
      if (sourceFilter === "Faulted") return entry.faults.some((f) => f.tone === "red");
      if (sourceFilter === "Not computable") return entry.supply.refusal != null;
      return source.gas === sourceFilter;
    });
  }, [supplies, query, sourceFilter]);

  const filteredGrades = useMemo(() => {
    const q = query.toLowerCase();
    return grades.filter((entry) => {
      const { analyser } = entry;
      const matchesQuery = !q || [analyser.id, analyser.gas, analyser.location].some((f) => String(f).toLowerCase().includes(q));
      if (!matchesQuery) return false;
      if (qualityFilter === "All") return true;
      if (qualityFilter === "Out of spec") return entry.breaches.some((b) => b.tone === "red");
      if (qualityFilter === "Unassessed") return entry.breaches.some((b) => b.value === null);
      return entry.analyser.gas === qualityFilter;
    });
  }, [grades, query, qualityFilter]);

  const filteredZones = useMemo(() => {
    const q = query.toLowerCase();
    return zones.filter((zone) => {
      const matchesQuery = !q || [zone.id, zone.gas, zone.zone, zone.serves].some((f) => String(f).toLowerCase().includes(q));
      if (!matchesQuery) return false;
      if (zoneFilter === "All") return true;
      if (zoneFilter === "Faulted") return zoneFaults(zone).some((f) => f.tone === "red");
      if (zoneFilter === "Alarming") return zone.alarmPanel !== "Normal";
      if (zoneFilter === "Test overdue") return zone.lastTestedDays > 365;
      return zone.gas === zoneFilter;
    });
  }, [zones, query, zoneFilter]);

  const filteredVacuum = useMemo(() => {
    const q = query.toLowerCase();
    return vacuum.filter((unit) => {
      const matchesQuery = !q || [unit.id, unit.name, unit.set, unit.role].some((f) => String(f).toLowerCase().includes(q));
      if (!matchesQuery) return false;
      if (vacuumFilter === "All") return true;
      return unit.set === vacuumFilter;
    });
  }, [vacuum, query, vacuumFilter]);

  /* ---------- actions ---------- */

  const refillSource = (id) => {
    setSources((current) => current.map((s) => (s.id === id ? { ...s, contentsPct: s.contentsPct == null ? null : 95, lastFillDays: 0 } : s)));
    toast(`${id} refilled — tanker delivery recorded`, "Medium");
  };

  const refreshBaseline = (id) => {
    setSources((current) => current.map((s) => (s.id === id ? { ...s, baselineAgeDays: 0 } : s)));
    toast(`${id} consumption baseline resampled against current demand`, "Low");
  };

  const resample = (id) => {
    setAnalysers((current) =>
      current.map((a) =>
        a.id === id ? { ...a, sampledHoursAgo: 0, coPpm: Math.min(a.coPpm, 5), dewPointC: Math.min(a.dewPointC, -46), co2Ppm: Math.min(a.co2Ppm, 300) } : a
      )
    );
    toast(`${id} resampled after drier and filter service`, "Medium");
  };

  const rotateDuty = (setName) => {
    setCompressors((current) => {
      const inSet = current.filter((u) => u.set === setName);
      if (inSet.length === 0) return current;
      const even = Math.round((inSet.reduce((sum, u) => sum + u.dutyPct, 0) / inSet.length) * 10) / 10;
      return current.map((u) => (u.set === setName ? { ...u, dutyPct: even } : u));
    });
    toast(`${setName} lead-lag rotation restored — duty evened across the set`, "Medium");
  };

  const testValve = (id) => {
    setZones((current) => current.map((z) => (z.id === id ? { ...z, lastTestedDays: 0 } : z)));
    toast(`${id} valve operated and re-proved`, "Low");
  };

  const serviceFilter = (id) => {
    setVacuum((current) => current.map((v) => (v.id === id ? { ...v, bacterialFilterDays: 0 } : v)));
    toast(`${id} bacterial filter replaced`, "Low");
  };

  const exportCsv = () => {
    const table =
      tab === "sources"
        ? [
            ["ID", "Source", "Gas", "Kind", "Location", "State", "Contents %", "Capacity (L)", "Consumption (L/day)", "Baseline age (d)", "Days of supply", "Refusal", "Peak (L/min)", "Vaporiser (L/min)"],
            ...filteredSources.map((e) => [
              e.source.id, e.source.name, e.source.gas, e.source.kind, e.source.location, e.source.state,
              e.source.contentsPct ?? "—", e.source.capacityLitres ?? "—", e.source.consumptionLitresDay,
              e.source.baselineAgeDays, e.supply.days ?? "not computable", e.supply.refusal ?? "",
              e.source.peakDemandLpm, e.source.vaporiserRatedLpm,
            ]),
          ]
        : tab === "quality"
          ? [
              ["ID", "Gas", "Location", "O2 %", "CO ppm", "CO2 ppm", "NOx ppm", "Dew point C", "Oil mg/m3", "Sampled (h ago)", "Breaches"],
              ...filteredGrades.map((g) => [
                g.analyser.id, g.analyser.gas, g.analyser.location, g.analyser.o2Pct, g.analyser.coPpm,
                g.analyser.co2Ppm, g.analyser.noxPpm, g.analyser.dewPointC, g.analyser.oilMgM3,
                g.analyser.sampledHoursAgo, g.breaches.map((b) => b.label).join(" · ") || "none",
              ]),
            ]
          : tab === "zones"
            ? [
                ["ID", "Gas", "Zone", "Serves", "Pressure (bar)", "Valve", "Panel", "Terminals", "Last tested (d)", "Faults"],
                ...filteredZones.map((z) => [z.id, z.gas, z.zone, z.serves, z.pressureBar, z.valveState, z.alarmPanel, z.terminals, z.lastTestedDays, zoneFaults(z).map((f) => f.code).join(" ") || "none"]),
              ]
            : [
                ["ID", "Unit", "Set", "Role", "State", "Vacuum (bar)", "Run hours", "Duty %", "Filter age (d)"],
                ...filteredVacuum.map((v) => [v.id, v.name, v.set, v.role, v.state, v.vacuumBar, v.runHours, v.dutyPct, v.bacterialFilterDays]),
              ];

    downloadCsv(`medical-gas-${tab}.csv`, table);
    toast("CSV export downloaded", "Low");
  };

  const tabs = [
    { id: "sources", label: "Source Plant", icon: Factory },
    { id: "quality", label: "Quality & Purity", icon: Droplets },
    { id: "zones", label: "Distribution & Zones", icon: Layers },
    { id: "vacuum", label: "Vacuum & AGSS", icon: Wind },
  ];

  /* ---------- render ---------- */

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      {/* toast stack */}
      <div className="fixed right-4 top-4 z-[60] flex w-80 flex-col gap-2">
        {toasts.map((t) => (
          <div key={t.id} className="flex items-start gap-2 rounded-xl border border-slate-700 bg-slate-900/95 p-3 shadow-xl backdrop-blur">
            {t.severity === "High" ? (
              <ShieldAlert size={16} className="mt-0.5 shrink-0 text-red-400" />
            ) : t.severity === "Medium" ? (
              <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-400" />
            ) : (
              <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-400" />
            )}
            <p className="text-xs text-slate-300">{t.message}</p>
          </div>
        ))}
      </div>

      {/* header */}
      <header className="border-b border-slate-800 bg-slate-900/60 px-6 py-5 backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-2.5">
              <Factory size={24} className="text-emerald-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-100">Medical Gas &amp; Utilities Plant Hub</h1>
              <p className="mt-0.5 text-xs text-slate-400">
                Source continuity · Ph. Eur. purity · zone distribution · vacuum and AGSS — HTM 02-01, NFPA 99, ISO 7396-1
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 rounded-xl border border-slate-800 bg-slate-900 px-2 py-1.5">
              <button
                onClick={() => sim.setRunning(!sim.running)}
                className="rounded-lg p-1.5 text-slate-300 hover:bg-slate-800"
                title={sim.running ? "Pause simulation" : "Resume simulation"}
              >
                {sim.running ? <Pause size={15} /> : <Play size={15} />}
              </button>
              {[1, 2, 4].map((s) => (
                <button
                  key={s}
                  onClick={() => sim.setSpeed(s)}
                  className={`rounded-lg px-2 py-1 text-[11px] font-semibold ${sim.speed === s ? "bg-emerald-500/20 text-emerald-300" : "text-slate-400 hover:bg-slate-800"}`}
                >
                  {s}×
                </button>
              ))}
              <button
                onClick={sim.reset}
                className="ml-1 rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                title="Reset simulation"
              >
                <RefreshCw size={15} />
              </button>
            </div>
            <ExportCsvButton onClick={exportCsv} />
          </div>
        </div>

        {/* stat strip */}
        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard icon={Gauge} label="Sources Under 3 Days" value={stats.critical} sub="above the emergency reserve" accent={stats.critical > 0 ? "text-red-400" : "text-emerald-400"} />
          <StatCard icon={Info} label="Supply Not Computable" value={stats.notComputable} sub="stale, zero or off-line baseline" accent={stats.notComputable > 0 ? "text-amber-400" : "text-emerald-400"} />
          <StatCard icon={Droplets} label="Purity Breaches" value={stats.purityBreaches} sub={`${analysers.length} analysers, per analyte`} accent={stats.purityBreaches > 0 ? "text-red-400" : "text-emerald-400"} />
          <StatCard icon={Layers} label="Zones Out of Band" value={stats.zonesFaulted} sub={`${zones.length} area valve service units`} accent={stats.zonesFaulted > 0 ? "text-red-400" : "text-emerald-400"} />
        </div>

        <TabsBar tabs={tabs} active={tab} onChange={setTab} />

        {/* toolbar */}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <CompactSearch value={query} onChange={setQuery} placeholder="Search sources, analysers, zones, plant…" />
          {tab === "sources" && <FilterChips options={["All", "Faulted", "Not computable", "Oxygen", "Medical air"]} value={sourceFilter} onChange={setSourceFilter} />}
          {tab === "quality" && <FilterChips options={["All", "Out of spec", "Unassessed", "Oxygen", "Medical air"]} value={qualityFilter} onChange={setQualityFilter} />}
          {tab === "zones" && <FilterChips options={["All", "Faulted", "Alarming", "Test overdue", "Oxygen"]} value={zoneFilter} onChange={setZoneFilter} />}
          {tab === "vacuum" && <FilterChips options={["All", "Vacuum plant", "AGSS"]} value={vacuumFilter} onChange={setVacuumFilter} />}
        </div>
      </header>

      <main className="px-6 py-6">
        {/* ============================= SOURCE PLANT ============================= */}
        {tab === "sources" && (
          <section>
            <div className="mb-4 rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
              <p className="flex items-start gap-2 text-[11px] leading-relaxed text-slate-400">
                <Info size={14} className="mt-0.5 shrink-0 text-sky-400" />
                <span>
                  Days of supply is computed from contents, the {LOX_EXPANSION_RATIO}:1 liquid-to-gas expansion ratio and measured
                  consumption — never read from a telemetry panel. The {RESERVE_PCT}% emergency reserve is subtracted before the
                  division rather than mentioned underneath it, because a figure counted down to an empty tank will be used to defer a
                  delivery into the reserve that exists so it is never used. Peak demand is checked against vaporiser capacity
                  separately: a tank with three weeks of contents can still fail this afternoon.
                </span>
              </p>
            </div>

            {filteredSources.length === 0 ? (
              <EmptyState icon={Factory} message="No sources match the current filters." />
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {filteredSources.map((entry) => {
                  const { source, supply, headroom, faults } = entry;
                  const down = faults.some((f) => f.tone === "red");
                  return (
                    <article key={source.id} className={`rounded-2xl border bg-slate-900/70 p-4 ${down ? "border-red-500/40" : faults.length > 0 ? "border-amber-500/40" : "border-slate-800"}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <button onClick={() => setModal({ kind: "source", data: entry })} className="font-mono text-xs font-semibold text-emerald-300 hover:underline">
                            {source.id}
                          </button>
                          <p className="text-xs text-slate-200">{source.name}</p>
                          <p className="text-[11px] text-slate-500">{source.gas} · {source.location}</p>
                        </div>
                        <ToneBadge tone={down ? "red" : faults.length > 0 ? "amber" : "green"}>
                          {source.state}
                        </ToneBadge>
                      </div>

                      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                        <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-2">
                          <p className="text-[10px] uppercase tracking-wide text-slate-500">Contents</p>
                          <p className="text-sm font-bold text-slate-100">{source.contentsPct == null ? "—" : `${source.contentsPct}%`}</p>
                        </div>
                        <div className={`rounded-lg border p-2 ${supply.days != null && supply.days <= DAYS_OF_SUPPLY_CRITICAL ? "border-red-500/30 bg-red-500/5" : "border-slate-800 bg-slate-950/60"}`}>
                          <p className="text-[10px] uppercase tracking-wide text-slate-500">Days</p>
                          <p className={`text-sm font-bold ${supply.days == null ? "text-slate-500" : supply.days <= DAYS_OF_SUPPLY_CRITICAL ? "text-red-300" : "text-emerald-300"}`}>
                            {supply.days ?? "—"}
                          </p>
                        </div>
                        <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-2">
                          <p className="text-[10px] uppercase tracking-wide text-slate-500">Vaporiser</p>
                          <p className={`text-sm font-bold ${headroom && headroom.breached ? "text-red-300" : "text-slate-100"}`}>
                            {headroom ? `${headroom.utilisationPct}%` : "—"}
                          </p>
                        </div>
                      </div>

                      {source.contentsPct != null && (
                        <div className="mt-3">
                          <div className="flex items-center justify-between text-[11px] text-slate-500">
                            <span>Above reserve</span>
                            <span>{RESERVE_PCT}% held back</span>
                          </div>
                          <div className="relative mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                            <div className={`h-full rounded-full ${source.contentsPct <= RESERVE_PCT ? "bg-red-400" : "bg-emerald-400"}`} style={{ width: `${source.contentsPct}%` }} />
                            <div className="absolute inset-y-0 w-px bg-amber-400" style={{ left: `${RESERVE_PCT}%` }} />
                          </div>
                        </div>
                      )}

                      {supply.refusal && (
                        <p className="mt-3 rounded-lg border border-sky-500/30 bg-sky-500/5 p-2.5 text-[11px] leading-relaxed text-sky-200">
                          {supply.refusal}
                        </p>
                      )}

                      {faults.length > 0 && (
                        <ul className="mt-3 space-y-2">
                          {faults.map((fault) => (
                            <li
                              key={fault.code}
                              className={`rounded-lg border p-2.5 text-[11px] leading-relaxed ${
                                fault.tone === "red" ? "border-red-500/30 bg-red-500/5 text-red-200" : "border-amber-500/30 bg-amber-500/5 text-amber-200"
                              }`}
                            >
                              {fault.text}
                            </li>
                          ))}
                        </ul>
                      )}

                      <div className="mt-3 flex gap-2">
                        {source.contentsPct != null && (
                          <button onClick={() => refillSource(source.id)} className="flex-1 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-2 py-1.5 text-[11px] font-semibold text-emerald-300 hover:bg-emerald-500/20">
                            Record fill
                          </button>
                        )}
                        <button onClick={() => refreshBaseline(source.id)} className="flex-1 rounded-md border border-slate-700 bg-slate-800/60 px-2 py-1.5 text-[11px] font-semibold text-slate-300 hover:bg-slate-800">
                          Resample baseline
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* ============================= QUALITY & PURITY ============================= */}
        {tab === "quality" && (
          <section>
            {filteredGrades.length === 0 ? (
              <EmptyState icon={Droplets} message="No analysers match the current filters." />
            ) : (
              <>
                <div className="grid gap-4 lg:grid-cols-2">
                  {filteredGrades.map((entry) => {
                    const { analyser, breaches, evaluable, refusal } = entry;
                    const limits = PH_EUR_LIMITS[analyser.gas];
                    const failing = breaches.some((b) => b.tone === "red");
                    return (
                      <article key={analyser.id} className={`rounded-2xl border bg-slate-900/70 p-4 ${failing ? "border-red-500/40" : breaches.length > 0 ? "border-amber-500/40" : "border-slate-800"}`}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <button onClick={() => setModal({ kind: "analyser", data: entry })} className="font-mono text-xs font-semibold text-emerald-300 hover:underline">
                              {analyser.id}
                            </button>
                            <p className="mt-0.5 text-sm font-semibold text-slate-100">{analyser.gas}</p>
                            <p className="text-[11px] text-slate-500">{analyser.location} · sampled {analyser.sampledHoursAgo} h ago</p>
                          </div>
                          <ToneBadge tone={failing ? "red" : breaches.length > 0 ? "amber" : "green"}>
                            {failing ? `${breaches.filter((b) => b.tone === "red").length} out of spec` : breaches.length > 0 ? "Unassessed" : "Within Ph. Eur."}
                          </ToneBadge>
                        </div>

                        {evaluable && limits && (
                          <div className="mt-3 grid grid-cols-3 gap-2">
                            {Object.entries(limits).map(([key, limit]) => {
                              const value = analyser[key];
                              const breach = breaches.find((b) => b.key === key);
                              return (
                                <div key={key} className={`rounded-lg border p-2 text-center ${breach ? (breach.tone === "red" ? "border-red-500/30 bg-red-500/5" : "border-amber-500/30 bg-amber-500/5") : "border-slate-800 bg-slate-950/60"}`}>
                                  <p className="text-[10px] uppercase tracking-wide text-slate-500">{limit.label}</p>
                                  <p className={`text-sm font-bold ${breach ? (breach.tone === "red" ? "text-red-300" : "text-amber-300") : "text-slate-100"}`}>
                                    {value ?? "—"}
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {!evaluable && (
                          <p className="mt-3 rounded-lg border border-sky-500/30 bg-sky-500/5 p-2.5 text-[11px] leading-relaxed text-sky-200">{refusal}</p>
                        )}

                        {breaches.length > 0 && (
                          <ul className="mt-3 space-y-2">
                            {breaches.map((breach) => (
                              <li
                                key={breach.key}
                                className={`rounded-lg border p-2.5 text-[11px] leading-relaxed ${
                                  breach.tone === "red" ? "border-red-500/30 bg-red-500/5 text-red-200" : "border-amber-500/30 bg-amber-500/5 text-amber-200"
                                }`}
                              >
                                {breach.text}
                              </li>
                            ))}
                          </ul>
                        )}

                        <button onClick={() => resample(analyser.id)} className="mt-3 w-full rounded-md border border-emerald-500/40 bg-emerald-500/10 px-2 py-1.5 text-[11px] font-semibold text-emerald-300 hover:bg-emerald-500/20">
                          Service drier and resample
                        </button>
                      </article>
                    );
                  })}
                </div>

                {/* compressor duty */}
                <h2 className="mb-3 mt-6 text-sm font-semibold text-slate-300">Compressor duty balance</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {compressorSets.map((set) => (
                    <article key={set.name} className={`rounded-2xl border bg-slate-900/70 p-4 ${set.balance && set.balance.imbalanced ? "border-amber-500/40" : "border-slate-800"}`}>
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-slate-100">{set.name}</p>
                        <ToneBadge tone={set.balance && set.balance.imbalanced ? "amber" : "green"}>
                          {set.balance ? `${set.balance.spread}% spread` : "—"}
                        </ToneBadge>
                      </div>
                      <div className="mt-3 space-y-2">
                        {set.units.map((unit) => (
                          <div key={unit.id} className="flex items-center gap-3">
                            <span className="w-14 shrink-0 font-mono text-[11px] text-slate-400">{unit.id}</span>
                            <span className="w-16 shrink-0 text-[11px] text-slate-500">{unit.role}</span>
                            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-800">
                              <div className="h-full rounded-full bg-emerald-400" style={{ width: `${unit.dutyPct}%` }} />
                            </div>
                            <span className="w-10 shrink-0 text-right text-[11px] text-slate-400">{unit.dutyPct}%</span>
                          </div>
                        ))}
                      </div>
                      {set.balance && set.balance.imbalanced && (
                        <p className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-2.5 text-[11px] leading-relaxed text-amber-200">
                          Duty spread of {set.balance.spread}% exceeds {DUTY_IMBALANCE_PCT}%: the lead-lag controller has stopped rotating.
                          Three units are installed so any one can fail without consequence — with one carrying the estate, all three
                          reach end of life within weeks of each other and nothing alarms in the meantime.
                        </p>
                      )}
                      <button onClick={() => rotateDuty(set.name)} className="mt-3 w-full rounded-md border border-slate-700 bg-slate-800/60 px-2 py-1.5 text-[11px] font-semibold text-slate-300 hover:bg-slate-800">
                        Restore lead-lag rotation
                      </button>
                    </article>
                  ))}
                </div>
              </>
            )}
          </section>
        )}

        {/* ============================= DISTRIBUTION & ZONES ============================= */}
        {tab === "zones" && (
          <section>
            {filteredZones.length === 0 ? (
              <EmptyState icon={Layers} message="No zones match the current filters." />
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/70">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-500">
                      <th className="px-4 py-3">Valve</th>
                      <th className="px-4 py-3">Isolates</th>
                      <th className="px-4 py-3">Pressure</th>
                      <th className="px-4 py-3">Panel</th>
                      <th className="px-4 py-3">Last operated</th>
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredZones.map((zone) => {
                      const faults = zoneFaults(zone);
                      const band = NOMINAL_PRESSURE_BAR[zone.gas];
                      const outOfBand = faults.some((f) => f.code === "LOW" || f.code === "HIGH");
                      return (
                        <tr key={zone.id} className="border-b border-slate-800/60 last:border-0 hover:bg-slate-800/30">
                          <td className="px-4 py-3">
                            <button onClick={() => setModal({ kind: "zone", data: zone })} className="font-mono text-xs font-semibold text-emerald-300 hover:underline">
                              {zone.id}
                            </button>
                            <p className="text-[11px] text-slate-500">{zone.gas} · {zone.zone}</p>
                          </td>
                          <td className="max-w-xs px-4 py-3">
                            <p className="text-xs text-slate-300">{zone.serves}</p>
                            <p className="text-[11px] text-slate-500">{zone.terminals} terminal units</p>
                          </td>
                          <td className="px-4 py-3">
                            <p className={`text-sm font-bold ${outOfBand ? "text-red-300" : "text-slate-100"}`}>{zone.pressureBar} bar</p>
                            {band && <p className="text-[11px] text-slate-500">{band.min}–{band.max}</p>}
                          </td>
                          <td className="px-4 py-3">
                            <ToneBadge tone={zone.alarmPanel === "Normal" ? "green" : "amber"}>{zone.alarmPanel}</ToneBadge>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-xs ${zone.lastTestedDays > 365 ? "font-semibold text-amber-300" : "text-slate-400"}`}>
                              {zone.lastTestedDays} d ago
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button onClick={() => testValve(zone.id)} className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-2 py-1 text-[11px] font-semibold text-emerald-300 hover:bg-emerald-500/20">
                              Operate &amp; prove
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {/* ============================= VACUUM & AGSS ============================= */}
        {tab === "vacuum" && (
          <section>
            {filteredVacuum.length === 0 ? (
              <EmptyState icon={Wind} message="No plant matches the current filters." />
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {filteredVacuum.map((unit) => (
                  <article key={unit.id} className={`rounded-2xl border bg-slate-900/70 p-4 ${unit.bacterialFilterDays > 180 ? "border-amber-500/40" : "border-slate-800"}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-mono text-xs font-semibold text-emerald-300">{unit.id}</p>
                        <p className="text-xs text-slate-200">{unit.name}</p>
                        <p className="text-[11px] text-slate-500">{unit.set} · {unit.role}</p>
                      </div>
                      <ToneBadge tone={unit.state === "Running" ? "green" : "slate"}>{unit.state}</ToneBadge>
                    </div>

                    <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                      <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-2">
                        <p className="text-[10px] uppercase tracking-wide text-slate-500">Vacuum</p>
                        <p className="text-sm font-bold text-slate-100">{unit.vacuumBar}</p>
                      </div>
                      <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-2">
                        <p className="text-[10px] uppercase tracking-wide text-slate-500">Duty</p>
                        <p className="text-sm font-bold text-slate-100">{unit.dutyPct}%</p>
                      </div>
                      <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-2">
                        <p className="text-[10px] uppercase tracking-wide text-slate-500">Run h</p>
                        <p className="text-sm font-bold text-slate-100">{(unit.runHours / 1000).toFixed(1)}k</p>
                      </div>
                    </div>

                    <p className="mt-3 text-[11px] text-slate-500">
                      Bacterial filter {unit.bacterialFilterDays} days old
                      {unit.receiverPct != null ? ` · receiver ${unit.receiverPct}%` : ""}
                    </p>

                    {unit.bacterialFilterDays > 180 && (
                      <p className="mt-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-2.5 text-[11px] leading-relaxed text-amber-200">
                        A vacuum bacterial filter past its interval is the one part of this plant that moves contamination towards
                        people rather than away from them.
                      </p>
                    )}

                    <button onClick={() => serviceFilter(unit.id)} className="mt-3 w-full rounded-md border border-emerald-500/40 bg-emerald-500/10 px-2 py-1.5 text-[11px] font-semibold text-emerald-300 hover:bg-emerald-500/20">
                      Replace filter
                    </button>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}
      </main>

      {/* ============================= INSPECTION MODALS ============================= */}
      {modal && modal.kind === "source" && (
        <Modal title={modal.data.source.name} subtitle={`${modal.data.source.id} · ${modal.data.source.gas} · ${modal.data.source.location}`} onClose={() => setModal(null)}>
          <Row label="Kind" value={modal.data.source.kind} />
          <Row label="State" value={modal.data.source.state} accent={modal.data.source.state === "On line" ? undefined : "text-amber-300"} />
          <Row label="Capacity" value={modal.data.source.capacityLitres == null ? "not a stored source" : `${modal.data.source.capacityLitres.toLocaleString()} L liquid`} />
          <Row label="Contents" value={modal.data.source.contentsPct == null ? "—" : `${modal.data.source.contentsPct}%`} />
          <Row label="Emergency reserve" value={`${RESERVE_PCT}% held back`} />
          <Row label="Consumption" value={`${modal.data.source.consumptionLitresDay.toLocaleString()} L gas/day`} />
          <Row label="Baseline age" value={`${modal.data.source.baselineAgeDays} days`} accent={modal.data.source.baselineAgeDays > CONSUMPTION_BASELINE_MAX_AGE_DAYS ? "text-amber-300" : undefined} />
          <Row label="Days of supply" value={modal.data.supply.days == null ? "not computable" : `${modal.data.supply.days} days`} accent={modal.data.supply.days == null ? "text-amber-300" : undefined} />
          <Row label="Peak demand" value={`${modal.data.source.peakDemandLpm} L/min`} />
          <Row label="Vaporiser rating" value={`${modal.data.source.vaporiserRatedLpm} L/min`} accent={modal.data.headroom && modal.data.headroom.breached ? "text-red-300" : undefined} />

          {modal.data.supply.refusal ? (
            <p className="mt-3 rounded-lg border border-sky-500/30 bg-sky-500/5 p-3 text-[11px] leading-relaxed text-sky-200">
              {modal.data.supply.refusal}
            </p>
          ) : (
            <p className="mt-3 rounded-lg border border-slate-800 bg-slate-950/60 p-3 text-[11px] leading-relaxed text-slate-400">
              ({modal.data.source.contentsPct}% − {RESERVE_PCT}%) × {modal.data.source.capacityLitres.toLocaleString()} L ×{" "}
              {LOX_EXPANSION_RATIO} = {modal.data.supply.usableGasLitres.toLocaleString()} litres of gas above the reserve, divided by{" "}
              {modal.data.source.consumptionLitresDay.toLocaleString()} L/day. The expansion ratio is the step that turns a tank gauge
              into a delivery date, and the level percentage on the telemetry panel is not proportional to it.
            </p>
          )}
        </Modal>
      )}

      {modal && modal.kind === "analyser" && (
        <Modal title={`${modal.data.analyser.gas} analyser`} subtitle={`${modal.data.analyser.id} · ${modal.data.analyser.location}`} onClose={() => setModal(null)}>
          <Row label="Sampled" value={`${modal.data.analyser.sampledHoursAgo} hours ago`} />
          {PH_EUR_LIMITS[modal.data.analyser.gas] &&
            Object.entries(PH_EUR_LIMITS[modal.data.analyser.gas]).map(([key, limit]) => {
              const breach = modal.data.breaches.find((b) => b.key === key);
              const bound = limit.min != null ? `min ${limit.min}` : `max ${limit.max}`;
              return (
                <Row
                  key={key}
                  label={`${limit.label} (${bound})`}
                  value={modal.data.analyser[key] ?? "not sampled"}
                  accent={breach ? (breach.tone === "red" ? "text-red-300" : "text-amber-300") : undefined}
                />
              );
            })}
          <p className="mt-3 rounded-lg border border-slate-800 bg-slate-950/60 p-3 text-[11px] leading-relaxed text-slate-400">
            Medical air made on site is a manufactured product and is graded as one, analyte by analyte. A single pass lamp collapses
            six independent tests into one bit and hides which failed — and the one that matters operationally is dew point, because a
            drier that has failed puts liquid water into a pipeline that will freeze at a pressure reduction and take out a zone.
          </p>
        </Modal>
      )}

      {modal && modal.kind === "zone" && (
        <Modal title={modal.data.id} subtitle={`${modal.data.gas} · ${modal.data.zone}`} onClose={() => setModal(null)}>
          <Row label="Isolates" value={modal.data.serves} />
          <Row label="Terminal units" value={modal.data.terminals} />
          <Row label="Valve state" value={modal.data.valveState} />
          <Row label="Pressure" value={`${modal.data.pressureBar} bar`} />
          {NOMINAL_PRESSURE_BAR[modal.data.gas] && (
            <Row label="HTM band" value={`${NOMINAL_PRESSURE_BAR[modal.data.gas].min}–${NOMINAL_PRESSURE_BAR[modal.data.gas].max} bar`} />
          )}
          <Row label="Alarm panel" value={modal.data.alarmPanel} accent={modal.data.alarmPanel === "Normal" ? undefined : "text-amber-300"} />
          <Row label="Last operated" value={`${modal.data.lastTestedDays} days ago`} accent={modal.data.lastTestedDays > 365 ? "text-amber-300" : undefined} />
          {zoneFaults(modal.data).length > 0 ? (
            <ul className="mt-3 space-y-2">
              {zoneFaults(modal.data).map((fault) => (
                <li
                  key={fault.code}
                  className={`rounded-lg border p-2.5 text-[11px] leading-relaxed ${
                    fault.tone === "red" ? "border-red-500/30 bg-red-500/5 text-red-200" : "border-amber-500/30 bg-amber-500/5 text-amber-200"
                  }`}
                >
                  {fault.text}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 text-[11px] leading-relaxed text-emerald-200">
              Pressure inside the HTM band, panel normal and the valve operated inside the year. The line above the pressure is the one
              that matters in an emergency: a zone valve is only useful if somebody knows what it isolates before they need to turn it.
            </p>
          )}
        </Modal>
      )}

      {/* footer strip */}
      <footer className="mt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 px-6 py-4 text-[11px] text-slate-500">
        <span className="inline-flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${sim.running ? "bg-emerald-400" : "bg-amber-400"}`} />
          {sim.running ? `Live simulation at ${sim.speed}× · tick #${sim.tick}` : "Simulation paused"}
        </span>
        <span className="hidden md:inline">HTM 02-01 · NFPA 99 chapter 5 · ISO 7396-1 · Ph. Eur. medicinal air and oxygen</span>
        <span className="inline-flex items-center gap-1.5">
          <SlidersHorizontal size={12} /> {sources.length} sources · {analysers.length} analysers · {zones.length} zones · {vacuum.length} plant units
        </span>
        <span className="hidden xl:inline-flex items-center gap-1.5">
          <FileText size={12} /> Expansion ratio {LOX_EXPANSION_RATIO}:1
        </span>
      </footer>
    </div>
  );
}
