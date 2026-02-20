import React, { useState, useEffect } from 'react';
import { UserRoadmap, RoadmapDetail, WeeklyProgress } from '../../types/api';
import { X, CheckCircle2, Circle, Trash2, Building2, Briefcase, ChevronDown, ChevronUp, BookOpen, ListChecks, Wrench, Award } from 'lucide-react';

interface RoadmapDetailModalProps {
  userRoadmap: UserRoadmap | null;
  roadmapDetail: RoadmapDetail | null;
  loading: boolean;
  onClose: () => void;
  onUpdateProgress: (
    userRoadmapId: string,
    weekNumber: number,
    isCompleted: boolean,
    subProgress?: {
      whatYoullLearn: boolean[];
      studyPlan: boolean[];
      handsOnPractice: boolean[];
    }
  ) => Promise<void>;
  onDelete: (userRoadmapId: string) => void;
}

const RoadmapDetailModal: React.FC<RoadmapDetailModalProps> = ({
  userRoadmap,
  roadmapDetail,
  loading,
  onClose,
  onUpdateProgress,
  onDelete,
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [expandedWeeks, setExpandedWeeks] = useState<Set<number>>(new Set());
  const [localProgress, setLocalProgress] = useState<Record<string, WeeklyProgress>>({});

  useEffect(() => {
    if (userRoadmap?.weeklyProgress) {
      const progressMap: Record<string, WeeklyProgress> = {};
      userRoadmap.weeklyProgress.forEach(wp => {
        progressMap[wp.weekNumber.toString()] = wp;
      });
      setLocalProgress(progressMap);
    }
  }, [userRoadmap?.weeklyProgress]);

  if (!userRoadmap) return null;

  const toggleWeek = (weekNumber: number) => {
    setExpandedWeeks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(weekNumber)) {
        newSet.delete(weekNumber);
      } else {
        newSet.add(weekNumber);
      }
      return newSet;
    });
  };

  const getWeekProgress = (weekNumber: number): WeeklyProgress | undefined => {
    return localProgress[weekNumber.toString()];
  };

  const calculateWeekProgress = (week: any, weekNumber: number) => {
    const progress = getWeekProgress(weekNumber);
    if (!progress?.subProgress) return 0;

    const { whatYoullLearn, studyPlan, handsOnPractice } = progress.subProgress;
    const total = week.whatYoullLearn.length + week.studyPlan.length + week.handsOnPractice.length;
    if (total === 0) return progress.isCompleted ? 100 : 0;

    const completed = whatYoullLearn.filter(Boolean).length + 
                      studyPlan.filter(Boolean).length + 
                      handsOnPractice.filter(Boolean).length;
    return Math.round((completed / total) * 100);
  };

  const handleSubItemToggle = async (
    weekNumber: number,
    category: 'whatYoullLearn' | 'studyPlan' | 'handsOnPractice',
    index: number,
    week: any
  ) => {
    const progress = getWeekProgress(weekNumber);
    const currentSubProgress = progress?.subProgress || {
      whatYoullLearn: new Array(week.whatYoullLearn.length).fill(false),
      studyPlan: new Array(week.studyPlan.length).fill(false),
      handsOnPractice: new Array(week.handsOnPractice.length).fill(false),
    };

    const newSubProgress = {
      ...currentSubProgress,
      [category]: currentSubProgress[category].map((val: boolean, i: number) => 
        i === index ? !val : val
      ),
    };

    const weekIsCompleted = newSubProgress.whatYoullLearn.every((v: boolean) => v) &&
                            newSubProgress.studyPlan.every((v: boolean) => v) &&
                            newSubProgress.handsOnPractice.every((v: boolean) => v);

    setLocalProgress(prev => ({
      ...prev,
      [weekNumber.toString()]: {
        weekNumber,
        isCompleted: weekIsCompleted,
        subProgress: newSubProgress,
      },
    }));

    await onUpdateProgress(userRoadmap._id, weekNumber, weekIsCompleted, newSubProgress);
  };

  const completedWeeks = userRoadmap.weeklyProgress?.filter(wp => {
    const week = roadmapDetail?.weeks?.find(w => w.weekNumber === wp.weekNumber);
    if (!week) return wp.isCompleted;
    return calculateWeekProgress(week, wp.weekNumber) === 100;
  }).length || 0;

  const totalWeeks = roadmapDetail?.weeks?.length || 0;
  const calculatedProgress = totalWeeks > 0 ? Math.round((completedWeeks / totalWeeks) * 100) : 0;

  const handleDelete = () => {
    if (userRoadmap) {
      onDelete(userRoadmap._id);
    }
    setShowDeleteConfirm(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              {roadmapDetail?.title || userRoadmap.roadmap?.title || 'Roadmap Details'}
            </h2>
            <div className="flex items-center gap-3 mt-1 text-sm text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1">
                <Building2 className="w-4 h-4" />
                {roadmapDetail?.targetCompany || userRoadmap.roadmap?.targetCompany || 'N/A'}
              </span>
              <span className="flex items-center gap-1">
                <Briefcase className="w-4 h-4" />
                {roadmapDetail?.roleTitle || userRoadmap.roadmap?.roleTitle || 'N/A'}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="p-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-slate-600 dark:text-slate-300 font-medium">
              Overall Progress
            </span>
            <span className="font-bold text-indigo-600 dark:text-indigo-400">
              {calculatedProgress}%
            </span>
          </div>
          <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 rounded-full transition-all duration-500"
              style={{ width: `${calculatedProgress}%` }}
            />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            {completedWeeks} of {totalWeeks} weeks completed
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
            </div>
          ) : (
            <div className="space-y-4">
              {roadmapDetail?.weeks?.map((week) => {
                const weekProgress = getWeekProgress(week.weekNumber);
                const isExpanded = expandedWeeks.has(week.weekNumber);
                const weekProgPercent = calculateWeekProgress(week, week.weekNumber);
                const isWeekComplete = weekProgPercent === 100;

                return (
                  <div
                    key={week.weekNumber}
                    className={`border rounded-lg transition-colors ${
                      isWeekComplete
                        ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20'
                        : 'border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <button
                      onClick={() => toggleWeek(week.weekNumber)}
                      className="w-full flex items-center justify-between p-4 text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          isWeekComplete ? 'bg-green-500' : 'bg-indigo-100 dark:bg-indigo-900'
                        }`}>
                          {isWeekComplete ? (
                            <CheckCircle2 className="w-5 h-5 text-white" />
                          ) : (
                            <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                              {week.weekNumber}
                            </span>
                          )}
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-900 dark:text-slate-100">
                            Week {week.weekNumber}: {week.topic}
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {week.whatYoullLearn.length} topics • {week.studyPlan.length} study items • {week.handsOnPractice.length} practice items
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-24">
                          <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${isWeekComplete ? 'bg-green-500' : 'bg-indigo-500'}`}
                              style={{ width: `${weekProgPercent}%` }}
                            />
                          </div>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-slate-400" />
                        )}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="px-4 pb-4 border-t border-slate-200 dark:border-slate-700 pt-4 space-y-4">
                        {week.whatYoullLearn && week.whatYoullLearn.length > 0 && (
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <BookOpen className="w-4 h-4 text-indigo-500" />
                              <h5 className="font-medium text-slate-900 dark:text-slate-100 text-sm">
                                What You'll Learn
                              </h5>
                            </div>
                            <div className="space-y-2 ml-6">
                              {week.whatYoullLearn.map((item, idx) => {
                                const isChecked = weekProgress?.subProgress?.whatYoullLearn?.[idx] || false;
                                return (
                                  <button
                                    key={idx}
                                    onClick={() => handleSubItemToggle(week.weekNumber, 'whatYoullLearn', idx, week)}
                                    className="flex items-start gap-2 text-left w-full group"
                                  >
                                    {isChecked ? (
                                      <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                    ) : (
                                      <Circle className="w-5 h-5 text-slate-300 group-hover:text-indigo-500 flex-shrink-0 mt-0.5" />
                                    )}
                                    <span className={`text-sm ${isChecked ? 'text-slate-400 line-through' : 'text-slate-600 dark:text-slate-300'}`}>
                                      {item}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {week.studyPlan && week.studyPlan.length > 0 && (
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <ListChecks className="w-4 h-4 text-blue-500" />
                              <h5 className="font-medium text-slate-900 dark:text-slate-100 text-sm">
                                Study Plan
                              </h5>
                            </div>
                            <div className="space-y-2 ml-6">
                              {week.studyPlan.map((item, idx) => {
                                const isChecked = weekProgress?.subProgress?.studyPlan?.[idx] || false;
                                return (
                                  <button
                                    key={idx}
                                    onClick={() => handleSubItemToggle(week.weekNumber, 'studyPlan', idx, week)}
                                    className="flex items-start gap-2 text-left w-full group"
                                  >
                                    {isChecked ? (
                                      <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                    ) : (
                                      <Circle className="w-5 h-5 text-slate-300 group-hover:text-indigo-500 flex-shrink-0 mt-0.5" />
                                    )}
                                    <span className={`text-sm ${isChecked ? 'text-slate-400 line-through' : 'text-slate-600 dark:text-slate-300'}`}>
                                      <span className="font-medium text-indigo-600 dark:text-indigo-400">{item.dayRange}:</span> {item.content}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {week.handsOnPractice && week.handsOnPractice.length > 0 && (
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <Wrench className="w-4 h-4 text-amber-500" />
                              <h5 className="font-medium text-slate-900 dark:text-slate-100 text-sm">
                                Hands-on Practice
                              </h5>
                            </div>
                            <div className="space-y-2 ml-6">
                              {week.handsOnPractice.map((item, idx) => {
                                const isChecked = weekProgress?.subProgress?.handsOnPractice?.[idx] || false;
                                return (
                                  <button
                                    key={idx}
                                    onClick={() => handleSubItemToggle(week.weekNumber, 'handsOnPractice', idx, week)}
                                    className="flex items-start gap-2 text-left w-full group"
                                  >
                                    {isChecked ? (
                                      <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                    ) : (
                                      <Circle className="w-5 h-5 text-slate-300 group-hover:text-indigo-500 flex-shrink-0 mt-0.5" />
                                    )}
                                    <span className={`text-sm ${isChecked ? 'text-slate-400 line-through' : 'text-slate-600 dark:text-slate-300'}`}>
                                      {item}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {week.resources && week.resources.length > 0 && (
                          <div>
                            <h5 className="font-medium text-slate-900 dark:text-slate-100 text-sm mb-2">
                              Resources
                            </h5>
                            <div className="space-y-1 ml-6">
                              {week.resources.map((resource, idx) => (
                                <a
                                  key={idx}
                                  href={resource.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
                                >
                                  📚 {resource.name}
                                </a>
                              ))}
                            </div>
                          </div>
                        )}

                        {week.successCriteria && week.successCriteria.length > 0 && (
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <Award className="w-4 h-4 text-green-500" />
                              <h5 className="font-medium text-slate-900 dark:text-slate-100 text-sm">
                                Success Criteria
                              </h5>
                            </div>
                            <ul className="space-y-1 ml-6">
                              {week.successCriteria.map((criteria, idx) => (
                                <li key={idx} className="text-sm text-slate-600 dark:text-slate-300">
                                  ✓ {criteria}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-red-600 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Delete Roadmap
          </button>
        </div>

        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
            <div className="bg-white dark:bg-slate-900 rounded-xl p-6 max-w-sm mx-4 shadow-xl">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                Delete Roadmap?
              </h3>
              <p className="text-slate-500 dark:text-slate-400 mb-4">
                This action cannot be undone. Are you sure you want to delete this roadmap?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoadmapDetailModal;
