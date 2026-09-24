import { memo } from 'react';
import { clampPercent, getStatTone } from '../utils/format';

interface StatBarProps {
  label: string;
  value: number;
  max?: number;
  color?: 'indigo' | 'emerald' | 'amber';
}

const toneClass: Record<ReturnType<typeof getStatTone>, string> = {
  good: 'bg-emerald-500',
  warn: 'bg-amber-500',
  danger: 'bg-rose-500 animate-pulseSoft',
};

const colorFallback: Record<NonNullable<StatBarProps['color']>, string> = {
  indigo: 'bg-indigo-500',
  emerald: 'bg-emerald-500',
  amber: 'bg-amber-500',
};

function StatBarComponent({ label, value, max = 100, color = 'indigo' }: StatBarProps) {
  const pct = clampPercent((value / max) * 100);
  const tone = getStatTone(value);
  const barColor = tone === 'danger' ? toneClass.danger : colorFallback[color];

  return (
    <div className="min-w-0 flex-1">
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <span className="text-xs uppercase tracking-wide text-slate-400">{label}</span>
        <span className="text-sm font-semibold tabular-nums text-slate-100">
          {Math.round(value)}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-800">
        <div
          className={`h-full rounded-full transition-[width] duration-300 ease-out ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export const StatBar = memo(StatBarComponent);
