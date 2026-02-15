import React from 'react';
import { useAtomValue } from 'jotai';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import JobCard from './JobCard';
import { useJobs } from '../hooks/useJobs';
import { filteredJobsAtom, jobsCountAtom } from '../store/store';
import { Job } from '../types/api';

const JobList: React.FC = () => {
  const { loading, error, refetch } = useJobs();
  
  // Get filtered jobs from Jotai atom (automatically filtered by search and filters)
  const filteredJobs = useAtomValue(filteredJobsAtom);
  const jobsCount = useAtomValue(jobsCountAtom);

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
        <p className="text-slate-600 font-medium">Loading jobs...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 p-8">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <h3 className="text-xl font-bold text-slate-900">Failed to Load Jobs</h3>
        <p className="text-slate-600 text-center max-w-md">{error}</p>
        <button
          onClick={refetch}
          className="mt-4 px-6 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-500/20 transition-all flex items-center gap-2 active:scale-95"
        >
          <RefreshCw size={18} />
          Retry
        </button>
      </div>
    );
  }

  // Empty state (no jobs after filtering)
  if (filteredJobs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 p-8">
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="text-xl font-bold text-slate-900">No Jobs Found</h3>
        <p className="text-slate-600 text-center max-w-md">
          No jobs match your current filters. Try adjusting your search criteria.
        </p>
      </div>
    );
  }


  return (
    <div>
      {/* Results count */}
      <div className="mb-6 px-1">
        <p className="text-sm text-slate-600">
          Showing <span className="font-bold text-slate-900">{jobsCount}</span> {jobsCount === 1 ? 'job' : 'jobs'}
        </p>
      </div>
      
      {/* Jobs grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredJobs.map((job: Job) => (
          <JobCard key={job.id} job={job} />
        ))}
      </div>
    </div>
  );
};

export default JobList;