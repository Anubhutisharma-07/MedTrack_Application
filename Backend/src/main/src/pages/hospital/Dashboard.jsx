/**
 * Hospital Dashboard — primary landing page for hospital-role users.
 *
 * - Demo users (id starts with "demo-") see synthetic data without
 *   hitting the API.
 * - Real users trigger getAllEquipment / getAllTasks on mount.
 * - Renders a loading spinner while data is in flight.
 */

import { useEffect, useState } from "react";
import { Activity, AlertTriangle, BarChart3, Settings } from "lucide-react";
import { getAllEquipment } from "../../services/EquipmentService";
import { getAllTasks } from "../../services/MaintenanceService";

/* ------------------------------------------------------------------ */
/*  Demo data                                                         */
/* ------------------------------------------------------------------ */

const DEMO_EQUIPMENT = [
  { id: "EQ-001", name: "MRI Scanner", status: "ACTIVE", model: "Siemens MAGNETOM" },
  { id: "EQ-002", name: "X-Ray Machine", status: "MAINTENANCE", model: "GE Revolution" },
  { id: "EQ-003", name: "Ultrasound", status: "ACTIVE", model: "Philips EPIQ" },
];

const DEMO_TASKS = [
  { id: "MNT-001", description: "Quarterly MRI calibration", status: "Scheduled" },
  { id: "MNT-002", description: "X-Ray bulb replacement", status: "In Progress" },
];

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export default function Dashboard({ onNavigate }) {
  const [equipment, setEquipment] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // We need access to the auth user — derive from context or props.
  // For simplicity, check sessionStorage directly (AuthContext is
  // typically provided higher in the tree).
  const isDemo =
    typeof window !== "undefined" &&
    (() => {
      try {
        const raw = sessionStorage.getItem("medtrack_user");
        if (!raw) return false;
        const user = JSON.parse(raw);
        return user?.id?.startsWith("demo-");
      } catch {
        return false;
      }
    })();

  useEffect(() => {
    if (isDemo) {
      setEquipment(DEMO_EQUIPMENT);
      setTasks(DEMO_TASKS);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      try {
        const [eqResult, taskResult] = await Promise.allSettled([
          getAllEquipment(0, 10),
          getAllTasks(),
        ]);

        if (!cancelled) {
          if (eqResult.status === "fulfilled") {
            setEquipment(eqResult.value?.content || []);
          }
          if (taskResult.status === "fulfilled") {
            setTasks(Array.isArray(taskResult.value) ? taskResult.value : []);
          }
        }
      } catch {
        // Errors are non-fatal — dashboard still renders
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [isDemo]);

  /* ---- loading state ---- */
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-700 border-t-sky-400" />
      </div>
    );
  }

  /* ---- main dashboard ---- */
  return (
    <div className="min-h-screen bg-slate-950 px-6 py-8 text-slate-100">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="mt-1 text-sm text-slate-400">
        Overview of equipment and maintenance activity
      </p>

      {/* Stat cards */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={<BarChart3 size={18} />} label="Equipment" value={equipment.length} tone="sky" />
        <StatCard icon={<Activity size={18} />} label="Tasks" value={tasks.length} tone="emerald" />
        <StatCard
          icon={<AlertTriangle size={18} />}
          label="Issues"
          value={equipment.filter((e) => e.status !== "ACTIVE").length}
          tone="amber"
        />
        <StatCard icon={<Settings size={18} />} label="Uptime" value="99.8%" tone="violet" />
      </div>

      {/* Equipment list */}
      <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/60">
        <div className="border-b border-slate-800 px-5 py-4">
          <h2 className="text-sm font-semibold text-slate-100">Recent Equipment</h2>
        </div>
        {equipment.length === 0 ? (
          <p className="px-5 py-6 text-xs text-slate-500">No equipment found.</p>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="text-slate-500">
              <tr>
                <th className="px-5 py-3 font-medium">ID</th>
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Model</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {equipment.map((eq) => (
                <tr key={eq.id} className="text-slate-300">
                  <td className="px-5 py-3 font-mono text-slate-400">{eq.id}</td>
                  <td className="px-5 py-3">{eq.name}</td>
                  <td className="px-5 py-3">{eq.model}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        eq.status === "ACTIVE"
                          ? "bg-emerald-500/10 text-emerald-400"
                          : "bg-amber-500/10 text-amber-400"
                      }`}
                    >
                      {eq.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Tasks list */}
      <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/60">
        <div className="border-b border-slate-800 px-5 py-4">
          <h2 className="text-sm font-semibold text-slate-100">Maintenance Tasks</h2>
        </div>
        {tasks.length === 0 ? (
          <p className="px-5 py-6 text-xs text-slate-500">No maintenance tasks.</p>
        ) : (
          <ul className="divide-y divide-slate-800">
            {tasks.map((t) => (
              <li key={t.id} className="flex items-center justify-between px-5 py-3 text-xs">
                <span className="text-slate-300">{t.description}</span>
                <span className="text-slate-500">{t.status}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Stat card sub-component                                           */
/* ------------------------------------------------------------------ */

function StatCard({ icon, label, value, tone = "sky" }) {
  const colorMap = {
    sky: "border-sky-500/20 bg-sky-500/5 text-sky-400",
    emerald: "border-emerald-500/20 bg-emerald-500/5 text-emerald-400",
    amber: "border-amber-500/20 bg-amber-500/5 text-amber-400",
    violet: "border-violet-500/20 bg-violet-500/5 text-violet-400",
  };

  return (
    <div
      className={`rounded-2xl border p-4 ${colorMap[tone] || colorMap.sky}`}
    >
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-wide opacity-70">
        {icon}
        {label}
      </div>
      <p className="mt-2 text-2xl font-bold text-slate-100">{value}</p>
    </div>
  );
}
