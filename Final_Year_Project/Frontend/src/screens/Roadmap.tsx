import React, { useState } from 'react';
import Header from '../components/Header';
import RoadmapMarkdown from '../components/RoadmapMarkdown';
import RoadmapJobsUsed from '../components/RoadmapJobsUsed';
import { useRoadmap } from '../hooks/useRoadmap';
import { Loader2 } from 'lucide-react';

const MIN_COMPANY_LENGTH = 3;

const Roadmap: React.FC = () => {
  const { roadmap, loading, error, generateRoadmap } = useRoadmap();
  const [companyName, setCompanyName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = companyName.trim();
    if (trimmed.length >= MIN_COMPANY_LENGTH) {
      generateRoadmap(trimmed);
    }
  };

  const canSubmit = companyName.trim().length >= MIN_COMPANY_LENGTH;

  return (
    <div className="min-h-screen bg-background-light flex flex-col font-sans">
      <Header />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-grow">
        <h1 className="text-2xl font-bold text-slate-900 mb-6">Career Roadmap</h1>
        <p className="text-slate-600 mb-6">
          Enter a company name to generate a skill-based learning roadmap for roles at that company.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 mb-8">
          <input
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="e.g. Google, Amazon, Microsoft"
            className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
            minLength={MIN_COMPANY_LENGTH}
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !canSubmit}
            className="px-6 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold shadow-md shadow-indigo-500/20 transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Generating…
              </>
            ) : (
              'Generate Roadmap'
            )}
          </button>
        </form>

        {companyName.trim().length > 0 && companyName.trim().length < MIN_COMPANY_LENGTH && (
          <p className="text-sm text-amber-600 mb-4">Company name must be at least {MIN_COMPANY_LENGTH} characters.</p>
        )}

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700">
            {error}
          </div>
        )}

        {roadmap && (
          <div className="space-y-8">
            {roadmap.jobs_used.length > 0 && (
              <RoadmapJobsUsed jobs={roadmap.jobs_used} />
            )}
            <RoadmapMarkdown content={roadmap.roadmap} />
          </div>
        )}
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

export default Roadmap;
