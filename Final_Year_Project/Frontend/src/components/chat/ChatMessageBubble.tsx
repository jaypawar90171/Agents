import React from 'react';
import ReactMarkdown from 'react-markdown';
import { useUser } from '@clerk/clerk-react';
import type { ChatMessage as ChatMessageType } from '../../types/api';
import { ChatSourceCard, WebSourceCard } from './ChatSourceCard';

interface ChatMessageBubbleProps {
  message: ChatMessageType;
}

const ReactMarkdownComponents = {
  p: ({ children }: { children?: React.ReactNode }) => (
    <p className="mb-4 last:mb-0 leading-relaxed font-body">{children}</p>
  ),
  strong: ({ children }: { children?: React.ReactNode }) => (
    <strong className="font-bold text-primary">{children}</strong>
  ),
  ul: ({ children }: { children?: React.ReactNode }) => (
    <ul className="list-disc pl-6 mb-4 space-y-2 font-body text-sm text-on-surface-variant leading-relaxed">{children}</ul>
  ),
  ol: ({ children }: { children?: React.ReactNode }) => (
    <ol className="list-decimal pl-6 mb-4 space-y-2 font-body text-sm text-on-surface-variant leading-relaxed">{children}</ol>
  ),
  li: ({ children }: { children?: React.ReactNode }) => (
    <li>{children}</li>
  ),
  h1: ({ children }: { children?: React.ReactNode }) => (
    <h1 className="text-2xl font-headline font-bold text-on-surface mb-3 mt-6">{children}</h1>
  ),
  h2: ({ children }: { children?: React.ReactNode }) => (
    <h2 className="text-xl font-headline font-bold text-on-surface mb-3 mt-5">{children}</h2>
  ),
  h3: ({ children }: { children?: React.ReactNode }) => (
    <h3 className="text-lg font-headline font-bold text-on-surface mb-2 mt-4">{children}</h3>
  ),
  code: ({ children }: { children?: React.ReactNode }) => (
    <code className="px-1.5 py-0.5 rounded-md bg-surface-container-low text-primary text-sm font-mono border border-outline-variant/30">{children}</code>
  ),
  a: ({ href, children }: { href?: string; children?: React.ReactNode }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-bold border-b-2 border-primary-container">{children}</a>
  ),
  blockquote: ({ children }: { children?: React.ReactNode }) => (
    <blockquote className="bg-surface-container-lowest border-l-4 border-primary p-6 italic font-headline text-neutral-600 bg-neutral-50 shadow-sm rounded-r-xl my-6">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-6 border-outline-variant/20" />,
};

export const ChatMessageBubble: React.FC<ChatMessageBubbleProps> = ({ message }) => {
  const { user } = useUser();
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <div className="flex gap-6 max-w-4xl mx-auto justify-end mb-6">
        <div className="max-w-[80%] bg-primary text-white p-5 rounded-2xl rounded-tr-none shadow-sm">
          <p className="font-body text-sm leading-relaxed whitespace-pre-wrap break-words">{message.content}</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-surface-container-highest flex-shrink-0 flex items-center justify-center mt-1 overflow-hidden">
          {user?.imageUrl ? (
            <img src={user.imageUrl} alt="User" className="w-full h-full object-cover" />
          ) : (
            <span className="font-label text-sm text-on-surface font-bold">U</span>
          )}
        </div>
      </div>
    );
  }

  // AI Message
  return (
    <div className="flex gap-6 max-w-4xl mx-auto mb-10">
      <div className="w-10 h-10 rounded-full bg-primary-container flex-shrink-0 flex items-center justify-center mt-1">
        <span className="font-headline text-white text-xl font-bold italic">A</span>
      </div>
      <div className="space-y-4 flex-1 min-w-0">
        <div className="font-headline text-lg leading-relaxed text-on-surface text-justify">
          <div className="prose prose-slate dark:prose-invert max-w-none">
            <ReactMarkdown components={ReactMarkdownComponents}>
              {message.content}
            </ReactMarkdown>
          </div>
        </div>

        {/* Sources Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {message.sources && message.sources.length > 0 && message.sources.map((source, idx) => (
             <div key={idx} className="p-5 bg-surface-container-low rounded-xl border border-outline-variant/10">
               <h4 className="font-headline font-bold mb-2 flex items-center gap-2">
                 <span className="w-2 h-2 rounded-full bg-primary inline-block" /> Job Source
               </h4>
               <ChatSourceCard source={source} index={idx + 1} />
             </div>
          ))}
          {message.web_sources && message.web_sources.length > 0 && message.web_sources.map((source, idx) => (
            <div key={`web-${idx}`} className="p-5 bg-surface-container-low rounded-xl border border-outline-variant/10">
               <h4 className="font-headline font-bold mb-2 flex items-center gap-2 text-tertiary">
                 <span className="w-2 h-2 rounded-full bg-tertiary inline-block" /> Web Source
               </h4>
               <WebSourceCard source={source} index={idx + 1} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
