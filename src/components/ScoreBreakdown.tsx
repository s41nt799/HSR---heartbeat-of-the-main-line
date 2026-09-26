interface ScoreBreakdownProps {
  base: number;
  speed_bonus: number;
  completion_bonus: number;
  penalty: number;
}

const rows: Array<{
  key: keyof ScoreBreakdownProps;
  label: string;
  hint: string;
  tone: string;
}> = [
  { key: 'base', label: 'База', hint: 'Очки за выборы', tone: 'bg-indigo-500' },
  {
    key: 'speed_bonus',
    label: 'Бонус скорости',
    hint: 'За быстрые решения',
    tone: 'bg-emerald-500',
  },
  {
    key: 'completion_bonus',
    label: 'Завершение',
    hint: 'Бонус за прохождение',
    tone: 'bg-sky-500',
  },
  { key: 'penalty', label: 'Штраф', hint: 'Таймауты и ошибки', tone: 'bg-rose-500' },
];

export function ScoreBreakdown(props: ScoreBreakdownProps) {
  const absMax = Math.max(1, ...rows.map((r) => Math.abs(props[r.key])));
  const total =
    props.base + props.speed_bonus + props.completion_bonus + props.penalty;

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {rows.map(({ key, label, hint, tone }) => {
          const value = props[key];
          const width = `${Math.round((Math.abs(value) / absMax) * 100)}%`;
          return (
            <div key={key}>
              <div className="mb-1 flex justify-between gap-2 text-sm">
                <div>
                  <span className="text-slate-300">{label}</span>
                  <span className="ml-2 text-xs text-slate-500">{hint}</span>
                </div>
                <span
                  className={`tabular-nums font-medium ${
                    value < 0 ? 'text-rose-300' : value > 0 ? 'text-emerald-300' : 'text-slate-100'
                  }`}
                >
                  {value > 0 ? `+${value}` : value}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                <div className={`h-full rounded-full ${tone}`} style={{ width }} />
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-between border-t border-slate-800 pt-3 text-sm">
        <span className="font-medium text-slate-300">Итого</span>
        <span className="text-lg font-semibold tabular-nums text-amber-300">{total}</span>
      </div>
    </div>
  );
}
