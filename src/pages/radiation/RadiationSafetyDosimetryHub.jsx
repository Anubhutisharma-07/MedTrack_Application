import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle, Atom, BadgeCheck, CheckCircle2, Eye, FileText, Info, Pause,
  Play, Radiation, RefreshCw, ScanLine, ShieldAlert, ShieldCheck, UserCheck,
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
 *  MedTrack Radiation Safety & Dosimetry Hub
 *  ------------------------------------------------------------------
 *  MedTrack has a radiology console. It tracks scanners, queues, PACS
 *  and reporting turnaround - the throughput of an imaging department.
 *  It tracks none of the thing that makes an imaging department legally
 *  distinct from every other department in the building, which is that
 *  it is a licensed radiation employer.
 *
 *  Radiation is unlike the other hazards MedTrack models in one
 *  specific way: the harm is invisible, delayed and cumulative, and
 *  nothing in the workflow produces feedback. A drifted OCT eventually
 *  produces a clinical result somebody disputes. An interventional
 *  cardiologist standing slightly too close to a tube for four years
 *  gets no signal at all until the dosimetry report says so, and by
 *  then the dose is already delivered. Every control in radiation
 *  protection is therefore a record-keeping control, and record-keeping
 *  controls fail silently.
 *
 *    1. Staff Dosimetry - badges against the IRR17 annual limits, with
 *                         an honest projection to year end.
 *    2. Source Inventory - sealed sources with activity decayed to
 *                          today rather than quoted from a certificate.
 *    3. Patient Dose     - exams against the DRL for that exam.
 *    4. Protection PPE   - lead aprons and shields with their integrity
 *                          check dates and defect maps.
 *
 *  Three things in this domain decay on their own, which is what makes
 *  it a natural fit for an asset platform: sealed sources decay by
 *  physics, lead PPE degrades by handling, and dosimeter wear
 *  compliance decays by human nature.
 * ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/*  Regulatory constants                                               */
/* ------------------------------------------------------------------ */

/**
 * IRR17 / ICRP 103 annual dose limits for classified workers, in millisieverts.
 *
 * The lens limit is the one worth surfacing loudly. ICRP 118 cut it from 150 mSv/year to 20, and
 * the practical consequence - that interventional operators need lens dosimetry and leaded eyewear,
 * not just an apron - is the single most commonly missed control in this field. A great many
 * departments still hold a mental model calibrated to the old number.
 */
export const DOSE_LIMITS = {
  wholeBody: { limit: 20, label: "Whole body (effective)", unit: "mSv" },
  lens: { limit: 20, label: "Lens of the eye", unit: "mSv" },
  extremity: { limit: 500, label: "Extremities / skin", unit: "mSv" },
};

/**
 * Investigation level, as a fraction of the relevant limit.
 *
 * Three tenths is the conventional trigger for an employer to ask why a dose is where it is. It is
 * shown separately from the limit rather than folded into a single red/green, because a worker at
 * 40% of a limit is not in breach of anything and is still the most useful thing on the page: the
 * point of an investigation level is to act while there is a year left to act in.
 */
const INVESTIGATION_FRACTION = 0.3;

/**
 * Half-lives in days, per isotope.
 *
 * The register is keyed by isotope rather than by source, because a half-life is a property of the
 * nuclide and not of the paperwork. A source record carrying its own half-life field is a source
 * record that can disagree with physics.
 */
export const HALF_LIVES_DAYS = {
  "Ir-192": 73.83,
  "Co-60": 1925.3,
  "Cs-137": 11018.3,
  "I-125": 59.4,
  "Mo-99": 2.75,
  "Tc-99m": 0.2504,
  "F-18": 0.07625,
  "Y-90": 2.67,
  "Lu-177": 6.65,
  "Ra-223": 11.43,
};

/** Sealed sources need a wipe test at this interval; past it, custody is not evidenced. */
const LEAK_TEST_INTERVAL_DAYS = 730;

/** Lead PPE needs a fluoroscopic integrity check at this interval. */
const PPE_CHECK_INTERVAL_DAYS = 365;

/**
 * Fluoroscopy peak skin dose thresholds, in gray.
 *
 * Above 2 Gy deterministic skin effects become possible and the patient needs to be told what to
 * look for; above 5 Gy a follow-up is mandated rather than advised. These are the only patient
 * numbers on the page that are about a specific individual rather than about a population average,
 * which is why they are tracked per case.
 */
const PEAK_SKIN_DOSE = { advisory: 2, mandatory: 5 };

/* ------------------------------------------------------------------ */
/*  Seed data                                                          */
/* ------------------------------------------------------------------ */

/**
 * Dosimetry records for the current wear period.
 *
 * `returned: false` on RP-2207 is the most important row here. A badge that was not handed back
 * produces no dose, and the console must say *no dose was measured* rather than render 0.00 mSv.
 * Those two are opposite findings and a dashboard that draws them identically is actively harmful.
 */
const DOSIMETRY = [
  { id: "RP-2201", name: "Dr A. Whitfield", role: "Interventional cardiologist", classified: true, department: "Cath lab", wholeBodyMsv: 4.9, lensMsv: 7.2, extremityMsv: 62, daysElapsed: 120, returned: true, leadedEyewear: false },
  { id: "RP-2202", name: "Dr M. Okonjo", role: "Interventional radiologist", classified: true, department: "IR suite", wholeBodyMsv: 3.1, lensMsv: 4.4, extremityMsv: 88, daysElapsed: 120, returned: true, leadedEyewear: true },
  { id: "RP-2203", name: "S. Kaur", role: "Radiographer", classified: false, department: "Plain film", wholeBodyMsv: 0.2, lensMsv: 0.1, extremityMsv: 1, daysElapsed: 120, returned: true, leadedEyewear: true },
  { id: "RP-2204", name: "T. Nkemelu", role: "Nuclear medicine technologist", classified: true, department: "Nuclear medicine", wholeBodyMsv: 2.8, lensMsv: 1.9, extremityMsv: 141, daysElapsed: 120, returned: true, leadedEyewear: true },
  { id: "RP-2205", name: "Dr H. Ferreira", role: "Cardiologist", classified: true, department: "Cath lab", wholeBodyMsv: 8.4, lensMsv: 11.6, extremityMsv: 96, daysElapsed: 120, returned: true, leadedEyewear: false },
  { id: "RP-2206", name: "J. Lindholm", role: "Theatre scrub nurse", classified: false, department: "Theatres", wholeBodyMsv: 1.4, lensMsv: 2.1, extremityMsv: 19, daysElapsed: 120, returned: true, leadedEyewear: false },
  { id: "RP-2207", name: "Dr P. Ramanathan", role: "Orthopaedic surgeon", classified: false, department: "Theatres", wholeBodyMsv: null, lensMsv: null, extremityMsv: null, daysElapsed: 120, returned: false, leadedEyewear: false },
  { id: "RP-2208", name: "C. Bianchi", role: "Brachytherapy physicist", classified: true, department: "Radiotherapy", wholeBodyMsv: 1.1, lensMsv: 0.8, extremityMsv: 212, daysElapsed: 120, returned: true, leadedEyewear: true },
  { id: "RP-2209", name: "Dr L. Andersson", role: "Cardiology registrar", classified: true, department: "Cath lab", wholeBodyMsv: 2.2, lensMsv: 3.9, extremityMsv: 34, daysElapsed: 44, returned: true, leadedEyewear: true },
  { id: "RP-2210", name: "R. Mbeki", role: "Radiopharmacy technician", classified: true, department: "Radiopharmacy", wholeBodyMsv: 1.9, lensMsv: 1.2, extremityMsv: 318, daysElapsed: 120, returned: true, leadedEyewear: true },
];

/**
 * Sealed source register.
 *
 * `certificateActivityMbq` and `referenceDateDays` are the only activity facts stored. The number
 * anybody uses is derived from them, because a register that quotes the certificate figure has been
 * wrong since the day it was issued.
 */
const SOURCES = [
  { id: "SRC-HDR-01", description: "HDR afterloader source", isotope: "Ir-192", certificateActivityMbq: 370_000, referenceDateDays: 88, location: "Brachytherapy suite", custodian: "C. Bianchi", lastLeakTestDays: 130, sealedIntegrity: "Intact" },
  { id: "SRC-HDR-02", description: "HDR afterloader source (spare)", isotope: "Ir-192", certificateActivityMbq: 370_000, referenceDateDays: 295, location: "Brachytherapy store", custodian: "C. Bianchi", lastLeakTestDays: 300, sealedIntegrity: "Intact" },
  { id: "SRC-CAL-01", description: "Dose calibrator reference", isotope: "Cs-137", certificateActivityMbq: 18.5, referenceDateDays: 4_015, location: "Nuclear medicine", custodian: "T. Nkemelu", lastLeakTestDays: 410, sealedIntegrity: "Intact" },
  { id: "SRC-CAL-02", description: "Gamma camera flood source", isotope: "Co-60", certificateActivityMbq: 74, referenceDateDays: 2_190, location: "Nuclear medicine", custodian: "T. Nkemelu", lastLeakTestDays: 812, sealedIntegrity: "Intact" },
  { id: "SRC-SEED-14", description: "Prostate seed train", isotope: "I-125", certificateActivityMbq: 21.6, referenceDateDays: 61, location: "Theatre 6 safe", custodian: "C. Bianchi", lastLeakTestDays: 40, sealedIntegrity: "Intact" },
  { id: "SRC-GEN-09", description: "Mo/Tc generator", isotope: "Mo-99", certificateActivityMbq: 37_000, referenceDateDays: 6, location: "Radiopharmacy", custodian: "R. Mbeki", lastLeakTestDays: 12, sealedIntegrity: "Intact" },
  { id: "SRC-THR-03", description: "Radium-223 therapy vial", isotope: "Ra-223", certificateActivityMbq: 6.6, referenceDateDays: 22, location: "Radiopharmacy safe", custodian: "R. Mbeki", lastLeakTestDays: 22, sealedIntegrity: "Intact" },
  { id: "SRC-CHK-05", description: "Contamination monitor check source", isotope: "Sr-90", certificateActivityMbq: 3.7, referenceDateDays: 1_100, location: "Nuclear medicine", custodian: "T. Nkemelu", lastLeakTestDays: 190, sealedIntegrity: "Intact" },
  { id: "SRC-CHK-06", description: "Well counter check source", isotope: "Cs-137", certificateActivityMbq: 9.25, referenceDateDays: null, location: "Radiopharmacy", custodian: "R. Mbeki", lastLeakTestDays: 88, sealedIntegrity: "Intact" },
  { id: "SRC-DEC-11", description: "Decommissioned teletherapy head", isotope: "Co-60", certificateActivityMbq: 185_000, referenceDateDays: 8_030, location: "Sealed store", custodian: "Estates RPS", lastLeakTestDays: 900, sealedIntegrity: "Wipe test positive" },
];

/**
 * National diagnostic reference levels, per exam.
 *
 * Per exam, because a single global threshold is meaningless: an interventional embolisation and a
 * chest radiograph differ by four orders of magnitude and both are entirely routine.
 */
const DRL_TABLE = {
  "CT head": { value: 60, unit: "mGy", metric: "CTDIvol" },
  "CT chest": { value: 12, unit: "mGy", metric: "CTDIvol" },
  "CT abdomen-pelvis": { value: 15, unit: "mGy", metric: "CTDIvol" },
  "Chest radiograph": { value: 0.15, unit: "Gy·cm²", metric: "DAP" },
  "Abdominal radiograph": { value: 2.5, unit: "Gy·cm²", metric: "DAP" },
  "Coronary angiography": { value: 29, unit: "Gy·cm²", metric: "DAP" },
  "PCI": { value: 50, unit: "Gy·cm²", metric: "DAP" },
  "Hepatic embolisation": { value: 180, unit: "Gy·cm²", metric: "DAP" },
  "Barium swallow": { value: 11, unit: "Gy·cm²", metric: "DAP" },
};

const EXAMS = [
  { id: "EX-88401", exam: "CT head", room: "CT 1", patient: "PT-6601", doseValue: 54, peakSkinGy: null, operator: "S. Kaur", daysAgo: 0 },
  { id: "EX-88402", exam: "CT chest", room: "CT 2", patient: "PT-6612", doseValue: 19, peakSkinGy: null, operator: "S. Kaur", daysAgo: 0 },
  { id: "EX-88403", exam: "CT abdomen-pelvis", room: "CT 1", patient: "PT-6620", doseValue: 14, peakSkinGy: null, operator: "S. Kaur", daysAgo: 1 },
  { id: "EX-88404", exam: "Coronary angiography", room: "Cath 1", patient: "PT-6633", doseValue: 26, peakSkinGy: 0.9, operator: "Dr A. Whitfield", daysAgo: 1 },
  { id: "EX-88405", exam: "PCI", room: "Cath 1", patient: "PT-6641", doseValue: 84, peakSkinGy: 3.1, operator: "Dr H. Ferreira", daysAgo: 1 },
  { id: "EX-88406", exam: "Hepatic embolisation", room: "IR 1", patient: "PT-6650", doseValue: 240, peakSkinGy: 5.8, operator: "Dr M. Okonjo", daysAgo: 2 },
  { id: "EX-88407", exam: "Chest radiograph", room: "DR 3", patient: "PT-6661", doseValue: 0.11, peakSkinGy: null, operator: "S. Kaur", daysAgo: 2 },
  { id: "EX-88408", exam: "Barium swallow", room: "Fluoro 1", patient: "PT-6670", doseValue: 15, peakSkinGy: 0.4, operator: "S. Kaur", daysAgo: 3 },
  { id: "EX-88409", exam: "Cone beam CT", room: "Theatre 6", patient: "PT-6688", doseValue: 8, peakSkinGy: null, operator: "Dr P. Ramanathan", daysAgo: 3 },
  { id: "EX-88410", exam: "PCI", room: "Cath 2", patient: "PT-6699", doseValue: 41, peakSkinGy: 2.4, operator: "Dr L. Andersson", daysAgo: 4 },
];

const PPE = [
  { id: "PPE-1101", kind: "Full-wrap apron", leadEquivMm: 0.5, location: "Cath lab 1", holder: "Peg 3", lastCheckedDays: 88, defects: [], wearer: "Shared" },
  { id: "PPE-1102", kind: "Full-wrap apron", leadEquivMm: 0.5, location: "Cath lab 1", holder: "Peg 4", lastCheckedDays: 420, defects: [], wearer: "Shared" },
  { id: "PPE-1103", kind: "Front apron", leadEquivMm: 0.35, location: "Theatre 6", holder: "Rail A", lastCheckedDays: 190, defects: ["12 mm crack, left shoulder seam"], wearer: "Shared" },
  { id: "PPE-1104", kind: "Thyroid shield", leadEquivMm: 0.5, location: "Cath lab 1", holder: "Peg 3", lastCheckedDays: 88, defects: [], wearer: "Dr A. Whitfield" },
  { id: "PPE-1105", kind: "Thyroid shield", leadEquivMm: 0.5, location: "IR suite", holder: "Rail B", lastCheckedDays: 44, defects: [], wearer: "Dr M. Okonjo" },
  { id: "PPE-1106", kind: "Leaded eyewear", leadEquivMm: 0.75, location: "IR suite", holder: "Rail B", lastCheckedDays: 44, defects: [], wearer: "Dr M. Okonjo" },
  { id: "PPE-1107", kind: "Mobile screen", leadEquivMm: 2.0, location: "Cath lab 2", holder: "Bay", lastCheckedDays: 610, defects: ["Delamination, lower panel"], wearer: "Shared" },
  { id: "PPE-1108", kind: "Full-wrap apron", leadEquivMm: 0.35, location: "Nuclear medicine", holder: "Peg 1", lastCheckedDays: 120, defects: [], wearer: "T. Nkemelu" },
  { id: "PPE-1109", kind: "Ceiling-suspended shield", leadEquivMm: 0.5, location: "Cath lab 1", holder: "Ceiling", lastCheckedDays: 300, defects: [], wearer: "Shared" },
  { id: "PPE-1110", kind: "Leaded eyewear", leadEquivMm: 0.75, location: "Cath lab 1", holder: "Peg 3", lastCheckedDays: 500, defects: ["Scratched right lens"], wearer: "Shared" },
];

/* ------------------------------------------------------------------ */
/*  Physics and regulatory calculations                                */
/* ------------------------------------------------------------------ */

/**
 * Activity decayed from the certificate figure to today.
 *
 *   A(t) = A0 x 2^(-t / T_half)
 *
 * Every sealed source register I have seen keeps quoting the certificate activity. It has been
 * wrong since the day it was issued, and for the short-lived isotopes it is wrong by a factor: an
 * Ir-192 HDR source at eight half-lives is at 0.4% of its certificate figure, and a treatment time
 * calculated from the certificate is a treatment that does not happen.
 *
 * The half-life is taken per isotope rather than per source record, because a half-life is a
 * property of the nuclide and a source record carrying its own can disagree with physics.
 *
 * Two states return a refusal instead of a number:
 *
 *   - no reference date, so there is nothing to decay from. A register entry that says
 *     "approximately" has stopped being a record;
 *   - an isotope with no half-life in the table, where guessing would produce a confident figure
 *     for a nuclide nobody has characterised.
 *
 * @returns {{activityMbq: number|null, halfLivesElapsed: number|null, refusal: string|null}}
 */
export function decayedActivity(source) {
  const halfLife = HALF_LIVES_DAYS[source.isotope];
  if (halfLife == null) {
    return {
      activityMbq: null, halfLivesElapsed: null,
      refusal: `No half-life is held for ${source.isotope}, so the certificate activity cannot be decayed. Guessing one produces a confident figure for a nuclide nobody has characterised.`,
    };
  }
  if (source.referenceDateDays == null || !Number.isFinite(source.referenceDateDays)) {
    return {
      activityMbq: null, halfLivesElapsed: null,
      refusal: "No certificate reference date, so there is nothing to decay from. The certificate activity alone is a number without a time attached to it.",
    };
  }

  const halfLivesElapsed = source.referenceDateDays / halfLife;
  const activityMbq = source.certificateActivityMbq * Math.pow(2, -halfLivesElapsed);
  return {
    activityMbq: Math.round(activityMbq * 1000) / 1000,
    halfLivesElapsed: Math.round(halfLivesElapsed * 100) / 100,
    refusal: null,
  };
}

/** Percentage of the certificate activity remaining, for the bar on the card. */
export function remainingPct(source) {
  const decayed = decayedActivity(source);
  if (decayed.activityMbq == null || !source.certificateActivityMbq) return null;
  return Math.round((decayed.activityMbq / source.certificateActivityMbq) * 1000) / 10;
}

/** Faults on a source, with sealed integrity ahead of the paperwork clocks. */
export function sourceFaults(source) {
  const faults = [];
  if (source.sealedIntegrity !== "Intact") {
    faults.push({ code: "INTEGRITY", tone: "red", text: `Sealed integrity: ${source.sealedIntegrity}. The source is a contamination event until proven otherwise, and the leak-test clock is beside the point.` });
  }
  if (source.lastLeakTestDays > LEAK_TEST_INTERVAL_DAYS) {
    faults.push({ code: "LEAK", tone: "red", text: `Wipe test last performed ${source.lastLeakTestDays} days ago, past the ${LEAK_TEST_INTERVAL_DAYS} day interval. Containment is unevidenced rather than known to be intact.` });
  } else if (source.lastLeakTestDays > LEAK_TEST_INTERVAL_DAYS - 90) {
    faults.push({ code: "LEAK-SOON", tone: "amber", text: `Wipe test due within ${LEAK_TEST_INTERVAL_DAYS - source.lastLeakTestDays} days.` });
  }
  const decayed = decayedActivity(source);
  if (decayed.refusal) {
    faults.push({ code: "NO-DECAY", tone: "amber", text: decayed.refusal });
  }
  return faults;
}

/**
 * Project a dose to the end of the calendar year and grade it against the IRR17 limits.
 *
 *   projected = dose_to_date x (365 / days_elapsed)
 *
 * A report in month four saying 6 mSv is not something anybody can act on, because the limit is
 * defined over a year. The projection is the number that turns a reading into a decision, and it is
 * deliberately linear: it says "at this rate", not "we predict".
 *
 * The unreturned badge is the case that matters. It returns `measured: false` and no doses at all,
 * because *no dose was measured* and *a dose of zero was measured* are opposite findings. A
 * dashboard that renders them identically is worse than one that omits the worker, since an
 * unreturned badge is the only state in which a worker's dose is genuinely unknown and a blank cell
 * reads as a good result.
 *
 * @returns {{measured: boolean, refusal: string|null, rows: Array}}
 */
export function doseAssessment(record) {
  if (!record.returned) {
    return {
      measured: false,
      refusal:
        "Dosimeter was not returned for this wear period, so no dose was measured. This is not a dose of zero — it is the one state in which this worker's dose is genuinely unknown, and a blank cell reads as a good result.",
      rows: [],
    };
  }

  if (!record.daysElapsed || record.daysElapsed <= 0) {
    return {
      measured: false,
      refusal: "Wear period has no elapsed days, so a dose cannot be projected to year end without dividing by zero.",
      rows: [],
    };
  }

  const rows = Object.entries(DOSE_LIMITS).map(([key, meta]) => {
    const measuredMsv = record[`${key}Msv`];
    if (measuredMsv == null) {
      return { key, ...meta, measuredMsv: null, projectedMsv: null, pctOfLimit: null, status: "Not measured", tone: "amber" };
    }
    const projectedMsv = Math.round(measuredMsv * (365 / record.daysElapsed) * 10) / 10;
    const pctOfLimit = Math.round((projectedMsv / meta.limit) * 1000) / 10;
    const status =
      projectedMsv >= meta.limit ? "Over limit"
        : projectedMsv >= meta.limit * INVESTIGATION_FRACTION ? "Investigation level"
          : "Within limit";
    const tone = status === "Over limit" ? "red" : status === "Investigation level" ? "amber" : "green";
    return { key, ...meta, measuredMsv, projectedMsv, pctOfLimit, status, tone };
  });

  return { measured: true, refusal: null, rows };
}

/**
 * The lens finding, surfaced separately because it is the control most often missed.
 *
 * ICRP 118 cut the lens limit from 150 mSv/year to 20, and a lot of departments still hold a mental
 * model calibrated to the old number - under which 40 mSv to the lens was unremarkable. An operator
 * projecting past the limit without leaded eyewear is a specific, cheap, immediately fixable finding
 * rather than a statistic, so it is stated as one.
 */
export function lensFinding(record) {
  const assessment = doseAssessment(record);
  if (!assessment.measured) return null;
  const lens = assessment.rows.find((r) => r.key === "lens");
  if (!lens || lens.projectedMsv == null) return null;
  if (lens.status === "Within limit" && record.leadedEyewear) return null;
  if (lens.status === "Within limit") return null;

  return {
    projectedMsv: lens.projectedMsv,
    tone: lens.tone,
    eyewear: record.leadedEyewear,
    text: record.leadedEyewear
      ? `Lens projecting to ${lens.projectedMsv} mSv against the 20 mSv limit, with leaded eyewear already in use. The remaining exposure is geometry — screen position and table height — rather than PPE.`
      : `Lens projecting to ${lens.projectedMsv} mSv against the 20 mSv limit, and no leaded eyewear is issued. The limit was cut from 150 to 20 mSv and this is the control most often missed when it was.`,
  };
}

/**
 * Compare one exam against the DRL for that exam.
 *
 * Per exam rather than against a single threshold: an interventional embolisation and a chest
 * radiograph differ by four orders of magnitude and both are entirely routine. An exam with no
 * published DRL is reported as having none rather than being silently passed, because "no DRL" and
 * "under the DRL" look identical on a dashboard and mean opposite things about how much is known.
 */
export function drlComparison(exam) {
  const drl = DRL_TABLE[exam.exam];
  if (!drl) {
    return {
      hasDrl: false, ratio: null, status: "No published DRL",
      note: `No national DRL is published for ${exam.exam}, so the dose is recorded rather than compared. "No DRL" and "under the DRL" look identical on a dashboard and mean opposite things.`,
    };
  }
  const ratio = Math.round((exam.doseValue / drl.value) * 100) / 100;
  const status = ratio > 1.5 ? "Well above DRL" : ratio > 1 ? "Above DRL" : "At or below DRL";
  return {
    hasDrl: true, ratio, status, drl,
    note: `${exam.doseValue} ${drl.unit} against a DRL of ${drl.value} ${drl.unit} (${drl.metric}).`,
  };
}

/** Deterministic-effect follow-up triggered by peak skin dose, which is per-patient rather than population. */
export function skinDoseAction(exam) {
  if (exam.peakSkinGy == null) return null;
  if (exam.peakSkinGy >= PEAK_SKIN_DOSE.mandatory) {
    return { tone: "red", text: `Peak skin dose ${exam.peakSkinGy} Gy is at or above ${PEAK_SKIN_DOSE.mandatory} Gy. Clinical follow-up is mandated, and the patient is told what to look for and when.` };
  }
  if (exam.peakSkinGy >= PEAK_SKIN_DOSE.advisory) {
    return { tone: "amber", text: `Peak skin dose ${exam.peakSkinGy} Gy is above ${PEAK_SKIN_DOSE.advisory} Gy. Deterministic skin effects are possible; record the dose in the notes and advise the patient.` };
  }
  return null;
}

/** PPE faults: a defect first, then a lapsed integrity check. */
export function ppeFaults(item) {
  const faults = [];
  if (item.defects.length > 0) {
    faults.push({ code: "DEFECT", tone: "red", text: `${item.defects.join("; ")}. A cracked apron attenuates where the lead is and nowhere else, and it feels exactly like an intact one.` });
  }
  if (item.lastCheckedDays > PPE_CHECK_INTERVAL_DAYS) {
    faults.push({ code: "CHECK", tone: "amber", text: `Fluoroscopic integrity check ${item.lastCheckedDays - PPE_CHECK_INTERVAL_DAYS} days overdue.` });
  }
  return faults;
}

/* ------------------------------------------------------------------ */
/*  Simulation                                                         */
/* ------------------------------------------------------------------ */

/** Advances the wear period and lets the sources decay, which is the only honest way to show them. */
function useRadiationSimulation({ dosimetryRef, sourcesRef, toast }) {
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

      dosimetryRef.current = dosimetryRef.current.map((record) => {
        if (!record.returned) return { ...record, daysElapsed: record.daysElapsed + step };
        const rate = record.wholeBodyMsv / Math.max(1, record.daysElapsed);
        return {
          ...record,
          daysElapsed: record.daysElapsed + step,
          wholeBodyMsv: Math.round((record.wholeBodyMsv + rate * step) * 100) / 100,
          lensMsv: Math.round((record.lensMsv + rate * 1.4 * step) * 100) / 100,
          extremityMsv: Math.round((record.extremityMsv + rate * 12 * step) * 10) / 10,
        };
      });

      sourcesRef.current = sourcesRef.current.map((source) => ({
        ...source,
        referenceDateDays: source.referenceDateDays == null ? null : source.referenceDateDays + step,
        lastLeakTestDays: source.lastLeakTestDays + step,
      }));

      setTick((t) => t + 1);
    }, 1600);

    return () => clearInterval(interval);
  }, [dosimetryRef, sourcesRef, toast]);

  return {
    running, setRunning, speed, setSpeed, tick,
    reset: () => {
      dosimetryRef.current = DOSIMETRY.map((d) => ({ ...d }));
      sourcesRef.current = SOURCES.map((s) => ({ ...s }));
      setTick(0);
      toast("Radiation safety console reset to baseline", "Low");
    },
  };
}

/* ------------------------------------------------------------------ */
/*  Main page                                                          */
/* ------------------------------------------------------------------ */

export default function RadiationSafetyDosimetryHub() {
  const [tab, setTab] = useState("dosimetry");
  const [modal, setModal] = useState(null);
  const [query, setQuery] = useState("");
  const [doseFilter, setDoseFilter] = useState("All");
  const [sourceFilter, setSourceFilter] = useState("All");
  const [examFilter, setExamFilter] = useState("All");
  const [ppeFilter, setPpeFilter] = useState("All");

  const [toasts, setToasts] = useState([]);
  const toast = useCallback((message, severity = "Low") => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((current) => [...current.slice(-4), { id, message, severity }]);
    setTimeout(() => setToasts((current) => current.filter((t) => t.id !== id)), 4200);
  }, []);

  const [dosimetry, setDosimetry] = useState(() => DOSIMETRY.map((d) => ({ ...d })));
  const [sources, setSources] = useState(() => SOURCES.map((s) => ({ ...s })));
  const [exams, setExams] = useState(() => EXAMS.map((e) => ({ ...e })));
  const [ppe, setPpe] = useState(() => PPE.map((p) => ({ ...p, defects: [...p.defects] })));

  const dosimetryRef = useRef(dosimetry);
  const sourcesRef = useRef(sources);

  useEffect(() => { dosimetryRef.current = dosimetry; }, [dosimetry]);
  useEffect(() => { sourcesRef.current = sources; }, [sources]);

  const sim = useRadiationSimulation({ dosimetryRef, sourcesRef, toast });

  useEffect(() => {
    setDosimetry([...dosimetryRef.current]);
    setSources([...sourcesRef.current]);
  }, [sim.tick]);

  /* ---------- derived ---------- */

  const assessments = useMemo(
    () => dosimetry.map((record) => ({ record, ...doseAssessment(record), lens: lensFinding(record) })),
    [dosimetry]
  );

  const decayed = useMemo(
    () => sources.map((source) => ({ source, decay: decayedActivity(source), faults: sourceFaults(source), remaining: remainingPct(source) })),
    [sources]
  );

  const comparisons = useMemo(
    () => exams.map((exam) => ({ exam, drl: drlComparison(exam), skin: skinDoseAction(exam) })),
    [exams]
  );

  const stats = useMemo(() => {
    const overLimit = assessments.filter((a) => a.measured && a.rows.some((r) => r.status === "Over limit")).length;
    const notMeasured = assessments.filter((a) => !a.measured).length;
    const sourcesFaulted = decayed.filter((d) => d.faults.some((f) => f.tone === "red")).length;
    const aboveDrl = comparisons.filter((c) => c.drl.hasDrl && c.drl.ratio > 1).length;
    return { overLimit, notMeasured, sourcesFaulted, aboveDrl };
  }, [assessments, decayed, comparisons]);

  const filteredAssessments = useMemo(() => {
    const q = query.toLowerCase();
    return assessments.filter((entry) => {
      const { record } = entry;
      const matchesQuery = !q || [record.id, record.name, record.role, record.department].some((f) => String(f).toLowerCase().includes(q));
      if (!matchesQuery) return false;
      if (doseFilter === "All") return true;
      if (doseFilter === "Over limit") return entry.measured && entry.rows.some((r) => r.status === "Over limit");
      if (doseFilter === "Investigation") return entry.measured && entry.rows.some((r) => r.status === "Investigation level");
      if (doseFilter === "Not measured") return !entry.measured;
      return record.classified;
    });
  }, [assessments, query, doseFilter]);

  const filteredSources = useMemo(() => {
    const q = query.toLowerCase();
    return decayed.filter((entry) => {
      const { source } = entry;
      const matchesQuery = !q || [source.id, source.description, source.isotope, source.location, source.custodian].some((f) => String(f).toLowerCase().includes(q));
      if (!matchesQuery) return false;
      if (sourceFilter === "All") return true;
      if (sourceFilter === "Faulted") return entry.faults.some((f) => f.tone === "red");
      if (sourceFilter === "Not decayable") return entry.decay.refusal != null;
      return source.isotope === sourceFilter;
    });
  }, [decayed, query, sourceFilter]);

  const filteredExams = useMemo(() => {
    const q = query.toLowerCase();
    return comparisons.filter((entry) => {
      const { exam } = entry;
      const matchesQuery = !q || [exam.id, exam.exam, exam.room, exam.patient, exam.operator].some((f) => String(f).toLowerCase().includes(q));
      if (!matchesQuery) return false;
      if (examFilter === "All") return true;
      if (examFilter === "Above DRL") return entry.drl.hasDrl && entry.drl.ratio > 1;
      if (examFilter === "No DRL") return !entry.drl.hasDrl;
      if (examFilter === "Skin dose") return entry.skin != null;
      return true;
    });
  }, [comparisons, query, examFilter]);

  const filteredPpe = useMemo(() => {
    const q = query.toLowerCase();
    return ppe.filter((item) => {
      const matchesQuery = !q || [item.id, item.kind, item.location, item.wearer].some((f) => String(f).toLowerCase().includes(q));
      if (!matchesQuery) return false;
      if (ppeFilter === "All") return true;
      if (ppeFilter === "Withdrawn") return item.defects.length > 0;
      if (ppeFilter === "Check overdue") return item.lastCheckedDays > PPE_CHECK_INTERVAL_DAYS;
      return item.kind === ppeFilter;
    });
  }, [ppe, query, ppeFilter]);

  /* ---------- actions ---------- */

  const issueBadge = (id) => {
    setDosimetry((current) =>
      current.map((r) => (r.id === id ? { ...r, returned: true, wholeBodyMsv: 0, lensMsv: 0, extremityMsv: 0, daysElapsed: 1 } : r))
    );
    toast(`${id} issued a replacement dosimeter — new wear period started`, "Medium");
  };

  const issueEyewear = (id) => {
    setDosimetry((current) => current.map((r) => (r.id === id ? { ...r, leadedEyewear: true } : r)));
    toast(`${id} issued leaded eyewear`, "Low");
  };

  const recordLeakTest = (id) => {
    setSources((current) => current.map((s) => (s.id === id ? { ...s, lastLeakTestDays: 0 } : s)));
    toast(`${id} wipe test recorded — containment evidenced`, "Low");
  };

  const quarantineSource = (id) => {
    setSources((current) => current.map((s) => (s.id === id ? { ...s, location: "Quarantine safe", custodian: "RPS" } : s)));
    toast(`${id} moved to the quarantine safe pending RPA review`, "High");
  };

  const withdrawPpe = (id) => {
    setPpe((current) => current.filter((p) => p.id !== id));
    toast(`${id} withdrawn from service`, "Medium");
  };

  const recordPpeCheck = (id) => {
    setPpe((current) => current.map((p) => (p.id === id ? { ...p, lastCheckedDays: 0 } : p)));
    toast(`${id} fluoroscopic integrity check recorded`, "Low");
  };

  const exportCsv = () => {
    const table =
      tab === "dosimetry"
        ? [
            ["ID", "Name", "Role", "Department", "Classified", "Days elapsed", "Badge returned", "Whole body (mSv)", "Projected", "Lens (mSv)", "Projected", "Extremity (mSv)", "Projected", "Worst status"],
            ...filteredAssessments.map((a) => {
              const find = (k) => a.rows.find((r) => r.key === k) || {};
              const worst = !a.measured ? "Not measured" : a.rows.some((r) => r.status === "Over limit") ? "Over limit" : a.rows.some((r) => r.status === "Investigation level") ? "Investigation level" : "Within limit";
              return [
                a.record.id, a.record.name, a.record.role, a.record.department, a.record.classified, a.record.daysElapsed, a.record.returned,
                find("wholeBody").measuredMsv ?? "not measured", find("wholeBody").projectedMsv ?? "—",
                find("lens").measuredMsv ?? "not measured", find("lens").projectedMsv ?? "—",
                find("extremity").measuredMsv ?? "not measured", find("extremity").projectedMsv ?? "—",
                worst,
              ];
            }),
          ]
        : tab === "sources"
          ? [
              ["ID", "Description", "Isotope", "Certificate (MBq)", "Reference (d ago)", "Half-lives elapsed", "Activity today (MBq)", "Remaining %", "Location", "Custodian", "Leak test (d)", "Integrity"],
              ...filteredSources.map((d) => [
                d.source.id, d.source.description, d.source.isotope, d.source.certificateActivityMbq,
                d.source.referenceDateDays ?? "none", d.decay.halfLivesElapsed ?? "—",
                d.decay.activityMbq ?? "not decayable", d.remaining ?? "—",
                d.source.location, d.source.custodian, d.source.lastLeakTestDays, d.source.sealedIntegrity,
              ]),
            ]
          : tab === "exams"
            ? [
                ["ID", "Exam", "Room", "Patient", "Operator", "Dose", "DRL", "Ratio", "Status", "Peak skin (Gy)"],
                ...filteredExams.map((c) => [
                  c.exam.id, c.exam.exam, c.exam.room, c.exam.patient, c.exam.operator, c.exam.doseValue,
                  c.drl.hasDrl ? c.drl.drl.value : "none published", c.drl.ratio ?? "—", c.drl.status, c.exam.peakSkinGy ?? "—",
                ]),
              ]
            : [
                ["ID", "Kind", "Lead equiv (mm)", "Location", "Holder", "Wearer", "Last checked (d)", "Defects"],
                ...filteredPpe.map((p) => [p.id, p.kind, p.leadEquivMm, p.location, p.holder, p.wearer, p.lastCheckedDays, p.defects.join("; ") || "none"]),
              ];

    downloadCsv(`radiation-${tab}.csv`, table);
    toast("CSV export downloaded", "Low");
  };

  const tabs = [
    { id: "dosimetry", label: "Staff Dosimetry", icon: UserCheck },
    { id: "sources", label: "Source Inventory", icon: Atom },
    { id: "exams", label: "Patient Dose & DRLs", icon: ScanLine },
    { id: "ppe", label: "Protection PPE", icon: ShieldCheck },
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
              <Radiation size={24} className="text-emerald-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-100">Radiation Safety &amp; Dosimetry Hub</h1>
              <p className="mt-0.5 text-xs text-slate-400">
                Staff dose · sealed sources · diagnostic reference levels · lead PPE — IRR17, IR(ME)R 2017, ICRP 103/118
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
          <StatCard icon={ShieldAlert} label="Projecting Over Limit" value={stats.overLimit} sub="whole body, lens or extremity" accent={stats.overLimit > 0 ? "text-red-400" : "text-emerald-400"} />
          <StatCard icon={Info} label="Dose Not Measured" value={stats.notMeasured} sub="badge not returned — not zero" accent={stats.notMeasured > 0 ? "text-amber-400" : "text-emerald-400"} />
          <StatCard icon={Atom} label="Sources Faulted" value={stats.sourcesFaulted} sub={`${sources.length}-source sealed register`} accent={stats.sourcesFaulted > 0 ? "text-red-400" : "text-emerald-400"} />
          <StatCard icon={ScanLine} label="Exams Above DRL" value={stats.aboveDrl} sub="against the DRL for that exam" accent={stats.aboveDrl > 0 ? "text-amber-400" : "text-emerald-400"} />
        </div>

        <TabsBar tabs={tabs} active={tab} onChange={setTab} />

        {/* toolbar */}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <CompactSearch value={query} onChange={setQuery} placeholder="Search workers, sources, exams, PPE…" />
          {tab === "dosimetry" && <FilterChips options={["All", "Over limit", "Investigation", "Not measured", "Classified"]} value={doseFilter} onChange={setDoseFilter} />}
          {tab === "sources" && <FilterChips options={["All", "Faulted", "Not decayable", "Ir-192", "Cs-137"]} value={sourceFilter} onChange={setSourceFilter} />}
          {tab === "exams" && <FilterChips options={["All", "Above DRL", "No DRL", "Skin dose"]} value={examFilter} onChange={setExamFilter} />}
          {tab === "ppe" && <FilterChips options={["All", "Withdrawn", "Check overdue", "Leaded eyewear"]} value={ppeFilter} onChange={setPpeFilter} />}
        </div>
      </header>

      <main className="px-6 py-6">
        {/* ============================= STAFF DOSIMETRY ============================= */}
        {tab === "dosimetry" && (
          <section>
            <div className="mb-4 rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
              <p className="flex items-start gap-2 text-[11px] leading-relaxed text-slate-400">
                <Info size={14} className="mt-0.5 shrink-0 text-sky-400" />
                <span>
                  A reading in month four is not something anybody can act on, because the limit is defined over a year — so each dose
                  is projected linearly to year end and graded there. The investigation level sits at{" "}
                  {Math.round(INVESTIGATION_FRACTION * 10)}/10 of the limit and is shown separately, because a worker at 40% of a limit
                  is in breach of nothing and is still the most useful row on the page: the point of an investigation level is to act
                  while there is a year left to act in.
                </span>
              </p>
            </div>

            {filteredAssessments.length === 0 ? (
              <EmptyState icon={UserCheck} message="No workers match the current filters." />
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {filteredAssessments.map((entry) => {
                  const { record, measured, refusal, rows, lens } = entry;
                  const over = rows.some((r) => r.status === "Over limit");
                  return (
                    <article
                      key={record.id}
                      className={`rounded-2xl border bg-slate-900/70 p-4 ${over ? "border-red-500/40" : !measured ? "border-amber-500/40" : rows.some((r) => r.status === "Investigation level") ? "border-amber-500/30" : "border-slate-800"}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <button onClick={() => setModal({ kind: "dose", data: entry })} className="font-mono text-xs font-semibold text-emerald-300 hover:underline">
                            {record.id}
                          </button>
                          <p className="mt-0.5 truncate text-sm font-semibold text-slate-100">{record.name}</p>
                          <p className="text-[11px] text-slate-500">{record.role} · {record.department} · {record.classified ? "classified" : "non-classified"}</p>
                        </div>
                        <ToneBadge tone={over ? "red" : !measured ? "amber" : "green"}>
                          {!measured ? "Not measured" : over ? "Over limit" : rows.some((r) => r.status === "Investigation level") ? "Investigation" : "Within limit"}
                        </ToneBadge>
                      </div>

                      {!measured ? (
                        <p className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-2.5 text-[11px] leading-relaxed text-amber-200">
                          {refusal}
                        </p>
                      ) : (
                        <div className="mt-3 space-y-2">
                          {rows.map((row) => (
                            <div key={row.key} className="rounded-lg border border-slate-800 bg-slate-950/60 p-2.5">
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="text-slate-400">{row.label}</span>
                                <span className={row.tone === "red" ? "font-semibold text-red-300" : row.tone === "amber" ? "font-semibold text-amber-300" : "text-slate-300"}>
                                  {row.measuredMsv} → {row.projectedMsv} of {row.limit} {row.unit}
                                </span>
                              </div>
                              <div className="relative mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                                <div
                                  className={`h-full rounded-full ${row.tone === "red" ? "bg-red-400" : row.tone === "amber" ? "bg-amber-400" : "bg-emerald-400"}`}
                                  style={{ width: `${Math.min(100, row.pctOfLimit)}%` }}
                                />
                                <div className="absolute inset-y-0 w-px bg-sky-400" style={{ left: `${INVESTIGATION_FRACTION * 100}%` }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {lens && (
                        <p className={`mt-3 rounded-lg border p-2.5 text-[11px] leading-relaxed ${lens.tone === "red" ? "border-red-500/30 bg-red-500/5 text-red-200" : "border-amber-500/30 bg-amber-500/5 text-amber-200"}`}>
                          <Eye size={11} className="mr-1 inline" />
                          {lens.text}
                        </p>
                      )}

                      <div className="mt-3 flex gap-2">
                        {!measured && (
                          <button onClick={() => issueBadge(record.id)} className="flex-1 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-2 py-1.5 text-[11px] font-semibold text-emerald-300 hover:bg-emerald-500/20">
                            Issue replacement badge
                          </button>
                        )}
                        {lens && !lens.eyewear && (
                          <button onClick={() => issueEyewear(record.id)} className="flex-1 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-2 py-1.5 text-[11px] font-semibold text-emerald-300 hover:bg-emerald-500/20">
                            Issue leaded eyewear
                          </button>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* ============================= SOURCE INVENTORY ============================= */}
        {tab === "sources" && (
          <section>
            <div className="mb-4 rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
              <p className="flex items-start gap-2 text-[11px] leading-relaxed text-slate-400">
                <Info size={14} className="mt-0.5 shrink-0 text-sky-400" />
                <span>
                  The primary activity figure below is decayed to today by A(t) = A₀ × 2^(−t/T½), with the half-life taken per isotope
                  rather than per source record. The certificate figure is demoted to provenance because it has been wrong since the day
                  it was issued — an Ir-192 source at eight half-lives is at 0.4% of it.
                </span>
              </p>
            </div>

            {filteredSources.length === 0 ? (
              <EmptyState icon={Atom} message="No sources match the current filters." />
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {filteredSources.map((entry) => {
                  const { source, decay, faults, remaining } = entry;
                  const down = faults.some((f) => f.tone === "red");
                  return (
                    <article key={source.id} className={`rounded-2xl border bg-slate-900/70 p-4 ${down ? "border-red-500/40" : faults.length > 0 ? "border-amber-500/40" : "border-slate-800"}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <button onClick={() => setModal({ kind: "source", data: entry })} className="font-mono text-xs font-semibold text-emerald-300 hover:underline">
                            {source.id}
                          </button>
                          <p className="text-xs text-slate-200">{source.description}</p>
                          <p className="text-[11px] text-slate-500">{source.isotope} · {source.location}</p>
                        </div>
                        <ToneBadge tone={down ? "red" : faults.length > 0 ? "amber" : "green"}>
                          {source.sealedIntegrity === "Intact" ? source.isotope : "Contaminated"}
                        </ToneBadge>
                      </div>

                      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                        <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-2">
                          <p className="text-[10px] uppercase tracking-wide text-slate-500">Certificate</p>
                          <p className="text-sm font-bold text-slate-500 line-through">{source.certificateActivityMbq.toLocaleString()}</p>
                        </div>
                        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-2">
                          <p className="text-[10px] uppercase tracking-wide text-slate-500">Today</p>
                          <p className={`text-sm font-bold ${decay.activityMbq == null ? "text-amber-300" : "text-emerald-300"}`}>
                            {decay.activityMbq == null ? "—" : decay.activityMbq.toLocaleString()}
                          </p>
                        </div>
                        <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-2">
                          <p className="text-[10px] uppercase tracking-wide text-slate-500">Half-lives</p>
                          <p className="text-sm font-bold text-slate-100">{decay.halfLivesElapsed ?? "—"}</p>
                        </div>
                      </div>

                      {remaining != null && (
                        <div className="mt-3">
                          <div className="flex items-center justify-between text-[11px] text-slate-500">
                            <span>Remaining activity</span>
                            <span>{remaining}% of certificate</span>
                          </div>
                          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                            <div className="h-full rounded-full bg-emerald-400" style={{ width: `${Math.max(0.5, remaining)}%` }} />
                          </div>
                        </div>
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
                        <button onClick={() => recordLeakTest(source.id)} className="flex-1 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-2 py-1.5 text-[11px] font-semibold text-emerald-300 hover:bg-emerald-500/20">
                          Record wipe test
                        </button>
                        <button onClick={() => quarantineSource(source.id)} className="flex-1 rounded-md border border-slate-700 bg-slate-800/60 px-2 py-1.5 text-[11px] font-semibold text-slate-300 hover:bg-slate-800">
                          Quarantine
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* ============================= PATIENT DOSE & DRLs ============================= */}
        {tab === "exams" && (
          <section>
            {filteredExams.length === 0 ? (
              <EmptyState icon={ScanLine} message="No exams match the current filters." />
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/70">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-500">
                      <th className="px-4 py-3">Exam</th>
                      <th className="px-4 py-3">Room / operator</th>
                      <th className="px-4 py-3">Dose</th>
                      <th className="px-4 py-3">Against DRL</th>
                      <th className="px-4 py-3">Peak skin</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredExams.map((entry) => {
                      const { exam, drl, skin } = entry;
                      return (
                        <tr key={exam.id} className="border-b border-slate-800/60 last:border-0 hover:bg-slate-800/30">
                          <td className="px-4 py-3">
                            <button onClick={() => setModal({ kind: "exam", data: entry })} className="font-mono text-xs font-semibold text-emerald-300 hover:underline">
                              {exam.id}
                            </button>
                            <p className="text-xs text-slate-200">{exam.exam}</p>
                            <p className="text-[11px] text-slate-500">{exam.patient}</p>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-xs text-slate-300">{exam.room}</p>
                            <p className="text-[11px] text-slate-500">{exam.operator}</p>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-sm font-bold text-slate-100">
                              {exam.doseValue} {drl.hasDrl ? drl.drl.unit : ""}
                            </p>
                            {drl.hasDrl && <p className="text-[11px] text-slate-500">{drl.drl.metric}</p>}
                          </td>
                          <td className="px-4 py-3">
                            {drl.hasDrl ? (
                              <>
                                <ToneBadge tone={drl.ratio > 1.5 ? "red" : drl.ratio > 1 ? "amber" : "green"}>{drl.status}</ToneBadge>
                                <p className="mt-1 text-[11px] text-slate-500">×{drl.ratio} of {drl.drl.value}</p>
                              </>
                            ) : (
                              <ToneBadge tone="slate">No published DRL</ToneBadge>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {skin ? (
                              <span className={`text-xs font-semibold ${skin.tone === "red" ? "text-red-300" : "text-amber-300"}`}>
                                {exam.peakSkinGy} Gy
                              </span>
                            ) : (
                              <span className="text-xs text-slate-500">{exam.peakSkinGy ?? "—"}</span>
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

        {/* ============================= PROTECTION PPE ============================= */}
        {tab === "ppe" && (
          <section>
            {filteredPpe.length === 0 ? (
              <EmptyState icon={ShieldCheck} message="No protective equipment matches the current filters." />
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {filteredPpe.map((item) => {
                  const faults = ppeFaults(item);
                  const withdrawn = faults.some((f) => f.tone === "red");
                  return (
                    <article key={item.id} className={`rounded-2xl border bg-slate-900/70 p-4 ${withdrawn ? "border-red-500/40" : faults.length > 0 ? "border-amber-500/40" : "border-slate-800"}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-mono text-xs font-semibold text-emerald-300">{item.id}</p>
                          <p className="text-xs text-slate-200">{item.kind}</p>
                          <p className="text-[11px] text-slate-500">{item.leadEquivMm} mm Pb · {item.location} · {item.holder}</p>
                        </div>
                        <ToneBadge tone={withdrawn ? "red" : faults.length > 0 ? "amber" : "green"}>
                          {withdrawn ? "Withdraw" : faults.length > 0 ? "Check due" : "In service"}
                        </ToneBadge>
                      </div>

                      <p className="mt-3 text-[11px] text-slate-500">
                        Assigned to {item.wearer} · checked {item.lastCheckedDays} days ago
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

                      <div className="mt-3 flex gap-2">
                        <button onClick={() => recordPpeCheck(item.id)} className="flex-1 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-2 py-1.5 text-[11px] font-semibold text-emerald-300 hover:bg-emerald-500/20">
                          Record check
                        </button>
                        <button onClick={() => withdrawPpe(item.id)} className="flex-1 rounded-md border border-slate-700 bg-slate-800/60 px-2 py-1.5 text-[11px] font-semibold text-slate-300 hover:bg-slate-800">
                          Withdraw
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        )}
      </main>

      {/* ============================= INSPECTION MODALS ============================= */}
      {modal && modal.kind === "dose" && (
        <Modal title={modal.data.record.name} subtitle={`${modal.data.record.id} · ${modal.data.record.role} · ${modal.data.record.department}`} onClose={() => setModal(null)}>
          <Row label="Classification" value={modal.data.record.classified ? "Classified person" : "Non-classified"} />
          <Row label="Wear period" value={`${modal.data.record.daysElapsed} days elapsed`} />
          <Row label="Dosimeter returned" value={modal.data.record.returned ? "yes" : "no"} accent={modal.data.record.returned ? undefined : "text-amber-300"} />
          <Row label="Leaded eyewear" value={modal.data.record.leadedEyewear ? "issued" : "not issued"} accent={modal.data.record.leadedEyewear ? undefined : "text-amber-300"} />
          {modal.data.measured ? (
            <>
              {modal.data.rows.map((row) => (
                <Row
                  key={row.key}
                  label={`${row.label} (limit ${row.limit})`}
                  value={`${row.measuredMsv} → ${row.projectedMsv} mSv (${row.pctOfLimit}%)`}
                  accent={row.tone === "red" ? "text-red-300" : row.tone === "amber" ? "text-amber-300" : undefined}
                />
              ))}
              <p className="mt-3 rounded-lg border border-slate-800 bg-slate-950/60 p-3 text-[11px] leading-relaxed text-slate-400">
                Each projection is the dose so far × (365 ÷ {modal.data.record.daysElapsed}), which says "at this rate" rather than
                "we predict". The lens row carries the finding that is most often missed: ICRP 118 cut that limit from 150 mSv to 20,
                and a department whose mental model predates the change reads 40 mSv to the lens as unremarkable.
              </p>
            </>
          ) : (
            <p className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-[11px] leading-relaxed text-amber-200">
              {modal.data.refusal}
            </p>
          )}
        </Modal>
      )}

      {modal && modal.kind === "source" && (
        <Modal title={modal.data.source.description} subtitle={`${modal.data.source.id} · ${modal.data.source.isotope}`} onClose={() => setModal(null)}>
          <Row label="Location" value={modal.data.source.location} />
          <Row label="Custodian" value={modal.data.source.custodian} />
          <Row label="Certificate activity" value={`${modal.data.source.certificateActivityMbq.toLocaleString()} MBq`} />
          <Row label="Reference date" value={modal.data.source.referenceDateDays == null ? "not recorded" : `${modal.data.source.referenceDateDays} days ago`} accent={modal.data.source.referenceDateDays == null ? "text-amber-300" : undefined} />
          <Row label="Half-life" value={HALF_LIVES_DAYS[modal.data.source.isotope] == null ? "not held" : `${HALF_LIVES_DAYS[modal.data.source.isotope]} days`} />
          <Row label="Half-lives elapsed" value={modal.data.decay.halfLivesElapsed ?? "—"} />
          <Row label="Activity today" value={modal.data.decay.activityMbq == null ? "not decayable" : `${modal.data.decay.activityMbq.toLocaleString()} MBq`} accent={modal.data.decay.activityMbq == null ? "text-amber-300" : "text-emerald-300"} />
          <Row label="Sealed integrity" value={modal.data.source.sealedIntegrity} accent={modal.data.source.sealedIntegrity === "Intact" ? undefined : "text-red-300"} />
          <Row label="Last wipe test" value={`${modal.data.source.lastLeakTestDays} days ago`} accent={modal.data.source.lastLeakTestDays > LEAK_TEST_INTERVAL_DAYS ? "text-red-300" : undefined} />
          {modal.data.decay.refusal ? (
            <p className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-[11px] leading-relaxed text-amber-200">
              {modal.data.decay.refusal}
            </p>
          ) : (
            <p className="mt-3 rounded-lg border border-slate-800 bg-slate-950/60 p-3 text-[11px] leading-relaxed text-slate-400">
              {modal.data.source.certificateActivityMbq.toLocaleString()} MBq × 2^(−{modal.data.source.referenceDateDays} ÷{" "}
              {HALF_LIVES_DAYS[modal.data.source.isotope]}) = {modal.data.decay.activityMbq.toLocaleString()} MBq, or{" "}
              {modal.data.remaining}% of the certificate figure after {modal.data.decay.halfLivesElapsed} half-lives. The certificate is
              provenance; this is the number a treatment time is calculated from.
            </p>
          )}
        </Modal>
      )}

      {modal && modal.kind === "exam" && (
        <Modal title={modal.data.exam.exam} subtitle={`${modal.data.exam.id} · ${modal.data.exam.room} · ${modal.data.exam.patient}`} onClose={() => setModal(null)}>
          <Row label="Operator" value={modal.data.exam.operator} />
          <Row label="Performed" value={modal.data.exam.daysAgo === 0 ? "today" : `${modal.data.exam.daysAgo} days ago`} />
          <Row label="Recorded dose" value={`${modal.data.exam.doseValue}${modal.data.drl.hasDrl ? ` ${modal.data.drl.drl.unit}` : ""}`} />
          <Row label="National DRL" value={modal.data.drl.hasDrl ? `${modal.data.drl.drl.value} ${modal.data.drl.drl.unit}` : "none published"} />
          <Row label="Ratio to DRL" value={modal.data.drl.ratio ?? "—"} accent={modal.data.drl.hasDrl && modal.data.drl.ratio > 1 ? "text-amber-300" : undefined} />
          <Row label="Peak skin dose" value={modal.data.exam.peakSkinGy == null ? "not applicable" : `${modal.data.exam.peakSkinGy} Gy`} />
          <p className="mt-3 rounded-lg border border-slate-800 bg-slate-950/60 p-3 text-[11px] leading-relaxed text-slate-400">
            {modal.data.drl.note}
          </p>
          {modal.data.skin && (
            <p className={`mt-3 rounded-lg border p-3 text-[11px] leading-relaxed ${modal.data.skin.tone === "red" ? "border-red-500/30 bg-red-500/5 text-red-200" : "border-amber-500/30 bg-amber-500/5 text-amber-200"}`}>
              {modal.data.skin.text} A DRL is a population figure and says nothing about this patient; peak skin dose is the only number
              here that is about them specifically.
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
        <span className="hidden md:inline">IRR17 · IR(ME)R 2017 · ICRP 103 and 118 · IEC 61331-3 · IAEA SSG-11</span>
        <span className="inline-flex items-center gap-1.5">
          <BadgeCheck size={12} /> {dosimetry.length} workers · {sources.length} sources · {exams.length} exams · {ppe.length} PPE items
        </span>
        <span className="hidden xl:inline-flex items-center gap-1.5">
          <FileText size={12} /> Lens limit {DOSE_LIMITS.lens.limit} mSv/yr
        </span>
      </footer>
    </div>
  );
}
