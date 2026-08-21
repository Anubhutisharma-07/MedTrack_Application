import { screen, fireEvent, within, act } from "@testing-library/react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderWithProviders } from "../../utils/renderWithProviders";
import DialysisRenalHub from "../../../pages/renal/DialysisRenalHub";

// Sessions advance on an interval and blood pressure walks randomly, so every assertion runs under
// fake timers. Without them a session can complete between render and assertion, which changes both
// the dose and the alarm state under test.
describe("DialysisRenalHub", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders the heading, the stat strip and all four consoles", () => {
    renderWithProviders(<DialysisRenalHub />);

    expect(screen.getByText(/Dialysis & Renal Replacement Therapy Fleet Hub/)).toBeInTheDocument();
    expect(screen.getByText("Sessions running")).toBeInTheDocument();
    expect(screen.getByText("UF rate over 13 mL/kg/h")).toBeInTheDocument();
    expect(screen.getByText("Active alarms")).toBeInTheDocument();
    expect(screen.getByText("Water loop")).toBeInTheDocument();

    expect(screen.getByRole("button", { name: /Treatment Floor/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Water Treatment/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Machine Fleet/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Reuse & Vascular Access/ })).toBeInTheDocument();
  });

  it("opens on the treatment floor with one card per station", () => {
    renderWithProviders(<DialysisRenalHub />);

    expect(screen.getByText("S-01")).toBeInTheDocument();
    expect(screen.getByText("S-08")).toBeInTheDocument();
    expect(screen.getByText(/Station in turnaround/)).toBeInTheDocument();
  });

  it("normalises the ultrafiltration rate by body weight, not by session volume", () => {
    renderWithProviders(<DialysisRenalHub />);

    // S-05 removes 4000 mL from an 88 kg patient over four hours: 11.4 mL/kg/h, elevated but
    // survivable. S-07 removes less fluid — 3400 mL — from a 58 kg patient over 200 minutes, which
    // is 17.6 mL/kg/h and well past the 13 mL/kg/h ceiling. The larger removal is the safer one.
    const heavier = screen.getByText("S-05").closest("div.rounded-2xl");
    const lighter = screen.getByText("S-07").closest("div.rounded-2xl");

    expect(within(heavier).getByText("11.4")).toBeInTheDocument();
    expect(within(lighter).getByText("17.6")).toBeInTheDocument();
  });

  it("counts only the prescriptions past the safety ceiling in the stat strip", () => {
    renderWithProviders(<DialysisRenalHub />);

    const card = screen.getByText("UF rate over 13 mL/kg/h").closest("div.rounded-xl");
    expect(within(card).getByText("1")).toBeInTheDocument();
  });

  it("leaves Kt/V pending until the post-dialysis urea sample exists", () => {
    renderWithProviders(<DialysisRenalHub />);

    // S-01 is mid-session: a partial dose is not a dose, so the console says so rather than
    // extrapolating one.
    const running = screen.getByText("S-01").closest("div.rounded-2xl");
    expect(within(running).getByText("pending")).toBeInTheDocument();
  });

  it("computes delivered Kt/V from the Daugirdas formula once the session completes", () => {
    renderWithProviders(<DialysisRenalHub />);

    // S-04: post/pre urea 19/66 over four hours with 2.2 L removed from a 49.8 kg post-weight.
    const adequate = screen.getByText("S-04").closest("div.rounded-2xl");
    expect(within(adequate).getByText("1.5")).toBeInTheDocument();

    // S-06: 28/69 over 3.5 hours with 2.5 L removed — a worse reduction, and the dose falls under
    // the 1.2 adequacy target.
    const inadequate = screen.getByText("S-06").closest("div.rounded-2xl");
    expect(within(inadequate).getByText("1.07")).toBeInTheDocument();
  });

  it("filters the floor by session status", () => {
    renderWithProviders(<DialysisRenalHub />);

    fireEvent.click(screen.getByRole("button", { name: "Complete" }));

    expect(screen.getByText("S-04")).toBeInTheDocument();
    expect(screen.queryByText("S-01")).not.toBeInTheDocument();
  });

  it("filters the floor by free-text search across station, patient and machine", () => {
    renderWithProviders(<DialysisRenalHub />);

    fireEvent.change(screen.getByLabelText(/Search the renal unit/i), { target: { value: "HD-03" } });

    expect(screen.getByText("S-03")).toBeInTheDocument();
    expect(screen.queryByText("S-01")).not.toBeInTheDocument();
  });

  it("shows an empty state when no station matches", () => {
    renderWithProviders(<DialysisRenalHub />);

    fireEvent.change(screen.getByLabelText(/Search the renal unit/i), { target: { value: "S-99" } });

    expect(screen.getByText(/No stations match the current search and filter/)).toBeInTheDocument();
  });

  it("surfaces an intradialytic hypotension alarm and lets it be acknowledged", () => {
    renderWithProviders(<DialysisRenalHub />);

    const card = screen.getByText("S-05").closest("div.rounded-2xl");
    expect(within(card).getByText(/Hypotension — UF paused/)).toBeInTheDocument();

    fireEvent.click(within(card).getByRole("button", { name: "Ack" }));

    expect(
      within(screen.getByText("S-05").closest("div.rounded-2xl")).queryByText(/Hypotension — UF paused/)
    ).not.toBeInTheDocument();
  });

  it("opens the session detail modal with the urea reduction ratio alongside Kt/V", () => {
    renderWithProviders(<DialysisRenalHub />);

    const card = screen.getByText("S-04").closest("div.rounded-2xl");
    fireEvent.click(within(card).getByRole("button", { name: "Detail" }));

    const dialog = screen.getByRole("dialog", { name: "S-04" });
    expect(within(dialog).getByText("Urea reduction ratio").nextSibling).toHaveTextContent("71%");
    expect(within(dialog).getByText("Delivered Kt/V").nextSibling).toHaveTextContent("1.5");
    expect(within(dialog).getByText(/convective term/)).toBeInTheDocument();
  });

  it("grades a water sample by its worst analyte, not its average", () => {
    renderWithProviders(<DialysisRenalHub />);

    fireEvent.click(screen.getByRole("button", { name: /Water Treatment/ }));

    // The softener outlet is inside the limit on four analytes and over it on chlorine alone, which
    // makes the whole sample a failure.
    const failing = screen.getByText("Softener outlet").closest("div.rounded-2xl");
    expect(within(failing).getByText("Exceeds")).toBeInTheDocument();

    // The RO product point is clean on every analyte.
    const clean = screen.getByText("RO product — loop feed").closest("div.rounded-2xl");
    expect(within(clean).getByText("In range")).toBeInTheDocument();
  });

  it("distinguishes the action level from the maximum", () => {
    renderWithProviders(<DialysisRenalHub />);

    fireEvent.click(screen.getByRole("button", { name: /Water Treatment/ }));

    // 68 CFU/mL is under the 100 CFU/mL limit but over the 50 CFU/mL action level, which is the
    // whole point of having two thresholds.
    const sample = screen.getByText("Station S-05 dialysate").closest("div.rounded-2xl");
    expect(within(sample).getByText("Action level")).toBeInTheDocument();
    expect(within(sample).getByText(/action 50 · max 100/)).toBeInTheDocument();
  });

  it("rolls the worst sample grade up to the loop status in the stat strip", () => {
    renderWithProviders(<DialysisRenalHub />);

    const card = screen.getByText("Water loop").closest("div.rounded-xl");
    expect(within(card).getByText("Exceeds")).toBeInTheDocument();
  });

  it("switches to the machine fleet and filters by service status", () => {
    renderWithProviders(<DialysisRenalHub />);

    fireEvent.click(screen.getByRole("button", { name: /Machine Fleet/ }));

    expect(screen.getByText("HD-01")).toBeInTheDocument();
    expect(screen.getAllByText("overdue").length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: "Out of service" }));

    expect(screen.getByText("HD-09")).toBeInTheDocument();
    expect(screen.queryByText("HD-01")).not.toBeInTheDocument();
  });

  it("condemns a dialyser on any single failed gate", () => {
    renderWithProviders(<DialysisRenalHub />);

    fireEvent.click(screen.getByRole("button", { name: /Reuse & Vascular Access/ }));

    // Retained volume below 80 %.
    const lowVolume = screen.getByText("DZ-7703").closest("div.rounded-2xl");
    expect(within(lowVolume).getByText(/Total cell volume 79% is below the 80% minimum/)).toBeInTheDocument();

    // Pressure test failed, despite an acceptable 88 % retained volume.
    const leaking = screen.getByText("DZ-7705").closest("div.rounded-2xl");
    expect(within(leaking).getByText(/Pressure integrity test failed/)).toBeInTheDocument();

    // Reuse count at the labelled maximum, despite passing both other gates.
    const exhausted = screen.getByText("DZ-7706").closest("div.rounded-2xl");
    expect(within(exhausted).getByText(/has reached the labelled maximum of 12/)).toBeInTheDocument();

    // And one that passes all three.
    const releasable = screen.getByText("DZ-7701").closest("div.rounded-2xl");
    expect(within(releasable).getByText("Releasable")).toBeInTheDocument();
  });

  it("condemns a releasable dialyser on demand", () => {
    renderWithProviders(<DialysisRenalHub />);

    fireEvent.click(screen.getByRole("button", { name: /Reuse & Vascular Access/ }));

    const card = screen.getByText("DZ-7701").closest("div.rounded-2xl");
    fireEvent.click(within(card).getByRole("button", { name: "Condemn" }));

    expect(within(screen.getByText("DZ-7701").closest("div.rounded-2xl")).getByText("Condemned")).toBeInTheDocument();
  });

  it("grades vascular access risk from recirculation, type and trend", () => {
    renderWithProviders(<DialysisRenalHub />);

    fireEvent.click(screen.getByRole("button", { name: /Reuse & Vascular Access/ }));

    // Recirculation over 15 % means dialysed blood is being pulled straight back in.
    const recirculating = screen.getByText("P-6634").closest("tr");
    expect(within(recirculating).getByText("High")).toBeInTheDocument();

    // A graft with falling flow is the classic precursor to thrombosis.
    const failingGraft = screen.getByText("P-4417").closest("tr");
    expect(within(failingGraft).getByText("High")).toBeInTheDocument();

    // A catheter is elevated risk however well it runs.
    const catheter = screen.getByText("P-9915").closest("tr");
    expect(within(catheter).getByText("Elevated")).toBeInTheDocument();

    // A stable, well-functioning fistula is the reference case.
    const fistula = screen.getByText("P-1102").closest("tr");
    expect(within(fistula).getByText("Low")).toBeInTheDocument();
  });

  it("pauses and resumes the live simulation", () => {
    renderWithProviders(<DialysisRenalHub />);

    fireEvent.click(screen.getByRole("button", { name: "Pause simulation" }));
    expect(screen.getByRole("button", { name: "Resume simulation" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Resume simulation" }));
    expect(screen.getByRole("button", { name: "Pause simulation" })).toBeInTheDocument();
  });

  it("advances treatment time on running sessions and leaves finished ones alone", () => {
    renderWithProviders(<DialysisRenalHub />);

    expect(within(screen.getByText("S-01").closest("div.rounded-2xl")).getByText("132 / 240 min")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(2300 * 2);
    });

    expect(within(screen.getByText("S-01").closest("div.rounded-2xl")).getByText("142 / 240 min")).toBeInTheDocument();
    // S-04 already completed, so its clock does not move.
    expect(within(screen.getByText("S-04").closest("div.rounded-2xl")).getByText("240 / 240 min")).toBeInTheDocument();
  });
});
