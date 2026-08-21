import { screen, fireEvent, waitFor } from "@testing-library/react";
import { it, expect, vi, beforeEach } from "vitest";
import OrdersList from "../../../pages/supplier/OrdersList";
import { getAllOrders, getSupplierMetrics } from "../../../services/OrderService";
import { renderWithProviders } from "../../utils/renderWithProviders";

vi.mock("../../../services/OrderService", () => ({
  getAllOrders: vi.fn(),
  updateOrderStatus: vi.fn(),
  getSupplierMetrics: vi.fn(),
}));

vi.mock("../../../pages/supplier/InvoiceModal", () => ({ default: () => null }));

beforeEach(() => {
  vi.clearAllMocks();
});

it("navigates to orderstatus with the order ID string, not the whole order object", async () => {
  getAllOrders.mockResolvedValue({
    content: [
      {
        id: "ORD-2001",
        hospital: "City Central Hospital",
        price: "$1,250",
        orderedDate: "2026-08-01",
        trackingNo: "TRK-77",
      },
    ],
    totalPages: 1,
    page: 0,
  });
  getSupplierMetrics.mockResolvedValue({});

  const onNavigate = vi.fn();
  renderWithProviders(<OrdersList onNavigate={onNavigate} />, {
    authValue: { user: { id: "s1", role: "supplier", name: "Sup" } },
  });

  const button = await screen.findByRole("button", { name: "Track Order" });
  fireEvent.click(button);

  await waitFor(() => {
    expect(onNavigate).toHaveBeenCalledWith("orderstatus", "ORD-2001");
  });

  // Passing the whole object would serialize to /orderstatus/[object Object] and the
  // order would be lost on reload.
  expect(onNavigate).not.toHaveBeenCalledWith("orderstatus", expect.any(Object));
});
