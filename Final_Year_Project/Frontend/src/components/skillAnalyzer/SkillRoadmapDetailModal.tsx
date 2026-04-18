import React from 'react';
import { X, Download, ExternalLink, CheckCircle, Circle } from 'lucide-react';
import { UserSkillRoadmap, SkillGapAnalysis } from '../../types/api';
import { SkillsBreakdown } from './SkillsBreakdown';
import { GapAnalysisCard } from './GapAnalysisCard';
import { SkillRoadmapAccordion } from './SkillRoadmapAccordion';

interface SkillRoadmapDetailModalProps {
  userSkillRoadmap: UserSkillRoadmap;
  analysis: SkillGapAnalysis;
  onClose: () => void;
  onSkillToggle: (skill: string, isCompleted: boolean) => void;
}

export const SkillRoadmapDetailModal: React.FC<SkillRoadmapDetailModalProps> = ({
  userSkillRoadmap,
  analysis,
  onClose,
  onSkillToggle,
}) => {
  const completedSkills = userSkillRoadmap.skillProgress
    ?.filter(s => s.isCompleted)
    .map(s => s.skill) || [];

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white dark:bg-slate-900">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/95 px-6 py-4 backdrop-blur dark:border-slate-700 dark:bg-slate-900/95">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">
              Skill Gap Analysis
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {analysis.profile?.seniority_level} • {analysis.profile?.target_roles?.join(', ')}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-6 w-6 text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-8 p-6">
          {/* Progress */}
          <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Overall Progress
              </span>
              <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                {userSkillRoadmap.overallProgress}%
              </span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
                style={{ width: `${userSkillRoadmap.overallProgress}%` }}
              />
            </div>
          </div>

          {/* Skills Breakdown */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-slate-800 dark:text-slate-200">
              Skills Breakdown
            </h3>
            <SkillsBreakdown
              explicitSkills={analysis.profile?.skills || []}
              impliedSkills={analysis.expanded_skills?.implied_skills || []}
            />
          </div>

          {/* Job Matches */}
          {analysis.matches && analysis.matches.length > 0 && (
            <div>
              <h3 className="mb-4 text-lg font-semibold text-slate-800 dark:text-slate-200">
                Matching Jobs
              </h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {analysis.matches.slice(0, 6).map((job, index) => (
                  <a
                    key={index}
                    href={job.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-xl border border-slate-200 p-4 transition-colors hover:border-blue-300 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-800 dark:text-slate-200 truncate">
                        {job.title}
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {job.required_skills?.slice(0, 3).join(', ')}
                      </p>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                        {Math.round(job.score * 100)}%
                      </span>
                      <ExternalLink className="h-4 w-4 text-slate-400" />
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Gap Analysis */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-slate-800 dark:text-slate-200">
              Skill Gap Analysis
            </h3>
            <GapAnalysisCard gaps={analysis.validated_gaps || []} />
          </div>

          {/* Action Plan / Roadmap */}
          {analysis.roadmap?.action_plan && analysis.roadmap.action_plan.length > 0 && (
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                  Learning Roadmap
                </h3>
                <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                  {analysis.roadmap.total_timeline}
                </span>
              </div>

              {/* Market Outlook */}
              {analysis.roadmap.market_outlook && (
                <div className="mb-6 rounded-xl border border-slate-200 bg-gradient-to-r from-blue-50 to-purple-50 p-4 dark:border-slate-700 dark:from-blue-900/20 dark:to-purple-900/20">
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    {analysis.roadmap.market_outlook}
                  </p>
                </div>
              )}

              {/* Learning Sequence */}
              {analysis.roadmap.learning_sequence && analysis.roadmap.learning_sequence.length > 0 && (
                <div className="mb-6">
                  <h4 className="mb-3 text-sm font-medium text-slate-600 dark:text-slate-400">
                    Recommended Learning Sequence
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {analysis.roadmap.learning_sequence.map((skill, index) => (
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

              {/* Skill Roadmaps */}
              <SkillRoadmapAccordion
                steps={analysis.roadmap.action_plan}
                completedSkills={completedSkills}
                onSkillToggle={(skill, isCompleted) => onSkillToggle(skill, isCompleted)}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-4 dark:border-slate-700 dark:bg-slate-800">
          <div className="text-sm text-slate-500 dark:text-slate-400">
            Created {new Date(userSkillRoadmap.startDate).toLocaleDateString()}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SkillRoadmapDetailModal;