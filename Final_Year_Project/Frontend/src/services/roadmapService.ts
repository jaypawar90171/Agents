import axios from 'axios';
import { RoadmapResponse, UserRoadmap, RoadmapDetail, WeeklyProgress } from '../types/api';

// Update this to match your backend URL
const API_BASE_URL = 'http://localhost:8000';

export interface SaveRoadmapPayload {
  content: string;
  userId: string;
  jobDetails?: {
    company?: string;
    role?: string;
    location?: string;
  };
}

export interface SaveRoadmapResponse {
  message: string;
  roadmap: Record<string, unknown>;
  userRoadmap: Record<string, unknown>;
}

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

  /**
   * Parse markdown roadmap content and save to MongoDB (backend parses and saves).
   * Use this when the user clicks "Save to Profile" / "Save This Roadmap".
   */
  async parseAndSaveRoadmap(
    content: string,
    userId: string,
    jobDetails?: SaveRoadmapPayload['jobDetails']
  ): Promise<SaveRoadmapResponse> {
    const response = await axios.post<SaveRoadmapResponse>(
      `${API_BASE_URL}/api/roadmaps/parse-and-save`,
      {
        content,
        userId,
        jobDetails: jobDetails ?? undefined,
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 15000,
      }
    );
    return response.data;
  }

/**
   * Save already-parsed roadmap data (e.g. when frontend has structured data).
   */
  async saveRoadmap(
    roadmapData: Record<string, unknown>,
    userId: string
  ): Promise<SaveRoadmapResponse> {
    const response = await axios.post<SaveRoadmapResponse>(
      `${API_BASE_URL}/api/roadmaps/save`,
      {
        roadmap_data: roadmapData,
        userId,
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 15000,
      }
    );
    return response.data;
  }

  async getUserRoadmaps(userId: string): Promise<UserRoadmap[]> {
    const response = await axios.get<UserRoadmap[]>(
      `${API_BASE_URL}/api/roadmaps/user/${userId}`,
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 15000,
      }
    );
    return response.data;
  }

  async getRoadmapById(roadmapId: string): Promise<RoadmapDetail> {
    const response = await axios.get<RoadmapDetail>(
      `${API_BASE_URL}/api/roadmaps/${roadmapId}`,
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 15000,
      }
    );
    return response.data;
  }

  async updateProgress(payload: {
    userRoadmapId: string;
    weekNumber: number;
    isCompleted: boolean;
    notes?: string;
  }): Promise<UserRoadmap> {
    const response = await axios.put<UserRoadmap>(
      `${API_BASE_URL}/api/roadmaps/progress`,
      payload,
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 15000,
      }
    );
    return response.data;
  }

  async deleteUserRoadmap(userRoadmapId: string): Promise<{ message: string }> {
    const response = await axios.delete<{ message: string }>(
      `${API_BASE_URL}/api/roadmaps/user/${userRoadmapId}`,
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 15000,
      }
    );
    return response.data;
  }
}

// Export singleton instance
const roadmapService = new RoadmapService();
export default roadmapService;