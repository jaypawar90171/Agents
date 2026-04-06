import React, { useEffect, useRef } from 'react';
import { SignedIn, SignedOut, useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '../hooks/useProfile';
import Header from '../components/Header';
import UserInfoCard from '../components/profile/UserInfoCard';
import RoadmapCard from '../components/profile/RoadmapCard';
import RoadmapDetailModal from '../components/profile/RoadmapDetailModal';
import { Map, ArrowRight, Sparkles } from 'lucide-react';

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const hasFetchedRef = useRef(false);
  const {
    userRoadmaps,
    loading,
    error,
    selectedUserRoadmap,
    roadmapDetail,
    roadmapDetailLoading,
    fetchUserRoadmaps,
    openRoadmapDetail,
    updateWeekProgress,
    deleteRoadmap,
    closeRoadmapDetail,
  } = useProfile();

  useEffect(() => {
    if (user?.id && !hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchUserRoadmaps(user.id);
    }
  }, [user?.id, fetchUserRoadmaps]);

  const handleViewDetails = (userRoadmap: any) => {
    openRoadmapDetail(userRoadmap);
  };

  const handleDelete = (userRoadmapId: string) => {
    deleteRoadmap(userRoadmapId);
  };

  return (
    <SignedIn>
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex flex-col font-body overflow-x-hidden">
        <Header />

        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-grow">
          {/* Error Alert */}
          {error && (
            <div className="mb-8 p-4 rounded-xl bg-error/5 border border-error/20">
              <p className="text-sm font-body text-error">{error}</p>
            </div>
          )}

          {/* User Profile Card */}
          <UserInfoCard totalRoadmaps={userRoadmaps.length} />

          {/* Roadmaps Section */}
          <div className="mt-10">
            {/* Section Header */}
            <div className="flex items-baseline justify-between mb-6">
              <h2 className="text-2xl md:text-3xl font-headline font-bold text-on-background dark:text-slate-50 tracking-tight">
                My Roadmaps
              </h2>
              {userRoadmaps.length > 0 && (
                <button
                  onClick={() => navigate('/roadmap')}
                  className="hidden sm:flex items-center gap-1.5 text-sm font-label font-semibold text-primary dark:text-primary-fixed-dim hover:text-primary-container dark:hover:text-primary-fixed transition-colors"
                >
                  Explore New Paths
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Content */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-10 h-10 rounded-full border-2 border-gray-200 border-t-primary animate-spin" />
                <p className="text-sm font-label text-outline dark:text-slate-500 mt-4">
                  Loading your roadmaps…
                </p>
              </div>
            ) : userRoadmaps.length === 0 ? (
              /* Empty State */
              <div className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-12 md:p-16 text-center">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
                  <Map className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-2xl font-headline font-bold text-on-background dark:text-slate-50 mb-3">
                  Begin Your Journey
                </h3>
                <p className="text-base font-body text-secondary dark:text-slate-400 mb-8 max-w-md mx-auto leading-relaxed">
                  Generate your first personalized learning roadmap tailored to your dream company and role.
                </p>
                <button
                  onClick={() => navigate('/roadmap')}
                  className="inline-flex items-center gap-2.5 px-8 py-3.5 bg-primary hover:bg-primary-container text-white font-label font-semibold uppercase tracking-wider text-sm rounded-lg transition-colors shadow-sm"
                >
                  <Sparkles className="w-4 h-4" />
                  Generate Roadmap
                </button>
              </div>
            ) : (
              /* Roadmap Grid */
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {userRoadmaps.map((userRoadmap) => (
                  <RoadmapCard
                    key={userRoadmap._id}
                    userRoadmap={userRoadmap}
                    onViewDetails={handleViewDetails}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </div>
        </main>

        {/* Roadmap Detail Modal */}
        {selectedUserRoadmap && (
          <RoadmapDetailModal
            userRoadmap={selectedUserRoadmap}
            roadmapDetail={roadmapDetail}
            loading={roadmapDetailLoading}
            onClose={closeRoadmapDetail}
            onUpdateProgress={(userRoadmapId, weekNumber, isCompleted, subProgress) => 
              updateWeekProgress(userRoadmapId, weekNumber, isCompleted, subProgress)
            }
            onDelete={deleteRoadmap}
          />
        )}
      </div>
    </SignedIn>
  );
};

export default Profile;
