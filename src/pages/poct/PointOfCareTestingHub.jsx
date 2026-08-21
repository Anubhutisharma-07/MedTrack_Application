import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle, Beaker, CheckCircle2, ClipboardCheck, FileText, Info, Package,
  Pause, Play, RefreshCw, ShieldAlert, Sigma, TestTube2, UserCheck, Wifi, WifiOff,
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
 *  MedTrack Point-of-Care Testing Governance Hub
 *  ------------------------------------------------------------------
 *  MedTrack's lab automation console tracks the analysers in the
 *  laboratory. Roughly a third of the results a hospital acts on are
 *  not produced there.
 *
 *  POCT is the estate's largest device fleet by unit count and its
 *  least governed by a wide margin, and it differs from laboratory
 *  analysers in three ways that all point the same direction:
 *
 *    - it is operated by people whose job is not testing. A nurse
 *      running a blood gas at 3am is not a biomedical scientist, has
 *      not been trained on the failure modes, and has a patient to get
 *      back to;
 *    - there is no report to review. A laboratory result passes a
 *      scientist who notices when a sodium is impossible; a POCT result
 *      appears at the bedside and is acted on in seconds;
 *    - the devices are bought by clinical departments rather than by
 *      the lab, which is why nobody has a list of them.
 *
 *  The failure mode is not that a meter breaks. It is that a meter
 *  drifts, keeps returning results, and every one of them is believed.
 *
 *    1. Device Fleet  - every device, custodian, connectivity, lot.
 *    2. Quality Control - Westgard multirules, evaluated from the raw
 *                         series rather than read from the analyser.
 *    3. Operator Competency - who may run what, and the results already
 *                             produced by operators who had lapsed.
 *    4. Consumables    - strip, cartridge and reagent lots.
 *
 *  See evaluateWestgard() for the rules, and for the three states in
 *  which a rule reports "not evaluable" rather than "pass" - which is
 *  the most dangerous cell on the page to get wrong.
 * ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/*  Quality control constants                                          */
/* ------------------------------------------------------------------ */

/**
 * The Westgard multirule set, with what each rule needs and what it means when it fires.
 *
 * `requires` is the number of consecutive points the rule consumes, and it is the field that makes
 * the "not evaluable" state possible: 10-x cannot be assessed on six points, and reporting it as
 * passed when it was never run is the most dangerous cell on the page.
 *
 * The reject/warn split is the whole design. A POCT analyser's own acceptance range is a 1-2s check
 * at best, which has a false rejection rate around 5% on a two-level daily run and almost no power
 * to detect the small systematic shift that is the failure mode that actually matters. A console
 * that treats 1-2s as a failure trains its users to override failures, and an override habit is
 * what turns a real 2-2s into another dismissed pop-up.
 */
export const WESTGARD_RULES = [
  { code: "1-3s", requires: 1, action: "reject", error: "random", description: "A single point beyond 3 SD." },
  { code: "2-2s", requires: 2, action: "reject", error: "systematic", description: "Two consecutive points beyond 2 SD on the same side." },
  { code: "R-4s", requires: 2, action: "reject", error: "random", description: "Two points within the run spanning 4 SD, on opposite sides." },
  { code: "4-1s", requires: 4, action: "warn", error: "systematic", description: "Four consecutive points beyond 1 SD on the same side." },
  { code: "10-x", requires: 10, action: "warn", error: "shift", description: "Ten consecutive points on the same side of the mean." },
  { code: "1-2s", requires: 1, action: "warn", error: "none", description: "A single point beyond 2 SD. A warning only — never a rejection on its own." },
];

/** Competency lapses after this long without reassessment, per CLIA and ISO 22870 practice. */
const COMPETENCY_INTERVAL_DAYS = 365;

/** A device that has not uploaded for this long has effectively left the governed estate. */
const CONNECTIVITY_STALE_HOURS = 24;

/* ------------------------------------------------------------------ */
/*  Seed data                                                          */
/* ------------------------------------------------------------------ */

const DEVICES = [
  { id: "POCT-GLU-0412", model: "StatStrip Glucose", vendor: "Nova", assay: "Glucose", location: "Ward 12", custodian: "Ward 12", firmware: "4.2.1", lotId: "LOT-GLU-88", connected: true, lastUploadHours: 1, resultsToday: 44 },
  { id: "POCT-GLU-0418", model: "StatStrip Glucose", vendor: "Nova", assay: "Glucose", location: "Ward 9", custodian: "Ward 9", firmware: "4.2.1", lotId: "LOT-GLU-88", connected: true, lastUploadHours: 2, resultsToday: 31 },
  { id: "POCT-GLU-0423", model: "Accu-Chek Inform II", vendor: "Roche", assay: "Glucose", location: "Maternity", custodian: "Maternity", firmware: "3.9.0", lotId: "LOT-GLU-91", connected: false, lastUploadHours: 190, resultsToday: 18 },
  { id: "POCT-BG-1101", model: "ABL90 FLEX", vendor: "Radiometer", assay: "Blood gas", location: "ICU", custodian: "ICU", firmware: "6.1.4", lotId: "LOT-BG-22", connected: true, lastUploadHours: 0, resultsToday: 61 },
  { id: "POCT-BG-1104", model: "ABL90 FLEX", vendor: "Radiometer", assay: "Blood gas", location: "ED resus", custodian: "ED", firmware: "6.1.4", lotId: "LOT-BG-22", connected: true, lastUploadHours: 0, resultsToday: 39 },
  { id: "POCT-BG-1109", model: "epoc Blood Analysis", vendor: "Siemens", assay: "Blood gas", location: "Theatre 4", custodian: "Theatres", firmware: "5.4.2", lotId: "LOT-BG-25", connected: true, lastUploadHours: 6, resultsToday: 12 },
  { id: "POCT-COA-2201", model: "CoaguChek Pro II", vendor: "Roche", assay: "Coagulation", location: "Anticoag clinic", custodian: "Haematology", firmware: "2.8.0", lotId: "LOT-COA-07", connected: true, lastUploadHours: 3, resultsToday: 27 },
  { id: "POCT-COA-2205", model: "Hemochron Signature", vendor: "Werfen", assay: "Coagulation", location: "Cath lab", custodian: "Cardiology", firmware: "1.7.3", lotId: "LOT-COA-09", connected: false, lastUploadHours: 412, resultsToday: 9 },
  { id: "POCT-URI-3301", model: "Clinitek Status", vendor: "Siemens", assay: "Urinalysis", location: "Outpatients", custodian: "Outpatients", firmware: "3.1.0", lotId: "LOT-URI-14", connected: true, lastUploadHours: 5, resultsToday: 22 },
  { id: "POCT-MOL-4401", model: "GeneXpert IV", vendor: "Cepheid", assay: "Molecular", location: "ED", custodian: "Microbiology", firmware: "6.3.0", lotId: "LOT-MOL-03", connected: true, lastUploadHours: 1, resultsToday: 14 },
  { id: "POCT-HB-5501", model: "HemoCue Hb 801", vendor: "HemoCue", assay: "Haemoglobin", location: "Day surgery", custodian: "Day surgery", firmware: "1.2.0", lotId: "LOT-HB-31", connected: false, lastUploadHours: 60, resultsToday: 16 },
  { id: "POCT-KET-6601", model: "StatStrip Ketone", vendor: "Nova", assay: "Ketone", location: "ED majors", custodian: "ED", firmware: "4.2.1", lotId: "LOT-KET-05", connected: true, lastUploadHours: 2, resultsToday: 8 },
];

/**
 * QC series, most recent point last.
 *
 * Each entry carries the lot it was run on, which is what makes the lot-boundary refusal possible:
 * consecutive-point rules assume one measurement system, and a series that spans a lot change
 * manufactures a shift that is real in the data and meaningless clinically — while hiding a genuine
 * one behind it.
 *
 * QC-0006 deliberately has no assigned mean and SD; QC-0007 deliberately has only six points.
 */
const QC_SERIES = [
  {
    id: "QC-0001", deviceId: "POCT-GLU-0412", analyte: "Glucose", level: "Level 1", mean: 5.4, sd: 0.18, unit: "mmol/L",
    points: [
      { value: 5.42, lot: "LOT-GLU-88" }, { value: 5.37, lot: "LOT-GLU-88" }, { value: 5.45, lot: "LOT-GLU-88" },
      { value: 5.39, lot: "LOT-GLU-88" }, { value: 5.44, lot: "LOT-GLU-88" }, { value: 5.36, lot: "LOT-GLU-88" },
      { value: 5.41, lot: "LOT-GLU-88" }, { value: 5.43, lot: "LOT-GLU-88" }, { value: 5.38, lot: "LOT-GLU-88" },
      { value: 5.40, lot: "LOT-GLU-88" },
    ],
  },
  {
    id: "QC-0002", deviceId: "POCT-GLU-0418", analyte: "Glucose", level: "Level 2", mean: 14.8, sd: 0.42, unit: "mmol/L",
    points: [
      { value: 14.71, lot: "LOT-GLU-88" }, { value: 14.84, lot: "LOT-GLU-88" }, { value: 14.90, lot: "LOT-GLU-88" },
      { value: 15.02, lot: "LOT-GLU-88" }, { value: 15.31, lot: "LOT-GLU-88" }, { value: 15.44, lot: "LOT-GLU-88" },
      { value: 15.72, lot: "LOT-GLU-88" }, { value: 15.69, lot: "LOT-GLU-88" },
    ],
  },
  {
    id: "QC-0003", deviceId: "POCT-BG-1101", analyte: "pO2", level: "Level 1", mean: 12.1, sd: 0.35, unit: "kPa",
    points: [
      { value: 12.08, lot: "LOT-BG-22" }, { value: 12.14, lot: "LOT-BG-22" }, { value: 12.02, lot: "LOT-BG-22" },
      { value: 12.19, lot: "LOT-BG-22" }, { value: 13.22, lot: "LOT-BG-22" },
    ],
  },
  {
    id: "QC-0004", deviceId: "POCT-BG-1104", analyte: "pCO2", level: "Level 2", mean: 6.8, sd: 0.22, unit: "kPa",
    points: [
      { value: 6.79, lot: "LOT-BG-22" }, { value: 6.84, lot: "LOT-BG-22" }, { value: 7.31, lot: "LOT-BG-22" },
      { value: 6.30, lot: "LOT-BG-22" },
    ],
  },
  {
    id: "QC-0005", deviceId: "POCT-COA-2201", analyte: "INR", level: "Level 1", mean: 2.5, sd: 0.12, unit: "ratio",
    points: [
      { value: 2.48, lot: "LOT-COA-06" }, { value: 2.52, lot: "LOT-COA-06" }, { value: 2.47, lot: "LOT-COA-06" },
      { value: 2.51, lot: "LOT-COA-06" }, { value: 2.49, lot: "LOT-COA-06" }, { value: 2.53, lot: "LOT-COA-06" },
      { value: 2.71, lot: "LOT-COA-07" }, { value: 2.74, lot: "LOT-COA-07" }, { value: 2.76, lot: "LOT-COA-07" },
      { value: 2.73, lot: "LOT-COA-07" },
    ],
  },
  {
    id: "QC-0006", deviceId: "POCT-COA-2205", analyte: "ACT", level: "Level 1", mean: null, sd: null, unit: "seconds",
    points: [
      { value: 122, lot: "LOT-COA-09" }, { value: 128, lot: "LOT-COA-09" }, { value: 119, lot: "LOT-COA-09" },
      { value: 131, lot: "LOT-COA-09" },
    ],
  },
  {
    id: "QC-0007", deviceId: "POCT-URI-3301", analyte: "Protein", level: "Level 1", mean: 0.3, sd: 0.04, unit: "g/L",
    points: [
      { value: 0.31, lot: "LOT-URI-14" }, { value: 0.32, lot: "LOT-URI-14" }, { value: 0.31, lot: "LOT-URI-14" },
      { value: 0.33, lot: "LOT-URI-14" }, { value: 0.32, lot: "LOT-URI-14" }, { value: 0.31, lot: "LOT-URI-14" },
    ],
  },
  {
    id: "QC-0008", deviceId: "POCT-HB-5501", analyte: "Haemoglobin", level: "Level 2", mean: 128, sd: 3.1, unit: "g/L",
    points: [
      { value: 129, lot: "LOT-HB-31" }, { value: 131, lot: "LOT-HB-31" }, { value: 132, lot: "LOT-HB-31" },
      { value: 133, lot: "LOT-HB-31" }, { value: 132, lot: "LOT-HB-31" }, { value: 134, lot: "LOT-HB-31" },
      { value: 133, lot: "LOT-HB-31" }, { value: 132, lot: "LOT-HB-31" }, { value: 131, lot: "LOT-HB-31" },
      { value: 133, lot: "LOT-HB-31" },
    ],
  },
];

const OPERATORS = [
  { id: "OP-7701", name: "N. Achebe", role: "Staff nurse", department: "Ward 12", assays: ["Glucose", "Ketone"], lastAssessedDays: 90, resultsThisPeriod: 210 },
  { id: "OP-7702", name: "P. Marchetti", role: "Staff nurse", department: "Ward 9", assays: ["Glucose"], lastAssessedDays: 402, resultsThisPeriod: 168 },
  { id: "OP-7703", name: "D. Sorensen", role: "ICU nurse", department: "ICU", assays: ["Blood gas", "Glucose"], lastAssessedDays: 44, resultsThisPeriod: 340 },
  { id: "OP-7704", name: "K. Ibrahim", role: "ED nurse", department: "ED", assays: ["Blood gas", "Ketone", "Glucose"], lastAssessedDays: 355, resultsThisPeriod: 288 },
  { id: "OP-7705", name: "R. Delgado", role: "ODP", department: "Theatres", assays: ["Blood gas"], lastAssessedDays: 610, resultsThisPeriod: 74 },
  { id: "OP-7706", name: "A. Novak", role: "Midwife", department: "Maternity", assays: ["Glucose"], lastAssessedDays: 120, resultsThisPeriod: 96 },
  { id: "OP-7707", name: "T. Byrne", role: "Cardiac physiologist", department: "Cardiology", assays: ["Coagulation"], lastAssessedDays: 480, resultsThisPeriod: 52 },
  { id: "OP-7708", name: "M. Haugen", role: "Biomedical scientist", department: "Haematology", assays: ["Coagulation", "Haemoglobin"], lastAssessedDays: 30, resultsThisPeriod: 410 },
];

/**
 * Results already produced, with the operator and the assay.
 *
 * This exists so competency can be joined to output. Competency is normally a training record in a
 * different system that nobody joins to results, and the join is the finding: results produced by
 * an operator whose competency had already lapsed. It is retrospective, which is the honest thing
 * for it to be — the lockout should have happened at the device, and that it did not is the audit
 * finding rather than something this page can prevent.
 */
const RESULTS = [
  { id: "RES-9901", operatorId: "OP-7702", deviceId: "POCT-GLU-0418", assay: "Glucose", patient: "PT-3301", daysAgo: 0, operatorLapseDaysAtResult: 37 },
  { id: "RES-9902", operatorId: "OP-7702", deviceId: "POCT-GLU-0418", assay: "Glucose", patient: "PT-3308", daysAgo: 1, operatorLapseDaysAtResult: 36 },
  { id: "RES-9903", operatorId: "OP-7705", deviceId: "POCT-BG-1109", assay: "Blood gas", patient: "PT-3315", daysAgo: 1, operatorLapseDaysAtResult: 245 },
  { id: "RES-9904", operatorId: "OP-7707", deviceId: "POCT-COA-2205", assay: "Coagulation", patient: "PT-3322", daysAgo: 2, operatorLapseDaysAtResult: 115 },
  { id: "RES-9905", operatorId: "OP-7703", deviceId: "POCT-BG-1101", assay: "Blood gas", patient: "PT-3329", daysAgo: 0, operatorLapseDaysAtResult: null },
  { id: "RES-9906", operatorId: "OP-7701", deviceId: "POCT-GLU-0412", assay: "Glucose", patient: "PT-3336", daysAgo: 0, operatorLapseDaysAtResult: null },
  { id: "RES-9907", operatorId: "OP-7704", deviceId: "POCT-BG-1104", assay: "Blood gas", patient: "PT-3343", daysAgo: 3, operatorLapseDaysAtResult: null },
  { id: "RES-9908", operatorId: "OP-7705", deviceId: "POCT-BG-1109", assay: "Blood gas", patient: "PT-3350", daysAgo: 4, operatorLapseDaysAtResult: 242 },
];

const LOTS = [
  { id: "LOT-GLU-88", assay: "Glucose", kind: "Test strip", expiresDays: 61, receivedDays: 20, storageExcursion: false, units: 1_200, biasVsPreviousPct: 0.4 },
  { id: "LOT-GLU-91", assay: "Glucose", kind: "Test strip", expiresDays: -4, receivedDays: 190, storageExcursion: false, units: 300, biasVsPreviousPct: 1.1 },
  { id: "LOT-BG-22", assay: "Blood gas", kind: "Cartridge", expiresDays: 33, receivedDays: 12, storageExcursion: false, units: 480, biasVsPreviousPct: 0.2 },
  { id: "LOT-BG-25", assay: "Blood gas", kind: "Cartridge", expiresDays: 90, receivedDays: 4, storageExcursion: true, units: 240, biasVsPreviousPct: 0.6 },
  { id: "LOT-COA-07", assay: "Coagulation", kind: "Test strip", expiresDays: 120, receivedDays: 14, storageExcursion: false, units: 600, biasVsPreviousPct: 9.4 },
  { id: "LOT-COA-09", assay: "Coagulation", kind: "Cuvette", expiresDays: 15, receivedDays: 70, storageExcursion: false, units: 90, biasVsPreviousPct: 1.8 },
  { id: "LOT-URI-14", assay: "Urinalysis", kind: "Reagent strip", expiresDays: 210, receivedDays: 8, storageExcursion: false, units: 900, biasVsPreviousPct: 0.1 },
  { id: "LOT-MOL-03", assay: "Molecular", kind: "Cartridge", expiresDays: 44, receivedDays: 30, storageExcursion: false, units: 120, biasVsPreviousPct: 0.0 },
  { id: "LOT-HB-31", assay: "Haemoglobin", kind: "Microcuvette", expiresDays: 5, receivedDays: 300, storageExcursion: true, units: 150, biasVsPreviousPct: 2.7 },
  { id: "LOT-KET-05", assay: "Ketone", kind: "Test strip", expiresDays: 150, receivedDays: 10, storageExcursion: false, units: 400, biasVsPreviousPct: 0.3 },
];

/* ------------------------------------------------------------------ */
/*  Quality control evaluation                                         */
/* ------------------------------------------------------------------ */

/**
 * Standardise a QC series against its assigned mean and SD.
 *
 * Returns null rather than a series of NaN when the statistics are missing. A z-score against the
 * previous lot's statistics, or against no statistics at all, is not a z-score — and every rule
 * below is a statement about z, so producing one silently would make every rule downstream a
 * confident statement about nothing.
 */
export function zScores(series) {
  if (series.mean == null || series.sd == null || series.sd <= 0) return null;
  return series.points.map((point) => ({
    ...point,
    z: Math.round(((point.value - series.mean) / series.sd) * 1000) / 1000,
  }));
}

/**
 * Whether the last `count` points of a series all come from the same reagent lot.
 *
 * Consecutive-point rules assume one measurement system. A window spanning a lot change manufactures
 * a shift that is real in the data and meaningless clinically, and — much worse — hides a genuine
 * one behind it, because a real drift and a lot changeover look identical on a Levey-Jennings plot.
 */
export function windowIsSingleLot(points, count) {
  const window = points.slice(-count);
  if (window.length === 0) return true;
  const first = window[0].lot;
  return window.every((p) => p.lot === first);
}

/**
 * Evaluate the Westgard multirule set against a QC series.
 *
 * A POCT analyser reports pass or fail against its own single-point acceptance range. That is a
 * 1-2s check at best, and 1-2s is the one thing Westgard exists to replace: on a two-level daily run
 * it has a false rejection rate around 5% and almost no power to detect the small systematic shift
 * that is the failure mode that matters. So this recomputes from the raw values.
 *
 * Every rule reports one of four states, and the third is the one that has to exist:
 *
 *   reject        - the run is out of control and results are not released;
 *   warn          - inspect, but do not reject on this alone;
 *   pass          - the rule ran and did not fire;
 *   not evaluable - the rule could not be run at all.
 *
 * "Not evaluable" arises in two ways, both of which would otherwise be silently reported as a pass:
 * too few points for the rule to consume (10-x cannot be assessed on six points), and a window that
 * spans a reagent lot change. A rule reported as passing when it was never run is the most dangerous
 * cell on the page.
 *
 * A missing assigned mean or SD refuses the whole series rather than any individual rule.
 *
 * @returns {{evaluable: boolean, refusal: string|null, scores: Array|null,
 *            rules: Array<{code, action, status, reason}>, verdict: string}}
 */
export function evaluateWestgard(series) {
  const scores = zScores(series);
  if (scores == null) {
    return {
      evaluable: false, scores: null, rules: [], verdict: "No assigned values",
      refusal:
        "No assigned mean and SD are held for this lot, so no z-score can be formed. Every multirule is a statement about how many SD a point sits from the mean, and one computed against the previous lot's statistics is not a z-score at all.",
    };
  }

  const points = scores;
  const z = points.map((p) => p.z);

  const rules = WESTGARD_RULES.map((rule) => {
    if (points.length < rule.requires) {
      return {
        ...rule, status: "not-evaluable",
        reason: `Needs ${rule.requires} consecutive points and the series holds ${points.length}. Reported as not evaluable rather than as a pass — a rule that never ran is not a rule that was satisfied.`,
      };
    }
    if (!windowIsSingleLot(points, rule.requires)) {
      return {
        ...rule, status: "not-evaluable",
        reason: `The last ${rule.requires} points span a reagent lot change. Consecutive-point rules assume one measurement system; across a lot boundary they manufacture a shift that is meaningless and hide a genuine one behind it.`,
      };
    }

    switch (rule.code) {
      case "1-3s": {
        const hit = z.find((v) => Math.abs(v) > 3);
        return hit === undefined
          ? { ...rule, status: "pass", reason: "No point beyond 3 SD." }
          : { ...rule, status: "reject", reason: `A point sits at ${hit} SD, beyond 3 SD. Random error — the run is out of control.` };
      }
      case "2-2s": {
        const last = z.slice(-2);
        const fired = (last[0] > 2 && last[1] > 2) || (last[0] < -2 && last[1] < -2);
        return fired
          ? { ...rule, status: "reject", reason: `The last two points sit at ${last[0]} and ${last[1]} SD on the same side. Systematic error — a shift, not noise.` }
          : { ...rule, status: "pass", reason: "The last two points are not both beyond 2 SD on the same side." };
      }
      case "R-4s": {
        const high = Math.max(...z);
        const low = Math.min(...z);
        const fired = high > 2 && low < -2;
        return fired
          ? { ...rule, status: "reject", reason: `The run spans ${low} to ${high} SD, a range beyond 4 SD on opposite sides. Random error — imprecision has increased.` }
          : { ...rule, status: "pass", reason: `Run range ${low} to ${high} SD does not span 4 SD on opposite sides.` };
      }
      case "4-1s": {
        const last = z.slice(-4);
        const fired = last.every((v) => v > 1) || last.every((v) => v < -1);
        return fired
          ? { ...rule, status: "warn", reason: `Four consecutive points beyond 1 SD on the same side (${last.join(", ")}). Systematic drift — inspect before it becomes a 2-2s.` }
          : { ...rule, status: "pass", reason: "No run of four consecutive points beyond 1 SD on one side." };
      }
      case "10-x": {
        const last = z.slice(-10);
        const fired = last.every((v) => v > 0) || last.every((v) => v < 0);
        return fired
          ? { ...rule, status: "warn", reason: "Ten consecutive points on the same side of the mean. A bias is present even though no point is individually remarkable." }
          : { ...rule, status: "pass", reason: "The last ten points cross the mean." };
      }
      case "1-2s": {
        const hit = z.find((v) => Math.abs(v) > 2);
        return hit === undefined
          ? { ...rule, status: "pass", reason: "No point beyond 2 SD." }
          : {
            ...rule, status: "warn",
            reason: `A point sits at ${hit} SD. This is a warning to inspect the other rules and never a rejection on its own — 1-2s rejects about 5% of good runs, and a console that fails on it teaches its users to override failures.`,
          };
      }
      default:
        return { ...rule, status: "pass", reason: "" };
    }
  });

  const rejected = rules.some((r) => r.status === "reject");
  const warned = rules.some((r) => r.status === "warn");
  const unevaluated = rules.some((r) => r.status === "not-evaluable");
  const verdict = rejected ? "Out of control" : warned ? "Inspect" : unevaluated ? "In control, partially assessed" : "In control";

  return { evaluable: true, refusal: null, scores, rules, verdict };
}

/* ------------------------------------------------------------------ */
/*  Competency and consumables                                         */
/* ------------------------------------------------------------------ */

/** Where an operator sits against the annual reassessment interval. */
export function competencyStatus(operator) {
  const daysRemaining = COMPETENCY_INTERVAL_DAYS - operator.lastAssessedDays;
  if (daysRemaining <= 0) {
    return { status: "Lapsed", tone: "red", daysRemaining, text: `Competency lapsed ${Math.abs(daysRemaining)} days ago.` };
  }
  if (daysRemaining <= 30) {
    return { status: "Expiring", tone: "amber", daysRemaining, text: `Reassessment due in ${daysRemaining} days.` };
  }
  return { status: "Current", tone: "green", daysRemaining, text: `Reassessment due in ${daysRemaining} days.` };
}

/**
 * Results already produced by operators whose competency had lapsed at the time.
 *
 * Retrospective on purpose. The lockout should have happened at the device, and the fact that it did
 * not is the audit finding — this page cannot prevent those results, only surface that they exist
 * and how many patients they reached.
 */
export function lapsedResults(results) {
  return results.filter((r) => r.operatorLapseDaysAtResult != null && r.operatorLapseDaysAtResult > 0);
}

/** Lot faults, with expiry ahead of the bias that a changeover hides. */
export function lotFaults(lot) {
  const faults = [];
  if (lot.expiresDays <= 0) {
    faults.push({ code: "EXPIRED", tone: "red", text: `Expired ${Math.abs(lot.expiresDays)} days ago and still assigned to a device in service.` });
  } else if (lot.expiresDays <= 14) {
    faults.push({ code: "EXPIRING", tone: "amber", text: `Expires in ${lot.expiresDays} days.` });
  }
  if (lot.storageExcursion) {
    faults.push({ code: "EXCURSION", tone: "red", text: "Storage excursion recorded. Reagent performance after an excursion is unpredictable rather than uniformly degraded, which is why the lot is quarantined rather than derated." });
  }
  if (Math.abs(lot.biasVsPreviousPct) > 5) {
    faults.push({ code: "BIAS", tone: "amber", text: `${lot.biasVsPreviousPct}% bias against the previous lot. A changeover of this size moves every result on the device and is invisible in the QC series unless the lot boundary is respected.` });
  }
  return faults;
}

/** Device faults: connectivity first, because a device that stopped uploading has left the estate. */
export function deviceFaults(device, lots) {
  const faults = [];
  if (!device.connected || device.lastUploadHours > CONNECTIVITY_STALE_HOURS) {
    faults.push({
      code: "OFFLINE", tone: "red",
      text: `Last upload ${device.lastUploadHours} hours ago. A device that has stopped uploading is producing results nobody is reviewing and holding QC nobody is seeing — it has left the governed estate without leaving the ward.`,
    });
  }
  const lot = lots.find((l) => l.id === device.lotId);
  if (lot && lot.expiresDays <= 0) {
    faults.push({ code: "LOT", tone: "red", text: `Assigned lot ${lot.id} expired ${Math.abs(lot.expiresDays)} days ago.` });
  }
  return faults;
}

/* ------------------------------------------------------------------ */
/*  Simulation                                                         */
/* ------------------------------------------------------------------ */

/** Ages the estate: uploads go stale, lots approach expiry, competency runs down. */
function usePoctSimulation({ devicesRef, operatorsRef, lotsRef, toast }) {
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

      devicesRef.current = devicesRef.current.map((device) => {
        const next = { ...device, lastUploadHours: device.connected ? Math.max(0, device.lastUploadHours) : device.lastUploadHours + step };
        if (device.connected && device.lastUploadHours <= CONNECTIVITY_STALE_HOURS && next.lastUploadHours > CONNECTIVITY_STALE_HOURS) {
          toast(`${device.id} has stopped uploading from ${device.location}`, "High");
        }
        return next;
      });

      operatorsRef.current = operatorsRef.current.map((op) => ({ ...op, lastAssessedDays: op.lastAssessedDays + step }));
      lotsRef.current = lotsRef.current.map((lot) => ({ ...lot, expiresDays: lot.expiresDays - step, receivedDays: lot.receivedDays + step }));

      setTick((t) => t + 1);
    }, 1600);

    return () => clearInterval(interval);
  }, [devicesRef, operatorsRef, lotsRef, toast]);

  return {
    running, setRunning, speed, setSpeed, tick,
    reset: () => {
      devicesRef.current = DEVICES.map((d) => ({ ...d }));
      operatorsRef.current = OPERATORS.map((o) => ({ ...o }));
      lotsRef.current = LOTS.map((l) => ({ ...l }));
      setTick(0);
      toast("POCT console reset to baseline", "Low");
    },
  };
}

/* ------------------------------------------------------------------ */
/*  Main page                                                          */
/* ------------------------------------------------------------------ */

export default function PointOfCareTestingHub() {
  const [tab, setTab] = useState("fleet");
  const [modal, setModal] = useState(null);
  const [query, setQuery] = useState("");
  const [fleetFilter, setFleetFilter] = useState("All");
  const [qcFilter, setQcFilter] = useState("All");
  const [operatorFilter, setOperatorFilter] = useState("All");
  const [lotFilter, setLotFilter] = useState("All");

  const [toasts, setToasts] = useState([]);
  const toast = useCallback((message, severity = "Low") => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((current) => [...current.slice(-4), { id, message, severity }]);
    setTimeout(() => setToasts((current) => current.filter((t) => t.id !== id)), 4200);
  }, []);

  const [devices, setDevices] = useState(() => DEVICES.map((d) => ({ ...d })));
  const [qcSeries, setQcSeries] = useState(() => QC_SERIES.map((q) => ({ ...q, points: q.points.map((p) => ({ ...p })) })));
  const [operators, setOperators] = useState(() => OPERATORS.map((o) => ({ ...o })));
  const [lots, setLots] = useState(() => LOTS.map((l) => ({ ...l })));
  const [results] = useState(() => RESULTS.map((r) => ({ ...r })));

  const devicesRef = useRef(devices);
  const operatorsRef = useRef(operators);
  const lotsRef = useRef(lots);

  useEffect(() => { devicesRef.current = devices; }, [devices]);
  useEffect(() => { operatorsRef.current = operators; }, [operators]);
  useEffect(() => { lotsRef.current = lots; }, [lots]);

  const sim = usePoctSimulation({ devicesRef, operatorsRef, lotsRef, toast });

  useEffect(() => {
    setDevices([...devicesRef.current]);
    setOperators([...operatorsRef.current]);
    setLots([...lotsRef.current]);
  }, [sim.tick]);

  /* ---------- derived ---------- */

  const evaluations = useMemo(
    () => qcSeries.map((series) => ({ series, ...evaluateWestgard(series) })),
    [qcSeries]
  );

  const competencies = useMemo(
    () => operators.map((operator) => ({ operator, ...competencyStatus(operator) })),
    [operators]
  );

  const lapsed = useMemo(() => lapsedResults(results), [results]);

  const stats = useMemo(() => {
    const outOfControl = evaluations.filter((e) => e.evaluable && e.rules.some((r) => r.status === "reject")).length;
    const notEvaluable = evaluations.filter((e) => !e.evaluable || e.rules.some((r) => r.status === "not-evaluable")).length;
    const lapsedOperators = competencies.filter((c) => c.status === "Lapsed").length;
    const offline = devices.filter((d) => deviceFaults(d, lots).some((f) => f.code === "OFFLINE")).length;
    return { outOfControl, notEvaluable, lapsedOperators, offline };
  }, [evaluations, competencies, devices, lots]);

  const filteredDevices = useMemo(() => {
    const q = query.toLowerCase();
    return devices.filter((device) => {
      const matchesQuery = !q || [device.id, device.model, device.vendor, device.assay, device.location, device.custodian].some((f) => String(f).toLowerCase().includes(q));
      if (!matchesQuery) return false;
      if (fleetFilter === "All") return true;
      if (fleetFilter === "Offline") return deviceFaults(device, lots).some((f) => f.code === "OFFLINE");
      if (fleetFilter === "Faulted") return deviceFaults(device, lots).length > 0;
      return device.assay === fleetFilter;
    });
  }, [devices, query, fleetFilter, lots]);

  const filteredEvaluations = useMemo(() => {
    const q = query.toLowerCase();
    return evaluations.filter((entry) => {
      const { series } = entry;
      const matchesQuery = !q || [series.id, series.deviceId, series.analyte, series.level].some((f) => String(f).toLowerCase().includes(q));
      if (!matchesQuery) return false;
      if (qcFilter === "All") return true;
      if (qcFilter === "Out of control") return entry.evaluable && entry.rules.some((r) => r.status === "reject");
      if (qcFilter === "Inspect") return entry.evaluable && entry.rules.some((r) => r.status === "warn") && !entry.rules.some((r) => r.status === "reject");
      if (qcFilter === "Not evaluable") return !entry.evaluable || entry.rules.some((r) => r.status === "not-evaluable");
      return entry.evaluable && entry.verdict === "In control";
    });
  }, [evaluations, query, qcFilter]);

  const filteredCompetencies = useMemo(() => {
    const q = query.toLowerCase();
    return competencies.filter((entry) => {
      const { operator } = entry;
      const matchesQuery = !q || [operator.id, operator.name, operator.role, operator.department].some((f) => String(f).toLowerCase().includes(q));
      if (!matchesQuery) return false;
      if (operatorFilter === "All") return true;
      return entry.status === operatorFilter;
    });
  }, [competencies, query, operatorFilter]);

  const filteredLots = useMemo(() => {
    const q = query.toLowerCase();
    return lots.filter((lot) => {
      const matchesQuery = !q || [lot.id, lot.assay, lot.kind].some((f) => String(f).toLowerCase().includes(q));
      if (!matchesQuery) return false;
      if (lotFilter === "All") return true;
      if (lotFilter === "Quarantine") return lotFaults(lot).some((f) => f.tone === "red");
      if (lotFilter === "Expiring") return lot.expiresDays > 0 && lot.expiresDays <= 14;
      return lot.assay === lotFilter;
    });
  }, [lots, query, lotFilter]);

  /* ---------- actions ---------- */

  const reconnect = (id) => {
    setDevices((current) => current.map((d) => (d.id === id ? { ...d, connected: true, lastUploadHours: 0 } : d)));
    toast(`${id} reconnected — QC and results uploading again`, "Medium");
  };

  const assignValues = (seriesId) => {
    setQcSeries((current) =>
      current.map((s) => {
        if (s.id !== seriesId || s.mean != null) return s;
        const values = s.points.map((p) => p.value);
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / (values.length - 1);
        return { ...s, mean: Math.round(mean * 100) / 100, sd: Math.round(Math.sqrt(variance) * 100) / 100 };
      })
    );
    toast(`${seriesId} assigned mean and SD established from the current lot`, "Medium");
  };

  const reassess = (id) => {
    setOperators((current) => current.map((o) => (o.id === id ? { ...o, lastAssessedDays: 0 } : o)));
    toast(`${id} competency reassessed — valid for another ${COMPETENCY_INTERVAL_DAYS} days`, "Low");
  };

  const quarantineLot = (id) => {
    setLots((current) => current.filter((l) => l.id !== id));
    toast(`${id} quarantined and withdrawn from every device`, "High");
  };

  const exportCsv = () => {
    const table =
      tab === "fleet"
        ? [
            ["ID", "Model", "Vendor", "Assay", "Location", "Custodian", "Firmware", "Lot", "Connected", "Last upload (h)", "Results today", "Faults"],
            ...filteredDevices.map((d) => [d.id, d.model, d.vendor, d.assay, d.location, d.custodian, d.firmware, d.lotId, d.connected, d.lastUploadHours, d.resultsToday, deviceFaults(d, lots).map((f) => f.code).join(" ") || "none"]),
          ]
        : tab === "qc"
          ? [
              ["ID", "Device", "Analyte", "Level", "Mean", "SD", "Points", "Verdict", ...WESTGARD_RULES.map((r) => r.code)],
              ...filteredEvaluations.map((e) => [
                e.series.id, e.series.deviceId, e.series.analyte, e.series.level,
                e.series.mean ?? "not assigned", e.series.sd ?? "not assigned", e.series.points.length, e.verdict,
                ...WESTGARD_RULES.map((rule) => {
                  const found = e.rules.find((r) => r.code === rule.code);
                  return found ? found.status : "no values";
                }),
              ]),
            ]
          : tab === "competency"
            ? [
                ["ID", "Name", "Role", "Department", "Assays", "Last assessed (d)", "Status", "Days remaining", "Results this period"],
                ...filteredCompetencies.map((c) => [c.operator.id, c.operator.name, c.operator.role, c.operator.department, c.operator.assays.join(" · "), c.operator.lastAssessedDays, c.status, c.daysRemaining, c.operator.resultsThisPeriod]),
              ]
            : [
                ["ID", "Assay", "Kind", "Expires (d)", "Received (d ago)", "Units", "Excursion", "Bias vs previous %", "Faults"],
                ...filteredLots.map((l) => [l.id, l.assay, l.kind, l.expiresDays, l.receivedDays, l.units, l.storageExcursion, l.biasVsPreviousPct, lotFaults(l).map((f) => f.code).join(" ") || "none"]),
              ];

    downloadCsv(`poct-${tab}.csv`, table);
    toast("CSV export downloaded", "Low");
  };

  const tabs = [
    { id: "fleet", label: "Device Fleet", icon: TestTube2 },
    { id: "qc", label: "Quality Control", icon: Sigma },
    { id: "competency", label: "Operator Competency", icon: UserCheck },
    { id: "lots", label: "Consumables & Lots", icon: Package },
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
              <TestTube2 size={24} className="text-emerald-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-100">Point-of-Care Testing Governance Hub</h1>
              <p className="mt-0.5 text-xs text-slate-400">
                Device fleet · Westgard multirules · operator competency · reagent lots — ISO 15189, ISO 22870, CLSI C24
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
          <StatCard icon={Sigma} label="QC Out of Control" value={stats.outOfControl} sub="1-3s, 2-2s or R-4s" accent={stats.outOfControl > 0 ? "text-red-400" : "text-emerald-400"} />
          <StatCard icon={Info} label="Rules Not Evaluable" value={stats.notEvaluable} sub="never run — not a pass" accent={stats.notEvaluable > 0 ? "text-amber-400" : "text-emerald-400"} />
          <StatCard icon={UserCheck} label="Lapsed Operators" value={stats.lapsedOperators} sub={`${lapsed.length} results already produced`} accent={stats.lapsedOperators > 0 ? "text-red-400" : "text-emerald-400"} />
          <StatCard icon={WifiOff} label="Devices Not Uploading" value={stats.offline} sub={`${devices.length}-device estate`} accent={stats.offline > 0 ? "text-red-400" : "text-emerald-400"} />
        </div>

        <TabsBar tabs={tabs} active={tab} onChange={setTab} />

        {/* toolbar */}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <CompactSearch value={query} onChange={setQuery} placeholder="Search devices, QC series, operators, lots…" />
          {tab === "fleet" && <FilterChips options={["All", "Offline", "Faulted", "Glucose", "Blood gas"]} value={fleetFilter} onChange={setFleetFilter} />}
          {tab === "qc" && <FilterChips options={["All", "Out of control", "Inspect", "Not evaluable", "In control"]} value={qcFilter} onChange={setQcFilter} />}
          {tab === "competency" && <FilterChips options={["All", "Lapsed", "Expiring", "Current"]} value={operatorFilter} onChange={setOperatorFilter} />}
          {tab === "lots" && <FilterChips options={["All", "Quarantine", "Expiring", "Glucose", "Blood gas"]} value={lotFilter} onChange={setLotFilter} />}
        </div>
      </header>

      <main className="px-6 py-6">
        {/* ============================= DEVICE FLEET ============================= */}
        {tab === "fleet" && (
          <section>
            {filteredDevices.length === 0 ? (
              <EmptyState icon={TestTube2} message="No devices match the current filters." />
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {filteredDevices.map((device) => {
                  const faults = deviceFaults(device, lots);
                  const down = faults.some((f) => f.tone === "red");
                  return (
                    <article key={device.id} className={`rounded-2xl border bg-slate-900/70 p-4 ${down ? "border-red-500/40" : "border-slate-800"}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <button onClick={() => setModal({ kind: "device", data: device })} className="font-mono text-xs font-semibold text-emerald-300 hover:underline">
                            {device.id}
                          </button>
                          <p className="text-xs text-slate-200">{device.model}</p>
                          <p className="text-[11px] text-slate-500">{device.vendor} · {device.assay} · {device.location}</p>
                        </div>
                        <span className={`inline-flex items-center gap-1 text-xs ${down ? "text-red-300" : "text-emerald-300"}`}>
                          {down ? <WifiOff size={12} /> : <Wifi size={12} />}
                          {down ? "Offline" : "Online"}
                        </span>
                      </div>

                      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                        <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-2">
                          <p className="text-[10px] uppercase tracking-wide text-slate-500">Results today</p>
                          <p className="text-sm font-bold text-slate-100">{device.resultsToday}</p>
                        </div>
                        <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-2">
                          <p className="text-[10px] uppercase tracking-wide text-slate-500">Last upload</p>
                          <p className={`text-sm font-bold ${device.lastUploadHours > CONNECTIVITY_STALE_HOURS ? "text-red-300" : "text-slate-100"}`}>{device.lastUploadHours}h</p>
                        </div>
                        <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-2">
                          <p className="text-[10px] uppercase tracking-wide text-slate-500">Firmware</p>
                          <p className="text-sm font-bold text-slate-100">{device.firmware}</p>
                        </div>
                      </div>

                      <p className="mt-3 text-[11px] text-slate-500">Custodian {device.custodian} · lot {device.lotId}</p>

                      {faults.length > 0 && (
                        <ul className="mt-3 space-y-2">
                          {faults.map((fault) => (
                            <li key={fault.code} className="rounded-lg border border-red-500/30 bg-red-500/5 p-2.5 text-[11px] leading-relaxed text-red-200">
                              {fault.text}
                            </li>
                          ))}
                        </ul>
                      )}

                      <button onClick={() => reconnect(device.id)} className="mt-3 w-full rounded-md border border-emerald-500/40 bg-emerald-500/10 px-2 py-1.5 text-[11px] font-semibold text-emerald-300 hover:bg-emerald-500/20">
                        Reconnect &amp; upload
                      </button>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* ============================= QUALITY CONTROL ============================= */}
        {tab === "qc" && (
          <section>
            <div className="mb-4 rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
              <p className="flex items-start gap-2 text-[11px] leading-relaxed text-slate-400">
                <Info size={14} className="mt-0.5 shrink-0 text-sky-400" />
                <span>
                  Every rule below is recomputed from the raw QC values against the assigned mean and SD — never read from the analyser's
                  own pass lamp, which is a 1-2s check at best. The reject/warn split is the design: 1-2s rejects around 5% of good runs,
                  so it warns and never rejects on its own, because a console that fails on it teaches its users to override failures. A
                  rule that could not run reads <strong className="text-slate-300">not evaluable</strong> rather than pass.
                </span>
              </p>
            </div>

            {filteredEvaluations.length === 0 ? (
              <EmptyState icon={Sigma} message="No QC series match the current filters." />
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {filteredEvaluations.map((entry) => {
                  const { series, evaluable, refusal, rules, scores, verdict } = entry;
                  const rejected = rules.some((r) => r.status === "reject");
                  return (
                    <article key={series.id} className={`rounded-2xl border bg-slate-900/70 p-4 ${rejected ? "border-red-500/40" : !evaluable ? "border-amber-500/40" : rules.some((r) => r.status === "warn") ? "border-amber-500/30" : "border-slate-800"}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <button onClick={() => setModal({ kind: "qc", data: entry })} className="font-mono text-xs font-semibold text-emerald-300 hover:underline">
                            {series.id}
                          </button>
                          <p className="mt-0.5 text-sm font-semibold text-slate-100">{series.analyte} · {series.level}</p>
                          <p className="text-[11px] text-slate-500">
                            {series.deviceId} · {series.points.length} points ·{" "}
                            {series.mean == null ? "no assigned values" : `mean ${series.mean} SD ${series.sd} ${series.unit}`}
                          </p>
                        </div>
                        <ToneBadge tone={rejected ? "red" : !evaluable ? "amber" : rules.some((r) => r.status === "warn") ? "amber" : "green"}>
                          {verdict}
                        </ToneBadge>
                      </div>

                      {!evaluable ? (
                        <p className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-2.5 text-[11px] leading-relaxed text-amber-200">
                          {refusal}
                        </p>
                      ) : (
                        <>
                          {/* Levey-Jennings strip */}
                          <div className="relative mt-3 h-16 rounded-lg border border-slate-800 bg-slate-950/60 px-2">
                            <div className="absolute inset-x-2 top-1/2 h-px bg-slate-700" />
                            <div className="absolute inset-x-2 top-[16.6%] h-px bg-amber-500/30" />
                            <div className="absolute inset-x-2 bottom-[16.6%] h-px bg-amber-500/30" />
                            <div className="flex h-full items-center justify-between">
                              {scores.map((point, index) => {
                                const clamped = Math.max(-3.4, Math.min(3.4, point.z));
                                const offset = 50 - (clamped / 3.4) * 46;
                                const tone = Math.abs(point.z) > 3 ? "bg-red-400" : Math.abs(point.z) > 2 ? "bg-amber-400" : "bg-emerald-400";
                                return (
                                  <span
                                    key={`${series.id}-${index}`}
                                    className={`h-1.5 w-1.5 rounded-full ${tone}`}
                                    style={{ position: "relative", top: `${offset - 50}%` }}
                                    title={`${point.value} (${point.z} SD, ${point.lot})`}
                                  />
                                );
                              })}
                            </div>
                          </div>

                          <div className="mt-3 grid grid-cols-3 gap-1.5">
                            {rules.map((rule) => (
                              <div
                                key={rule.code}
                                className={`rounded-lg border p-1.5 text-center ${
                                  rule.status === "reject" ? "border-red-500/40 bg-red-500/10"
                                    : rule.status === "warn" ? "border-amber-500/40 bg-amber-500/10"
                                      : rule.status === "not-evaluable" ? "border-slate-700 bg-slate-800/40"
                                        : "border-slate-800 bg-slate-950/60"
                                }`}
                              >
                                <p className="font-mono text-[11px] font-semibold text-slate-200">{rule.code}</p>
                                <p className={`text-[10px] ${
                                  rule.status === "reject" ? "text-red-300"
                                    : rule.status === "warn" ? "text-amber-300"
                                      : rule.status === "not-evaluable" ? "text-slate-400"
                                        : "text-emerald-300"
                                }`}>
                                  {rule.status === "not-evaluable" ? "n/e" : rule.status}
                                </p>
                              </div>
                            ))}
                          </div>

                          <ul className="mt-3 space-y-2">
                            {rules.filter((r) => r.status !== "pass").map((rule) => (
                              <li
                                key={rule.code}
                                className={`rounded-lg border p-2.5 text-[11px] leading-relaxed ${
                                  rule.status === "reject" ? "border-red-500/30 bg-red-500/5 text-red-200"
                                    : rule.status === "warn" ? "border-amber-500/30 bg-amber-500/5 text-amber-200"
                                      : "border-slate-700 bg-slate-800/40 text-slate-400"
                                }`}
                              >
                                <span className="font-mono font-semibold">{rule.code}</span> — {rule.reason}
                              </li>
                            ))}
                          </ul>
                        </>
                      )}

                      {!evaluable && (
                        <button onClick={() => assignValues(series.id)} className="mt-3 w-full rounded-md border border-emerald-500/40 bg-emerald-500/10 px-2 py-1.5 text-[11px] font-semibold text-emerald-300 hover:bg-emerald-500/20">
                          Establish assigned mean and SD
                        </button>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* ============================= OPERATOR COMPETENCY ============================= */}
        {tab === "competency" && (
          <section>
            {lapsed.length > 0 && (
              <div className="mb-4 rounded-2xl border border-red-500/30 bg-red-500/5 p-4">
                <p className="flex items-start gap-2 text-[11px] leading-relaxed text-red-200">
                  <ClipboardCheck size={14} className="mt-0.5 shrink-0" />
                  <span>
                    <strong>{lapsed.length} results were already produced by operators whose competency had lapsed at the time.</strong>{" "}
                    This list is retrospective, and deliberately so: the lockout should have happened at the device, and the fact that it
                    did not is the audit finding rather than something this console can prevent. Patients reached:{" "}
                    {lapsed.map((r) => r.patient).join(", ")}.
                  </span>
                </p>
              </div>
            )}

            {filteredCompetencies.length === 0 ? (
              <EmptyState icon={UserCheck} message="No operators match the current filters." />
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/70">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-500">
                      <th className="px-4 py-3">Operator</th>
                      <th className="px-4 py-3">Certified for</th>
                      <th className="px-4 py-3">Competency</th>
                      <th className="px-4 py-3">Results</th>
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCompetencies.map((entry) => {
                      const { operator, status, tone, text } = entry;
                      const produced = lapsed.filter((r) => r.operatorId === operator.id);
                      return (
                        <tr key={operator.id} className="border-b border-slate-800/60 last:border-0 hover:bg-slate-800/30">
                          <td className="px-4 py-3">
                            <button onClick={() => setModal({ kind: "operator", data: entry })} className="font-mono text-xs font-semibold text-emerald-300 hover:underline">
                              {operator.id}
                            </button>
                            <p className="text-xs text-slate-200">{operator.name}</p>
                            <p className="text-[11px] text-slate-500">{operator.role} · {operator.department}</p>
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-400">{operator.assays.join(" · ")}</td>
                          <td className="px-4 py-3">
                            <ToneBadge tone={tone}>{status}</ToneBadge>
                            <p className="mt-1 text-[11px] text-slate-500">{text}</p>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-xs text-slate-300">{operator.resultsThisPeriod} this period</p>
                            {produced.length > 0 && (
                              <p className="text-[11px] font-semibold text-red-300">{produced.length} produced after lapse</p>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button onClick={() => reassess(operator.id)} className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-2 py-1 text-[11px] font-semibold text-emerald-300 hover:bg-emerald-500/20">
                              Reassess
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

        {/* ============================= CONSUMABLES & LOTS ============================= */}
        {tab === "lots" && (
          <section>
            {filteredLots.length === 0 ? (
              <EmptyState icon={Package} message="No lots match the current filters." />
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {filteredLots.map((lot) => {
                  const faults = lotFaults(lot);
                  const quarantine = faults.some((f) => f.tone === "red");
                  const devicesOnLot = devices.filter((d) => d.lotId === lot.id);
                  return (
                    <article key={lot.id} className={`rounded-2xl border bg-slate-900/70 p-4 ${quarantine ? "border-red-500/40" : faults.length > 0 ? "border-amber-500/40" : "border-slate-800"}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-mono text-xs font-semibold text-emerald-300">{lot.id}</p>
                          <p className="text-xs text-slate-200">{lot.kind}</p>
                          <p className="text-[11px] text-slate-500">{lot.assay} · {lot.units} units</p>
                        </div>
                        <ToneBadge tone={quarantine ? "red" : faults.length > 0 ? "amber" : "green"}>
                          {quarantine ? "Quarantine" : faults.length > 0 ? "Expiring" : "In use"}
                        </ToneBadge>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-2 text-center">
                        <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-2">
                          <p className="text-[10px] uppercase tracking-wide text-slate-500">Expiry</p>
                          <p className={`text-sm font-bold ${lot.expiresDays <= 0 ? "text-red-300" : lot.expiresDays <= 14 ? "text-amber-300" : "text-slate-100"}`}>
                            {lot.expiresDays <= 0 ? `${Math.abs(lot.expiresDays)}d past` : `${lot.expiresDays}d`}
                          </p>
                        </div>
                        <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-2">
                          <p className="text-[10px] uppercase tracking-wide text-slate-500">Lot-to-lot bias</p>
                          <p className={`text-sm font-bold ${Math.abs(lot.biasVsPreviousPct) > 5 ? "text-amber-300" : "text-slate-100"}`}>{lot.biasVsPreviousPct}%</p>
                        </div>
                      </div>

                      <p className="mt-3 text-[11px] text-slate-500">
                        On {devicesOnLot.length} device{devicesOnLot.length === 1 ? "" : "s"}
                        {devicesOnLot.length > 0 ? `: ${devicesOnLot.map((d) => d.id).join(", ")}` : ""}
                      </p>

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

                      <button onClick={() => quarantineLot(lot.id)} className="mt-3 w-full rounded-md border border-slate-700 bg-slate-800/60 px-2 py-1.5 text-[11px] font-semibold text-slate-300 hover:bg-slate-800">
                        Quarantine lot
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
      {modal && modal.kind === "device" && (
        <Modal title={modal.data.model} subtitle={`${modal.data.id} · ${modal.data.vendor} · ${modal.data.assay}`} onClose={() => setModal(null)}>
          <Row label="Location" value={modal.data.location} />
          <Row label="Custodian department" value={modal.data.custodian} />
          <Row label="Firmware" value={modal.data.firmware} />
          <Row label="Reagent lot" value={modal.data.lotId} />
          <Row label="Connected" value={modal.data.connected ? "yes" : "no"} accent={modal.data.connected ? undefined : "text-red-300"} />
          <Row label="Last upload" value={`${modal.data.lastUploadHours} hours ago`} accent={modal.data.lastUploadHours > CONNECTIVITY_STALE_HOURS ? "text-red-300" : undefined} />
          <Row label="Results today" value={modal.data.resultsToday} />
          <p className="mt-3 rounded-lg border border-slate-800 bg-slate-950/60 p-3 text-[11px] leading-relaxed text-slate-400">
            The custodian is a clinical department rather than the laboratory, which is the structural reason this fleet is the least
            governed one in the estate: these devices are bought by the wards that need them, and nobody has a list. That is usually
            found by the inspector rather than by the hospital.
          </p>
        </Modal>
      )}

      {modal && modal.kind === "qc" && (
        <Modal title={`${modal.data.series.analyte} · ${modal.data.series.level}`} subtitle={`${modal.data.series.id} · ${modal.data.series.deviceId}`} onClose={() => setModal(null)}>
          <Row label="Assigned mean" value={modal.data.series.mean == null ? "not assigned" : `${modal.data.series.mean} ${modal.data.series.unit}`} accent={modal.data.series.mean == null ? "text-amber-300" : undefined} />
          <Row label="Assigned SD" value={modal.data.series.sd == null ? "not assigned" : `${modal.data.series.sd} ${modal.data.series.unit}`} />
          <Row label="Points held" value={modal.data.series.points.length} />
          <Row label="Lots in series" value={[...new Set(modal.data.series.points.map((p) => p.lot))].join(", ")} />
          <Row label="Verdict" value={modal.data.verdict} />
          {modal.data.evaluable ? (
            <>
              {modal.data.rules.map((rule) => (
                <Row
                  key={rule.code}
                  label={`${rule.code} (${rule.action}, needs ${rule.requires})`}
                  value={rule.status === "not-evaluable" ? "not evaluable" : rule.status}
                  accent={rule.status === "reject" ? "text-red-300" : rule.status === "warn" ? "text-amber-300" : rule.status === "not-evaluable" ? "text-slate-400" : undefined}
                />
              ))}
              <p className="mt-3 rounded-lg border border-slate-800 bg-slate-950/60 p-3 text-[11px] leading-relaxed text-slate-400">
                Rules reading "not evaluable" could not be run — too few points, or a window spanning a reagent lot change. They are
                deliberately not reported as passing: a rule that never ran is not a rule that was satisfied, and that is the most
                dangerous cell on this page to get wrong.
              </p>
            </>
          ) : (
            <p className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-[11px] leading-relaxed text-amber-200">
              {modal.data.refusal}
            </p>
          )}
        </Modal>
      )}

      {modal && modal.kind === "operator" && (
        <Modal title={modal.data.operator.name} subtitle={`${modal.data.operator.id} · ${modal.data.operator.role} · ${modal.data.operator.department}`} onClose={() => setModal(null)}>
          <Row label="Certified for" value={modal.data.operator.assays.join(", ")} />
          <Row label="Last assessed" value={`${modal.data.operator.lastAssessedDays} days ago`} />
          <Row label="Interval" value={`${COMPETENCY_INTERVAL_DAYS} days`} />
          <Row label="Status" value={modal.data.status} accent={modal.data.tone === "red" ? "text-red-300" : modal.data.tone === "amber" ? "text-amber-300" : undefined} />
          <Row label="Results this period" value={modal.data.operator.resultsThisPeriod} />
          <Row label="Results after lapse" value={lapsed.filter((r) => r.operatorId === modal.data.operator.id).length} accent={lapsed.some((r) => r.operatorId === modal.data.operator.id) ? "text-red-300" : undefined} />
          <p className="mt-3 rounded-lg border border-slate-800 bg-slate-950/60 p-3 text-[11px] leading-relaxed text-slate-400">
            Competency is normally a training record in a different system that nobody joins to results. The join is the finding: this
            operator produced results after their competency had already lapsed, and the list is retrospective because the lockout
            should have happened at the device.
          </p>
        </Modal>
      )}

      {/* footer strip */}
      <footer className="mt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 px-6 py-4 text-[11px] text-slate-500">
        <span className="inline-flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${sim.running ? "bg-emerald-400" : "bg-amber-400"}`} />
          {sim.running ? `Live simulation at ${sim.speed}× · tick #${sim.tick}` : "Simulation paused"}
        </span>
        <span className="hidden md:inline">ISO 15189:2022 · ISO 22870 · CLSI C24 Westgard multirule QC · POCT1-A2 connectivity</span>
        <span className="inline-flex items-center gap-1.5">
          <Beaker size={12} /> {devices.length} devices · {qcSeries.length} QC series · {operators.length} operators · {lots.length} lots
        </span>
        <span className="hidden xl:inline-flex items-center gap-1.5">
          <FileText size={12} /> {WESTGARD_RULES.length} rules evaluated
        </span>
      </footer>
    </div>
  );
}
