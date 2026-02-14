import axios from 'axios';
import { RoadmapResponse } from '../types/api';

// Update this to match your backend URL
const API_BASE_URL = 'http://localhost:8000';

class RoadmapService {
  /**
   * Generate a learning roadmap for a company
   * @param companyName - Name of the target company
   * @returns Promise with roadmap data
   */
  async generateRoadmap(companyName: string): Promise<RoadmapResponse> {
    try {
      const response = await axios.post<RoadmapResponse>(
        `${API_BASE_URL}/roadmap/generate`,
        {
          company_name: companyName,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 60000, // 60 second timeout for LLM generation
        }
      );

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        // Handle specific error responses from backend
        if (error.response?.status === 400) {
          throw new Error(error.response.data.detail || 'Invalid company name');
        } else if (error.response?.status === 404) {
          throw new Error(error.response.data.detail || 'No jobs found for this company');
        } else if (error.response?.status === 503) {
          throw new Error(error.response.data.detail || 'Service temporarily unavailable');
        }
      }
      throw error;
    }
  }
}

// Export singleton instance
const roadmapService = new RoadmapService();
export default roadmapService;