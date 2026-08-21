/**
 * Shared sparkline primitives.
 *
 * Eleven hub pages previously defined their own (near-identical) `Sparkline`
 * or `MiniSparkline` component inline. This module is the single source of
 * truth. `MiniSparkline` is a superset of the page-local versions:
 *   - `min`/`max` clamp the y-range (some pages passed these props to a
 *     component that ignored them - now honored)
 *   - `filled` renders the subtle area fill under the line (disabled where a
 *     page did not render it)
 *   - `ariaLabel` is configurable (previously each page hardcoded its own)
 */

const SPARK_STROKES = {
  sky: "#38bdf8",
  rose: "#fb7185",
  amber: "#fbbf24",
  emerald: "#34d399",
  violet: "#a78bfa",
  cyan: "#22d3ee",
};

export function Sparkline({ points, color = "#34d399", w = 88, h = 24 }) {
  if (!points || points.length < 2) return <div className="h-6" />;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const step = w / (points.length - 1);
  const d = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${(i * step).toFixed(1)},${(h - ((p - min) / range) * (h - 4) - 2).toFixed(1)}`)
    .join(" ");
  const last = points[points.length - 1];
  return (
    <svg width={w} height={h} className="overflow-visible">
      <path d={d} fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={w - 1} cy={h - ((last - min) / range) * (h - 4) - 2} r="2.2" fill={color} />
    </svg>
  );
}

export function MiniSparkline({ points, tone = "sky", width = 130, height = 38, min = null, max = null, filled = true, ariaLabel = "trend sparkline" }) {
  if (!points || points.length < 2) return <div style={{ height }} />;
  const lo = min ?? Math.min(...points);
  const hi = max ?? Math.max(...points);
  const range = hi - lo || 1;
  const coords = points.map((p, i) => {
    const x = (i / (points.length - 1)) * width;
    const y = height - 3 - ((p - lo) / range) * (height - 6);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const stroke = SPARK_STROKES[tone] || "#38bdf8";
  const lastY = coords[coords.length - 1].split(",")[1];
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible" aria-label={ariaLabel}>
      {filled && <polygon points={`0,${height} ${coords.join(" ")} ${width},${height}`} fill={stroke} opacity="0.08" />}
      <polyline points={coords.join(" ")} fill="none" stroke={stroke} strokeWidth="1.75" strokeLinejoin="round" strokeLinecap="round" opacity="0.95" />
      <circle cx={width - 1} cy={lastY} r="2.4" fill={stroke} />
    </svg>
  );
}
