import { screen, fireEvent, within, act } from "@testing-library/react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderWithProviders } from "../../utils/renderWithProviders";
import BloodBankTransfusionHub from "../../../pages/bloodbank/BloodBankTransfusionHub";

// The page ages its inventory on an interval. Fake timers keep every assertion below deterministic:
// without them a slow test run can tip a platelet over its five-day shelf life mid-assertion and the
// unit under test quietly changes state.
describe("BloodBankTransfusionHub", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders the heading, the stat strip and all four console tabs", () => {
    renderWithProviders(<BloodBankTransfusionHub />);

    expect(screen.getByText(/Blood Bank & Transfusion Medicine Command Hub/)).toBeInTheDocument();
    expect(screen.getByText("Issuable units")).toBeInTheDocument();
    expect(screen.getByText("Near outdate")).toBeInTheDocument();
    expect(screen.getByText("Quarantined")).toBeInTheDocument();
    expect(screen.getByText("Open reaction cases")).toBeInTheDocument();

    expect(screen.getByRole("button", { name: /Component Inventory/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Crossmatch Lab/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Haemovigilance/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Donor & Apheresis/ })).toBeInTheDocument();
  });

  it("opens on the inventory tab with the ISBT 128 unit ledger", () => {
    renderWithProviders(<BloodBankTransfusionHub />);

    expect(screen.getByText("W1234 24 900001")).toBeInTheDocument();
    expect(screen.getByText("Donation ID (ISBT 128)")).toBeInTheDocument();
    expect(screen.getAllByText("Apheresis Platelets").length).toBeGreaterThan(0);
  });

  it("sorts the ledger by shelf life remaining so the next unit to outdate is first", () => {
    // FIFO issue discipline is the whole point of the table's ordering: the unit closest to
    // outdating has to be the one a technician reaches for.
    renderWithProviders(<BloodBankTransfusionHub />);

    const rows = screen.getAllByRole("row").slice(1);
    const firstDin = within(rows[0]).getByText(/^W1234/).textContent;

    // Thawed plasma has a 24-hour dating period and the seed unit is already 22 hours old, so it is
    // the shortest-lived unit in the fridge by a wide margin.
    expect(firstDin).toBe("W1234 24 920004");
  });

  it("filters the ledger by component class", () => {
    renderWithProviders(<BloodBankTransfusionHub />);

    expect(screen.getByText("W1234 24 900001")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Platelets" }));

    expect(screen.queryByText("W1234 24 900001")).not.toBeInTheDocument();
    expect(screen.getByText("W1234 24 910001")).toBeInTheDocument();
  });

  it("filters the ledger by free-text search across DIN, group and location", () => {
    renderWithProviders(<BloodBankTransfusionHub />);

    fireEvent.change(screen.getByLabelText(/Search the transfusion service/i), {
      target: { value: "BB-F2" },
    });

    expect(screen.getByText("W1234 24 930001")).toBeInTheDocument();
    expect(screen.queryByText("W1234 24 900001")).not.toBeInTheDocument();
  });

  it("shows an empty state when nothing matches the search", () => {
    renderWithProviders(<BloodBankTransfusionHub />);

    fireEvent.change(screen.getByLabelText(/Search the transfusion service/i), {
      target: { value: "no-such-unit" },
    });

    expect(screen.getByText(/No units match the current search and filter/)).toBeInTheDocument();
  });

  it("reports days of cover per red cell group and flags a group below the two-day floor", () => {
    renderWithProviders(<BloodBankTransfusionHub />);

    expect(screen.getByText(/Days of cover by red cell group/)).toBeInTheDocument();
    // AB+ holds a single unit against a 1.0/day issue rate, so it sits on exactly one day of cover.
    expect(screen.getAllByText("Below 2-day floor").length).toBeGreaterThan(0);
  });

  it("computes MTP readiness from the scarcest component, not the total unit count", () => {
    renderWithProviders(<BloodBankTransfusionHub />);

    expect(screen.getByText("MTP readiness")).toBeInTheDocument();
    expect(screen.getByText("Complete 1:1:1 rounds")).toBeInTheDocument();

    // Seed stock: 10 red cells, 4 plasma (2 FFP + 2 thawed), 4 platelets minus one quarantined = 3.
    // Platelets are therefore the limiting component and cap the protocol at three rounds.
    expect(screen.getByText("Limiting component").nextSibling).toHaveTextContent("Platelets");
  });

  it("opens the unit inspection modal with its storage envelope and phenotype", () => {
    renderWithProviders(<BloodBankTransfusionHub />);

    const row = screen.getByText("W1234 24 900002").closest("tr");
    fireEvent.click(within(row).getByRole("button", { name: "Inspect" }));

    const dialog = screen.getByRole("dialog", { name: "W1234 24 900002" });
    expect(within(dialog).getByText("1-6 °C refrigerated")).toBeInTheDocument();
    expect(within(dialog).getByText("R2R2, K-")).toBeInTheDocument();
    expect(within(dialog).getByText("Irradiated").nextSibling).toHaveTextContent("Yes");
  });

  it("lists the recipients an O-negative red cell unit can serve", () => {
    renderWithProviders(<BloodBankTransfusionHub />);

    const row = screen.getByText("W1234 24 900001").closest("tr");
    fireEvent.click(within(row).getByRole("button", { name: "Inspect" }));

    // O-negative red cells are the universal donor: every ABO group can receive them.
    expect(screen.getByText(/Compatible recipients: O, A, B, AB/)).toBeInTheDocument();
  });

  it("switches to the crossmatch tab and lists open requests with their antibody screen", () => {
    renderWithProviders(<BloodBankTransfusionHub />);

    fireEvent.click(screen.getByRole("button", { name: /Crossmatch Lab/ }));

    expect(screen.getByText("XM-4401")).toBeInTheDocument();
    expect(screen.getByText(/Ruptured AAA/)).toBeInTheDocument();
    expect(screen.getByText("Anti-Jka")).toBeInTheDocument();
  });

  it("filters crossmatch requests by urgency", () => {
    renderWithProviders(<BloodBankTransfusionHub />);

    fireEvent.click(screen.getByRole("button", { name: /Crossmatch Lab/ }));
    fireEvent.click(screen.getByRole("button", { name: "Emergency" }));

    expect(screen.getByText("XM-4401")).toBeInTheDocument();
    expect(screen.queryByText("XM-4403")).not.toBeInTheDocument();
  });

  it("reserves compatible units against a request and lets them be released again", () => {
    renderWithProviders(<BloodBankTransfusionHub />);

    fireEvent.click(screen.getByRole("button", { name: /Crossmatch Lab/ }));

    // XM-4403 is a B+ recipient needing two red cell units. B+ may receive B or O of either RhD,
    // so the fridge holds six candidates and the reservation is satisfied in full.
    const card = screen.getByText("XM-4403").closest("div.rounded-2xl");
    fireEvent.click(within(card).getByRole("button", { name: /Reserve 2 units/ }));

    expect(within(card).getByRole("button", { name: /Release 2/ })).toBeInTheDocument();

    fireEvent.click(within(card).getByRole("button", { name: /Release 2/ }));
    expect(within(card).getByRole("button", { name: /Reserve 2 units/ })).toBeInTheDocument();
  });

  it("reserves what it can and reports the shortfall when stock cannot cover the request", () => {
    renderWithProviders(<BloodBankTransfusionHub />);

    fireEvent.click(screen.getByRole("button", { name: /Crossmatch Lab/ }));

    // XM-4401 is an O-negative recipient in an active MTP asking for six units. O-negative may only
    // receive O-negative red cells, and the fridge holds three, so the reservation is short by half.
    const card = screen.getByText("XM-4401").closest("div.rounded-2xl");
    fireEvent.click(within(card).getByRole("button", { name: /Reserve 6 units/ }));

    expect(within(card).getByRole("button", { name: /Release 3/ })).toBeInTheDocument();
    expect(within(card).getByText(/3 short/)).toBeInTheDocument();
  });

  it("shows the ABO rule that applies to the requested component in the compatibility modal", () => {
    renderWithProviders(<BloodBankTransfusionHub />);

    fireEvent.click(screen.getByRole("button", { name: /Crossmatch Lab/ }));

    // XM-4404 is an AB+ plasma request: plasma compatibility inverts the red cell direction.
    const card = screen.getByText("XM-4404").closest("div.rounded-2xl");
    fireEvent.click(within(card).getByRole("button", { name: "Compatibility" }));

    expect(screen.getByText(/AB is the universal plasma donor/)).toBeInTheDocument();
  });

  it("switches to haemovigilance and closes a case", () => {
    renderWithProviders(<BloodBankTransfusionHub />);

    fireEvent.click(screen.getByRole("button", { name: /Haemovigilance/ }));

    expect(screen.getByText("HV-2201")).toBeInTheDocument();
    expect(screen.getByText("Suspected bacterial contamination")).toBeInTheDocument();

    const card = screen.getByText("HV-2201").closest("div.rounded-2xl");
    fireEvent.click(within(card).getByRole("button", { name: /Close & report/ }));

    expect(within(card).queryByRole("button", { name: /Close & report/ })).not.toBeInTheDocument();
  });

  it("filters reaction cases by severity grade", () => {
    renderWithProviders(<BloodBankTransfusionHub />);

    fireEvent.click(screen.getByRole("button", { name: /Haemovigilance/ }));
    fireEvent.click(screen.getByRole("button", { name: "Grade 3" }));

    expect(screen.getByText("HV-2202")).toBeInTheDocument();
    expect(screen.queryByText("HV-2201")).not.toBeInTheDocument();
  });

  it("switches to the donor tab and shows session yield and deferral reasons", () => {
    renderWithProviders(<BloodBankTransfusionHub />);

    fireEvent.click(screen.getByRole("button", { name: /Donor & Apheresis/ }));

    expect(screen.getByText("Main campus atrium")).toBeInTheDocument();
    expect(screen.getByText("Deferral reasons today")).toBeInTheDocument();
    expect(screen.getByText("Low haemoglobin")).toBeInTheDocument();
  });

  it("pauses and resumes the live simulation", () => {
    renderWithProviders(<BloodBankTransfusionHub />);

    fireEvent.click(screen.getByRole("button", { name: "Pause simulation" }));
    expect(screen.getByRole("button", { name: "Resume simulation" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Resume simulation" }));
    expect(screen.getByRole("button", { name: "Pause simulation" })).toBeInTheDocument();
  });

  it("ages the inventory while the simulation runs", () => {
    renderWithProviders(<BloodBankTransfusionHub />);

    // Thawed plasma unit 920003 is 17 hours into a 24-hour dating period, so it starts with 7 hours
    // of shelf life. Each tick ages the inventory by two hours.
    const row = screen.getByText("W1234 24 920003").closest("tr");
    expect(within(row).getByText("7 h")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(2400 * 3);
    });

    const aged = screen.getByText("W1234 24 920003").closest("tr");
    expect(within(aged).getByText("1 h")).toBeInTheDocument();
    expect(within(aged).getByText("Critical")).toBeInTheDocument();
  });
});
