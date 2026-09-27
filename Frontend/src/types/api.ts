export type NodeType =
  | 'start'
  | 'dialogue'
  | 'critical'
  | 'ending_success'
  | 'ending_fail';

export type SessionState = 'active' | 'completed' | 'failed' | 'expired';

export type EventType = 'choice' | 'timeout' | 'finish' | 'fail';

export interface Choice {
  choice_key: string;
  text: string;
}

export interface Effects {
  loyalty: number;
  safety: number;
  points: number;
}

export interface Achievement {
  code: string;
  title: string;
  description: string;
  unlocked?: boolean;
  unlocked_at?: string;
}

export interface AuthRegisterRequest {
  email: string;
  password: string;
  display_name: string;
}

export interface AuthRegisterResponse {
  user_id: string;
  access_token: string;
}

export interface AuthLoginRequest {
  email: string;
  password: string;
}

export interface AuthLoginResponse {
  access_token: string;
  token_type: string;
}

export interface UserMe {
  id: string;
  email: string;
  display_name: string;
  total_score: number;
  /** TODO: серверное значение; пока может отсутствовать */
  level?: number;
}

export interface ScenarioItem {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  best_score: number | null;
}

export interface ScenariosResponse {
  items: ScenarioItem[];
}

export interface CreateSessionRequest {
  scenario_id: string;
}

export interface CreateSessionResponse {
  session_id: string;
  scenario_id: string;
  current_node_key: string;
  loyalty: number;
  safety: number;
  score: number;
  state: SessionState;
}

export interface NodeResponse {
  session_id: string;
  node_key: string;
  type: NodeType;
  text: string;
  timer_sec: number | null;
  deadline: string | null;
  server_now: string;
  loyalty: number;
  safety: number;
  score: number;
  state: SessionState;
  choices: Choice[];
}

export interface ChoiceRequest {
  choice_key: string;
}

export interface ChoiceResponse {
  accepted: boolean;
  next_node_key: string;
  effects: Effects;
  loyalty: number;
  safety: number;
  score: number;
  speed_bonus: number;
  state: SessionState;
  deadline: string | null;
}

export interface TimeoutResponse {
  timeout_applied: boolean;
  effects: Effects;
  loyalty: number;
  safety: number;
  score: number;
  state: SessionState;
  next_node_key: string;
}

export interface FinishResponse {
  session_id: string;
  state: SessionState;
  final_loyalty: number;
  final_safety: number;
  score: number;
  unlocked_achievements: Achievement[];
}

export interface DebriefResponse {
  final: {
    state: SessionState;
    loyalty: number;
    safety: number;
    score: number;
  };
  score_breakdown: {
    base: number;
    speed_bonus: number;
    completion_bonus: number;
    penalty: number;
  };
  events: Array<{
    node_key: string;
    choice_key: string | null;
    event_type: EventType;
    effects: Effects;
    loyalty_after: number;
    safety_after: number;
    score_delta: number;
    timer_sec: number | null;
    time_left_sec: number | null;
    created_at: string;
  }>;
  critical_decisions: Array<{
    node_key: string;
    choice_key: string;
    time_left_sec: number;
    was_timeout: boolean;
  }>;
  mistakes: Array<{
    node_key: string;
    choice_key: string;
    recommended_choice_key: string;
  }>;
  unlocked_achievements: Achievement[];
  recommendations: string[];
}

export interface ProfileResponse {
  user: {
    id: string;
    email: string;
    display_name: string;
    total_score: number;
    /** TODO: серверное значение; пока может отсутствовать */
    level?: number;
  };
  stats: {
    sessions_completed: number;
    sessions_failed: number;
    avg_score: number;
    best_score: number;
  };
  recent_sessions: Array<{
    session_id: string;
    scenario_title: string;
    state: SessionState;
    score: number;
    finished_at: string;
  }>;
  achievements_preview: Achievement[];
}

export interface AchievementsResponse {
  items: Achievement[];
}

export interface LeaderboardResponse {
  items: Array<{
    rank: number;
    user_id: string;
    display_name: string;
    score: number;
  }>;
}

export interface ApiErrorBody {
  detail?: string | Array<{ msg?: string }>;
  message?: string;
}
