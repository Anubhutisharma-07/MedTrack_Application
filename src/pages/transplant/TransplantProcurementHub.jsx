import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle, Battery, CheckCircle2, FileText, Heart, Hourglass, Info,
  Pause, Play, Plane, RefreshCw, ShieldAlert, Snowflake, Timer, UserCheck,
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
 *  MedTrack Organ Transplant & Procurement Logistics Hub
 *  ------------------------------------------------------------------
 *  MedTrack has a blood bank console and a cold-chain console. Between
 *  them they cover the two properties that make transplant logistics
 *  hard - a perishable biological product and a temperature-controlled
 *  chain - and neither covers the organ itself.
 *
 *  Transplant earns a console of its own because it is the only
 *  workflow in the hospital where the clock *is* the clinical outcome.
 *  A unit of blood that is late is a unit of blood that is late. A
 *  kidney that is late is a kidney with delayed graft function, and a
 *  heart that is late is a heart that does not start. There is no
 *  recovery, no re-order and no second attempt, and the difference
 *  between a good outcome and a graft loss is frequently ninety
 *  minutes of avoidable coordination.
 *
 *  It is also, unexpectedly, a device problem. Machine perfusion has
 *  moved organ preservation from a box of ice to a fleet of
 *  instrumented pumps with battery states, priming solutions,
 *  disposable sets and service intervals, shipped between hospitals by
 *  couriers - exactly the class of asset MedTrack exists to track, and
 *  currently tracked by nobody.
 *
 *    1. Organ Offers   - acceptance clocks, because an offer held past
 *                        its window is declined by default.
 *    2. Ischaemia      - CIT recomputed live from the cross-clamp.
 *    3. Perfusion Fleet - the machines, including the ones sitting in
 *                         another hospital's store room.
 *    4. Immunology     - HLA mismatch derived, with crossmatch and DSA
 *                        shown beside it rather than folded into it.
 * ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/*  Clinical constants                                                 */
/* ------------------------------------------------------------------ */

/**
 * Cold ischaemia limits in hours, per organ.
 *
 * The spread between four hours and twenty-four is exactly why a single global threshold is useless:
 * a heart at five hours is in trouble and a kidney at five hours has not started. `machineExtended`
 * is present only where machine perfusion actually changes the limit, which in routine practice is
 * the kidney.
 */
export const ISCHAEMIA_LIMITS = {
  Heart: { ideal: 4, absolute: 6, machineExtended: null },
  Lung: { ideal: 6, absolute: 8, machineExtended: null },
  Liver: { ideal: 8, absolute: 12, machineExtended: null },
  Pancreas: { ideal: 12, absolute: 18, machineExtended: null },
  Kidney: { ideal: 18, absolute: 24, machineExtended: 36 },
};

/** The preservation methods that earn the extended kidney limit. Anything else gets the short clock. */
const MACHINE_PERFUSION_METHODS = new Set(["Hypothermic machine perfusion", "Normothermic machine perfusion"]);

/** The three classical loci allocation runs on, two antigens each, giving the 0-6 mismatch scale. */
export const HLA_LOCI = ["A", "B", "DR"];

/** An offer not answered inside this window is a decline, whatever the intention was. */
const OFFER_WINDOW_MINUTES = 60;

/** DCD functional warm ischaemia beyond this is where most centres stop accepting. */
const FUNCTIONAL_WARM_LIMIT_MIN = 30;

/* ------------------------------------------------------------------ */
/*  Seed data                                                          */
/* ------------------------------------------------------------------ */

const OFFERS = [
  { id: "OFF-5501", organ: "Kidney", donorType: "DBD", donorAge: 42, centre: "Northern General", sequence: 3, minutesHeld: 18, bloodGroup: "O", recipient: "RX-2201 — A. Kowalski", status: "Under review" },
  { id: "OFF-5502", organ: "Liver", donorType: "DCD", donorAge: 55, centre: "Northern General", sequence: 1, minutesHeld: 71, bloodGroup: "A", recipient: "RX-2208 — B. Traoré", status: "Under review" },
  { id: "OFF-5503", organ: "Heart", donorType: "DBD", donorAge: 29, centre: "Royal Infirmary", sequence: 1, minutesHeld: 9, bloodGroup: "B", recipient: "RX-2214 — C. Nakamura", status: "Accepted" },
  { id: "OFF-5504", organ: "Lung", donorType: "DBD", donorAge: 34, centre: "Royal Infirmary", sequence: 2, minutesHeld: 44, bloodGroup: "O", recipient: "RX-2220 — D. Petrov", status: "Under review" },
  { id: "OFF-5505", organ: "Kidney", donorType: "DCD", donorAge: 61, centre: "St Aidan's", sequence: 7, minutesHeld: 96, bloodGroup: "AB", recipient: "RX-2227 — E. Mensah", status: "Under review" },
  { id: "OFF-5506", organ: "Pancreas", donorType: "DBD", donorAge: 31, centre: "Northern General", sequence: 2, minutesHeld: 33, bloodGroup: "A", recipient: "RX-2233 — F. Lindgren", status: "Under review" },
  { id: "OFF-5507", organ: "Liver", donorType: "DBD", donorAge: 47, centre: "St Aidan's", sequence: 4, minutesHeld: 55, bloodGroup: "O", recipient: "RX-2240 — G. Okoye", status: "Declined" },
  { id: "OFF-5508", organ: "Kidney", donorType: "DBD", donorAge: 38, centre: "Royal Infirmary", sequence: 5, minutesHeld: 12, bloodGroup: "B", recipient: "RX-2246 — H. Rossi", status: "Under review" },
];

/**
 * Organs in transit or on the bench.
 *
 * `crossClampHoursAgo` is the only ischaemia fact stored. Every clock on the page is derived from
 * it, because a CIT that somebody typed is stale from the moment it is typed - and stale is the
 * whole problem, since it is a clock and a clock read from a note is not a clock.
 *
 * TX-3305 has no clamp timestamp, TX-3308 has one in the future and TX-3309 has one before the
 * donor's admission. All three are transcription realities and all three are refused rather than
 * counted down.
 */
const IN_TRANSIT = [
  { id: "TX-3301", organ: "Kidney", donorId: "DN-901", recipient: "RX-2201 — A. Kowalski", crossClampHoursAgo: 14.2, preservation: "Hypothermic machine perfusion", donorType: "DBD", functionalWarmMin: null, courier: "Road — ETA 40 min", destination: "Theatre 5", machineId: "PERF-LP-02" },
  { id: "TX-3302", organ: "Heart", donorId: "DN-904", recipient: "RX-2214 — C. Nakamura", crossClampHoursAgo: 3.1, preservation: "Static cold storage", donorType: "DBD", functionalWarmMin: null, courier: "Air — landed", destination: "Theatre 2", machineId: null },
  { id: "TX-3303", organ: "Liver", donorId: "DN-907", recipient: "RX-2208 — B. Traoré", crossClampHoursAgo: 9.4, preservation: "Normothermic machine perfusion", donorType: "DCD", functionalWarmMin: 22, courier: "Road — arrived", destination: "Theatre 1", machineId: "PERF-XV-01" },
  { id: "TX-3304", organ: "Kidney", donorId: "DN-907", recipient: "RX-2227 — E. Mensah", crossClampHoursAgo: 25.8, preservation: "Static cold storage", donorType: "DCD", functionalWarmMin: 34, courier: "Road — arrived", destination: "Theatre 5", machineId: null },
  { id: "TX-3305", organ: "Lung", donorId: "DN-911", recipient: "RX-2220 — D. Petrov", crossClampHoursAgo: null, preservation: "Static cold storage", donorType: "DBD", functionalWarmMin: null, courier: "Air — in flight", destination: "Theatre 2", machineId: null },
  { id: "TX-3306", organ: "Pancreas", donorId: "DN-904", recipient: "RX-2233 — F. Lindgren", crossClampHoursAgo: 16.1, preservation: "Static cold storage", donorType: "DBD", functionalWarmMin: null, courier: "Road — 2 h out", destination: "Theatre 4", machineId: null },
  { id: "TX-3307", organ: "Kidney", donorId: "DN-914", recipient: "RX-2246 — H. Rossi", crossClampHoursAgo: 30.5, preservation: "Hypothermic machine perfusion", donorType: "DBD", functionalWarmMin: null, courier: "Road — arrived", destination: "Theatre 5", machineId: "PERF-LP-01" },
  { id: "TX-3308", organ: "Liver", donorId: "DN-916", recipient: "RX-2240 — G. Okoye", crossClampHoursAgo: -2.5, preservation: "Static cold storage", donorType: "DBD", functionalWarmMin: null, courier: "Road — in transit", destination: "Theatre 1", machineId: null },
  { id: "TX-3309", organ: "Kidney", donorId: "DN-918", recipient: "RX-2252 — J. Almeida", crossClampHoursAgo: 96, preservation: "Unknown", donorType: "DBD", functionalWarmMin: null, courier: "Road — arrived", destination: "Theatre 5", machineId: null, donorAdmittedHoursAgo: 30 },
];

const PERFUSION_FLEET = [
  { id: "PERF-LP-01", model: "LifePort Kidney Transporter", vendor: "Organ Recovery", organ: "Kidney", location: "Theatre 5", state: "In use", batteryPct: 74, onMains: false, disposableSetLot: "SET-K-441", primingSolution: "KPS-1", serviceDueDays: 40, cyclesRun: 212 },
  { id: "PERF-LP-02", model: "LifePort Kidney Transporter", vendor: "Organ Recovery", organ: "Kidney", location: "In transit — road", state: "In use", batteryPct: 41, onMains: false, disposableSetLot: "SET-K-441", primingSolution: "KPS-1", serviceDueDays: 12, cyclesRun: 188 },
  { id: "PERF-LP-03", model: "LifePort Kidney Transporter", vendor: "Organ Recovery", organ: "Kidney", location: "St Aidan's store room", state: "Idle — off site", batteryPct: 8, onMains: false, disposableSetLot: "SET-K-402", primingSolution: "KPS-1", serviceDueDays: -35, cyclesRun: 401 },
  { id: "PERF-XV-01", model: "XVIVO Liver Assist", vendor: "XVIVO", organ: "Liver", location: "Theatre 1", state: "In use", batteryPct: 96, onMains: true, disposableSetLot: "SET-L-118", primingSolution: "Belzer UW", serviceDueDays: 88, cyclesRun: 74 },
  { id: "PERF-XV-02", model: "XVIVO Lung Assist", vendor: "XVIVO", organ: "Lung", location: "Perfusion store", state: "Ready", batteryPct: 100, onMains: true, disposableSetLot: "SET-P-093", primingSolution: "Steen", serviceDueDays: 150, cyclesRun: 33 },
  { id: "PERF-OCS-01", model: "OCS Heart", vendor: "TransMedics", organ: "Heart", location: "Perfusion store", state: "Ready", batteryPct: 100, onMains: true, disposableSetLot: "SET-H-020", primingSolution: "OCS Heart solution", serviceDueDays: 61, cyclesRun: 19 },
  { id: "PERF-KA-01", model: "Kidney Assist Transport", vendor: "XVIVO", organ: "Kidney", location: "Royal Infirmary store", state: "Idle — off site", batteryPct: 55, onMains: false, disposableSetLot: "SET-K-441", primingSolution: "KPS-1", serviceDueDays: 20, cyclesRun: 96 },
  { id: "PERF-KA-02", model: "Kidney Assist Transport", vendor: "XVIVO", organ: "Kidney", location: "Perfusion store", state: "Service", batteryPct: 62, onMains: true, disposableSetLot: null, primingSolution: null, serviceDueDays: -9, cyclesRun: 355 },
];

/**
 * Donor and recipient HLA typing.
 *
 * `RX-2227` deliberately has a single antigen recorded at DR. That is either a genuine homozygote or
 * a half-finished record, and those two produce different mismatch counts - which is why it is
 * refused rather than reported as a smaller number.
 */
const MATCHES = [
  {
    id: "MX-7701", recipient: "RX-2201 — A. Kowalski", donorId: "DN-901", organ: "Kidney",
    donor: { A: ["A1", "A2"], B: ["B8", "B44"], DR: ["DR3", "DR7"] },
    recipientTyping: { A: ["A1", "A3"], B: ["B8", "B7"], DR: ["DR3", "DR15"] },
    crossmatch: "Negative", dsaMfi: 0, cpra: 12,
  },
  {
    id: "MX-7702", recipient: "RX-2214 — C. Nakamura", donorId: "DN-904", organ: "Heart",
    donor: { A: ["A2", "A24"], B: ["B7", "B35"], DR: ["DR4", "DR11"] },
    recipientTyping: { A: ["A2", "A24"], B: ["B7", "B35"], DR: ["DR4", "DR11"] },
    crossmatch: "Negative", dsaMfi: 0, cpra: 3,
  },
  {
    id: "MX-7703", recipient: "RX-2208 — B. Traoré", donorId: "DN-907", organ: "Liver",
    donor: { A: ["A30", "A68"], B: ["B42", "B58"], DR: ["DR13", "DR15"] },
    recipientTyping: { A: ["A1", "A2"], B: ["B7", "B8"], DR: ["DR3", "DR4"] },
    crossmatch: "Negative", dsaMfi: 0, cpra: 0,
  },
  {
    id: "MX-7704", recipient: "RX-2227 — E. Mensah", donorId: "DN-907", organ: "Kidney",
    donor: { A: ["A2", "A29"], B: ["B44", "B51"], DR: ["DR7", "DR13"] },
    recipientTyping: { A: ["A2", "A29"], B: ["B44", "B51"], DR: ["DR7"] },
    crossmatch: "Negative", dsaMfi: 0, cpra: 44,
  },
  {
    id: "MX-7705", recipient: "RX-2246 — H. Rossi", donorId: "DN-914", organ: "Kidney",
    donor: { A: ["A1", "A11"], B: ["B8", "B27"], DR: ["DR3", "DR4"] },
    recipientTyping: { A: ["A1", "A11"], B: ["B8", "B27"], DR: ["DR3", "DR4"] },
    crossmatch: "Positive", dsaMfi: 8400, cpra: 91,
  },
  {
    id: "MX-7706", recipient: "RX-2233 — F. Lindgren", donorId: "DN-904", organ: "Pancreas",
    donor: { A: ["A2", "A24"], B: ["B7", "B35"], DR: ["DR4", "DR11"] },
    recipientTyping: { A: ["A2", "A3"], B: ["B7", "B62"], DR: ["DR4", "DR8"] },
    crossmatch: "Negative", dsaMfi: 1800, cpra: 27,
  },
];

/* ------------------------------------------------------------------ */
/*  Clinical calculations                                              */
/* ------------------------------------------------------------------ */

/**
 * Cold ischaemia time and the limit it is measured against, derived rather than reported.
 *
 * Every transplant coordination system records a CIT that somebody typed. That number is stale from
 * the moment it is typed, and stale is the entire problem: it is a clock, and a clock read from a
 * note is not a clock. So the interval is derived from the cross-clamp timestamp on every render.
 *
 * The limit is per organ, and the machine perfusion extension is applied from the preservation
 * method *actually in use* rather than the one that was planned - and to kidneys only, because that
 * is the only organ where routine practice extends the limit.
 *
 * Three states return a refusal instead of a countdown, and all three are transcription realities
 * rather than hypotheticals:
 *
 *   - no cross-clamp timestamp. The console does not fall back to the time the offer was accepted,
 *     which can be hours out in either direction;
 *   - a timestamp in the future, which is a transcription error and is shown as one rather than as
 *     a comfortable negative ischaemia time;
 *   - a timestamp before the donor was admitted, which is the same error in the other direction.
 *
 * @returns {{hours: number|null, limit: object|null, appliedLimitHours: number|null,
 *            status: string, refusal: string|null, machineExtensionApplied: boolean}}
 */
export function ischaemiaClock(organRecord) {
  const limits = ISCHAEMIA_LIMITS[organRecord.organ];
  const base = {
    hours: null, limit: limits || null, appliedLimitHours: null,
    status: "Not computable", refusal: null, machineExtensionApplied: false,
  };

  if (!limits) {
    return { ...base, refusal: `No ischaemia limits are held for ${organRecord.organ}, so the clock is recorded rather than graded.` };
  }
  if (organRecord.crossClampHoursAgo == null || !Number.isFinite(organRecord.crossClampHoursAgo)) {
    return {
      ...base,
      refusal: "No cross-clamp timestamp, so there is no ischaemia clock. The time the offer was accepted is not substituted — it can be hours out in either direction, and this is the one number where being hours out changes the decision.",
    };
  }
  if (organRecord.crossClampHoursAgo < 0) {
    return {
      ...base,
      refusal: `Cross-clamp is timestamped ${Math.abs(organRecord.crossClampHoursAgo)} hours in the future. That is a transcription error, and it is shown as one rather than as a comfortable negative ischaemia time.`,
    };
  }
  if (organRecord.donorAdmittedHoursAgo != null && organRecord.crossClampHoursAgo > organRecord.donorAdmittedHoursAgo) {
    return {
      ...base,
      refusal: `Cross-clamp is timestamped ${organRecord.crossClampHoursAgo} hours ago, before the donor was admitted ${organRecord.donorAdmittedHoursAgo} hours ago. The record is internally inconsistent and no clock is derived from it.`,
    };
  }

  // The extension applies to kidneys on machine perfusion, and to nothing else. An unknown
  // preservation method gets the static cold storage limit: the safe default is the shorter clock.
  const onMachine = MACHINE_PERFUSION_METHODS.has(organRecord.preservation);
  const machineExtensionApplied = onMachine && limits.machineExtended != null;
  const appliedLimitHours = machineExtensionApplied ? limits.machineExtended : limits.absolute;

  const hours = Math.round(organRecord.crossClampHoursAgo * 10) / 10;
  const status =
    hours >= appliedLimitHours ? "Past absolute limit"
      : hours >= limits.ideal ? "Past ideal"
        : "Within ideal";

  return { hours, limit: limits, appliedLimitHours, status, refusal: null, machineExtensionApplied };
}

/**
 * DCD functional warm ischaemia, which is the number that decides transplantability at all.
 *
 * It starts at a systolic or saturation threshold rather than at asystole, which is why it is stored
 * separately rather than derived from the time of death: those two are routinely twenty minutes
 * apart and the wrong one makes a declinable organ look acceptable.
 */
export function warmIschaemiaFinding(organRecord) {
  if (organRecord.donorType !== "DCD") return null;
  if (organRecord.functionalWarmMin == null) {
    return { tone: "amber", text: "DCD donor with no functional warm ischaemia time recorded. It starts at a systolic or saturation threshold rather than at asystole, so it cannot be inferred from the time of death." };
  }
  if (organRecord.functionalWarmMin > FUNCTIONAL_WARM_LIMIT_MIN) {
    return { tone: "red", text: `Functional warm ischaemia ${organRecord.functionalWarmMin} min exceeds the ${FUNCTIONAL_WARM_LIMIT_MIN} min threshold most centres accept. This decides transplantability before the cold clock does.` };
  }
  return { tone: "green", text: `Functional warm ischaemia ${organRecord.functionalWarmMin} min, inside the ${FUNCTIONAL_WARM_LIMIT_MIN} min threshold.` };
}

/**
 * HLA mismatch across A, B and DR, derived from the antigen sets.
 *
 *   mismatch = |{donor antigens at locus} \ {recipient antigens at locus}| summed over A, B, DR
 *
 * Derived rather than read from a field somebody typed, and - more importantly - **refused when the
 * typing is incomplete**. A locus with one antigen recorded is either a genuine homozygote or a
 * half-finished record, and those two produce different mismatch counts. Reporting "2" when the
 * truth is "2 or 3, we do not know" is worse than reporting nothing, because the number goes into an
 * allocation discussion as if it were known.
 *
 * @returns {{mismatch: number|null, perLocus: object|null, refusal: string|null}}
 */
export function hlaMismatch(match) {
  const incomplete = [];
  for (const locus of HLA_LOCI) {
    const donor = match.donor?.[locus] || [];
    const recipient = match.recipientTyping?.[locus] || [];
    if (donor.length < 2) incomplete.push(`donor ${locus} (${donor.length} of 2)`);
    if (recipient.length < 2) incomplete.push(`recipient ${locus} (${recipient.length} of 2)`);
  }

  if (incomplete.length > 0) {
    return {
      mismatch: null, perLocus: null,
      refusal: `Typing incomplete at ${incomplete.join(", ")}. A locus with one antigen recorded is either a genuine homozygote or a half-finished record, and those produce different counts — so no mismatch is reported. "2 or 3, we do not know" going into an allocation discussion as "2" is worse than no number.`,
    };
  }

  const perLocus = {};
  let total = 0;
  for (const locus of HLA_LOCI) {
    const recipientSet = new Set(match.recipientTyping[locus]);
    const count = match.donor[locus].filter((antigen) => !recipientSet.has(antigen)).length;
    perLocus[locus] = count;
    total += count;
  }

  return { mismatch: total, perLocus, refusal: null };
}

/**
 * Immunological findings that a mismatch count does not tell you.
 *
 * Shown alongside the count and deliberately never folded into it: a 0-mismatch graft can still
 * have donor-specific antibodies and a positive crossmatch, and a single composite score would
 * average away the one finding that is an absolute contraindication.
 */
export function immunologyFindings(match) {
  const findings = [];
  if (match.crossmatch === "Positive") {
    findings.push({ code: "XM", tone: "red", text: "Crossmatch positive. This is a contraindication in its own right regardless of how well the antigens match — and this pair is a 0-mismatch on paper." });
  }
  if (match.dsaMfi > 3000) {
    findings.push({ code: "DSA", tone: "red", text: `Donor-specific antibody at ${match.dsaMfi.toLocaleString()} MFI. Antibody-mediated rejection risk is set by this, not by the mismatch count.` });
  } else if (match.dsaMfi > 1000) {
    findings.push({ code: "DSA-LOW", tone: "amber", text: `Donor-specific antibody at ${match.dsaMfi.toLocaleString()} MFI. Below the treatment threshold and above nothing — flag to the immunologist.` });
  }
  if (match.cpra >= 85) {
    findings.push({ code: "CPRA", tone: "amber", text: `cPRA ${match.cpra}%: this recipient is incompatible with the large majority of donors, so a compatible offer is rare enough to be worth extraordinary effort.` });
  }
  return findings;
}

/** Where an offer sits against its acceptance window. */
export function offerClock(offer) {
  const remaining = OFFER_WINDOW_MINUTES - offer.minutesHeld;
  if (offer.status !== "Under review") {
    return { remaining, tone: offer.status === "Accepted" ? "green" : "slate", text: offer.status };
  }
  if (remaining <= 0) {
    return { remaining, tone: "red", text: `Held ${offer.minutesHeld} min, ${Math.abs(remaining)} min past the ${OFFER_WINDOW_MINUTES} min window. An offer not answered is a decline, whatever the intention was.` };
  }
  if (remaining <= 15) {
    return { remaining, tone: "amber", text: `${remaining} min left on the acceptance window.` };
  }
  return { remaining, tone: "green", text: `${remaining} min left on the acceptance window.` };
}

/** Perfusion machine faults, with battery ahead of paperwork because it is the one that fails in transit. */
export function machineFaults(machine) {
  const faults = [];
  if (!machine.onMains && machine.batteryPct < 50 && machine.state === "In use") {
    faults.push({ code: "BATTERY", tone: "red", text: `${machine.batteryPct}% battery, off mains, with an organ on it. A perfusion pump that stops in transit converts machine preservation into static cold storage without anybody choosing to.` });
  } else if (!machine.onMains && machine.batteryPct < 20) {
    faults.push({ code: "BATTERY-LOW", tone: "amber", text: `${machine.batteryPct}% battery and off mains. It will not be ready when it is next needed.` });
  }
  if (machine.serviceDueDays <= 0) {
    faults.push({ code: "SERVICE", tone: "red", text: `Service ${Math.abs(machine.serviceDueDays)} days overdue.` });
  } else if (machine.serviceDueDays <= 21) {
    faults.push({ code: "SERVICE-SOON", tone: "amber", text: `Service due in ${machine.serviceDueDays} days.` });
  }
  if (machine.state === "Idle — off site") {
    faults.push({ code: "OFFSITE", tone: "amber", text: `Sitting at ${machine.location}. Off-site machines are the ones nobody counts when a retrieval is being planned, and they are counted here.` });
  }
  return faults;
}

/* ------------------------------------------------------------------ */
/*  Simulation                                                         */
/* ------------------------------------------------------------------ */

/** Runs the clocks, which on this page is the whole point. */
function useTransplantSimulation({ transitRef, offersRef, fleetRef, toast }) {
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

      transitRef.current = transitRef.current.map((record) => {
        if (record.crossClampHoursAgo == null) return record;
        const before = ischaemiaClock(record);
        const next = { ...record, crossClampHoursAgo: Math.round((record.crossClampHoursAgo + 0.25 * step) * 100) / 100 };
        const after = ischaemiaClock(next);
        if (before.status !== "Past absolute limit" && after.status === "Past absolute limit") {
          toast(`${record.id} — ${record.organ} has passed its absolute ischaemia limit`, "High");
        }
        return next;
      });

      offersRef.current = offersRef.current.map((offer) =>
        offer.status === "Under review" ? { ...offer, minutesHeld: offer.minutesHeld + step } : offer
      );

      fleetRef.current = fleetRef.current.map((machine) => ({
        ...machine,
        batteryPct: machine.onMains ? Math.min(100, machine.batteryPct + step) : Math.max(0, machine.batteryPct - step),
      }));

      setTick((t) => t + 1);
    }, 1600);

    return () => clearInterval(interval);
  }, [transitRef, offersRef, fleetRef, toast]);

  return {
    running, setRunning, speed, setSpeed, tick,
    reset: () => {
      transitRef.current = IN_TRANSIT.map((r) => ({ ...r }));
      offersRef.current = OFFERS.map((o) => ({ ...o }));
      fleetRef.current = PERFUSION_FLEET.map((m) => ({ ...m }));
      setTick(0);
      toast("Transplant console reset to baseline", "Low");
    },
  };
}

/* ------------------------------------------------------------------ */
/*  Main page                                                          */
/* ------------------------------------------------------------------ */

export default function TransplantProcurementHub() {
  const [tab, setTab] = useState("offers");
  const [modal, setModal] = useState(null);
  const [query, setQuery] = useState("");
  const [offerFilter, setOfferFilter] = useState("All");
  const [transitFilter, setTransitFilter] = useState("All");
  const [fleetFilter, setFleetFilter] = useState("All");
  const [matchFilter, setMatchFilter] = useState("All");

  const [toasts, setToasts] = useState([]);
  const toast = useCallback((message, severity = "Low") => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((current) => [...current.slice(-4), { id, message, severity }]);
    setTimeout(() => setToasts((current) => current.filter((t) => t.id !== id)), 4200);
  }, []);

  const [offers, setOffers] = useState(() => OFFERS.map((o) => ({ ...o })));
  const [transit, setTransit] = useState(() => IN_TRANSIT.map((r) => ({ ...r })));
  const [fleet, setFleet] = useState(() => PERFUSION_FLEET.map((m) => ({ ...m })));
  const [matches, setMatches] = useState(() => MATCHES.map((m) => ({ ...m })));

  const transitRef = useRef(transit);
  const offersRef = useRef(offers);
  const fleetRef = useRef(fleet);

  useEffect(() => { transitRef.current = transit; }, [transit]);
  useEffect(() => { offersRef.current = offers; }, [offers]);
  useEffect(() => { fleetRef.current = fleet; }, [fleet]);

  const sim = useTransplantSimulation({ transitRef, offersRef, fleetRef, toast });

  useEffect(() => {
    setTransit([...transitRef.current]);
    setOffers([...offersRef.current]);
    setFleet([...fleetRef.current]);
  }, [sim.tick]);

  /* ---------- derived ---------- */

  const clocks = useMemo(
    () => transit.map((record) => ({ record, clock: ischaemiaClock(record), warm: warmIschaemiaFinding(record) })),
    [transit]
  );

  const typings = useMemo(
    () => matches.map((match) => ({ match, ...hlaMismatch(match), findings: immunologyFindings(match) })),
    [matches]
  );

  const offerClocks = useMemo(
    () => offers.map((offer) => ({ offer, clock: offerClock(offer) })),
    [offers]
  );

  const stats = useMemo(() => {
    const pastLimit = clocks.filter((c) => c.clock.status === "Past absolute limit").length;
    const noClock = clocks.filter((c) => c.clock.refusal != null).length;
    const expiredOffers = offerClocks.filter((o) => o.offer.status === "Under review" && o.clock.remaining <= 0).length;
    const machinesDown = fleet.filter((m) => machineFaults(m).some((f) => f.tone === "red")).length;
    return { pastLimit, noClock, expiredOffers, machinesDown };
  }, [clocks, offerClocks, fleet]);

  const filteredOffers = useMemo(() => {
    const q = query.toLowerCase();
    return offerClocks.filter((entry) => {
      const { offer } = entry;
      const matchesQuery = !q || [offer.id, offer.organ, offer.centre, offer.recipient, offer.donorType].some((f) => String(f).toLowerCase().includes(q));
      if (!matchesQuery) return false;
      if (offerFilter === "All") return true;
      if (offerFilter === "Window expired") return offer.status === "Under review" && entry.clock.remaining <= 0;
      if (offerFilter === "DCD") return offer.donorType === "DCD";
      return offer.status === offerFilter;
    });
  }, [offerClocks, query, offerFilter]);

  const filteredTransit = useMemo(() => {
    const q = query.toLowerCase();
    return clocks.filter((entry) => {
      const { record } = entry;
      const matchesQuery = !q || [record.id, record.organ, record.recipient, record.donorId, record.destination].some((f) => String(f).toLowerCase().includes(q));
      if (!matchesQuery) return false;
      if (transitFilter === "All") return true;
      if (transitFilter === "Past limit") return entry.clock.status === "Past absolute limit";
      if (transitFilter === "No clock") return entry.clock.refusal != null;
      if (transitFilter === "Machine perfusion") return entry.clock.machineExtensionApplied;
      return record.organ === transitFilter;
    });
  }, [clocks, query, transitFilter]);

  const filteredFleet = useMemo(() => {
    const q = query.toLowerCase();
    return fleet.filter((machine) => {
      const matchesQuery = !q || [machine.id, machine.model, machine.vendor, machine.organ, machine.location].some((f) => String(f).toLowerCase().includes(q));
      if (!matchesQuery) return false;
      if (fleetFilter === "All") return true;
      if (fleetFilter === "Faulted") return machineFaults(machine).some((f) => f.tone === "red");
      if (fleetFilter === "Off site") return machine.state === "Idle — off site";
      return machine.organ === fleetFilter;
    });
  }, [fleet, query, fleetFilter]);

  const filteredTypings = useMemo(() => {
    const q = query.toLowerCase();
    return typings.filter((entry) => {
      const { match } = entry;
      const matchesQuery = !q || [match.id, match.recipient, match.donorId, match.organ].some((f) => String(f).toLowerCase().includes(q));
      if (!matchesQuery) return false;
      if (matchFilter === "All") return true;
      if (matchFilter === "Typing incomplete") return entry.refusal != null;
      if (matchFilter === "Contraindicated") return entry.findings.some((f) => f.tone === "red");
      if (matchFilter === "Well matched") return entry.mismatch != null && entry.mismatch <= 2;
      return true;
    });
  }, [typings, query, matchFilter]);

  /* ---------- actions ---------- */

  const acceptOffer = (id) => {
    setOffers((current) => current.map((o) => (o.id === id ? { ...o, status: "Accepted" } : o)));
    toast(`${id} accepted — retrieval team notified`, "Medium");
  };

  const declineOffer = (id) => {
    setOffers((current) => current.map((o) => (o.id === id ? { ...o, status: "Declined" } : o)));
    toast(`${id} declined — offer passed to the next centre in sequence`, "Low");
  };

  const recordClamp = (id) => {
    setTransit((current) => current.map((r) => (r.id === id ? { ...r, crossClampHoursAgo: 0, donorAdmittedHoursAgo: undefined } : r)));
    toast(`${id} cross-clamp time recorded — ischaemia clock started`, "Medium");
  };

  const moveToMachine = (id) => {
    setTransit((current) =>
      current.map((r) => (r.id === id ? { ...r, preservation: "Hypothermic machine perfusion" } : r))
    );
    toast(`${id} placed on hypothermic machine perfusion`, "Medium");
  };

  const chargeMachine = (id) => {
    setFleet((current) => current.map((m) => (m.id === id ? { ...m, onMains: true, batteryPct: 100 } : m)));
    toast(`${id} placed on mains and charged`, "Low");
  };

  const recallMachine = (id) => {
    setFleet((current) => current.map((m) => (m.id === id ? { ...m, state: "Ready", location: "Perfusion store" } : m)));
    toast(`${id} recalled to the perfusion store`, "Medium");
  };

  const completeTyping = (id) => {
    setMatches((current) =>
      current.map((m) => {
        if (m.id !== id) return m;
        const filled = { ...m.recipientTyping };
        for (const locus of HLA_LOCI) {
          const antigens = filled[locus] || [];
          // A single recorded antigen resolved as a genuine homozygote, which is what the repeat
          // typing usually shows - and now it is a fact rather than an assumption.
          if (antigens.length === 1) filled[locus] = [antigens[0], antigens[0]];
        }
        return { ...m, recipientTyping: filled };
      })
    );
    toast(`${id} typing completed — mismatch can now be derived`, "Medium");
  };

  const exportCsv = () => {
    const table =
      tab === "offers"
        ? [
            ["ID", "Organ", "Donor type", "Donor age", "Centre", "Sequence", "Blood group", "Recipient", "Held (min)", "Window left (min)", "Status"],
            ...filteredOffers.map((e) => [e.offer.id, e.offer.organ, e.offer.donorType, e.offer.donorAge, e.offer.centre, e.offer.sequence, e.offer.bloodGroup, e.offer.recipient, e.offer.minutesHeld, e.clock.remaining, e.offer.status]),
          ]
        : tab === "transit"
          ? [
              ["ID", "Organ", "Donor", "Recipient", "Preservation", "Cross-clamp (h ago)", "CIT (h)", "Ideal (h)", "Applied limit (h)", "Machine extension", "Status", "Refusal", "Destination"],
              ...filteredTransit.map((e) => [
                e.record.id, e.record.organ, e.record.donorId, e.record.recipient, e.record.preservation,
                e.record.crossClampHoursAgo ?? "none", e.clock.hours ?? "not computable",
                e.clock.limit ? e.clock.limit.ideal : "—", e.clock.appliedLimitHours ?? "—",
                e.clock.machineExtensionApplied, e.clock.status, e.clock.refusal ?? "", e.record.destination,
              ]),
            ]
          : tab === "fleet"
            ? [
                ["ID", "Model", "Vendor", "Organ", "Location", "State", "Battery %", "On mains", "Set lot", "Priming", "Service due (d)", "Cycles", "Faults"],
                ...filteredFleet.map((m) => [m.id, m.model, m.vendor, m.organ, m.location, m.state, m.batteryPct, m.onMains, m.disposableSetLot ?? "—", m.primingSolution ?? "—", m.serviceDueDays, m.cyclesRun, machineFaults(m).map((f) => f.code).join(" ") || "none"]),
              ]
            : [
                ["ID", "Recipient", "Donor", "Organ", "A mm", "B mm", "DR mm", "Total mismatch", "Crossmatch", "DSA MFI", "cPRA %", "Refusal"],
                ...filteredTypings.map((t) => [
                  t.match.id, t.match.recipient, t.match.donorId, t.match.organ,
                  t.perLocus ? t.perLocus.A : "—", t.perLocus ? t.perLocus.B : "—", t.perLocus ? t.perLocus.DR : "—",
                  t.mismatch ?? "not derivable", t.match.crossmatch, t.match.dsaMfi, t.match.cpra, t.refusal ?? "",
                ]),
              ];

    downloadCsv(`transplant-${tab}.csv`, table);
    toast("CSV export downloaded", "Low");
  };

  const tabs = [
    { id: "offers", label: "Organ Offers", icon: Heart },
    { id: "transit", label: "Ischaemia Clocks", icon: Hourglass },
    { id: "fleet", label: "Perfusion Fleet", icon: Snowflake },
    { id: "immunology", label: "Immunology & Matching", icon: UserCheck },
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
              <Heart size={24} className="text-emerald-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-100">Organ Transplant &amp; Procurement Logistics Hub</h1>
              <p className="mt-0.5 text-xs text-slate-400">
                Offer clocks · cold ischaemia · machine perfusion fleet · HLA matching — EU 2010/53, HTA traceability, EFI standards
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
          <StatCard icon={Hourglass} label="Past Ischaemia Limit" value={stats.pastLimit} sub="against the limit for that organ" accent={stats.pastLimit > 0 ? "text-red-400" : "text-emerald-400"} />
          <StatCard icon={Info} label="No Ischaemia Clock" value={stats.noClock} sub="clamp time missing or impossible" accent={stats.noClock > 0 ? "text-amber-400" : "text-emerald-400"} />
          <StatCard icon={Timer} label="Offer Windows Expired" value={stats.expiredOffers} sub={`${OFFER_WINDOW_MINUTES} min to answer`} accent={stats.expiredOffers > 0 ? "text-red-400" : "text-emerald-400"} />
          <StatCard icon={Snowflake} label="Perfusion Machines Down" value={stats.machinesDown} sub={`${fleet.length}-machine fleet`} accent={stats.machinesDown > 0 ? "text-red-400" : "text-emerald-400"} />
        </div>

        <TabsBar tabs={tabs} active={tab} onChange={setTab} />

        {/* toolbar */}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <CompactSearch value={query} onChange={setQuery} placeholder="Search offers, organs, machines, recipients…" />
          {tab === "offers" && <FilterChips options={["All", "Window expired", "Under review", "Accepted", "DCD"]} value={offerFilter} onChange={setOfferFilter} />}
          {tab === "transit" && <FilterChips options={["All", "Past limit", "No clock", "Machine perfusion", "Kidney"]} value={transitFilter} onChange={setTransitFilter} />}
          {tab === "fleet" && <FilterChips options={["All", "Faulted", "Off site", "Kidney", "Liver"]} value={fleetFilter} onChange={setFleetFilter} />}
          {tab === "immunology" && <FilterChips options={["All", "Typing incomplete", "Contraindicated", "Well matched"]} value={matchFilter} onChange={setMatchFilter} />}
        </div>
      </header>

      <main className="px-6 py-6">
        {/* ============================= ORGAN OFFERS ============================= */}
        {tab === "offers" && (
          <section>
            {filteredOffers.length === 0 ? (
              <EmptyState icon={Heart} message="No offers match the current filters." />
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {filteredOffers.map((entry) => {
                  const { offer, clock } = entry;
                  const expired = offer.status === "Under review" && clock.remaining <= 0;
                  return (
                    <article key={offer.id} className={`rounded-2xl border bg-slate-900/70 p-4 ${expired ? "border-red-500/40" : clock.tone === "amber" ? "border-amber-500/40" : "border-slate-800"}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-mono text-xs font-semibold text-emerald-300">{offer.id}</p>
                          <p className="text-sm font-semibold text-slate-100">{offer.organ}</p>
                          <p className="text-[11px] text-slate-500">{offer.donorType} · age {offer.donorAge} · group {offer.bloodGroup}</p>
                        </div>
                        <ToneBadge tone={clock.tone}>{offer.status}</ToneBadge>
                      </div>

                      <p className="mt-3 truncate text-xs text-slate-300">{offer.recipient}</p>
                      <p className="text-[11px] text-slate-500">{offer.centre} · sequence position {offer.sequence}</p>

                      <div className="mt-3">
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span>Acceptance window</span>
                          <span>{offer.minutesHeld} / {OFFER_WINDOW_MINUTES} min</span>
                        </div>
                        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                          <div
                            className={`h-full rounded-full ${expired ? "bg-red-400" : clock.tone === "amber" ? "bg-amber-400" : "bg-emerald-400"}`}
                            style={{ width: `${Math.min(100, (offer.minutesHeld / OFFER_WINDOW_MINUTES) * 100)}%` }}
                          />
                        </div>
                      </div>

                      <p className={`mt-3 rounded-lg border p-2.5 text-[11px] leading-relaxed ${expired ? "border-red-500/30 bg-red-500/5 text-red-200" : "border-slate-800 bg-slate-950/60 text-slate-400"}`}>
                        {clock.text}
                      </p>

                      {offer.status === "Under review" && (
                        <div className="mt-3 flex gap-2">
                          <button onClick={() => acceptOffer(offer.id)} className="flex-1 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-2 py-1.5 text-[11px] font-semibold text-emerald-300 hover:bg-emerald-500/20">
                            Accept
                          </button>
                          <button onClick={() => declineOffer(offer.id)} className="flex-1 rounded-md border border-slate-700 bg-slate-800/60 px-2 py-1.5 text-[11px] font-semibold text-slate-300 hover:bg-slate-800">
                            Decline
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

        {/* ============================= ISCHAEMIA CLOCKS ============================= */}
        {tab === "transit" && (
          <section>
            <div className="mb-4 rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
              <p className="flex items-start gap-2 text-[11px] leading-relaxed text-slate-400">
                <Info size={14} className="mt-0.5 shrink-0 text-sky-400" />
                <span>
                  Every clock below is derived live from the cross-clamp timestamp, never read from a stored CIT field — a CIT somebody
                  typed is stale from the moment it is typed, and stale is the whole problem when the thing is a clock. Limits are per
                  organ, because a heart at five hours is in trouble and a kidney at five hours has not started, and the machine
                  perfusion extension applies to kidneys on machine perfusion and to nothing else. An unknown preservation method gets
                  the shorter static cold storage limit.
                </span>
              </p>
            </div>

            {filteredTransit.length === 0 ? (
              <EmptyState icon={Hourglass} message="No organs match the current filters." />
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {filteredTransit.map((entry) => {
                  const { record, clock, warm } = entry;
                  const past = clock.status === "Past absolute limit";
                  const pct = clock.hours != null && clock.appliedLimitHours ? Math.min(100, (clock.hours / clock.appliedLimitHours) * 100) : 0;
                  return (
                    <article key={record.id} className={`rounded-2xl border bg-slate-900/70 p-4 ${past ? "border-red-500/40" : clock.refusal ? "border-amber-500/40" : clock.status === "Past ideal" ? "border-amber-500/30" : "border-slate-800"}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <button onClick={() => setModal({ kind: "transit", data: entry })} className="font-mono text-xs font-semibold text-emerald-300 hover:underline">
                            {record.id}
                          </button>
                          <p className="mt-0.5 text-sm font-semibold text-slate-100">{record.organ} · {record.donorType}</p>
                          <p className="truncate text-[11px] text-slate-500">{record.recipient} · {record.destination}</p>
                        </div>
                        <ToneBadge tone={past ? "red" : clock.refusal ? "amber" : clock.status === "Past ideal" ? "amber" : "green"}>
                          {clock.status}
                        </ToneBadge>
                      </div>

                      {clock.refusal ? (
                        <p className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-2.5 text-[11px] leading-relaxed text-amber-200">
                          {clock.refusal}
                        </p>
                      ) : (
                        <>
                          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                            <div className={`rounded-lg border p-2 ${past ? "border-red-500/30 bg-red-500/5" : "border-slate-800 bg-slate-950/60"}`}>
                              <p className="text-[10px] uppercase tracking-wide text-slate-500">CIT</p>
                              <p className={`text-sm font-bold ${past ? "text-red-300" : "text-emerald-300"}`}>{clock.hours} h</p>
                            </div>
                            <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-2">
                              <p className="text-[10px] uppercase tracking-wide text-slate-500">Ideal</p>
                              <p className="text-sm font-bold text-slate-100">{clock.limit.ideal} h</p>
                            </div>
                            <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-2">
                              <p className="text-[10px] uppercase tracking-wide text-slate-500">Limit</p>
                              <p className="text-sm font-bold text-slate-100">{clock.appliedLimitHours} h</p>
                            </div>
                          </div>

                          <div className="mt-3">
                            <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                              <div className={`h-full rounded-full ${past ? "bg-red-400" : clock.status === "Past ideal" ? "bg-amber-400" : "bg-emerald-400"}`} style={{ width: `${pct}%` }} />
                              <div className="absolute inset-y-0 w-px bg-amber-400" style={{ left: `${(clock.limit.ideal / clock.appliedLimitHours) * 100}%` }} />
                            </div>
                            <p className="mt-1 text-[11px] text-slate-500">
                              {record.preservation}
                              {clock.machineExtensionApplied
                                ? ` — machine perfusion extends the limit from ${clock.limit.absolute} h to ${clock.limit.machineExtended} h`
                                : record.preservation === "Unknown"
                                  ? ` — preservation method unknown, so the ${clock.limit.absolute} h static limit applies`
                                  : ""}
                            </p>
                          </div>
                        </>
                      )}

                      {warm && (
                        <p className={`mt-3 rounded-lg border p-2.5 text-[11px] leading-relaxed ${
                          warm.tone === "red" ? "border-red-500/30 bg-red-500/5 text-red-200"
                            : warm.tone === "amber" ? "border-amber-500/30 bg-amber-500/5 text-amber-200"
                              : "border-emerald-500/30 bg-emerald-500/5 text-emerald-200"
                        }`}>
                          {warm.text}
                        </p>
                      )}

                      <div className="mt-3 flex gap-2">
                        {clock.refusal && (
                          <button onClick={() => recordClamp(record.id)} className="flex-1 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-2 py-1.5 text-[11px] font-semibold text-emerald-300 hover:bg-emerald-500/20">
                            Record cross-clamp
                          </button>
                        )}
                        {!clock.machineExtensionApplied && record.organ === "Kidney" && !clock.refusal && (
                          <button onClick={() => moveToMachine(record.id)} className="flex-1 rounded-md border border-slate-700 bg-slate-800/60 px-2 py-1.5 text-[11px] font-semibold text-slate-300 hover:bg-slate-800">
                            Move to machine perfusion
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

        {/* ============================= PERFUSION FLEET ============================= */}
        {tab === "fleet" && (
          <section>
            {filteredFleet.length === 0 ? (
              <EmptyState icon={Snowflake} message="No perfusion machines match the current filters." />
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {filteredFleet.map((machine) => {
                  const faults = machineFaults(machine);
                  const down = faults.some((f) => f.tone === "red");
                  return (
                    <article key={machine.id} className={`rounded-2xl border bg-slate-900/70 p-4 ${down ? "border-red-500/40" : faults.length > 0 ? "border-amber-500/40" : "border-slate-800"}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-mono text-xs font-semibold text-emerald-300">{machine.id}</p>
                          <p className="text-xs text-slate-200">{machine.model}</p>
                          <p className="text-[11px] text-slate-500">{machine.vendor} · {machine.organ} · {machine.location}</p>
                        </div>
                        <ToneBadge tone={down ? "red" : faults.length > 0 ? "amber" : "green"}>{machine.state}</ToneBadge>
                      </div>

                      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                        <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-2">
                          <p className="text-[10px] uppercase tracking-wide text-slate-500">Battery</p>
                          <p className={`text-sm font-bold ${!machine.onMains && machine.batteryPct < 50 ? "text-red-300" : "text-slate-100"}`}>{machine.batteryPct}%</p>
                        </div>
                        <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-2">
                          <p className="text-[10px] uppercase tracking-wide text-slate-500">Cycles</p>
                          <p className="text-sm font-bold text-slate-100">{machine.cyclesRun}</p>
                        </div>
                        <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-2">
                          <p className="text-[10px] uppercase tracking-wide text-slate-500">Service</p>
                          <p className={`text-sm font-bold ${machine.serviceDueDays <= 0 ? "text-red-300" : "text-slate-100"}`}>
                            {machine.serviceDueDays <= 0 ? `${Math.abs(machine.serviceDueDays)}d over` : `${machine.serviceDueDays}d`}
                          </p>
                        </div>
                      </div>

                      <p className="mt-3 text-[11px] text-slate-500">
                        <Battery size={11} className="mr-1 inline" />
                        {machine.onMains ? "On mains" : "Off mains"} · set {machine.disposableSetLot ?? "none loaded"} · {machine.primingSolution ?? "not primed"}
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
                        <button onClick={() => chargeMachine(machine.id)} className="flex-1 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-2 py-1.5 text-[11px] font-semibold text-emerald-300 hover:bg-emerald-500/20">
                          Charge
                        </button>
                        <button onClick={() => recallMachine(machine.id)} className="flex-1 rounded-md border border-slate-700 bg-slate-800/60 px-2 py-1.5 text-[11px] font-semibold text-slate-300 hover:bg-slate-800">
                          Recall
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* ============================= IMMUNOLOGY & MATCHING ============================= */}
        {tab === "immunology" && (
          <section>
            {filteredTypings.length === 0 ? (
              <EmptyState icon={UserCheck} message="No matches match the current filters." />
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {filteredTypings.map((entry) => {
                  const { match, mismatch, perLocus, refusal, findings } = entry;
                  const contraindicated = findings.some((f) => f.tone === "red");
                  return (
                    <article key={match.id} className={`rounded-2xl border bg-slate-900/70 p-4 ${contraindicated ? "border-red-500/40" : refusal ? "border-amber-500/40" : "border-slate-800"}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <button onClick={() => setModal({ kind: "match", data: entry })} className="font-mono text-xs font-semibold text-emerald-300 hover:underline">
                            {match.id}
                          </button>
                          <p className="mt-0.5 truncate text-sm font-semibold text-slate-100">{match.recipient}</p>
                          <p className="text-[11px] text-slate-500">{match.organ} from {match.donorId} · cPRA {match.cpra}%</p>
                        </div>
                        <ToneBadge tone={contraindicated ? "red" : refusal ? "amber" : mismatch <= 2 ? "green" : "slate"}>
                          {refusal ? "Typing incomplete" : `${mismatch}/6 mismatch`}
                        </ToneBadge>
                      </div>

                      {refusal ? (
                        <p className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-2.5 text-[11px] leading-relaxed text-amber-200">
                          {refusal}
                        </p>
                      ) : (
                        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                          {HLA_LOCI.map((locus) => (
                            <div key={locus} className="rounded-lg border border-slate-800 bg-slate-950/60 p-2">
                              <p className="text-[10px] uppercase tracking-wide text-slate-500">HLA-{locus}</p>
                              <p className="text-sm font-bold text-slate-100">{perLocus[locus]} mm</p>
                              <p className="mt-0.5 text-[10px] text-slate-500">{match.donor[locus].join(" ")}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="mt-3 grid grid-cols-2 gap-2 text-center">
                        <div className={`rounded-lg border p-2 ${match.crossmatch === "Positive" ? "border-red-500/30 bg-red-500/5" : "border-slate-800 bg-slate-950/60"}`}>
                          <p className="text-[10px] uppercase tracking-wide text-slate-500">Crossmatch</p>
                          <p className={`text-sm font-bold ${match.crossmatch === "Positive" ? "text-red-300" : "text-slate-100"}`}>{match.crossmatch}</p>
                        </div>
                        <div className={`rounded-lg border p-2 ${match.dsaMfi > 3000 ? "border-red-500/30 bg-red-500/5" : "border-slate-800 bg-slate-950/60"}`}>
                          <p className="text-[10px] uppercase tracking-wide text-slate-500">DSA MFI</p>
                          <p className={`text-sm font-bold ${match.dsaMfi > 3000 ? "text-red-300" : "text-slate-100"}`}>{match.dsaMfi.toLocaleString()}</p>
                        </div>
                      </div>

                      {findings.length > 0 && (
                        <ul className="mt-3 space-y-2">
                          {findings.map((finding) => (
                            <li
                              key={finding.code}
                              className={`rounded-lg border p-2.5 text-[11px] leading-relaxed ${
                                finding.tone === "red" ? "border-red-500/30 bg-red-500/5 text-red-200" : "border-amber-500/30 bg-amber-500/5 text-amber-200"
                              }`}
                            >
                              {finding.text}
                            </li>
                          ))}
                        </ul>
                      )}

                      {refusal && (
                        <button onClick={() => completeTyping(match.id)} className="mt-3 w-full rounded-md border border-emerald-500/40 bg-emerald-500/10 px-2 py-1.5 text-[11px] font-semibold text-emerald-300 hover:bg-emerald-500/20">
                          Record repeat typing
                        </button>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        )}
      </main>

      {/* ============================= INSPECTION MODALS ============================= */}
      {modal && modal.kind === "transit" && (
        <Modal title={`${modal.data.record.organ} · ${modal.data.record.id}`} subtitle={`${modal.data.record.donorType} donor ${modal.data.record.donorId} → ${modal.data.record.recipient}`} onClose={() => setModal(null)}>
          <Row label="Destination" value={modal.data.record.destination} />
          <Row label="Courier" value={modal.data.record.courier} />
          <Row label="Preservation" value={modal.data.record.preservation} />
          <Row label="Perfusion machine" value={modal.data.record.machineId ?? "none — static cold storage"} />
          <Row label="Cross-clamp" value={modal.data.record.crossClampHoursAgo == null ? "not recorded" : `${modal.data.record.crossClampHoursAgo} hours ago`} accent={modal.data.record.crossClampHoursAgo == null ? "text-amber-300" : undefined} />
          <Row label="Cold ischaemia" value={modal.data.clock.hours == null ? "not computable" : `${modal.data.clock.hours} h`} accent={modal.data.clock.status === "Past absolute limit" ? "text-red-300" : undefined} />
          {modal.data.clock.limit && (
            <>
              <Row label="Ideal limit" value={`${modal.data.clock.limit.ideal} h`} />
              <Row label="Applied limit" value={modal.data.clock.appliedLimitHours == null ? "—" : `${modal.data.clock.appliedLimitHours} h`} />
            </>
          )}
          <Row label="DCD warm ischaemia" value={modal.data.record.donorType === "DCD" ? `${modal.data.record.functionalWarmMin ?? "not recorded"} min` : "not applicable"} />

          {modal.data.clock.refusal ? (
            <p className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-[11px] leading-relaxed text-amber-200">
              {modal.data.clock.refusal}
            </p>
          ) : (
            <p className="mt-3 rounded-lg border border-slate-800 bg-slate-950/60 p-3 text-[11px] leading-relaxed text-slate-400">
              {modal.data.clock.machineExtensionApplied
                ? `This kidney is on ${modal.data.record.preservation.toLowerCase()}, which extends the limit from ${modal.data.clock.limit.absolute} h to ${modal.data.clock.limit.machineExtended} h. The extension is applied from the method actually in use rather than the one that was planned, and it applies to kidneys only.`
                : `A ${modal.data.record.organ.toLowerCase()} on ${modal.data.record.preservation.toLowerCase()} carries the ${modal.data.clock.limit.absolute} h limit. Machine perfusion extends the kidney limit and only the kidney limit, so no extension is available here.`}
            </p>
          )}
        </Modal>
      )}

      {modal && modal.kind === "match" && (
        <Modal title={modal.data.match.recipient} subtitle={`${modal.data.match.id} · ${modal.data.match.organ} from ${modal.data.match.donorId}`} onClose={() => setModal(null)}>
          {HLA_LOCI.map((locus) => (
            <Row
              key={locus}
              label={`HLA-${locus}`}
              value={`donor ${modal.data.match.donor[locus].join(", ")} · recipient ${modal.data.match.recipientTyping[locus].join(", ")}`}
            />
          ))}
          <Row label="Total mismatch" value={modal.data.mismatch == null ? "not derivable" : `${modal.data.mismatch} of 6`} accent={modal.data.mismatch == null ? "text-amber-300" : undefined} />
          <Row label="Crossmatch" value={modal.data.match.crossmatch} accent={modal.data.match.crossmatch === "Positive" ? "text-red-300" : undefined} />
          <Row label="Donor-specific antibody" value={`${modal.data.match.dsaMfi.toLocaleString()} MFI`} accent={modal.data.match.dsaMfi > 3000 ? "text-red-300" : undefined} />
          <Row label="cPRA" value={`${modal.data.match.cpra}%`} />

          {modal.data.refusal ? (
            <p className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-[11px] leading-relaxed text-amber-200">
              {modal.data.refusal}
            </p>
          ) : (
            <p className="mt-3 rounded-lg border border-slate-800 bg-slate-950/60 p-3 text-[11px] leading-relaxed text-slate-400">
              Mismatch is counted as donor antigens absent from the recipient, across A, B and DR — {modal.data.perLocus.A} + {modal.data.perLocus.B} + {modal.data.perLocus.DR} = {modal.data.mismatch} of 6.
              What it does not tell you is shown beside it rather than folded into it: a 0-mismatch graft can still carry donor-specific
              antibodies and a positive crossmatch, and a single composite score would average away the finding that is an absolute
              contraindication.
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
        <span className="hidden md:inline">EU Directive 2010/53 · HTA traceability · EFI histocompatibility standards · Maastricht DCD classification</span>
        <span className="inline-flex items-center gap-1.5">
          <Plane size={12} /> {offers.length} offers · {transit.length} in transit · {fleet.length} machines · {matches.length} matches
        </span>
        <span className="hidden xl:inline-flex items-center gap-1.5">
          <FileText size={12} /> Kidney limit {ISCHAEMIA_LIMITS.Kidney.absolute} h static, {ISCHAEMIA_LIMITS.Kidney.machineExtended} h perfused
        </span>
      </footer>
    </div>
  );
}
