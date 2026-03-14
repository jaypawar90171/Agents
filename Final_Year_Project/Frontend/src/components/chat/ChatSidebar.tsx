import { useState, useEffect, useCallback, useRef } from 'react';
import { useAtom, useSetAtom } from 'jotai';
import {
  chatSessionIdAtom,
  chatSidebarOpenAtom,
  chatSessionListAtom,
  chatMessagesAtom,
} from '../../store/chatAtoms';
import {
  listSessions,
  getSession,
  renameSession,
  deleteSession,
} from '../../services/chatService';
import type { ChatSession, ChatMessage } from '../../types/api';
import { Briefcase, Plus, Trash2, Pencil, ChevronLeft, MessageSquare } from 'lucide-react';

function formatRelativeTime(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function truncateTitle(title: string, maxLen = 36): string {
  if (title.length <= maxLen) return title;
  return title.slice(0, maxLen) + '…';
}

// ─── Session item ──────────────────────────────────────────────────────────

interface SessionItemProps {
  session: ChatSession;
  isActive: boolean;
  onSelect: () => void;
  onRename: (newTitle: string) => void;
  onDelete: () => void;
}

function SessionItem({ session, isActive, onSelect, onRename, onDelete }: SessionItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(session.title);
  const [isHovered, setIsHovered] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keep editTitle in sync if the session title prop changes (e.g. auto-title)
  useEffect(() => {
    setEditTitle(session.title);
  }, [session.title]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const commitRename = () => {
    const trimmed = editTitle.trim();
    if (trimmed && trimmed !== session.title) {
      onRename(trimmed);
    } else {
      setEditTitle(session.title);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') commitRename();
    else if (e.key === 'Escape') {
      setEditTitle(session.title);
      setIsEditing(false);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (showDeleteConfirm) {
      onDelete();
    } else {
      setShowDeleteConfirm(true);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      className={`group flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
        isActive
          ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300'
          : 'hover:bg-slate-100 dark:hover:bg-slate-800'
      }`}
      onClick={onSelect}
      onKeyDown={(e) => e.key === 'Enter' && onSelect()}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setShowDeleteConfirm(false);
      }}
    >
      <MessageSquare className="w-4 h-4 flex-shrink-0 text-slate-400" />

      <div className="flex-1 min-w-0">
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={commitRename}
            onKeyDown={handleKeyDown}
            onClick={(e) => e.stopPropagation()}
            className="w-full px-1 py-0.5 text-sm bg-white dark:bg-slate-900 border border-indigo-500 rounded focus:outline-none"
          />
        ) : (
          <p className="text-sm text-slate-700 dark:text-slate-200 truncate leading-snug">
            {truncateTitle(session.title || 'New Chat')}
          </p>
        )}
        <p className="text-xs text-slate-400 mt-0.5">
          {formatRelativeTime(session.created_at)}
        </p>
      </div>

      {isHovered && !isEditing && (
        <div className="flex items-center gap-0.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400"
            title="Rename"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleDeleteClick}
            className={`p-1 rounded transition-colors ${
              showDeleteConfirm
                ? 'text-red-500 bg-red-50 dark:bg-red-900/30'
                : 'hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400'
            }`}
            title={showDeleteConfirm ? 'Click again to confirm delete' : 'Delete'}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main Sidebar ──────────────────────────────────────────────────────────

interface ChatSidebarProps {
  onNewChat: () => void;
}

export default function ChatSidebar({ onNewChat }: ChatSidebarProps) {
  const [isOpen, setIsOpen] = useAtom(chatSidebarOpenAtom);
  const [sessionList, setSessionList] = useAtom(chatSessionListAtom);
  const [currentSessionId, setCurrentSessionId] = useAtom(chatSessionIdAtom);
  const setMessages = useSetAtom(chatMessagesAtom);

  // Load session list on mount and whenever the sidebar opens
  const loadSessions = useCallback(async () => {
    try {
      const sessions = await listSessions();
      setSessionList(sessions);
    } catch (err) {
      console.error('[Sidebar] Failed to load sessions:', err);
    }
  }, [setSessionList]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  // Allow parent to trigger a refresh by exposing via window (simple approach)
  useEffect(() => {
    (window as any).__reloadChatSidebar = loadSessions;
    return () => { delete (window as any).__reloadChatSidebar; };
  }, [loadSessions]);

  const handleSelectSession = useCallback(async (session: ChatSession) => {
    if (session.session_id === currentSessionId) return;
    try {
      const detail = await getSession(session.session_id);
      const msgs: ChatMessage[] = detail.messages.map((msg, idx) => ({
        id: `${session.session_id}-${idx}`,
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
        createdAt: msg.created_at ? new Date(msg.created_at).getTime() : Date.now(),
      }));
      setCurrentSessionId(session.session_id);
      setMessages(msgs);
    } catch (err) {
      console.error('[Sidebar] Failed to load session:', err);
    }
  }, [currentSessionId, setCurrentSessionId, setMessages]);

  const handleRenameSession = useCallback(async (sid: string, newTitle: string) => {
    try {
      await renameSession(sid, newTitle);
      setSessionList((prev) =>
        prev.map((s) => s.session_id === sid ? { ...s, title: newTitle } : s)
      );
    } catch (err) {
      console.error('[Sidebar] Failed to rename session:', err);
    }
  }, [setSessionList]);

  const handleDeleteSession = useCallback(async (sid: string) => {
    try {
      await deleteSession(sid);
      setSessionList((prev) => prev.filter((s) => s.session_id !== sid));
      // If we deleted the active session, start fresh
      if (sid === currentSessionId) {
        onNewChat();
      }
    } catch (err) {
      console.error('[Sidebar] Failed to delete session:', err);
    }
  }, [currentSessionId, setSessionList, onNewChat]);

  return (
    <>
      {/* Sidebar panel */}
      <aside
        className={`flex-shrink-0 h-full bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 flex flex-col overflow-hidden ${
          isOpen ? 'w-[260px]' : 'w-0'
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
  <div className="flex items-center gap-2">
    
    {/* New Chat Button */}
    <button
      onClick={onNewChat}
      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-600 active:bg-indigo-700 text-white text-sm font-medium transition-colors"
    >
      <Plus className="w-4 h-4" />
      New Chat
    </button>

    {/* Sidebar Toggle */}
    <button
      onClick={() => setIsOpen(false)}
      className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      title="Collapse sidebar"
    >
      <ChevronLeft className="w-4 h-4" />
    </button>

  </div>
</div>

        {/* Session list */}
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {sessionList.length === 0 ? (
            <p className="text-center py-8 text-slate-400 dark:text-slate-500 text-xs">
              No conversations yet
            </p>
          ) : (
            sessionList.map((session) => (
              <SessionItem
                key={session.session_id}
                session={session}
                isActive={session.session_id === currentSessionId}
                onSelect={() => handleSelectSession(session)}
                onRename={(title) => handleRenameSession(session.session_id, title)}
                onDelete={() => handleDeleteSession(session.session_id)}
              />
            ))
          )}
        </div>
      </aside>

      {/* Collapse button (shows when sidebar is closed) */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed left-3 top-[72px] z-50 p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-md hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          title="Open sidebar"
        >
          <ChevronLeft className="w-4 h-4 text-slate-600 dark:text-slate-300 rotate-180" />
        </button>
      )}
    </>
  );
}
