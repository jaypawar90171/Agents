import React, { useEffect, useRef } from 'react';
import { SignedIn, SignedOut, useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '../hooks/useProfile';
import Header from '../components/Header';
import UserInfoCard from '../components/profile/UserInfoCard';
import RoadmapCard from '../components/profile/RoadmapCard';
import RoadmapDetailModal from '../components/profile/RoadmapDetailModal';
import { Map } from 'lucide-react';

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
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans overflow-x-hidden">
        <Header />

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-grow">
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
            </div>
          )}

          <UserInfoCard totalRoadmaps={userRoadmaps.length} />

          <div className="mt-8">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4">
              My Roadmaps
            </h2>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500" />
              </div>
            ) : userRoadmaps.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center">
                <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Map className="w-8 h-8 text-indigo-500" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  No roadmaps yet
                </h3>
                <p className="text-slate-500 dark:text-slate-400 mb-6">
                  Start your learning journey by generating your first roadmap.
                </p>
                <button
                  onClick={() => navigate('/roadmap')}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
                >
                  Generate Roadmap
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

        <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 mt-auto py-8">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center md:text-left">
              © 2026 LearnLaunch. All rights reserved.
            </p>
            <div className="flex gap-6">
              <a
                href="#"
                className="text-sm text-slate-500 dark:text-slate-400 hover:text-indigo-500 transition-colors"
              >
                Privacy
              </a>
              <a
                href="#"
                className="text-sm text-slate-500 dark:text-slate-400 hover:text-indigo-500 transition-colors"
              >
                Terms
              </a>
            </div>
          </div>
        </footer>

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
