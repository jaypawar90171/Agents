import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { Job } from '../types/api';

// ============================================================================
// ENUMS
// ============================================================================

export enum JobType {
  FULL_TIME = 'Full Time',
  PART_TIME = 'Part Time',
  CONTRACT = 'Contract',
  INTERNSHIP = 'Internship',
  REMOTE = 'Remote',
}

export enum Industry {
  TECHNOLOGY = 'Technology',
  FINANCE = 'Finance',
  HEALTHCARE = 'Healthcare',
  EDUCATION = 'Education',
  CONSULTING = 'Consulting',
  MANUFACTURING = 'Manufacturing',
}

// ============================================================================
// API DATA ATOMS
// ============================================================================

// Raw jobs data from API
export const jobsDataAtom = atom<Job[]>([]);

// Loading state for API calls
export const jobsLoadingAtom = atom<boolean>(false);

// Error state for API calls
export const jobsErrorAtom = atom<string | null>(null);

// ============================================================================
// SEARCH & FILTER ATOMS
// ============================================================================

// Search query
export const searchQueryAtom = atom<string>('');

// Job type filters
export const selectedJobTypesAtom = atomWithStorage<JobType[]>('selectedJobTypes', []);

// Industry filters
export const selectedIndustriesAtom = atomWithStorage<Industry[]>('selectedIndustries', []);

// Salary range filter (minimum salary)
export const salaryRangeAtom = atomWithStorage<number>('salaryRange', 0);

// Location filter
export const selectedLocationAtom = atom<string>('');

// ============================================================================
// DERIVED/COMPUTED ATOMS
// ============================================================================

/**
 * Filtered jobs based on search query and all filters
 * This is a derived atom that automatically updates when any dependency changes
 */
export const filteredJobsAtom = atom((get) => {
  const jobs = get(jobsDataAtom);
  const searchQuery = get(searchQueryAtom).toLowerCase();
  const selectedJobTypes = get(selectedJobTypesAtom);
  const selectedIndustries = get(selectedIndustriesAtom);
  const salaryRange = get(salaryRangeAtom);
  const selectedLocation = get(selectedLocationAtom);

  return jobs.filter((job) => {
    // Search filter - searches in company, title, location, and skills
    const matchesSearch = 
      searchQuery === '' ||
      job.company.toLowerCase().includes(searchQuery) ||
      job.title.toLowerCase().includes(searchQuery) ||
      job.location.toLowerCase().includes(searchQuery) ||
      (job.skills && job.skills.some(skill => 
        skill.toLowerCase().includes(searchQuery)
      ));

    // Job type filter
    const matchesJobType = 
      selectedJobTypes.length === 0 ||
      selectedJobTypes.some(type => 
        job.title.toLowerCase().includes(type.toLowerCase()) ||
        (job.description && job.description.toLowerCase().includes(type.toLowerCase()))
      );

    // Industry filter (map company to industry - you may need to enhance this)
    const matchesIndustry = 
      selectedIndustries.length === 0 ||
      selectedIndustries.some(industry => {
        // This is a simple mapping - you might want to add an industry field to your API
        const industryKeywords: Record<Industry, string[]> = {
          [Industry.TECHNOLOGY]: ['tech', 'software', 'it', 'developer', 'engineer'],
          [Industry.FINANCE]: ['bank', 'finance', 'trading', 'investment', 'bnp', 'blackrock'],
          [Industry.HEALTHCARE]: ['health', 'medical', 'pharma', 'hospital'],
          [Industry.EDUCATION]: ['university', 'school', 'education', 'training'],
          [Industry.CONSULTING]: ['consulting', 'advisory', 'synechron'],
          [Industry.MANUFACTURING]: ['manufacturing', 'production', 'industrial'],
        };

        const keywords = industryKeywords[industry] || [];
        return keywords.some(keyword => 
          job.company.toLowerCase().includes(keyword) ||
          job.title.toLowerCase().includes(keyword)
        );
      });

    // Salary filter (placeholder - you'll need to add salary data to your API)
    // For now, we'll just return true as salary data isn't in the current API
    const matchesSalary = true;

    // Location filter
    const matchesLocation = 
      selectedLocation === '' ||
      job.location.toLowerCase().includes(selectedLocation.toLowerCase());

    return matchesSearch && matchesJobType && matchesIndustry && matchesSalary && matchesLocation;
  });
});

/**
 * Jobs count atom - for displaying total results
 */
export const jobsCountAtom = atom((get) => {
  return get(filteredJobsAtom).length;
});

/**
 * Active filters count - for UI badges
 */
export const activeFiltersCountAtom = atom((get) => {
  let count = 0;
  if (get(selectedJobTypesAtom).length > 0) count++;
  if (get(selectedIndustriesAtom).length > 0) count++;
  if (get(salaryRangeAtom) > 0) count++;
  if (get(selectedLocationAtom) !== '') count++;
  return count;
});

/**
 * Reset all filters action atom
 */
export const resetFiltersAtom = atom(
  null,
  (get, set) => {
    set(searchQueryAtom, '');
    set(selectedJobTypesAtom, []);
    set(selectedIndustriesAtom, []);
    set(salaryRangeAtom, 0);
    set(selectedLocationAtom, '');
  }
);