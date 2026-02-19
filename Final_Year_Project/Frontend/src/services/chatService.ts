import apiClient from './api';
import type { SendMessageRequest, SendMessageResponse } from '../types/api';

const CHAT_PREFIX = '/api/chat';

export async function sendMessage(
  payload: SendMessageRequest
): Promise<SendMessageResponse> {
  const { data } = await apiClient.post<SendMessageResponse>(
    `${CHAT_PREFIX}/send`,
    payload
  );
  return data;
}

export async function createSession(): Promise<{ session_id: string }> {
  const { data } = await apiClient.post<{ session_id: string }>(
    `${CHAT_PREFIX}/sessions`
  );
  return data;
}

export async function listSessions(): Promise<{ sessions: string[] }> {
  const { data } = await apiClient.get<{ sessions: string[] }>(
    `${CHAT_PREFIX}/sessions`
  );
  return data;
}
