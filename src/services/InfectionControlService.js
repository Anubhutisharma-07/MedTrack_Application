/**
 * InfectionControlService
 * Client-side infection control & antibiotic stewardship data layer.
 * Tracks HAIs, antimicrobial resistance, antibiotic DDD usage, and hand hygiene.
 */

/* ── Infection Types ─────────────────────────────────────────────────────── */

export const INFECTION_TYPES = [
  { id: "clabsi", name: "CLABSI", fullName: "Central Line-Associated Bloodstream Infection", category: "BSI", severity: "critical" },
  { id: "cauti", name: "CAUTI", fullName: "Catheter-Associated Urinary Tract Infection", category: "UTI", severity: "high" },
  { id: "ssi", name: "SSI", fullName: "Surgical Site Infection", category: "Surgical", severity: "high" },
  { id: "cdiff", name: "C. diff", fullName: "Clostridioides difficile Infection", category: "Gastro", severity: "critical" },
  { id: "mrsa", name: "MRSA", fullName: "Methicillin-Resistant Staphylococcus aureus", category: "MDRO", severity: "critical" },
  { id: "vre", name: "VRE", fullName: "Vancomycin-Resistant Enterococcus", category: "MDRO", severity: "high" },
  { id: "hap", name: "HAP", fullName: "Hospital-Acquired Pneumonia", category: "Respiratory", severity: "high" },
  { id: "ssi_deep", name: "Deep SSI", fullName: "Deep Incisional Surgical Site Infection", category: "Surgical", severity: "critical" },
];

/* ── Wards ───────────────────────────────────────────────────────────────── */

export const WARDS = [
  { id: "icu", name: "ICU", beds: 20, type: "Critical Care" },
  { id: "med-surg", name: "Med-Surg", beds: 40, type: "Medical/Surgical" },
  { id: "ortho", name: "Orthopedics", beds: 25, type: "Surgical" },
  { id: "onc", name: "Oncology", beds: 30, type: "Medical" },
];

/* ── Resistance Matrix ───────────────────────────────────────────────────── */

export const ORGANISMS = ["S. aureus", "E. coli", "K. pneumoniae", "P. aeruginosa", "E. faecium", "A. baumannii"];
export const ANTIBIOTICS = ["Vancomycin", "Meropenem", "Ciprofloxacin", "Ceftriaxone", "Gentamicin", "Piperacillin", "Linezolid", "Colistin"];

export const RESISTANCE_MATRIX = [
  [5, 12, 45, 38, 22, 30, 3, 0],   // S. aureus
  [0, 8, 35, 28, 15, 42, 0, 0],    // E. coli
  [0, 22, 40, 55, 30, 60, 0, 5],   // K. pneumoniae
  [0, 18, 50, 0, 25, 55, 0, 10],   // P. aeruginosa
  [80, 10, 20, 0, 15, 0, 5, 0],    // E. faecium
  [0, 65, 70, 45, 50, 75, 0, 30],  // A. baumannii
];

/* ── Mock Ward Surveillance Data ─────────────────────────────────────────── */

function generateWardData() {
  const now = Date.now();
  return WARDS.map((ward) => {
    const baseRate = ward.id === "icu" ? 8.2 : ward.id === "onc" ? 5.5 : 3.8;
    return {
      wardId: ward.id,
      wardName: ward.name,
      beds: ward.beds,
      occupied: Math.floor(ward.beds * (0.7 + Math.random() * 0.25)),
      haiRate: +(baseRate + (Math.random() - 0.5) * 2).toFixed(1),
      deviceDays: Math.floor(150 + Math.random() * 200),
      infections: Math.floor(Math.random() * 5),
      handHygiene: +(82 + Math.random() * 15).toFixed(1),
      lastUpdated: new Date(now - Math.random() * 3600_000).toISOString(),
    };
  });
}

export const WARD_SURVEILLANCE = generateWardData();

/* ── Antibiotic Usage Data ───────────────────────────────────────────────── */

export const ANTIBIOTIC_USAGE = [
  { antibiotic: "Meropenem", category: "Carbapenem", ddd: 42.3, target: 35, ward: "icu", trend: "rising" },
  { antibiotic: "Vancomycin", category: "Glycopeptide", ddd: 38.1, target: 30, ward: "icu", trend: "stable" },
  { antibiotic: "Piperacillin-Tazobactam", category: "Penicillin", ddd: 55.8, target: 50, ward: "med-surg", trend: "rising" },
  { antibiotic: "Ciprofloxacin", category: "Fluoroquinolone", ddd: 28.4, target: 25, ward: "ortho", trend: "declining" },
  { antibiotic: "Ceftriaxone", category: "Cephalosporin", ddd: 35.0, target: 30, ward: "onc", trend: "stable" },
  { antibiotic: "Linezolid", category: "Oxazolidinone", ddd: 12.6, target: 15, ward: "icu", trend: "declining" },
  { antibiotic: "Gentamicin", category: "Aminoglycoside", ddd: 18.2, target: 20, ward: "med-surg", trend: "stable" },
  { antibiotic: "Metronidazole", category: "Nitroimidazole", ddd: 22.0, target: 20, ward: "onc", trend: "rising" },
];

/* ── Hand Hygiene Compliance ─────────────────────────────────────────────── */

export const HAND_HYGIENE = [
  { moment: "Before Patient Contact", rate: 91.2, target: 95, samples: 420 },
  { moment: "After Patient Contact", rate: 88.5, target: 95, samples: 415 },
  { moment: "Before Aseptic Procedure", rate: 94.8, target: 98, samples: 180 },
  { moment: "After Body Fluid Exposure", rate: 90.1, target: 95, samples: 210 },
  { moment: "After Touching Patient Surroundings", rate: 82.3, target: 90, samples: 390 },
];

/* ── Active Alerts ───────────────────────────────────────────────────────── */

export const ACTIVE_ALERTS = [
  {
    id: "alert-001",
    type: "outbreak",
    infection: "C. diff",
    ward: "ICU",
    severity: "critical",
    message: "C. diff incidence exceeds 3× baseline in ICU over past 7 days",
    triggeredAt: new Date(Date.now() - 2 * 3600_000).toISOString(),
    count: 5,
    trend: "rising",
  },
  {
    id: "alert-002",
    type: "resistance",
    infection: "MRSA",
    ward: "Med-Surg",
    severity: "high",
    message: "MRSA resistance to ciprofloxacin increased from 35% to 52% this quarter",
    triggeredAt: new Date(Date.now() - 8 * 3600_000).toISOString(),
    count: 8,
    trend: "rising",
  },
  {
    id: "alert-003",
    type: "hygiene",
    infection: "Hand Hygiene",
    ward: "Orthopedics",
    severity: "moderate",
    message: "Hand hygiene compliance dropped below 85% threshold in Orthopedics",
    triggeredAt: new Date(Date.now() - 14 * 3600_000).toISOString(),
    count: 12,
    trend: "declining",
  },
  {
    id: "alert-004",
    type: "usage",
    infection: "Carbapenem",
    ward: "ICU",
    severity: "high",
    message: "Carbapenem DDD exceeds stewardship target — de-escalation review required",
    triggeredAt: new Date(Date.now() - 1 * 3600_000).toISOString(),
    count: 3,
    trend: "rising",
  },
];

/* ── Core Functions ──────────────────────────────────────────────────────── */

/** Returns resistance level label for a given percentage */
export function resistanceLevel(pct) {
  if (pct <= 10) return "sensitive";
  if (pct <= 30) return "intermediate";
  return "resistant";
}

/** Returns color class for a resistance level */
export function resistanceColor(level) {
  return { sensitive: "bg-emerald-500/20 text-emerald-400", intermediate: "bg-amber-500/20 text-amber-400", resistant: "bg-rose-500/20 text-rose-400" }[level] || "";
}

/** Calculates overall HAI rate across all wards */
export function calculateOverallHaiRate() {
  const total = WARD_SURVEILLANCE.reduce((s, w) => s + w.infections, 0);
  const pdays = WARD_SURVEILLANCE.reduce((s, w) => s + w.occupied, 0);
  return pdays > 0 ? +((total / pdays) * 1000).toFixed(1) : 0;
}

/** Calculates average hand hygiene compliance */
export function calculateHandHygieneAvg() {
  const avg = HAND_HYGIENE.reduce((s, h) => s + h.rate, 0) / HAND_HYGIENE.length;
  return +avg.toFixed(1);
}

/** Calculates average DDD per 1000 patient-days */
export function calculateAvgDdd() {
  const avg = ANTIBIOTIC_USAGE.reduce((s, a) => s + a.ddd, 0) / ANTIBIOTIC_USAGE.length;
  return +avg.toFixed(1);
}

/** Returns antibiotics exceeding their DDD target */
export function getDddExceedances() {
  return ANTIBIOTIC_USAGE.filter((a) => a.ddd > a.target);
}
