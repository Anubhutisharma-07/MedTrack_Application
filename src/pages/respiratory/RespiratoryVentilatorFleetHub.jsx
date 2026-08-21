import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity, AlertTriangle, Calculator, CheckCircle2, Cylinder, Gauge, Info,
  Pause, Play, RefreshCw, ShieldAlert, Siren, Timer, Wind,
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
 *  MedTrack Respiratory Therapy & Ventilator Fleet Hub
 *  ------------------------------------------------------------------
 *  Four consoles for the respiratory service, built around a device
 *  class that is unlike every other one MedTrack tracks: a ventilator
 *  does not report a patient's condition, it imposes one. Every breath
 *  a patient on mandatory ventilation takes was decided by a number
 *  somebody typed into a machine, and if that number is wrong the
 *  machine will deliver it faithfully, hundreds of times an hour,
 *  until somebody notices.
 *
 *    1. Ventilator Fleet  - invasive, non-invasive, transport and HFNC
 *                           units with mode, circuit and HME age,
 *                           calibration and location.
 *    2. Lung Protection   - the settings on every ventilated patient,
 *                           independently recalculated against ARDSNet.
 *    3. Oxygen Logistics  - cylinder burn-time and concentrator output,
 *                           so a patient does not leave the unit on a
 *                           cylinder that will not reach the scanner.
 *    4. Weaning & SBT     - spontaneous breathing trial readiness with
 *                           the criteria evaluated rather than asserted.
 *
 *  The lung protection console is the substance of this page. It never
 *  reads the tidal volume the ventilator is set to and agrees with it:
 *  the set volume is in millilitres and the safe volume is millilitres
 *  per kilogram of *predicted* body weight. See predictedBodyWeight()
 *  for why that distinction is the whole point, and lungProtection()
 *  for the patients it refuses to grade at all.
 * ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/*  Clinical constants                                                 */
/* ------------------------------------------------------------------ */

/**
 * ARDSNet low-tidal-volume targets, in mL per kg of predicted body weight.
 *
 * 6 mL/kg is the protocol target. The 4-8 band is the range the protocol permits while titrating
 * for plateau pressure and acidaemia, so a patient at 7.4 is inside the protocol and a patient at
 * 8.6 is not - and the difference between those two is invisible if you are looking at the
 * millilitre figure on the ventilator, which is the only figure most people ever see.
 */
const TIDAL_VOLUME = { target: 6.0, min: 4.0, max: 8.0 };

/** Plateau pressure ceiling. Above this the alveoli are being over-distended regardless of volume. */
const PLATEAU_LIMIT_CMH2O = 30;

/**
 * Driving pressure ceiling.
 *
 * Driving pressure (Pplat - PEEP) is the tidal volume normalised to the compliance the lung
 * actually has rather than to the size the patient was born. It is the single strongest predictor
 * of mortality in ARDS - stronger than tidal volume, stronger than plateau pressure - and it is
 * almost never displayed on a ventilator, because it is a subtraction the operator is expected to
 * do in their head and therefore does not do.
 */
const DRIVING_PRESSURE_LIMIT = 15;

/**
 * Mechanical power above which ventilator-induced lung injury becomes likely.
 *
 * Power folds rate, volume and pressure into one number in joules per minute, which matters because
 * the three are traded against each other constantly: dropping tidal volume and paying for it with
 * a respiratory rate of 35 does not reduce the energy being put into the lung, it redistributes it.
 */
const MECHANICAL_POWER_LIMIT_J_MIN = 17;

/**
 * A plateau pressure older than this is not a plateau pressure.
 *
 * Pplat requires an inspiratory hold, so it is a manoeuvre rather than a continuously measured
 * value. Driving pressure computed from a six-hour-old hold describes a lung that has since been
 * recruited, derecruited, proned or suctioned.
 */
const PLATEAU_STALE_MINUTES = 240;

/** Ventilator circuit and HME change intervals, in hours, per IFU and local IPC policy. */
const CIRCUIT_CHANGE_HOURS = 168;
const HME_CHANGE_HOURS = 24;

/**
 * Modes in which a lung-protective tidal volume target is meaningless.
 *
 * In pressure support and CPAP the patient chose the volume; the ventilator assisted it. Grading
 * those against a 6 mL/kg target flags healthy weaning as a protocol violation, and a console that
 * cries wolf on every successfully weaning patient teaches its users to dismiss the flag that
 * matters.
 */
const SPONTANEOUS_MODES = new Set(["PSV", "CPAP", "NIV-ST", "HFNC"]);

/**
 * Reserve pressure left in a transport cylinder, in bar.
 *
 * Not zero, and not a rounding convenience. A cylinder run to the last bar has no margin for the
 * lift that does not arrive or the scanner that overruns, and the reserve is what turns a delay
 * into an inconvenience rather than an incident.
 */
const CYLINDER_RESERVE_BAR = 10;

/**
 * Water capacity in litres by cylinder size, which is the number the gauge does not tell you.
 *
 * A gauge reading "half" means 340 litres on a CD and 1360 on a J. Every burn-time error I have
 * seen came from reading the gauge and not the label.
 */
const CYLINDER_CAPACITY_L = { CD: 2.0, D: 2.32, E: 4.7, F: 9.4, HX: 18.0, J: 47.0 };

/** Cylinder filling pressure in bar; multiplied by water capacity to give contained gas litres. */
const CYLINDER_FILL_BAR = 200;

/**
 * Rapid shallow breathing index threshold for extubation readiness.
 *
 * RSBI = respiratory rate / tidal volume in litres. Below 105 the trial is likely to succeed; above
 * it the patient is taking small fast breaths, which is what a diaphragm that is about to fail
 * looks like an hour before it fails.
 */
const RSBI_THRESHOLD = 105;

/* ------------------------------------------------------------------ */
/*  Seed data                                                          */
/* ------------------------------------------------------------------ */

const VENTILATORS = [
  { id: "VNT-ICU-01", model: "Servo-u", vendor: "Getinge", class: "Invasive", location: "ICU Bed 1", status: "In use", mode: "VC-AC", circuitHours: 41, hmeHours: 6, calibrationDueDays: 44, hoursRun: 18_402, batteryPct: 100, onMains: true },
  { id: "VNT-ICU-02", model: "Servo-u", vendor: "Getinge", class: "Invasive", location: "ICU Bed 4", status: "In use", mode: "PC-AC", circuitHours: 191, hmeHours: 31, calibrationDueDays: 12, hoursRun: 21_115, batteryPct: 98, onMains: true },
  { id: "VNT-ICU-03", model: "Evita V800", vendor: "Dräger", class: "Invasive", location: "ICU Bed 6", status: "In use", mode: "VC-AC", circuitHours: 88, hmeHours: 14, calibrationDueDays: -6, hoursRun: 9_744, batteryPct: 100, onMains: true },
  { id: "VNT-ICU-04", model: "Evita V800", vendor: "Dräger", class: "Invasive", location: "ICU Bed 7", status: "In use", mode: "PSV", circuitHours: 120, hmeHours: 19, calibrationDueDays: 71, hoursRun: 12_060, batteryPct: 96, onMains: true },
  { id: "VNT-ICU-05", model: "Puritan Bennett 980", vendor: "Medtronic", class: "Invasive", location: "ICU Bed 9", status: "Standby", mode: "—", circuitHours: 0, hmeHours: 0, calibrationDueDays: 130, hoursRun: 5_330, batteryPct: 100, onMains: true },
  { id: "VNT-HDU-01", model: "V60", vendor: "Philips", class: "Non-invasive", location: "HDU Bay 2", status: "In use", mode: "NIV-ST", circuitHours: 63, hmeHours: 0, calibrationDueDays: 26, hoursRun: 7_918, batteryPct: 74, onMains: true },
  { id: "VNT-HDU-02", model: "V60", vendor: "Philips", class: "Non-invasive", location: "HDU Bay 5", status: "In use", mode: "CPAP", circuitHours: 172, hmeHours: 0, calibrationDueDays: 55, hoursRun: 8_401, batteryPct: 88, onMains: true },
  { id: "VNT-TRP-01", model: "Hamilton-T1", vendor: "Hamilton", class: "Transport", location: "Transfer trolley A", status: "In use", mode: "VC-AC", circuitHours: 12, hmeHours: 3, calibrationDueDays: 9, hoursRun: 3_212, batteryPct: 41, onMains: false },
  { id: "VNT-TRP-02", model: "Hamilton-T1", vendor: "Hamilton", class: "Transport", location: "ED resus", status: "Standby", mode: "—", circuitHours: 0, hmeHours: 0, calibrationDueDays: 33, hoursRun: 2_884, batteryPct: 100, onMains: true },
  { id: "VNT-TRP-03", model: "Oxylog 3000+", vendor: "Dräger", class: "Transport", location: "Transfer trolley C", status: "Service", mode: "—", circuitHours: 0, hmeHours: 0, calibrationDueDays: -21, hoursRun: 6_770, batteryPct: 18, onMains: false },
  { id: "VNT-HFN-01", model: "AIRVO 2", vendor: "F&P", class: "HFNC", location: "Ward 12 Bay 1", status: "In use", mode: "HFNC", circuitHours: 54, hmeHours: 0, calibrationDueDays: 88, hoursRun: 4_190, batteryPct: 100, onMains: true },
  { id: "VNT-HFN-02", model: "AIRVO 2", vendor: "F&P", class: "HFNC", location: "Ward 12 Bay 6", status: "In use", mode: "HFNC", circuitHours: 210, hmeHours: 0, calibrationDueDays: 101, hoursRun: 3_905, batteryPct: 100, onMains: true },
];

/**
 * Ventilated patients.
 *
 * `heightCm: null` on RSP-1108 is deliberate and is the most important row on the page: it is the
 * state in which no target can be computed, and the console has to say so rather than reach for the
 * bed weight sitting one field away.
 */
const VENT_PATIENTS = [
  { id: "RSP-1101", patient: "PT-4402 — A. Okafor", bed: "ICU Bed 1", ventilatorId: "VNT-ICU-01", sex: "M", heightCm: 178, actualWeightKg: 96, mode: "VC-AC", setVt: 520, rate: 18, pplat: 26, peep: 10, ppeak: 32, fio2: 0.5, plateauAgeMin: 35, diagnosis: "ARDS, community pneumonia" },
  { id: "RSP-1102", patient: "PT-4417 — M. Silva", bed: "ICU Bed 4", ventilatorId: "VNT-ICU-02", sex: "F", heightCm: 158, actualWeightKg: 71, mode: "PC-AC", setVt: 470, rate: 22, pplat: 31, peep: 12, ppeak: 38, fio2: 0.65, plateauAgeMin: 20, diagnosis: "ARDS, pancreatitis" },
  { id: "RSP-1103", patient: "PT-4425 — J. Nowak", bed: "ICU Bed 6", ventilatorId: "VNT-ICU-03", sex: "M", heightCm: 191, actualWeightKg: 88, mode: "VC-AC", setVt: 520, rate: 16, pplat: 22, peep: 8, ppeak: 27, fio2: 0.35, plateauAgeMin: 55, diagnosis: "Post-op, elective AAA repair" },
  { id: "RSP-1104", patient: "PT-4431 — R. Haddad", bed: "ICU Bed 7", ventilatorId: "VNT-ICU-04", sex: "M", heightCm: 172, actualWeightKg: 64, mode: "PSV", setVt: 610, rate: 14, pplat: 18, peep: 5, ppeak: 20, fio2: 0.3, plateauAgeMin: 90, diagnosis: "Weaning, day 6" },
  { id: "RSP-1105", patient: "PT-4440 — L. Fontaine", bed: "HDU Bay 2", ventilatorId: "VNT-HDU-01", sex: "F", heightCm: 165, actualWeightKg: 58, mode: "NIV-ST", setVt: 430, rate: 20, pplat: null, peep: 6, ppeak: 18, fio2: 0.4, plateauAgeMin: null, diagnosis: "COPD exacerbation, type 2 failure" },
  { id: "RSP-1106", patient: "PT-4448 — D. Ivanov", bed: "ICU Bed 9", ventilatorId: null, sex: "M", heightCm: 169, actualWeightKg: 121, mode: "VC-AC", setVt: 700, rate: 20, pplat: 34, peep: 14, ppeak: 41, fio2: 0.8, plateauAgeMin: 15, diagnosis: "ARDS, obesity hypoventilation" },
  { id: "RSP-1107", patient: "PT-4455 — S. Bhatt", bed: "ICU Bed 3", ventilatorId: null, sex: "F", heightCm: 152, actualWeightKg: 49, mode: "VC-AC", setVt: 380, rate: 24, pplat: 29, peep: 12, ppeak: 35, fio2: 0.6, plateauAgeMin: 380, diagnosis: "Aspiration pneumonitis" },
  { id: "RSP-1108", patient: "PT-4461 — Unidentified male", bed: "ED resus", ventilatorId: "VNT-TRP-02", sex: "M", heightCm: null, actualWeightKg: 80, mode: "VC-AC", setVt: 550, rate: 18, pplat: 25, peep: 8, ppeak: 30, fio2: 1.0, plateauAgeMin: 10, diagnosis: "Trauma, awaiting identification" },
  { id: "RSP-1109", patient: "PT-4470 — K. Adeyemi", bed: "Transfer trolley A", ventilatorId: "VNT-TRP-01", sex: "F", heightCm: 170, actualWeightKg: 67, mode: "VC-AC", setVt: 400, rate: 16, pplat: 24, peep: 8, ppeak: 29, fio2: 0.45, plateauAgeMin: 42, diagnosis: "In transit to CT" },
  { id: "RSP-1110", patient: "PT-4478 — H. Lindqvist", bed: "Ward 12 Bay 1", ventilatorId: "VNT-HFN-01", sex: "M", heightCm: 183, actualWeightKg: 79, mode: "HFNC", setVt: null, rate: 24, pplat: null, peep: null, ppeak: null, fio2: 0.4, plateauAgeMin: null, diagnosis: "Step-down, 50 L/min HFNC" },
];

const OXYGEN_ASSETS = [
  { id: "O2-CYL-1104", kind: "Cylinder", size: "CD", location: "Transfer trolley A", gaugeBar: 118, flowLpm: 6, drivingGasLpm: 4, custodian: "ICU transfer team", lastCheckedDays: 0 },
  { id: "O2-CYL-1107", kind: "Cylinder", size: "CD", location: "Transfer trolley B", gaugeBar: 34, flowLpm: 10, drivingGasLpm: 4, custodian: "ICU transfer team", lastCheckedDays: 1 },
  { id: "O2-CYL-1112", kind: "Cylinder", size: "E", location: "ED resus bay 1", gaugeBar: 176, flowLpm: 15, drivingGasLpm: 0, custodian: "ED", lastCheckedDays: 0 },
  { id: "O2-CYL-1119", kind: "Cylinder", size: "E", location: "Ward 12 store", gaugeBar: 12, flowLpm: 4, drivingGasLpm: 0, custodian: "Ward 12", lastCheckedDays: 9 },
  { id: "O2-CYL-1126", kind: "Cylinder", size: "F", location: "Theatre recovery", gaugeBar: 149, flowLpm: 8, drivingGasLpm: 0, custodian: "Theatres", lastCheckedDays: 2 },
  { id: "O2-CYL-1133", kind: "Cylinder", size: "J", location: "Backup manifold bay", gaugeBar: 191, flowLpm: 0, drivingGasLpm: 0, custodian: "Estates", lastCheckedDays: 4 },
  { id: "O2-CYL-1140", kind: "Cylinder", size: "D", location: "Ambulance handover", gaugeBar: 62, flowLpm: 12, drivingGasLpm: 5, custodian: "Ambulance service", lastCheckedDays: 0 },
  { id: "O2-CON-2201", kind: "Concentrator", size: "—", location: "Ward 9 Bay 3", gaugeBar: null, flowLpm: 4, drivingGasLpm: 0, custodian: "Ward 9", lastCheckedDays: 3, purityPct: 94.2 },
  { id: "O2-CON-2204", kind: "Concentrator", size: "—", location: "Ward 9 Bay 8", gaugeBar: null, flowLpm: 5, drivingGasLpm: 0, custodian: "Ward 9", lastCheckedDays: 11, purityPct: 86.1 },
  { id: "O2-CON-2209", kind: "Concentrator", size: "—", location: "Respiratory clinic", gaugeBar: null, flowLpm: 2, drivingGasLpm: 0, custodian: "Respiratory", lastCheckedDays: 1, purityPct: 95.8 },
];

const WEANING = [
  { id: "SBT-701", patient: "PT-4431 — R. Haddad", bed: "ICU Bed 7", ventDays: 6, rate: 18, spontaneousVtMl: 420, fio2: 0.3, peep: 5, gcs: 15, vasopressor: false, cuffLeak: true, secretionsHeavy: false, lastTrialOutcome: "Passed 90 min" },
  { id: "SBT-702", patient: "PT-4402 — A. Okafor", bed: "ICU Bed 1", ventDays: 3, rate: 26, spontaneousVtMl: 310, fio2: 0.5, peep: 10, gcs: 11, vasopressor: true, cuffLeak: false, secretionsHeavy: true, lastTrialOutcome: "Not attempted" },
  { id: "SBT-703", patient: "PT-4425 — J. Nowak", bed: "ICU Bed 6", ventDays: 1, rate: 16, spontaneousVtMl: 520, fio2: 0.35, peep: 8, gcs: 14, vasopressor: false, cuffLeak: true, secretionsHeavy: false, lastTrialOutcome: "Passed 30 min" },
  { id: "SBT-704", patient: "PT-4448 — D. Ivanov", bed: "ICU Bed 9", ventDays: 9, rate: 30, spontaneousVtMl: 260, fio2: 0.8, peep: 14, gcs: 9, vasopressor: true, cuffLeak: false, secretionsHeavy: true, lastTrialOutcome: "Failed at 12 min" },
  { id: "SBT-705", patient: "PT-4455 — S. Bhatt", bed: "ICU Bed 3", ventDays: 4, rate: 22, spontaneousVtMl: 340, fio2: 0.6, peep: 12, gcs: 13, vasopressor: false, cuffLeak: true, secretionsHeavy: false, lastTrialOutcome: "Failed at 40 min" },
  { id: "SBT-706", patient: "PT-4470 — K. Adeyemi", bed: "Transfer trolley A", ventDays: 2, rate: 16, spontaneousVtMl: 450, fio2: 0.45, peep: 8, gcs: 15, vasopressor: false, cuffLeak: true, secretionsHeavy: false, lastTrialOutcome: "Deferred — in transit" },
  { id: "SBT-707", patient: "PT-4417 — M. Silva", bed: "ICU Bed 4", ventDays: 7, rate: 28, spontaneousVtMl: 290, fio2: 0.65, peep: 12, gcs: 10, vasopressor: true, cuffLeak: false, secretionsHeavy: true, lastTrialOutcome: "Not attempted" },
  { id: "SBT-708", patient: "PT-4440 — L. Fontaine", bed: "HDU Bay 2", ventDays: 2, rate: 20, spontaneousVtMl: 400, fio2: 0.4, peep: 6, gcs: 15, vasopressor: false, cuffLeak: true, secretionsHeavy: false, lastTrialOutcome: "NIV — not applicable" },
];

/* ------------------------------------------------------------------ */
/*  Clinical calculations                                              */
/* ------------------------------------------------------------------ */

/**
 * ARDSNet predicted body weight, in kilograms.
 *
 *   male   50.0 + 0.91 x (height_cm - 152.4)
 *   female 45.5 + 0.91 x (height_cm - 152.4)
 *
 * Two things about this function are the entire reason this console exists.
 *
 * The first is what it takes: height and sex. It does not take the patient's weight, and there is
 * deliberately no parameter for it. Predicted body weight is the weight a person of this height
 * *should* be, because lung volume scales with height and not with adiposity - an obese 170 cm
 * patient may weigh 110 kg and have the lungs of the 65 kg person their height predicts. Ventilating
 * them to their actual weight delivers nearly double the safe tidal volume, and it is the most
 * commonly made error in mechanical ventilation.
 *
 * The second is what it returns when it cannot compute: null. A PBW derived from a guessed height
 * is wrong by the same margin as no check at all and worse than no check, because it will be
 * believed. The caller must handle null rather than receive a plausible default.
 *
 * @param {"M"|"F"} sex
 * @param {number|null} heightCm
 * @returns {number|null} predicted body weight in kg, or null if it cannot be computed
 */
export function predictedBodyWeight(sex, heightCm) {
  if (heightCm == null || !Number.isFinite(heightCm) || heightCm <= 0) return null;
  const base = sex === "F" ? 45.5 : 50.0;
  const pbw = base + 0.91 * (heightCm - 152.4);
  // Below this the regression has left the population it was fitted to, and a negative or
  // near-zero PBW would produce a mL/kg figure of nonsense magnitude rather than an obvious error.
  if (pbw < 20) return null;
  return Math.round(pbw * 10) / 10;
}

/**
 * Driving pressure, or null when the plateau it would be computed from is unusable.
 *
 * Pplat requires an inspiratory hold and is therefore a manoeuvre, not a continuously measured
 * value. A driving pressure derived from a four-hour-old hold describes a lung that has since been
 * recruited, derecruited, proned or suctioned, and it is presented with exactly the same confidence
 * as one measured a minute ago.
 */
export function drivingPressure(record) {
  if (record.pplat == null || record.peep == null) return null;
  if (record.plateauAgeMin == null || record.plateauAgeMin > PLATEAU_STALE_MINUTES) return null;
  return Math.round((record.pplat - record.peep) * 10) / 10;
}

/**
 * Mechanical power in joules per minute, by the simplified Gattinoni surrogate.
 *
 *   power ~ 0.098 x RR x Vt(L) x (Ppeak - 0.5 x driving pressure)
 *
 * Worth surfacing because rate, volume and pressure are traded against each other constantly, and
 * the trade is usually presented as a win: dropping tidal volume and paying for it with a rate of
 * 35 does not reduce the energy going into the lung, it redistributes it. Power is the number that
 * does not move when the trade is neutral.
 */
export function mechanicalPower(record) {
  const dp = drivingPressure(record);
  if (dp == null || record.ppeak == null || record.setVt == null || !record.rate) return null;
  const litres = record.setVt / 1000;
  const power = 0.098 * record.rate * litres * (record.ppeak - 0.5 * dp);
  return Math.round(power * 10) / 10;
}

/**
 * Grade one ventilated patient against the ARDSNet lung-protective protocol.
 *
 * Returns an evaluable/refused verdict rather than a score, because the refusals are the point.
 * Three states are refusals rather than passes:
 *
 *   - no recorded height, so predicted body weight cannot be derived;
 *   - a spontaneous or non-invasive mode, where the patient chose the volume and grading it as a
 *     protocol violation trains people to dismiss the flag;
 *   - no tidal volume at all, which is HFNC and is not ventilation in this sense.
 *
 * Flags are accumulated rather than short-circuited: a patient can be over volume, over plateau,
 * over driving pressure and over power simultaneously, and reporting only the first costs a round
 * trip for information that was already on the screen.
 *
 * @returns {{evaluable: boolean, refusal: string|null, pbw: number|null,
 *            targetMl: number|null, perKg: number|null, flags: Array<{code: string, tone: string, text: string}>}}
 */
export function lungProtection(record) {
  const flags = [];
  const pbw = predictedBodyWeight(record.sex, record.heightCm);

  if (SPONTANEOUS_MODES.has(record.mode)) {
    return {
      evaluable: false,
      refusal:
        `${record.mode} is a spontaneous mode: the patient chose this tidal volume and the ventilator assisted it. ` +
        "A 6 mL/kg target grades successful weaning as a protocol breach, so no target is applied.",
      pbw, targetMl: null, perKg: null, flags,
    };
  }

  if (record.setVt == null) {
    return {
      evaluable: false,
      refusal: "No set tidal volume — high-flow nasal oxygen delivers no mandatory breath to grade.",
      pbw, targetMl: null, perKg: null, flags,
    };
  }

  if (pbw == null) {
    return {
      evaluable: false,
      refusal:
        "No recorded height, so predicted body weight cannot be derived. Actual body weight is not " +
        "substituted and no population average is assumed: a target from a guessed height is wrong " +
        "by the same margin as no target, and it would be believed.",
      pbw: null, targetMl: null, perKg: null, flags,
    };
  }

  const perKg = Math.round((record.setVt / pbw) * 100) / 100;
  const targetMl = Math.round(TIDAL_VOLUME.target * pbw);

  if (perKg > TIDAL_VOLUME.max) {
    flags.push({
      code: "VT-HIGH", tone: "red",
      text: `${perKg} mL/kg PBW is above the 8 mL/kg protocol ceiling. Target ${targetMl} mL for a ${pbw} kg predicted weight, not the ${record.actualWeightKg} kg the patient weighs.`,
    });
  } else if (perKg > TIDAL_VOLUME.target + 0.5) {
    flags.push({
      code: "VT-DRIFT", tone: "amber",
      text: `${perKg} mL/kg PBW is inside the permitted band but above the 6 mL/kg target. Step down towards ${targetMl} mL if plateau and pH allow.`,
    });
  } else if (perKg < TIDAL_VOLUME.min) {
    flags.push({
      code: "VT-LOW", tone: "amber",
      text: `${perKg} mL/kg PBW is below the 4 mL/kg floor. Check for a leak or an unintended setting before accepting it as protective.`,
    });
  }

  if (record.pplat != null && record.pplat > PLATEAU_LIMIT_CMH2O) {
    flags.push({
      code: "PPLAT", tone: "red",
      text: `Plateau ${record.pplat} cmH2O exceeds the ${PLATEAU_LIMIT_CMH2O} cmH2O ceiling. Alveolar over-distension is happening at this volume regardless of the mL/kg figure.`,
    });
  }

  const dp = drivingPressure(record);
  if (dp == null && record.pplat != null) {
    flags.push({
      code: "PPLAT-STALE", tone: "amber",
      text:
        record.plateauAgeMin == null
          ? "Plateau pressure has no recorded measurement time, so driving pressure is not derived."
          : `Plateau measured ${record.plateauAgeMin} min ago, beyond the ${PLATEAU_STALE_MINUTES} min window. Driving pressure from a stale hold is not driving pressure — repeat the manoeuvre.`,
    });
  } else if (dp != null && dp > DRIVING_PRESSURE_LIMIT) {
    flags.push({
      code: "DRIVING", tone: "red",
      text: `Driving pressure ${dp} cmH2O exceeds ${DRIVING_PRESSURE_LIMIT}. This is the strongest single predictor of mortality in ARDS and it is a subtraction the ventilator does not display.`,
    });
  }

  const power = mechanicalPower(record);
  if (power != null && power > MECHANICAL_POWER_LIMIT_J_MIN) {
    flags.push({
      code: "POWER", tone: "amber",
      text: `Mechanical power ${power} J/min is above ${MECHANICAL_POWER_LIMIT_J_MIN}. Rate ${record.rate} is carrying energy that a lower tidal volume alone has not removed.`,
    });
  }

  if (record.fio2 >= 0.6 && (record.peep == null || record.peep < 10)) {
    flags.push({
      code: "PEEP-FIO2", tone: "amber",
      text: `FiO2 ${Math.round(record.fio2 * 100)}% on PEEP ${record.peep ?? "—"} sits off the ARDSNet PEEP/FiO2 ladder. Oxygenation is being bought with oxygen rather than with recruitment.`,
    });
  }

  return { evaluable: true, refusal: null, pbw, targetMl, perKg, flags };
}

/**
 * Transport oxygen burn-time in minutes, or null when it cannot honestly be produced.
 *
 *   usable_litres = (gauge_bar - reserve_bar) x water_capacity_L
 *   minutes       = usable_litres / (delivery_flow + driving_gas_flow)
 *
 * Two terms here are the ones omitted by the arithmetic done at the bedside, and both shorten the
 * answer. The reserve is deliberately not run to zero, and the driving-gas draw of a transport
 * ventilator is real gas leaving the same cylinder as the patient's - on a CD cylinder at 10 L/min
 * delivery, forgetting a 4 L/min driving draw over-states the remaining time by about 40%.
 */
export function cylinderMinutes(asset) {
  if (asset.kind !== "Cylinder") return null;
  const capacity = CYLINDER_CAPACITY_L[asset.size];
  if (capacity == null || asset.gaugeBar == null) return null;
  const totalFlow = (asset.flowLpm || 0) + (asset.drivingGasLpm || 0);
  if (totalFlow <= 0) return null;
  const usable = (asset.gaugeBar - CYLINDER_RESERVE_BAR) * capacity;
  if (usable <= 0) return 0;
  return Math.floor(usable / totalFlow);
}

/** Contained litres at the gauge reading, ignoring the reserve — used for the fill percentage. */
export function cylinderFillPct(asset) {
  if (asset.kind !== "Cylinder" || asset.gaugeBar == null) return null;
  return Math.max(0, Math.min(100, Math.round((asset.gaugeBar / CYLINDER_FILL_BAR) * 100)));
}

/**
 * Rapid shallow breathing index: respiratory rate divided by tidal volume in litres.
 *
 * The units are the trap. RSBI is breaths/min per litre, so a 300 mL breath is 0.3 and not 300, and
 * the index is a factor of a thousand out if the millilitre figure is used directly.
 */
export function rsbi(entry) {
  if (!entry.spontaneousVtMl || !entry.rate) return null;
  return Math.round(entry.rate / (entry.spontaneousVtMl / 1000));
}

/**
 * Evaluate spontaneous breathing trial readiness against the standard criteria.
 *
 * Every criterion is checked rather than the first failing one reported, because the list is the
 * clinical value: "not ready" is an instruction to do nothing, whereas "not ready: on noradrenaline,
 * RSBI 115, no cuff leak" is three things to work on.
 */
export function sbtReadiness(entry) {
  const blockers = [];
  const index = rsbi(entry);

  if (entry.fio2 > 0.5) blockers.push({ code: "FIO2", text: `FiO2 ${Math.round(entry.fio2 * 100)}% is above the 50% screening threshold.` });
  if (entry.peep > 8) blockers.push({ code: "PEEP", text: `PEEP ${entry.peep} cmH2O is above the 8 cmH2O screening threshold.` });
  if (entry.vasopressor) blockers.push({ code: "PRESSOR", text: "On vasopressor support — haemodynamic instability precedes a trial." });
  if (entry.gcs < 13) blockers.push({ code: "GCS", text: `GCS ${entry.gcs}: unable to protect the airway even if the trial succeeds.` });
  if (index != null && index > RSBI_THRESHOLD) blockers.push({ code: "RSBI", text: `RSBI ${index} exceeds ${RSBI_THRESHOLD} — small fast breaths are what a diaphragm looks like an hour before it fails.` });
  if (!entry.cuffLeak) blockers.push({ code: "CUFF", text: "No cuff leak: laryngeal oedema likely, and extubation into a swollen airway is a re-intubation." });
  if (entry.secretionsHeavy) blockers.push({ code: "SECRETIONS", text: "Heavy secretions — the trial may pass and the extubation still fail on clearance." });

  return { index, blockers, ready: blockers.length === 0 };
}

/** Circuit and HME hygiene clocks, both of which are infection-control rather than device faults. */
export function circuitFaults(unit) {
  const faults = [];
  if (unit.status === "In use" && unit.circuitHours > CIRCUIT_CHANGE_HOURS) {
    faults.push({ code: "CIRCUIT", tone: "red", text: `Circuit at ${unit.circuitHours} h, past the ${CIRCUIT_CHANGE_HOURS} h change interval.` });
  }
  if (unit.status === "In use" && unit.hmeHours > HME_CHANGE_HOURS) {
    faults.push({ code: "HME", tone: "amber", text: `HME filter at ${unit.hmeHours} h, past the ${HME_CHANGE_HOURS} h change interval.` });
  }
  if (unit.calibrationDueDays <= 0) {
    faults.push({ code: "CAL", tone: "red", text: `Flow and oxygen cell calibration ${Math.abs(unit.calibrationDueDays)} days overdue.` });
  } else if (unit.calibrationDueDays <= 14) {
    faults.push({ code: "CAL-SOON", tone: "amber", text: `Calibration due in ${unit.calibrationDueDays} days.` });
  }
  if (!unit.onMains && unit.batteryPct < 50) {
    faults.push({ code: "BATTERY", tone: "red", text: `On battery at ${unit.batteryPct}% and not on mains. A transport ventilator that runs out mid-transfer is a manual bag.` });
  }
  return faults;
}

/* ------------------------------------------------------------------ */
/*  Simulation                                                         */
/* ------------------------------------------------------------------ */

/**
 * Drifts the fleet the way a shift drifts it: circuits and HMEs age, cylinders empty at the flow
 * they are actually running, batteries discharge off mains, and plateau measurements go stale.
 */
function useFleetSimulation({ unitsRef, patientsRef, oxygenRef, toast }) {
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

      unitsRef.current = unitsRef.current.map((unit) => {
        if (unit.status !== "In use") return unit;
        return {
          ...unit,
          circuitHours: unit.circuitHours + step,
          hmeHours: unit.hmeHours + step,
          batteryPct: unit.onMains ? Math.min(100, unit.batteryPct + step) : Math.max(0, unit.batteryPct - step),
        };
      });

      patientsRef.current = patientsRef.current.map((record) =>
        record.plateauAgeMin == null ? record : { ...record, plateauAgeMin: record.plateauAgeMin + 15 * step }
      );

      oxygenRef.current = oxygenRef.current.map((asset) => {
        if (asset.kind !== "Cylinder" || asset.gaugeBar == null) return asset;
        const totalFlow = (asset.flowLpm || 0) + (asset.drivingGasLpm || 0);
        if (totalFlow <= 0) return asset;
        const capacity = CYLINDER_CAPACITY_L[asset.size] || 1;
        // Litres drawn over one simulated minute, converted back to a gauge pressure.
        const barDrop = (totalFlow * step) / capacity;
        const next = Math.max(0, Math.round((asset.gaugeBar - barDrop) * 10) / 10);
        if (asset.gaugeBar > CYLINDER_RESERVE_BAR && next <= CYLINDER_RESERVE_BAR) {
          toast(`${asset.id} has reached reserve pressure at ${asset.location}`, "High");
        }
        return { ...asset, gaugeBar: next };
      });

      setTick((t) => t + 1);
    }, 1600);

    return () => clearInterval(interval);
  }, [unitsRef, patientsRef, oxygenRef, toast]);

  return {
    running, setRunning, speed, setSpeed, tick,
    reset: () => {
      unitsRef.current = VENTILATORS.map((u) => ({ ...u }));
      patientsRef.current = VENT_PATIENTS.map((p) => ({ ...p }));
      oxygenRef.current = OXYGEN_ASSETS.map((o) => ({ ...o }));
      setTick(0);
      toast("Respiratory console reset to baseline", "Low");
    },
  };
}

/* ------------------------------------------------------------------ */
/*  Main page                                                          */
/* ------------------------------------------------------------------ */

export default function RespiratoryVentilatorFleetHub() {
  const [tab, setTab] = useState("fleet");
  const [modal, setModal] = useState(null);
  const [query, setQuery] = useState("");
  const [fleetFilter, setFleetFilter] = useState("All");
  const [protectionFilter, setProtectionFilter] = useState("All");
  const [oxygenFilter, setOxygenFilter] = useState("All");
  const [weaningFilter, setWeaningFilter] = useState("All");

  const [toasts, setToasts] = useState([]);
  const toast = useCallback((message, severity = "Low") => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((current) => [...current.slice(-4), { id, message, severity }]);
    setTimeout(() => setToasts((current) => current.filter((t) => t.id !== id)), 4200);
  }, []);

  const [units, setUnits] = useState(() => VENTILATORS.map((u) => ({ ...u })));
  const [patients, setPatients] = useState(() => VENT_PATIENTS.map((p) => ({ ...p })));
  const [oxygen, setOxygen] = useState(() => OXYGEN_ASSETS.map((o) => ({ ...o })));
  const [weaning, setWeaning] = useState(() => WEANING.map((w) => ({ ...w })));

  const unitsRef = useRef(units);
  const patientsRef = useRef(patients);
  const oxygenRef = useRef(oxygen);

  useEffect(() => { unitsRef.current = units; }, [units]);
  useEffect(() => { patientsRef.current = patients; }, [patients]);
  useEffect(() => { oxygenRef.current = oxygen; }, [oxygen]);

  const sim = useFleetSimulation({ unitsRef, patientsRef, oxygenRef, toast });

  useEffect(() => {
    setUnits([...unitsRef.current]);
    setPatients([...patientsRef.current]);
    setOxygen([...oxygenRef.current]);
  }, [sim.tick]);

  /* ---------- derived ---------- */

  const assessments = useMemo(
    () => patients.map((record) => ({ record, ...lungProtection(record) })),
    [patients]
  );

  const readiness = useMemo(
    () => weaning.map((entry) => ({ entry, ...sbtReadiness(entry) })),
    [weaning]
  );

  const stats = useMemo(() => {
    const breaches = assessments.filter((a) => a.evaluable && a.flags.some((f) => f.tone === "red")).length;
    const notGradeable = assessments.filter((a) => !a.evaluable && a.pbw == null).length;
    const circuitsOverdue = units.filter((u) => circuitFaults(u).some((f) => f.code === "CIRCUIT" || f.code === "CAL")).length;
    const cylindersShort = oxygen.filter((o) => {
      const minutes = cylinderMinutes(o);
      return minutes != null && minutes < 30;
    }).length;
    return { breaches, notGradeable, circuitsOverdue, cylindersShort };
  }, [assessments, units, oxygen]);

  const filteredUnits = useMemo(() => {
    const q = query.toLowerCase();
    return units.filter((unit) => {
      const matchesQuery = !q || [unit.id, unit.model, unit.vendor, unit.location, unit.class, unit.mode].some((f) => String(f).toLowerCase().includes(q));
      if (!matchesQuery) return false;
      if (fleetFilter === "All") return true;
      if (fleetFilter === "Faulted") return circuitFaults(unit).some((f) => f.tone === "red");
      if (fleetFilter === "Advisory") {
        const faults = circuitFaults(unit);
        return faults.length > 0 && !faults.some((f) => f.tone === "red");
      }
      return unit.class === fleetFilter;
    });
  }, [units, query, fleetFilter]);

  const filteredAssessments = useMemo(() => {
    const q = query.toLowerCase();
    return assessments.filter((entry) => {
      const { record } = entry;
      const matchesQuery = !q || [record.id, record.patient, record.bed, record.mode, record.diagnosis].some((f) => String(f).toLowerCase().includes(q));
      if (!matchesQuery) return false;
      if (protectionFilter === "All") return true;
      if (protectionFilter === "Breach") return entry.evaluable && entry.flags.some((f) => f.tone === "red");
      if (protectionFilter === "Advisory") return entry.evaluable && entry.flags.length > 0 && !entry.flags.some((f) => f.tone === "red");
      if (protectionFilter === "Not gradeable") return !entry.evaluable;
      return entry.evaluable && entry.flags.length === 0;
    });
  }, [assessments, query, protectionFilter]);

  const filteredOxygen = useMemo(() => {
    const q = query.toLowerCase();
    return oxygen.filter((asset) => {
      const matchesQuery = !q || [asset.id, asset.kind, asset.size, asset.location, asset.custodian].some((f) => String(f).toLowerCase().includes(q));
      if (!matchesQuery) return false;
      if (oxygenFilter === "All") return true;
      if (oxygenFilter === "Under 30 min") {
        const minutes = cylinderMinutes(asset);
        return minutes != null && minutes < 30;
      }
      return asset.kind === oxygenFilter;
    });
  }, [oxygen, query, oxygenFilter]);

  const filteredReadiness = useMemo(() => {
    const q = query.toLowerCase();
    return readiness.filter((entry) => {
      const matchesQuery = !q || [entry.entry.id, entry.entry.patient, entry.entry.bed].some((f) => String(f).toLowerCase().includes(q));
      if (!matchesQuery) return false;
      if (weaningFilter === "All") return true;
      if (weaningFilter === "Ready") return entry.ready;
      if (weaningFilter === "Blocked") return !entry.ready;
      return entry.entry.ventDays >= 7;
    });
  }, [readiness, query, weaningFilter]);

  /* ---------- actions ---------- */

  const changeCircuit = (id) => {
    setUnits((current) => current.map((u) => (u.id === id ? { ...u, circuitHours: 0, hmeHours: 0 } : u)));
    toast(`${id} circuit and HME changed — hygiene clocks restarted`, "Low");
  };

  const recordCalibration = (id) => {
    setUnits((current) => current.map((u) => (u.id === id ? { ...u, calibrationDueDays: 180 } : u)));
    toast(`${id} flow and O2 cell calibration recorded — next due in 180 days`, "Low");
  };

  const applyTarget = (recordId) => {
    setPatients((current) =>
      current.map((record) => {
        if (record.id !== recordId) return record;
        const pbw = predictedBodyWeight(record.sex, record.heightCm);
        if (pbw == null) return record;
        return { ...record, setVt: Math.round(TIDAL_VOLUME.target * pbw) };
      })
    );
    toast(`${recordId} tidal volume stepped to the 6 mL/kg predicted-weight target`, "Medium");
  };

  const repeatHold = (recordId) => {
    setPatients((current) => current.map((r) => (r.id === recordId ? { ...r, plateauAgeMin: 0 } : r)));
    toast(`${recordId} inspiratory hold repeated — plateau pressure is current`, "Low");
  };

  const swapCylinder = (assetId) => {
    setOxygen((current) => current.map((a) => (a.id === assetId ? { ...a, gaugeBar: CYLINDER_FILL_BAR, lastCheckedDays: 0 } : a)));
    toast(`${assetId} exchanged for a full cylinder`, "Medium");
  };

  const bookTrial = (entryId) => {
    setWeaning((current) => current.map((w) => (w.id === entryId ? { ...w, lastTrialOutcome: "Booked — next RT round" } : w)));
    toast(`${entryId} spontaneous breathing trial booked`, "Low");
  };

  const exportCsv = () => {
    const table =
      tab === "fleet"
        ? [
            ["ID", "Model", "Vendor", "Class", "Location", "Status", "Mode", "Circuit (h)", "HME (h)", "Calibration due (d)", "Battery %", "Faults"],
            ...filteredUnits.map((u) => [u.id, u.model, u.vendor, u.class, u.location, u.status, u.mode, u.circuitHours, u.hmeHours, u.calibrationDueDays, u.batteryPct, circuitFaults(u).map((f) => f.code).join(" ") || "none"]),
          ]
        : tab === "protection"
          ? [
              ["ID", "Patient", "Bed", "Mode", "Sex", "Height (cm)", "Actual wt (kg)", "PBW (kg)", "Set Vt (mL)", "Target Vt (mL)", "mL/kg PBW", "Pplat", "PEEP", "Driving", "Power (J/min)", "Verdict"],
              ...filteredAssessments.map((a) => [
                a.record.id, a.record.patient, a.record.bed, a.record.mode, a.record.sex,
                a.record.heightCm ?? "not recorded", a.record.actualWeightKg, a.pbw ?? "—",
                a.record.setVt ?? "—", a.targetMl ?? "—", a.perKg ?? "—",
                a.record.pplat ?? "—", a.record.peep ?? "—",
                drivingPressure(a.record) ?? "—", mechanicalPower(a.record) ?? "—",
                a.evaluable ? (a.flags.length === 0 ? "Within protocol" : a.flags.map((f) => f.code).join(" ")) : "Not gradeable",
              ]),
            ]
          : tab === "oxygen"
            ? [
                ["ID", "Kind", "Size", "Location", "Custodian", "Gauge (bar)", "Fill %", "Delivery (L/min)", "Driving gas (L/min)", "Minutes remaining"],
                ...filteredOxygen.map((o) => [o.id, o.kind, o.size, o.location, o.custodian, o.gaugeBar ?? "—", cylinderFillPct(o) ?? "—", o.flowLpm, o.drivingGasLpm, cylinderMinutes(o) ?? "—"]),
              ]
            : [
                ["ID", "Patient", "Bed", "Vent days", "Rate", "Spont Vt (mL)", "RSBI", "FiO2", "PEEP", "GCS", "Ready", "Blockers"],
                ...filteredReadiness.map((r) => [
                  r.entry.id, r.entry.patient, r.entry.bed, r.entry.ventDays, r.entry.rate, r.entry.spontaneousVtMl,
                  r.index ?? "—", r.entry.fio2, r.entry.peep, r.entry.gcs, r.ready ? "yes" : "no",
                  r.blockers.map((b) => b.code).join(" ") || "none",
                ]),
              ];

    downloadCsv(`respiratory-${tab}.csv`, table);
    toast("CSV export downloaded", "Low");
  };

  const tabs = [
    { id: "fleet", label: "Ventilator Fleet", icon: Wind },
    { id: "protection", label: "Lung Protection", icon: Calculator },
    { id: "oxygen", label: "Oxygen Logistics", icon: Cylinder },
    { id: "weaning", label: "Weaning & SBT", icon: Timer },
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
              <Wind size={24} className="text-emerald-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-100">Respiratory Therapy &amp; Ventilator Fleet Hub</h1>
              <p className="mt-0.5 text-xs text-slate-400">
                Fleet hygiene · ARDSNet lung protection · transport oxygen · weaning — ISO 80601-2-12, HTM 02-01
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
          <StatCard icon={Siren} label="Protocol Breaches" value={stats.breaches} sub="volume, plateau or driving pressure" accent={stats.breaches > 0 ? "text-red-400" : "text-emerald-400"} />
          <StatCard icon={Info} label="No Recorded Height" value={stats.notGradeable} sub="predicted weight not derivable" accent={stats.notGradeable > 0 ? "text-amber-400" : "text-emerald-400"} />
          <StatCard icon={Gauge} label="Units Out of Spec" value={stats.circuitsOverdue} sub={`${units.length}-unit ventilator fleet`} accent={stats.circuitsOverdue > 0 ? "text-red-400" : "text-emerald-400"} />
          <StatCard icon={Cylinder} label="Cylinders Under 30 min" value={stats.cylindersShort} sub="at the flow they are running" accent={stats.cylindersShort > 0 ? "text-amber-400" : "text-emerald-400"} />
        </div>

        <TabsBar tabs={tabs} active={tab} onChange={setTab} />

        {/* toolbar */}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <CompactSearch value={query} onChange={setQuery} placeholder="Search units, patients, beds, cylinders…" />
          {tab === "fleet" && <FilterChips options={["All", "Faulted", "Advisory", "Invasive", "Transport", "HFNC"]} value={fleetFilter} onChange={setFleetFilter} />}
          {tab === "protection" && <FilterChips options={["All", "Breach", "Advisory", "Not gradeable", "Within protocol"]} value={protectionFilter} onChange={setProtectionFilter} />}
          {tab === "oxygen" && <FilterChips options={["All", "Under 30 min", "Cylinder", "Concentrator"]} value={oxygenFilter} onChange={setOxygenFilter} />}
          {tab === "weaning" && <FilterChips options={["All", "Ready", "Blocked", "Prolonged"]} value={weaningFilter} onChange={setWeaningFilter} />}
        </div>
      </header>

      <main className="px-6 py-6">
        {/* ============================= VENTILATOR FLEET ============================= */}
        {tab === "fleet" && (
          <section>
            {filteredUnits.length === 0 ? (
              <EmptyState icon={Wind} message="No ventilators match the current filters." />
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {filteredUnits.map((unit) => {
                  const faults = circuitFaults(unit);
                  const down = faults.some((f) => f.tone === "red");
                  const circuitPct = Math.min(100, (unit.circuitHours / CIRCUIT_CHANGE_HOURS) * 100);
                  return (
                    <article key={unit.id} className={`rounded-2xl border bg-slate-900/70 p-4 ${down ? "border-red-500/40" : "border-slate-800"}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <button onClick={() => setModal({ kind: "unit", data: unit })} className="font-mono text-xs font-semibold text-emerald-300 hover:underline">
                            {unit.id}
                          </button>
                          <p className="text-xs text-slate-200">{unit.model}</p>
                          <p className="text-[11px] text-slate-500">{unit.vendor} · {unit.class} · {unit.location}</p>
                        </div>
                        <ToneBadge tone={down ? "red" : faults.length > 0 ? "amber" : "green"}>
                          {down ? "Out of spec" : faults.length > 0 ? "Advisory" : unit.status}
                        </ToneBadge>
                      </div>

                      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                        <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-2">
                          <p className="text-[10px] uppercase tracking-wide text-slate-500">Mode</p>
                          <p className="text-sm font-bold text-slate-100">{unit.mode}</p>
                        </div>
                        <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-2">
                          <p className="text-[10px] uppercase tracking-wide text-slate-500">Run hours</p>
                          <p className="text-sm font-bold text-slate-100">{unit.hoursRun.toLocaleString()}</p>
                        </div>
                        <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-2">
                          <p className="text-[10px] uppercase tracking-wide text-slate-500">Battery</p>
                          <p className={`text-sm font-bold ${!unit.onMains && unit.batteryPct < 50 ? "text-red-300" : "text-slate-100"}`}>{unit.batteryPct}%</p>
                        </div>
                      </div>

                      <div className="mt-3">
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span>Circuit age</span>
                          <span>{unit.circuitHours} / {CIRCUIT_CHANGE_HOURS} h</span>
                        </div>
                        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                          <div className={`h-full rounded-full ${circuitPct >= 100 ? "bg-red-400" : "bg-emerald-400"}`} style={{ width: `${circuitPct}%` }} />
                        </div>
                      </div>

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
                        <button onClick={() => changeCircuit(unit.id)} className="flex-1 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-2 py-1.5 text-[11px] font-semibold text-emerald-300 hover:bg-emerald-500/20">
                          Change circuit
                        </button>
                        <button onClick={() => recordCalibration(unit.id)} className="flex-1 rounded-md border border-slate-700 bg-slate-800/60 px-2 py-1.5 text-[11px] font-semibold text-slate-300 hover:bg-slate-800">
                          Record calibration
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* ============================= LUNG PROTECTION ============================= */}
        {tab === "protection" && (
          <section>
            <div className="mb-4 rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
              <p className="flex items-start gap-2 text-[11px] leading-relaxed text-slate-400">
                <Info size={14} className="mt-0.5 shrink-0 text-sky-400" />
                <span>
                  Every target below is recalculated from <strong className="text-slate-300">predicted</strong> body weight — height and
                  sex only — and never read back from the ventilator. Actual body weight is shown beside it precisely because it is the
                  number that must not be used: an obese patient of {VENT_PATIENTS[5].heightCm} cm has the lungs of the{" "}
                  {predictedBodyWeight("M", VENT_PATIENTS[5].heightCm)} kg person their height predicts, not of the{" "}
                  {VENT_PATIENTS[5].actualWeightKg} kg they weigh. A patient with no recorded height gets no target at all.
                </span>
              </p>
            </div>

            {filteredAssessments.length === 0 ? (
              <EmptyState icon={Calculator} message="No ventilated patients match the current filters." />
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {filteredAssessments.map((entry) => {
                  const { record, evaluable, refusal, pbw, targetMl, perKg, flags } = entry;
                  const breach = flags.some((f) => f.tone === "red");
                  const dp = drivingPressure(record);
                  return (
                    <article
                      key={record.id}
                      className={`rounded-2xl border bg-slate-900/70 p-4 ${breach ? "border-red-500/40" : !evaluable ? "border-slate-700" : flags.length > 0 ? "border-amber-500/40" : "border-slate-800"}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <button onClick={() => setModal({ kind: "protection", data: entry })} className="font-mono text-xs font-semibold text-emerald-300 hover:underline">
                            {record.id}
                          </button>
                          <p className="mt-0.5 truncate text-sm font-semibold text-slate-100">{record.patient}</p>
                          <p className="text-[11px] text-slate-500">{record.bed} · {record.mode} · {record.diagnosis}</p>
                        </div>
                        <ToneBadge tone={breach ? "red" : !evaluable ? "slate" : flags.length > 0 ? "amber" : "green"}>
                          {breach ? "Breach" : !evaluable ? "Not gradeable" : flags.length > 0 ? "Advisory" : "Within protocol"}
                        </ToneBadge>
                      </div>

                      <div className="mt-3 grid grid-cols-4 gap-2 text-center">
                        <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-2">
                          <p className="text-[10px] uppercase tracking-wide text-slate-500">Actual wt</p>
                          <p className="text-sm font-bold text-slate-500 line-through">{record.actualWeightKg}</p>
                        </div>
                        <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-2">
                          <p className="text-[10px] uppercase tracking-wide text-slate-500">PBW</p>
                          <p className="text-sm font-bold text-slate-100">{pbw ?? "—"}</p>
                        </div>
                        <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-2">
                          <p className="text-[10px] uppercase tracking-wide text-slate-500">Set Vt</p>
                          <p className="text-sm font-bold text-slate-100">{record.setVt ?? "—"}</p>
                        </div>
                        <div className={`rounded-lg border p-2 ${evaluable && !breach ? "border-emerald-500/30 bg-emerald-500/5" : "border-amber-500/30 bg-amber-500/5"}`}>
                          <p className="text-[10px] uppercase tracking-wide text-slate-500">mL/kg</p>
                          <p className={`text-sm font-bold ${breach ? "text-red-300" : evaluable ? "text-emerald-300" : "text-slate-500"}`}>{perKg ?? "—"}</p>
                        </div>
                      </div>

                      {evaluable && (
                        <p className="mt-3 text-[11px] text-slate-500">
                          Target {targetMl} mL at {TIDAL_VOLUME.target} mL/kg · plateau {record.pplat ?? "—"} · PEEP {record.peep ?? "—"} ·
                          driving {dp ?? "stale"} · power {mechanicalPower(record) ?? "—"} J/min
                        </p>
                      )}

                      {!evaluable && (
                        <p className="mt-3 rounded-lg border border-sky-500/30 bg-sky-500/5 p-2.5 text-[11px] leading-relaxed text-sky-200">
                          {refusal}
                        </p>
                      )}

                      {flags.length > 0 && (
                        <ul className="mt-3 space-y-2">
                          {flags.map((flag) => (
                            <li
                              key={flag.code}
                              className={`rounded-lg border p-2.5 text-[11px] leading-relaxed ${
                                flag.tone === "red" ? "border-red-500/30 bg-red-500/5 text-red-200" : "border-amber-500/30 bg-amber-500/5 text-amber-200"
                              }`}
                            >
                              {flag.text}
                            </li>
                          ))}
                        </ul>
                      )}

                      {evaluable && (
                        <div className="mt-3 flex gap-2">
                          <button onClick={() => applyTarget(record.id)} className="flex-1 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-2 py-1.5 text-[11px] font-semibold text-emerald-300 hover:bg-emerald-500/20">
                            Step to {targetMl} mL
                          </button>
                          <button onClick={() => repeatHold(record.id)} className="flex-1 rounded-md border border-slate-700 bg-slate-800/60 px-2 py-1.5 text-[11px] font-semibold text-slate-300 hover:bg-slate-800">
                            Repeat hold
                          </button>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* ============================= OXYGEN LOGISTICS ============================= */}
        {tab === "oxygen" && (
          <section>
            {filteredOxygen.length === 0 ? (
              <EmptyState icon={Cylinder} message="No oxygen assets match the current filters." />
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/70">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-500">
                      <th className="px-4 py-3">Asset</th>
                      <th className="px-4 py-3">Location</th>
                      <th className="px-4 py-3">Contents</th>
                      <th className="px-4 py-3">Flow</th>
                      <th className="px-4 py-3">Remaining</th>
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOxygen.map((asset) => {
                      const minutes = cylinderMinutes(asset);
                      const fill = cylinderFillPct(asset);
                      const critical = minutes != null && minutes < 30;
                      return (
                        <tr key={asset.id} className="border-b border-slate-800/60 last:border-0 hover:bg-slate-800/30">
                          <td className="px-4 py-3">
                            <button onClick={() => setModal({ kind: "oxygen", data: asset })} className="font-mono text-xs font-semibold text-emerald-300 hover:underline">
                              {asset.id}
                            </button>
                            <p className="text-[11px] text-slate-500">{asset.kind}{asset.size !== "—" ? ` · size ${asset.size}` : ""}</p>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-xs text-slate-300">{asset.location}</p>
                            <p className="text-[11px] text-slate-500">{asset.custodian}</p>
                          </td>
                          <td className="px-4 py-3">
                            {asset.kind === "Cylinder" ? (
                              <>
                                <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-800">
                                  <div className={`h-full rounded-full ${critical ? "bg-red-400" : "bg-emerald-400"}`} style={{ width: `${fill}%` }} />
                                </div>
                                <p className="mt-1 text-[11px] text-slate-500">{asset.gaugeBar} bar · {fill}%</p>
                              </>
                            ) : (
                              <p className={`text-xs font-semibold ${asset.purityPct < 90 ? "text-amber-300" : "text-slate-200"}`}>
                                {asset.purityPct}% O2
                              </p>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-xs text-slate-200">{asset.flowLpm} L/min</p>
                            {asset.drivingGasLpm > 0 && <p className="text-[11px] text-amber-300">+{asset.drivingGasLpm} driving gas</p>}
                          </td>
                          <td className="px-4 py-3">
                            {minutes == null ? (
                              <span className="text-xs text-slate-500">—</span>
                            ) : (
                              <span className={`text-sm font-bold ${critical ? "text-red-300" : "text-slate-100"}`}>
                                {minutes} min
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {asset.kind === "Cylinder" && (
                              <button onClick={() => swapCylinder(asset.id)} className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-2 py-1 text-[11px] font-semibold text-emerald-300 hover:bg-emerald-500/20">
                                Exchange
                              </button>
                            )}
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

        {/* ============================= WEANING & SBT ============================= */}
        {tab === "weaning" && (
          <section>
            {filteredReadiness.length === 0 ? (
              <EmptyState icon={Timer} message="No weaning candidates match the current filters." />
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {filteredReadiness.map((assessment) => {
                  const { entry, index, blockers, ready } = assessment;
                  return (
                    <article key={entry.id} className={`rounded-2xl border bg-slate-900/70 p-4 ${ready ? "border-emerald-500/40" : "border-slate-800"}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <button onClick={() => setModal({ kind: "weaning", data: assessment })} className="font-mono text-xs font-semibold text-emerald-300 hover:underline">
                            {entry.id}
                          </button>
                          <p className="mt-0.5 truncate text-sm font-semibold text-slate-100">{entry.patient}</p>
                          <p className="text-[11px] text-slate-500">{entry.bed} · day {entry.ventDays} · {entry.lastTrialOutcome}</p>
                        </div>
                        <ToneBadge tone={ready ? "green" : "amber"}>
                          {ready ? "Trial ready" : `${blockers.length} blocker${blockers.length === 1 ? "" : "s"}`}
                        </ToneBadge>
                      </div>

                      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                        <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-2">
                          <p className="text-[10px] uppercase tracking-wide text-slate-500">RSBI</p>
                          <p className={`text-sm font-bold ${index != null && index > RSBI_THRESHOLD ? "text-amber-300" : "text-slate-100"}`}>{index ?? "—"}</p>
                        </div>
                        <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-2">
                          <p className="text-[10px] uppercase tracking-wide text-slate-500">FiO2</p>
                          <p className="text-sm font-bold text-slate-100">{Math.round(entry.fio2 * 100)}%</p>
                        </div>
                        <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-2">
                          <p className="text-[10px] uppercase tracking-wide text-slate-500">PEEP</p>
                          <p className="text-sm font-bold text-slate-100">{entry.peep}</p>
                        </div>
                      </div>

                      {blockers.length > 0 ? (
                        <ul className="mt-3 space-y-2">
                          {blockers.map((blocker) => (
                            <li key={blocker.code} className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-2.5 text-[11px] leading-relaxed text-amber-200">
                              {blocker.text}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-2.5 text-[11px] leading-relaxed text-emerald-200">
                          Every screening criterion met: oxygenation, PEEP, haemodynamics, conscious level, RSBI {index} and a cuff leak.
                          Book the trial.
                        </p>
                      )}

                      <button onClick={() => bookTrial(entry.id)} className="mt-3 w-full rounded-md border border-emerald-500/40 bg-emerald-500/10 px-2 py-1.5 text-[11px] font-semibold text-emerald-300 hover:bg-emerald-500/20">
                        Book breathing trial
                      </button>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        )}
      </main>

      {/* ============================= INSPECTION MODALS ============================= */}
      {modal && modal.kind === "unit" && (
        <Modal title={modal.data.model} subtitle={`${modal.data.id} · ${modal.data.vendor} · ${modal.data.class}`} onClose={() => setModal(null)}>
          <Row label="Location" value={modal.data.location} />
          <Row label="Status" value={modal.data.status} />
          <Row label="Mode" value={modal.data.mode} />
          <Row label="Run hours" value={modal.data.hoursRun.toLocaleString()} />
          <Row label="Circuit age" value={`${modal.data.circuitHours} h of ${CIRCUIT_CHANGE_HOURS} h`} accent={modal.data.circuitHours > CIRCUIT_CHANGE_HOURS ? "text-red-300" : undefined} />
          <Row label="HME age" value={`${modal.data.hmeHours} h of ${HME_CHANGE_HOURS} h`} accent={modal.data.hmeHours > HME_CHANGE_HOURS ? "text-amber-300" : undefined} />
          <Row label="Calibration" value={modal.data.calibrationDueDays <= 0 ? `${Math.abs(modal.data.calibrationDueDays)} days overdue` : `due in ${modal.data.calibrationDueDays} days`} accent={modal.data.calibrationDueDays <= 0 ? "text-red-300" : undefined} />
          <Row label="Power" value={modal.data.onMains ? `Mains · battery ${modal.data.batteryPct}%` : `Battery only · ${modal.data.batteryPct}%`} accent={!modal.data.onMains && modal.data.batteryPct < 50 ? "text-red-300" : undefined} />
          <p className="mt-3 rounded-lg border border-slate-800 bg-slate-950/60 p-3 text-[11px] leading-relaxed text-slate-400">
            The circuit and HME clocks are infection control rather than device faults, which is why they are tracked here and not on the
            maintenance schedule: nothing on the ventilator degrades when a circuit is left on past its interval, and the patient at the
            other end of it acquires a pneumonia.
          </p>
        </Modal>
      )}

      {modal && modal.kind === "protection" && (
        <Modal
          title={modal.data.record.patient}
          subtitle={`${modal.data.record.id} · ${modal.data.record.bed} · ${modal.data.record.mode}`}
          onClose={() => setModal(null)}
        >
          <Row label="Sex" value={modal.data.record.sex === "F" ? "Female" : "Male"} />
          <Row label="Height" value={modal.data.record.heightCm == null ? "not recorded" : `${modal.data.record.heightCm} cm`} accent={modal.data.record.heightCm == null ? "text-amber-300" : undefined} />
          <Row label="Actual body weight" value={`${modal.data.record.actualWeightKg} kg — not used`} />
          <Row label="Predicted body weight" value={modal.data.pbw == null ? "not derivable" : `${modal.data.pbw} kg`} accent={modal.data.pbw == null ? "text-amber-300" : "text-emerald-300"} />
          <Row label="Set tidal volume" value={modal.data.record.setVt == null ? "—" : `${modal.data.record.setVt} mL`} />
          <Row label="Protocol target" value={modal.data.targetMl == null ? "not applied" : `${modal.data.targetMl} mL`} />
          <Row label="Delivered per kg PBW" value={modal.data.perKg == null ? "—" : `${modal.data.perKg} mL/kg`} accent={modal.data.perKg != null && modal.data.perKg > TIDAL_VOLUME.max ? "text-red-300" : undefined} />
          <Row label="Plateau pressure" value={modal.data.record.pplat == null ? "not measured" : `${modal.data.record.pplat} cmH2O`} />
          <Row label="Plateau measured" value={modal.data.record.plateauAgeMin == null ? "no timestamp" : `${modal.data.record.plateauAgeMin} min ago`} accent={modal.data.record.plateauAgeMin != null && modal.data.record.plateauAgeMin > PLATEAU_STALE_MINUTES ? "text-amber-300" : undefined} />
          <Row label="Driving pressure" value={drivingPressure(modal.data.record) == null ? "not derived" : `${drivingPressure(modal.data.record)} cmH2O`} />
          <Row label="Mechanical power" value={mechanicalPower(modal.data.record) == null ? "not derived" : `${mechanicalPower(modal.data.record)} J/min`} />

          {modal.data.pbw != null && modal.data.evaluable ? (
            <p className="mt-3 rounded-lg border border-slate-800 bg-slate-950/60 p-3 text-[11px] leading-relaxed text-slate-400">
              Predicted body weight is {modal.data.record.sex === "F" ? "45.5" : "50.0"} + 0.91 × ({modal.data.record.heightCm} − 152.4) ={" "}
              {modal.data.pbw} kg, so the {TIDAL_VOLUME.target} mL/kg target is {modal.data.targetMl} mL. The ventilator is set to{" "}
              {modal.data.record.setVt} mL, which is {modal.data.perKg} mL/kg of predicted weight — and {Math.round((modal.data.record.setVt / modal.data.record.actualWeightKg) * 100) / 100} mL/kg
              of the {modal.data.record.actualWeightKg} kg the patient actually weighs. Those two figures are the reason the check exists.
            </p>
          ) : (
            <p className="mt-3 rounded-lg border border-sky-500/30 bg-sky-500/5 p-3 text-[11px] leading-relaxed text-sky-200">
              {modal.data.refusal}
            </p>
          )}
        </Modal>
      )}

      {modal && modal.kind === "oxygen" && (
        <Modal title={modal.data.id} subtitle={`${modal.data.kind}${modal.data.size !== "—" ? ` · size ${modal.data.size}` : ""} · ${modal.data.location}`} onClose={() => setModal(null)}>
          <Row label="Custodian" value={modal.data.custodian} />
          <Row label="Last checked" value={modal.data.lastCheckedDays === 0 ? "today" : `${modal.data.lastCheckedDays} days ago`} />
          {modal.data.kind === "Cylinder" ? (
            <>
              <Row label="Water capacity" value={`${CYLINDER_CAPACITY_L[modal.data.size]} L`} />
              <Row label="Gauge" value={`${modal.data.gaugeBar} bar of ${CYLINDER_FILL_BAR}`} />
              <Row label="Reserve held back" value={`${CYLINDER_RESERVE_BAR} bar`} />
              <Row label="Delivery flow" value={`${modal.data.flowLpm} L/min`} />
              <Row label="Driving gas" value={modal.data.drivingGasLpm > 0 ? `${modal.data.drivingGasLpm} L/min` : "none"} />
              <Row label="Time remaining" value={cylinderMinutes(modal.data) == null ? "—" : `${cylinderMinutes(modal.data)} min`} accent={(cylinderMinutes(modal.data) ?? 999) < 30 ? "text-red-300" : undefined} />
              <p className="mt-3 rounded-lg border border-slate-800 bg-slate-950/60 p-3 text-[11px] leading-relaxed text-slate-400">
                ({modal.data.gaugeBar} − {CYLINDER_RESERVE_BAR}) bar × {CYLINDER_CAPACITY_L[modal.data.size]} L ÷{" "}
                {(modal.data.flowLpm || 0) + (modal.data.drivingGasLpm || 0)} L/min. Both subtractions are the ones left out of the
                arithmetic done at the bedside, and both shorten the answer: a gauge reading "half" is 340 litres on a CD and 1360 on a J,
                and a transport ventilator draws its driving gas from the same cylinder as the patient.
              </p>
            </>
          ) : (
            <>
              <Row label="Output flow" value={`${modal.data.flowLpm} L/min`} />
              <Row label="Oxygen purity" value={`${modal.data.purityPct}%`} accent={modal.data.purityPct < 90 ? "text-amber-300" : undefined} />
              <p className="mt-3 rounded-lg border border-slate-800 bg-slate-950/60 p-3 text-[11px] leading-relaxed text-slate-400">
                A concentrator below 90% is still delivering gas and still reads as running. The sieve beds have degraded, the fraction
                delivered has fallen, and nothing at the bedside distinguishes that from a patient who has deteriorated.
              </p>
            </>
          )}
        </Modal>
      )}

      {modal && modal.kind === "weaning" && (
        <Modal title={modal.data.entry.patient} subtitle={`${modal.data.entry.id} · ${modal.data.entry.bed}`} onClose={() => setModal(null)}>
          <Row label="Days ventilated" value={modal.data.entry.ventDays} />
          <Row label="Respiratory rate" value={`${modal.data.entry.rate} /min`} />
          <Row label="Spontaneous tidal volume" value={`${modal.data.entry.spontaneousVtMl} mL`} />
          <Row label="RSBI" value={modal.data.index == null ? "—" : `${modal.data.index} breaths/min/L`} accent={modal.data.index != null && modal.data.index > RSBI_THRESHOLD ? "text-amber-300" : undefined} />
          <Row label="FiO2" value={`${Math.round(modal.data.entry.fio2 * 100)}%`} />
          <Row label="PEEP" value={`${modal.data.entry.peep} cmH2O`} />
          <Row label="GCS" value={modal.data.entry.gcs} />
          <Row label="Vasopressor" value={modal.data.entry.vasopressor ? "yes" : "no"} />
          <Row label="Cuff leak" value={modal.data.entry.cuffLeak ? "present" : "absent"} accent={modal.data.entry.cuffLeak ? undefined : "text-amber-300"} />
          <Row label="Last trial" value={modal.data.entry.lastTrialOutcome} />
          <p className="mt-3 rounded-lg border border-slate-800 bg-slate-950/60 p-3 text-[11px] leading-relaxed text-slate-400">
            RSBI is rate divided by tidal volume <em>in litres</em>, so {modal.data.entry.rate} ÷ {modal.data.entry.spontaneousVtMl / 1000} ={" "}
            {modal.data.index}. Every criterion is listed rather than the first failing one, because "not ready" is an instruction to do
            nothing whereas a list of blockers is a list of things to work on.
          </p>
        </Modal>
      )}

      {/* footer strip */}
      <footer className="mt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 px-6 py-4 text-[11px] text-slate-500">
        <span className="inline-flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${sim.running ? "bg-emerald-400" : "bg-amber-400"}`} />
          {sim.running ? `Live simulation at ${sim.speed}× · tick #${sim.tick}` : "Simulation paused"}
        </span>
        <span className="hidden md:inline">ARDSNet low tidal volume · ISO 80601-2-12 · HTM 02-01 cylinder handling</span>
        <span className="inline-flex items-center gap-1.5">
          <Activity size={12} /> {units.length} ventilators · {patients.length} ventilated · {oxygen.length} O2 assets · {weaning.length} weaning
        </span>
      </footer>
    </div>
  );
}
