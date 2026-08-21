/**
 * Shared CSV export helper.
 *
 * Every hub page assembled the same blob/anchor/download boilerplate at the
 * tail of its `exportCsv` handler. `downloadCsv` replaces that tail; pages
 * keep their own row assembly (headers + domain data) and pass the filename.
 */

export function downloadCsv(filename, rows, mime = "text/csv") {
  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: mime });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}
