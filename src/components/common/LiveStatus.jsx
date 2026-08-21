/** Pulsing live-indicator dot + tick label for simulated hub headers. */
export default function LiveStatus({
  playing,
  tick,
  livePrefix = "Live · tick #",
  pausedLabel = "Simulation paused",
}) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="relative flex h-2 w-2">
        <span className={`absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 ${playing ? "animate-ping" : ""}`} />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
      </span>
      {playing ? `${livePrefix}${tick}` : pausedLabel}
    </span>
  );
}
