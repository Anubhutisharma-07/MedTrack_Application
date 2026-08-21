// Tests for the Point-of-Care Testing Governance Hub.
//
// The weight is on evaluateWestgard, because it is the only thing on the page that overrules a
// device. A POCT analyser reports pass or fail against its own single-point acceptance range, which
// is a 1-2s check at best - around 5% false rejection on a two-level daily run, and almost no power
// to detect the small systematic shift that is the failure mode that actually matters.
//
// Three properties get the most coverage, and all three are about not lying:
//
//   - 1-2s warns and never rejects on its own, because a console that fails on it teaches its users
//     to override failures, and an override habit is what turns a real 2-2s into a dismissed pop-up;
//   - a rule that could not run reports "not evaluable", never "pass". A rule reported as passing
//     when it never ran is the most dangerous cell on the page;
//   - a window spanning a reagent lot change is refused rather than evaluated across the boundary,
//     because a real drift and a lot changeover look identical on a Levey-Jennings plot.

import { screen, fireEvent, within, act } from "@testing-library/react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderWithProviders } from "../../utils/renderWithProviders";
import PointOfCareTestingHub, {
  zScores,
  windowIsSingleLot,
  evaluateWestgard,
  competencyStatus,
  lapsedResults,
  lotFaults,
  deviceFaults,
  WESTGARD_RULES,
} from "../../../pages/poct/PointOfCareTestingHub";

/** Build a series of z-scores directly: mean 0, SD 1 makes value === z and the intent readable. */
function seriesOf(zValues, lot = "LOT-A") {
  return { id: "QC-TEST", mean: 0, sd: 1, unit: "u", points: zValues.map((z) => ({ value: z, lot })) };
}

const ruleOf = (result, code) => result.rules.find((r) => r.code === code);

describe("zScores", () => {
  it("standardises each point against the assigned mean and SD", () => {
    const scores = zScores({ mean: 5.4, sd: 0.2, points: [{ value: 5.8, lot: "A" }, { value: 5.0, lot: "A" }] });

    expect(scores[0].z).toBe(2);
    expect(scores[1].z).toBe(-2);
  });

  it("refuses a series with no assigned values rather than producing NaN", () => {
    // Every rule is a statement about z. Producing one silently would make every rule downstream a
    // confident statement about nothing.
    expect(zScores({ mean: null, sd: null, points: [{ value: 1, lot: "A" }] })).toBeNull();
    expect(zScores({ mean: 5, sd: 0, points: [{ value: 1, lot: "A" }] })).toBeNull();
  });
});

describe("windowIsSingleLot", () => {
  it("accepts a window entirely inside one lot", () => {
    expect(windowIsSingleLot([{ lot: "A" }, { lot: "A" }, { lot: "A" }], 2)).toBe(true);
  });

  it("rejects a window that spans a lot change", () => {
    expect(windowIsSingleLot([{ lot: "A" }, { lot: "A" }, { lot: "B" }], 2)).toBe(false);
  });

  it("only looks at the last N points, so an older lot outside the window is irrelevant", () => {
    expect(windowIsSingleLot([{ lot: "A" }, { lot: "B" }, { lot: "B" }], 2)).toBe(true);
  });
});

describe("evaluateWestgard — the rules", () => {
  it("passes a well-behaved series on every rule", () => {
    const result = evaluateWestgard(seriesOf([0.1, -0.2, 0.3, -0.1, 0.2, -0.3, 0.1, 0.4, -0.2, 0.0]));

    expect(result.evaluable).toBe(true);
    expect(result.rules.every((r) => r.status === "pass")).toBe(true);
    expect(result.verdict).toBe("In control");
  });

  it("rejects on 1-3s for a single point beyond 3 SD", () => {
    const rule = ruleOf(evaluateWestgard(seriesOf([0.1, 0.2, 3.2])), "1-3s");

    expect(rule.status).toBe("reject");
    expect(rule.error).toBe("random");
  });

  it("does not fire 1-3s at exactly 3 SD", () => {
    expect(ruleOf(evaluateWestgard(seriesOf([0.1, 3.0])), "1-3s").status).toBe("pass");
  });

  it("rejects on 2-2s for two consecutive points beyond 2 SD on the same side", () => {
    const rule = ruleOf(evaluateWestgard(seriesOf([0.1, 2.3, 2.4])), "2-2s");

    expect(rule.status).toBe("reject");
    expect(rule.reason).toMatch(/Systematic error/);
  });

  it("does not fire 2-2s when the two points are on opposite sides", () => {
    // That is an R-4s, a different error class entirely - random rather than systematic.
    const result = evaluateWestgard(seriesOf([0.1, 2.3, -2.4]));

    expect(ruleOf(result, "2-2s").status).toBe("pass");
    expect(ruleOf(result, "R-4s").status).toBe("reject");
  });

  it("rejects on R-4s when the run spans 4 SD on opposite sides", () => {
    const rule = ruleOf(evaluateWestgard(seriesOf([2.2, 0.1, -2.1])), "R-4s");

    expect(rule.status).toBe("reject");
    expect(rule.error).toBe("random");
  });

  it("warns rather than rejects on 4-1s", () => {
    // Four consecutive points beyond 1 SD on one side: drift, caught before it becomes a 2-2s.
    const rule = ruleOf(evaluateWestgard(seriesOf([0.1, 1.2, 1.3, 1.4, 1.5])), "4-1s");

    expect(rule.status).toBe("warn");
    expect(rule.action).toBe("warn");
  });

  it("does not fire 4-1s when the four points straddle the mean", () => {
    expect(ruleOf(evaluateWestgard(seriesOf([1.2, 1.3, -1.4, 1.5])), "4-1s").status).toBe("pass");
  });

  it("warns on 10-x for ten consecutive points on one side of the mean", () => {
    // No point is individually remarkable and a bias is unmistakably present. This is exactly the
    // failure a single-point acceptance range cannot see.
    const rule = ruleOf(evaluateWestgard(seriesOf([0.2, 0.3, 0.1, 0.4, 0.2, 0.5, 0.3, 0.2, 0.4, 0.1])), "10-x");

    expect(rule.status).toBe("warn");
    expect(rule.reason).toMatch(/no point is individually remarkable/i);
    expect(ruleOf(evaluateWestgard(seriesOf([0.2, 0.3, 0.1, 0.4, 0.2, 0.5, 0.3, 0.2, 0.4, 0.1])), "1-2s").status).toBe("pass");
  });

  it("does not fire 10-x when the last ten points cross the mean", () => {
    expect(ruleOf(evaluateWestgard(seriesOf([0.2, 0.3, 0.1, 0.4, 0.2, -0.5, 0.3, 0.2, 0.4, 0.1])), "10-x").status).toBe("pass");
  });

  it("warns and never rejects on 1-2s alone", () => {
    // The single most important behaviour on this page. A 1-2s rejection is a ~5% false alarm rate,
    // and a console that fails on it trains its users to override failures.
    const result = evaluateWestgard(seriesOf([0.1, 2.3]));

    expect(ruleOf(result, "1-2s").status).toBe("warn");
    expect(result.rules.some((r) => r.status === "reject")).toBe(false);
    expect(result.verdict).toBe("Inspect");
    expect(WESTGARD_RULES.find((r) => r.code === "1-2s").action).toBe("warn");
  });
});

describe("evaluateWestgard — the refusals", () => {
  it("reports a rule with too few points as not evaluable rather than as a pass", () => {
    // Six points cannot assess 10-x. Reporting it as passed is the most dangerous cell on the page.
    const result = evaluateWestgard(seriesOf([0.1, 0.2, 0.1, 0.3, 0.2, 0.1]));
    const rule = ruleOf(result, "10-x");

    expect(rule.status).toBe("not-evaluable");
    expect(rule.status).not.toBe("pass");
    expect(rule.reason).toMatch(/never ran is not a rule that was satisfied/);
  });

  it("still evaluates the rules that do have enough points", () => {
    const result = evaluateWestgard(seriesOf([0.1, 0.2, 0.1, 0.3, 0.2, 0.1]));

    expect(ruleOf(result, "1-3s").status).toBe("pass");
    expect(ruleOf(result, "2-2s").status).toBe("pass");
    expect(ruleOf(result, "4-1s").status).toBe("pass");
    expect(ruleOf(result, "10-x").status).toBe("not-evaluable");
  });

  it("marks the verdict as only partially assessed when a rule could not run", () => {
    expect(evaluateWestgard(seriesOf([0.1, 0.2, 0.1, 0.3, 0.2, 0.1])).verdict).toBe("In control, partially assessed");
  });

  it("refuses a window that spans a reagent lot change", () => {
    // The last two points are on different lots, so 2-2s cannot be evaluated across the boundary.
    const series = {
      id: "QC-LOT", mean: 0, sd: 1, unit: "u",
      points: [{ value: 0.1, lot: "LOT-A" }, { value: 2.3, lot: "LOT-A" }, { value: 2.4, lot: "LOT-B" }],
    };
    const rule = ruleOf(evaluateWestgard(series), "2-2s");

    expect(rule.status).toBe("not-evaluable");
    expect(rule.reason).toMatch(/span a reagent lot change/);
  });

  it("does not manufacture a rejection out of a lot changeover", () => {
    // Both points sit beyond 2 SD on the same side, which would be a textbook 2-2s within one lot.
    // Across a boundary it is a lot shift, and calling it a rejection hides a genuine one behind it.
    const series = {
      id: "QC-LOT", mean: 0, sd: 1, unit: "u",
      points: [{ value: 2.3, lot: "LOT-A" }, { value: 2.4, lot: "LOT-B" }],
    };

    expect(evaluateWestgard(series).rules.some((r) => r.status === "reject")).toBe(false);
  });

  it("still evaluates single-point rules across a lot boundary, since they consume one point", () => {
    const series = {
      id: "QC-LOT", mean: 0, sd: 1, unit: "u",
      points: [{ value: 0.1, lot: "LOT-A" }, { value: 3.4, lot: "LOT-B" }],
    };

    expect(ruleOf(evaluateWestgard(series), "1-3s").status).toBe("reject");
  });

  it("refuses the whole series when no mean and SD are assigned", () => {
    const result = evaluateWestgard({ id: "QC-NA", mean: null, sd: null, unit: "s", points: [{ value: 122, lot: "A" }] });

    expect(result.evaluable).toBe(false);
    expect(result.rules).toEqual([]);
    expect(result.refusal).toMatch(/not a z-score at all/);
  });
});

describe("competencyStatus", () => {
  it("marks an operator inside the interval as current", () => {
    expect(competencyStatus({ lastAssessedDays: 90 }).status).toBe("Current");
  });

  it("warns in the last month before the interval expires", () => {
    const result = competencyStatus({ lastAssessedDays: 355 });

    expect(result.status).toBe("Expiring");
    expect(result.daysRemaining).toBe(10);
  });

  it("marks an operator past the interval as lapsed and says by how long", () => {
    const result = competencyStatus({ lastAssessedDays: 402 });

    expect(result.status).toBe("Lapsed");
    expect(result.tone).toBe("red");
    expect(result.text).toMatch(/lapsed 37 days ago/);
  });
});

describe("lapsedResults", () => {
  it("lists only results produced after the operator's competency had lapsed", () => {
    const found = lapsedResults([
      { id: "A", operatorLapseDaysAtResult: 37 },
      { id: "B", operatorLapseDaysAtResult: null },
      { id: "C", operatorLapseDaysAtResult: 0 },
      { id: "D", operatorLapseDaysAtResult: 245 },
    ]);

    expect(found.map((r) => r.id)).toEqual(["A", "D"]);
  });
});

describe("lotFaults", () => {
  const goodLot = { expiresDays: 61, storageExcursion: false, biasVsPreviousPct: 0.4 };

  it("passes a lot in date with no excursion and no meaningful bias", () => {
    expect(lotFaults(goodLot)).toEqual([]);
  });

  it("puts expiry ahead of bias", () => {
    const faults = lotFaults({ ...goodLot, expiresDays: -4, biasVsPreviousPct: 9.4 });

    expect(faults[0].code).toBe("EXPIRED");
    expect(faults.map((f) => f.code)).toContain("BIAS");
  });

  it("quarantines rather than derates after a storage excursion", () => {
    const fault = lotFaults({ ...goodLot, storageExcursion: true }).find((f) => f.code === "EXCURSION");

    expect(fault.tone).toBe("red");
    expect(fault.text).toMatch(/unpredictable rather than uniformly degraded/);
  });

  it("flags a lot-to-lot bias that would move every result on the device", () => {
    expect(lotFaults({ ...goodLot, biasVsPreviousPct: 9.4 }).map((f) => f.code)).toContain("BIAS");
    expect(lotFaults({ ...goodLot, biasVsPreviousPct: -9.4 }).map((f) => f.code)).toContain("BIAS");
    expect(lotFaults({ ...goodLot, biasVsPreviousPct: 2.7 }).map((f) => f.code)).not.toContain("BIAS");
  });
});

describe("deviceFaults", () => {
  const lots = [{ id: "LOT-OK", expiresDays: 30 }, { id: "LOT-OLD", expiresDays: -4 }];

  it("passes a connected device on an in-date lot", () => {
    expect(deviceFaults({ connected: true, lastUploadHours: 2, lotId: "LOT-OK" }, lots)).toEqual([]);
  });

  it("flags a device that has stopped uploading as having left the governed estate", () => {
    const fault = deviceFaults({ connected: false, lastUploadHours: 190, lotId: "LOT-OK" }, lots).find((f) => f.code === "OFFLINE");

    expect(fault.text).toMatch(/left the governed estate without leaving the ward/);
  });

  it("flags a nominally connected device whose last upload is stale", () => {
    expect(deviceFaults({ connected: true, lastUploadHours: 60, lotId: "LOT-OK" }, lots).map((f) => f.code)).toContain("OFFLINE");
  });

  it("flags an expired lot still assigned to a device in service", () => {
    expect(deviceFaults({ connected: true, lastUploadHours: 1, lotId: "LOT-OLD" }, lots).map((f) => f.code)).toContain("LOT");
  });
});

describe("PointOfCareTestingHub rendering", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders the heading, the stat strip and all four consoles", () => {
    renderWithProviders(<PointOfCareTestingHub />);

    expect(screen.getByText(/Point-of-Care Testing Governance Hub/)).toBeInTheDocument();
    expect(screen.getByText("QC Out of Control")).toBeInTheDocument();
    expect(screen.getByText("Rules Not Evaluable")).toBeInTheDocument();
    expect(screen.getByText("Lapsed Operators")).toBeInTheDocument();
    expect(screen.getByText("Devices Not Uploading")).toBeInTheDocument();

    for (const label of ["Device Fleet", "Quality Control", "Operator Competency", "Consumables & Lots"]) {
      expect(screen.getByRole("button", { name: new RegExp(label) })).toBeInTheDocument();
    }
  });

  it("marks a device that has stopped uploading", () => {
    renderWithProviders(<PointOfCareTestingHub />);

    const card = screen.getByText("POCT-COA-2205").closest("article");
    expect(within(card).getByText("Offline")).toBeInTheDocument();
    expect(within(card).getByText(/left the governed estate without leaving the ward/)).toBeInTheDocument();
  });

  it("reconnects a device whose only fault was connectivity", () => {
    renderWithProviders(<PointOfCareTestingHub />);

    const card = screen.getByText("POCT-HB-5501").closest("article");
    expect(within(card).getByText("Offline")).toBeInTheDocument();

    fireEvent.click(within(card).getByRole("button", { name: /Reconnect & upload/ }));

    expect(within(screen.getByText("POCT-HB-5501").closest("article")).getByText("Online")).toBeInTheDocument();
  });

  it("does not let a reconnect clear an expired reagent lot", () => {
    // POCT-GLU-0423 is offline *and* running LOT-GLU-91, which expired four days ago. Restoring
    // connectivity restores the upload and nothing else: the device is still producing results on
    // expired strips, and a console that went green here would say the opposite.
    renderWithProviders(<PointOfCareTestingHub />);

    const card = screen.getByText("POCT-GLU-0423").closest("article");
    fireEvent.click(within(card).getByRole("button", { name: /Reconnect & upload/ }));

    const after = screen.getByText("POCT-GLU-0423").closest("article");
    expect(within(after).getByText(/Assigned lot LOT-GLU-91 expired 4 days ago/)).toBeInTheDocument();
    expect(within(after).getByText("Offline")).toBeInTheDocument();
  });

  it("shows an empty state when nothing matches the search", () => {
    renderWithProviders(<PointOfCareTestingHub />);

    fireEvent.change(screen.getByPlaceholderText(/Search devices, QC series/), {
      target: { value: "no-such-device" },
    });

    expect(screen.getByText("No devices match the current filters.")).toBeInTheDocument();
  });

  it("renders every rule chip for an evaluated series", () => {
    renderWithProviders(<PointOfCareTestingHub />);

    fireEvent.click(screen.getByRole("button", { name: /Quality Control/ }));

    const card = screen.getByText("QC-0001").closest("article");
    for (const rule of WESTGARD_RULES) {
      expect(within(card).getByText(rule.code)).toBeInTheDocument();
    }
  });

  it("shows a not-evaluable rule as n/e rather than as a pass", () => {
    renderWithProviders(<PointOfCareTestingHub />);

    fireEvent.click(screen.getByRole("button", { name: /Quality Control/ }));

    // QC-0007 holds six points, so 10-x cannot be assessed.
    const card = screen.getByText("QC-0007").closest("article");
    expect(within(card).getByText(/Needs 10 consecutive points and the series holds 6/)).toBeInTheDocument();
    expect(within(card).getByText("In control, partially assessed")).toBeInTheDocument();
  });

  it("refuses the series with no assigned mean and SD", () => {
    renderWithProviders(<PointOfCareTestingHub />);

    fireEvent.click(screen.getByRole("button", { name: /Quality Control/ }));

    const card = screen.getByText("QC-0006").closest("article");
    expect(within(card).getByText(/not a z-score at all/)).toBeInTheDocument();
    expect(within(card).getByText("No assigned values")).toBeInTheDocument();
  });

  it("establishes assigned values and starts evaluating the refused series", () => {
    renderWithProviders(<PointOfCareTestingHub />);

    fireEvent.click(screen.getByRole("button", { name: /Quality Control/ }));

    const card = screen.getByText("QC-0006").closest("article");
    fireEvent.click(within(card).getByRole("button", { name: /Establish assigned mean and SD/ }));

    expect(within(screen.getByText("QC-0006").closest("article")).queryByText(/not a z-score at all/)).not.toBeInTheDocument();
  });

  it("refuses the consecutive-point rules on the series that spans a lot change", () => {
    renderWithProviders(<PointOfCareTestingHub />);

    fireEvent.click(screen.getByRole("button", { name: /Quality Control/ }));

    // QC-0005 changes from LOT-COA-06 to LOT-COA-07 partway through.
    const card = screen.getByText("QC-0005").closest("article");
    expect(within(card).getByText(/span a reagent lot change/)).toBeInTheDocument();
  });

  it("filters QC down to the series that could not be fully assessed", () => {
    renderWithProviders(<PointOfCareTestingHub />);

    fireEvent.click(screen.getByRole("button", { name: /Quality Control/ }));
    fireEvent.click(screen.getByRole("button", { name: "Not evaluable" }));

    expect(screen.getByText("QC-0006")).toBeInTheDocument();
    expect(screen.getByText("QC-0007")).toBeInTheDocument();
    expect(screen.queryByText("QC-0001")).not.toBeInTheDocument();
  });

  it("surfaces the results already produced by lapsed operators", () => {
    renderWithProviders(<PointOfCareTestingHub />);

    fireEvent.click(screen.getByRole("button", { name: /Operator Competency/ }));

    expect(screen.getByText(/results were already produced by operators whose competency had lapsed/)).toBeInTheDocument();
    expect(screen.getByText(/the lockout should have happened at the device/)).toBeInTheDocument();
  });

  it("reassesses a lapsed operator and clears the status", () => {
    renderWithProviders(<PointOfCareTestingHub />);

    fireEvent.click(screen.getByRole("button", { name: /Operator Competency/ }));

    const row = screen.getByText("OP-7702").closest("tr");
    expect(within(row).getByText("Lapsed")).toBeInTheDocument();

    fireEvent.click(within(row).getByRole("button", { name: /Reassess/ }));

    expect(within(screen.getByText("OP-7702").closest("tr")).getByText("Current")).toBeInTheDocument();
  });

  it("quarantines a lot with a storage excursion", () => {
    renderWithProviders(<PointOfCareTestingHub />);

    fireEvent.click(screen.getByRole("button", { name: /Consumables & Lots/ }));

    const card = screen.getByText("LOT-BG-25").closest("article");
    expect(within(card).getByText(/unpredictable rather than uniformly degraded/)).toBeInTheDocument();

    fireEvent.click(within(card).getByRole("button", { name: /Quarantine lot/ }));

    expect(screen.queryByText("LOT-BG-25")).not.toBeInTheDocument();
  });

  it("opens a QC modal that explains the not-evaluable state", () => {
    renderWithProviders(<PointOfCareTestingHub />);

    fireEvent.click(screen.getByRole("button", { name: /Quality Control/ }));
    fireEvent.click(screen.getByRole("button", { name: "QC-0007" }));

    // The card lists the reason too, so assert the sentence unique to the modal.
    expect(screen.getByText(/most\s+dangerous cell on this page to get wrong/)).toBeInTheDocument();
    expect(screen.getByText("10-x (warn, needs 10)")).toBeInTheDocument();
  });

  it("advances the simulation without throwing", () => {
    renderWithProviders(<PointOfCareTestingHub />);

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(screen.getByText(/Point-of-Care Testing Governance Hub/)).toBeInTheDocument();
  });

  it("pauses and resumes the simulation", () => {
    renderWithProviders(<PointOfCareTestingHub />);

    fireEvent.click(screen.getByTitle("Pause simulation"));
    expect(screen.getByText("Simulation paused")).toBeInTheDocument();

    fireEvent.click(screen.getByTitle("Resume simulation"));
    expect(screen.getByText(/Live simulation/)).toBeInTheDocument();
  });
});
