import { screen, fireEvent, waitFor } from "@testing-library/react";
import { it, expect, vi, beforeEach } from "vitest";
import ProcurementRequestWizard from "../../../pages/hospital/ProcurementRequestWizard";
import { createProcurementRequest } from "../../../services/ProcurementService";
import { renderWithProviders } from "../../utils/renderWithProviders";

vi.mock("../../../services/ProcurementService", () => ({
  createProcurementRequest: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

it("navigates to the request lifecycle timeline with the created request id after submit", async () => {
  createProcurementRequest.mockResolvedValue({ id: 42 });

  const onNavigate = vi.fn();
  renderWithProviders(<ProcurementRequestWizard onNavigate={onNavigate} />);

  // Step 1 - details (inputs are not label-associated, so query by placeholder / role)
  fireEvent.change(screen.getByPlaceholderText("e.g., MRI-3T-001"), { target: { value: "EQ-NEW-001" } });
  fireEvent.change(screen.getByPlaceholderText("e.g., 3T MRI Scanner"), { target: { value: "Portable X-Ray" } });
  fireEvent.change(screen.getAllByRole("spinbutton")[0], { target: { value: "2" } });
  fireEvent.change(screen.getAllByRole("spinbutton")[1], { target: { value: "15000" } });
  fireEvent.click(screen.getByRole("button", { name: "Next" }));

  // Step 2 - approval policy (category required)
  fireEvent.change(screen.getAllByRole("combobox")[1], { target: { value: "IMAGING" } });
  fireEvent.click(screen.getByRole("button", { name: "Next" }));

  // Step 3 - review & submit
  fireEvent.click(screen.getByRole("button", { name: "Submit Request" }));

  await waitFor(() => {
    expect(onNavigate).toHaveBeenCalledWith("procurement-timeline", 42);
  });

  // The request id must be passed as the route data so the timeline can fetch by it.
  expect(onNavigate).not.toHaveBeenCalledWith("dashboard", expect.anything());
});
