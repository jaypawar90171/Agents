import { Job } from '../types/api';
import { JobType, Industry } from './store';


// Additional store-related types can go here
export interface FilterState {
  searchQuery: string;
  selectedJobTypes: JobType[];
  selectedIndustries: Industry[];
  salaryRange: number;
  selectedLocation: string;
}

export interface JobsState {
  jobs: Job[];
  loading: boolean;
  error: string | null;
}