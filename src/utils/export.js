/* ------------------------------------------------------------------ */
/*  Shared CSV export helpers                                          */
/* ------------------------------------------------------------------ */

export const csvEscape = (s) => `"${String(s).replace(/"/g, '""')}"`;

/**
 * Trigger a browser download of `rows` (array of arrays, or a pre-built
 * CSV string) under `filename`. Handles the blob/anchor lifecycle so
 * callers only need to build their tab-conditional rows.
 */
export function downloadCsv(filename, rows) {
  const csv =
    typeof rows === "string"
      ? rows
      : rows.map((r) => r.map(csvEscape).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
