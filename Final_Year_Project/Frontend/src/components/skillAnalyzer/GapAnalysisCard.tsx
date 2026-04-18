import React from 'react';
import { ValidatedGap } from '../../types/api';
import { AlertTriangle, TrendingUp, Users, Target } from 'lucide-react';

interface GapAnalysisCardProps {
  gaps: ValidatedGap[];
}

export const GapAnalysisCard: React.FC<GapAnalysisCardProps> = ({ gaps }) => {
  const criticalGaps = gaps.filter(g => g.importance === 'Critical');
  const competitiveGaps = gaps.filter(g => g.importance === 'Competitive Edge');

  return (
    <div className="space-y-6">
      {/* Critical Gaps */}
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 dark:border-red-800 dark:bg-red-900/20">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/50">
            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-red-800 dark:text-red-300">
              Critical Skill Gaps
            </h3>
            <p className="text-sm text-red-600/70 dark:text-red-400/70">
              Essential for your target roles
            </p>
          </div>
          <span className="ml-auto rounded-full bg-red-200 px-3 py-1 text-sm font-bold text-red-700 dark:bg-red-900/50 dark:text-red-300">
            {criticalGaps.length}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {criticalGaps.map((gap, index) => (
            <div
              key={index}
              className="flex items-center gap-3 rounded-lg border border-red-200 bg-white p-3 dark:border-red-800 dark:bg-red-950/30"
            >
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/50">
                <Target className="h-4 w-4 text-red-600 dark:text-red-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-red-800 dark:text-red-300 truncate">
                  {gap.skill}
                </p>
                <p className="text-xs text-red-600/70 dark:text-red-400/70">
                  Found in {gap.frequency} jobs
                </p>
              </div>
            </div>
          ))}
        </div>

        {criticalGaps.length === 0 && (
          <p className="text-sm text-red-600/70 dark:text-red-400/70">
            No critical gaps identified - you have the core skills!
          </p>
        )}
      </div>

      {/* Competitive Edge Gaps */}
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 dark:border-amber-800 dark:bg-amber-900/20">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/50">
            <TrendingUp className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-amber-800 dark:text-amber-300">
              Competitive Edge Gaps
            </h3>
            <p className="text-sm text-amber-600/70 dark:text-amber-400/70">
              Skills that differentiate you
            </p>
          </div>
          <span className="ml-auto rounded-full bg-amber-200 px-3 py-1 text-sm font-bold text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
            {competitiveGaps.length}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {competitiveGaps.map((gap, index) => (
            <div
              key={index}
              className="flex items-center gap-3 rounded-lg border border-amber-200 bg-white p-3 dark:border-amber-800 dark:bg-amber-950/30"
            >
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/50">
                <Users className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-amber-800 dark:text-amber-300 truncate">
                  {gap.skill}
                </p>
                <p className="text-xs text-amber-600/70 dark:text-amber-400/70">
                  Found in {gap.frequency} jobs
                </p>
              </div>
            </div>
          ))}
        </div>

        {competitiveGaps.length === 0 && (
          <p className="text-sm text-amber-600/70 dark:text-amber-400/70">
            No competitive edge gaps identified - you're ahead of the curve!
          </p>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-center dark:border-slate-700 dark:bg-slate-800">
          <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{gaps.length}</p>
          <p className="text-sm text-slate-600 dark:text-slate-400">Total Gaps</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-center dark:border-slate-700 dark:bg-slate-800">
          <p className="text-3xl font-bold text-red-600 dark:text-red-400">{criticalGaps.length}</p>
          <p className="text-sm text-slate-600 dark:text-slate-400">Critical</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-center dark:border-slate-700 dark:bg-slate-800">
          <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">{competitiveGaps.length}</p>
          <p className="text-sm text-slate-600 dark:text-slate-400">Edges</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-center dark:border-slate-700 dark:bg-slate-800">
          <p className="text-3xl font-bold text-green-600 dark:text-green-400">
            {Math.max(0, 100 - (criticalGaps.length * 15 + competitiveGaps.length * 5))}%
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-400">Match Score</p>
        </div>
      </div>
    </div>
  );
};

export default GapAnalysisCard;