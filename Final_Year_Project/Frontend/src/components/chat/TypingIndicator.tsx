import React from 'react';

export const TypingIndicator: React.FC = () => (
  <div className="flex w-full justify-start gap-3" data-role="assistant">
    <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center text-white text-sm font-semibold">
      AI
    </div>
    <div className="rounded-2xl rounded-bl-md bg-slate-100 border border-slate-200 px-4 py-3">
      <div className="flex gap-1.5">
        <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce [animation-delay:0ms]" />
        <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce [animation-delay:150ms]" />
        <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce [animation-delay:300ms]" />
      </div>
    </div>
  </div>
);
