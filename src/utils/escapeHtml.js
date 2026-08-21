/**
 * Escapes a value for safe interpolation into HTML strings.
 *
 * Prevents reflective XSS when user-controlled task fields (notes, description,
 * equipment names, part lists) are written into dynamically generated documents
 * such as the technician maintenance export (UpdateTask.jsx).
 *
 * @param {unknown} value the value to escape (coerced to string; null/undefined become "")
 * @returns {string} the HTML-escaped string
 */
export function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}