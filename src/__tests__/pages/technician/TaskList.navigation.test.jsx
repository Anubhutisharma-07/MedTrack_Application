import { screen, fireEvent, waitFor } from "@testing-library/react";
import { it, expect, vi, beforeEach } from "vitest";
import TaskList from "../../../pages/technician/TaskList";
import { getAllTasks } from "../../../services/MaintenanceService";
import { renderWithProviders } from "../../utils/renderWithProviders";

vi.mock("../../../services/MaintenanceService", () => ({
  getAllTasks: vi.fn(),
  updateTask: vi.fn(),
  getTaskById: vi.fn(),
}));

vi.mock("../../../components/common/QrScannerModal", () => ({ default: () => null }));

beforeEach(() => {
  vi.clearAllMocks();
});

it("navigates to update-task with the task ID string, not the whole task object", async () => {
  getAllTasks.mockResolvedValue({
    content: [
      {
        id: "TASK-1001",
        equipment: "MRI Scanner",
        status: "Pending",
        deadline: "2026-09-01",
        equipmentId: "EQ-1",
      },
    ],
    totalPages: 1,
    page: 0,
  });

  const onNavigate = vi.fn();
  renderWithProviders(<TaskList onNavigate={onNavigate} />, {
    authValue: { user: { id: "t1", role: "technician", name: "Tech" } },
  });

  const button = await screen.findByRole("button", { name: "Start Task" });
  fireEvent.click(button);

  await waitFor(() => {
    expect(onNavigate).toHaveBeenCalledWith("update-task", "TASK-1001");
  });

  // Passing the whole object would serialize to /update-task/[object Object] and the
  // task would be lost on reload.
  expect(onNavigate).not.toHaveBeenCalledWith("update-task", expect.any(Object));
});
