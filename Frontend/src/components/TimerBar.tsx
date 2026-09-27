interface TimerBarProps {
  remaining: number | null;
  progress: number | null;
}

function toneColor(progress: number): string {
  if (progress > 0.5) return '#34d399'; // emerald
  if (progress >= 0.2) return '#fbbf24'; // amber
  return '#fb7185'; // rose
}

function textTone(progress: number): string {
  if (progress < 0.2) return 'text-rose-300';
  if (progress <= 0.5) return 'text-amber-300';
  return 'text-emerald-300';
}

/** Линейный + кольцевой индикатор для critical-узлов. */
export function TimerBar({ remaining, progress }: TimerBarProps) {
  if (remaining === null || progress === null) return null;

  const secs = Math.ceil(remaining);
  const pct = Math.round(progress * 100);
  const color = toneColor(progress);
  const low = progress < 0.2;

  // SVG ring
  const size = 56;
  const stroke = 5;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = c * progress;

  return (
    <div
      className={`flex flex-wrap items-center gap-4 ${low ? 'animate-pulseSoft' : ''}`}
      role="timer"
      aria-live="polite"
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#1e293b"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c}`}
          className="transition-[stroke-dasharray] duration-100 ease-linear"
        />
      </svg>

      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex items-baseline justify-between gap-2 text-sm">
          <span className="text-slate-400">Таймер</span>
          <span className={`font-semibold tabular-nums ${textTone(progress)}`}>{secs} с</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-800">
          <div
            className={`h-full rounded-full transition-[width] duration-100 ease-linear ${
              low ? 'bg-rose-500' : progress <= 0.5 ? 'bg-amber-500' : 'bg-emerald-500'
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  );
}
