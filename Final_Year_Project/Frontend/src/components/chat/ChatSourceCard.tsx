import React from 'react';
import { ExternalLink } from 'lucide-react';
import type { ChatSource } from '../../types/api';

interface ChatSourceCardProps {
  source: ChatSource;
  index: number;
}

export const ChatSourceCard: React.FC<ChatSourceCardProps> = ({ source, index }) => {
  const title = source.job_title ?? 'Job';
  const company = source.company ?? 'Company';
  const location = source.location;
  const url = source.job_url;
  const skills = source.skills_required ?? [];
  const summary = source.job_description_summary;

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 shadow-sm hover:border-indigo-200 dark:hover:border-indigo-500/60 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold mr-2">
            {index}
          </span>
          <span className="font-semibold text-slate-900 dark:text-slate-100">{title}</span>
          <span className="text-slate-500 dark:text-slate-400"> at {company}</span>
          {location && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{location}</p>
          )}
        </div>
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors"
            aria-label={`Open job: ${title}`}
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        )}
      </div>
      {skills.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {skills.slice(0, 5).map((s, i) => (
            <span
              key={i}
              className="inline-block px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-200 text-xs"
            >
              {s}
            </span>
          ))}
          {skills.length > 5 && (
            <span className="text-xs text-slate-400 dark:text-slate-500">+{skills.length - 5}</span>
          )}
        </div>
      )}
      {summary && (
        <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 line-clamp-2">{summary}</p>
      )}
    </div>
  );
};
