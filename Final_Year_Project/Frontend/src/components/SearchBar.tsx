import React from 'react';
import { Search } from 'lucide-react';
import { useAtom } from 'jotai';
import { searchQueryAtom } from '../store/store';

const SearchBar: React.FC = () => {
  const [query, setQuery] = useAtom(searchQueryAtom);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl p-4 shadow-soft mb-8 border border-slate-200 dark:border-slate-800">
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-grow w-full">
          <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 dark:text-slate-500">
            <Search size={20} />
          </span>
          <input 
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full py-3.5 pl-12 pr-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder-slate-400 dark:placeholder-slate-500 transition-all font-medium text-slate-800 dark:text-slate-100"
            placeholder="Search companies, roles, skills..." 
          />
        </div>
      </div>
    </div>
  );
};

export default SearchBar;