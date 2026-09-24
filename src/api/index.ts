import { apiClient } from './client';
import type {
  AchievementsResponse,
  AuthLoginRequest,
  AuthLoginResponse,
  AuthRegisterRequest,
  AuthRegisterResponse,
  ChoiceRequest,
  ChoiceResponse,
  CreateSessionRequest,
  CreateSessionResponse,
  DebriefResponse,
  FinishResponse,
  LeaderboardResponse,
  NodeResponse,
  ProfileResponse,
  ScenariosResponse,
  TimeoutResponse,
  UserMe,
} from '../types/api';

export const authApi = {
  register: (body: AuthRegisterRequest) =>
    apiClient.post<AuthRegisterResponse>('/auth/register', body).then((r) => r.data),

  login: (body: AuthLoginRequest) =>
    apiClient.post<AuthLoginResponse>('/auth/login', body).then((r) => r.data),

  me: () => apiClient.get<UserMe>('/auth/me').then((r) => r.data),
};

export const scenariosApi = {
  list: (params?: { limit?: number; offset?: number }) =>
    apiClient
      .get<ScenariosResponse>('/scenarios', { params })
      .then((r) => r.data),
};

export const sessionsApi = {
  create: (body: CreateSessionRequest) =>
    apiClient.post<CreateSessionResponse>('/sessions', body).then((r) => r.data),

  getNode: (sessionId: string) =>
    apiClient.get<NodeResponse>(`/sessions/${sessionId}/node`).then((r) => r.data),

  postChoice: (sessionId: string, body: ChoiceRequest) =>
    apiClient
      .post<ChoiceResponse>(`/sessions/${sessionId}/choices`, body)
      .then((r) => r.data),

  postTimeout: (sessionId: string) =>
    apiClient
      .post<TimeoutResponse>(`/sessions/${sessionId}/timeout`)
      .then((r) => r.data),

  postFinish: (sessionId: string) =>
    apiClient
      .post<FinishResponse>(`/sessions/${sessionId}/finish`)
      .then((r) => r.data),

  getDebrief: (sessionId: string) =>
    apiClient
      .get<DebriefResponse>(`/sessions/${sessionId}/debrief`)
      .then((r) => r.data),
};

export const profileApi = {
  get: () => apiClient.get<ProfileResponse>('/profile').then((r) => r.data),

  achievements: () =>
    apiClient.get<AchievementsResponse>('/profile/achievements').then((r) => r.data),
};

export const leaderboardApi = {
  get: (limit = 50) =>
    apiClient
      .get<LeaderboardResponse>('/leaderboard', { params: { limit } })
      .then((r) => r.data),
};
