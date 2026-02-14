import apiClient from './api';
import { RoadmapResponse } from '../types/api';

export const roadmapService = {
  /**
   * Generate a skill-based learning roadmap for jobs at the given company.
   * @param companyName - Target company name (e.g. Google, Amazon)
   * @returns Promise with roadmap markdown and jobs used
   */
  generateRoadmap: async (companyName: string): Promise<RoadmapResponse> => {
    const response = await apiClient.post<RoadmapResponse>('/roadmap/generate', {
      company_name: companyName.trim(),
    });
    return response.data;
  },
};

export default roadmapService;
