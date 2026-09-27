import { useLevel } from '../hooks/useLevel';

interface LevelBadgeProps {
  level?: number | null;
  score: number;
  /** Компактный вид для хедера */
  compact?: boolean;
}

export function LevelBadge({ level: serverLevel, score, compact = true }: LevelBadgeProps) {
  const { level, pointsToNext } = useLevel(score, serverLevel);

  const tooltip = `До следующего уровня: ${pointsToNext} очков`;

  if (compact) {
    return (
      <span
        className="inline-flex items-center gap-2 rounded-lg bg-slate-800/80 px-2.5 py-1 text-xs text-slate-200"
        title={tooltip}
      >
        <span className="rounded bg-indigo-500/25 px-1.5 py-0.5 font-semibold text-indigo-300">
          Lv {level}
        </span>
        <span className="tabular-nums text-amber-300">{score}</span>
      </span>
    );
  }

  return (
    <div className="space-y-1" title={tooltip}>
      <div className="flex items-baseline justify-between gap-2 text-sm">
        <span className="font-semibold text-indigo-300">Уровень {level}</span>
        <span className="tabular-nums text-amber-300">{score} очков</span>
      </div>
      <p className="text-xs text-slate-400">{tooltip}</p>
    </div>
  );
}
