import React from 'react';
import { MapPin, ArrowRight } from 'lucide-react';
import { Job } from '../types/api';

interface JobCardProps {
  job: Job;
}

const JobCard: React.FC<JobCardProps> = ({ job }) => {
  const getTagStyle = (color?: string) => {
    switch(color) {
      case 'green': return 'bg-emerald-50 text-emerald-600';
      case 'blue': return 'bg-blue-50 text-blue-600';
      case 'orange': return 'bg-orange-50 text-orange-600';
      default: return 'bg-slate-50 text-slate-600';
    }
  };

  const handleApply = () => {
    // Open job URL in new tab
    if (job.jobUrl) {
      window.open(job.jobUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-soft hover:shadow-lg hover:border-indigo-500/30 transition-all duration-300 group flex flex-col h-full">
      <div className="flex justify-between items-start mb-5">
        <div className="w-14 h-14 rounded-xl bg-white p-2 shadow-sm border border-slate-100 flex items-center justify-center overflow-hidden">
          <img 
            src={job.logo} 
            alt={`${job.company} Logo`} 
            className="w-full h-full object-contain"
            onError={(e) => {
              // Fallback if logo fails to load
              e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(job.company)}&background=6366f1&color=fff`;
            }}
          />
        </div>
        {job.tags && job.tags.length > 0 && (
          <div className="flex gap-2">
            {job.tags.map(tag => (
              <span 
                key={tag} 
                className={`px-3 py-1 rounded-full text-xs font-bold ${getTagStyle(job.tagColor)}`}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
      
      <h3 className="text-xl font-bold text-slate-900 mb-1 group-hover:text-indigo-500 transition-colors">
        {job.company}
      </h3>
      
      <div className="flex items-center gap-1.5 text-slate-500 mb-6">
        <MapPin size={16} className="opacity-70" />
        <span className="text-sm font-medium">{job.location}</span>
      </div>
      
      <div className="space-y-3 mb-8 flex-grow">
        <div className="flex items-start text-sm">
          <span className="w-24 text-slate-400 font-medium flex-shrink-0">Role:</span>
          <span className="font-semibold text-slate-700 line-clamp-2">{job.title}</span>
        </div>
      </div>
      
      <button 
        onClick={handleApply}
        className="w-full py-3 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 group-hover:shadow-glow active:scale-95"
      >
        Apply Now
        <ArrowRight size={18} />
      </button>
    </div>
  );
};

export default JobCard;