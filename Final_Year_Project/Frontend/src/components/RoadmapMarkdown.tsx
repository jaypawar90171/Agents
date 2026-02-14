import React from 'react';
import ReactMarkdown from 'react-markdown';

interface RoadmapMarkdownProps {
  content: string;
}

const RoadmapMarkdown: React.FC<RoadmapMarkdownProps> = ({ content }) => {
  return (
    <div className="roadmap-markdown bg-white rounded-xl border border-slate-200 shadow-soft p-6 sm:p-8 text-slate-700">
      <ReactMarkdown
        components={{
          h1: ({ children }) => <h1 className="text-2xl font-bold text-slate-900 mt-6 mb-4 first:mt-0">{children}</h1>,
          h2: ({ children }) => <h2 className="text-xl font-bold text-slate-900 mt-6 mb-3">{children}</h2>,
          h3: ({ children }) => <h3 className="text-lg font-semibold text-slate-800 mt-4 mb-2">{children}</h3>,
          p: ({ children }) => <p className="mb-3 leading-relaxed">{children}</p>,
          ul: ({ children }) => <ul className="list-disc list-inside mb-4 space-y-1">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal list-inside mb-4 space-y-1">{children}</ol>,
          li: ({ children }) => <li className="ml-2">{children}</li>,
          strong: ({ children }) => <strong className="font-semibold text-slate-800">{children}</strong>,
          code: ({ children }) => <code className="px-1.5 py-0.5 rounded bg-slate-100 text-sm font-mono">{children}</code>,
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:text-indigo-600 underline">
              {children}
            </a>
          ),
          hr: () => <hr className="my-6 border-slate-200" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default RoadmapMarkdown;
