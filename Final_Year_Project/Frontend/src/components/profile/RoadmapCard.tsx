import React from 'react';
import { UserRoadmap } from '../../types/api';
import { Building2, Briefcase, Trash2, Eye, Calendar, BookOpen } from 'lucide-react';

interface RoadmapCardProps {
  userRoadmap: UserRoadmap;
  onViewDetails: (userRoadmap: UserRoadmap) => void;
  onDelete: (userRoadmapId: string) => void;
}

const RoadmapCard: React.FC<RoadmapCardProps> = ({
  userRoadmap,
  onViewDetails,
  onDelete,
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);

  const statusColors = {
    'in-progress': 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
    completed: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
    paused: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
  };

  const statusLabels = {
    'in-progress': 'In Progress',
    completed: 'Completed',
    paused: 'Paused',
  };

  const handleDelete = () => {
    onDelete(userRoadmap._id);
    setShowDeleteConfirm(false);
  };

  const totalWeeks = userRoadmap.roadmap?.weeks?.length || 0;
  const completedWeeks = userRoadmap.weeklyProgress?.filter(wp => wp.isCompleted).length || 0;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-5 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 line-clamp-1">
            {userRoadmap.roadmap?.title || 'Untitled Roadmap'}
          </h3>
          <div className="flex items-center gap-3 mt-2 text-sm text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <Building2 className="w-4 h-4" />
              {userRoadmap.roadmap?.targetCompany || 'N/A'}
            </span>
            <span className="flex items-center gap-1">
              <Briefcase className="w-4 h-4" />
              {userRoadmap.roadmap?.roleTitle || 'N/A'}
            </span>
          </div>
        </div>
        <span
          className={`px-2.5 py-1 text-xs font-medium rounded-full ${
            statusColors[userRoadmap.status]
          }`}
        >
          {statusLabels[userRoadmap.status]}
        </span>
      </div>

      {userRoadmap.roadmap?.weeks && userRoadmap.roadmap.weeks.length > 0 && (
        <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="w-4 h-4 text-indigo-500" />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Weekly Topics</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {userRoadmap.roadmap.weeks.slice(0, 4).map((week, idx) => (
              <span 
                key={idx}
                className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-xs rounded"
                title={week.topic}
              >
                W{week.weekNumber}: {week.topic.substring(0, 15)}{week.topic.length > 15 ? '...' : ''}
              </span>
            ))}
            {userRoadmap.roadmap.weeks.length > 4 && (
              <span className="px-2 py-0.5 text-xs text-slate-500">
                +{userRoadmap.roadmap.weeks.length - 4} more
              </span>
            )}
          </div>
        </div>
      )}

      <div className="mb-4">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-slate-600 dark:text-slate-300">Progress</span>
          <span className="font-medium text-indigo-600 dark:text-indigo-400">
            {userRoadmap.overallProgress}%
          </span>
        </div>
        <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-500 rounded-full transition-all duration-500"
            style={{ width: `${userRoadmap.overallProgress}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mt-1">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {totalWeeks} weeks
          </span>
          <span>{completedWeeks}/{totalWeeks} completed</span>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onViewDetails(userRoadmap)}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Eye className="w-4 h-4" />
          View Details
        </button>
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
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
  );
};

export default RoadmapCard;
