import { apiClient } from './client';
import type {
  AuthRegisterRequest, AuthResponse,
  ScenariosResponse,
  SessionResponse, NodeResponse,
  ChoiceResultResponse, ChoiceRequest,
  SessionDebriefResponse,
  ProfileResponse,
  SessionHistoryResponse,
} from '../types/api';

export const authApi = {
  register: (body: AuthRegisterRequest) =>
    apiClient.post<AuthResponse>('/auth/register', body).then(r => r.data),

  login: (email: string, password: string) => {
    const params = new URLSearchParams();
    params.append('username', email);
    params.append('password', password);
    params.append('grant_type', 'password');
    return apiClient
      .post<AuthResponse>('/auth/login', params, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      })
      .then(r => r.data);
  },

  me: () => apiClient.get('/auth/me').then(r => r.data),
};

export const scenariosApi = {
  list: (params?: { limit?: number; offset?: number }) =>
    apiClient.get<ScenariosResponse>('/scenarios', { params }).then(r => r.data),
};

export const sessionsApi = {
  create: (scenarioId: string) =>
    apiClient.post<SessionResponse>('/sessions/start', { scenario_id: scenarioId }).then(r => r.data),

  getNode: (sessionId: string) =>
    apiClient.get<NodeResponse>(`/sessions/${sessionId}/node`).then(r => r.data),

  postChoice: (sessionId: string, body: ChoiceRequest) =>
    apiClient.post<ChoiceResultResponse>(`/sessions/${sessionId}/choice`, body).then(r => r.data),

  postTimeout: (sessionId: string) =>
    apiClient.post<ChoiceResultResponse>(`/sessions/${sessionId}/timeout`).then(r => r.data),

  postFinish: (sessionId: string) =>
    apiClient.post<SessionResponse>(`/sessions/${sessionId}/finish`).then(r => r.data),

  getDebrief: (sessionId: string) =>
    apiClient.get<SessionDebriefResponse>(`/sessions/${sessionId}`).then(r => r.data),
};

export const profileApi = {
  get: () => apiClient.get<ProfileResponse>('/profile/me').then(r => r.data),
  getSessions: (limit?: number, offset?: number) =>
    apiClient.get<SessionHistoryResponse>(`/profile/me/sessions`, { params: { limit, offset } }).then(r => r.data),
};