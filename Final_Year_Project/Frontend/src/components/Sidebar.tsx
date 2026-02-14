import React from 'react';
import { useAtom, useSetAtom } from 'jotai';
import { JobType, Industry } from '../store/store';
import { 
  selectedJobTypesAtom, 
  selectedIndustriesAtom, 
  salaryRangeAtom,
  resetFiltersAtom,
  activeFiltersCountAtom
} from '../store/store';
import { useAtomValue } from 'jotai';

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
    <aside className="w-full lg:w-64 flex-shrink-0 space-y-8">
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-soft sticky top-24">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-lg text-slate-900">Filters</h3>
            {activeFiltersCount > 0 && (
              <span className="bg-indigo-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                {activeFiltersCount}
              </span>
            )}
          </div>
          {activeFiltersCount > 0 && (
            <button 
              className="text-xs text-indigo-500 font-medium hover:underline"
              onClick={() => resetFilters()}
            >
              Clear all
            </button>
          )}
        </div>

        {/* Job Type Section */}
        <div className="mb-8">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
            Job Type
          </h4>
          <div className="space-y-3">
            {Object.values(JobType).map((type) => (
              <label key={type} className="flex items-center space-x-3 cursor-pointer group">
                <div className={`
                    w-4 h-4 rounded border flex items-center justify-center transition-colors
                    ${selectedJobTypes.includes(type) ? 'bg-indigo-500 border-indigo-500' : 'border-slate-300 bg-white group-hover:border-indigo-500'}
                `}>
                    {selectedJobTypes.includes(type) && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                    )}
                </div>
                <input 
                  type="checkbox" 
                  className="hidden"
                  checked={selectedJobTypes.includes(type)}
                  onChange={() => toggleJobType(type)}
                />
                <span className={`text-sm transition-colors ${selectedJobTypes.includes(type) ? 'text-slate-900 font-medium' : 'text-slate-600 group-hover:text-indigo-500'}`}>
                    {type}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Salary Range Section */}
        <div className="mb-8">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
            Salary Range
          </h4>
          <div className="relative pt-2">
            <input 
              type="range" 
              min="0" 
              max="150000" 
              step="5000"
              value={salaryRange}
              onChange={(e) => setSalaryRange(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-500" 
            />
            <div className="flex justify-between text-xs text-slate-500 mt-3 font-medium">
              <span>$0</span>
              <span className="text-indigo-500 font-bold">
                {salaryRange === 0 ? 'Any' : `$${(salaryRange/1000).toFixed(0)}k+`}
              </span>
            </div>
          </div>
        </div>

        {/* Industry Section */}
        <div>
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
            Industry
          </h4>
          <div className="space-y-3">
             {Object.values(Industry).map((ind) => (
              <label key={ind} className="flex items-center space-x-3 cursor-pointer group">
                <div className={`
                    w-4 h-4 rounded border flex items-center justify-center transition-colors
                    ${selectedIndustries.includes(ind) ? 'bg-indigo-500 border-indigo-500' : 'border-slate-300 bg-white group-hover:border-indigo-500'}
                `}>
                    {selectedIndustries.includes(ind) && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                    )}
                </div>
                <input 
                  type="checkbox" 
                  className="hidden"
                  checked={selectedIndustries.includes(ind)}
                  onChange={() => toggleIndustry(ind)}
                />
                <span className={`text-sm transition-colors ${selectedIndustries.includes(ind) ? 'text-slate-900 font-medium' : 'text-slate-600 group-hover:text-indigo-500'}`}>
                    {ind}
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;