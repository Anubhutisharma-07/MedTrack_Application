import { Download } from "lucide-react";

const ACCENTS = {
  sky: "border-sky-500/40 bg-sky-500/10 text-sky-400 hover:bg-sky-500/20",
  cyan: "border-cyan-500/40 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20",
};

/** Variant-A bordered accent export button (sky default, cyan for Cold Chain). */
export function ExportButton({ onClick, exporting, accent = "sky" }) {
  return (
    <button
      onClick={onClick}
      disabled={exporting}
      className={`flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-xs font-bold transition disabled:opacity-60 ${ACCENTS[accent]}`}
    >
      <Download size={14} /> {exporting ? "Writing…" : "Export CSV"}
    </button>
  );
}

/** Variant-B slate export button (emerald hover) for the compact command-hub header. */
export function ExportCsvButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-medium text-slate-300 hover:border-emerald-500/40 hover:text-emerald-300"
    >
      <Download size={14} /> Export CSV
    </button>
  );
}
