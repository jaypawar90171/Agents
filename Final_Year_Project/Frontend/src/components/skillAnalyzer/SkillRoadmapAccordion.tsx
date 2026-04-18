import React, { useState } from 'react';
import { SkillLearningStep } from '../../types/api';
import { 
  ChevronDown, ChevronRight, BookOpen, Calendar, Award, ExternalLink, 
  CheckCircle, Circle, Clock 
} from 'lucide-react';

interface SkillRoadmapAccordionProps {
  steps: SkillLearningStep[];
  completedSkills?: string[];
  onSkillToggle?: (skill: string, isCompleted: boolean) => void;
  readOnly?: boolean;
}

export const SkillRoadmapAccordion: React.FC<SkillRoadmapAccordionProps> = ({
  steps,
  completedSkills = [],
  onSkillToggle,
  readOnly = false,
}) => {
  const [expandedSkill, setExpandedSkill] = useState<string | null>(
    steps.length > 0 ? steps[0].skill : null
  );

  const toggleSkill = (skill: string) => {
    setExpandedSkill(prev => prev === skill ? null : skill);
  };

  const handleToggleComplete = (skill: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!readOnly && onSkillToggle) {
      const isCompleted = completedSkills.includes(skill);
      onSkillToggle(skill, !isCompleted);
    }
  };

  const getImportanceColor = (importance: string) => {
    if (importance === 'Critical') {
      return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    }
    return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
  };

  return (
    <div className="space-y-3">
      {steps.map((step, index) => {
        const isExpanded = expandedSkill === step.skill;
        const isCompleted = completedSkills.includes(step.skill);

        return (
          <div
            key={index}
            className="rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800"
          >
            {/* Header */}
            <button
              onClick={() => toggleSkill(step.skill)}
              className="flex w-full items-center gap-4 p-4 text-left hover:bg-slate-50 dark:hover:bg-slate-700/50"
            >
              {isExpanded ? (
                <ChevronDown className="h-5 w-5 flex-shrink-0 text-slate-400" />
              ) : (
                <ChevronRight className="h-5 w-5 flex-shrink-0 text-slate-400" />
              )}

              {!readOnly && (
                <button
                  onClick={(e) => handleToggleComplete(step.skill, e)}
                  className="flex-shrink-0"
                >
                  {isCompleted ? (
                    <CheckCircle className="h-6 w-6 text-green-500" />
                  ) : (
                    <Circle className="h-6 w-6 text-slate-300 hover:text-green-500" />
                  )}
                </button>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-slate-800 dark:text-slate-200">
                    {step.skill}
                  </h4>
                  <span className={`rounded px-2 py-0.5 text-xs font-medium ${getImportanceColor(step.importance)}`}>
                    {step.importance}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {step.time_estimate}
                  </span>
                </div>
              </div>
            </button>

            {/* Expanded Content */}
            {isExpanded && (
              <div className="border-t border-slate-200 p-4 dark:border-slate-700">
                <div className="space-y-4">
                  {/* Why it matters */}
                  <div>
                    <h5 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                      <Award className="h-4 w-4" />
                      Why it matters
                    </h5>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {step.why_it_matters}
                    </p>
                  </div>

                  {/* Leverage from background */}
                  <div>
                    <h5 className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Leverage from your background
                    </h5>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {step.leverage_from_background}
                    </p>
                  </div>

                  {/* Resources */}
                  <div>
                    <h5 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                      <BookOpen className="h-4 w-4" />
                      Learning Resources
                    </h5>
                    <div className="space-y-2">
                      {step.resources.map((resource, i) => (
                        <a
                          key={i}
                          href={resource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 rounded-lg border border-slate-200 p-2 hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-700"
                        >
                          <ExternalLink className="h-4 w-4 flex-shrink-0 text-blue-500" />
                          <div className="flex-1 min-w-0">
                            <p className="truncate text-sm font-medium text-slate-700 dark:text-slate-300">
                              {resource.title}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {resource.resource_type} {resource.is_free ? '• Free' : '• Paid'}
                            </p>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>

                  {/* Weekly Breakdown */}
                  <div>
                    <h5 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                      <Calendar className="h-4 w-4" />
                      Weekly Breakdown
                    </h5>
                    <div className="space-y-2">
                      {step.weekly_breakdown.map((week, i) => (
                        <div
                          key={i}
                          className="rounded-lg border border-slate-200 p-3 dark:border-slate-600"
                        >
                          <div className="mb-2 flex items-center justify-between">
                            <span className="font-medium text-slate-700 dark:text-slate-300">
                              {week.week_label}
                            </span>
                            <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                              {week.topic}
                            </span>
                          </div>
                          <ul className="space-y-1">
                            {week.tasks.map((task, j) => (
                              <li key={j} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-500" />
                                {task}
                              </li>
                            ))}
                          </ul>
                          <div className="mt-2 rounded bg-green-50 px-2 py-1 text-xs font-medium text-green-700 dark:bg-green-900/20 dark:text-green-400">
                            Milestone: {week.milestone}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Capstone Project */}
                  <div>
                    <h5 className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Capstone Project
                    </h5>
                    <p className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600 dark:border-slate-600 dark:bg-slate-700">
                      {step.capstone_project}
                    </p>
                  </div>

                  {/* Resume Bullet */}
                  <div>
                    <h5 className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Resume Bullet
                    </h5>
                    <p className="rounded-lg border border-slate-200 bg-blue-50 p-3 text-sm text-blue-700 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
                      {step.resume_bullet}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default SkillRoadmapAccordion;