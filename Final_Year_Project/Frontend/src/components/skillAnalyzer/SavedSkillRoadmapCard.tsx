import React from 'react';
import { UserSkillRoadmap } from '../../types/api';
import { Calendar, Clock, ChevronRight, MoreVertical, Trash2, Eye } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@radix-ui/react-dropdown-menu';

interface SavedSkillRoadmapCardProps {
  roadmap: UserSkillRoadmap;
  onOpen: (roadmap: UserSkillRoadmap) => void;
  onDelete: (roadmapId: string) => void;
}

export const SavedSkillRoadmapCard: React.FC<SavedSkillRoadmapCardProps> = ({
  roadmap,
  onOpen,
  onDelete,
}) => {
  const analysis = roadmap.analysis;
  const createdDate = new Date(roadmap.startDate).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'paused':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      default:
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
    }
  };

  return (
    <div
      className="group relative rounded-xl border border-outline-variant/20 bg-card p-5 transition-all duration-300 hover:border-primary/30 hover:shadow-lg"
    >
      <div className="mb-3 flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="mb-1 truncate text-lg font-semibold text-on-surface">
            {analysis?.profile?.seniority_level || 'Skill Analysis'}
          </h3>
          <p className="truncate text-sm text-on-surface-variant">
            {analysis?.profile?.target_roles?.join(', ') || 'Career Development'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-medium ${getStatusColor(roadmap.status)}`}
          >
            {roadmap.status}
          </span>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="rounded-lg p-1 opacity-0 transition-opacity hover:bg-surface-container-low group-hover:opacity-100">
                <MoreVertical className="h-5 w-5 text-on-surface-variant" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="min-w-32 rounded-lg border border-outline-variant/20 bg-card p-1 shadow-lg">
              <DropdownMenuItem
                onClick={() => onOpen(roadmap)}
                className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-on-surface-variant outline-none hover:bg-surface-container-low"
              >
                <Eye className="h-4 w-4" />
                View
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(roadmap._id)}
                className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-error outline-none hover:bg-error-container/20"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="mb-1 flex items-center justify-between text-sm">
          <span className="text-on-surface-variant">Progress</span>
          <span className="font-medium text-on-surface">
            {roadmap.overallProgress}%
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-surface-container-low">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-primary-container transition-all duration-500"
            style={{ width: `${roadmap.overallProgress}%` }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="mb-4 flex items-center gap-4 text-sm text-on-surface-variant">
        <div className="flex items-center gap-1">
          <Calendar className="h-4 w-4" />
          <span>{createdDate}</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="h-4 w-4" />
          <span>{roadmap.skillProgress?.length || 0} skills</span>
        </div>
      </div>

      {/* Target Roles */}
      {analysis?.profile?.target_roles && analysis.profile.target_roles.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {analysis.profile.target_roles.slice(0, 3).map((role, index) => (
            <span
              key={index}
              className="rounded-full bg-surface-container-low px-2.5 py-1 text-xs font-medium text-on-surface-variant"
            >
              {role}
            </span>
          ))}
          {analysis.profile.target_roles.length > 3 && (
            <span className="rounded-full bg-surface-container-low px-2.5 py-1 text-xs font-medium text-on-surface-variant">
              +{analysis.profile.target_roles.length - 3}
            </span>
          )}
        </div>
      )}

      {/* View Button */}
      <button
        onClick={() => onOpen(roadmap)}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-outline-variant/20 py-2 text-sm font-medium text-on-surface-variant transition-colors hover:bg-surface-container-low"
      >
        View Details
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
};

export default SavedSkillRoadmapCard;