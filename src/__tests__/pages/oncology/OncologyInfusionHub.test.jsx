import { screen, fireEvent, within, act } from "@testing-library/react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderWithProviders } from "../../utils/renderWithProviders";
import OncologyInfusionHub from "../../../pages/oncology/OncologyInfusionHub";

// Infusions advance on an interval, so every assertion runs under fake timers. Without them a chair
// can finish between render and assertion, which changes the running counts under test.
describe("OncologyInfusionHub", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders the heading, the stat strip and all four consoles", () => {
    renderWithProviders(<OncologyInfusionHub />);

    expect(screen.getByText(/Oncology Infusion & Hazardous Drug Safety Hub/)).toBeInTheDocument();
    expect(screen.getByText("Infusions running")).toBeInTheDocument();
    expect(screen.getByText("Vesicants running")).toBeInTheDocument();
    expect(screen.getByText("Doses outside tolerance")).toBeInTheDocument();
    expect(screen.getByText("Surface exceedances")).toBeInTheDocument();

    expect(screen.getByRole("button", { name: /Infusion Floor/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Dose Verification/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Hazardous Containment/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Toxicity Governance/ })).toBeInTheDocument();
  });

  it("opens on the infusion floor with a card per chair", () => {
    renderWithProviders(<OncologyInfusionHub />);

    expect(screen.getByText("C-01")).toBeInTheDocument();
    expect(screen.getByText("FOLFOX6")).toBeInTheDocument();
    expect(screen.getByText(/Chair vacant — available for booking/)).toBeInTheDocument();
  });

  it("surfaces the vesicant handling policy only on vesicant chairs", () => {
    renderWithProviders(<OncologyInfusionHub />);

    const vesicant = screen.getByText("C-02").closest("div.rounded-2xl");
    expect(within(vesicant).getByText(/extravasation kit at the chair/)).toBeInTheDocument();

    const nonVesicant = screen.getByText("C-03").closest("div.rounded-2xl");
    expect(within(nonVesicant).queryByText(/extravasation kit at the chair/)).not.toBeInTheDocument();
  });

  it("filters chairs by vesicant classification", () => {
    renderWithProviders(<OncologyInfusionHub />);

    fireEvent.click(screen.getByRole("button", { name: "Vesicant" }));

    expect(screen.getByText("C-02")).toBeInTheDocument();
    expect(screen.queryByText("C-01")).not.toBeInTheDocument();
  });

  it("filters chairs by free-text search across patient and regimen", () => {
    renderWithProviders(<OncologyInfusionHub />);

    fireEvent.change(screen.getByLabelText(/Search the day unit/i), { target: { value: "R-CHOP" } });

    expect(screen.getByText("C-03")).toBeInTheDocument();
    expect(screen.queryByText("C-01")).not.toBeInTheDocument();
  });

  it("shows an empty state when no chair matches", () => {
    renderWithProviders(<OncologyInfusionHub />);

    fireEvent.change(screen.getByLabelText(/Search the day unit/i), { target: { value: "C-99" } });

    expect(screen.getByText(/No chairs match the current search and filter/)).toBeInTheDocument();
  });

  it("holds treatment on each blood-count gate independently", () => {
    renderWithProviders(<OncologyInfusionHub />);

    // Neutropenia.
    const neutropenic = screen.getByText("C-02").closest("div.rounded-2xl");
    expect(within(neutropenic).getByText(/Neutrophils 0.7 ×10⁹\/L below the 1 hold threshold/)).toBeInTheDocument();

    // Thrombocytopenia, with normal neutrophils.
    const thrombocytopenic = screen.getByText("C-04").closest("div.rounded-2xl");
    expect(within(thrombocytopenic).getByText(/Platelets 88 ×10⁹\/L below the 100 hold threshold/)).toBeInTheDocument();

    // Renal impairment, with normal counts.
    const renal = screen.getByText("C-07").closest("div.rounded-2xl");
    expect(within(renal).getByText(/Creatinine 148 µmol\/L/)).toBeInTheDocument();

    // And a chair with none of the three.
    const clear = screen.getByText("C-01").closest("div.rounded-2xl");
    expect(within(clear).queryByText(/hold threshold/)).not.toBeInTheDocument();
  });

  it("projects the time remaining from the rate actually set on the pump", () => {
    renderWithProviders(<OncologyInfusionHub />);

    // C-03 has 458 mL left at 50 mL/h — nine and a half hours; C-04 has 20 mL left at 500 mL/h.
    expect(within(screen.getByText("C-03").closest("div.rounded-2xl")).getByText("550 min remaining")).toBeInTheDocument();
    expect(within(screen.getByText("C-04").closest("div.rounded-2xl")).getByText("2 min remaining")).toBeInTheDocument();
  });

  it("recalculates a BSA dose from height and weight rather than reading the prescription", () => {
    renderWithProviders(<OncologyInfusionHub />);

    fireEvent.click(screen.getByRole("button", { name: /Dose Verification/ }));

    // Mosteller BSA for 174 cm / 78 kg is 1.94 m²; at 85 mg/m² that is 164.9 mg against 165
    // prescribed, comfortably inside tolerance.
    const card = screen.getByText("RX-9101").closest("div.rounded-2xl");
    expect(within(card).getByText("164.9 mg")).toBeInTheDocument();
    expect(within(card).getByText("Mosteller BSA 1.94 m²")).toBeInTheDocument();
    expect(within(card).getByText("Within tolerance")).toBeInTheDocument();
  });

  it("uses Calvert rather than body surface area for carboplatin", () => {
    renderWithProviders(<OncologyInfusionHub />);

    fireEvent.click(screen.getByRole("button", { name: /Dose Verification/ }));

    // AUC 5 against a GFR of 82 gives 5 × 107 = 535 mg. Carboplatin is cleared renally, so body
    // size is not the right basis for it at all.
    const card = screen.getByText("RX-9103").closest("div.rounded-2xl");
    expect(within(card).getByText("AUC 5 × (GFR 82 + 25)")).toBeInTheDocument();
    // Prescribed and recalculated both read 535 mg, which is what agreement looks like here.
    expect(within(card).getAllByText("535 mg")).toHaveLength(2);
    expect(within(card).getByText("0%")).toBeInTheDocument();
  });

  it("applies an absolute dose cap so correctly capped prescriptions do not false-positive", () => {
    renderWithProviders(<OncologyInfusionHub />);

    fireEvent.click(screen.getByRole("button", { name: /Dose Verification/ }));

    // Vincristine at 1.4 mg/m² on a 1.98 m² patient calculates to 2.8 mg, but the agent carries a
    // 2 mg absolute ceiling. Without the cap the check would flag a correct prescription as a 29%
    // under-dose.
    const card = screen.getByText("RX-9107").closest("div.rounded-2xl");
    expect(within(card).getByText(/capped at 2 mg/)).toBeInTheDocument();
    expect(within(card).getByText("Within tolerance")).toBeInTheDocument();
  });

  it("flags a dose outside the verification tolerance", () => {
    renderWithProviders(<OncologyInfusionHub />);

    fireEvent.click(screen.getByRole("button", { name: /Dose Verification/ }));

    // 178 mg prescribed against 161.3 mg recalculated is a 10.4% overshoot.
    const card = screen.getByText("RX-9104").closest("div.rounded-2xl");
    expect(within(card).getByText("Outside tolerance")).toBeInTheDocument();
    expect(within(card).getByText("+10.4%")).toBeInTheDocument();
  });

  it("refuses to release a preparation whose dose is outside tolerance", () => {
    renderWithProviders(<OncologyInfusionHub />);

    fireEvent.click(screen.getByRole("button", { name: /Dose Verification/ }));

    const card = screen.getByText("RX-9104").closest("div.rounded-2xl");
    fireEvent.click(within(card).getByRole("button", { name: "Release" }));

    // The attempt opens the workings instead of releasing, and the status stays Held.
    expect(screen.getByRole("dialog", { name: /RX-9104 dose check/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(within(screen.getByText("RX-9104").closest("div.rounded-2xl")).getByText("Held")).toBeInTheDocument();
  });

  it("releases a preparation that passes the independent check", () => {
    renderWithProviders(<OncologyInfusionHub />);

    fireEvent.click(screen.getByRole("button", { name: /Dose Verification/ }));

    const card = screen.getByText("RX-9105").closest("div.rounded-2xl");
    expect(within(card).getByText("Awaiting check")).toBeInTheDocument();

    fireEvent.click(within(card).getByRole("button", { name: "Release" }));

    expect(within(screen.getByText("RX-9105").closest("div.rounded-2xl")).getByText("Released")).toBeInTheDocument();
  });

  it("counts only the out-of-tolerance preparations in the stat strip", () => {
    renderWithProviders(<OncologyInfusionHub />);

    const card = screen.getByText("Doses outside tolerance").closest("div.rounded-xl");
    expect(within(card).getByText("1")).toBeInTheDocument();
  });

  it("flags a containment control that has lost its pressure cascade or certification", () => {
    renderWithProviders(<OncologyInfusionHub />);

    fireEvent.click(screen.getByRole("button", { name: /Hazardous Containment/ }));

    const isolator = screen.getByText("CACI-1").closest("div.rounded-2xl");
    expect(within(isolator).getByText(/HEPA certification overdue/)).toBeInTheDocument();

    // The anteroom is the one space that is meant to read positive, so it is not a fault.
    const anteroom = screen.getByText("ANTE-A").closest("div.rounded-2xl");
    expect(within(anteroom).queryByText(/pressure cascade lost/)).not.toBeInTheDocument();

    // And a correctly negative cabinet passes.
    const cabinet = screen.getByText("BSC-1").closest("div.rounded-2xl");
    expect(within(cabinet).queryByText(/not at negative pressure/)).not.toBeInTheDocument();
  });

  it("marks the wipe samples above the action level", () => {
    renderWithProviders(<OncologyInfusionHub />);

    fireEvent.click(screen.getByRole("button", { name: /Hazardous Containment/ }));

    const exceeding = screen.getByText("Hazardous waste bin lid").closest("tr");
    expect(within(exceeding).getByText("Action")).toBeInTheDocument();

    const clean = screen.getByText("BSC-1 work surface").closest("tr");
    expect(within(clean).queryByText("Action")).not.toBeInTheDocument();
  });

  it("switches to toxicity governance, filters by grade and resolves a case", () => {
    renderWithProviders(<OncologyInfusionHub />);

    fireEvent.click(screen.getByRole("button", { name: /Toxicity Governance/ }));

    expect(screen.getByText("Febrile neutropenia")).toBeInTheDocument();
    expect(screen.getByText("Extravasation register")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Grade 3" }));
    expect(screen.getByText("Febrile neutropenia")).toBeInTheDocument();
    expect(screen.queryByText("Constipation")).not.toBeInTheDocument();

    const card = screen.getByText("Febrile neutropenia").closest("div.rounded-2xl");
    fireEvent.click(within(card).getByRole("button", { name: "Mark resolved" }));
    expect(within(screen.getByText("Febrile neutropenia").closest("div.rounded-2xl")).getByText("Resolved")).toBeInTheDocument();
  });

  it("opens the chair detail modal with same-day bloods", () => {
    renderWithProviders(<OncologyInfusionHub />);

    const card = screen.getByText("C-02").closest("div.rounded-2xl");
    fireEvent.click(within(card).getByRole("button", { name: "Detail" }));

    const dialog = screen.getByRole("dialog", { name: "C-02" });
    expect(within(dialog).getByText("Neutrophils").nextSibling).toHaveTextContent("0.7 ×10⁹/L");
    expect(within(dialog).getByText("Vesicant classification").nextSibling).toHaveTextContent("Vesicant");
  });

  it("pauses and resumes the live simulation", () => {
    renderWithProviders(<OncologyInfusionHub />);

    fireEvent.click(screen.getByRole("button", { name: "Pause simulation" }));
    expect(screen.getByRole("button", { name: "Resume simulation" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Resume simulation" }));
    expect(screen.getByRole("button", { name: "Pause simulation" })).toBeInTheDocument();
  });

  it("advances each infusion at its own rate and completes the one that runs out", () => {
    renderWithProviders(<OncologyInfusionHub />);

    act(() => {
      vi.advanceTimersByTime(2500);
    });

    // C-04 had 20 mL left at 500 mL/h and finishes within one five-minute step; C-03 at 50 mL/h
    // gains only four millilitres in the same interval.
    expect(within(screen.getByText("C-04").closest("div.rounded-2xl")).getByText("Complete")).toBeInTheDocument();
    expect(within(screen.getByText("C-03").closest("div.rounded-2xl")).getByText("46 / 500 mL")).toBeInTheDocument();
  });
});
