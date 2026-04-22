import React, { useState, useEffect } from 'react';
import { UserRoadmap, RoadmapDetail, WeeklyProgress } from '../../types/api';
import {
  X, CheckCircle2, Trash2,
  ChevronDown, ChevronUp, BookOpen, ListChecks, Wrench, Award,
  ExternalLink, Play
} from 'lucide-react';

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
  }, [userRoadmap?._id, userRoadmap?.weeklyProgress]);

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
    try {
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
    } catch (err) {
      console.error('Error in handleSubItemToggle:', err);
    }
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

  // Format dates
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Estimate completion date
  const getEstimatedCompletion = () => {
    if (!userRoadmap.startDate || !totalWeeks) return 'N/A';
    const start = new Date(userRoadmap.startDate);
    const end = new Date(start.getTime() + totalWeeks * 7 * 24 * 60 * 60 * 1000);
    return end.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
  };

  // Derive a path type tag from the roadmap
  const getPathTag = () => {
    const skills = roadmapDetail?.skills || userRoadmap.roadmap?.skills || [];
    const title = (roadmapDetail?.title || userRoadmap.roadmap?.title || '').toLowerCase();
    if (title.includes('design') || skills.some(s => s.toLowerCase().includes('design'))) return 'DESIGN PATH';
    if (title.includes('data') || skills.some(s => s.toLowerCase().includes('data'))) return 'DATA PATH';
    if (title.includes('manager') || title.includes('lead')) return 'LEADERSHIP PATH';
    return 'ENGINEERING PATH';
  };

  // Category config
  const categoryConfig = {
    whatYoullLearn: {
      icon: BookOpen,
      label: "What You'll Learn",
    },
    studyPlan: {
      icon: ListChecks,
      label: 'Study Plan',
    },
    handsOnPractice: {
      icon: Wrench,
      label: 'Hands-on Practice',
    },
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-outline-variant/20 shadow-xl">
        
        {/* Header */}
        <div className="p-6 md:p-8 pb-6">
          {/* Close button */}
          <div className="flex justify-end mb-4">
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-surface-container-low transition-colors"
            >
              <X className="w-5 h-5 text-on-surface-variant" />
            </button>
          </div>

          {/* Path tag + date */}
          <div className="flex items-center gap-3 mb-3">
            <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-label font-bold uppercase tracking-widest rounded-md">
              {getPathTag()}
            </span>
            <span className="text-xs font-body text-outline">
              ID: {(roadmapDetail?._id || userRoadmap.roadmapId).slice(-8).toUpperCase()}
            </span>
          </div>

          {/* Title */}
          <h2 className="text-xl md:text-2xl font-headline font-bold text-on-background tracking-tight leading-tight mb-4">
            {roadmapDetail?.targetCompany || userRoadmap.roadmap?.targetCompany || ''} — {roadmapDetail?.title || userRoadmap.roadmap?.title || 'Roadmap Details'}
          </h2>

          {/* Overall Progress */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-body italic text-on-surface-variant">
                Overall Mastery Progress
              </span>
              <span className="text-lg font-headline font-bold text-on-background">
                {calculatedProgress}%
              </span>
            </div>
            <div className="h-2.5 bg-surface-container-low rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-700 ease-out"
                style={{ width: `${calculatedProgress}%` }}
              />
            </div>
          </div>

          {/* Dates row */}
          <div className="flex items-center gap-6 text-xs font-body text-outline">
            <span>
              <span className="uppercase tracking-wider font-label text-[10px]">Initiated </span>
              {formatDate(userRoadmap.startDate)}
            </span>
            <span>
              <span className="uppercase tracking-wider font-label text-[10px]">Estimated Completion </span>
              {getEstimatedCompletion()}
            </span>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-outline-variant/10" />

        {/* Weeks content - scrollable */}
        <div className="flex-1 overflow-y-auto px-6 md:px-8 py-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-10 h-10 rounded-full border-2 border-outline-variant/20 border-t-primary animate-spin" />
              <p className="text-sm font-label text-outline mt-4">Loading roadmap details…</p>
            </div>
          ) : (
            <div className="space-y-2">
              {roadmapDetail?.weeks?.map((week, idx) => {
                const weekProgress = getWeekProgress(week.weekNumber);
                const isExpanded = expandedWeeks.has(week.weekNumber);
                const weekProgPercent = calculateWeekProgress(week, week.weekNumber);
                const isWeekComplete = weekProgPercent === 100;

                return (
                  <div
                    key={`${week.weekNumber}-${idx}`}
                    className={`rounded-xl overflow-hidden border transition-all duration-200 ${
                      isExpanded
                        ? 'border-outline-variant/20 shadow-sm'
                        : 'border-outline-variant/10'
                    } ${isWeekComplete ? 'bg-green-50/40 dark:bg-green-900/5' : 'bg-card'}`}
                  >
                    {/* Week Header */}
                    <button
                      onClick={() => toggleWeek(week.weekNumber)}
                      className="w-full flex items-center justify-between p-4 text-left group"
                    >
                      <div className="flex items-center gap-3">
                        {/* Week number badge or checkmark */}
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          isWeekComplete
                            ? 'bg-green-500'
                            : 'bg-surface-container-low'
                        }`}>
                          {isWeekComplete ? (
                            <CheckCircle2 className="w-5 h-5 text-white" />
                          ) : (
                            <span className="text-xs font-label font-bold text-on-surface-variant">
                              {String(week.weekNumber).padStart(2, '0')}
                            </span>
                          )}
                        </div>
                        <div>
                          <h4 className="font-headline font-semibold text-sm text-on-background leading-snug">
                            Week {week.weekNumber}: {week.topic}
                          </h4>
                          <p className="text-[11px] font-label text-outline mt-0.5 tracking-wide">
                            {week.whatYoullLearn.length} TOPICS · {week.studyPlan.length} STUDY ITEMS · {week.handsOnPractice.length} PRACTICE SETS
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-outline" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-outline" />
                        )}
                      </div>
                    </button>

                    {/* Expanded Content */}
                    {isExpanded && (
                      <div className="px-4 pb-5 space-y-4 border-t border-outline-variant/10 pt-4">
                        {/* Section Progress */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-label text-on-surface-variant">
                              Section Progress
                            </span>
                            <span className="text-sm font-label font-bold text-on-background">
                              {weekProgPercent}%
                            </span>
                          </div>
                          <div className="h-2 bg-surface-container-low rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                isWeekComplete ? 'bg-green-500' : 'bg-primary'
                              }`}
                              style={{ width: `${weekProgPercent}%` }}
                            />
                          </div>
                        </div>

                        {/* Render each category as a checklist */}
                        {(['whatYoullLearn', 'studyPlan', 'handsOnPractice'] as const).map(category => {
                          const items = week[category];
                          if (!items || items.length === 0) return null;

                          const config = categoryConfig[category];
                          const Icon = config.icon;

                          return (
                            <div key={category}>
                              <div className="flex items-center gap-2 mb-2.5">
                                <Icon className="w-3.5 h-3.5 text-on-surface-variant" />
                                <h5 className="font-label font-semibold text-xs uppercase tracking-wider text-on-surface-variant">
                                  {config.label}
                                </h5>
                              </div>
                              <div className="space-y-1">
                                {items.map((item: any, itemIdx: number) => {
                                  const isChecked = weekProgress?.subProgress?.[category]?.[itemIdx] || false;
                                  const displayContent = category === 'studyPlan'
                                    ? (
                                      <>
                                        <span className="font-semibold text-primary dark:text-primary-fixed-dim">{item.dayRange}:</span>{' '}
                                        {item.content}
                                      </>
                                    )
                                    : item;

                                  return (
                                    <button
                                      key={itemIdx}
                                      onClick={() => handleSubItemToggle(week.weekNumber, category, itemIdx, week)}
                                      className="flex items-start gap-3 text-left w-full py-2 px-2 -mx-2 rounded-lg hover:bg-surface-container-low transition-colors group/item"
                                    >
                                      <div className="mt-0.5 flex-shrink-0">
                                        {isChecked ? (
                                          <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                            </svg>
                                          </div>
                                        ) : (
                                          <div className="w-5 h-5 rounded-full border-2 border-outline-variant hover:border-primary transition-colors" />
                                        )}
                                      </div>
                                      <span className={`text-sm font-body leading-relaxed transition-all ${
                                        isChecked
                                          ? 'text-outline line-through'
                                          : 'text-on-surface-variant'
                                      }`}>
                                        {displayContent}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}

                        {/* Resources */}
                        {week.resources && week.resources.length > 0 && (
                          <div>
                            <h5 className="font-label font-semibold text-xs uppercase tracking-wider text-secondary dark:text-slate-400 mb-2.5">
                              Resources
                            </h5>
                            <div className="space-y-1.5">
                              {week.resources.map((resource, rIdx) => (
                                <a
                                  key={rIdx}
                                  href={resource.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 text-sm font-body text-primary dark:text-primary-fixed-dim hover:underline underline-offset-2"
                                >
                                  <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                                  {resource.name}
                                </a>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Success Criteria */}
                        {week.successCriteria && week.successCriteria.length > 0 && (
                          <div className="p-3.5 rounded-lg bg-green-50/60 dark:bg-green-900/10 border border-green-100 dark:border-green-900/20">
                            <div className="flex items-center gap-2 mb-2">
                              <Award className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                              <h5 className="font-label font-semibold text-xs uppercase tracking-wider text-green-700 dark:text-green-400">
                                Success Criteria
                              </h5>
                            </div>
                            <ul className="space-y-1">
                              {week.successCriteria.map((criteria, cIdx) => (
                                <li key={cIdx} className="flex items-start gap-2 text-sm font-body text-on-surface-variant dark:text-slate-300">
                                  <span className="text-green-500 mt-0.5 flex-shrink-0">✓</span>
                                  {criteria}
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

        {/* Footer Action Bar */}
        <div className="border-t border-outline-variant/10 p-4 md:px-8 flex items-center justify-between gap-3">
          {/* Delete */}
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-1.5 text-error hover:text-error/80 text-xs font-label font-semibold uppercase tracking-wider transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete Roadmap
          </button>

          {/* Right actions */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-surface-container-low text-on-surface-variant text-xs font-label font-semibold uppercase tracking-wider rounded-lg hover:bg-surface-container transition-colors"
            >
              Archive
            </button>
            <button
              onClick={onClose}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-container text-white text-xs font-label font-semibold uppercase tracking-wider rounded-lg transition-colors shadow-sm"
            >
              <Play className="w-3.5 h-3.5" />
              Resume Session
            </button>
          </div>
        </div>

        {/* Delete Confirmation */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[60]">
            <div className="bg-card rounded-2xl p-8 max-w-sm mx-4 shadow-xl border border-outline-variant/20">
              <div className="w-12 h-12 rounded-xl bg-error/10 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-error" />
              </div>
              <h3 className="text-xl font-headline font-bold text-on-background text-center mb-2">
                Delete Roadmap?
              </h3>
              <p className="text-sm font-body text-on-surface-variant text-center mb-6 leading-relaxed">
                This action cannot be undone. Are you sure you want to delete this roadmap?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-2.5 bg-surface-container-low text-on-surface-variant text-sm font-label font-semibold uppercase tracking-wider rounded-xl hover:bg-surface-container transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 px-4 py-2.5 bg-error hover:bg-error/90 text-on-error text-sm font-label font-semibold uppercase tracking-wider rounded-xl transition-colors"
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
