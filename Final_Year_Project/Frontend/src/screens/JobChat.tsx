import { useCallback, useEffect, useRef } from "react";
import { useAtom, useSetAtom } from "jotai";
import Header from "../components/Header";
import { ChatMessageBubble } from "../components/chat/ChatMessageBubble";
import { ChatInput } from "../components/chat/ChatInput";
import { TypingIndicator } from "../components/chat/TypingIndicator";
import ChatSidebar from "../components/chat/ChatSidebar";
import {
  chatSessionIdAtom,
  chatMessagesAtom,
  chatLoadingAtom,
  chatErrorAtom,
  chatInputAtom,
  chatSetSessionAtom,
  chatClearAtom,
  chatSessionListAtom,
} from "../store/chatAtoms";
import {
  sendMessage as sendMessageApi,
  createSession,
  renameSession,
} from "../services/chatService";
import type { ChatMessage } from "../types/api";
import { MessageSquare, PlusCircle, Briefcase } from "lucide-react";

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export default function JobChat() {
  const [sessionId, setSessionId] = useAtom(chatSessionIdAtom);
  const [messages, setMessages] = useAtom(chatMessagesAtom);
  const [loading, setLoading] = useAtom(chatLoadingAtom);
  const [error, setError] = useAtom(chatErrorAtom);
  const [input, setInput] = useAtom(chatInputAtom);
  const setSession = useSetAtom(chatSetSessionAtom);
  const clearChat = useSetAtom(chatClearAtom);
  const setSessionList = useSetAtom(chatSessionListAtom);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    setInput("");
    const userMsg: ChatMessage = {
      id: generateId(),
      role: "user",
      content: text,
      createdAt: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);
    setError(null);

    try {
      const res = await sendMessageApi({
        message: text,
        session_id: sessionId ?? undefined,
      });

      const activeSessionId = res.session_id;
      setSessionId(activeSessionId);

      // Auto-title: if this is the very first user message in the session, set title to it
      const isFirstMessage = messages.length === 0;
      if (isFirstMessage && activeSessionId) {
        const autoTitle = text.length > 40 ? text.slice(0, 40) + "…" : text;
        try {
          await renameSession(activeSessionId, autoTitle);
          // Update sidebar list optimistically
          setSessionList((prev) =>
            prev.map((s) =>
              s.session_id === activeSessionId ? { ...s, title: autoTitle } : s,
            ),
          );
        } catch {
          // Non-critical — ignore rename failure
        }
      }

      const assistantMsg: ChatMessage = {
        id: generateId(),
        role: "assistant",
        content: res.reply,
        sources: res.sources?.length ? res.sources.slice(0, 3) : undefined,
        web_sources: res.web_sources?.length ? res.web_sources.slice(0, 1) : undefined,
        createdAt: Date.now(),
      };
      setMessages((prev) => [...prev, assistantMsg]);

      // Refresh sidebar list so new sessions appear immediately
      if (typeof (window as any).__reloadChatSidebar === "function") {
        (window as any).__reloadChatSidebar();
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to get response";
      setError(message);
      setMessages((prev) => [
        ...prev,
        {
          id: generateId(),
          role: "assistant",
          content: `Sorry, something went wrong: ${message}. Please try again.`,
          createdAt: Date.now(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [
    input,
    loading,
    sessionId,
    messages.length,
    setInput,
    setMessages,
    setError,
    setSessionId,
    setSessionList,
  ]);

  const handleNewChat = useCallback(() => {
    clearChat();
    setSession(null);
    (async () => {
      const { session_id } = await createSession();
      setSessionId(session_id);
      // Reload sidebar so the new blank session appears
      if (typeof (window as any).__reloadChatSidebar === "function") {
        (window as any).__reloadChatSidebar();
      }
    })();
  }, [clearChat, setSession, setSessionId]);

  return (
    <div className="h-screen flex flex-col bg-slate-50/80 dark:bg-slate-950 overflow-hidden">
      <Header />

      {/* Body: sidebar + chat area side by side */}
      <div className="flex flex-1 overflow-hidden">
        <ChatSidebar onNewChat={handleNewChat} />

        {/* Chat area */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full px-4 py-6 overflow-hidden">
            {/* Title row */}
            <div className="flex items-center justify-between mb-6 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center text-white shadow-lg">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                    Job RAG Assistant
                  </h1>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Ask about roles, skills, jobs, or get career advice
                  </p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto space-y-6 pb-4 no-scrollbar"
            >
              {messages.length === 0 && !loading && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-300 mb-4">
                    <MessageSquare className="w-7 h-7" />
                  </div>
                  <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-1">
                    Start a conversation
                  </h2>
                  <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm mb-6">
                    Ask for job recommendations, skills for a role, or get
                    career advice. Try questions like "What is LangGraph?" for
                    web search results.
                  </p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {[
                      "Backend jobs in Bangalore",
                      "Skills needed for data scientist",
                      "What is LangGraph?",
                      "Jobs for Python developers in Pune",
                      "How do I write a resume?",
                    ].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setInput(s)}
                        className="px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-200 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 transition-colors"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg) => (
                <ChatMessageBubble key={msg.id} message={msg} />
              ))}
              {loading && <TypingIndicator />}
            </div>

            {/* Error */}
            {error && (
              <div className="mb-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 px-4 py-2 text-sm text-red-700 dark:text-red-300 flex-shrink-0">
                {error}
              </div>
            )}

            {/* Input */}
            <div className="pt-2 flex-shrink-0">
              <ChatInput
                value={input}
                onChange={setInput}
                onSend={handleSend}
                disabled={loading}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
