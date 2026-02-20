import React from 'react';
import { UserRoadmap, RoadmapDetail, WeeklyProgress } from '../../types/api';
import { X, CheckCircle2, Circle, Trash2, Building2, Briefcase } from 'lucide-react';

interface RoadmapDetailModalProps {
  userRoadmap: UserRoadmap | null;
  roadmapDetail: RoadmapDetail | null;
  loading: boolean;
  onClose: () => void;
  onUpdateProgress: (
    userRoadmapId: string,
    weekNumber: number,
    isCompleted: boolean
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
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);

  if (!userRoadmap) return null;

  const getWeekProgress = (weekNumber: number): WeeklyProgress | undefined => {
    return userRoadmap.weeklyProgress?.find((wp) => wp.weekNumber === weekNumber);
  };

  const handleCheckboxClick = async (weekNumber: number, currentStatus: boolean) => {
    if (userRoadmap) {
      await onUpdateProgress(userRoadmap._id, weekNumber, !currentStatus);
    }
  };

  const completedWeeks =
    userRoadmap.weeklyProgress?.filter((wp) => wp.isCompleted).length || 0;
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
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
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
                const isCompleted = weekProgress?.isCompleted || false;

                return (
                  <div
                    key={week.weekNumber}
                    className={`border rounded-lg p-4 transition-colors ${
                      isCompleted
                        ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20'
                        : 'border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() =>
                          handleCheckboxClick(week.weekNumber, isCompleted)
                        }
                        className="mt-0.5 flex-shrink-0"
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="w-6 h-6 text-green-500" />
                        ) : (
                          <Circle className="w-6 h-6 text-slate-400 hover:text-indigo-500 transition-colors" />
                        )}
                      </button>
                      <div className="flex-1">
                        <h4 className="font-semibold text-slate-900 dark:text-slate-100">
                          Week {week.weekNumber}: {week.title}
                        </h4>
                        <div className="mt-2">
                          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            Topics:
                          </p>
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {week.topics?.map((topic, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs rounded"
                              >
                                {topic}
                              </span>
                            ))}
                          </div>
                        </div>
                        {week.skills && week.skills.length > 0 && (
                          <div className="mt-2">
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                              Skills:
                            </p>
                            <div className="flex flex-wrap gap-1.5 mt-1">
                              {week.skills.map((skill, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-xs rounded"
                                >
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
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
                This action cannot be undone. Are you sure you want to delete this
                roadmap?
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
