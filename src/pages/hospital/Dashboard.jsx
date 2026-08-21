import React, { useState, useEffect, useMemo, useDeferredValue } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getAllEquipment } from '../../services/EquipmentService';
import { getAllTasks } from '../../services/MaintenanceService';
import { computeEquipmentHealthScore } from '../../services/AnalyticsService';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import {
  LayoutGrid, Users, Settings, HelpCircle, Clock3, CheckCircle2, Download,
  Box, ClipboardList, LineChart, Mail, Workflow, Puzzle, MessageCircle, ChevronsUpDown,
  Bot, Bell, Search, Share2, RefreshCw, Award, Wrench, AlertTriangle, MoreHorizontal, ShieldAlert
} from 'lucide-react';
import MedTrackLogo from '../../components/common/MedTrackLogo';

// ---------------------------------------------------------------------------
// Presentation metadata
//
// Status strings arrive from the API in several shapes (OPERATIONAL, "Needs
// Maintenance", under_maintenance, ...). Everything below keys off a normalised
// statusKey instead, so one lookup table drives the badge, the filter and the chart.
// ---------------------------------------------------------------------------

const EQUIPMENT_FILTERS = [
  { id: "all", label: "All Assets" },
  { id: "operational", label: "Operational" },
  { id: "attention", label: "Needs Attention" },
  { id: "maintenance", label: "In Maintenance" },
  { id: "retired", label: "Retired" },
];

const EQUIPMENT_STATUS_META = {
  operational: {
    label: "Operational",
    badgeClass: "bg-emerald-100 text-emerald-700",
    className: "bg-emerald-100 text-emerald-700",
  },
  attention: {
    label: "Needs Attention",
    badgeClass: "bg-amber-100 text-amber-700",
    className: "bg-amber-100 text-amber-700",
  },
  maintenance: {
    label: "In Maintenance",
    badgeClass: "bg-blue-100 text-blue-700",
    className: "bg-blue-100 text-blue-700",
  },
  retired: {
    label: "Retired",
    badgeClass: "bg-slate-200 text-slate-600",
    className: "bg-slate-200 text-slate-600",
  },
};

const WARRANTY_META = {
  active: { label: "Warranty Active", className: "text-emerald-600" },
  expiring: { label: "Warranty Expiring Soon", className: "text-amber-600" },
  expired: { label: "Warranty Expired", className: "text-rose-600" },
  none: { label: "No Warranty On Record", className: "text-slate-500" },
};

const TASK_STATUS_META = {
  scheduled: { label: "Scheduled", className: "bg-slate-200 text-slate-700" },
  in_progress: { label: "In Progress", className: "bg-blue-100 text-blue-700" },
  blocked: { label: "Blocked", className: "bg-amber-100 text-amber-700" },
  completed: { label: "Completed", className: "bg-emerald-100 text-emerald-700" },
};

// Seeded rows for the demo workspace, so a reviewer signing in with a demo account sees a
// populated dashboard rather than four empty panels.
const DASHBOARD_DEMO_EQUIPMENT = [
  {
    id: "demo-eq-1",
    equipmentCode: "EQ-1043",
    name: "Ventilator V60",
    model: "Philips V60",
    department: "ICU",
    status: "OPERATIONAL",
    warrantyExpiry: "2027-04-18",
    lastMaintenanceDate: "2026-06-02",
  },
  {
    id: "demo-eq-2",
    equipmentCode: "EQ-2210",
    name: "Infusion Pump",
    model: "BD Alaris 8100",
    department: "Oncology",
    status: "NEEDS_MAINTENANCE",
    warrantyExpiry: "2026-09-30",
    lastMaintenanceDate: "2026-01-19",
  },
  {
    id: "demo-eq-3",
    equipmentCode: "EQ-3387",
    name: "Portable X-Ray",
    model: "GE AMX 240",
    department: "Radiology",
    status: "UNDER_MAINTENANCE",
    warrantyExpiry: "2026-08-11",
    lastMaintenanceDate: "2026-07-21",
  },
  {
    id: "demo-eq-4",
    equipmentCode: "EQ-4512",
    name: "Patient Monitor",
    model: "Mindray uMEC12",
    department: "Emergency",
    status: "OPERATIONAL",
    warrantyExpiry: "2028-02-05",
    lastMaintenanceDate: "2026-05-14",
  },
  {
    id: "demo-eq-5",
    equipmentCode: "EQ-5560",
    name: "Defibrillator",
    model: "Zoll R Series",
    department: "Emergency",
    status: "RETIRED",
    warrantyExpiry: "2024-03-01",
    lastMaintenanceDate: "2025-11-08",
  },
];

const DASHBOARD_DEMO_TASKS = [
  {
    id: "demo-task-1",
    taskCode: "MNT-7781",
    maintenanceType: "Calibration",
    equipment: "Infusion Pump",
    assignedTechnician: "rita@medtrack.com",
    priority: "High",
    status: "SCHEDULED",
    deadline: "2026-08-04",
  },
  {
    id: "demo-task-2",
    taskCode: "MNT-7782",
    maintenanceType: "Preventive service",
    equipment: "Portable X-Ray",
    assignedTechnician: "dev@medtrack.com",
    priority: "Critical",
    status: "IN_PROGRESS",
    deadline: "2026-08-12",
  },
  {
    id: "demo-task-3",
    taskCode: "MNT-7783",
    maintenanceType: "Battery replacement",
    equipment: "Patient Monitor",
    assignedTechnician: "sam@medtrack.com",
    priority: "Medium",
    status: "COMPLETED",
    deadline: "2026-07-28",
  },
];

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const WARRANTY_EXPIRING_WINDOW_DAYS = 60;
const TASK_DUE_SOON_WINDOW_DAYS = 7;

/**
 * Pulls the rows out of whatever the API returned.
 *
 * The equipment and maintenance endpoints were paginated at different times, so depending on the
 * deployment a caller sees a bare array, a Spring `Page` ({content: [...]}) or an envelope
 * ({data: [...]}, {items: [...]}). Reading `.length` off the wrong one silently renders an empty
 * dashboard, so every shape is unwrapped here in one place.
 */
function unwrapCollection(payload) {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];
  if (Array.isArray(payload.content)) return payload.content;
  if (Array.isArray(payload.items)) return payload.items;
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.results)) return payload.results;
  return [];
}

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Parses a value the API may send as a date-only string or a full timestamp.
 *
 * `new Date("2026-08-09")` is midnight *UTC*, which is the previous calendar day everywhere west
 * of Greenwich and shifts the whole day forward east of it. A deadline has no time of day, so a
 * date-only string is anchored to local midnight and compared as a calendar date.
 */
function toDate(value) {
  if (!value) return null;

  if (typeof value === "string" && DATE_ONLY_PATTERN.test(value.trim())) {
    const [year, month, day] = value.trim().split("-").map(Number);
    return new Date(year, month - 1, day);
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Whole calendar days between two dates. Both ends are floored to local midnight first, so "due
 * tomorrow" does not become "due today" simply because the page was opened in the evening.
 */
function daysBetween(from, to) {
  if (!from || !to) return null;

  const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  return Math.round((startOfDay(to) - startOfDay(from)) / DAY_IN_MS);
}

const RETIRED_STATUSES = new Set(["RETIRED", "DISPOSED", "DECOMMISSIONED"]);
const MAINTENANCE_STATUSES = new Set(["UNDER_MAINTENANCE", "MAINTENANCE", "IN_MAINTENANCE", "SERVICING"]);
const ATTENTION_STATUSES = new Set([
  "NEEDS_MAINTENANCE",
  "NEEDS_ATTENTION",
  "OUT_OF_SERVICE",
  "FAULTY",
  "BROKEN",
]);

function normalizeStatusKey(rawStatus) {
  const status = String(rawStatus || "").trim().toUpperCase().replace(/[\s-]+/g, "_");

  if (RETIRED_STATUSES.has(status)) return "retired";
  if (MAINTENANCE_STATUSES.has(status)) return "maintenance";
  if (ATTENTION_STATUSES.has(status)) return "attention";
  return "operational";
}

/**
 * Warranty band for an asset.
 *
 * The API sends `warrantyStatus` on some payloads and only a `warrantyExpiry` date on others, so
 * an explicit status is trusted when present and the date is used to derive one when it is not.
 */
function normalizeWarrantyKey(warrantyStatus, warrantyExpiry, today) {
  const declared = String(warrantyStatus || "").trim().toUpperCase().replace(/[\s-]+/g, "_");
  if (declared === "EXPIRED") return "expired";
  if (declared === "EXPIRING_SOON" || declared === "EXPIRING") return "expiring";
  if (declared === "ACTIVE" || declared === "VALID") return "active";

  const expiry = toDate(warrantyExpiry);
  if (!expiry) return "none";

  const remaining = daysBetween(today, expiry);
  if (remaining === null) return "none";
  if (remaining < 0) return "expired";
  if (remaining <= WARRANTY_EXPIRING_WINDOW_DAYS) return "expiring";
  return "active";
}

/**
 * Maps one equipment row onto the shape the dashboard renders. Returns null for a row with no
 * identity so a malformed record drops out instead of rendering a blank card.
 */
function normalizeEquipmentItem(raw, index = 0) {
  if (!raw || typeof raw !== "object") return null;

  const id = raw.id ?? raw.equipmentId ?? raw.equipmentCode ?? null;
  if (id === null || id === undefined) return null;

  const today = new Date();
  const statusKey = normalizeStatusKey(raw.status);
  const warrantyKey = normalizeWarrantyKey(
    raw.warrantyStatus,
    raw.warrantyExpiry ?? raw.warrantyExpiryDate,
    today,
  );
  const health = computeEquipmentHealthScore(raw);

  return {
    id: String(id),
    key: `${id}-${index}`,
    name: raw.name || "Unnamed asset",
    code: raw.equipmentCode || raw.code || "-",
    model: raw.model || raw.manufacturer || "-",
    department: raw.department || "Unassigned",
    statusKey,
    statusLabel: EQUIPMENT_STATUS_META[statusKey].label,
    warrantyKey,
    warrantyLabel: WARRANTY_META[warrantyKey].label,
    lastMaintenanceDate: raw.lastMaintenanceDate || raw.lastServicedAt || null,
    healthScore: health ? health.score : null,
    healthColor: health ? health.color : null,
  };
}

function normalizeTaskStatusKey(rawStatus) {
  const status = String(rawStatus || "").trim().toUpperCase().replace(/[\s-]+/g, "_");

  if (status === "COMPLETED") return "completed";
  if (status === "IN_PROGRESS") return "in_progress";
  if (status === "NEEDS_PART" || status === "ON_HOLD" || status === "BLOCKED") return "blocked";
  return "scheduled";
}

/**
 * Maps one maintenance task onto the queue row. `dueState` is derived here rather than at render
 * time so the sort and the colour of the due date always agree.
 */
function normalizeTaskItem(raw, index = 0) {
  if (!raw || typeof raw !== "object") return null;

  const id = raw.id ?? raw.taskId ?? raw.taskCode ?? null;
  if (id === null || id === undefined) return null;

  const statusKey = normalizeTaskStatusKey(raw.status);
  const dueDate = raw.deadline || raw.dueDate || raw.scheduledDate || null;
  const remaining = daysBetween(new Date(), toDate(dueDate));

  let dueState = "normal";
  if (statusKey !== "completed" && remaining !== null) {
    if (remaining < 0) {
      dueState = "overdue";
    } else if (remaining <= TASK_DUE_SOON_WINDOW_DAYS) {
      dueState = "soon";
    }
  }

  return {
    id: String(id),
    key: `${id}-${index}`,
    taskCode: raw.taskCode || `TASK-${id}`,
    // The queue heading is the human description of the work; the maintenance type is the
    // fallback for rows that only carry a category.
    title: raw.title || raw.description || raw.maintenanceType || "Maintenance task",
    equipmentName: raw.equipment || raw.equipmentName || "Unassigned equipment",
    assignedTechnician: raw.assignedTechnician || "Unassigned",
    priority: raw.priority || "Normal",
    statusKey,
    statusLabel: TASK_STATUS_META[statusKey].label,
    dueDate,
    dueState,
  };
}

/** Operational / attention / maintenance counts per department, busiest department first. */
function buildDepartmentChartData(equipmentList) {
  const byDepartment = new Map();

  equipmentList.forEach((item) => {
    const department = item.department || "Unassigned";
    if (!byDepartment.has(department)) {
      byDepartment.set(department, { department, operational: 0, attention: 0, maintenance: 0, total: 0 });
    }

    const bucket = byDepartment.get(department);
    // Retired assets are counted in the department total but are not a readiness signal.
    if (item.statusKey === "operational") bucket.operational += 1;
    if (item.statusKey === "attention") bucket.attention += 1;
    if (item.statusKey === "maintenance") bucket.maintenance += 1;
    bucket.total += 1;
  });

  return Array.from(byDepartment.values())
    .sort((left, right) => right.total - left.total)
    .slice(0, 6);
}

function formatDateLabel(value) {
  const parsed = toDate(value);
  if (!parsed) return "No service on record";
  return `Serviced ${parsed.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}`;
}

function formatRelativeLabel(value) {
  const parsed = toDate(value);
  if (!parsed) return "No due date";

  const remaining = daysBetween(new Date(), parsed);
  if (remaining === null) return "No due date";
  if (remaining === 0) return "Due today";
  if (remaining === 1) return "Due tomorrow";
  if (remaining > 0) return `Due in ${remaining} days`;
  if (remaining === -1) return "1 day overdue";
  return `${Math.abs(remaining)} days overdue`;
}

// ---------------------------------------------------------------------------
// Presentational building blocks
// ---------------------------------------------------------------------------

function SidebarNavButton({ icon: Icon, label, onClick, active = false }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-4 px-4 py-2.5 text-sm rounded-xl transition-colors ${
        active
          ? "font-bold text-gray-900 bg-white shadow-sm border border-gray-100"
          : "font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50"
      }`}
    >
      <Icon size={18} className={active ? "text-gray-900" : ""} />
      {label}
    </button>
  );
}

const STAT_CARD_TONES = {
  blue: "bg-blue-50 text-blue-600",
  amber: "bg-amber-50 text-amber-600",
  rose: "bg-rose-50 text-rose-600",
  emerald: "bg-emerald-50 text-emerald-600",
};

function StatCard({ title, value, subtitle, delta, tone = "blue", icon: Icon }) {
  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">{title}</p>
        <span className={`w-9 h-9 rounded-2xl flex items-center justify-center ${STAT_CARD_TONES[tone] || STAT_CARD_TONES.blue}`}>
          <Icon size={18} />
        </span>
      </div>
      <p className="mt-4 text-3xl font-bold text-slate-900">{value}</p>
      <p className="mt-2 text-sm text-slate-500">{subtitle}</p>
      {delta ? <p className="mt-3 text-xs font-semibold text-slate-400">{delta}</p> : null}
    </div>
  );
}

function Panel({ title, subtitle, actions, children }) {
  return (
    <section className="rounded-[32px] border border-slate-100 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between mb-5">
        <div>
          <h2 className="text-xl font-bold text-slate-900">{title}</h2>
          {subtitle ? <p className="mt-1 text-sm text-slate-500 max-w-2xl">{subtitle}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
      {children}
    </section>
  );
}

export default function Dashboard({ onNavigate }) {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [equipmentList, setEquipmentList] = useState([]);
  const [tasksList, setTasksList] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [dashboardNotice, setDashboardNotice] = useState("");
  const [lastUpdatedLabel, setLastUpdatedLabel] = useState("Just now");
  const [isBotOpen, setIsBotOpen] = useState(false);

  const deferredSearch = useDeferredValue(searchQuery);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async ({ silent = false } = {}) => {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      if (user?.id?.startsWith("demo-")) {
        setEquipmentList(DASHBOARD_DEMO_EQUIPMENT.map(normalizeEquipmentItem).filter(Boolean));
        setTasksList(DASHBOARD_DEMO_TASKS.map(normalizeTaskItem).filter(Boolean));
        setDashboardNotice("Demo workspace is showing seeded operational data.");
        setLastUpdatedLabel("Moments ago");
        return;
      }

      const [equipmentResult, tasksResult] = await Promise.allSettled([
        getAllEquipment(0, 50),
        getAllTasks({ page: 0, size: 12 }),
      ]);

      const nextEquipment =
        equipmentResult.status === "fulfilled"
          ? unwrapCollection(equipmentResult.value).map(normalizeEquipmentItem).filter(Boolean)
          : [];
      const nextTasks =
        tasksResult.status === "fulfilled"
          ? unwrapCollection(tasksResult.value).map(normalizeTaskItem).filter(Boolean)
          : [];

      setEquipmentList(nextEquipment);
      setTasksList(nextTasks);

      if (equipmentResult.status === "rejected" && tasksResult.status === "rejected") {
        setDashboardNotice("Live dashboard data is temporarily unavailable. The screen is ready, but upstream data sources failed to respond.");
      } else if (equipmentResult.status === "rejected") {
        setDashboardNotice("Equipment inventory could not be refreshed, but maintenance data is still available.");
      } else if (tasksResult.status === "rejected") {
        setDashboardNotice("Maintenance backlog could not be refreshed, but inventory data is still available.");
      } else {
        setDashboardNotice("");
      }

      setLastUpdatedLabel(new Date().toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      }));
    } catch (error) {
      console.error("Dashboard data fetch failed:", error);
      setDashboardNotice("Dashboard refresh failed. Please try again in a moment.");
      setEquipmentList([]);
      setTasksList([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filteredEquipment = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase();
    return equipmentList.filter((item) => {
      const matchesFilter = statusFilter === "all" || item.statusKey === statusFilter;
      const matchesSearch =
        !query ||
        item.name.toLowerCase().includes(query) ||
        item.code.toLowerCase().includes(query) ||
        item.model.toLowerCase().includes(query) ||
        item.department.toLowerCase().includes(query);

      return matchesFilter && matchesSearch;
    });
  }, [deferredSearch, equipmentList, statusFilter]);

  const featuredEquipment = useMemo(
    () =>
      [...filteredEquipment].sort((left, right) => {
        const priorityRank = { attention: 0, maintenance: 1, operational: 2, retired: 3 };
        return (priorityRank[left.statusKey] ?? 99) - (priorityRank[right.statusKey] ?? 99);
      }).slice(0, 6),
    [filteredEquipment],
  );

  const prioritizedTasks = useMemo(
    () =>
      [...tasksList].sort((left, right) => {
        const rank = { overdue: 0, soon: 1, normal: 2 };
        const dueRank = (rank[left.dueState] ?? 9) - (rank[right.dueState] ?? 9);
        if (dueRank !== 0) return dueRank;
        return new Date(left.dueDate || "2100-01-01") - new Date(right.dueDate || "2100-01-01");
      }),
    [tasksList],
  );

  const overview = useMemo(() => {
    const operational = equipmentList.filter((item) => item.statusKey === "operational").length;
    const attention = equipmentList.filter((item) => item.statusKey === "attention").length;
    const maintenance = equipmentList.filter((item) => item.statusKey === "maintenance").length;
    const overdueTasks = tasksList.filter((item) => item.dueState === "overdue").length;
    const completionRate = tasksList.length
      ? Math.round((tasksList.filter((item) => item.statusKey === "completed").length / tasksList.length) * 100)
      : 0;

    return {
      operational,
      attention,
      maintenance,
      overdueTasks,
      completionRate,
    };
  }, [equipmentList, tasksList]);

  const departmentChartData = useMemo(() => buildDepartmentChartData(equipmentList), [equipmentList]);

  const topAttentionAssets = useMemo(
    () => equipmentList.filter((item) => item.statusKey !== "operational").slice(0, 4),
    [equipmentList],
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f7fb] flex items-center justify-center font-sans">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-white font-sans text-gray-900 overflow-hidden">

      {/* COLUMN 1: LEFT SIDEBAR */}
      <aside className="w-[260px] flex flex-col justify-between p-6 border-r border-gray-100 shrink-0 bg-[#fbfbfb]">
        <div className="flex-1 overflow-y-auto pr-2">

          {/* Logo */}
          <div className="mb-10 px-2 pt-2">
            <MedTrackLogo size="text-2xl" />
          </div>

          <nav className="space-y-1">
            <SidebarNavButton active icon={LayoutGrid} label="Dashboard" onClick={() => onNavigate?.("dashboard")} />
            <SidebarNavButton icon={Box} label="Equipment" onClick={() => onNavigate?.("equipment")} />
            <SidebarNavButton icon={ClipboardList} label="Maintenance" onClick={() => onNavigate?.("maintenance")} />
            <SidebarNavButton icon={Award} label="Calibration & Compliance" onClick={() => onNavigate?.("calibration")} />
            <SidebarNavButton icon={Users} label="Staff (SCIM)" onClick={() => onNavigate?.("scim-provisioning")} />
            <SidebarNavButton icon={LineChart} label="Analytics" onClick={() => onNavigate?.("analytics")} />

            <div className="my-4 border-t border-gray-100"></div>

            <div className="px-3 mb-2 text-xs font-semibold text-blue-500 uppercase tracking-wider">Research</div>
            <SidebarNavButton icon={ShieldAlert} label="Behavior Analytics Simulator" onClick={() => onNavigate?.("risk-dashboard")} />

            <div className="my-4 border-t border-gray-100"></div>

            <SidebarNavButton icon={Mail} label="Notifications" onClick={() => onNavigate?.("security-commandcenter")} />
            <SidebarNavButton icon={Workflow} label="Workflows (SOAR)" onClick={() => onNavigate?.("soar-security")} />
            <SidebarNavButton icon={Puzzle} label="Integrations (SSO)" onClick={() => onNavigate?.("sso-security")} />

            <div className="my-4 border-t border-gray-100"></div>

            <SidebarNavButton icon={HelpCircle} label="Help Center" onClick={() => onNavigate?.("help")} />
            <SidebarNavButton icon={MessageCircle} label="Feedback" onClick={() => onNavigate?.("help")} />
            <SidebarNavButton icon={Settings} label="Settings" onClick={() => onNavigate?.("authority-security")} />
          </nav>
        </div>

        <div className="mt-6">
          <button
            onClick={logout}
            className="w-full p-3 bg-white border border-gray-100 rounded-2xl flex items-center justify-between shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-3">
              <img
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || "Demo"}`}
                className="w-10 h-10 rounded-full bg-gray-50"
                alt="Avatar"
              />
              <div className="text-left">
                <p className="text-xs font-bold text-gray-900">{user?.name || "Demo Admin"}</p>
                <p className="text-[10px] text-gray-400 font-medium">{user?.email || "admin@medtrack.com"}</p>
              </div>
            </div>
            <ChevronsUpDown size={14} className="text-gray-400" />
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto px-8 py-8 min-w-0">
        <header className="mb-8">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-500 border border-slate-200">
                <Bell size={12} />
                Operational command center
              </div>
              <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900">Hospital operations dashboard</h1>
              <p className="mt-2 text-sm text-slate-500 max-w-2xl">
                Live inventory health, maintenance urgency, and department readiness in one place.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-500">
                Last updated {lastUpdatedLabel}
              </div>
              <button
                onClick={() => fetchDashboardData({ silent: true })}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
                {refreshing ? "Refreshing..." : "Refresh"}
              </button>
              <button className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
                <Share2 size={16} />
                Share
              </button>
              <button className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-black transition-colors">
                <Download size={16} />
                Export snapshot
              </button>
            </div>
          </div>

          {dashboardNotice ? (
            <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800 flex items-start gap-3">
              <AlertTriangle size={18} className="mt-0.5 shrink-0" />
              <span>{dashboardNotice}</span>
            </div>
          ) : null}
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="Tracked assets"
            value={equipmentList.length}
            subtitle={`${overview.operational} operating normally right now`}
            delta={equipmentList.length ? "Live inventory synced" : null}
            tone="blue"
            icon={Box}
          />
          <StatCard
            title="Needs attention"
            value={overview.attention}
            subtitle="Assets likely to require near-term intervention"
            delta={overview.attention ? "Immediate review recommended" : null}
            tone={overview.attention ? "amber" : "emerald"}
            icon={AlertTriangle}
          />
          <StatCard
            title="In maintenance"
            value={overview.maintenance}
            subtitle={`${tasksList.length} maintenance tasks currently tracked`}
            delta={overview.maintenance ? "Workorders active" : null}
            tone="blue"
            icon={Wrench}
          />
          <StatCard
            title="Task completion"
            value={`${overview.completionRate}%`}
            subtitle={`${overview.overdueTasks} overdue task${overview.overdueTasks === 1 ? "" : "s"} need follow-up`}
            delta={tasksList.length ? "Based on live backlog" : null}
            tone={overview.overdueTasks ? "rose" : "emerald"}
            icon={CheckCircle2}
          />
        </div>

        <Panel
          title="Equipment watchlist"
          subtitle="The equipment panel now renders inventory data directly instead of accidentally reusing task rows."
          actions={
            <>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search by name, code, model, or department"
                  className="w-[280px] max-w-full rounded-2xl border border-slate-200 bg-slate-50 pl-9 pr-4 py-2 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                />
              </div>
              {EQUIPMENT_FILTERS.map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setStatusFilter(filter.id)}
                  className={`rounded-full px-3 py-2 text-xs font-bold transition-colors ${
                    statusFilter === filter.id
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </>
          }
        >
          {featuredEquipment.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center">
              <p className="text-lg font-bold text-slate-900">No equipment matches the current watchlist filters.</p>
              <p className="mt-2 text-sm text-slate-500">Try clearing the search or switching back to All Assets.</p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("all");
                }}
                className="mt-4 rounded-2xl bg-slate-900 px-4 py-2 text-sm font-bold text-white"
              >
                Reset watchlist
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {featuredEquipment.map((item) => {
                const statusMeta = EQUIPMENT_STATUS_META[item.statusKey] || EQUIPMENT_STATUS_META.operational;
                const warrantyMeta = WARRANTY_META[item.warrantyKey] || WARRANTY_META.none;
                const healthClass =
                  item.healthColor === "red"
                    ? "bg-rose-500"
                    : item.healthColor === "amber"
                      ? "bg-amber-500"
                      : "bg-emerald-500";

                return (
                  <div key={item.key} className="rounded-3xl border border-slate-100 bg-slate-50/70 px-5 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-10 h-10 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-700 shrink-0">
                          <Box size={18} />
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-900 truncate">{item.name}</p>
                          <p className="mt-0.5 text-xs text-slate-500 truncate">
                            {item.code} • {item.model}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {item.healthScore !== null ? (
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold text-white ${healthClass}`}>
                            {item.healthScore}
                          </span>
                        ) : null}
                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${statusMeta.badgeClass}`}>
                          {item.statusLabel}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-3 text-xs font-medium">
                      <span className="text-slate-500">{item.department}</span>
                      <span className={warrantyMeta.className}>{warrantyMeta.label}</span>
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-3">
                      <span className="text-xs text-slate-400">{formatDateLabel(item.lastMaintenanceDate)}</span>
                      <button
                        onClick={() => onNavigate?.("equipment")}
                        className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-md transition-colors"
                        aria-label={`Open ${item.name}`}
                      >
                        <MoreHorizontal size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Panel>

        <div className="grid grid-cols-1 2xl:grid-cols-[1.5fr_1fr] gap-6 mt-8">
          <Panel
            title="Maintenance queue"
            subtitle="Highest urgency work orders are prioritized first, even when the API returns paginated payloads."
            actions={
              <button
                onClick={() => onNavigate?.("maintenance")}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Open maintenance board
              </button>
            }
          >
            {prioritizedTasks.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center">
                <p className="text-lg font-bold text-slate-900">No maintenance tasks are currently available.</p>
                <p className="mt-2 text-sm text-slate-500">Create a task from the maintenance module to populate this queue.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {prioritizedTasks.map((task) => {
                  const statusMeta = TASK_STATUS_META[task.statusKey] || TASK_STATUS_META.scheduled;
                  const dueTone =
                    task.dueState === "overdue"
                      ? "text-rose-600"
                      : task.dueState === "soon"
                        ? "text-amber-600"
                        : "text-slate-500";

                  return (
                    <div
                      key={task.key}
                      className="rounded-3xl border border-slate-100 bg-slate-50/70 px-4 py-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">{task.taskCode}</span>
                          <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${statusMeta.className}`}>
                            {task.statusLabel}
                          </span>
                        </div>
                        <h3 className="mt-2 text-lg font-bold text-slate-900">{task.title}</h3>
                        <p className="mt-1 text-sm text-slate-500">
                          {task.equipmentName} • {task.assignedTechnician}
                        </p>
                      </div>

                      <div className="flex items-center gap-6 flex-wrap">
                        <div>
                          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400 font-bold">Priority</p>
                          <p className="mt-1 text-sm font-bold text-slate-900">{task.priority}</p>
                        </div>
                        <div>
                          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400 font-bold">Due date</p>
                          <p className={`mt-1 text-sm font-bold ${dueTone}`}>{formatRelativeLabel(task.dueDate)}</p>
                        </div>
                        <button
                          onClick={() => onNavigate?.("maintenance")}
                          className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-black transition-colors"
                        >
                          Review task
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Panel>

          <div className="space-y-6">
            <Panel title="Department readiness" subtitle="Operational versus disrupted equipment by department.">
              {departmentChartData.length === 0 ? (
                <div className="h-[280px] rounded-3xl border border-dashed border-slate-200 bg-slate-50 flex items-center justify-center text-sm font-medium text-slate-500">
                  Department readiness will appear once equipment data is available.
                </div>
              ) : (
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={departmentChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="department" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#64748b" }} />
                      <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#64748b" }} />
                      <Tooltip
                        cursor={{ fill: "#f8fafc" }}
                        contentStyle={{ borderRadius: "16px", border: "1px solid #e2e8f0", backgroundColor: "#ffffff" }}
                      />
                      <Bar dataKey="operational" fill="#10b981" radius={[8, 8, 0, 0]} />
                      <Bar dataKey="attention" fill="#f59e0b" radius={[8, 8, 0, 0]} />
                      <Bar dataKey="maintenance" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Panel>

            <Panel title="Intervention shortlist" subtitle="Assets that should be reviewed first based on current dashboard state.">
              {topAttentionAssets.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-center">
                  <p className="text-sm font-semibold text-slate-600">No high-risk assets in the current snapshot.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {topAttentionAssets.map((item) => (
                    <div key={item.key} className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-bold text-slate-900">{item.name}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            {item.department} • {item.code}
                          </p>
                        </div>
                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${(EQUIPMENT_STATUS_META[item.statusKey] || EQUIPMENT_STATUS_META.operational).badgeClass}`}>
                          {item.statusLabel}
                        </span>
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-3 text-xs font-medium text-slate-500">
                        <span>{item.warrantyLabel}</span>
                        <span>{formatDateLabel(item.lastMaintenanceDate)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Panel>
          </div>
        </div>
      </main>

      {isBotOpen ? (
        <aside className="w-[340px] flex flex-col p-7 border-l border-gray-100 shrink-0 bg-white relative overflow-y-auto">
          <button
            onClick={() => setIsBotOpen(false)}
            className="absolute top-4 right-4 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
          >
            Close
          </button>

          <div className="rounded-[32px] bg-slate-50 p-7 text-center border border-slate-100">
            <div className="mx-auto w-16 h-16 rounded-full bg-slate-900 text-white flex items-center justify-center">
              <Bot size={28} />
            </div>
            <h3 className="mt-4 text-lg font-bold text-slate-900">MedTrack Assistant</h3>
            <p className="mt-1 text-sm text-slate-500">Daily operational briefing for hospital admins.</p>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-emerald-50 p-4 border border-emerald-100">
              <p className="text-xs uppercase tracking-[0.18em] text-emerald-600 font-bold">Stable assets</p>
              <p className="mt-2 text-2xl font-bold text-emerald-900">{overview.operational}</p>
            </div>
            <div className="rounded-2xl bg-amber-50 p-4 border border-amber-100">
              <p className="text-xs uppercase tracking-[0.18em] text-amber-600 font-bold">Urgent tasks</p>
              <p className="mt-2 text-2xl font-bold text-amber-900">{overview.overdueTasks}</p>
            </div>
          </div>

          <div className="mt-6 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
            <h4 className="text-sm font-bold text-slate-900">Suggested next moves</h4>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <div className="rounded-2xl bg-slate-50 p-4">
                Route overdue tasks to the maintenance board and confirm technician ownership before end of day.
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                Review devices marked as Needs Attention and create a maintenance schedule for any unassigned asset.
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                Use the Equipment page to inspect warranties expiring within the next 60 days.
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
            <h4 className="text-sm font-bold text-slate-900">Live queue snapshot</h4>
            <div className="mt-4 space-y-3">
              {prioritizedTasks.slice(0, 3).map((task) => (
                <div key={task.key} className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm font-bold text-slate-900">{task.equipmentName}</p>
                  <p className="mt-1 text-xs text-slate-500">{task.title}</p>
                  <div className="mt-2 flex items-center gap-2 text-xs font-semibold text-slate-500">
                    <Clock3 size={12} />
                    {formatRelativeLabel(task.dueDate)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      ) : null}

      {!isBotOpen ? (
        <button
          onClick={() => setIsBotOpen(true)}
          className="absolute bottom-8 right-8 w-14 h-14 bg-slate-900 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-black hover:scale-105 transition-all z-50"
          aria-label="Open dashboard assistant"
        >
          <Bot size={24} />
        </button>
      ) : null}
    </div>
  );
}
