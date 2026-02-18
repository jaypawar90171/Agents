import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import type { ChatMessage } from '../types/api';

export const chatSessionIdAtom = atom<string | null>(null);
export const chatMessagesAtom = atom<ChatMessage[]>([]);
export const chatLoadingAtom = atom<boolean>(false);
export const chatErrorAtom = atom<string | null>(null);
export const chatInputAtom = atom<string>('');
export const chatSidebarOpenAtom = atomWithStorage<boolean>('chatSidebarOpen', true);

export const chatCanSendAtom = atom((get) => {
  const loading = get(chatLoadingAtom);
  const input = get(chatInputAtom).trim();
  return !loading && input.length > 0;
});

export const chatClearAtom = atom(null, (get, set) => {
  set(chatMessagesAtom, []);
  set(chatErrorAtom, null);
});

export const chatSetSessionAtom = atom(null, (get, set, sessionId: string | null) => {
  set(chatSessionIdAtom, sessionId);
  set(chatMessagesAtom, []);
  set(chatErrorAtom, null);
});
