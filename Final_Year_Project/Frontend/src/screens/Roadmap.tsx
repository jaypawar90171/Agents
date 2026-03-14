import React, { useState } from "react";
import Header from "../components/Header";
import RoadmapDisplay from "../components/RoadMapDisplay";
import RoadmapJobsUsed from "../components/RoadmapJobsUsed";
import { useRoadmap } from "../hooks/useRoadmap";
import { useUser } from "@clerk/clerk-react";
import { Loader2, Zap } from "lucide-react";
import roadmapService from "../services/roadmapService";

const MIN_COMPANY_LENGTH = 3;

const Roadmap: React.FC = () => {
  const { user } = useUser();
  const { roadmap, loading, error, generateRoadmap } = useRoadmap();
  const [companyName, setCompanyName] = useState("");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [saveMessage, setSaveMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = companyName.trim();
    if (trimmed.length >= MIN_COMPANY_LENGTH) {
      const response = await generateRoadmap(trimmed);
      console.log(response);
    }
  };

  const handleAddToProfile = async () => {
    if (!roadmap?.roadmap) return;
    const userId = user?.id ?? "guest";
    setSaveStatus("saving");
    setSaveMessage("");
    try {
      const jobDetails = {
        company: companyName.trim() || undefined,
        role: roadmap.jobs_used?.[0]?.job_title ?? undefined,
        location: roadmap.jobs_used?.[0]?.location ?? undefined,
      };
      const response = await roadmapService.parseAndSaveRoadmap(roadmap.roadmap, userId, jobDetails);
      console.log("Saved Response: " + JSON.stringify(response.roadmap));
      setSaveStatus("success");
      setSaveMessage("Roadmap saved to your profile.");
    } catch (err) {
      setSaveStatus("error");
      setSaveMessage(err instanceof Error ? err.message : "Failed to save roadmap.");
    }
  };

  const canSubmit = companyName.trim().length >= MIN_COMPANY_LENGTH;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/20 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex flex-col font-sans">
      <Header />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-grow">
        {/* Hero Section */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xl font-semibold text-indigo-600 uppercase tracking-wide">
              Career Roadmap Generator
            </span>
          </div>
          <h1 className="text-4xl sm:text-3xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent mb-4">
            Your Path to Success
          </h1>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSubmit} className="mb-12">
          <div className="flex flex-col sm:flex-row gap-3 bg-white dark:bg-slate-900 p-2 rounded-2xl shadow-lg shadow-indigo-500/10 border border-slate-200 dark:border-slate-800">
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Enter Company Name e.g. Google, Amazon, Microsoft, Tesla"
              className="flex-1 px-6 py-4 rounded-xl border-0 outline-none text-lg placeholder-slate-400 dark:placeholder-slate-500 focus:ring-0 bg-transparent text-slate-900 dark:text-slate-100"
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

          {companyName.trim().length > 0 &&
            companyName.trim().length < MIN_COMPANY_LENGTH && (
              <p className="text-sm text-amber-600 mt-3 font-medium">
                💡 Company name must be at least {MIN_COMPANY_LENGTH}{" "}
                characters.
              </p>
            )}
        </form>

        {/* Error State */}
        {error && (
          <div className="mb-8 p-6 rounded-2xl bg-gradient-to-r from-red-50 to-red-100/50 dark:from-red-950/40 dark:to-red-900/30 border-2 border-red-200 dark:border-red-900 text-red-700 dark:text-red-300">
            <p className="font-semibold mb-1">⚠️ Error generating roadmap</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Save status message */}
        {saveStatus === "success" && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 border-2 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200">
            <p className="font-semibold">{saveMessage}</p>
          </div>
        )}
        {saveStatus === "error" && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border-2 border-red-200 dark:border-red-900 text-red-700 dark:text-red-300">
            <p className="font-semibold">{saveMessage}</p>
          </div>
        )}

        {/* Roadmap Display */}
        {roadmap && (
          <div className="space-y-8 animate-fadeIn">
            {/* Jobs Used Section */}
            {roadmap.jobs_used.length > 0 && (
              <div className="rounded-3xl bg-white dark:bg-slate-900 border-2 border-indigo-200 dark:border-indigo-500/50 shadow-xl shadow-indigo-500/10 p-8">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-indigo-500 text-white flex items-center justify-center text-sm font-bold">
                    💼
                  </span>
                  Jobs Used in This Roadmap
                </h2>
                <RoadmapJobsUsed jobs={roadmap.jobs_used} />
              </div>
            )}

            {/* Main Roadmap */}
            <div className="rounded-3xl bg-white dark:bg-slate-900 border-2 border-indigo-200 dark:border-indigo-500/50 shadow-xl shadow-indigo-500/10 p-8">
              <RoadmapDisplay
                content={roadmap.roadmap}
                onAddToProfile={handleAddToProfile}
                isSaving={saveStatus === "saving"}
              />
            </div>
          </div>
        )}

        {/* Empty State */}
        {!roadmap && !loading && (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-indigo-100 to-blue-100 dark:from-indigo-950/60 dark:to-blue-950/40 flex items-center justify-center">
              <Zap className="w-12 h-12 text-indigo-500" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
              Ready to start your learning journey?
            </h3>
            <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto">
              Search for a company above to generate a personalized roadmap with
              essential skills and learning milestones.
            </p>
          </div>
        )}
      </main>

      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 mt-auto py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-sm text-slate-500 dark:text-slate-400 text-center md:text-left font-medium">
            © 2026 LearnLaunch. All rights reserved.{" "}
            <br className="md:hidden" /> Designed for future leaders.
          </p>
          <div className="flex gap-8">
            <a
              href="#"
              className="text-sm text-slate-500 hover:text-indigo-500 font-medium transition-colors"
            >
              Privacy
            </a>
            <a
              href="#"
              className="text-sm text-slate-500 hover:text-indigo-500 font-medium transition-colors"
            >
              Terms
            </a>
            <a
              href="#"
              className="text-sm text-slate-500 hover:text-indigo-500 font-medium transition-colors"
            >
              Support
            </a>
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
