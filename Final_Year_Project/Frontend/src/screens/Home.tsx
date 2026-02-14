import React from 'react';
import { useAtomValue } from 'jotai';
import {filteredJobsAtom} from '../store/store';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import SearchBar from '../components/SearchBar';
import JobList from '../components/JobList';

const Home: React.FC = () => {
  const jobs = useAtomValue(filteredJobsAtom);

  return (
    <div className="min-h-screen bg-background-light flex flex-col font-sans">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-grow">
        <SearchBar />

        <div className="flex flex-col lg:flex-row gap-8">
          <Sidebar />

          <div className="flex-grow">
            <div className="flex flex-col sm:flex-row justify-between items-end mb-6 gap-2">
              <h2 className="text-2xl font-bold text-slate-900">Top Companies for You</h2>
              <span className="text-sm text-slate-500 font-medium">
                Showing <span className="font-bold text-primary">{jobs.length}</span> results
              </span>
            </div>

            
            <div className="min-h-screen bg-slate-50">
              <JobList />
            </div>

            {/* Pagination (Visual Only) */}
            <div className="flex justify-center">
              <nav className="inline-flex rounded-xl shadow-sm bg-white p-1 gap-1 border border-slate-200">
                <a href="#" className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-500 hover:bg-slate-50 transition-colors">Previous</a>
                <a href="#" className="px-4 py-2 rounded-lg text-sm font-bold bg-indigo-500 text-white shadow-md">1</a>
                <a href="#" className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">2</a>
                <a href="#" className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">3</a>
                <span className="px-4 py-2 text-sm font-semibold text-slate-400">...</span>
                <a href="#" className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">Next</a>
              </nav>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-slate-200 mt-auto py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-sm text-slate-500 text-center md:text-left font-medium">
            © 2024 LearnLaunch. All rights reserved. <br className="md:hidden" /> Designed for future leaders.
          </p>
          <div className="flex gap-8">
            <a href="#" className="text-sm text-slate-500 hover:text-indigo-500 font-medium transition-colors">Privacy</a>
            <a href="#" className="text-sm text-slate-500 hover:text-indigo-500 font-medium transition-colors">Terms</a>
            <a href="#" className="text-sm text-slate-500 hover:text-indigo-500 font-medium transition-colors">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
