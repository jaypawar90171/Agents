import React from 'react';
import { UserRoadmap } from '../../types/api';
import { Trash2 } from 'lucide-react';

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

  const handleDelete = () => {
    onDelete(userRoadmap._id);
    setShowDeleteConfirm(false);
  };

  const totalWeeks = userRoadmap.roadmap?.weeks?.length || 0;
  const completedWeeks = userRoadmap.weeklyProgress?.filter(wp => wp.isCompleted).length || 0;
  const progress = userRoadmap.overallProgress;

  // Extract skills/topics for tag chips
  const chips: string[] = [];
  if (userRoadmap.roadmap?.weeks) {
    userRoadmap.roadmap.weeks.slice(0, 3).forEach(week => {
      if (week.topic && chips.length < 3) {
        // Shorten topic to first 1-2 words for chip display
        const shortTopic = week.topic.split(/[\s:&,]+/).slice(0, 2).join(' ');
        if (shortTopic.length <= 20) {
          chips.push(shortTopic);
        } else {
          chips.push(shortTopic.substring(0, 18) + '…');
        }
      }
    });
  }

  // Role icon placeholder
  const getInitial = () => {
    const title = userRoadmap.roadmap?.roleTitle || userRoadmap.roadmap?.title || 'R';
    return title.charAt(0).toUpperCase();
  };

  const title = userRoadmap.roadmap?.title || 'Untitled Roadmap';
  const subtitle = [userRoadmap.roadmap?.targetCompany, userRoadmap.roadmap?.roleTitle]
    .filter(Boolean)
    .join(' · ')
    .toUpperCase() || 'N/A';

  return (
    <div className="relative rounded-2xl border border-outline-variant/20 bg-card hover:shadow-md transition-shadow duration-300 overflow-hidden">
      <div className="p-5 md:p-6">
        {/* Header: Icon + Title + Trash */}
        <div className="flex items-start gap-3.5 mb-4">
          {/* Role icon */}
          <div className="w-10 h-10 rounded-lg bg-surface-container-low flex items-center justify-center flex-shrink-0">
            <span className="text-base font-headline font-bold text-on-surface-variant">
              {getInitial()}
            </span>
          </div>

          {/* Title + subtitle */}
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-headline font-bold text-on-background leading-snug line-clamp-1">
              {title}
            </h3>
            <p className="text-[11px] font-label tracking-wider text-outline mt-0.5 truncate">
              {subtitle}
            </p>
          </div>

          {/* Delete icon */}
          <button
            onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(true); }}
            className="p-1.5 text-outline hover:text-error rounded-lg transition-colors flex-shrink-0"
            aria-label="Delete roadmap"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Tag chips */}
        {chips.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-5">
            {chips.map((chip, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 bg-surface-container-low text-on-surface-variant text-[11px] font-label tracking-wide rounded-md uppercase"
              >
                {chip}
              </span>
            ))}
          </div>
        )}

        {/* Progress section */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-label uppercase tracking-widest text-outline font-semibold">
              Progress
            </span>
            <span className="text-sm font-label font-bold text-on-background">
              {progress}%
            </span>
          </div>
          <div className="h-2 bg-surface-container-low rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-700 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Footer: Weeks count + View Details */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-body text-outline">
            {completedWeeks}/{totalWeeks} weeks completed
          </span>
          <button
            onClick={() => onViewDetails(userRoadmap)}
            className="text-xs font-label font-semibold text-primary hover:text-primary-container transition-colors"
          >
            View Details
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-card rounded-2xl p-8 max-w-sm mx-4 shadow-xl border border-outline-variant/20">
            <div className="w-12 h-12 rounded-xl bg-error/10 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-error" />
            </div>
            <h3 className="text-xl font-headline font-bold text-on-background text-center mb-2">
              Delete Roadmap?
            </h3>
            <p className="text-sm font-body text-on-surface-variant text-center mb-6 leading-relaxed">
              This action cannot be undone. All progress associated with this roadmap will be permanently removed.
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
  );
};

export default RoadmapCard;
