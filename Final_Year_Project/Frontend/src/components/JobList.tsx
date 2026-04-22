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
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <p className="font-label text-sm text-on-surface-variant font-medium">Loading jobs...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 p-8">
        <div className="w-16 h-16 rounded-full bg-error-container flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-error" />
        </div>
        <h3 className="font-headline text-xl text-on-surface">Failed to Load Jobs</h3>
        <p className="font-body text-on-surface-variant text-center max-w-md">{error}</p>
        <button
          onClick={refetch}
          className="mt-4 px-6 py-3 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-label text-xs uppercase tracking-widest font-bold transition-all flex items-center gap-2"
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
        <div className="w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-outline" />
        </div>
        <h3 className="font-headline text-xl text-on-surface">No Jobs Found</h3>
        <p className="font-body text-on-surface-variant text-center max-w-md">
          No jobs match your current filters. Try adjusting your search criteria.
        </p>
      </div>
    );
  }

  const getPaginationRange = () => {
    const totalNumbers = 5;
    const siblingCount = 1;

    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
    const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

    const shouldShowLeftDots = leftSiblingIndex > 2;
    const shouldShowRightDots = rightSiblingIndex < totalPages - 2;

    if (!shouldShowLeftDots && shouldShowRightDots) {
      let leftItemCount = 3 + 2 * siblingCount;
      let leftRange = Array.from({ length: leftItemCount }, (_, i) => i + 1);
      return [...leftRange, '...', totalPages];
    }

    if (shouldShowLeftDots && !shouldShowRightDots) {
      let rightItemCount = 3 + 2 * siblingCount;
      let rightRange = Array.from({ length: rightItemCount }, (_, i) => totalPages - rightItemCount + i + 1);
      return [1, '...', ...rightRange];
    }

    if (shouldShowLeftDots && rightSiblingIndex) {
      let middleRange = Array.from(
        { length: rightSiblingIndex - leftSiblingIndex + 1 },
        (_, i) => leftSiblingIndex + i
      );
      return [1, '...', ...middleRange, '...', totalPages];
    }
  };

  return (
    <div>
      {/* Jobs grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {currentJobs.map((job: Job) => (
          <JobCard key={job.id} job={job} />
        ))}
      </div>

      {/* Pagination controls */}
      {totalPages > 1 && (
        <nav className="mt-20 flex justify-center">
          <div className="inline-flex items-center gap-2 font-headline text-sm">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className={`px-4 py-2 transition-all flex items-center gap-2 ${
                currentPage === 1 ? 'text-outline cursor-not-allowed' : 'text-on-surface-variant hover:text-on-surface opacity-80 hover:opacity-100'
              }`}
            >
              Previous
            </button>

            <div className="flex items-center gap-1">
              {getPaginationRange()?.map((page, index) => {
                if (page === '...') {
                  return (
                    <span key={`dots-${index}`} className="px-2 text-outline">
                      ...
                    </span>
                  );
                }

                return (
                  <button
                    key={index}
                    onClick={() => setCurrentPage(page as number)}
                    className={`w-10 h-10 flex items-center justify-center transition-all ${
                      page === currentPage
                        ? 'text-primary font-bold underline underline-offset-4'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className={`px-4 py-2 transition-all flex items-center gap-2 ${
                currentPage === totalPages ? 'text-outline cursor-not-allowed' : 'text-on-surface-variant hover:text-on-surface opacity-80 hover:opacity-100'
              }`}
            >
              Next
            </button>
          </div>
        </nav>
      )}
    </div>
  );
};

export default JobList;