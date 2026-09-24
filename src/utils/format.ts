export function getStatTone(value: number): 'good' | 'warn' | 'danger' {
  if (value > 60) return 'good';
  if (value >= 30) return 'warn';
  return 'danger';
}

export function clampPercent(value: number, max = 100): number {
  if (Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(max, value));
}

export function difficultyLabel(difficulty: string): string {
  const map: Record<string, string> = {
    easy: 'Лёгкий',
    medium: 'Средний',
    hard: 'Сложный',
    Easy: 'Лёгкий',
    Medium: 'Средний',
    Hard: 'Сложный',
  };
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
