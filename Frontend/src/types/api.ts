// ─── Auth ──────────────────────────────────────────
export interface UserMe {
  id: string;
  email: string;
  display_name: string;
  role: string;
  group_id: string;
  level: number;
  xp: number;
  total_score: number;
  created_at: string;
}

export interface AuthResponse {
  user: UserMe;
  access_token: string;
  token_type: string;
}

export interface AuthRegisterRequest {
  email: string;
  password: string;        // ≥ 8
  display_name: string;    // 1..50
  group_id?: string;
}

// ─── Scenarios ─────────────────────────────────────
export interface ScenarioItem {
  id: string;
  title: string;
  description: string;
  difficulty?: string | null;
  competencies: string[];
  best_score?: number | null;
}
export interface ScenariosResponse {
  items: ScenarioItem[];
  total: number;
}

// ─── Sessions ──────────────────────────────────────
export interface SessionResponse {
  session_id: string;
  scenario_id: string;
  current_node_key: string;
  state: 'active' | 'completed' | 'failed' | 'expired';
  loyalty: number;
  safety: number;
  score: number;
  deadline?: string | null;
  started_at: string;
  is_restarted: boolean;
}

export interface ChoiceItem {
  choice_key: string;
  choice_text: string;
  recommendation?: string | null;
  is_visible: boolean;
}

export interface NodeResponse {
  node_key: string;
  type: 'start' | 'dialogue' | 'critical' | 'ending_success' | 'ending_fail';
  text: string;
  timer_sec: number | null;
  timer_left_sec: number | null;   // ← оставшиеся секунды
  choices: ChoiceItem[];
}

export interface ChoiceRequest {
  choice_key: string;
  version: number;                 // пока шлём 0
}

export interface ChoiceResultResponse {
  session_id: string;
  new_node_key: string;
  loyalty_delta: number;
  safety_delta: number;
  score_delta: number;
  competency_effects: Array<{ code: string; title: string; delta: number }>;
  new_state: 'active' | 'completed' | 'failed';
  finished: boolean;
}

// ─── Debrief (GET /sessions/{id}) ──────────────────
export interface SessionEventItem {
  event_type: 'choice' | 'timeout' | 'finish' | 'fail';
  node_key: string;
  choice_key?: string | null;
  loyalty_after: number;
  safety_after: number;
  score_delta: number;
  created_at: string;
}

export interface SessionDebriefResponse {
  session_id: string;
  scenario_id: string;
  state: 'completed' | 'failed' | 'expired' | 'active';
  final_score: number;
  loyalty: number;
  safety: number;
  duration_sec: number;
  events: SessionEventItem[];
  competency_progress: Array<{ code: string; title: string; delta: number; total_score: number }>;
  achievements_unlocked: Array<{ code: string; title: string; description: string; icon?: string | null }>;
  recommendations: string[];
}

// ─── Profile ───────────────────────────────────────
export interface ProfileResponse {
  user: UserMe;
  group: { id: string; name: string; type: string; parent_id?: string | null } | null;
  total_score: number;
  sessions_completed: number;
  sessions_failed: number;
  average_score: number;
  top_competencies: Array<{ code: string; title: string; score: number; progress_percent: number }>;
}