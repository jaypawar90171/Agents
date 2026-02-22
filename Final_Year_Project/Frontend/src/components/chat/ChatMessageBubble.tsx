import React from 'react';
import ReactMarkdown from 'react-markdown';
import type { ChatMessage as ChatMessageType } from '../../types/api';
import { ChatSourceCard, WebSourceCard } from './ChatSourceCard';

interface ChatMessageBubbleProps {
  message: ChatMessageType;
}

const ReactMarkdownComponents = {
  p: ({ children }: { children?: React.ReactNode }) => (
    <p className="mb-3 last:mb-0 leading-7">{children}</p>
  ),
  strong: ({ children }: { children?: React.ReactNode }) => (
    <strong className="font-semibold text-slate-900 dark:text-slate-100">{children}</strong>
  ),
  ul: ({ children }: { children?: React.ReactNode }) => (
    <ul className="list-disc pl-6 mb-3 space-y-1">{children}</ul>
  ),
  ol: ({ children }: { children?: React.ReactNode }) => (
    <ol className="list-decimal pl-6 mb-3 space-y-1">{children}</ol>
  ),
  li: ({ children }: { children?: React.ReactNode }) => (
    <li className="text-slate-700 dark:text-slate-200">{children}</li>
  ),
  h1: ({ children }: { children?: React.ReactNode }) => (
    <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2 mt-4">{children}</h1>
  ),
  h2: ({ children }: { children?: React.ReactNode }) => (
    <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2 mt-3">{children}</h2>
  ),
  h3: ({ children }: { children?: React.ReactNode }) => (
    <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-1 mt-2">{children}</h3>
  ),
  code: ({ children }: { children?: React.ReactNode }) => (
    <code className="px-1.5 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-sm font-mono">{children}</code>
  ),
  a: ({ href, children }: { href?: string; children?: React.ReactNode }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:underline">{children}</a>
  ),
  blockquote: ({ children }: { children?: React.ReactNode }) => (
    <blockquote className="border-l-4 border-indigo-300 dark:border-indigo-600 pl-4 my-3 italic text-slate-600 dark:text-slate-300">{children}</blockquote>
  ),
  hr: () => <hr className="my-4 border-slate-200 dark:border-slate-700" />,
};

export const ChatMessageBubble: React.FC<ChatMessageBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <div
      className={`flex w-full gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
      data-role={message.role}
    >
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-semibold shadow-md">
          AI
        </div>
      )}
      <div
        className={`flex flex-col max-w-[85%] sm:max-w-[75%] ${
          isUser ? 'items-end' : 'items-start'
        }`}
      >
        <div
          className={`rounded-2xl px-5 py-4 text-[15px] shadow-sm ${
            isUser
              ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-br-md'
              : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-bl-md'
          }`}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap break-words leading-relaxed">{message.content}</p>
          ) : (
            <div className="prose prose-slate dark:prose-invert max-w-none">
              <ReactMarkdown components={ReactMarkdownComponents}>
                {message.content}
              </ReactMarkdown>
            </div>
          )}
        </div>
        {!isUser && message.sources && message.sources.length > 0 && (
          <div className="mt-4 w-full space-y-2">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide px-1 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
              Job Sources ({Math.min(message.sources.length, 2)})
            </p>
            <div className="flex flex-col gap-2">
              {message.sources.slice(0, 2).map((source, idx) => (
                <ChatSourceCard key={idx} source={source} index={idx + 1} />
              ))}
            </div>
          </div>
        )}
        {!isUser && message.web_sources && message.web_sources.length > 0 && (
          <div className="mt-4 w-full space-y-2">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide px-1 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Web Sources ({message.web_sources.length})
            </p>
            <div className="flex flex-col gap-2">
              {message.web_sources.map((source, idx) => (
                <WebSourceCard key={idx} source={source} index={idx + 1} />
              ))}
            </div>
          </div>
        )}
      </div>
      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-slate-400 to-slate-600 dark:from-slate-600 dark:to-slate-800 flex items-center justify-center text-white text-xs font-medium shadow-md">
          U
        </div>
      )}
    </div>
  );
};
