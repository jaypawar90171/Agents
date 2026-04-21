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
  role?: string;
  experience?: string;
  salary?: string;
  employment_type?: string;
  posted_date?: string;
}

export interface WebSource {
  title: string;
  url: string;
  content?: string;
}

export interface SendMessageRequest {
  message: string;
  session_id?: string | null;
  userId: string;
}

export interface SendMessageResponse {
  reply: string;
  sources: ChatSource[];
  web_sources: WebSource[];
  session_id: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: ChatSource[];
  web_sources?: WebSource[];
  createdAt: number;
}

export interface ChatSession {
  session_id: string;
  title: string;
  created_at: string;
  message_count: number;
}

export interface ChatSessionDetail {
  session_id: string;
  title: string;
  created_at: string;
  messages: {
    role: 'user' | 'assistant';
    content: string;
    created_at: string;
  }[];
}

export interface WeeklyProgress {
  weekNumber: number;
  isCompleted: boolean;
  completedAt?: string;
  notes?: string;
  subProgress?: {
    whatYoullLearn: boolean[];
    studyPlan: boolean[];
    handsOnPractice: boolean[];
  };
}

export interface Resource {
  name: string;
  url: string;
}

export interface StudyPlanItem {
  dayRange: string;
  content: string;
}

export interface RoadmapWeek {
  weekNumber: number;
  topic: string;
  whatYoullLearn: string[];
  studyPlan: StudyPlanItem[];
  handsOnPractice: string[];
  resources: Resource[];
  successCriteria: string[];
}

export interface RoadmapDetail {
  _id: string;
  title: string;
  targetCompany: string;
  roleTitle: string;
  totalDurationWeeks: number;
  totalSkills: number;
  skills: string[];
  weeks: RoadmapWeek[];
  metadata?: {
    location?: string;
    createdAt?: string;
  };
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

// Skill Gap Analysis types
export interface SkillContext {
  name: string;
  context: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
}

export interface ImpliedSkill {
  name: string;
  inferred_from: string;
  reasoning: string;
}

export interface ValidatedGap {
  skill: string;
  importance: 'Critical' | 'Competitive Edge';
  frequency: number;
  validation_reason?: string;
}

export interface LearningResource {
  title: string;
  url: string;
  resource_type: string;
  is_free: boolean;
}

export interface WeeklyTask {
  week_label: string;
  topic: string;
  tasks: string[];
  milestone: string;
}

export interface SkillLearningStep {
  skill: string;
  importance: string;
  why_it_matters: string;
  leverage_from_background: string;
  time_estimate: string;
  resources: LearningResource[];
  weekly_breakdown: WeeklyTask[];
  capstone_project: string;
  resume_bullet: string;
}

export interface SkillGapAnalysis {
  profile: {
    summary: string;
    skills: SkillContext[];
    target_roles: string[];
    seniority_level: string;
  };
  expanded_skills: {
    all_skills: string[];
    implied_skills: ImpliedSkill[];
  };
  matches: { title: string; required_skills: string[]; score: number; url: string }[];
  validated_gaps: ValidatedGap[];
  roadmap: {
    seniority_level: string;
    total_timeline: string;
    learning_sequence: string[];
    action_plan: SkillLearningStep[];
    market_outlook: string;
  };
}

export interface UserSkillRoadmap {
  _id: string;
  userId: string;
  skillRoadmapId: string;
  status: 'in-progress' | 'completed' | 'paused';
  overallProgress: number;
  skillProgress: { skill: string; isCompleted: boolean; completedAt?: string; notes?: string }[];
  startDate: string;
  lastAccessed: string;
  analysis?: SkillGapAnalysis;
}