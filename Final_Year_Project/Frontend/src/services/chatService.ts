import apiClient from './api';
import type { SendMessageRequest, SendMessageResponse, ChatSession, ChatSessionDetail } from '../types/api';

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

export async function listSessions(): Promise<ChatSession[]> {
  const { data } = await apiClient.get<{ sessions: ChatSession[] }>(
    `${CHAT_PREFIX}/sessions`
  );
  return data.sessions;
}

export async function getSession(session_id: string): Promise<ChatSessionDetail> {
  const { data } = await apiClient.get<ChatSessionDetail>(
    `${CHAT_PREFIX}/sessions/${session_id}`
  );
  return data;
}

export async function renameSession(session_id: string, title: string): Promise<void> {
  await apiClient.patch(`${CHAT_PREFIX}/sessions/${session_id}`, { title });
}

export async function deleteSession(session_id: string): Promise<void> {
  await apiClient.delete(`${CHAT_PREFIX}/sessions/${session_id}`);
}
