import React, { useEffect, useState } from 'react';
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

  // Pagination state
  const PAGE_SIZE = 12;
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(jobsCount / PAGE_SIZE));
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const currentJobs = filteredJobs.slice(startIndex, startIndex + PAGE_SIZE);

  // Reset or clamp page when filters or job count change
  useEffect(() => {
    setCurrentPage(1);
  }, [jobsCount]);

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
      <div className="mb-4 px-1 flex items-center justify-between text-sm text-slate-600 dark:text-slate-400">
        <p>
          Showing{' '}
          <span className="font-bold text-slate-900 dark:text-slate-100">
            {jobsCount === 0 ? 0 : startIndex + 1}-{Math.min(startIndex + PAGE_SIZE, jobsCount)}
          </span>{' '}
          of <span className="font-bold text-slate-900">{jobsCount}</span>{' '}
          {jobsCount === 1 ? 'job' : 'jobs'}
        </p>
        <p className="hidden sm:block text-xs text-slate-500 dark:text-slate-400">
          Page {currentPage} of {totalPages}
        </p>
      </div>

      {/* Jobs grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {currentJobs.map((job: Job) => (
          <JobCard key={job.id} job={job} />
        ))}
      </div>

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-8">
          <nav className="inline-flex rounded-xl shadow-sm bg-white dark:bg-slate-900 p-1 gap-1 border border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                currentPage === 1
                  ? 'text-slate-300 dark:text-slate-700 cursor-not-allowed'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              Previous
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                type="button"
                onClick={() => setCurrentPage(page)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  page === currentPage
                    ? 'bg-indigo-500 text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                {page}
              </button>
            ))}

            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                currentPage === totalPages
                  ? 'text-slate-300 dark:text-slate-700 cursor-not-allowed'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              Next
            </button>
          </nav>
        </div>
      )}
    </div>
  );
};

export default JobList;