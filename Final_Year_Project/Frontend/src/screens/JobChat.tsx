import { useCallback, useEffect, useRef } from "react";
import { useUser } from "@clerk/clerk-react";
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
  const { user } = useUser();
  const userId = user?.id ?? "";
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
        userId,
      });

      const activeSessionId = res.session_id;
      setSessionId(activeSessionId);

      // Auto-title: if this is the very first user message in the session, set title to it
      const isFirstMessage = messages.length === 0;
      if (isFirstMessage && activeSessionId) {
        const autoTitle = text.length > 40 ? text.slice(0, 40) + "…" : text;
        try {
          await renameSession(activeSessionId, autoTitle, userId);
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
      const { session_id } = await createSession(userId);
      setSessionId(session_id);
      // Reload sidebar so the new blank session appears
      if (typeof (window as any).__reloadChatSidebar === "function") {
        (window as any).__reloadChatSidebar();
      }
    })();
  }, [clearChat, setSession, setSessionId]);

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <Header />

      {/* Body: sidebar + chat area side by side */}
      <div className="flex flex-1 overflow-hidden">
        <ChatSidebar onNewChat={handleNewChat} />

        {/* Main Chat Area */}
        <main className="flex-1 flex flex-col bg-surface-container-lowest relative overflow-hidden">
          {/* Chat Header */}
          {/* <header className="h-16 flex items-center px-8 bg-surface-container-lowest z-10 border-b border-outline-variant/10">
            <h2 className="text-xl font-headline font-bold text-on-surface truncate">{activeSessionTitle}</h2>
            <div className="ml-auto flex items-center gap-4">
              <span className="px-3 py-1 bg-tertiary-fixed text-on-tertiary-fixed text-[10px] font-label font-bold uppercase tracking-wider rounded-full shadow-sm">Scholar Mode</span>
              <button className="p-2 hover:bg-surface-container-low rounded-full transition-colors text-outline">
                <MoreHorizontal className="w-5 h-5" />
              </button>
            </div>
          </header> */}

          {/* Chat Content */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto px-4 md:px-12 lg:px-24 py-10 space-y-12 no-scrollbar"
          >
            {/* Empty State */}
            {messages.length === 0 && !loading && (
              <div className="flex flex-col items-center justify-center py-16 text-center max-w-2xl mx-auto">
                <h2 className="text-3xl font-headline font-bold text-on-surface mb-4">
                  Welcome to Alexandria
                </h2>
                <p className="text-on-surface-variant font-body mb-10 max-w-lg leading-relaxed">
                  Your scholarly AI assistant. Ask questions about your career trajectory, market trends, or request a customized learning roadmap.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                  {[
                    "Generate a career path for a Senior UI/UX Designer",
                    "How do I negotiate my salary in 2026?",
                    "What are the highest demand tech skills?",
                    "Build me a roadmap for Data Science",
                  ].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setInput(s)}
                      className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/20 text-on-surface text-sm font-body hover:bg-surface-container hover:shadow-sm transition-all text-left group"
                    >
                      <span className="group-hover:text-primary transition-colors">{s}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Messages */}
            {messages.map((msg) => (
              <ChatMessageBubble key={msg.id} message={msg} />
            ))}

            {loading && (
              <div className="flex gap-6 max-w-4xl mx-auto">
                <div className="w-10 h-10 rounded-full bg-primary-container flex-shrink-0 flex items-center justify-center mt-1">
                  <span className="font-headline text-white font-bold italic">A</span>
                </div>
                <div className="flex items-center space-x-1 mt-3">
                  <TypingIndicator />
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="mb-3 rounded-xl bg-error-container border border-error/20 px-4 py-2 text-sm text-error flex-shrink-0">
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
