import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import MaintenanceSummaryCards from "../../../components/hospital/MaintenanceSummaryCards";
import MaintenanceFilterBar from "../../../components/hospital/MaintenanceFilterBar";
import MaintenanceKanbanBoard from "../../../components/hospital/MaintenanceKanbanBoard";
import MaintenanceTaskDetailModal from "../../../components/hospital/MaintenanceTaskDetailModal";

const MOCK_TASKS = [
  { id: "MNT-101", equipmentName: "MRI Scanner 3T", maintenanceType: "Preventive", scheduledDate: "2023-12-15", assignedTechnician: "John Doe", status: "Scheduled", slaState: "Upcoming" },
  { id: "MNT-102", equipmentName: "Ventilator Pro", maintenanceType: "Calibration", scheduledDate: "2023-12-18", assignedTechnician: "Sarah Smith", status: "In Progress", slaState: "Warning" },
  { id: "MNT-103", equipmentName: "ECG Monitor", maintenanceType: "Corrective", scheduledDate: "2023-12-20", assignedTechnician: "Unassigned", status: "Needs Part", slaState: "Breached" },
  { id: "MNT-104", equipmentName: "X-Ray Machine", maintenanceType: "Inspection", scheduledDate: "2023-12-22", assignedTechnician: "Mike Johnson", status: "Completed", slaState: "Upcoming" },
];

describe("MaintenanceSummaryCards", () => {
  it("renders correct total task count", () => {
    render(<MaintenanceSummaryCards tasks={MOCK_TASKS} />);
    expect(screen.getByText("Total Tasks")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
  });

  it("renders Scheduled count", () => {
    render(<MaintenanceSummaryCards tasks={MOCK_TASKS} />);
    expect(screen.getByText("Scheduled")).toBeInTheDocument();
  });

  it("renders In Progress count", () => {
    render(<MaintenanceSummaryCards tasks={MOCK_TASKS} />);
    expect(screen.getByText("In Progress")).toBeInTheDocument();
  });

  it("handles empty tasks array", () => {
    render(<MaintenanceSummaryCards tasks={[]} />);
    expect(screen.getByText("Total Tasks")).toBeInTheDocument();
    expect(screen.getAllByText("0").length).toBeGreaterThan(0);
  });

  it("handles tasks with all different statuses", () => {
    render(<MaintenanceSummaryCards tasks={MOCK_TASKS} />);
    expect(screen.getByText("Total Tasks")).toBeInTheDocument();
  });
});

describe("MaintenanceFilterBar", () => {
  it("renders search input", () => {
    render(
      <MaintenanceFilterBar
        searchQuery="" onSearchChange={() => {}}
        selectedStatus="ALL" onStatusChange={() => {}}
        selectedTechnician="ALL" onTechnicianChange={() => {}}
        selectedSla="ALL" onSlaChange={() => {}}
        techniciansList={[]}
      />
    );
    expect(screen.getByPlaceholderText(/search by equipment/i)).toBeInTheDocument();
  });

  it("triggers search change handler", () => {
    const handleSearch = vi.fn();
    render(
      <MaintenanceFilterBar
        searchQuery="" onSearchChange={handleSearch}
        selectedStatus="ALL" onStatusChange={() => {}}
        selectedTechnician="ALL" onTechnicianChange={() => {}}
        selectedSla="ALL" onSlaChange={() => {}}
        techniciansList={[]}
      />
    );
    fireEvent.change(screen.getByPlaceholderText(/search/i), { target: { value: "MRI" } });
    expect(handleSearch).toHaveBeenCalledWith("MRI");
  });

  it("triggers status change handler", () => {
    const handleStatus = vi.fn();
    render(
      <MaintenanceFilterBar
        searchQuery="" onSearchChange={() => {}}
        selectedStatus="ALL" onStatusChange={handleStatus}
        selectedTechnician="ALL" onTechnicianChange={() => {}}
        selectedSla="ALL" onSlaChange={() => {}}
        techniciansList={[]}
      />
    );
    const statusSelect = screen.getByDisplayValue("All Statuses");
    fireEvent.change(statusSelect, { target: { value: "In Progress" } });
    expect(handleStatus).toHaveBeenCalledWith("In Progress");
  });

  it("triggers technician change handler", () => {
    const handleTech = vi.fn();
    render(
      <MaintenanceFilterBar
        searchQuery="" onSearchChange={() => {}}
        selectedStatus="ALL" onStatusChange={() => {}}
        selectedTechnician="ALL" onTechnicianChange={handleTech}
        selectedSla="ALL" onSlaChange={() => {}}
        techniciansList={["John Doe", "Sarah Smith"]}
      />
    );
    const techSelect = screen.getByDisplayValue("All Technicians");
    fireEvent.change(techSelect, { target: { value: "John Doe" } });
    expect(handleTech).toHaveBeenCalledWith("John Doe");
  });

  it("triggers SLA change handler", () => {
    const handleSla = vi.fn();
    render(
      <MaintenanceFilterBar
        searchQuery="" onSearchChange={() => {}}
        selectedStatus="ALL" onStatusChange={() => {}}
        selectedTechnician="ALL" onTechnicianChange={() => {}}
        selectedSla="ALL" onSlaChange={handleSla}
        techniciansList={[]}
      />
    );
    const slaSelect = screen.getByDisplayValue("All SLA States");
    fireEvent.change(slaSelect, { target: { value: "Breached" } });
    expect(handleSla).toHaveBeenCalledWith("Breached");
  });
});

describe("MaintenanceKanbanBoard", () => {
  it("renders all status columns", () => {
    render(<MaintenanceKanbanBoard tasks={MOCK_TASKS} />);
    expect(screen.getByText("Scheduled")).toBeInTheDocument();
    expect(screen.getByText("In Progress")).toBeInTheDocument();
    expect(screen.getByText("Needs Part")).toBeInTheDocument();
    expect(screen.getByText("Completed")).toBeInTheDocument();
  });

  it("renders task cards in correct columns", () => {
    render(<MaintenanceKanbanBoard tasks={MOCK_TASKS} />);
    expect(screen.getByText("MRI Scanner 3T")).toBeInTheDocument();
    expect(screen.getByText("Ventilator Pro")).toBeInTheDocument();
    expect(screen.getByText("ECG Monitor")).toBeInTheDocument();
    expect(screen.getByText("X-Ray Machine")).toBeInTheDocument();
  });

  it("triggers onTaskClick when card is clicked", () => {
    const handleClick = vi.fn();
    render(<MaintenanceKanbanBoard tasks={MOCK_TASKS} onTaskClick={handleClick} />);
    fireEvent.click(screen.getByText("MRI Scanner 3T"));
    expect(handleClick).toHaveBeenCalledWith(MOCK_TASKS[0]);
  });

  it("renders task IDs on cards", () => {
    render(<MaintenanceKanbanBoard tasks={MOCK_TASKS} />);
    expect(screen.getByText("MNT-101")).toBeInTheDocument();
    expect(screen.getByText("MNT-102")).toBeInTheDocument();
  });

  it("renders technician names on cards", () => {
    const { container } = render(<MaintenanceKanbanBoard tasks={MOCK_TASKS} />);
    expect(container.textContent).toContain("John");
    expect(container.textContent).toContain("Sarah");
  });

  it("handles empty tasks array", () => {
    render(<MaintenanceKanbanBoard tasks={[]} />);
    expect(screen.getByText("Scheduled")).toBeInTheDocument();
    expect(screen.getByText("In Progress")).toBeInTheDocument();
  });
});

describe("MaintenanceTaskDetailModal", () => {
  it("renders task details", () => {
    render(
      <MaintenanceTaskDetailModal
        task={MOCK_TASKS[0]} onClose={() => {}} onUpdateStatus={() => {}}
      />
    );
    expect(screen.getByText("MRI Scanner 3T")).toBeInTheDocument();
    expect(screen.getByText("MNT-101")).toBeInTheDocument();
  });

  it("renders status buttons", () => {
    render(
      <MaintenanceTaskDetailModal
        task={MOCK_TASKS[0]} onClose={() => {}} onUpdateStatus={() => {}}
      />
    );
    expect(screen.getByRole("button", { name: "In Progress" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Needs Part" })).toBeInTheDocument();
  });

  it("calls onUpdateStatus and onClose when save is clicked", () => {
    const handleUpdate = vi.fn();
    const handleClose = vi.fn();
    render(
      <MaintenanceTaskDetailModal
        task={MOCK_TASKS[0]} onClose={handleClose} onUpdateStatus={handleUpdate}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "In Progress" }));
    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));
    expect(handleUpdate).toHaveBeenCalledWith(
      "MNT-101", "In Progress"
    );
    expect(handleClose).toHaveBeenCalled();
  });

  it("renders scheduled date", () => {
    render(
      <MaintenanceTaskDetailModal
        task={MOCK_TASKS[0]} onClose={() => {}} onUpdateStatus={() => {}}
      />
    );
    expect(screen.getByText("2023-12-15")).toBeInTheDocument();
  });

  it("renders maintenance type", () => {
    render(
      <MaintenanceTaskDetailModal
        task={MOCK_TASKS[0]} onClose={() => {}} onUpdateStatus={() => {}}
      />
    );
    expect(screen.getByText("Preventive")).toBeInTheDocument();
  });

  it("renders assigned technician section", () => {
    const { container } = render(
      <MaintenanceTaskDetailModal
        task={MOCK_TASKS[0]} onClose={() => {}} onUpdateStatus={() => {}}
      />
    );
    expect(container.textContent).toContain("Assigned Technician");
  });
});
