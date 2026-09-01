import apiClient from './api';
import { ApiJobResponse, ApiJob } from '../types/api';

export const jobService = { 
  /**
   * Fetch all jobs from the API
   * @returns Promise with jobs data
   */
  getAllJobs: async (): Promise<ApiJob[]> => {
    try {
      const response = await apiClient.get<ApiJobResponse>('/jobs');
      return response.data.jobs;
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
      throw error;
    }
  },
};

export default jobService;