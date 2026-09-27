const SCENARIO_KEY_PREFIX = 'session_scenario:';

/** Клиентский кэш scenario_id для кнопки «Ещё раз» в дебрифе.
 * TODO: убрать, когда backend добавит scenario_id в DebriefResponse. */
export function rememberSessionScenario(sessionId: string, scenarioId: string): void {
  try {
    sessionStorage.setItem(`${SCENARIO_KEY_PREFIX}${sessionId}`, scenarioId);
  } catch {
    // ignore quota / private mode
  }
}

export function getSessionScenario(sessionId: string): string | null {
  try {
    return sessionStorage.getItem(`${SCENARIO_KEY_PREFIX}${sessionId}`);
  } catch {
    return null;
  }
}
