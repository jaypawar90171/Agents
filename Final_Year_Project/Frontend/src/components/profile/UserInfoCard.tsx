import React from 'react';
import { useUser } from '@clerk/clerk-react';
import { Calendar, Map, BookOpen, Clock, Pencil } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface UserInfoCardProps {
  totalRoadmaps: number;
  totalSkillAnalyses?: number;
}

const UserInfoCard: React.FC<UserInfoCardProps> = ({ totalRoadmaps, totalSkillAnalyses = 0 }) => {
  const { user } = useUser();
  const navigate = useNavigate();

  if (!user) {
    return null;
  }

  const formatMemberSince = (date: Date | null | undefined) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
    });
  };

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
      <div className="p-6 md:p-8">
        {/* Top row: Avatar + Name/Email + Edit button */}
        <div className="flex items-center gap-5">
          {/* Avatar with badge */}
          <div className="relative flex-shrink-0">
            {user.imageUrl ? (
              <img
                src={user.imageUrl}
                alt={user.fullName || 'User'}
                className="w-20 h-20 md:w-24 md:h-24 rounded-full object-cover border-2 border-gray-100 dark:border-slate-700"
              />
            ) : (
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center border-2 border-gray-100 dark:border-slate-700">
                <span className="text-2xl font-headline font-bold text-primary">
                  {user.fullName?.charAt(0) || 'U'}
                </span>
              </div>
            )}
            {/* Blue badge */}
            <div className="absolute -bottom-0.5 -left-0.5 w-7 h-7 rounded-full bg-primary flex items-center justify-center ring-2 ring-white dark:ring-slate-900">
              <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>

          {/* Name + Email */}
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl md:text-3xl font-headline font-bold text-on-background dark:text-slate-50 tracking-tight leading-tight truncate">
              {user.fullName || 'User'}
            </h1>
            <p className="text-sm font-body text-secondary dark:text-slate-400 mt-0.5 truncate">
              {user.primaryEmailAddress?.emailAddress}
            </p>
          </div>

          {/* Edit Profile button */}
          <button
            onClick={() => navigate('/profile/edit')}
            className="hidden sm:flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-container text-white text-sm font-label font-semibold rounded-lg transition-colors shadow-sm"
          >
            <Pencil className="w-3.5 h-3.5" />
            Edit Profile
          </button>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-100 dark:border-slate-800 mt-6 mb-5" />

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          <div>
            <p className="text-[10px] font-label uppercase tracking-widest text-outline dark:text-slate-500 mb-1">
              Member Since
            </p>
            <p className="text-sm md:text-base font-headline font-bold text-on-background dark:text-slate-100">
              {formatMemberSince(user.createdAt)}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-label uppercase tracking-widest text-outline dark:text-slate-500 mb-1">
              Active Roadmaps
            </p>
            <p className="text-sm md:text-base font-headline font-bold text-on-background dark:text-slate-100">
              {totalRoadmaps} {totalRoadmaps === 1 ? 'Path' : 'Paths'}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-label uppercase tracking-widest text-outline dark:text-slate-500 mb-1">
              Skill Analyses
            </p>
            <p className="text-sm md:text-base font-headline font-bold text-on-background dark:text-slate-100">
              {totalSkillAnalyses}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-label uppercase tracking-widest text-outline dark:text-slate-500 mb-1">
              Learning Hours
            </p>
            <p className="text-sm md:text-base font-headline font-bold text-on-background dark:text-slate-100">
              — Hours
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserInfoCard;
