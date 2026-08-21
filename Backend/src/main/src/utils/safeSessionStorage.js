/**
 * Safe session-storage helpers.
 *
 * Wraps `sessionStorage` with JSON serialisation and error handling so
 * that corrupted / quota-exceeded entries never crash the application.
 *
 * Used by AuthContext, ToastContext, and anywhere persistent client-side
 * state is needed without pulling in a larger state-management library.
 */

/* ------------------------------------------------------------------ */
/*  Storage availability check                                        */
/* ------------------------------------------------------------------ */

export const storageAvailable = (() => {
  try {
    const key = "__storage_test__";
    sessionStorage.setItem(key, "1");
    sessionStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
})();

/* ------------------------------------------------------------------ */
/*  Core read / write / remove                                        */
/* ------------------------------------------------------------------ */

/**
 * Read a JSON value from sessionStorage.
 *
 * @param {string}  key       – storage key.
 * @param {*}       fallback  – returned when the key is absent or
 *                              the stored value cannot be parsed.
 * @returns {*}
 */
export function readJson(key, fallback = null) {
  if (!storageAvailable) return fallback;

  try {
    const raw = sessionStorage.getItem(key);
    if (raw === null) return fallback;

    const parsed = JSON.parse(raw);

    // JSON literal `null` stored via writeJson(null) is not useful data;
    // treat it the same as a missing key so callers get the fallback.
    if (parsed === null) return fallback;

    return parsed;
  } catch {
    // Corrupt entry — remove it to prevent repeated parse failures.
    try {
      sessionStorage.removeItem(key);
    } catch {
      /* ignore — best-effort cleanup */
    }
    return fallback;
  }
}

/**
 * Write a value to sessionStorage as JSON.
 *
 * @param {string} key – storage key.
 * @param {*}      value – any JSON-serialisable value.
 * @returns {boolean} `true` on success, `false` on failure.
 */
export function writeJson(key, value) {
  if (!storageAvailable) return false;

  try {
    sessionStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

/**
 * Remove a key from sessionStorage.
 *
 * @param {string} key
 */
export function remove(key) {
  if (!storageAvailable) return;

  try {
    sessionStorage.removeItem(key);
  } catch {
    /* best-effort */
  }
}
