/**
 * Mock-фикстуры на случай, если backend ещё не отдаёт эндпоинт.
 * TODO: удалить после стабилизации API.
 */
import type { DebriefResponse, ProfileResponse } from '../../types/api';

export const mockProfile: ProfileResponse = {
  user: {
    id: 'mock-user',
    email: 'demo@example.com',
    display_name: 'Демо проводник',
    total_score: 450,
  },
  stats: {
    sessions_completed: 3,
    sessions_failed: 1,
    avg_score: 120,
    best_score: 200,
  },
  recent_sessions: [
    {
      session_id: 'mock-session-1',
      scenario_title: 'Задержка поезда',
      state: 'completed',
      score: 200,
      finished_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
  ],
  achievements_preview: [
    {
      code: 'first_run',
      title: 'Первый рейс',
      description: 'Завершите первую сессию',
      unlocked: true,
    },
    {
      code: 'speed_demon',
      title: 'Скорость решения',
      description: 'Получите speed_bonus',
      unlocked: false,
    },
  ],
};

export const mockDebrief: DebriefResponse = {
  final: { state: 'completed', loyalty: 70, safety: 80, score: 150 },
  score_breakdown: {
    base: 100,
    speed_bonus: 30,
    completion_bonus: 40,
    penalty: -20,
  },
  events: [
    {
      node_key: 'start',
      choice_key: 'c1',
      event_type: 'choice',
      effects: { loyalty: 5, safety: 0, points: 10 },
      loyalty_after: 75,
      safety_after: 80,
      score_delta: 10,
      timer_sec: null,
      time_left_sec: null,
      created_at: new Date().toISOString(),
    },
  ],
  critical_decisions: [],
  mistakes: [],
  unlocked_achievements: [
    {
      code: 'first_run',
      title: 'Первый рейс',
      description: 'Завершите первую сессию',
    },
  ],
  recommendations: ['Следите за шкалой Safety на критических узлах'],
};
