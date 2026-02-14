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