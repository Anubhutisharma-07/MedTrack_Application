// Tests for the Radiation Safety & Dosimetry Hub.
//
// Two things on this page are claims rather than readings, and both get the weight.
//
// decayedActivity() recomputes a sealed source's activity from its certificate figure and reference
// date. Every register I have seen keeps quoting the certificate, which has been wrong since the day
// it was issued and is wrong by a factor for the short-lived isotopes.
//
// doseAssessment() projects a mid-year reading to year end and grades it against a limit defined
// over a calendar year. Its most important behaviour is what it does with an unreturned badge: "no
// dose was measured" and "a dose of zero was measured" are opposite findings, and a dashboard that
// renders them identically is worse than one that omits the worker entirely.

import { screen, fireEvent, within, act } from "@testing-library/react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderWithProviders } from "../../utils/renderWithProviders";
import RadiationSafetyDosimetryHub, {
  decayedActivity,
  remainingPct,
  sourceFaults,
  doseAssessment,
  lensFinding,
  drlComparison,
  skinDoseAction,
  ppeFaults,
  DOSE_LIMITS,
  HALF_LIVES_DAYS,
} from "../../../pages/radiation/RadiationSafetyDosimetryHub";

const worker = {
  id: "RP-TEST", name: "Test Worker", role: "Operator", classified: true, department: "Cath lab",
  wholeBodyMsv: 3.0, lensMsv: 3.0, extremityMsv: 60, daysElapsed: 120, returned: true, leadedEyewear: true,
};

describe("decayedActivity", () => {
  it("halves the activity after exactly one half-life", () => {
    const result = decayedActivity({ isotope: "Ir-192", certificateActivityMbq: 370_000, referenceDateDays: 73.83 });

    expect(result.halfLivesElapsed).toBe(1);
    expect(result.activityMbq).toBeCloseTo(185_000, 0);
  });

  it("quarters it after two half-lives", () => {
    const result = decayedActivity({ isotope: "Ir-192", certificateActivityMbq: 370_000, referenceDateDays: 147.66 });

    expect(result.halfLivesElapsed).toBe(2);
    expect(result.activityMbq).toBeCloseTo(92_500, 0);
  });

  it("returns the certificate activity at the reference date itself", () => {
    const result = decayedActivity({ isotope: "Cs-137", certificateActivityMbq: 18.5, referenceDateDays: 0 });

    expect(result.activityMbq).toBe(18.5);
    expect(result.halfLivesElapsed).toBe(0);
  });

  it("shows the scale of the error a register makes by quoting the certificate", () => {
    // Eight half-lives of Ir-192 is 590.6 days. 2^-8 = 1/256, so the source is at 0.39% of the
    // figure the register is still quoting - and a treatment time from that figure does not treat.
    const result = decayedActivity({ isotope: "Ir-192", certificateActivityMbq: 370_000, referenceDateDays: 73.83 * 8 });

    expect(result.activityMbq).toBeCloseTo(1445.3, 0);
    expect(result.activityMbq / 370_000).toBeCloseTo(0.0039, 4);
  });

  it("uses the half-life for the isotope, so the same age gives very different answers", () => {
    // A year of decay: F-18 is gone, Cs-137 has barely moved. A single decay constant applied to a
    // register would be catastrophically wrong in both directions at once.
    const cs = decayedActivity({ isotope: "Cs-137", certificateActivityMbq: 100, referenceDateDays: 365 });
    const ir = decayedActivity({ isotope: "Ir-192", certificateActivityMbq: 100, referenceDateDays: 365 });

    expect(cs.activityMbq).toBeGreaterThan(97);
    expect(ir.activityMbq).toBeLessThan(4);
  });

  it("refuses an isotope with no half-life held rather than guessing one", () => {
    // Sr-90 is deliberately absent from the table, and one of the seeded check sources uses it.
    const result = decayedActivity({ isotope: "Sr-90", certificateActivityMbq: 3.7, referenceDateDays: 1_100 });

    expect(result.activityMbq).toBeNull();
    expect(result.refusal).toMatch(/No half-life is held for Sr-90/);
  });

  it("refuses a source with no reference date, because there is nothing to decay from", () => {
    const result = decayedActivity({ isotope: "Cs-137", certificateActivityMbq: 9.25, referenceDateDays: null });

    expect(result.activityMbq).toBeNull();
    expect(result.refusal).toMatch(/nothing to decay from/);
  });

  it("keys half-lives by nuclide rather than letting a source record carry its own", () => {
    // A source record with its own half-life field is a record that can disagree with physics.
    const source = { isotope: "Ir-192", certificateActivityMbq: 100, referenceDateDays: 73.83, halfLifeDays: 9999 };

    expect(decayedActivity(source).activityMbq).toBeCloseTo(50, 1);
    expect(HALF_LIVES_DAYS["Ir-192"]).toBe(73.83);
  });
});

describe("remainingPct", () => {
  it("expresses today's activity as a percentage of the certificate", () => {
    expect(remainingPct({ isotope: "Ir-192", certificateActivityMbq: 370_000, referenceDateDays: 73.83 })).toBe(50);
  });

  it("returns null when the activity could not be decayed", () => {
    expect(remainingPct({ isotope: "Sr-90", certificateActivityMbq: 3.7, referenceDateDays: 100 })).toBeNull();
  });
});

describe("sourceFaults", () => {
  const intact = { isotope: "Ir-192", certificateActivityMbq: 370_000, referenceDateDays: 88, lastLeakTestDays: 130, sealedIntegrity: "Intact" };

  it("reports nothing for an intact source inside its wipe-test interval", () => {
    expect(sourceFaults(intact)).toEqual([]);
  });

  it("puts a breached seal ahead of the paperwork clock", () => {
    const faults = sourceFaults({ ...intact, sealedIntegrity: "Wipe test positive", lastLeakTestDays: 900 });

    expect(faults[0].code).toBe("INTEGRITY");
    expect(faults[0].text).toMatch(/contamination event/);
  });

  it("flags a wipe test past its two-year interval as unevidenced rather than failed", () => {
    const fault = sourceFaults({ ...intact, lastLeakTestDays: 812 }).find((f) => f.code === "LEAK");

    expect(fault.tone).toBe("red");
    expect(fault.text).toMatch(/unevidenced rather than known to be intact/);
  });

  it("warns ahead of the wipe-test interval rather than only after", () => {
    expect(sourceFaults({ ...intact, lastLeakTestDays: 700 }).map((f) => f.code)).toContain("LEAK-SOON");
  });

  it("surfaces a source that cannot be decayed as a fault of its own", () => {
    expect(sourceFaults({ ...intact, isotope: "Sr-90" }).map((f) => f.code)).toContain("NO-DECAY");
  });
});

describe("doseAssessment", () => {
  it("projects a mid-year reading linearly to year end", () => {
    // 3.0 mSv over 120 days x (365/120) = 9.1 mSv projected.
    const wholeBody = doseAssessment(worker).rows.find((r) => r.key === "wholeBody");

    expect(wholeBody.projectedMsv).toBe(9.1);
    expect(wholeBody.pctOfLimit).toBeCloseTo(45.5, 1);
  });

  it("grades the projection rather than the reading", () => {
    // 3.0 mSv to date is comfortably under a 20 mSv limit and means nothing on its own; the
    // projection is what turns it into a decision.
    const wholeBody = doseAssessment(worker).rows.find((r) => r.key === "wholeBody");

    expect(worker.wholeBodyMsv).toBeLessThan(DOSE_LIMITS.wholeBody.limit);
    expect(wholeBody.status).toBe("Investigation level");
  });

  it("puts the investigation level at three tenths of the limit, separately from the limit", () => {
    // 2.0 mSv over 120 days projects to 6.1 mSv, just over 3/10 of 20.
    const low = doseAssessment({ ...worker, wholeBodyMsv: 1.0 }).rows.find((r) => r.key === "wholeBody");
    const investigating = doseAssessment({ ...worker, wholeBodyMsv: 2.0 }).rows.find((r) => r.key === "wholeBody");

    expect(low.status).toBe("Within limit");
    expect(investigating.status).toBe("Investigation level");
    expect(investigating.tone).toBe("amber");
  });

  it("grades a projection at or over the limit as over limit", () => {
    const over = doseAssessment({ ...worker, wholeBodyMsv: 8.4 }).rows.find((r) => r.key === "wholeBody");

    expect(over.projectedMsv).toBeGreaterThan(DOSE_LIMITS.wholeBody.limit);
    expect(over.status).toBe("Over limit");
    expect(over.tone).toBe("red");
  });

  it("applies the 20 mSv lens limit, not the pre-ICRP-118 figure of 150", () => {
    // 7.2 mSv over 120 days projects to 21.9. Against 150 that is unremarkable; against 20 it is a
    // breach, and the difference is the control most often missed when the limit changed.
    const lens = doseAssessment({ ...worker, lensMsv: 7.2 }).rows.find((r) => r.key === "lens");

    expect(DOSE_LIMITS.lens.limit).toBe(20);
    expect(lens.projectedMsv).toBe(21.9);
    expect(lens.status).toBe("Over limit");
  });

  it("applies a separate and much larger limit to extremities", () => {
    const extremity = doseAssessment({ ...worker, extremityMsv: 318 }).rows.find((r) => r.key === "extremity");

    expect(DOSE_LIMITS.extremity.limit).toBe(500);
    // 318 x 365/120 = 967 mSv, over the 500 limit even though the whole-body dose is fine.
    expect(extremity.status).toBe("Over limit");
  });

  it("reports an unreturned badge as not measured and never as a zero dose", () => {
    const result = doseAssessment({ ...worker, returned: false, wholeBodyMsv: null, lensMsv: null, extremityMsv: null });

    expect(result.measured).toBe(false);
    expect(result.rows).toEqual([]);
    expect(result.refusal).toMatch(/not a dose of zero/i);
    expect(result.refusal).toMatch(/genuinely unknown/);
  });

  it("does not fall back to a zero dose when the badge is missing", () => {
    // The failure this guards: a blank cell reading as a good result. There must be no numeric row
    // at all for the console to colour green.
    const result = doseAssessment({ ...worker, returned: false });

    expect(result.rows.some((r) => r.projectedMsv === 0)).toBe(false);
  });

  it("refuses to project across a wear period of no elapsed days", () => {
    expect(doseAssessment({ ...worker, daysElapsed: 0 }).measured).toBe(false);
  });

  it("marks an individually unrecorded quantity as not measured while grading the others", () => {
    const result = doseAssessment({ ...worker, lensMsv: null });
    const lens = result.rows.find((r) => r.key === "lens");

    expect(result.measured).toBe(true);
    expect(lens.status).toBe("Not measured");
    expect(result.rows.find((r) => r.key === "wholeBody").status).not.toBe("Not measured");
  });
});

describe("lensFinding", () => {
  it("names the missing eyewear when the lens is projecting past the limit", () => {
    const finding = lensFinding({ ...worker, lensMsv: 7.2, leadedEyewear: false });

    expect(finding.tone).toBe("red");
    expect(finding.text).toMatch(/no leaded eyewear is issued/);
    expect(finding.text).toMatch(/cut from 150 to 20/);
  });

  it("points at geometry rather than PPE when eyewear is already worn", () => {
    const finding = lensFinding({ ...worker, lensMsv: 7.2, leadedEyewear: true });

    expect(finding.text).toMatch(/screen position and table height/);
  });

  it("says nothing about a lens comfortably within limit", () => {
    expect(lensFinding({ ...worker, lensMsv: 0.5, leadedEyewear: false })).toBeNull();
  });

  it("says nothing when no dose was measured at all", () => {
    expect(lensFinding({ ...worker, returned: false })).toBeNull();
  });
});

describe("drlComparison", () => {
  it("compares against the DRL for that exam", () => {
    const result = drlComparison({ exam: "CT chest", doseValue: 19 });

    expect(result.hasDrl).toBe(true);
    expect(result.ratio).toBeCloseTo(1.58, 2);
    expect(result.status).toBe("Well above DRL");
  });

  it("uses a per-exam DRL rather than one global threshold", () => {
    // A chest radiograph and a hepatic embolisation differ by four orders of magnitude, and both
    // are routine. Any single threshold passes one and fails the other.
    const film = drlComparison({ exam: "Chest radiograph", doseValue: 0.11 });
    const embo = drlComparison({ exam: "Hepatic embolisation", doseValue: 150 });

    expect(film.status).toBe("At or below DRL");
    expect(embo.status).toBe("At or below DRL");
    expect(embo.drl.value / film.drl.value).toBeGreaterThan(1000);
  });

  it("distinguishes above from well above", () => {
    expect(drlComparison({ exam: "CT head", doseValue: 66 }).status).toBe("Above DRL");
    expect(drlComparison({ exam: "CT head", doseValue: 95 }).status).toBe("Well above DRL");
  });

  it("reports an exam with no published DRL as having none, not as passing", () => {
    // "No DRL" and "under the DRL" look identical on a dashboard and mean opposite things about how
    // much is known.
    const result = drlComparison({ exam: "Cone beam CT", doseValue: 8 });

    expect(result.hasDrl).toBe(false);
    expect(result.status).toBe("No published DRL");
    expect(result.ratio).toBeNull();
  });
});

describe("skinDoseAction", () => {
  it("mandates follow-up at or above 5 Gy", () => {
    const action = skinDoseAction({ peakSkinGy: 5.8 });

    expect(action.tone).toBe("red");
    expect(action.text).toMatch(/mandated/);
  });

  it("advises at or above 2 Gy", () => {
    expect(skinDoseAction({ peakSkinGy: 3.1 }).tone).toBe("amber");
  });

  it("says nothing below the deterministic threshold", () => {
    expect(skinDoseAction({ peakSkinGy: 0.9 })).toBeNull();
  });

  it("says nothing for an exam with no peak skin dose recorded", () => {
    expect(skinDoseAction({ peakSkinGy: null })).toBeNull();
  });
});

describe("ppeFaults", () => {
  it("passes an intact item checked inside the year", () => {
    expect(ppeFaults({ defects: [], lastCheckedDays: 88 })).toEqual([]);
  });

  it("puts a defect ahead of a lapsed check", () => {
    const faults = ppeFaults({ defects: ["12 mm crack, left shoulder seam"], lastCheckedDays: 610 });

    expect(faults[0].code).toBe("DEFECT");
    expect(faults[0].text).toMatch(/feels exactly like an intact one/);
  });

  it("flags a check past the annual interval", () => {
    expect(ppeFaults({ defects: [], lastCheckedDays: 420 }).map((f) => f.code)).toContain("CHECK");
  });
});

describe("RadiationSafetyDosimetryHub rendering", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders the heading, the stat strip and all four consoles", () => {
    renderWithProviders(<RadiationSafetyDosimetryHub />);

    expect(screen.getByText(/Radiation Safety & Dosimetry Hub/)).toBeInTheDocument();
    expect(screen.getByText("Projecting Over Limit")).toBeInTheDocument();
    expect(screen.getByText("Dose Not Measured")).toBeInTheDocument();
    expect(screen.getByText("Sources Faulted")).toBeInTheDocument();
    expect(screen.getByText("Exams Above DRL")).toBeInTheDocument();

    for (const label of ["Staff Dosimetry", "Source Inventory", "Patient Dose & DRLs", "Protection PPE"]) {
      expect(screen.getByRole("button", { name: new RegExp(label) })).toBeInTheDocument();
    }
  });

  it("renders the unreturned badge as not measured rather than as a zero dose", () => {
    renderWithProviders(<RadiationSafetyDosimetryHub />);

    const card = screen.getByText("RP-2207").closest("article");
    expect(within(card).getByText("Not measured")).toBeInTheDocument();
    expect(within(card).getByText(/not a dose of zero/i)).toBeInTheDocument();
    // No dose bars at all, so there is nothing for the console to colour green.
    expect(within(card).queryByText(/of 20 mSv/)).not.toBeInTheDocument();
  });

  it("issues a replacement badge and starts a measured wear period", () => {
    renderWithProviders(<RadiationSafetyDosimetryHub />);

    const card = screen.getByText("RP-2207").closest("article");
    fireEvent.click(within(card).getByRole("button", { name: /Issue replacement badge/ }));

    expect(within(screen.getByText("RP-2207").closest("article")).queryByText(/not a dose of zero/i)).not.toBeInTheDocument();
  });

  it("surfaces the missing leaded eyewear on a lens breach", () => {
    renderWithProviders(<RadiationSafetyDosimetryHub />);

    // RP-2205 seeds 11.6 mSv lens over 120 days, projecting to 35.3 against a 20 mSv limit.
    const card = screen.getByText("RP-2205").closest("article");
    expect(within(card).getByText(/no leaded eyewear is issued/)).toBeInTheDocument();
    expect(within(card).getByText(/cut from 150 to 20/)).toBeInTheDocument();
  });

  it("issues eyewear and changes the finding to a geometry one", () => {
    renderWithProviders(<RadiationSafetyDosimetryHub />);

    const card = screen.getByText("RP-2205").closest("article");
    fireEvent.click(within(card).getByRole("button", { name: /Issue leaded eyewear/ }));

    const after = screen.getByText("RP-2205").closest("article");
    expect(within(after).getByText(/screen position and table height/)).toBeInTheDocument();
  });

  it("filters dosimetry down to the workers with no measurement", () => {
    renderWithProviders(<RadiationSafetyDosimetryHub />);

    fireEvent.click(screen.getByRole("button", { name: "Not measured" }));

    expect(screen.getByText("RP-2207")).toBeInTheDocument();
    expect(screen.queryByText("RP-2201")).not.toBeInTheDocument();
  });

  it("shows an empty state when nothing matches the search", () => {
    renderWithProviders(<RadiationSafetyDosimetryHub />);

    fireEvent.change(screen.getByPlaceholderText(/Search workers, sources/), {
      target: { value: "no-such-worker" },
    });

    expect(screen.getByText("No workers match the current filters.")).toBeInTheDocument();
  });

  it("shows the decayed activity as primary and strikes through the certificate", () => {
    renderWithProviders(<RadiationSafetyDosimetryHub />);

    fireEvent.click(screen.getByRole("button", { name: /Source Inventory/ }));

    const card = screen.getByText("SRC-HDR-01").closest("article");
    expect(within(card).getByText("370,000")).toHaveClass("line-through");
    expect(within(card).getByText("Half-lives")).toBeInTheDocument();
  });

  it("refuses to decay the source whose isotope has no half-life held", () => {
    renderWithProviders(<RadiationSafetyDosimetryHub />);

    fireEvent.click(screen.getByRole("button", { name: /Source Inventory/ }));

    const card = screen.getByText("SRC-CHK-05").closest("article");
    expect(within(card).getByText(/No half-life is held for Sr-90/)).toBeInTheDocument();
  });

  it("refuses to decay the source with no reference date", () => {
    renderWithProviders(<RadiationSafetyDosimetryHub />);

    fireEvent.click(screen.getByRole("button", { name: /Source Inventory/ }));

    const card = screen.getByText("SRC-CHK-06").closest("article");
    expect(within(card).getByText(/nothing to decay from/)).toBeInTheDocument();
  });

  it("records a wipe test and clears the overdue clock", () => {
    renderWithProviders(<RadiationSafetyDosimetryHub />);

    fireEvent.click(screen.getByRole("button", { name: /Source Inventory/ }));

    const card = screen.getByText("SRC-CAL-02").closest("article");
    expect(within(card).getByText(/past the 730 day interval/)).toBeInTheDocument();

    fireEvent.click(within(card).getByRole("button", { name: /Record wipe test/ }));

    expect(within(screen.getByText("SRC-CAL-02").closest("article")).queryByText(/past the 730 day interval/)).not.toBeInTheDocument();
  });

  it("marks an exam with no published DRL rather than passing it", () => {
    renderWithProviders(<RadiationSafetyDosimetryHub />);

    fireEvent.click(screen.getByRole("button", { name: /Patient Dose & DRLs/ }));

    const row = screen.getByText("EX-88409").closest("tr");
    expect(within(row).getByText("No published DRL")).toBeInTheDocument();
  });

  it("shows the peak skin dose that mandates follow-up", () => {
    renderWithProviders(<RadiationSafetyDosimetryHub />);

    fireEvent.click(screen.getByRole("button", { name: /Patient Dose & DRLs/ }));

    // EX-88406 seeds 5.8 Gy.
    const row = screen.getByText("EX-88406").closest("tr");
    expect(within(row).getByText("5.8 Gy")).toBeInTheDocument();
  });

  it("withdraws a defective apron from service", () => {
    renderWithProviders(<RadiationSafetyDosimetryHub />);

    fireEvent.click(screen.getByRole("button", { name: /Protection PPE/ }));

    const card = screen.getByText("PPE-1103").closest("article");
    expect(within(card).getByText(/12 mm crack, left shoulder seam/)).toBeInTheDocument();

    fireEvent.click(within(card).getByRole("button", { name: /Withdraw/ }));

    expect(screen.queryByText("PPE-1103")).not.toBeInTheDocument();
  });

  it("opens a source modal that spells out the decay arithmetic", () => {
    renderWithProviders(<RadiationSafetyDosimetryHub />);

    fireEvent.click(screen.getByRole("button", { name: /Source Inventory/ }));
    fireEvent.click(screen.getByRole("button", { name: "SRC-HDR-01" }));

    expect(screen.getByText("Activity today")).toBeInTheDocument();
    expect(screen.getByText(/The certificate is\s+provenance/)).toBeInTheDocument();
  });

  it("advances the simulation without throwing", () => {
    renderWithProviders(<RadiationSafetyDosimetryHub />);

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(screen.getByText(/Radiation Safety & Dosimetry Hub/)).toBeInTheDocument();
  });

  it("pauses and resumes the simulation", () => {
    renderWithProviders(<RadiationSafetyDosimetryHub />);

    fireEvent.click(screen.getByTitle("Pause simulation"));
    expect(screen.getByText("Simulation paused")).toBeInTheDocument();

    fireEvent.click(screen.getByTitle("Resume simulation"));
    expect(screen.getByText(/Live simulation/)).toBeInTheDocument();
  });
});
