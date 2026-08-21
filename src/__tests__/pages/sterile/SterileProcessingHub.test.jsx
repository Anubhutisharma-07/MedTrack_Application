import { screen, fireEvent, within, act } from "@testing-library/react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderWithProviders } from "../../utils/renderWithProviders";
import SterileProcessingHub from "../../../pages/sterile/SterileProcessingHub";

// Cycles advance on an interval and accumulate lethality as they go, so every assertion here runs
// under fake timers. Without them a slow run can push a load from Sterilise into Complete between
// the render and the assertion, which changes the release verdict under test.
describe("SterileProcessingHub", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders the heading, the stat strip and all four consoles", () => {
    renderWithProviders(<SterileProcessingHub />);

    expect(screen.getByText(/Sterile Processing & Instrument Tray Traceability Hub/)).toBeInTheDocument();
    expect(screen.getByText("Trays in circulation")).toBeInTheDocument();
    expect(screen.getByText("Assembly holds")).toBeInTheDocument();
    expect(screen.getByText("Loads quarantined")).toBeInTheDocument();
    expect(screen.getByText("Failed loads")).toBeInTheDocument();

    expect(screen.getByRole("button", { name: /Tray Traceability/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Steriliser Loads/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Load Release/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Decontamination & Washers/ })).toBeInTheDocument();
  });

  it("opens on the tray console with the reprocessing stage breakdown", () => {
    renderWithProviders(<SterileProcessingHub />);

    expect(screen.getByText("Where the tray pool is right now")).toBeInTheDocument();
    expect(screen.getByText("Major Orthopaedic Set")).toBeInTheDocument();
    expect(screen.getByText("Craniotomy Set A")).toBeInTheDocument();
  });

  it("holds trays whose instrument count does not reconcile", () => {
    renderWithProviders(<SterileProcessingHub />);

    // TR-1003 counted 94 of 96 and TR-1011 counted 27 of 29: both are short and both are held.
    const panel = screen.getByText("Trays held at assembly").closest("div.rounded-2xl");
    expect(within(panel).getByText("TR-1003")).toBeInTheDocument();
    expect(within(panel).getByText("TR-1011")).toBeInTheDocument();
    expect(within(panel).getAllByText("-2 instruments")).toHaveLength(2);
  });

  it("clears a hold once the count is reconciled", () => {
    renderWithProviders(<SterileProcessingHub />);

    const panel = screen.getByText("Trays held at assembly").closest("div.rounded-2xl");
    const card = within(panel).getByText("TR-1003").closest("div.rounded-xl");
    fireEvent.click(within(card).getByRole("button", { name: /Reconcile count/ }));

    expect(within(screen.getByText("Trays held at assembly").closest("div.rounded-2xl")).queryByText("TR-1003")).not.toBeInTheDocument();
  });

  it("filters trays by reprocessing stage", () => {
    renderWithProviders(<SterileProcessingHub />);

    fireEvent.click(screen.getByRole("button", { name: "Quarantine" }));

    expect(screen.getByText("Spinal Instrumentation Set")).toBeInTheDocument();
    expect(screen.queryByText("Basic Suture Set")).not.toBeInTheDocument();
  });

  it("filters trays by free-text search", () => {
    renderWithProviders(<SterileProcessingHub />);

    fireEvent.change(screen.getByLabelText(/Search sterile processing/i), {
      target: { value: "neurosurgery" },
    });

    expect(screen.getByText("Craniotomy Set A")).toBeInTheDocument();
    expect(screen.queryByText("Cardiac Bypass Set")).not.toBeInTheDocument();
  });

  it("shows an empty state when no tray matches", () => {
    renderWithProviders(<SterileProcessingHub />);

    fireEvent.change(screen.getByLabelText(/Search sterile processing/i), {
      target: { value: "no-such-tray" },
    });

    expect(screen.getByText(/No trays match the current search and filter/)).toBeInTheDocument();
  });

  it("opens the tray history modal with its lifetime cycle count", () => {
    renderWithProviders(<SterileProcessingHub />);

    const row = screen.getByText("Flexible Endoscope Channel Set").closest("tr");
    fireEvent.click(within(row).getByRole("button", { name: "History" }));

    const dialog = screen.getByRole("dialog", { name: "TR-1009" });
    expect(within(dialog).getByText("Lifetime cycles").nextSibling).toHaveTextContent("2210");
    expect(within(dialog).getByText("Specialty").nextSibling).toHaveTextContent("Endoscopy");
  });

  it("switches to the load console and shows steriliser fleet status", () => {
    renderWithProviders(<SterileProcessingHub />);

    fireEvent.click(screen.getByRole("button", { name: /Steriliser Loads/ }));

    expect(screen.getAllByText("AUT-01").length).toBeGreaterThan(0);
    expect(screen.getByText(/Air removal test failed/)).toBeInTheDocument();
  });

  it("shows accumulated F0 against the release threshold", () => {
    renderWithProviders(<SterileProcessingHub />);

    fireEvent.click(screen.getByRole("button", { name: /Steriliser Loads/ }));

    // LD-8803 ran a 121 °C gravity cycle long enough to bank 34.7 minutes of lethality.
    const card = screen.getByText("LD-8803").closest("div.rounded-2xl");
    expect(within(card).getByText("34.7 min")).toBeInTheDocument();
  });

  it("marks a low-temperature cycle as having no F0 rather than a failing one", () => {
    renderWithProviders(<SterileProcessingHub />);

    fireEvent.click(screen.getByRole("button", { name: /Steriliser Loads/ }));

    // Hydrogen peroxide plasma is not a moist heat process, so the F0 model does not apply to it.
    const card = screen.getByText("LD-8805").closest("div.rounded-2xl");
    expect(within(card).getByText("n/a")).toBeInTheDocument();
  });

  it("filters loads by release state", () => {
    renderWithProviders(<SterileProcessingHub />);

    fireEvent.click(screen.getByRole("button", { name: /Steriliser Loads/ }));
    fireEvent.click(screen.getByRole("button", { name: "Failed" }));

    expect(screen.getByText("LD-8806")).toBeInTheDocument();
    expect(screen.queryByText("LD-8803")).not.toBeInTheDocument();
  });

  it("lists every unmet release criterion, not just the first", () => {
    renderWithProviders(<SterileProcessingHub />);

    fireEvent.click(screen.getByRole("button", { name: /Load Release/ }));

    // LD-8806 failed on four separate counts: lethality, air removal, chemical indicator and BI.
    const card = screen.getByText("LD-8806").closest("div.rounded-2xl");
    expect(within(card).getByText(/F0 8.9 below the 15 minute threshold/)).toBeInTheDocument();
    expect(within(card).getByText(/failed its Bowie-Dick air removal test/)).toBeInTheDocument();
    expect(within(card).getByText(/Chemical indicator did not reach its end point/)).toBeInTheDocument();
    expect(within(card).getByText(/Biological indicator grew/)).toBeInTheDocument();
  });

  it("blocks an implant load until its biological indicator reads negative", () => {
    renderWithProviders(<SterileProcessingHub />);

    fireEvent.click(screen.getByRole("button", { name: /Load Release/ }));

    // LD-8804 met every parametric criterion; the only thing holding it is the implant BI rule.
    const card = screen.getByText("LD-8804").closest("div.rounded-2xl");
    expect(within(card).getByText("Implant load")).toBeInTheDocument();
    expect(
      within(card).getByText(/Implant load: biological indicator must read negative before release/)
    ).toBeInTheDocument();

    fireEvent.click(within(card).getByRole("button", { name: "BI negative" }));

    const updated = screen.getByText("LD-8804").closest("div.rounded-2xl");
    expect(within(updated).getByText(/Every release criterion is satisfied/)).toBeInTheDocument();
  });

  it("fails the load outright when the biological indicator grows", () => {
    renderWithProviders(<SterileProcessingHub />);

    fireEvent.click(screen.getByRole("button", { name: /Load Release/ }));

    const card = screen.getByText("LD-8801").closest("div.rounded-2xl");
    fireEvent.click(within(card).getByRole("button", { name: "BI positive" }));

    const updated = screen.getByText("LD-8801").closest("div.rounded-2xl");
    expect(within(updated).getByText("Failed")).toBeInTheDocument();
  });

  it("releases a load only once every criterion is met, moving its trays to sterile storage", () => {
    renderWithProviders(<SterileProcessingHub />);

    fireEvent.click(screen.getByRole("button", { name: /Load Release/ }));
    const card = screen.getByText("LD-8804").closest("div.rounded-2xl");

    // Blocked first: the release attempt surfaces the blockers instead of releasing.
    fireEvent.click(within(card).getByRole("button", { name: "Release load" }));
    expect(screen.getByRole("dialog", { name: /LD-8804 cycle record/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Close" }));

    fireEvent.click(within(screen.getByText("LD-8804").closest("div.rounded-2xl")).getByRole("button", { name: "BI negative" }));
    fireEvent.click(within(screen.getByText("LD-8804").closest("div.rounded-2xl")).getByRole("button", { name: "Release load" }));

    fireEvent.click(screen.getByRole("button", { name: /Tray Traceability/ }));
    const trayRow = screen.getByText("Spinal Instrumentation Set").closest("tr");
    expect(within(trayRow).getByText("Sterile storage")).toBeInTheDocument();
  });

  it("switches to decontamination and reports A0 against the ISO 15883 threshold", () => {
    renderWithProviders(<SterileProcessingHub />);

    fireEvent.click(screen.getByRole("button", { name: /Decontamination & Washers/ }));

    expect(screen.getByText(/the washer/)).toBeInTheDocument();
    expect(screen.getByText("812 / 600")).toBeInTheDocument();
    expect(screen.getByText("421 / 600")).toBeInTheDocument();
    expect(screen.getByText(/part-completed disinfection/)).toBeInTheDocument();
  });

  it("pauses and resumes the live simulation", () => {
    renderWithProviders(<SterileProcessingHub />);

    fireEvent.click(screen.getByRole("button", { name: "Pause simulation" }));
    expect(screen.getByRole("button", { name: "Resume simulation" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Resume simulation" }));
    expect(screen.getByRole("button", { name: "Pause simulation" })).toBeInTheDocument();
  });

  it("accumulates lethality on a running sterilise hold", () => {
    renderWithProviders(<SterileProcessingHub />);

    fireEvent.click(screen.getByRole("button", { name: /Steriliser Loads/ }));

    // LD-8801 is mid-hold at 134 °C, where one minute is worth roughly twenty at the 121.1 °C
    // reference, so its F0 climbs fast while the hold lasts.
    const before = Number(
      within(screen.getByText("LD-8801").closest("div.rounded-2xl")).getByText(/min$/).textContent.replace(" min", "")
    );

    act(() => {
      vi.advanceTimersByTime(2200 * 2);
    });

    const after = Number(
      within(screen.getByText("LD-8801").closest("div.rounded-2xl")).getByText(/min$/).textContent.replace(" min", "")
    );
    expect(after).toBeGreaterThan(before);
  });
});
