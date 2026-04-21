import axios from 'axios';
import { SkillGapAnalysis, UserSkillRoadmap } from '../types/api';

const API_BASE_URL = 'http://localhost:8000';

export interface AnalyzeResumeResponse {
  success: boolean;
  analysis: SkillGapAnalysis;
  fileName: string;
}

export interface SaveAnalysisPayload {
  analysisData: SkillGapAnalysis;
  userId: string;
}

export interface SaveAnalysisResponse {
  message: string;
  roadmap: Record<string, unknown>;
  userSkillRoadmap: Record<string, unknown>;
}

class SkillAnalyzerService {
  async analyzeResume(file: File): Promise<AnalyzeResumeResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await axios.post<AnalyzeResumeResponse>(
      `${API_BASE_URL}/api/skills/analyze`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 180000,
      }
    );

    return response.data;
  }

  async saveAnalysis(
    analysisData: SkillGapAnalysis,
    userId: string,
    fileName: string
  ): Promise<SaveAnalysisResponse> {
    const response = await axios.post<SaveAnalysisResponse>(
      `${API_BASE_URL}/api/skills/save`,
      {
        analysis_data: { ...analysisData, fileName },
        userId,
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 15000,
      }
    );
    return response.data;
  }

  async getUserSkillRoadmaps(userId: string): Promise<UserSkillRoadmap[]> {
    const response = await axios.get<{ success: boolean; roadmaps: UserSkillRoadmap[] }>(
      `${API_BASE_URL}/api/skills/user/${userId}`,
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 15000,
      }
    );
    return response.data.roadmaps;
  }

  async getSkillRoadmapById(id: string): Promise<SkillGapAnalysis> {
    const response = await axios.get<{ success: boolean; roadmap: SkillGapAnalysis }>(
      `${API_BASE_URL}/api/skills/${id}`,
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 15000,
      }
    );
    return response.data.roadmap;
  }

  async updateSkillProgress(payload: {
    userSkillRoadmapId: string;
    skill: string;
    isCompleted: boolean;
    notes?: string;
  }): Promise<UserSkillRoadmap> {
    const response = await axios.put<{ message: string; userSkillRoadmap: UserSkillRoadmap }>(
      `${API_BASE_URL}/api/skills/progress`,
      payload,
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 15000,
      }
    );
    return response.data.userSkillRoadmap;
  }

  async updateSkillStatus(payload: {
    userSkillRoadmapId: string;
    status: 'in-progress' | 'completed' | 'paused';
  }): Promise<UserSkillRoadmap> {
    const response = await axios.put<{ message: string; userSkillRoadmap: UserSkillRoadmap }>(
      `${API_BASE_URL}/api/skills/progress`,
      payload,
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 15000,
      }
    );
    return response.data.userSkillRoadmap;
  }

  async deleteSkillRoadmap(id: string): Promise<{ message: string }> {
    const response = await axios.delete<{ message: string }>(
      `${API_BASE_URL}/api/skills/user/${id}`,
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 15000,
      }
    );
    return response.data;
  }
}

const skillAnalyzerService = new SkillAnalyzerService();
export default skillAnalyzerService;