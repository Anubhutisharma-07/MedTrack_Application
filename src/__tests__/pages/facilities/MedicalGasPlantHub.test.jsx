// Tests for the Medical Gas & Utilities Plant Hub.
//
// The weight is on daysOfSupply, because that is the number the estates team acts on and the only
// one on the page that is a claim rather than a reading. A VIE telemetry panel reports a level
// percentage; the question is when the tanker needs to come, and the conversion between the two is
// where the errors are.
//
// So the expansion ratio and the reserve subtraction are pinned against hand-worked values, and -
// the cases that matter most - the four states in which the console *declines* to produce a number
// are asserted as refusals. Every one of them would otherwise render a comfortable figure, which is
// the direction that gets a delivery deferred into the emergency reserve.

import { screen, fireEvent, within, act } from "@testing-library/react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderWithProviders } from "../../utils/renderWithProviders";
import MedicalGasPlantHub, {
  daysOfSupply,
  vaporiserHeadroom,
  sourceFaults,
  purityGrade,
  dutyBalance,
  zoneFaults,
} from "../../../pages/facilities/MedicalGasPlantHub";

/** A VIE with everything present and current. */
const healthyVie = {
  id: "SRC-TEST", name: "Test VIE", kind: "VIE", gas: "Oxygen", location: "Compound",
  capacityLitres: 10_000, contentsPct: 65, state: "On line", consumptionLitresDay: 1_000_000,
  baselineAgeDays: 1, vaporiserRatedLpm: 3_000, peakDemandLpm: 2_000,
};

describe("daysOfSupply", () => {
  it("converts liquid contents to gas litres and divides by consumption", () => {
    // Hand-worked: (65 - 15)/100 x 10,000 = 5,000 L liquid
    //              5,000 x 842            = 4,210,000 L gas
    //              4,210,000 / 1,000,000  = 4.21 -> 4.2 days
    const result = daysOfSupply(healthyVie);

    expect(result.usableGasLitres).toBe(4_210_000);
    expect(result.days).toBe(4.2);
    expect(result.refusal).toBeNull();
  });

  it("applies the 842:1 expansion ratio rather than treating the level as proportional to days", () => {
    // Without the expansion ratio the same tank reads as 0.005 days. The ratio is the entire step
    // that turns a tank gauge into a delivery date.
    const result = daysOfSupply(healthyVie);

    expect(result.days).toBeGreaterThan(1);
    expect(result.usableGasLitres / 842).toBe(5_000);
  });

  it("subtracts the emergency reserve before dividing, not after", () => {
    // Counting the reserve would give 65% x 10,000 x 842 / 1,000,000 = 5.47 days. The 1.27 day
    // difference is exactly the margin that exists so it is never planned against.
    const withReserve = daysOfSupply(healthyVie).days;
    const naive = Math.round(((0.65 * 10_000 * 842) / 1_000_000) * 10) / 10;

    expect(naive).toBe(5.5);
    expect(withReserve).toBeLessThan(naive);
  });

  it("returns zero days once contents have fallen into the reserve", () => {
    // Not "empty" - there is gas in the tank - but zero *usable* days, which is the honest figure.
    const result = daysOfSupply({ ...healthyVie, contentsPct: 12 });

    expect(result.days).toBe(0);
  });

  it("refuses a source that is not on line", () => {
    const result = daysOfSupply({ ...healthyVie, state: "Standby", consumptionLitresDay: 0 });

    expect(result.days).toBeNull();
    expect(result.refusal).toMatch(/not available to the pipeline/i);
  });

  it("refuses a source in fault rather than adding its contents to the estate total", () => {
    expect(daysOfSupply({ ...healthyVie, state: "Fault" }).days).toBeNull();
  });

  it("refuses to divide by a zero or absent consumption rate", () => {
    const zero = daysOfSupply({ ...healthyVie, consumptionLitresDay: 0 });

    expect(zero.days).toBeNull();
    // The failure mode being prevented: infinity rendered as a source that never runs out.
    expect(zero.refusal).toMatch(/never runs out/i);
  });

  it("refuses a stale consumption baseline", () => {
    // 19 days old. A figure carried over from a quieter week over-states supply exactly when demand
    // is rising, which is the only time anybody reads it.
    const result = daysOfSupply({ ...healthyVie, baselineAgeDays: 19 });

    expect(result.days).toBeNull();
    expect(result.refusal).toMatch(/19 days old/);
  });

  it("accepts a baseline exactly at the window boundary", () => {
    expect(daysOfSupply({ ...healthyVie, baselineAgeDays: 7 }).days).not.toBeNull();
    expect(daysOfSupply({ ...healthyVie, baselineAgeDays: 8 }).days).toBeNull();
  });

  it("refuses a compressor, which makes gas rather than storing it", () => {
    const result = daysOfSupply({ ...healthyVie, kind: "Compressor", capacityLitres: null, contentsPct: null });

    expect(result.days).toBeNull();
    expect(result.refusal).toMatch(/make gas rather than store it/i);
  });
});

describe("vaporiserHeadroom", () => {
  it("reports headroom and utilisation against the vaporiser rating", () => {
    const result = vaporiserHeadroom(healthyVie);

    expect(result.headroomLpm).toBe(1_000);
    expect(result.utilisationPct).toBeCloseTo(66.7, 1);
    expect(result.breached).toBe(false);
  });

  it("breaches when peak demand exceeds the rating, independently of contents", () => {
    // The 2021 failure mode: a tank with weeks of supply whose evaporators cannot boil off fast
    // enough, so pipeline pressure falls with the tank nearly full.
    const full = { ...healthyVie, contentsPct: 95, peakDemandLpm: 3_400 };

    expect(daysOfSupply(full).days).toBeGreaterThan(6);
    expect(vaporiserHeadroom(full).breached).toBe(true);
  });

  it("warns before the rating is reached rather than only after", () => {
    const result = vaporiserHeadroom({ ...healthyVie, peakDemandLpm: 2_700 });

    expect(result.breached).toBe(false);
    expect(result.tight).toBe(true);
  });
});

describe("sourceFaults", () => {
  it("reports nothing for a source with supply and headroom", () => {
    // (85 - 15)/100 x 10,000 x 842 / 500,000 = 11.8 days, clear of both supply thresholds.
    expect(sourceFaults({ ...healthyVie, contentsPct: 85, consumptionLitresDay: 500_000 })).toEqual([]);
  });

  it("puts a vaporiser breach ahead of everything else", () => {
    // Continuity leads. A vaporiser that cannot keep up is a failure this afternoon; three days of
    // supply is a failure on Thursday.
    const faults = sourceFaults({ ...healthyVie, contentsPct: 17, peakDemandLpm: 3_400 });

    expect(faults[0].code).toBe("VAPORISER");
    expect(faults.map((f) => f.code)).toContain("SUPPLY");
  });

  it("escalates supply from advisory to critical at three days", () => {
    // (60 - 15) x 842 x 100 / 1,000,000 = 3.8 days -> advisory.
    // (45 - 15) x 842 x 100 / 1,000,000 = 2.5 days -> critical.
    const warn = sourceFaults({ ...healthyVie, contentsPct: 60 });
    const critical = sourceFaults({ ...healthyVie, contentsPct: 45 });

    expect(warn.find((f) => f.code === "SUPPLY-LOW").tone).toBe("amber");
    expect(critical.find((f) => f.code === "SUPPLY").tone).toBe("red");
  });

  it("reports a faulted source as carrying no load", () => {
    const faults = sourceFaults({ ...healthyVie, state: "Fault" });

    expect(faults.map((f) => f.code)).toContain("STATE");
    // And no supply figure, because a faulted source is refused upstream.
    expect(faults.map((f) => f.code)).not.toContain("SUPPLY");
  });
});

describe("purityGrade", () => {
  const cleanAir = { gas: "Medical air", o2Pct: 20.9, coPpm: 1, co2Ppm: 340, noxPpm: 0.4, dewPointC: -52, oilMgM3: 0.02 };

  it("passes medical air inside every Ph. Eur. limit", () => {
    const result = purityGrade(cleanAir);

    expect(result.evaluable).toBe(true);
    expect(result.breaches).toEqual([]);
  });

  it("names the analyte that failed rather than collapsing to one pass lamp", () => {
    const result = purityGrade({ ...cleanAir, coPpm: 7 });

    expect(result.breaches).toHaveLength(1);
    expect(result.breaches[0].key).toBe("coPpm");
    expect(result.breaches[0].text).toMatch(/exceeds the 5 limit/);
  });

  it("fails a dew point above the limit, which is a less negative number", () => {
    // The sign trap: -38 C is *wetter* than -46 C and therefore out of spec. A naive comparison in
    // the wrong direction passes a failed drier.
    const result = purityGrade({ ...cleanAir, dewPointC: -38 });

    expect(result.breaches.map((b) => b.key)).toContain("dewPointC");
  });

  it("passes a dew point below the limit", () => {
    expect(purityGrade({ ...cleanAir, dewPointC: -61 }).breaches).toEqual([]);
  });

  it("applies a minimum to oxygen concentration and a maximum to contaminants", () => {
    const lowOxygen = purityGrade({ gas: "Oxygen", o2Pct: 99.2, coPpm: 1, co2Ppm: 90, noxPpm: 0.2, dewPointC: -58, oilMgM3: 0.01 });

    expect(lowOxygen.breaches.map((b) => b.key)).toEqual(["o2Pct"]);
    expect(lowOxygen.breaches[0].text).toMatch(/below the 99.5 minimum/);
  });

  it("grades each gas against its own monograph, not a shared one", () => {
    // 20.9% O2 is correct for medical air and a catastrophic failure for piped oxygen.
    expect(purityGrade({ ...cleanAir, gas: "Medical air" }).breaches).toEqual([]);
    expect(purityGrade({ ...cleanAir, gas: "Oxygen" }).breaches.map((b) => b.key)).toContain("o2Pct");
  });

  it("reports an unsampled analyte as unassessed rather than as within limit", () => {
    const result = purityGrade({ ...cleanAir, dewPointC: null });
    const unassessed = result.breaches.find((b) => b.key === "dewPointC");

    expect(unassessed.tone).toBe("amber");
    expect(unassessed.text).toMatch(/unassessed rather than within limit/i);
  });

  it("refuses to grade a gas with no configured monograph", () => {
    const result = purityGrade({ gas: "Heliox", o2Pct: 21 });

    expect(result.evaluable).toBe(false);
    expect(result.refusal).toMatch(/No European Pharmacopoeia monograph/);
  });
});

describe("dutyBalance", () => {
  it("reports the spread across a set", () => {
    const result = dutyBalance([{ dutyPct: 58 }, { dutyPct: 31 }, { dutyPct: 11 }]);

    expect(result.spread).toBe(47);
    expect(result.imbalanced).toBe(true);
  });

  it("passes a set the controller is still rotating", () => {
    expect(dutyBalance([{ dutyPct: 36 }, { dutyPct: 34 }, { dutyPct: 30 }]).imbalanced).toBe(false);
  });

  it("returns null for a set with nothing to compare", () => {
    expect(dutyBalance([{ dutyPct: 50 }])).toBeNull();
  });
});

describe("zoneFaults", () => {
  const goodZone = { gas: "Oxygen", pressureBar: 4.1, alarmPanel: "Normal", valveState: "Open", lastTestedDays: 40, serves: "ICU beds 1-18" };

  it("passes a zone inside the HTM band with a normal panel", () => {
    expect(zoneFaults(goodZone)).toEqual([]);
  });

  it("flags a pressure below the floor as starving the terminals", () => {
    const faults = zoneFaults({ ...goodZone, pressureBar: 3.71 });

    expect(faults.map((f) => f.code)).toContain("LOW");
    expect(faults.find((f) => f.code === "LOW").tone).toBe("red");
  });

  it("flags a pressure above the ceiling as a drifted regulator", () => {
    expect(zoneFaults({ ...goodZone, pressureBar: 4.71 }).map((f) => f.code)).toContain("HIGH");
  });

  it("uses the band for the gas, so a surgical air pressure is not judged against oxygen", () => {
    // 7.0 bar is correct for surgical air and far above the ceiling for oxygen.
    expect(zoneFaults({ ...goodZone, gas: "Surgical air", pressureBar: 7.0 })).toEqual([]);
    expect(zoneFaults({ ...goodZone, gas: "Oxygen", pressureBar: 7.0 }).map((f) => f.code)).toContain("HIGH");
  });

  it("flags a valve that has not been operated in over a year", () => {
    const faults = zoneFaults({ ...goodZone, lastTestedDays: 402 });

    expect(faults.map((f) => f.code)).toContain("TEST");
    expect(faults.find((f) => f.code === "TEST").text).toMatch(/nobody knows will turn/);
  });

  it("names the areas isolated when a valve is closed", () => {
    const faults = zoneFaults({ ...goodZone, valveState: "Closed for works" });

    expect(faults.find((f) => f.code === "CLOSED").text).toMatch(/ICU beds 1-18/);
  });
});

describe("MedicalGasPlantHub rendering", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders the heading, the stat strip and all four consoles", () => {
    renderWithProviders(<MedicalGasPlantHub />);

    expect(screen.getByText(/Medical Gas & Utilities Plant Hub/)).toBeInTheDocument();
    expect(screen.getByText("Sources Under 3 Days")).toBeInTheDocument();
    expect(screen.getByText("Supply Not Computable")).toBeInTheDocument();
    expect(screen.getByText("Purity Breaches")).toBeInTheDocument();
    expect(screen.getByText("Zones Out of Band")).toBeInTheDocument();

    for (const label of ["Source Plant", "Quality & Purity", "Distribution & Zones", "Vacuum & AGSS"]) {
      expect(screen.getByRole("button", { name: new RegExp(label) })).toBeInTheDocument();
    }
  });

  it("renders the refusal rather than a comfortable figure for the stale-baseline source", () => {
    renderWithProviders(<MedicalGasPlantHub />);

    // SRC-VIE-03 seeds with a 19 day old baseline.
    const card = screen.getByText("SRC-VIE-03").closest("article");
    expect(within(card).getByText(/19 days old/)).toBeInTheDocument();
    expect(within(card).getByText(/over-states supply exactly when demand is rising/)).toBeInTheDocument();
  });

  it("resamples the baseline and produces a figure where there was a refusal", () => {
    renderWithProviders(<MedicalGasPlantHub />);

    const card = screen.getByText("SRC-VIE-03").closest("article");
    fireEvent.click(within(card).getByRole("button", { name: /Resample baseline/ }));

    expect(within(screen.getByText("SRC-VIE-03").closest("article")).queryByText(/19 days old/)).not.toBeInTheDocument();
  });

  it("excludes a standby source from the supply figure rather than adding its contents", () => {
    renderWithProviders(<MedicalGasPlantHub />);

    const card = screen.getByText("SRC-VIE-02").closest("article");
    expect(within(card).getByText(/not available to the pipeline/)).toBeInTheDocument();
  });

  it("filters the source plant down to the sources it cannot compute", () => {
    renderWithProviders(<MedicalGasPlantHub />);

    fireEvent.click(screen.getByRole("button", { name: "Not computable" }));

    expect(screen.getByText("SRC-VIE-02")).toBeInTheDocument();
    expect(screen.queryByText("SRC-VIE-01")).not.toBeInTheDocument();
  });

  it("shows an empty state when nothing matches the search", () => {
    renderWithProviders(<MedicalGasPlantHub />);

    fireEvent.change(screen.getByPlaceholderText(/Search sources, analysers/), {
      target: { value: "no-such-plant" },
    });

    expect(screen.getByText("No sources match the current filters.")).toBeInTheDocument();
  });

  it("names the failing analyte on the quality console", () => {
    renderWithProviders(<MedicalGasPlantHub />);

    fireEvent.click(screen.getByRole("button", { name: /Quality & Purity/ }));

    // AN-AIR-03 seeds CO at 7 ppm against a 5 ppm limit.
    const card = screen.getByText("AN-AIR-03").closest("article");
    expect(within(card).getByText(/CO ppm 7 exceeds the 5 limit/)).toBeInTheDocument();
  });

  it("flags a wet dew point on the terminal analyser", () => {
    renderWithProviders(<MedicalGasPlantHub />);

    fireEvent.click(screen.getByRole("button", { name: /Quality & Purity/ }));

    // AN-AIR-02 seeds -38 C against a -46 C limit.
    const card = screen.getByText("AN-AIR-02").closest("article");
    expect(within(card).getByText(/Dew point °C -38 exceeds the -46 limit/)).toBeInTheDocument();
  });

  it("restores lead-lag rotation and evens the duty across a set", () => {
    renderWithProviders(<MedicalGasPlantHub />);

    fireEvent.click(screen.getByRole("button", { name: /Quality & Purity/ }));

    expect(screen.getByText("47% spread")).toBeInTheDocument();

    const set = screen.getByText("Medical air (4 bar)").closest("article");
    fireEvent.click(within(set).getByRole("button", { name: /Restore lead-lag rotation/ }));

    expect(screen.queryByText("47% spread")).not.toBeInTheDocument();
  });

  it("names the clinical areas each zone valve isolates", () => {
    renderWithProviders(<MedicalGasPlantHub />);

    fireEvent.click(screen.getByRole("button", { name: /Distribution & Zones/ }));

    expect(screen.getByText("ICU beds 1–18, ICU isolation 1–2")).toBeInTheDocument();
    expect(screen.getByText(/Delivery rooms 1–10, obstetric theatre, NICU cots 1–16/)).toBeInTheDocument();
  });

  it("operates a lapsed valve and clears its overdue test", () => {
    renderWithProviders(<MedicalGasPlantHub />);

    fireEvent.click(screen.getByRole("button", { name: /Distribution & Zones/ }));
    fireEvent.click(screen.getByRole("button", { name: "Test overdue" }));

    // AVSU-W12-O2 seeds at 402 days.
    const row = screen.getByText("AVSU-W12-O2").closest("tr");
    fireEvent.click(within(row).getByRole("button", { name: /Operate & prove/ }));

    expect(screen.queryByText("AVSU-W12-O2")).not.toBeInTheDocument();
  });

  it("renders the vacuum and AGSS plant", () => {
    renderWithProviders(<MedicalGasPlantHub />);

    fireEvent.click(screen.getByRole("button", { name: /Vacuum & AGSS/ }));

    expect(screen.getByText("VAC-01")).toBeInTheDocument();
    expect(screen.getByText("AGS-01")).toBeInTheDocument();
    // VAC-03 seeds a 210 day old bacterial filter.
    expect(screen.getByText(/moves contamination towards/)).toBeInTheDocument();
  });

  it("opens a source modal that spells out the expansion arithmetic", () => {
    renderWithProviders(<MedicalGasPlantHub />);

    fireEvent.click(screen.getByRole("button", { name: "SRC-VIE-01" }));

    expect(screen.getByText("Emergency reserve")).toBeInTheDocument();
    expect(screen.getByText(/turns a tank gauge into a delivery date/)).toBeInTheDocument();
  });

  it("advances the simulation without throwing", () => {
    renderWithProviders(<MedicalGasPlantHub />);

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(screen.getByText(/Medical Gas & Utilities Plant Hub/)).toBeInTheDocument();
  });

  it("pauses and resumes the simulation", () => {
    renderWithProviders(<MedicalGasPlantHub />);

    fireEvent.click(screen.getByTitle("Pause simulation"));
    expect(screen.getByText("Simulation paused")).toBeInTheDocument();

    fireEvent.click(screen.getByTitle("Resume simulation"));
    expect(screen.getByText(/Live simulation/)).toBeInTheDocument();
  });
});
