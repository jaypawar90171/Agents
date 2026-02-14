import React from 'react';
import { MapPin, ExternalLink } from 'lucide-react';
import { RoadmapJobUsed } from '../types/api';

interface RoadmapJobsUsedProps {
  jobs: RoadmapJobUsed[];
}

const RoadmapJobsUsed: React.FC<RoadmapJobsUsedProps> = ({ jobs }) => {
  if (jobs.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-soft p-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">Jobs used for this roadmap</h3>
      <ul className="space-y-3">
        {jobs.map((job, index) => (
          <li
            key={`${job.company}-${job.job_title}-${index}`}
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-4 rounded-lg border border-slate-100 hover:border-indigo-500/30 hover:bg-slate-50/50 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-900 truncate">{job.job_title}</p>
              <p className="text-sm text-slate-600">{job.company}</p>
              <div className="flex items-center gap-1.5 mt-1 text-sm text-slate-500">
                <MapPin size={14} className="flex-shrink-0" />
                <span>{job.location}</span>
              </div>
            </div>
            {job.job_url && (
              <a
                href={job.job_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-medium text-indigo-500 hover:text-indigo-600 shrink-0"
              >
                View job
                <ExternalLink size={14} />
              </a>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RoadmapJobsUsed;
