/* Shared math/formatting helpers used by the simulated hub pages. */

export const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

export const round1 = (v) => Math.round(v * 10) / 10;

export const fmtNumber = (n) => n.toLocaleString("en-US");

/**
 * Deterministic pseudo-random walk so a card's sparkline is stable per seed.
 *
 * Each domain tunes the walk through `opts`:
 *   - `lo`/`hi`    clamp bounds (default: base ± amp)
 *   - `pull`       mean-reversion strength toward `base`
 *   - `seedMult`   per-domain jitter seed multiplier
 */
export const seededSeries = (seed, n, base, amp, opts = {}) => {
  const { lo = base - amp, hi = base + amp, pull = 0.08, seedMult = 110351 } = opts;
  const pts = [];
  let v = base;
  let s = seed * seedMult;
  for (let i = 0; i < n; i += 1) {
    s = (s * 1103515245 + 12345) % 2147483648;
    const r = (s / 2147483648) - 0.5;
    v = clamp(v + r * amp + (base - v) * pull, lo, hi);
    pts.push(round1(v));
  }
  return pts;
};
