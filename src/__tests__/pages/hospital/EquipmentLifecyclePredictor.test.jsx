import { screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import { renderWithProviders } from "../../utils/renderWithProviders";
import EquipmentLifecyclePredictor from "../../../pages/hospital/EquipmentLifecyclePredictor";

describe("EquipmentLifecyclePredictor Component", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("renders header and main KPI cards", () => {
    renderWithProviders(<EquipmentLifecyclePredictor onNavigate={() => {}} />);

    expect(screen.getByText("Equipment Lifecycle & Predictive Failure Analytics")).toBeInTheDocument();
    expect(screen.getByText("Monitored Fleet")).toBeInTheDocument();
    expect(screen.getByText("Replacement Due")).toBeInTheDocument();
    expect(screen.getByText("Fleet Health Index")).toBeInTheDocument();
    expect(screen.getByText("Est. CapEx Needed")).toBeInTheDocument();
  });

  it("filters fleet items by search input", () => {
    renderWithProviders(<EquipmentLifecyclePredictor onNavigate={() => {}} />);

    const searchInput = screen.getByPlaceholderText(/Search by equipment name/i);
    fireEvent.change(searchInput, { target: { value: "MRI Scanner" } });

    expect(screen.getByText("MRI Scanner 3T Signature")).toBeInTheDocument();
    expect(screen.queryByText("Ventilator Servo-U ICU")).not.toBeInTheDocument();
  });

  it("filters fleet items by risk tier selector", () => {
    renderWithProviders(<EquipmentLifecyclePredictor onNavigate={() => {}} />);

    const riskSelect = screen.getByDisplayValue("All Risk Tiers");
    fireEvent.change(riskSelect, { target: { value: "CRITICAL" } });

    expect(screen.getByText("CT Scanner Revolution 128-Slice")).toBeInTheDocument();
    expect(screen.queryByText("Patient Monitor IntelliVue MX800")).not.toBeInTheDocument();
  });

  it("opens asset modal when Inspect button is clicked", () => {
    renderWithProviders(<EquipmentLifecyclePredictor onNavigate={() => {}} />);

    const inspectButtons = screen.getAllByText(/Inspect/i);
    fireEvent.click(inspectButtons[0]);

    expect(screen.getByText("AI Recommendation")).toBeInTheDocument();
    expect(screen.getByText("Requisition Replacement")).toBeInTheDocument();
  });
});
