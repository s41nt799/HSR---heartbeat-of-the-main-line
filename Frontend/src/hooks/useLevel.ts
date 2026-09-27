/**
 * Клиентский расчёт уровня, пока backend не отдаёт level.
 * TODO: заменить на серверное значение, когда backend добавит level в /auth/me и /profile.
 */
export function computeLevel(totalScore: number): {
  level: number;
  nextThreshold: number;
  pointsToNext: number;
  progress: number;
} {
  const score = Math.max(0, totalScore);
  const level = Math.floor(Math.sqrt(score / 100)) + 1;
  const nextThreshold = level * level * 100;
  const prevThreshold = (level - 1) * (level - 1) * 100;
  const pointsToNext = Math.max(0, nextThreshold - score);
  const span = Math.max(1, nextThreshold - prevThreshold);
  const progress = Math.min(1, Math.max(0, (score - prevThreshold) / span));

  return { level, nextThreshold, pointsToNext, progress };
}

export function useLevel(totalScore: number, serverLevel?: number | null) {
  const computed = computeLevel(totalScore);
  // TODO: убрать fallback, когда backend стабильно отдаёт level
  const level = serverLevel != null && serverLevel > 0 ? serverLevel : computed.level;

  return {
    level,
    nextThreshold: computed.nextThreshold,
    pointsToNext: computed.pointsToNext,
    progress: computed.progress,
    fromServer: serverLevel != null && serverLevel > 0,
  };
}
