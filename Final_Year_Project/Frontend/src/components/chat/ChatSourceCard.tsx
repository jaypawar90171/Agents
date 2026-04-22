import React from 'react';
import { ExternalLink, Globe } from 'lucide-react';
import type { ChatSource, WebSource } from '../../types/api';

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
  const experience = source.experience;
  const salary = source.salary;
  const employmentType = source.employment_type;

  return (
    <div className="rounded-xl border border-outline-variant/20 bg-card p-4 shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-200">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-xs font-bold">
              {index}
            </span>
            <span className="font-bold text-on-surface">{title}</span>
          </div>
          <p className="text-sm text-primary mt-1 ml-8 font-medium">{company}</p>
          {location && (
            <p className="text-xs text-on-surface-variant mt-0.5 ml-8">📍 {location}</p>
          )}
        </div>
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 p-2 rounded-lg text-outline hover:text-primary hover:bg-primary/5 transition-colors"
            aria-label={`Open job: ${title}`}
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        )}
      </div>

      {(experience || salary || employmentType) && (
        <div className="flex flex-wrap gap-2 mt-3 ml-8">
          {experience && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 text-xs font-medium">
              💼 {experience}
            </span>
          )}
          {salary && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-green-50 dark:bg-green-950/50 text-green-700 dark:text-green-300 text-xs font-medium">
              💰 {salary}
            </span>
          )}
          {employmentType && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 text-xs font-medium">
              ⏰ {employmentType}
            </span>
          )}
        </div>
      )}

      {skills.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3 ml-8">
          {skills.slice(0, 6).map((s, i) => (
            <span
              key={i}
              className="inline-block px-2.5 py-1 rounded-lg bg-surface-container-low text-on-surface-variant text-xs font-medium"
            >
              {s}
            </span>
          ))}
          {skills.length > 6 && (
            <span className="text-xs text-outline self-center">+{skills.length - 6} more</span>
          )}
        </div>
      )}
      {summary && (
        <p className="text-xs text-on-surface-variant mt-3 ml-8 line-clamp-2 leading-relaxed">{summary}</p>
      )}
    </div>
  );
};

interface WebSourceCardProps {
  source: WebSource;
  index: number;
}

export const WebSourceCard: React.FC<WebSourceCardProps> = ({ source, index }) => {
  const title = source.title || 'Web Result';
  const url = source.url;
  const content = source.content;

  return (
    <div className="rounded-xl border border-outline-variant/20 bg-card p-4 shadow-sm hover:shadow-md hover:border-tertiary/30 transition-all duration-200">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-xs font-bold">
              {index}
            </span>
            <div className="flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="font-semibold text-on-surface text-sm line-clamp-1">{title}</span>
            </div>
          </div>
          {url && (
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 ml-8 truncate">{url}</p>
          )}
        </div>
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 p-2 rounded-lg text-outline hover:text-tertiary hover:bg-tertiary/5 transition-colors"
            aria-label={`Open: ${title}`}
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        )}
      </div>
      {content && (
        <p className="text-sm text-on-surface-variant mt-3 ml-8 line-clamp-3 leading-relaxed">{content}</p>
      )}
    </div>
  );
};
