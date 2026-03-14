import React from 'react';
import { useUser } from '@clerk/clerk-react';
import { User, Mail, Calendar, MapPin } from 'lucide-react';

interface UserInfoCardProps {
  totalRoadmaps: number;
}

const UserInfoCard: React.FC<UserInfoCardProps> = ({ totalRoadmaps }) => {
  const { user } = useUser();

  if (!user) {
    return null;
  }

  const formatDate = (date: Date | undefined) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
        <div className="relative">
          {user.imageUrl ? (
            <img
              src={user.imageUrl}
              alt={user.fullName || 'User'}
              className="w-24 h-24 rounded-full object-cover border-4 border-indigo-100 dark:border-indigo-900"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
              <User className="w-12 h-12 text-indigo-500" />
            </div>
          )}
          <div className="absolute -bottom-2 -right-2 bg-indigo-500 text-white text-xs font-bold px-2 py-1 rounded-full">
            {totalRoadmaps}
          </div>
        </div>

        <div className="flex-1 text-center sm:text-left">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {user.fullName || 'User'}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 flex items-center justify-center sm:justify-start gap-2 mt-1">
            <Mail className="w-4 h-4" />
            {user.primaryEmailAddress?.emailAddress}
          </p>

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 mt-4">
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
              <Calendar className="w-4 h-4 text-indigo-500" />
              <span>Member since {formatDate(user.createdAt)}</span>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap justify-center sm:justify-start gap-2">
            <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-sm font-medium rounded-full">
              {totalRoadmaps} {totalRoadmaps === 1 ? 'Roadmap' : 'Roadmaps'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserInfoCard;
