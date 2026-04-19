import { useState, useEffect, useCallback, useRef } from 'react';
import { useAtom, useSetAtom } from 'jotai';
import { useUser } from '@clerk/clerk-react';
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
import { PlusCircle, Trash2, Pencil, ChevronRight, HelpCircle, Shield, History, Search, Bot, PanelLeftClose, SquarePen } from 'lucide-react';

function truncateTitle(title: string, maxLen = 30): string {
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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

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
      className={`group flex items-center gap-3 p-3 rounded-lg hover:translate-x-1 transition-transform duration-200 ${
        isActive
          ? 'bg-white dark:bg-neutral-800 text-primary shadow-sm'
          : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800/50'
      }`}
      onClick={onSelect}
      onKeyDown={(e) => e.key === 'Enter' && onSelect()}
    >
      <History className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-primary' : 'text-outline'}`} strokeWidth={2} />

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
            className="w-full px-1 py-0.5 text-xs bg-white dark:bg-neutral-900 border border-primary rounded focus:outline-none text-on-surface"
          />
        ) : (
          <span className="font-label text-xs font-semibold truncate block">
            {truncateTitle(session.title || 'New Chat')}
          </span>
        )}
      </div>

      <div className="flex items-center gap-1 flex-shrink-0 text-outline" onClick={(e) => e.stopPropagation()}>
        {isEditing ? null : (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
              className="p-1 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 transition opacity-0 group-hover:opacity-100"
              title="Rename"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleDeleteClick}
              className={`p-1 rounded transition-colors opacity-0 group-hover:opacity-100 ${
                showDeleteConfirm
                  ? 'text-error bg-error-container/30'
                  : 'hover:bg-neutral-200 dark:hover:bg-neutral-700'
              }`}
              title={showDeleteConfirm ? 'Click again to confirm delete' : 'Delete'}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Main Sidebar ──────────────────────────────────────────────────────────

interface ChatSidebarProps {
  onNewChat: () => void;
}

export default function ChatSidebar({ onNewChat }: ChatSidebarProps) {
  const { user } = useUser();
  const [isOpen, setIsOpen] = useAtom(chatSidebarOpenAtom);
  const [sessionList, setSessionList] = useAtom(chatSessionListAtom);
  const [currentSessionId, setCurrentSessionId] = useAtom(chatSessionIdAtom);
  const setMessages = useSetAtom(chatMessagesAtom);

  const userId = user?.id ?? 'guest';

  const loadSessions = useCallback(async () => {
    try {
      const sessions = await listSessions(userId);
      setSessionList(sessions);
    } catch (err) {
      console.error('[Sidebar] Failed to load sessions:', err);
    }
  }, [setSessionList, userId]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  useEffect(() => {
    (window as any).__reloadChatSidebar = loadSessions;
    return () => { delete (window as any).__reloadChatSidebar; };
  }, [loadSessions]);

  const handleSelectSession = useCallback(async (session: ChatSession) => {
    if (session.session_id === currentSessionId) return;
    try {
      const detail = await getSession(session.session_id, userId);
      const msgs: ChatMessage[] = detail.messages.map((msg: any, idx: number) => ({
        id: `${session.session_id}-${idx}`,
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
        createdAt: msg.created_at ? new Date(msg.created_at).getTime() : Date.now(),
        sources: Array.isArray(msg.sources) ? msg.sources : undefined,
        web_sources: Array.isArray(msg.web_sources) ? msg.web_sources : undefined,
      }));
      setCurrentSessionId(session.session_id);
      setMessages(msgs);
    } catch (err) {
      console.error('[Sidebar] Failed to load session:', err);
    }
  }, [currentSessionId, setCurrentSessionId, setMessages, userId]);

  const handleRenameSession = useCallback(async (sid: string, newTitle: string) => {
    try {
      await renameSession(sid, newTitle, userId);
      setSessionList((prev) =>
        prev.map((s) => s.session_id === sid ? { ...s, title: newTitle } : s)
      );
    } catch (err) {
      console.error('[Sidebar] Failed to rename session:', err);
    }
  }, [setSessionList, userId]);

  const handleDeleteSession = useCallback(async (sid: string) => {
    try {
      await deleteSession(sid, userId);
      setSessionList((prev) => prev.filter((s) => s.session_id !== sid));
      if (sid === currentSessionId) {
        onNewChat();
      }
    } catch (err) {
      console.error('[Sidebar] Failed to delete session:', err);
    }
  }, [currentSessionId, setSessionList, onNewChat, userId]);

  return (
    <>
      <aside
        className={`flex-shrink-0 h-full bg-neutral-50 dark:bg-neutral-900 border-r border-neutral-100 dark:border-neutral-800 transition-all duration-300 flex flex-col py-6 px-4 overflow-hidden relative z-10 ${
          isOpen ? 'w-72 opacity-100 translate-x-0' : 'w-0 opacity-0 -translate-x-full px-0 border-r-0'
        }`}
      >

        <div className="mb-4 px-2 flex-shrink-0">
          {/* Header row: Logo and Collapse */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2 px-1">
              <Bot className="w-6 h-6 text-neutral-800 dark:text-neutral-200" />
            </div>
            
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-200/50 dark:hover:bg-neutral-800 transition-colors"
              title="Close sidebar"
            >
              <PanelLeftClose className="w-5 h-5 stroke-[1.5]" />
            </button>
          </div>
          
          {/* New Chat Button */}
          <button
            onClick={onNewChat}
            className="w-full flex items-center gap-3 px-3 py-3 bg-neutral-200/60 hover:bg-neutral-200 dark:bg-neutral-800/80 dark:hover:bg-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-2xl text-sm font-medium transition-colors border border-transparent dark:border-neutral-700/50"
          >
            <SquarePen className="w-5 h-5 stroke-[1.5]" />
            <span className="text-[15px] font-label">New chat</span>
          </button>
          
          {/* Search Button */}
          <button
            className="w-full flex items-center gap-3 px-3 py-2 mt-2 hover:bg-neutral-200/60 dark:hover:bg-neutral-800/50 text-neutral-700 dark:text-neutral-300 rounded-lg text-sm transition-colors"
          >
             <Search className="w-5 h-5 stroke-[1.5]" />
             <span className="text-[15px] font-label">Search chats</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-1 content-start no-scrollbar">
          <p className="px-2 pb-2 font-label text-[10px] uppercase tracking-widest font-bold text-outline">Recent Chat</p>
          {sessionList.length === 0 ? (
            <p className="px-2 py-4 text-outline font-label text-xs">
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

        <div className="mt-auto pt-6 border-t border-neutral-100 dark:border-neutral-800 space-y-1 flex-shrink-0">
           <a className="flex items-center gap-3 p-3 rounded-lg text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800/50 transition-colors cursor-pointer">
              <HelpCircle className="w-4 h-4" />
              <span className="font-label text-xs font-semibold">Help</span>
           </a>
           <a className="flex items-center gap-3 p-3 rounded-lg text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800/50 transition-colors cursor-pointer">
              <Shield className="w-4 h-4" />
              <span className="font-label text-xs font-semibold">Privacy</span>
           </a>
        </div>
      </aside>

      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="absolute left-6 top-[100px] z-[40] p-2 rounded-lg bg-surface-container-lowest border border-outline-variant/30 shadow-md hover:bg-surface-container-low transition-colors text-on-surface"
          title="Open sidebar"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      )}
    </>
  );
}
