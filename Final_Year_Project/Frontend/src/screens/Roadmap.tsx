import React, { useState } from 'react';
import Header from '../components/Header';
import RoadmapDisplay from '../components/RoadMapDisplay';
import RoadmapJobsUsed from '../components/RoadmapJobsUsed';
import { useRoadmap } from '../hooks/useRoadmap';
import { Loader2, Zap } from 'lucide-react';

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

  const handleAddToProfile = () => {
    // This will be connected to your backend
    console.log('Adding roadmap to profile:', companyName);
    // TODO: Implement API call to save roadmap to user profile
  };

  const canSubmit = companyName.trim().length >= MIN_COMPANY_LENGTH;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/20 to-slate-50 flex flex-col font-sans">
      <Header />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-grow">
        {/* Hero Section */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <Zap className="w-8 h-8 text-indigo-500" />
            <span className="text-sm font-semibold text-indigo-600 uppercase tracking-wide">Career Roadmap Generator</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent mb-4">
            Your Path to Success
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl">
            Enter a company name to get a personalized, skill-based learning roadmap tailored to their hiring requirements.
          </p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSubmit} className="mb-12">
          <div className="flex flex-col sm:flex-row gap-3 bg-white p-2 rounded-2xl shadow-lg shadow-indigo-500/10 border border-slate-200">
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="e.g. Google, Amazon, Microsoft, Tesla"
              className="flex-1 px-6 py-4 rounded-xl border-0 outline-none text-lg placeholder-slate-400 focus:ring-0 bg-transparent"
              minLength={MIN_COMPANY_LENGTH}
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !canSubmit}
              className="px-8 py-4 rounded-xl bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2 whitespace-nowrap"
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Generating…
                </>
              ) : (
                <>
                  <Zap size={18} />
                  Generate Roadmap
                </>
              )}
            </button>
          </div>

          {companyName.trim().length > 0 && companyName.trim().length < MIN_COMPANY_LENGTH && (
            <p className="text-sm text-amber-600 mt-3 font-medium">
              💡 Company name must be at least {MIN_COMPANY_LENGTH} characters.
            </p>
          )}
        </form>

        {/* Error State */}
        {error && (
          <div className="mb-8 p-6 rounded-2xl bg-gradient-to-r from-red-50 to-red-100/50 border-2 border-red-200 text-red-700">
            <p className="font-semibold mb-1">⚠️ Error generating roadmap</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Roadmap Display */}
        {roadmap && (
          <div className="space-y-8 animate-fadeIn">
            {/* Jobs Used Section */}
            {roadmap.jobs_used.length > 0 && (
              <div className="rounded-3xl bg-white border-2 border-indigo-200 shadow-xl shadow-indigo-500/10 p-8">
                <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-indigo-500 text-white flex items-center justify-center text-sm font-bold">
                    💼
                  </span>
                  Jobs Used in This Roadmap
                </h2>
                <RoadmapJobsUsed jobs={roadmap.jobs_used} />
              </div>
            )}

            {/* Main Roadmap */}
            <div className="rounded-3xl bg-white border-2 border-indigo-200 shadow-xl shadow-indigo-500/10 p-8">
              <RoadmapDisplay content={roadmap.roadmap} onAddToProfile={handleAddToProfile} />
            </div>
          </div>
        )}

        {/* Empty State */}
        {!roadmap && !loading && (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-indigo-100 to-blue-100 flex items-center justify-center">
              <Zap className="w-12 h-12 text-indigo-500" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              Ready to start your learning journey?
            </h3>
            <p className="text-slate-600 max-w-md mx-auto">
              Search for a company above to generate a personalized roadmap with essential skills and learning milestones.
            </p>
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

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.6s ease-out;
        }
      `}</style>
    </div>
  );
};

export default Roadmap;
