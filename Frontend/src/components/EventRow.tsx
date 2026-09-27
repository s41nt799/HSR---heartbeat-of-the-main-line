import type { EventType } from '../types/api';

interface EventRowProps {
  node_key: string;
  choice_key: string | null;
  event_type: EventType;
  effects: { loyalty: number; safety: number; points: number };
  loyalty_after: number;
  safety_after: number;
  score_delta: number;
}

const badgeClass: Record<EventType, string> = {
  choice: 'bg-indigo-500/20 text-indigo-300',
  timeout: 'bg-amber-500/20 text-amber-300',
  finish: 'bg-emerald-500/20 text-emerald-300',
  fail: 'bg-rose-500/20 text-rose-300',
};

function signed(n: number): string {
  return n >= 0 ? `+${n}` : `${n}`;
}

export function EventRow({
  node_key,
  choice_key,
  event_type,
  effects,
  loyalty_after,
  safety_after,
  score_delta,
}: EventRowProps) {
  return (
    <li className="py-3 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`rounded px-2 py-0.5 text-xs font-medium ${badgeClass[event_type]}`}>
          {event_type}
        </span>
        <span className="text-slate-300">{node_key}</span>
        {choice_key && <span className="text-slate-500">→ {choice_key}</span>}
      </div>
      <div className="mt-1 flex flex-wrap gap-3 text-xs text-slate-400">
        <span className={effects.loyalty >= 0 ? 'text-emerald-400/90' : 'text-rose-400/90'}>
          ΔL {signed(effects.loyalty)}
        </span>
        <span className={effects.safety >= 0 ? 'text-emerald-400/90' : 'text-rose-400/90'}>
          ΔS {signed(effects.safety)}
        </span>
        <span className={effects.points >= 0 ? 'text-emerald-400/90' : 'text-rose-400/90'}>
          ΔP {signed(effects.points)}
        </span>
        <span>L→{loyalty_after}</span>
        <span>S→{safety_after}</span>
        <span className={score_delta >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
          score {signed(score_delta)}
        </span>
      </div>
    </li>
  );
}
