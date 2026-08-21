// Tests for the Respiratory Therapy & Ventilator Fleet Hub.
//
// The weight is on the lung protection console, because that is the part of the page that makes a
// claim rather than displays a number. It recalculates the safe tidal volume from the patient's
// height and sex and compares it against what the ventilator is set to deliver; if the
// recalculation is wrong the console endorses harmful settings and flags safe ones, which is worse
// than not checking at all.
//
// So predictedBodyWeight is tested against hand-worked values rather than against itself, both
// sexes are pinned separately, and - the cases that matter most - the patients the console
// *refuses* to grade are asserted as refusals rather than as a pass.

import { screen, fireEvent, within, act } from "@testing-library/react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderWithProviders } from "../../utils/renderWithProviders";
import RespiratoryVentilatorFleetHub, {
  predictedBodyWeight,
  drivingPressure,
  mechanicalPower,
  lungProtection,
  cylinderMinutes,
  cylinderFillPct,
  rsbi,
  sbtReadiness,
  circuitFaults,
} from "../../../pages/respiratory/RespiratoryVentilatorFleetHub";

/** A patient whose settings are inside the protocol on every axis. */
const compliantPatient = {
  id: "RSP-TEST",
  patient: "PT-0000 — Test",
  bed: "ICU Bed 0",
  sex: "M",
  heightCm: 178,
  actualWeightKg: 96,
  mode: "VC-AC",
  setVt: 430,
  rate: 16,
  pplat: 24,
  peep: 10,
  ppeak: 29,
  fio2: 0.4,
  plateauAgeMin: 20,
  diagnosis: "Test",
};

describe("predictedBodyWeight", () => {
  it("computes the ARDSNet male predicted weight", () => {
    // Hand-worked: 50.0 + 0.91 x (178 - 152.4) = 50.0 + 0.91 x 25.6 = 50.0 + 23.296 = 73.296
    expect(predictedBodyWeight("M", 178)).toBe(73.3);
  });

  it("computes the ARDSNet female predicted weight", () => {
    // Hand-worked: 45.5 + 0.91 x (158 - 152.4) = 45.5 + 0.91 x 5.6 = 45.5 + 5.096 = 50.596
    expect(predictedBodyWeight("F", 158)).toBe(50.6);
  });

  it("uses the female base constant, so the same height gives a lower weight than for a male", () => {
    // The 4.5 kg difference between the base constants is the whole of the sex term, and it is
    // 4.5 kg of tidal volume - 27 mL at 6 mL/kg - on every breath.
    expect(predictedBodyWeight("M", 170) - predictedBodyWeight("F", 170)).toBeCloseTo(4.5, 5);
  });

  it("returns the height-based weight and never the patient's actual weight", () => {
    // The defect this whole console exists to catch. A 169 cm patient weighing 121 kg has the lungs
    // of the 65 kg person their height predicts; ventilating to 121 kg delivers nearly double.
    const pbw = predictedBodyWeight("M", 169);

    expect(pbw).toBeCloseTo(65.1, 1);
    expect(pbw).toBeLessThan(70);
  });

  it("refuses to produce a weight with no recorded height", () => {
    expect(predictedBodyWeight("M", null)).toBeNull();
    expect(predictedBodyWeight("F", undefined)).toBeNull();
  });

  it("refuses a non-finite or non-positive height rather than returning a nonsense weight", () => {
    expect(predictedBodyWeight("M", 0)).toBeNull();
    expect(predictedBodyWeight("M", -170)).toBeNull();
    expect(predictedBodyWeight("M", Number.NaN)).toBeNull();
  });

  it("refuses a height that would put the regression below a plausible adult weight", () => {
    // 90 cm gives 50.0 + 0.91 x (90 - 152.4) = -6.8 kg. A negative PBW would produce a mL/kg figure
    // of nonsense magnitude rather than an obvious error, so it is refused instead.
    expect(predictedBodyWeight("M", 90)).toBeNull();
  });
});

describe("drivingPressure", () => {
  it("subtracts PEEP from the plateau pressure", () => {
    expect(drivingPressure({ pplat: 26, peep: 10, plateauAgeMin: 30 })).toBe(16);
  });

  it("refuses a plateau older than the staleness window", () => {
    // 380 minutes is beyond the 240 minute window: the lung has since been recruited, derecruited,
    // proned or suctioned, and the subtraction describes a lung that no longer exists.
    expect(drivingPressure({ pplat: 29, peep: 12, plateauAgeMin: 380 })).toBeNull();
  });

  it("refuses a plateau with no measurement time at all", () => {
    expect(drivingPressure({ pplat: 29, peep: 12, plateauAgeMin: null })).toBeNull();
  });

  it("refuses when either term is missing", () => {
    expect(drivingPressure({ pplat: null, peep: 10, plateauAgeMin: 10 })).toBeNull();
    expect(drivingPressure({ pplat: 26, peep: null, plateauAgeMin: 10 })).toBeNull();
  });
});

describe("mechanicalPower", () => {
  it("computes the Gattinoni surrogate from rate, volume and pressure", () => {
    // driving = 30 - 10 = 20; power = 0.098 x 20 x 0.5 x (35 - 10) = 0.098 x 20 x 0.5 x 25 = 24.5
    const power = mechanicalPower({ pplat: 30, peep: 10, ppeak: 35, setVt: 500, rate: 20, plateauAgeMin: 10 });

    expect(power).toBeCloseTo(24.5, 1);
  });

  it("returns null when the driving pressure it depends on is refused", () => {
    expect(mechanicalPower({ pplat: 30, peep: 10, ppeak: 35, setVt: 500, rate: 20, plateauAgeMin: 999 })).toBeNull();
  });
});

describe("lungProtection", () => {
  it("passes a patient inside the protocol on every axis", () => {
    const result = lungProtection(compliantPatient);

    expect(result.evaluable).toBe(true);
    expect(result.pbw).toBe(73.3);
    // 6 x 73.3 = 439.8, rounded to 440
    expect(result.targetMl).toBe(440);
    // 430 / 73.3 = 5.866...
    expect(result.perKg).toBeCloseTo(5.87, 2);
    expect(result.flags).toEqual([]);
  });

  it("flags a tidal volume set to actual rather than predicted body weight", () => {
    // The canonical error: 169 cm, 121 kg, ventilated at 700 mL. Against actual weight that is a
    // modest 5.8 mL/kg; against predicted weight it is 10.8 and frankly injurious.
    const result = lungProtection({
      ...compliantPatient, heightCm: 169, actualWeightKg: 121, setVt: 700, pplat: 34, peep: 14, ppeak: 41, rate: 20, fio2: 0.8,
    });

    expect(result.evaluable).toBe(true);
    expect(result.perKg).toBeGreaterThan(10);
    expect(result.flags.map((f) => f.code)).toContain("VT-HIGH");
    expect(result.flags.find((f) => f.code === "VT-HIGH").tone).toBe("red");
  });

  it("accumulates every flag rather than stopping at the first", () => {
    // Over volume, over plateau and over driving pressure at once. Reporting only the first costs a
    // round trip for information that was already on the screen.
    const result = lungProtection({
      ...compliantPatient, heightCm: 169, setVt: 700, pplat: 34, peep: 14, ppeak: 41, rate: 20, fio2: 0.8,
    });
    const codes = result.flags.map((f) => f.code);

    expect(codes).toContain("VT-HIGH");
    expect(codes).toContain("PPLAT");
    expect(codes).toContain("DRIVING");
    expect(result.flags.length).toBeGreaterThanOrEqual(3);
  });

  it("refuses to grade a patient with no recorded height", () => {
    const result = lungProtection({ ...compliantPatient, heightCm: null, actualWeightKg: 80, setVt: 550 });

    expect(result.evaluable).toBe(false);
    expect(result.pbw).toBeNull();
    expect(result.targetMl).toBeNull();
    expect(result.perKg).toBeNull();
    expect(result.refusal).toMatch(/no recorded height/i);
    // The refusal must be explicit that the fallback was considered and rejected.
    expect(result.refusal).toMatch(/actual body weight is not/i);
  });

  it("never substitutes actual body weight when the height is missing", () => {
    // 550 mL against the 80 kg actual weight would be 6.9 mL/kg - comfortably inside the band, and
    // entirely meaningless. The console must produce no figure at all rather than that one.
    const result = lungProtection({ ...compliantPatient, heightCm: null, actualWeightKg: 80, setVt: 550 });

    expect(result.perKg).toBeNull();
    expect(result.flags).toEqual([]);
  });

  it("refuses to grade a spontaneous mode against a mandatory-breath target", () => {
    // 610 mL on a 172 cm male is 8.9 mL/kg, which would be a red breach - but the patient chose the
    // breath in PSV, and flagging successful weaning teaches people to dismiss the flag.
    const result = lungProtection({ ...compliantPatient, heightCm: 172, mode: "PSV", setVt: 610 });

    expect(result.evaluable).toBe(false);
    expect(result.refusal).toMatch(/spontaneous mode/i);
    expect(result.flags).toEqual([]);
  });

  it("refuses each non-invasive and spontaneous mode by name", () => {
    for (const mode of ["PSV", "CPAP", "NIV-ST", "HFNC"]) {
      expect(lungProtection({ ...compliantPatient, mode }).evaluable).toBe(false);
    }
  });

  it("refuses a patient with no set tidal volume at all", () => {
    const result = lungProtection({ ...compliantPatient, mode: "VC-AC", setVt: null });

    expect(result.evaluable).toBe(false);
    expect(result.refusal).toMatch(/No set tidal volume/);
  });

  it("distinguishes a drift above target from a breach of the ceiling", () => {
    // 6.9 mL/kg is inside the 4-8 band but above the 6 mL/kg target: an amber step-down, not a red.
    const drift = lungProtection({ ...compliantPatient, setVt: 505 });
    const drifted = drift.flags.find((f) => f.code === "VT-DRIFT");

    expect(drifted).toBeDefined();
    expect(drifted.tone).toBe("amber");
    expect(drift.flags.some((f) => f.tone === "red")).toBe(false);
  });

  it("flags a tidal volume below the protective floor as a possible leak rather than as extra safety", () => {
    const result = lungProtection({ ...compliantPatient, setVt: 250 });
    const low = result.flags.find((f) => f.code === "VT-LOW");

    expect(low).toBeDefined();
    expect(low.text).toMatch(/leak/i);
  });

  it("reports a stale plateau as stale instead of silently omitting driving pressure", () => {
    const result = lungProtection({ ...compliantPatient, plateauAgeMin: 380 });

    expect(result.flags.map((f) => f.code)).toContain("PPLAT-STALE");
    expect(result.flags.map((f) => f.code)).not.toContain("DRIVING");
  });

  it("flags a high FiO2 carried on a PEEP off the ARDSNet ladder", () => {
    const result = lungProtection({ ...compliantPatient, fio2: 0.7, peep: 6 });

    expect(result.flags.map((f) => f.code)).toContain("PEEP-FIO2");
  });
});

describe("cylinderMinutes", () => {
  it("computes burn-time from usable contents and total flow", () => {
    // (118 - 10) bar x 2.0 L = 216 L usable; 216 / (6 + 4) = 21.6 -> 21 minutes.
    expect(cylinderMinutes({ kind: "Cylinder", size: "CD", gaugeBar: 118, flowLpm: 6, drivingGasLpm: 4 })).toBe(21);
  });

  it("counts the ventilator's driving gas against the same cylinder", () => {
    // Omitting the 4 L/min driving draw over-states this cylinder by more than half.
    const withDriving = cylinderMinutes({ kind: "Cylinder", size: "CD", gaugeBar: 118, flowLpm: 6, drivingGasLpm: 4 });
    const without = cylinderMinutes({ kind: "Cylinder", size: "CD", gaugeBar: 118, flowLpm: 6, drivingGasLpm: 0 });

    expect(without).toBeGreaterThan(withDriving);
    expect(without).toBe(36);
  });

  it("holds back the reserve pressure rather than counting down to an empty cylinder", () => {
    // At 10 bar the cylinder is at reserve, so there are zero usable minutes even though it is not
    // empty. Counting the reserve would give 10 x 2.0 / 5 = 4 more minutes that must not be planned.
    expect(cylinderMinutes({ kind: "Cylinder", size: "CD", gaugeBar: 10, flowLpm: 5, drivingGasLpm: 0 })).toBe(0);
    expect(cylinderMinutes({ kind: "Cylinder", size: "CD", gaugeBar: 4, flowLpm: 5, drivingGasLpm: 0 })).toBe(0);
  });

  it("uses the water capacity for the size, so the same gauge gives very different answers", () => {
    // The error that produces stranded patients: "half full" is 340 L on a CD and 1360 L on an E.
    const cd = cylinderMinutes({ kind: "Cylinder", size: "CD", gaugeBar: 110, flowLpm: 10, drivingGasLpm: 0 });
    const j = cylinderMinutes({ kind: "Cylinder", size: "J", gaugeBar: 110, flowLpm: 10, drivingGasLpm: 0 });

    expect(cd).toBe(20);
    expect(j).toBe(470);
  });

  it("refuses to divide by a zero total flow", () => {
    expect(cylinderMinutes({ kind: "Cylinder", size: "J", gaugeBar: 191, flowLpm: 0, drivingGasLpm: 0 })).toBeNull();
  });

  it("returns null for anything that is not a cylinder", () => {
    expect(cylinderMinutes({ kind: "Concentrator", size: "—", gaugeBar: null, flowLpm: 4 })).toBeNull();
  });

  it("refuses an unrecognised cylinder size rather than guessing a capacity", () => {
    expect(cylinderMinutes({ kind: "Cylinder", size: "ZZ", gaugeBar: 150, flowLpm: 5 })).toBeNull();
  });
});

describe("cylinderFillPct", () => {
  it("expresses the gauge as a percentage of the filling pressure", () => {
    expect(cylinderFillPct({ kind: "Cylinder", gaugeBar: 100 })).toBe(50);
  });

  it("clamps rather than reporting an over-full cylinder", () => {
    expect(cylinderFillPct({ kind: "Cylinder", gaugeBar: 260 })).toBe(100);
    expect(cylinderFillPct({ kind: "Cylinder", gaugeBar: -5 })).toBe(0);
  });
});

describe("rsbi", () => {
  it("divides rate by tidal volume in litres, not millilitres", () => {
    // 26 / 0.310 = 83.9 -> 84. Using millilitres directly gives 0.08, a factor of a thousand out.
    expect(rsbi({ rate: 26, spontaneousVtMl: 310 })).toBe(84);
  });

  it("returns null rather than dividing by a missing tidal volume", () => {
    expect(rsbi({ rate: 20, spontaneousVtMl: 0 })).toBeNull();
    expect(rsbi({ rate: 0, spontaneousVtMl: 400 })).toBeNull();
  });
});

describe("sbtReadiness", () => {
  const readyPatient = {
    ventDays: 6, rate: 18, spontaneousVtMl: 420, fio2: 0.3, peep: 5,
    gcs: 15, vasopressor: false, cuffLeak: true, secretionsHeavy: false,
  };

  it("clears a patient meeting every criterion", () => {
    const result = sbtReadiness(readyPatient);

    expect(result.ready).toBe(true);
    expect(result.blockers).toEqual([]);
  });

  it("lists every blocker rather than the first failing criterion", () => {
    const result = sbtReadiness({
      ...readyPatient, fio2: 0.8, peep: 14, gcs: 9, vasopressor: true, cuffLeak: false,
      secretionsHeavy: true, rate: 30, spontaneousVtMl: 260,
    });
    const codes = result.blockers.map((b) => b.code);

    expect(result.ready).toBe(false);
    // "Not ready" is an instruction to do nothing; a list of seven is a list of things to work on.
    expect(codes).toEqual(expect.arrayContaining(["FIO2", "PEEP", "PRESSOR", "GCS", "RSBI", "CUFF", "SECRETIONS"]));
  });

  it("blocks on an RSBI above the threshold", () => {
    // 30 / 0.260 = 115, above 105.
    const result = sbtReadiness({ ...readyPatient, rate: 30, spontaneousVtMl: 260 });

    expect(result.index).toBe(115);
    expect(result.blockers.map((b) => b.code)).toContain("RSBI");
  });

  it("blocks an absent cuff leak, because extubating into a swollen airway is a re-intubation", () => {
    const result = sbtReadiness({ ...readyPatient, cuffLeak: false });

    expect(result.blockers.map((b) => b.code)).toEqual(["CUFF"]);
  });
});

describe("circuitFaults", () => {
  const inUse = { status: "In use", circuitHours: 40, hmeHours: 6, calibrationDueDays: 60, onMains: true, batteryPct: 100 };

  it("returns nothing for a unit inside every interval", () => {
    expect(circuitFaults(inUse)).toEqual([]);
  });

  it("flags a circuit past its change interval", () => {
    expect(circuitFaults({ ...inUse, circuitHours: 191 }).map((f) => f.code)).toContain("CIRCUIT");
  });

  it("flags an HME past its 24 hour interval as an advisory rather than a fault", () => {
    const faults = circuitFaults({ ...inUse, hmeHours: 31 });

    expect(faults.map((f) => f.code)).toContain("HME");
    expect(faults.find((f) => f.code === "HME").tone).toBe("amber");
  });

  it("does not age the circuit of a unit that is not in use", () => {
    // A standby ventilator's circuit hours are not accruing, so a stored unit is not reported as a
    // hygiene breach every day it sits on the shelf.
    expect(circuitFaults({ ...inUse, status: "Standby", circuitHours: 400, hmeHours: 400 })).toEqual([]);
  });

  it("flags an overdue calibration whatever the unit's status", () => {
    const faults = circuitFaults({ ...inUse, status: "Service", calibrationDueDays: -21 });

    expect(faults.map((f) => f.code)).toContain("CAL");
  });

  it("warns before a calibration lapses rather than only after", () => {
    const faults = circuitFaults({ ...inUse, calibrationDueDays: 9 });

    expect(faults.map((f) => f.code)).toContain("CAL-SOON");
    expect(faults.find((f) => f.code === "CAL-SOON").tone).toBe("amber");
  });

  it("flags a transport unit running low on battery off mains", () => {
    const faults = circuitFaults({ ...inUse, onMains: false, batteryPct: 41 });

    expect(faults.map((f) => f.code)).toContain("BATTERY");
  });

  it("does not flag a low battery on a unit sitting on mains", () => {
    expect(circuitFaults({ ...inUse, onMains: true, batteryPct: 20 }).map((f) => f.code)).not.toContain("BATTERY");
  });
});

describe("RespiratoryVentilatorFleetHub rendering", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders the heading, the stat strip and all four consoles", () => {
    renderWithProviders(<RespiratoryVentilatorFleetHub />);

    expect(screen.getByText(/Respiratory Therapy & Ventilator Fleet Hub/)).toBeInTheDocument();
    expect(screen.getByText("Protocol Breaches")).toBeInTheDocument();
    expect(screen.getByText("No Recorded Height")).toBeInTheDocument();
    expect(screen.getByText("Units Out of Spec")).toBeInTheDocument();
    expect(screen.getByText("Cylinders Under 30 min")).toBeInTheDocument();

    for (const label of ["Ventilator Fleet", "Lung Protection", "Oxygen Logistics", "Weaning & SBT"]) {
      expect(screen.getByRole("button", { name: new RegExp(label) })).toBeInTheDocument();
    }
  });

  it("opens on the ventilator fleet and marks a lapsed calibration", () => {
    renderWithProviders(<RespiratoryVentilatorFleetHub />);

    expect(screen.getByText("VNT-ICU-01")).toBeInTheDocument();
    // VNT-ICU-03 seeds at -6 days.
    expect(screen.getByText(/calibration 6 days overdue/i)).toBeInTheDocument();
  });

  it("records a calibration and clears the overdue state", () => {
    renderWithProviders(<RespiratoryVentilatorFleetHub />);

    const card = screen.getByText("VNT-ICU-03").closest("article");
    fireEvent.click(within(card).getByRole("button", { name: /Record calibration/ }));

    expect(screen.queryByText(/calibration 6 days overdue/i)).not.toBeInTheDocument();
  });

  it("changes a circuit and restarts both hygiene clocks", () => {
    renderWithProviders(<RespiratoryVentilatorFleetHub />);

    const card = screen.getByText("VNT-ICU-02").closest("article");
    expect(within(card).getByText(/past the 168 h change interval/)).toBeInTheDocument();

    fireEvent.click(within(card).getByRole("button", { name: /Change circuit/ }));

    expect(within(screen.getByText("VNT-ICU-02").closest("article")).queryByText(/past the 168 h change interval/)).not.toBeInTheDocument();
  });

  it("filters the fleet by device class", () => {
    renderWithProviders(<RespiratoryVentilatorFleetHub />);

    fireEvent.click(screen.getByRole("button", { name: "Transport" }));

    expect(screen.getByText("VNT-TRP-01")).toBeInTheDocument();
    expect(screen.queryByText("VNT-ICU-01")).not.toBeInTheDocument();
  });

  it("shows an empty state when nothing matches the search", () => {
    renderWithProviders(<RespiratoryVentilatorFleetHub />);

    fireEvent.change(screen.getByPlaceholderText(/Search units, patients/), {
      target: { value: "no-such-device" },
    });

    expect(screen.getByText("No ventilators match the current filters.")).toBeInTheDocument();
  });

  it("shows the predicted weight beside the struck-through actual weight", () => {
    renderWithProviders(<RespiratoryVentilatorFleetHub />);

    fireEvent.click(screen.getByRole("button", { name: /Lung Protection/ }));

    const card = screen.getByText("RSP-1106").closest("article");
    // 169 cm male -> 65.1 kg predicted, against the 121 kg the patient weighs.
    expect(within(card).getByText("65.1")).toBeInTheDocument();
    expect(within(card).getByText("121")).toBeInTheDocument();
  });

  it("renders the refusal rather than a target for the patient with no height", () => {
    renderWithProviders(<RespiratoryVentilatorFleetHub />);

    fireEvent.click(screen.getByRole("button", { name: /Lung Protection/ }));

    const card = screen.getByText("RSP-1108").closest("article");
    expect(within(card).getByText(/Not gradeable/)).toBeInTheDocument();
    expect(within(card).getByText(/no recorded height/i)).toBeInTheDocument();
    // And no step-to button, because there is no target to step to.
    expect(within(card).queryByRole("button", { name: /Step to/ })).not.toBeInTheDocument();
  });

  it("steps a breaching patient to the predicted-weight target and clears only the volume flag", () => {
    renderWithProviders(<RespiratoryVentilatorFleetHub />);

    fireEvent.click(screen.getByRole("button", { name: /Lung Protection/ }));

    const card = screen.getByText("RSP-1106").closest("article");
    expect(within(card).getByText("Breach")).toBeInTheDocument();
    expect(within(card).getByText(/above the 8 mL\/kg protocol ceiling/)).toBeInTheDocument();

    // 169 cm male -> 65.1 kg predicted -> 6 x 65.1 = 390.6, rounded to 391 mL.
    fireEvent.click(within(card).getByRole("button", { name: /Step to 391 mL/ }));

    const stepped = screen.getByText("RSP-1106").closest("article");
    expect(within(stepped).queryByText(/above the 8 mL\/kg protocol ceiling/)).not.toBeInTheDocument();

    // The card stays red, and that is the point: plateau 34 and driving pressure 20 are breaches
    // of their own, and a console that went green on the tidal volume alone would report an
    // injurious lung as protected.
    expect(within(stepped).getByText("Breach")).toBeInTheDocument();
    expect(within(stepped).getByText(/exceeds the 30 cmH2O ceiling/)).toBeInTheDocument();
  });

  it("filters the protection console down to the patients it cannot grade", () => {
    renderWithProviders(<RespiratoryVentilatorFleetHub />);

    fireEvent.click(screen.getByRole("button", { name: /Lung Protection/ }));
    fireEvent.click(screen.getByRole("button", { name: "Not gradeable" }));

    expect(screen.getByText("RSP-1108")).toBeInTheDocument();
    expect(screen.queryByText("RSP-1101")).not.toBeInTheDocument();
  });

  it("shows burn-time in minutes and marks the cylinders under half an hour", () => {
    renderWithProviders(<RespiratoryVentilatorFleetHub />);

    fireEvent.click(screen.getByRole("button", { name: /Oxygen Logistics/ }));

    // O2-CYL-1107: (34 - 10) x 2.0 / (10 + 4) = 3.4 -> 3 minutes.
    const row = screen.getByText("O2-CYL-1107").closest("tr");
    expect(within(row).getByText("3 min")).toBeInTheDocument();
  });

  it("exchanges a cylinder and restores its contents", () => {
    renderWithProviders(<RespiratoryVentilatorFleetHub />);

    fireEvent.click(screen.getByRole("button", { name: /Oxygen Logistics/ }));

    const row = screen.getByText("O2-CYL-1107").closest("tr");
    fireEvent.click(within(row).getByRole("button", { name: /Exchange/ }));

    expect(within(screen.getByText("O2-CYL-1107").closest("tr")).getByText(/200 bar/)).toBeInTheDocument();
  });

  it("lists the blockers holding a patient off a breathing trial", () => {
    renderWithProviders(<RespiratoryVentilatorFleetHub />);

    fireEvent.click(screen.getByRole("button", { name: /Weaning & SBT/ }));

    const card = screen.getByText("SBT-704").closest("article");
    expect(within(card).getByText(/vasopressor support/i)).toBeInTheDocument();
    expect(within(card).getByText(/No cuff leak/i)).toBeInTheDocument();
  });

  it("opens an inspection modal that spells out the predicted weight arithmetic", () => {
    renderWithProviders(<RespiratoryVentilatorFleetHub />);

    fireEvent.click(screen.getByRole("button", { name: /Lung Protection/ }));
    fireEvent.click(screen.getByRole("button", { name: "RSP-1106" }));

    // The label row and the explanatory paragraph both name it, so assert the arithmetic itself:
    // 50.0 + 0.91 x (169 - 152.4) = 65.1 kg, against the 121 kg the patient weighs.
    expect(screen.getByText("Predicted body weight")).toBeInTheDocument();
    expect(screen.getByText(/50\.0 \+ 0\.91 × \(169 − 152\.4\)/)).toBeInTheDocument();
    expect(screen.getByText(/121 kg — not used/)).toBeInTheDocument();
  });

  it("advances the simulation without throwing", () => {
    renderWithProviders(<RespiratoryVentilatorFleetHub />);

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(screen.getByText(/Respiratory Therapy & Ventilator Fleet Hub/)).toBeInTheDocument();
  });

  it("pauses and resumes the simulation", () => {
    renderWithProviders(<RespiratoryVentilatorFleetHub />);

    fireEvent.click(screen.getByTitle("Pause simulation"));
    expect(screen.getByText("Simulation paused")).toBeInTheDocument();

    fireEvent.click(screen.getByTitle("Resume simulation"));
    expect(screen.getByText(/Live simulation/)).toBeInTheDocument();
  });
});
