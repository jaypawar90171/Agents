import { ApiJob, Job } from '../types/api';

// Company logo mapping (you can expand this or fetch from API later)
const companyLogos: Record<string, string> = {
  'BNP Paribas': 'https://logo.clearbit.com/bnpparibas.com',
  'BlackRock': 'https://logo.clearbit.com/blackrock.com',
  'Synechron': 'https://logo.clearbit.com/synechron.com',
};

// Generate tags based on job data
const generateTags = (apiJob: ApiJob): string[] => {
  const tags: string[] = [];
  
  // Check for seniority level in title
  if (apiJob.job_title.toLowerCase().includes('lead') || 
      apiJob.job_title.toLowerCase().includes('vice president')) {
    tags.push('Senior');
  } else if (apiJob.job_title.toLowerCase().includes('developer')) {
    tags.push('Mid-Level');
  }
  
  // Check for full-stack
  if (apiJob.job_title.toLowerCase().includes('full stack')) {
    tags.push('Full Stack');
  }
  
  // Default tag if empty
  if (tags.length === 0) {
    tags.push('Open');
  }
  
  return tags;
};

// Get tag color based on tag type
const getTagColor = (tags: string[]): string => {
  if (tags.includes('Senior')) return 'orange';
  if (tags.includes('Full Stack')) return 'blue';
  return 'green';
};

/**
 * Maps API job data to UI job format
 */
export const mapApiJobToJob = (apiJob: ApiJob): Job => {
  const tags = generateTags(apiJob);
  
  return {
    id: apiJob._id,
    jobUrl: apiJob.job_url,
    title: apiJob.job_title,
    company: apiJob.company,
    location: apiJob.location,
    logo: companyLogos[apiJob.company] || `https://ui-avatars.com/api/?name=${encodeURIComponent(apiJob.company)}&background=6366f1&color=fff`,
    tags,
    tagColor: getTagColor(tags),
    skills: apiJob.skills_required,
    description: apiJob.job_description_summary,
    ingestedAt: apiJob.ingested_at,
  };
};

/**
 * Maps array of API jobs to UI jobs
 */
export const mapApiJobsToJobs = (apiJobs: ApiJob[]): Job[] => {
  return apiJobs.map(mapApiJobToJob);
};