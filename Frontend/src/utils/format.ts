export function getStatTone(value: number): 'good' | 'warn' | 'danger' {
  if (value > 60) return 'good';
  if (value >= 30) return 'warn';
  return 'danger';
}

export function clampPercent(value: number, max = 100): number {
  if (Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(max, value));
}

export function difficultyLabel(difficulty: string | null | undefined): string {
  const map: Record<string, string> = {
    easy: 'Лёгкий',
    medium: 'Средний',
    hard: 'Сложный',
    Easy: 'Лёгкий',
    Medium: 'Средний',
    Hard: 'Сложный',
  };
  if (!difficulty) return '—';
  return map[difficulty] ?? difficulty;
}

export function nodeTypeLabel(type: string): string {
  const map: Record<string, string> = {
    start: 'Старт',
    dialogue: 'Диалог',
    critical: 'Критический',
    ending_success: 'Успех',
    ending_fail: 'Провал',
  };
  return map[type] ?? type;
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/** Относительное время: «2 часа назад» */
export function formatRelativeTime(iso: string, now = Date.now()): string {
  const ts = Date.parse(iso);
  if (Number.isNaN(ts)) return iso;

  const diffSec = Math.round((now - ts) / 1000);
  if (diffSec < 0) return 'только что';
  if (diffSec < 60) return 'только что';

  const minutes = Math.floor(diffSec / 60);
  if (minutes < 60) return minutes === 1 ? '1 минуту назад' : `${minutes} мин. назад`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    if (hours === 1) return '1 час назад';
    if (hours >= 2 && hours <= 4) return `${hours} часа назад`;
    return `${hours} часов назад`;
  }

  const days = Math.floor(hours / 24);
  if (days === 1) return '1 день назад';
  if (days >= 2 && days <= 4) return `${days} дня назад`;
  if (days < 30) return `${days} дней назад`;

  return formatDateRu(iso);
}

export function formatDateRu(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function sessionStateLabel(state: string): string {
  const map: Record<string, string> = {
    active: 'Активна',
    completed: 'Завершена',
    failed: 'Провал',
    expired: 'Истекла',
  };
  return map[state] ?? state;
}

export function sessionStateClass(state: string): string {
  if (state === 'completed') return 'text-emerald-400';
  if (state === 'failed') return 'text-rose-400';
  if (state === 'expired') return 'text-amber-400';
  return 'text-slate-300';
}
