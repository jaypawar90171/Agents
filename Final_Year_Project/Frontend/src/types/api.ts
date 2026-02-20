// API Response Types
export interface ApiJob {
  _id: string;
  job_url: string;
  job_title: string;
  skills_required: string[];
  company: string;
  location: string;
  job_description_summary: string;
  ingested_at: string;
}

export interface ApiJobResponse {
  jobs: ApiJob[];
}

// Roadmap API types
export interface RoadmapJobUsed {
  company: string;
  job_title: string;
  location: string;
  skills_required: string[];
  job_url: string;
}

export interface RoadmapResponse {
  roadmap: string;
  jobs_used: RoadmapJobUsed[];
}

// UI Job Type (for display)
export interface Job {
  id: string;
  jobUrl: string;
  title: string;
  company: string;
  location: string;
  logo?: string;
  tags?: string[];
  tagColor?: string;
  // These will be used when viewing job details
  skills?: string[];
  description?: string;
  ingestedAt?: string;
}

export interface ChatSource {
  company?: string;
  job_title?: string;
  location?: string;
  skills_required?: string[];
  job_description_summary?: string;
  job_url?: string;
  score?: number;
}

export interface SendMessageRequest {
  message: string;
  session_id?: string | null;
}

export interface SendMessageResponse {
  reply: string;
  sources: ChatSource[];
  session_id: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: ChatSource[];
  createdAt: number;
}

export interface WeeklyProgress {
  weekNumber: number;
  isCompleted: boolean;
  completedAt?: string;
  notes?: string;
}

export interface RoadmapWeek {
  weekNumber: number;
  title: string;
  topics: string[];
  skills: string[];
  resources?: string[];
}

export interface RoadmapDetail {
  _id: string;
  title: string;
  targetCompany: string;
  roleTitle: string;
  description?: string;
  weeks: RoadmapWeek[];
  skillsTargeted: string[];
  createdAt: string;
}

export interface UserRoadmap {
  _id: string;
  userId: string;
  roadmapId: string;
  status: 'in-progress' | 'completed' | 'paused';
  overallProgress: number;
  weeklyProgress: WeeklyProgress[];
  skillsMastered: string[];
  startDate: string;
  lastAccessed: string;
  roadmap?: RoadmapDetail;
}