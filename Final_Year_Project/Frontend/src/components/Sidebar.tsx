import React from 'react';
import { useAtom, useSetAtom, useAtomValue } from 'jotai';
import { 
  JobType, 
  Industry,
  selectedJobTypesAtom, 
  selectedIndustriesAtom, 
  salaryRangeAtom,
  resetFiltersAtom,
  activeFiltersCountAtom
} from '../store/store';

const Sidebar: React.FC = () => {
  const [selectedJobTypes, setSelectedJobTypes] = useAtom(selectedJobTypesAtom);
  const [selectedIndustries, setSelectedIndustries] = useAtom(selectedIndustriesAtom);
  const [salaryRange, setSalaryRange] = useAtom(salaryRangeAtom);
  const resetFilters = useSetAtom(resetFiltersAtom);
  const activeFiltersCount = useAtomValue(activeFiltersCountAtom);

  const toggleJobType = (type: JobType) => {
    setSelectedJobTypes(prev => 
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const toggleIndustry = (industry: Industry) => {
    setSelectedIndustries(prev => 
      prev.includes(industry) ? prev.filter(i => i !== industry) : [...prev, industry]
    );
  };

  return (
    <aside className="w-full lg:w-64 flex-shrink-0">
      <div className="sticky top-28 space-y-10">
        <div>
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-label text-xs uppercase tracking-widest text-tertiary font-semibold">
              Filter Results {activeFiltersCount > 0 && `(${activeFiltersCount})`}
            </h3>
            {activeFiltersCount > 0 && (
              <button 
                onClick={() => resetFilters()} 
                className="text-xs text-primary font-bold hover:underline font-label uppercase tracking-widest"
              >
                Clear
              </button>
            )}
          </div>
          
          <div className="space-y-8">
            {/* Job Type Section */}
            <div className="space-y-4">
              <label className="font-headline text-lg text-on-surface">Job Type</label>
              <div className="space-y-3">
                {Object.values(JobType).map((type) => (
                  <label key={type} className="flex items-center gap-3 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      className="rounded-sm border-outline-variant text-primary focus:ring-primary w-4 h-4"
                      checked={selectedJobTypes.includes(type)}
                      onChange={() => toggleJobType(type)}
                    />
                    <span className="font-label text-sm text-on-surface-variant group-hover:text-on-surface transition-colors">
                      {type}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Salary Range Section */}
            <div className="space-y-4">
              <label className="font-headline text-lg text-on-surface">Salary Range</label>
              <div className="px-2">
                <input 
                  type="range" 
                  min="0" 
                  max="150000" 
                  step="5000"
                  value={salaryRange}
                  onChange={(e) => setSalaryRange(Number(e.target.value))}
                  className="w-full h-1 bg-surface-container-high rounded-full appearance-none accent-primary"
                />
                <div className="flex justify-between mt-3">
                  <span className="font-label text-xs text-outline">$0k</span>
                  <span className="font-label text-xs text-primary font-bold">
                    {salaryRange === 0 ? 'Any' : `$${(salaryRange/1000).toFixed(0)}k+`}
                  </span>
                  <span className="font-label text-xs text-outline">$150k</span>
                </div>
              </div>
            </div>

            {/* Industry Section */}
            <div className="space-y-4">
              <label className="font-headline text-lg text-on-surface">Industry</label>
              <div className="space-y-3">
                {Object.values(Industry).map((ind) => (
                  <label key={ind} className="flex items-center gap-3 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      className="rounded-sm border-outline-variant text-primary focus:ring-primary w-4 h-4"
                      checked={selectedIndustries.includes(ind)}
                      onChange={() => toggleIndustry(ind)}
                    />
                    <span className="font-label text-sm text-on-surface-variant group-hover:text-on-surface transition-colors">
                      {ind}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Archival Accent */}
        <div className="p-6 bg-tertiary/5 rounded-xl border-l-2 border-tertiary">
          <p className="font-label text-xs leading-relaxed text-on-tertiary-fixed-variant">
            Curated insights based on your recent activity and saved roadmaps.
          </p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;