import type { Effects } from '../types/api';

function signed(n: number): string {
  return n > 0 ? `+${n}` : `${n}`;
}

/** Текст эффектов для toast: +зелёный / −красный через тип toast снаружи. */
export function formatEffectsToast(effects: Effects): string {
  const parts: string[] = [];
  if (effects.loyalty !== 0) parts.push(`Loyalty ${signed(effects.loyalty)}`);
  if (effects.safety !== 0) parts.push(`Safety ${signed(effects.safety)}`);
  if (effects.points !== 0) parts.push(`Очки ${signed(effects.points)}`);
  return parts.join(' · ') || 'Без изменений';
}

/** success если есть плюсы и нет минусов; error если есть минусы; иначе info */
export function effectsToastType(
  effects: Effects,
): 'success' | 'error' | 'info' {
  const vals = [effects.loyalty, effects.safety, effects.points];
  const hasNeg = vals.some((v) => v < 0);
  const hasPos = vals.some((v) => v > 0);
  if (hasNeg && !hasPos) return 'error';
  if (hasPos && !hasNeg) return 'success';
  if (hasNeg) return 'error';
  if (hasPos) return 'success';
  return 'info';
}
