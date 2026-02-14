import React from 'react';
import { MapPin, ExternalLink, Briefcase } from 'lucide-react';
import { RoadmapJobUsed } from '../types/api';

interface RoadmapJobsUsedProps {
  jobs: RoadmapJobUsed[];
}

const RoadmapJobsUsed: React.FC<RoadmapJobsUsedProps> = ({ jobs }) => {
  if (jobs.length === 0) return null;

  return (
    <div className="space-y-4">
      {jobs.map((job, index) => (
        <div
          key={`${job.company}-${job.job_title}-${index}`}
          className="flex flex-col gap-4 p-5 rounded-xl border-2 border-slate-100 hover:border-indigo-500/30 hover:bg-slate-50/50 transition-all duration-300 bg-white shadow-sm hover:shadow-md"
        >
          {/* Job Header */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-3">
                <div className="mt-1">
                  <Briefcase size={20} className="text-indigo-500" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-slate-900 text-lg mb-1">{job.job_title}</h4>
                  <p className="text-sm font-medium text-slate-700">{job.company}</p>
                  <div className="flex items-center gap-1.5 mt-1.5 text-sm text-slate-500">
                    <MapPin size={14} className="flex-shrink-0" />
                    <span>{job.location}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {job.job_url && (
              <a
                href={job.job_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors shrink-0"
              >
                View Job
                <ExternalLink size={14} />
              </a>
            )}
          </div>

          {/* Skills Section */}
          {job.skills_required && job.skills_required.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                Required Skills ({job.skills_required.length})
              </p>
              <div className="flex flex-wrap gap-2">
                {job.skills_required.map((skill, skillIndex) => (
                  <span
                    key={`${skill}-${skillIndex}`}
                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700 border border-indigo-200"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default RoadmapJobsUsed;