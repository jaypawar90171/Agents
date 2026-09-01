import { useEffect } from 'react';
import { useAtom, useSetAtom } from 'jotai';
import { jobsDataAtom, jobsLoadingAtom, jobsErrorAtom } from '../store/store';
import jobService from '../services/jobService';
import { mapApiJobsToJobs } from '../utils/jobMapper';

interface UseJobsReturn {
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Custom hook to fetch jobs and sync with Jotai atoms
 * Jobs data is stored in jobsDataAtom and can be accessed anywhere in the app
 */
export const useJobs = (): UseJobsReturn => {
  const [loading, setLoading] = useAtom(jobsLoadingAtom);
  const [error, setError] = useAtom(jobsErrorAtom);
  const setJobs = useSetAtom(jobsDataAtom);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const apiJobs = await jobService.getAllJobs();
      const mappedJobs = mapApiJobsToJobs(apiJobs);
      
      setJobs(mappedJobs);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch jobs';
      setError(errorMessage);
      console.error('Error fetching jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    loading,
    error,
    refetch: fetchJobs,
  };
};