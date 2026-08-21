// Tests for the Organ Transplant & Procurement Logistics Hub.
//
// Two things on this page are claims rather than readings.
//
// ischaemiaClock() derives cold ischaemia time from the cross-clamp timestamp. Every transplant
// coordination system in existence records a CIT that somebody typed, and that number is stale from
// the moment it is typed - which is the entire problem, because it is a clock and a clock read from
// a note is not a clock.
//
// hlaMismatch() derives the 0-6 count from the antigen sets. Its most important behaviour is the
// refusal: reporting "2" when the truth is "2 or 3, we do not know" is worse than reporting nothing,
// because the number goes into an allocation discussion as if it were known.

import { screen, fireEvent, within, act } from "@testing-library/react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderWithProviders } from "../../utils/renderWithProviders";
import TransplantProcurementHub, {
  ischaemiaClock,
  warmIschaemiaFinding,
  hlaMismatch,
  immunologyFindings,
  offerClock,
  machineFaults,
  ISCHAEMIA_LIMITS,
  HLA_LOCI,
} from "../../../pages/transplant/TransplantProcurementHub";

const kidney = { organ: "Kidney", crossClampHoursAgo: 14.2, preservation: "Static cold storage", donorType: "DBD", functionalWarmMin: null };

const wellTyped = {
  donor: { A: ["A1", "A2"], B: ["B8", "B44"], DR: ["DR3", "DR7"] },
  recipientTyping: { A: ["A1", "A3"], B: ["B8", "B7"], DR: ["DR3", "DR15"] },
  crossmatch: "Negative", dsaMfi: 0, cpra: 12,
};

describe("ischaemiaClock", () => {
  it("derives the interval from the cross-clamp timestamp", () => {
    const result = ischaemiaClock(kidney);

    expect(result.hours).toBe(14.2);
    expect(result.refusal).toBeNull();
  });

  it("uses the limit for the organ, not a single global threshold", () => {
    // Five hours: a heart is past its absolute limit and a kidney has not reached its ideal. Any
    // single threshold gets one of these exactly wrong.
    const heart = ischaemiaClock({ ...kidney, organ: "Heart", crossClampHoursAgo: 5 });
    const sameHoursKidney = ischaemiaClock({ ...kidney, crossClampHoursAgo: 5 });

    expect(heart.status).toBe("Past ideal");
    expect(heart.appliedLimitHours).toBe(6);
    expect(sameHoursKidney.status).toBe("Within ideal");
    expect(sameHoursKidney.appliedLimitHours).toBe(24);
  });

  it("grades past ideal separately from past the absolute limit", () => {
    expect(ischaemiaClock({ ...kidney, crossClampHoursAgo: 12 }).status).toBe("Within ideal");
    expect(ischaemiaClock({ ...kidney, crossClampHoursAgo: 19 }).status).toBe("Past ideal");
    expect(ischaemiaClock({ ...kidney, crossClampHoursAgo: 25 }).status).toBe("Past absolute limit");
  });

  it("extends the kidney limit on machine perfusion", () => {
    const perfused = ischaemiaClock({ ...kidney, crossClampHoursAgo: 30, preservation: "Hypothermic machine perfusion" });

    expect(perfused.machineExtensionApplied).toBe(true);
    expect(perfused.appliedLimitHours).toBe(36);
    expect(perfused.status).toBe("Past ideal");
  });

  it("extends the kidney limit and only the kidney limit", () => {
    // A liver on a perfusion machine still carries the 12 h limit. Applying the kidney extension
    // across organs would license three extra hours on an organ that does not have them.
    const liver = ischaemiaClock({ ...kidney, organ: "Liver", crossClampHoursAgo: 13, preservation: "Normothermic machine perfusion" });

    expect(liver.machineExtensionApplied).toBe(false);
    expect(liver.appliedLimitHours).toBe(ISCHAEMIA_LIMITS.Liver.absolute);
    expect(liver.status).toBe("Past absolute limit");
  });

  it("applies the extension from the method in use, not the one that was planned", () => {
    const onIce = ischaemiaClock({ ...kidney, crossClampHoursAgo: 30, preservation: "Static cold storage" });
    const onPump = ischaemiaClock({ ...kidney, crossClampHoursAgo: 30, preservation: "Hypothermic machine perfusion" });

    expect(onIce.status).toBe("Past absolute limit");
    expect(onPump.status).toBe("Past ideal");
  });

  it("falls back to the shorter static limit when the preservation method is unknown", () => {
    // The safe default is the shorter clock: assuming a pump that may not be there buys twelve hours
    // that may not exist.
    const unknown = ischaemiaClock({ ...kidney, crossClampHoursAgo: 25, preservation: "Unknown" });

    expect(unknown.machineExtensionApplied).toBe(false);
    expect(unknown.appliedLimitHours).toBe(24);
    expect(unknown.status).toBe("Past absolute limit");
  });

  it("refuses an organ with no cross-clamp timestamp", () => {
    const result = ischaemiaClock({ ...kidney, crossClampHoursAgo: null });

    expect(result.hours).toBeNull();
    expect(result.status).toBe("Not computable");
    // And explicitly rules out the fallback that would otherwise be reached for.
    expect(result.refusal).toMatch(/time the offer was accepted is not substituted/);
  });

  it("refuses a clamp timestamped in the future rather than showing a negative ischaemia time", () => {
    const result = ischaemiaClock({ ...kidney, crossClampHoursAgo: -2.5 });

    expect(result.hours).toBeNull();
    expect(result.refusal).toMatch(/transcription error/);
  });

  it("refuses a clamp timestamped before the donor was admitted", () => {
    const result = ischaemiaClock({ ...kidney, crossClampHoursAgo: 96, donorAdmittedHoursAgo: 30 });

    expect(result.hours).toBeNull();
    expect(result.refusal).toMatch(/internally inconsistent/);
  });

  it("does not refuse a clamp that sits after the donor's admission", () => {
    expect(ischaemiaClock({ ...kidney, crossClampHoursAgo: 14, donorAdmittedHoursAgo: 30 }).hours).toBe(14);
  });

  it("records rather than grades an organ with no limits held", () => {
    const result = ischaemiaClock({ ...kidney, organ: "Intestine" });

    expect(result.refusal).toMatch(/No ischaemia limits are held for Intestine/);
  });
});

describe("warmIschaemiaFinding", () => {
  it("says nothing for a DBD donor, where it does not apply", () => {
    expect(warmIschaemiaFinding({ donorType: "DBD", functionalWarmMin: null })).toBeNull();
  });

  it("flags a DCD functional warm ischaemia over the threshold", () => {
    const finding = warmIschaemiaFinding({ donorType: "DCD", functionalWarmMin: 34 });

    expect(finding.tone).toBe("red");
    expect(finding.text).toMatch(/decides transplantability before the cold clock/);
  });

  it("passes a DCD donor inside the threshold", () => {
    expect(warmIschaemiaFinding({ donorType: "DCD", functionalWarmMin: 22 }).tone).toBe("green");
  });

  it("refuses to infer an unrecorded warm ischaemia time from the time of death", () => {
    // It starts at a systolic or saturation threshold, routinely twenty minutes before asystole.
    const finding = warmIschaemiaFinding({ donorType: "DCD", functionalWarmMin: null });

    expect(finding.tone).toBe("amber");
    expect(finding.text).toMatch(/cannot be inferred from the time of death/);
  });
});

describe("hlaMismatch", () => {
  it("counts donor antigens absent from the recipient across A, B and DR", () => {
    // A: donor A1 A2 vs recipient A1 A3 -> A2 is a mismatch          = 1
    // B: donor B8 B44 vs recipient B8 B7 -> B44 is a mismatch        = 1
    // DR: donor DR3 DR7 vs recipient DR3 DR15 -> DR7 is a mismatch   = 1
    const result = hlaMismatch(wellTyped);

    expect(result.perLocus).toEqual({ A: 1, B: 1, DR: 1 });
    expect(result.mismatch).toBe(3);
  });

  it("returns zero for an identical pair", () => {
    const identical = {
      donor: { A: ["A2", "A24"], B: ["B7", "B35"], DR: ["DR4", "DR11"] },
      recipientTyping: { A: ["A2", "A24"], B: ["B7", "B35"], DR: ["DR4", "DR11"] },
    };

    expect(hlaMismatch(identical).mismatch).toBe(0);
  });

  it("returns six when nothing is shared", () => {
    const unrelated = {
      donor: { A: ["A30", "A68"], B: ["B42", "B58"], DR: ["DR13", "DR15"] },
      recipientTyping: { A: ["A1", "A2"], B: ["B7", "B8"], DR: ["DR3", "DR4"] },
    };

    expect(hlaMismatch(unrelated).mismatch).toBe(6);
  });

  it("counts in one direction only — donor antigens the recipient lacks", () => {
    // Mismatch is what the recipient's immune system will see as foreign, so a recipient antigen the
    // donor lacks is not a mismatch. Counting symmetrically would double the score.
    const oneWay = {
      donor: { A: ["A1", "A1"], B: ["B8", "B8"], DR: ["DR3", "DR3"] },
      recipientTyping: { A: ["A1", "A2"], B: ["B8", "B44"], DR: ["DR3", "DR7"] },
    };

    expect(hlaMismatch(oneWay).mismatch).toBe(0);
  });

  it("refuses when the recipient has only one antigen recorded at a locus", () => {
    // Either a genuine homozygote or a half-finished record, and those give different counts.
    const incomplete = {
      donor: { A: ["A2", "A29"], B: ["B44", "B51"], DR: ["DR7", "DR13"] },
      recipientTyping: { A: ["A2", "A29"], B: ["B44", "B51"], DR: ["DR7"] },
    };
    const result = hlaMismatch(incomplete);

    expect(result.mismatch).toBeNull();
    expect(result.perLocus).toBeNull();
    expect(result.refusal).toMatch(/recipient DR \(1 of 2\)/);
    expect(result.refusal).toMatch(/worse than no number/);
  });

  it("refuses when the donor typing is incomplete too", () => {
    const incomplete = {
      donor: { A: ["A2"], B: ["B44", "B51"], DR: ["DR7", "DR13"] },
      recipientTyping: { A: ["A2", "A29"], B: ["B44", "B51"], DR: ["DR7", "DR13"] },
    };

    expect(hlaMismatch(incomplete).refusal).toMatch(/donor A \(1 of 2\)/);
  });

  it("names every incomplete locus rather than the first", () => {
    const incomplete = {
      donor: { A: ["A2"], B: ["B44"], DR: ["DR7", "DR13"] },
      recipientTyping: { A: ["A2", "A29"], B: ["B44", "B51"], DR: ["DR7"] },
    };
    const { refusal } = hlaMismatch(incomplete);

    expect(refusal).toMatch(/donor A/);
    expect(refusal).toMatch(/donor B/);
    expect(refusal).toMatch(/recipient DR/);
  });

  it("refuses a missing locus entirely", () => {
    const missing = { donor: { A: ["A1", "A2"], B: ["B8", "B44"] }, recipientTyping: wellTyped.recipientTyping };

    expect(hlaMismatch(missing).mismatch).toBeNull();
  });

  it("counts across exactly the three classical loci", () => {
    expect(HLA_LOCI).toEqual(["A", "B", "DR"]);
  });
});

describe("immunologyFindings", () => {
  it("reports nothing for a clean pair", () => {
    expect(immunologyFindings({ crossmatch: "Negative", dsaMfi: 0, cpra: 12 })).toEqual([]);
  });

  it("flags a positive crossmatch as a contraindication in its own right", () => {
    // The point of keeping these beside the mismatch count rather than inside it: this pair is a
    // 0-mismatch on paper and still contraindicated.
    const findings = immunologyFindings({ crossmatch: "Positive", dsaMfi: 8400, cpra: 91 });

    expect(findings.map((f) => f.code)).toContain("XM");
    expect(findings.find((f) => f.code === "XM").text).toMatch(/regardless of how well the antigens match/);
  });

  it("separates a treatable DSA from one below the threshold", () => {
    expect(immunologyFindings({ crossmatch: "Negative", dsaMfi: 8400, cpra: 0 }).find((f) => f.code === "DSA").tone).toBe("red");
    expect(immunologyFindings({ crossmatch: "Negative", dsaMfi: 1800, cpra: 0 }).find((f) => f.code === "DSA-LOW").tone).toBe("amber");
    expect(immunologyFindings({ crossmatch: "Negative", dsaMfi: 400, cpra: 0 })).toEqual([]);
  });

  it("flags a highly sensitised recipient", () => {
    expect(immunologyFindings({ crossmatch: "Negative", dsaMfi: 0, cpra: 91 }).map((f) => f.code)).toContain("CPRA");
  });
});

describe("offerClock", () => {
  it("reports the time left on the acceptance window", () => {
    expect(offerClock({ status: "Under review", minutesHeld: 18 }).remaining).toBe(42);
  });

  it("warns in the last quarter hour", () => {
    expect(offerClock({ status: "Under review", minutesHeld: 50 }).tone).toBe("amber");
  });

  it("treats an unanswered offer past the window as a decline", () => {
    const clock = offerClock({ status: "Under review", minutesHeld: 96 });

    expect(clock.tone).toBe("red");
    expect(clock.text).toMatch(/An offer not answered is a decline, whatever the intention was/);
  });

  it("does not run the window on an offer already answered", () => {
    expect(offerClock({ status: "Accepted", minutesHeld: 200 }).tone).toBe("green");
  });
});

describe("machineFaults", () => {
  const ready = { state: "Ready", batteryPct: 100, onMains: true, serviceDueDays: 61, location: "Perfusion store" };

  it("passes a serviced machine on mains", () => {
    expect(machineFaults(ready)).toEqual([]);
  });

  it("flags a machine running low on battery with an organ on it", () => {
    const fault = machineFaults({ ...ready, state: "In use", onMains: false, batteryPct: 41 }).find((f) => f.code === "BATTERY");

    expect(fault.tone).toBe("red");
    expect(fault.text).toMatch(/converts machine preservation into static cold storage/);
  });

  it("flags an overdue service", () => {
    expect(machineFaults({ ...ready, serviceDueDays: -35 }).map((f) => f.code)).toContain("SERVICE");
  });

  it("counts the machines sitting in another hospital's store room", () => {
    const fault = machineFaults({ ...ready, state: "Idle — off site", location: "St Aidan's store room" }).find((f) => f.code === "OFFSITE");

    expect(fault.text).toMatch(/nobody counts when a retrieval is being planned/);
  });
});

describe("TransplantProcurementHub rendering", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders the heading, the stat strip and all four consoles", () => {
    renderWithProviders(<TransplantProcurementHub />);

    expect(screen.getByText(/Organ Transplant & Procurement Logistics Hub/)).toBeInTheDocument();
    expect(screen.getByText("Past Ischaemia Limit")).toBeInTheDocument();
    expect(screen.getByText("No Ischaemia Clock")).toBeInTheDocument();
    expect(screen.getByText("Offer Windows Expired")).toBeInTheDocument();
    expect(screen.getByText("Perfusion Machines Down")).toBeInTheDocument();

    for (const label of ["Organ Offers", "Ischaemia Clocks", "Perfusion Fleet", "Immunology & Matching"]) {
      expect(screen.getByRole("button", { name: new RegExp(label) })).toBeInTheDocument();
    }
  });

  it("marks an offer held past its acceptance window", () => {
    renderWithProviders(<TransplantProcurementHub />);

    // OFF-5505 seeds at 96 minutes held.
    const card = screen.getByText("OFF-5505").closest("article");
    expect(within(card).getByText(/An offer not answered is a decline/)).toBeInTheDocument();
  });

  it("accepts an offer and stops its window running", () => {
    renderWithProviders(<TransplantProcurementHub />);

    const card = screen.getByText("OFF-5501").closest("article");
    fireEvent.click(within(card).getByRole("button", { name: "Accept" }));

    const after = screen.getByText("OFF-5501").closest("article");
    expect(within(after).getAllByText("Accepted").length).toBeGreaterThan(0);
    // The window stops running, so the accept/decline pair is gone.
    expect(within(after).queryByRole("button", { name: "Accept" })).not.toBeInTheDocument();
    expect(within(after).queryByRole("button", { name: "Decline" })).not.toBeInTheDocument();
  });

  it("shows an empty state when nothing matches the search", () => {
    renderWithProviders(<TransplantProcurementHub />);

    fireEvent.change(screen.getByPlaceholderText(/Search offers, organs/), {
      target: { value: "no-such-offer" },
    });

    expect(screen.getByText("No offers match the current filters.")).toBeInTheDocument();
  });

  it("refuses a clock for the organ with no cross-clamp timestamp", () => {
    renderWithProviders(<TransplantProcurementHub />);

    fireEvent.click(screen.getByRole("button", { name: /Ischaemia Clocks/ }));

    const card = screen.getByText("TX-3305").closest("article");
    expect(within(card).getByText("Not computable")).toBeInTheDocument();
    expect(within(card).getByText(/time the offer was accepted is not substituted/)).toBeInTheDocument();
  });

  it("refuses a clock for the clamp timestamped in the future", () => {
    renderWithProviders(<TransplantProcurementHub />);

    fireEvent.click(screen.getByRole("button", { name: /Ischaemia Clocks/ }));

    const card = screen.getByText("TX-3308").closest("article");
    expect(within(card).getByText(/transcription error/)).toBeInTheDocument();
  });

  it("refuses a clock for the clamp that predates the donor's admission", () => {
    renderWithProviders(<TransplantProcurementHub />);

    fireEvent.click(screen.getByRole("button", { name: /Ischaemia Clocks/ }));

    const card = screen.getByText("TX-3309").closest("article");
    expect(within(card).getByText(/internally inconsistent/)).toBeInTheDocument();
  });

  it("records a cross-clamp and starts the clock", () => {
    renderWithProviders(<TransplantProcurementHub />);

    fireEvent.click(screen.getByRole("button", { name: /Ischaemia Clocks/ }));

    const card = screen.getByText("TX-3305").closest("article");
    fireEvent.click(within(card).getByRole("button", { name: /Record cross-clamp/ }));

    expect(within(screen.getByText("TX-3305").closest("article")).getByText("Within ideal")).toBeInTheDocument();
  });

  it("shows the machine perfusion extension on the kidney that has it", () => {
    renderWithProviders(<TransplantProcurementHub />);

    fireEvent.click(screen.getByRole("button", { name: /Ischaemia Clocks/ }));

    // TX-3307 is a kidney at 30.5 h on hypothermic machine perfusion: past ideal, inside 36 h.
    const card = screen.getByText("TX-3307").closest("article");
    expect(within(card).getByText(/extends the limit from 24 h to 36 h/)).toBeInTheDocument();
    expect(within(card).getByText("Past ideal")).toBeInTheDocument();
  });

  it("applies the short static limit to the kidney that is not on a machine", () => {
    renderWithProviders(<TransplantProcurementHub />);

    fireEvent.click(screen.getByRole("button", { name: /Ischaemia Clocks/ }));

    // TX-3304 is a kidney at 25.8 h on static cold storage — past the 24 h limit at a shorter time
    // than TX-3307, which is still inside its own.
    const card = screen.getByText("TX-3304").closest("article");
    expect(within(card).getByText("Past absolute limit")).toBeInTheDocument();
  });

  it("filters the transit console down to the organs with no clock", () => {
    renderWithProviders(<TransplantProcurementHub />);

    fireEvent.click(screen.getByRole("button", { name: /Ischaemia Clocks/ }));
    fireEvent.click(screen.getByRole("button", { name: "No clock" }));

    expect(screen.getByText("TX-3305")).toBeInTheDocument();
    expect(screen.getByText("TX-3308")).toBeInTheDocument();
    expect(screen.queryByText("TX-3301")).not.toBeInTheDocument();
  });

  it("counts the perfusion machines sitting off site", () => {
    renderWithProviders(<TransplantProcurementHub />);

    fireEvent.click(screen.getByRole("button", { name: /Perfusion Fleet/ }));

    const card = screen.getByText("PERF-LP-03").closest("article");
    expect(within(card).getByText(/nobody counts when a retrieval is being planned/)).toBeInTheDocument();
  });

  it("recalls an off-site machine to the store", () => {
    renderWithProviders(<TransplantProcurementHub />);

    fireEvent.click(screen.getByRole("button", { name: /Perfusion Fleet/ }));

    const card = screen.getByText("PERF-KA-01").closest("article");
    fireEvent.click(within(card).getByRole("button", { name: "Recall" }));

    expect(within(screen.getByText("PERF-KA-01").closest("article")).getByText("Ready")).toBeInTheDocument();
  });

  it("refuses a mismatch count on the incomplete typing", () => {
    renderWithProviders(<TransplantProcurementHub />);

    fireEvent.click(screen.getByRole("button", { name: /Immunology & Matching/ }));

    const card = screen.getByText("MX-7704").closest("article");
    expect(within(card).getByText("Typing incomplete")).toBeInTheDocument();
    expect(within(card).getByText(/worse than no number/)).toBeInTheDocument();
  });

  it("derives the count once the repeat typing is recorded", () => {
    renderWithProviders(<TransplantProcurementHub />);

    fireEvent.click(screen.getByRole("button", { name: /Immunology & Matching/ }));

    const card = screen.getByText("MX-7704").closest("article");
    fireEvent.click(within(card).getByRole("button", { name: /Record repeat typing/ }));

    // The repeat typing resolves DR as a genuine homozygote (DR7, DR7). A and B match exactly, and
    // the donor's DR13 is still absent from the recipient — so the answer is 1, not 0. Completing
    // the record does not make the mismatch go away; it makes it knowable.
    const after = screen.getByText("MX-7704").closest("article");
    expect(within(after).getByText("1/6 mismatch")).toBeInTheDocument();
    expect(within(after).queryByText("Typing incomplete")).not.toBeInTheDocument();
  });

  it("shows a contraindication on a zero-mismatch pair", () => {
    renderWithProviders(<TransplantProcurementHub />);

    fireEvent.click(screen.getByRole("button", { name: /Immunology & Matching/ }));

    // MX-7705 is a perfect antigen match with a positive crossmatch and 8400 MFI DSA.
    const card = screen.getByText("MX-7705").closest("article");
    expect(within(card).getByText("0/6 mismatch")).toBeInTheDocument();
    expect(within(card).getByText(/regardless of how well the antigens match/)).toBeInTheDocument();
  });

  it("opens a match modal that spells out the per-locus arithmetic", () => {
    renderWithProviders(<TransplantProcurementHub />);

    fireEvent.click(screen.getByRole("button", { name: /Immunology & Matching/ }));
    fireEvent.click(screen.getByRole("button", { name: "MX-7701" }));

    expect(screen.getByText(/1 \+ 1 \+ 1 = 3 of 6/)).toBeInTheDocument();
    expect(screen.getByText(/average away the finding that is an absolute/)).toBeInTheDocument();
  });

  it("advances the simulation without throwing", () => {
    renderWithProviders(<TransplantProcurementHub />);

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(screen.getByText(/Organ Transplant & Procurement Logistics Hub/)).toBeInTheDocument();
  });

  it("pauses and resumes the simulation", () => {
    renderWithProviders(<TransplantProcurementHub />);

    fireEvent.click(screen.getByTitle("Pause simulation"));
    expect(screen.getByText("Simulation paused")).toBeInTheDocument();

    fireEvent.click(screen.getByTitle("Resume simulation"));
    expect(screen.getByText(/Live simulation/)).toBeInTheDocument();
  });
});
