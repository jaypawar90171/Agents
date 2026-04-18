import React from 'react';
import { SkillContext, ImpliedSkill } from '../../types/api';
import { Lightbulb, Info } from 'lucide-react';

interface SkillsBreakdownProps {
  explicitSkills: SkillContext[];
  impliedSkills: ImpliedSkill[];
}

const getLevelColor = (level: string) => {
  switch (level.toLowerCase()) {
    case 'beginner':
      return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    case 'intermediate':
      return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
    case 'advanced':
      return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    default:
      return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300';
  }
};

export const SkillsBreakdown: React.FC<SkillsBreakdownProps> = ({
  explicitSkills,
  impliedSkills,
}) => {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Explicit Skills */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
        <div className="mb-4 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
            <span className="text-lg">💼</span>
          </div>
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
            Your Skills
          </h3>
          <span className="ml-auto rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-400">
            {explicitSkills.length}
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {explicitSkills.map((skill, index) => (
            <div
              key={index}
              className="group relative flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-600 dark:bg-slate-700"
            >
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {skill.name}
              </span>
              <span
                className={`rounded px-1.5 py-0.5 text-xs font-medium ${getLevelColor(skill.level)}`}
              >
                {skill.level}
              </span>
              
              {/* Tooltip with context */}
              <div className="absolute bottom-full left-1/2 mb-2 w-48 -translate-x-1/2 rounded-lg bg-slate-800 p-2 opacity-0 shadow-lg transition-opacity group-hover:opacity-100 dark:bg-slate-900">
                <p className="text-xs text-slate-300">
                  <span className="font-medium">Context:</span> {skill.context}
                </p>
              </div>
            </div>
          ))}
        </div>

        {explicitSkills.length === 0 && (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            No skills detected in your resume
          </p>
        )}
      </div>

      {/* Implied Skills */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
        <div className="mb-4 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
            <Lightbulb className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
            Inferred Skills
          </h3>
          <span className="ml-auto rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-400">
            {impliedSkills.length}
          </span>
        </div>

        <div className="space-y-3">
          {impliedSkills.map((skill, index) => (
            <div
              key={index}
              className="group relative rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-600 dark:bg-slate-700"
            >
              <div className="flex items-center gap-2">
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {skill.name}
                </span>
                <span className="text-xs text-slate-400">
                  ← {skill.inferred_from}
                </span>
              </div>
              
              {/* Tooltip with reasoning */}
              <div className="absolute bottom-full left-0 mb-2 w-64 rounded-lg bg-slate-800 p-3 opacity-0 shadow-lg transition-opacity group-hover:opacity-100 dark:bg-slate-900 z-10">
                <div className="flex items-start gap-2">
                  <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-400" />
                  <p className="text-xs text-slate-300">{skill.reasoning}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {impliedSkills.length === 0 && (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            No additional skills inferred
          </p>
        )}
      </div>
    </div>
  );
};

export default SkillsBreakdown;