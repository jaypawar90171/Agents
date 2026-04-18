import React, { useState, useRef } from 'react';
import Header from '../components/Header';
import { useUser } from '@clerk/clerk-react';
import { useSkillAnalyzer } from '../hooks/useSkillAnalyzer';
import { Loader2, Zap, Save, FileText, BarChart3, Target, BookOpen, CheckCircle } from 'lucide-react';
import { SkillUploadZone } from '../components/skillAnalyzer/SkillUploadZone';
import { PipelineProgress } from '../components/skillAnalyzer/PipelineProgress';
import { SkillsBreakdown } from '../components/skillAnalyzer/SkillsBreakdown';
import { GapAnalysisCard } from '../components/skillAnalyzer/GapAnalysisCard';
import { SkillRoadmapAccordion } from '../components/skillAnalyzer/SkillRoadmapAccordion';

const SkillAnalyzer: React.FC = () => {
  const { user } = useUser();
  const { 
    skillAnalysis, 
    loading, 
    error, 
    pipelineStep,
    analyzeResume, 
    saveToProfile,
    clearAnalysis,
  } = useSkillAnalyzer();
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setFileName(file.name);
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;
    await analyzeResume(selectedFile);
  };

  const handleSaveToProfile = async () => {
    if (!skillAnalysis || !user?.id) return;
    setSaveStatus('saving');
    try {
      await saveToProfile(skillAnalysis, user.id, fileName);
      setSaveStatus('success');
    } catch (err) {
      setSaveStatus('error');
    }
  };

  const handleNewAnalysis = () => {
    setSelectedFile(null);
    setFileName('');
    setSaveStatus('idle');
    clearAnalysis();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/20 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex flex-col font-sans">
      <Header />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-grow">
        {/* Hero Section */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xl font-semibold text-purple-600 uppercase tracking-wide">
              Career Development
            </span>
          </div>
          <h1 className="text-4xl sm:text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-4">
            Skill Gap Analyzer
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Upload your resume to identify skill gaps and get a personalized learning roadmap
          </p>
        </div>

        {/* Upload Section */}
        {!skillAnalysis && (
          <div className="mb-12 space-y-6">
            <SkillUploadZone 
              onFileSelect={handleFileSelect} 
              selectedFile={selectedFile}
              disabled={loading}
            />

            <button
              onClick={handleAnalyze}
              disabled={!selectedFile || loading}
              className="w-full px-8 py-4 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Zap size={18} />
                  Analyze Resume
                </>
              )}
            </button>
          </div>
        )}

        {/* Pipeline Progress */}
        {(loading || pipelineStep) && !skillAnalysis && (
          <div className="mb-12">
            <PipelineProgress 
              currentStep={pipelineStep}
              isComplete={!!skillAnalysis}
            />
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="mb-8 p-6 rounded-2xl bg-gradient-to-r from-red-50 to-red-100/50 dark:from-red-950/40 dark:to-red-900/30 border-2 border-red-200 dark:border-red-900 text-red-700 dark:text-red-300">
            <p className="font-semibold mb-1">Analysis Failed</p>
            <p className="text-sm mb-4">{error}</p>
            <button
              onClick={handleNewAnalysis}
              className="px-4 py-2 rounded-lg bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 text-sm font-medium hover:bg-red-200 dark:hover:bg-red-900"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Results Dashboard */}
        {skillAnalysis && (
          <div className="space-y-8 animate-fadeIn">
            {/* Header with Save */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleNewAnalysis}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <FileText size={18} />
                  New Analysis
                </button>
              </div>
              <button
                onClick={handleSaveToProfile}
                disabled={saveStatus === 'saving'}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:opacity-50 text-white font-semibold shadow-lg shadow-green-500/30 transition-all"
              >
                {saveStatus === 'saving' ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : saveStatus === 'success' ? (
                  <CheckCircle size={18} />
                ) : (
                  <Save size={18} />
                )}
                {saveStatus === 'success' ? 'Saved!' : 'Save to Profile'}
              </button>
            </div>

            {/* Profile Summary Card */}
            <div className="rounded-2xl bg-white dark:bg-slate-900 border-2 border-purple-200 dark:border-purple-500/50 shadow-xl shadow-purple-500/10 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
                  <BarChart3 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">
                  Profile Summary
                </h2>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Seniority Level</p>
                  <p className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                    {skillAnalysis.profile.seniority_level}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Target Roles</p>
                  <p className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                    {skillAnalysis.profile.target_roles.slice(0, 2).join(', ')}
                  </p>
                </div>
              </div>
            </div>

            {/* Skills Breakdown */}
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                Skills Breakdown
              </h2>
              <SkillsBreakdown
                explicitSkills={skillAnalysis.profile.skills}
                impliedSkills={skillAnalysis.expanded_skills.implied_skills}
              />
            </div>

            {/* Job Matches */}
            {skillAnalysis.matches.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
                    <Target className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  Matching Jobs
                </h2>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {skillAnalysis.matches.slice(0, 6).map((job, index) => (
                    <a
                      key={index}
                      href={job.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between rounded-xl border border-slate-200 p-4 transition-colors hover:border-blue-300 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                    >
                      <div>
                        <p className="font-medium text-slate-800 dark:text-slate-200">{job.title}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {job.required_skills.slice(0, 3).join(', ')}
                        </p>
                      </div>
                      <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                        {Math.round(job.score * 100)}%
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Gap Analysis */}
            {skillAnalysis.validated_gaps.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30">
                    <BarChart3 className="h-5 w-5 text-red-600 dark:text-red-400" />
                  </div>
                  Skill Gap Analysis
                </h2>
                <GapAnalysisCard gaps={skillAnalysis.validated_gaps} />
              </div>
            )}

            {/* Personalized Roadmap */}
            {skillAnalysis.roadmap.action_plan.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
                    <BookOpen className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  Personalized Learning Roadmap
                </h2>
                
                {/* Timeline */}
                <div className="mb-6 rounded-xl border border-slate-200 bg-gradient-to-r from-purple-50 to-blue-50 p-4 dark:border-slate-700 dark:from-purple-900/20 dark:to-blue-900/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Timeline</p>
                      <p className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                        {skillAnalysis.roadmap.total_timeline}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Seniority</p>
                      <p className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                        {skillAnalysis.roadmap.seniority_level}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Market Outlook */}
                {skillAnalysis.roadmap.market_outlook && (
                  <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {skillAnalysis.roadmap.market_outlook}
                    </p>
                  </div>
                )}

                {/* Learning Sequence */}
                {skillAnalysis.roadmap.learning_sequence.length > 0 && (
                  <div className="mb-6">
                    <h3 className="mb-3 text-sm font-medium text-slate-600 dark:text-slate-400">
                      Recommended Learning Sequence
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {skillAnalysis.roadmap.learning_sequence.map((skill, index) => (
                        <span
                          key={index}
                          className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600 dark:bg-slate-700 dark:text-slate-400"
                        >
                          {index + 1}. {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Skill Roadmap */}
                <SkillRoadmapAccordion steps={skillAnalysis.roadmap.action_plan} />
              </div>
            )}

            {/* Save Button */}
            <div className="sticky bottom-6 flex justify-center">
              <button
                onClick={handleSaveToProfile}
                disabled={saveStatus === 'saving' || saveStatus === 'success'}
                className="flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:opacity-50 text-white font-semibold shadow-xl shadow-green-500/30 transition-all"
              >
                {saveStatus === 'saving' ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Saving...
                  </>
                ) : saveStatus === 'success' ? (
                  <>
                    <CheckCircle size={20} />
                    Saved to Profile!
                  </>
                ) : (
                  <>
                    <Save size={20} />
                    Save to Profile
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!skillAnalysis && !loading && !error && (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-950/60 dark:to-blue-950/40 flex items-center justify-center">
              <Zap className="w-12 h-12 text-purple-500" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
              Discover Your Skill Gaps
            </h3>
            <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto">
              Upload your resume PDF above and let AI analyze your skills, 
              identify gaps, and create a personalized roadmap for your career growth.
            </p>
          </div>
        )}
      </main>

      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 mt-auto py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-sm text-slate-500 dark:text-slate-400 text-center md:text-left font-medium">
            © 2026 LearnLaunch. All rights reserved. <br className="md:hidden" /> Designed for future leaders.
          </p>
          <div className="flex gap-8">
            <a href="#" className="text-sm text-slate-500 hover:text-purple-500 font-medium transition-colors">
              Privacy
            </a>
            <a href="#" className="text-sm text-slate-500 hover:text-purple-500 font-medium transition-colors">
              Terms
            </a>
            <a href="#" className="text-sm text-slate-500 hover:text-purple-500 font-medium transition-colors">
              Support
            </a>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.6s ease-out;
        }
      `}</style>
    </div>
  );
};

export default SkillAnalyzer;